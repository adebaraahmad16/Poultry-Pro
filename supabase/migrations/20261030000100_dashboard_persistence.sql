-- Review/apply separately after the existing schema migrations. No records are deleted.
BEGIN;
CREATE TABLE IF NOT EXISTS public.app_settings (
  id text PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_settings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
CREATE POLICY app_settings_access ON public.app_settings FOR ALL TO authenticated
  USING ((owner_id = auth.uid() AND id LIKE 'user:' || auth.uid()::text || ':%') OR (owner_id IS NULL AND public.is_admin()))
  WITH CHECK ((owner_id = auth.uid() AND id LIKE 'user:' || auth.uid()::text || ':%') OR (owner_id IS NULL AND public.is_admin()));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'Active' CHECK (account_status IN ('Active','Suspended'));
-- Preserve existing profile RLS while preventing self-assigned admin roles/statuses.
CREATE OR REPLACE FUNCTION public.guard_profile_privileges() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.role <> 'farmer' OR NEW.account_status <> 'Active' THEN RAISE EXCEPTION 'Administrator authorization required'; END IF;
    ELSIF NEW.role IS DISTINCT FROM OLD.role OR NEW.account_status IS DISTINCT FROM OLD.account_status THEN
      RAISE EXCEPTION 'Administrator authorization required';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_profile_privileges BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileges();

ALTER TABLE public.vaccinations ADD COLUMN IF NOT EXISTS disease_prevented text DEFAULT '';
ALTER TABLE public.vaccinations ADD COLUMN IF NOT EXISTS birds_vaccinated integer DEFAULT 0;
ALTER TABLE public.vaccinations ADD COLUMN IF NOT EXISTS cost numeric DEFAULT 0;
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS status text DEFAULT 'Ongoing';

ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS last_movement jsonb;
CREATE OR REPLACE FUNCTION public.apply_inventory_movement(p_item_id text, p_farm_id text, p_quantity numeric, p_type text, p_notes text DEFAULT '', p_date date DEFAULT CURRENT_DATE)
RETURNS SETOF public.inventory LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE item public.inventory; next_quantity numeric;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity::text IN ('NaN','Infinity','-Infinity') OR p_type IS NULL OR p_type NOT IN ('addition','usage') THEN RAISE EXCEPTION 'Invalid stock movement'; END IF;
  SELECT * INTO STRICT item FROM public.inventory WHERE id=p_item_id AND farm_id=p_farm_id FOR UPDATE;
  next_quantity := CASE WHEN p_type='addition' THEN item.quantity+p_quantity ELSE item.quantity-p_quantity END;
  IF next_quantity < 0 THEN RAISE EXCEPTION 'Stock usage exceeds the available quantity'; END IF;
  RETURN QUERY UPDATE public.inventory SET quantity=next_quantity,
    status=CASE WHEN next_quantity=0 THEN 'Out of Stock' WHEN next_quantity<=min_stock THEN 'Low Stock' ELSE 'In Stock' END,
    last_movement=jsonb_build_object('type',p_type,'quantity',p_quantity,'notes',p_notes,'date',p_date)
    WHERE id=p_item_id AND farm_id=p_farm_id RETURNING *;
END $$;
REVOKE ALL ON FUNCTION public.apply_inventory_movement(text,text,numeric,text,text,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_inventory_movement(text,text,numeric,text,text,date) TO authenticated;

CREATE OR REPLACE FUNCTION public.apply_mortality_record(p_action text, p_id text, p_farm_id text, p_payload jsonb DEFAULT '{}')
RETURNS SETOF public.mortality_records LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE previous public.mortality_records; saved public.mortality_records; target_flock text; deaths integer; available integer;
BEGIN
  IF p_action IS NULL OR p_action NOT IN ('create','update','delete') THEN RAISE EXCEPTION 'Invalid mortality action'; END IF;
  IF p_action <> 'create' THEN SELECT * INTO STRICT previous FROM public.mortality_records WHERE id=p_id AND farm_id=p_farm_id FOR UPDATE; END IF;
  target_flock := CASE WHEN p_action='delete' THEN NULL ELSE coalesce(p_payload->>'flockId',previous.flock_id) END;
  deaths := CASE WHEN p_action='delete' THEN 0 ELSE coalesce((p_payload->>'count')::integer,previous.count,0) END;
  IF p_action <> 'delete' AND (deaths<=0 OR target_flock IS NULL) THEN RAISE EXCEPTION 'Select a flock and enter a mortality count greater than zero'; END IF;
  -- Stable lock order handles edits moving a record between flocks.
  PERFORM 1 FROM public.flocks WHERE farm_id=p_farm_id AND id IN (previous.flock_id,target_flock) ORDER BY id FOR UPDATE;
  IF previous.flock_id IS NOT NULL THEN
    UPDATE public.flocks SET current_birds=current_birds+previous.count WHERE id=previous.flock_id AND farm_id=p_farm_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Original flock is inaccessible'; END IF;
  END IF;
  IF target_flock IS NOT NULL THEN
    SELECT current_birds INTO STRICT available FROM public.flocks WHERE id=target_flock AND farm_id=p_farm_id;
    IF deaths>available THEN RAISE EXCEPTION 'Mortality count exceeds the current flock population'; END IF;
    UPDATE public.flocks SET current_birds=current_birds-deaths WHERE id=target_flock AND farm_id=p_farm_id;
  END IF;
  IF p_action='delete' THEN
    DELETE FROM public.mortality_records WHERE id=p_id AND farm_id=p_farm_id RETURNING * INTO STRICT saved;
  ELSIF p_action='create' THEN
    INSERT INTO public.mortality_records(id,farm_id,flock_id,date,count,cause,notes)
    VALUES(p_id,p_farm_id,target_flock,coalesce((p_payload->>'date')::date,CURRENT_DATE),deaths,p_payload->>'cause',p_payload->>'notes') RETURNING * INTO saved;
  ELSE
    UPDATE public.mortality_records SET flock_id=target_flock,date=coalesce((p_payload->>'date')::date,previous.date),count=deaths,
      cause=CASE WHEN p_payload ? 'cause' THEN p_payload->>'cause' ELSE previous.cause END,
      notes=CASE WHEN p_payload ? 'notes' THEN p_payload->>'notes' ELSE previous.notes END
      WHERE id=p_id AND farm_id=p_farm_id RETURNING * INTO STRICT saved;
  END IF;
  RETURN NEXT saved;
END $$;
REVOKE ALL ON FUNCTION public.apply_mortality_record(text,text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_mortality_record(text,text,text,jsonb) TO authenticated;
-- Privileged settlement entry point: ONLY the authenticated server function can call it.
-- Pricing, cycle length, and agreement handling mirror the existing backend verifier.
CREATE OR REPLACE FUNCTION public.confirm_verified_subscription_payment(p_reference text, p_amount numeric, p_currency text, p_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE invoice public.subscription_orders; quote public.subscription_plans; owner_email text; renewal timestamptz;
flock_count integer; bird_count numeric; type_count integer; worker_count integer; farm_count integer;
BEGIN
  SELECT * INTO STRICT invoice FROM public.subscription_orders WHERE reference=p_reference FOR UPDATE;
  SELECT u.email INTO STRICT owner_email FROM public.farms f JOIN auth.users u ON u.id=f.owner_id WHERE f.id=invoice.farm_id;
  IF p_currency IS DISTINCT FROM 'NGN' OR p_amount IS DISTINCT FROM round(invoice.amount*100) OR invoice.amount<=0 OR lower(p_email) IS DISTINCT FROM lower(owner_email) THEN
    RAISE EXCEPTION 'Payment does not match the original order';
  END IF;
  IF invoice.status IN ('paid','success','successful') THEN RETURN to_jsonb(invoice); END IF;
  IF invoice.billing_cycle NOT IN ('monthly','annual') THEN RAISE EXCEPTION 'Invalid billing cycle'; END IF;
  SELECT * INTO STRICT quote FROM public.subscription_plans WHERE id=invoice.plan_id;
  SELECT count(*),coalesce(sum(current_birds),0),count(DISTINCT type) INTO flock_count,bird_count,type_count
    FROM public.flocks WHERE farm_id=invoice.farm_id AND status NOT IN ('Archived','Sold');
  SELECT count(*) INTO worker_count FROM public.workers WHERE farm_id=invoice.farm_id AND status='Active';
  SELECT count(*) INTO farm_count FROM public.farms WHERE owner_id=(SELECT owner_id FROM public.farms WHERE id=invoice.farm_id);
  IF (quote.max_flocks IS NOT NULL AND flock_count>quote.max_flocks) OR (quote.max_birds IS NOT NULL AND bird_count>quote.max_birds)
    OR (quote.max_poultry_types IS NOT NULL AND type_count>quote.max_poultry_types) OR (quote.max_users IS NOT NULL AND worker_count>quote.max_users)
    OR (quote.max_farms IS NOT NULL AND farm_count>quote.max_farms) THEN RAISE EXCEPTION 'Farm usage exceeds the purchased plan limits'; END IF;
  renewal := now()+CASE WHEN invoice.billing_cycle='annual' THEN interval '12 months' ELSE interval '1 month' END;
  UPDATE public.farm_subscriptions SET plan_id=invoice.plan_id,status='active',billing_cycle=invoice.billing_cycle,
    agreed_price=invoice.amount,renewal_date=renewal,current_period_end=renewal,updated_at=now() WHERE farm_id=invoice.farm_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'The farm subscription could not be found'; END IF;
  UPDATE public.subscription_orders SET status='paid' WHERE reference=p_reference RETURNING * INTO invoice;
  RETURN to_jsonb(invoice);
END $$;
REVOKE ALL ON FUNCTION public.confirm_verified_subscription_payment(text,numeric,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_verified_subscription_payment(text,numeric,text,text) TO service_role;
COMMIT;
