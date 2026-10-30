-- Delivery tracking only. Existing subscriptions and notification policies are retained.
CREATE TABLE public.subscription_reminders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 event_key text NOT NULL UNIQUE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 farm_id text NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
 trial_started_at timestamptz NOT NULL,
 trial_expires_at timestamptz,
 event_type text NOT NULL CHECK(event_type IN ('trial_reminder','trial_expired','subscription_activated')),
 milestone integer CHECK(milestone IN (10,7,5,3,1)),
 activation_order_id text,
 plan_name text NOT NULL,
 farmer_name text NOT NULL,
 recipient_email text NOT NULL,
 title text NOT NULL,
 message text NOT NULL,
 notification_id text NOT NULL UNIQUE,
 dashboard_status text NOT NULL DEFAULT 'created' CHECK(dashboard_status='created'),
 email_status text NOT NULL DEFAULT 'pending' CHECK(email_status IN ('pending','processing','retry','accepted','delivered','bounced','failed','cancelled','needs_review')),
 email_payload jsonb,
 provider_message_id text,
 attempts integer NOT NULL DEFAULT 0,
 last_attempt_at timestamptz,
 first_attempt_at timestamptz,
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 lease_token uuid,
 lease_until timestamptz,
 last_error text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscription_reminders_pending ON public.subscription_reminders(next_attempt_at) WHERE email_status IN ('pending','processing','retry');
ALTER TABLE public.subscription_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Administrators monitor reminder delivery" ON public.subscription_reminders FOR SELECT TO authenticated
 USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','super_admin','Super Admin')));
REVOKE ALL ON public.subscription_reminders FROM anon, authenticated;
GRANT SELECT ON public.subscription_reminders TO authenticated;
GRANT ALL ON public.subscription_reminders TO service_role;

-- Inserts the tracking row and the existing dashboard notification in one transaction.
CREATE FUNCTION public.enqueue_subscription_event(p_farm text,p_event text,p_milestone integer DEFAULT NULL,p_order text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE s public.farm_subscriptions; u record; r_id uuid:=gen_random_uuid(); n_id text:=gen_random_uuid()::text;
 k text; t text; m text; plan text;
BEGIN
 SELECT * INTO s FROM public.farm_subscriptions WHERE farm_id=p_farm FOR UPDATE;
 IF NOT FOUND OR s.user_id IS NULL THEN RETURN; END IF;
 SELECT a.email,coalesce(nullif(p.full_name,''),'Farmer') AS name INTO u FROM auth.users a
 LEFT JOIN public.profiles p ON p.id=a.id WHERE a.id=s.user_id;
 IF u.email IS NULL THEN RETURN; END IF;
 SELECT name INTO plan FROM public.subscription_plans WHERE id=s.plan_id;
 k:=s.farm_id||':'||s.user_id||':'||extract(epoch FROM s.created_at)::text||':'||p_event||':'||coalesce(p_milestone::text,p_order,'expired');
 IF p_event='trial_reminder' THEN
  IF s.status<>'trial' OR p_milestone IS NULL OR ceil(extract(epoch FROM (s.trial_ends_at-now()))/86400)::int<>p_milestone THEN RETURN; END IF;
  t:=CASE p_milestone WHEN 10 THEN 'Your Free Trial Ends in 10 Days' WHEN 7 THEN '7 Days Left on Your Free Trial' WHEN 5 THEN 'Your Free Trial Ends in 5 Days' WHEN 3 THEN 'Only 3 Days Left on Your Free Trial' WHEN 1 THEN 'Your Free Trial Expires Tomorrow' END;
  m:=CASE p_milestone
   WHEN 10 THEN 'Your PoultryPro free trial has 10 days remaining. Upgrade to a subscription plan to continue enjoying uninterrupted access to your farm management tools.'
   WHEN 7 THEN 'Your PoultryPro free trial will expire in 7 days. Explore our subscription plans and choose the best option for your poultry farm.'
   WHEN 5 THEN 'You have 5 days remaining on your PoultryPro free trial. Upgrade now to avoid interruptions to your farm management activities.'
   WHEN 3 THEN 'Your PoultryPro free trial is almost over. Subscribe today to continue managing your poultry farm without interruption.'
   WHEN 1 THEN 'Your PoultryPro free trial expires in 1 day. Choose a subscription plan now to maintain uninterrupted access to your farm management dashboard.' END;
 ELSIF p_event='trial_expired' THEN
  IF s.status NOT IN ('trial','expired') OR s.trial_ends_at>now() OR s.trial_ends_at IS NULL
   OR EXISTS(SELECT 1 FROM public.subscription_orders o WHERE o.farm_id=s.farm_id AND o.status IN ('paid','success','successful')) THEN RETURN; END IF;
  t:='Your PoultryPro Free Trial Has Ended';
  m:='Your free trial has ended. Your farm records remain safely stored. Choose a subscription plan to continue managing your poultry farm.';
 ELSIF p_event='subscription_activated' THEN
  IF s.status<>'active' OR NOT EXISTS(SELECT 1 FROM public.subscription_orders o WHERE o.id=p_order AND o.farm_id=s.farm_id AND o.plan_id=s.plan_id AND o.status IN ('paid','success','successful')) THEN RETURN; END IF;
  t:='Your PoultryPro Subscription Is Active'; m:='Your '||coalesce(plan,s.plan_id)||' subscription is now active. Thank you for choosing PoultryPro.';
 ELSE RAISE EXCEPTION 'Invalid subscription event'; END IF;
 IF t IS NULL THEN RAISE EXCEPTION 'Invalid reminder milestone'; END IF;
 INSERT INTO public.subscription_reminders(id,event_key,user_id,farm_id,trial_started_at,trial_expires_at,event_type,milestone,activation_order_id,plan_name,farmer_name,recipient_email,title,message,notification_id)
 VALUES(r_id,k,s.user_id,s.farm_id,s.created_at,s.trial_ends_at,p_event,p_milestone,p_order,coalesce(plan,s.plan_id),u.name,u.email,t,m,n_id)
 ON CONFLICT(event_key) DO NOTHING;
 IF NOT FOUND THEN RETURN; END IF;
 INSERT INTO public.notifications(id,user_id,farm_id,title,message,type,category,time,is_read)
 VALUES(n_id,s.user_id,s.farm_id,t,m,CASE WHEN p_event='subscription_activated' THEN 'success' ELSE 'warning' END,
 CASE WHEN p_event='subscription_activated' THEN 'subscription' ELSE 'free_trial' END,now()::text,false);
END $$;

CREATE FUNCTION public.queue_trial_reminders() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE s record; days integer; before_count bigint;
BEGIN
 -- Serializes overlapping scheduled queue runs; unique event keys remain the final guard.
 PERFORM pg_advisory_xact_lock(730021);
 SELECT count(*) INTO before_count FROM public.subscription_reminders;
 FOR s IN SELECT farm_id,status,trial_ends_at FROM public.farm_subscriptions WHERE status IN ('trial','expired') AND trial_ends_at IS NOT NULL LOOP
  days:=ceil(extract(epoch FROM (s.trial_ends_at-now()))/86400)::int;
  IF s.status='trial' AND days=ANY(ARRAY[10,7,5,3,1]) THEN PERFORM public.enqueue_subscription_event(s.farm_id,'trial_reminder',days);
  ELSIF days<=0 THEN PERFORM public.enqueue_subscription_event(s.farm_id,'trial_expired'); END IF;
 END LOOP;
 RETURN (SELECT count(*)-before_count FROM public.subscription_reminders);
END $$;

-- Paid order confirmation and subscription state must agree. Both update orders are supported.
CREATE FUNCTION public.on_subscription_delivery_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE o record;
BEGIN
 IF TG_TABLE_NAME='subscription_orders' THEN
  IF NEW.status IN ('paid','success','successful') AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
   PERFORM public.enqueue_subscription_event(NEW.farm_id,'subscription_activated',NULL,NEW.id);
  END IF;
 ELSE
  IF NEW.status='active' THEN
   FOR o IN SELECT id FROM public.subscription_orders WHERE farm_id=NEW.farm_id AND plan_id=NEW.plan_id AND status IN ('paid','success','successful') ORDER BY created_at DESC LIMIT 1 LOOP
    PERFORM public.enqueue_subscription_event(NEW.farm_id,'subscription_activated',NULL,o.id);
   END LOOP;
  END IF;
  UPDATE public.subscription_reminders SET email_status='cancelled',last_error='Trial is no longer applicable',updated_at=now()
   WHERE farm_id=NEW.farm_id AND event_type IN ('trial_reminder','trial_expired') AND email_status IN ('pending','retry','processing')
   AND (NEW.status='active' OR (event_type='trial_reminder' AND (NEW.status<>'trial' OR trial_expires_at IS DISTINCT FROM NEW.trial_ends_at)));
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER subscription_reminders_paid_order AFTER INSERT OR UPDATE OF status ON public.subscription_orders FOR EACH ROW EXECUTE FUNCTION public.on_subscription_delivery_event();
CREATE TRIGGER subscription_reminders_subscription AFTER INSERT OR UPDATE OF status,trial_ends_at,renewal_date,plan_id ON public.farm_subscriptions FOR EACH ROW EXECUTE FUNCTION public.on_subscription_delivery_event();

-- Existing order-insert RLS allows farmers to initiate checkout. A browser must
-- never manufacture the paid status that drives a confirmation email.
CREATE FUNCTION public.guard_subscription_payment_confirmation() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF current_user IN ('authenticated','anon') AND NEW.status IN ('paid','success','successful')
 AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
  RAISE EXCEPTION 'Payment confirmation requires the verified backend' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER subscription_reminders_guard_paid BEFORE INSERT OR UPDATE OF status ON public.subscription_orders
 FOR EACH ROW EXECUTE FUNCTION public.guard_subscription_payment_confirmation();
REVOKE ALL ON FUNCTION public.guard_subscription_payment_confirmation() FROM PUBLIC,anon,authenticated;

-- Lease + SKIP LOCKED allow safe parallel workers. Retry only email, never the notification.
CREATE FUNCTION public.claim_subscription_emails(p_limit integer DEFAULT 20) RETURNS SETOF public.subscription_reminders
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 UPDATE public.subscription_reminders r SET email_status='cancelled',last_error='Reminder is no longer applicable',updated_at=now()
 WHERE email_status IN ('pending','retry','processing') AND event_type IN ('trial_reminder','trial_expired') AND NOT EXISTS(
  SELECT 1 FROM public.farm_subscriptions s WHERE s.farm_id=r.farm_id AND s.user_id=r.user_id AND s.created_at=r.trial_started_at
   AND s.trial_ends_at=r.trial_expires_at AND ((r.event_type='trial_reminder' AND s.status='trial' AND s.trial_ends_at>now()
    AND ceil(extract(epoch FROM(s.trial_ends_at-now()))/86400)::int=r.milestone)
    OR (r.event_type='trial_expired' AND s.status IN ('trial','expired') AND s.trial_ends_at<=now())));
 -- Provider idempotency lasts 24 hours. Never blindly retry an ambiguous send beyond that window.
 UPDATE public.subscription_reminders SET email_status='needs_review',last_error='Automatic retry window ended; reconcile with provider before resending',updated_at=now()
 WHERE email_status IN ('retry','processing') AND first_attempt_at<now()-interval '22 hours' AND coalesce(lease_until,now())<=now();
 RETURN QUERY WITH candidates AS (
  SELECT id FROM public.subscription_reminders WHERE (email_status IN ('pending','retry') OR (email_status='processing' AND lease_until<now()))
   AND next_attempt_at<=now() AND attempts<12 ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT greatest(1,least(p_limit,50))
 ) UPDATE public.subscription_reminders r SET email_status='processing',lease_token=gen_random_uuid(),lease_until=now()+interval '5 minutes',
 attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now()),last_attempt_at=now(),updated_at=now()
 FROM candidates c WHERE r.id=c.id RETURNING r.*;
END $$;

-- Minimal provider receipts, without email contents or addresses. An early webhook is
-- retained until the worker records the provider id; replayed webhooks are harmless.
CREATE TABLE public.subscription_email_events (
 event_id text PRIMARY KEY,
 provider_message_id text NOT NULL,
 status text NOT NULL CHECK(status IN ('delivered','bounced','failed')),
 occurred_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscription_email_events_provider ON public.subscription_email_events(provider_message_id,occurred_at DESC);
ALTER TABLE public.subscription_email_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscription_email_events FROM anon,authenticated;
GRANT ALL ON public.subscription_email_events TO service_role;
CREATE FUNCTION public.record_subscription_email_event(p_event_id text,p_provider text,p_status text,p_occurred_at timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 INSERT INTO public.subscription_email_events(event_id,provider_message_id,status,occurred_at)
 VALUES(p_event_id,p_provider,p_status,p_occurred_at) ON CONFLICT(event_id) DO NOTHING;
 UPDATE public.subscription_reminders r SET email_status=e.status,last_error=CASE WHEN e.status IN ('bounced','failed') THEN 'Provider reported '||e.status ELSE NULL END,updated_at=now()
 FROM (SELECT status FROM public.subscription_email_events WHERE provider_message_id=p_provider ORDER BY occurred_at DESC,status DESC LIMIT 1) e
 WHERE r.provider_message_id=p_provider AND r.email_status IN ('accepted','delivered','bounced','failed','cancelled');
END $$;

CREATE FUNCTION public.finish_subscription_email(p_id uuid,p_lease uuid,p_status text,p_provider text DEFAULT NULL,p_error text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF p_status NOT IN ('accepted','retry','failed','needs_review') THEN RAISE EXCEPTION 'Invalid email outcome'; END IF;
 UPDATE public.subscription_reminders SET email_status=CASE WHEN p_status='retry' AND attempts>=12 THEN 'failed' ELSE p_status END,
 provider_message_id=coalesce(p_provider,provider_message_id),last_error=left(p_error,500),lease_until=NULL,
 next_attempt_at=now()+make_interval(mins=>least(240,power(2,least(attempts,7))::int)),updated_at=now()
 WHERE id=p_id AND lease_token=p_lease AND (email_status='processing' OR (email_status='cancelled' AND p_status='accepted'));
 IF NOT FOUND THEN RETURN false; END IF;
 IF p_provider IS NOT NULL THEN
  UPDATE public.subscription_reminders r SET email_status=e.status,last_error=CASE WHEN e.status IN ('bounced','failed') THEN 'Provider reported '||e.status ELSE NULL END
  FROM(SELECT status FROM public.subscription_email_events WHERE provider_message_id=p_provider ORDER BY occurred_at DESC,status DESC LIMIT 1)e WHERE r.id=p_id;
 END IF;
 RETURN true;
END $$;

REVOKE ALL ON FUNCTION public.enqueue_subscription_event(text,text,integer,text),public.queue_trial_reminders(),public.on_subscription_delivery_event(),public.claim_subscription_emails(integer),public.finish_subscription_email(uuid,uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.queue_trial_reminders(),public.claim_subscription_emails(integer),public.finish_subscription_email(uuid,uuid,text,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.record_subscription_email_event(text,text,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_subscription_email_event(text,text,text,timestamptz) TO service_role;
