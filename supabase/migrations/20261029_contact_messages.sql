BEGIN;
CREATE TABLE IF NOT EXISTS public.contact_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 full_name text NOT NULL CHECK (length(full_name) BETWEEN 2 AND 120),
 email text NOT NULL CHECK (length(email) <= 254),
 phone text CHECK (length(phone) <= 40),
 subject text NOT NULL CHECK (subject IN ('General Enquiry','Technical Support','Account Registration','Subscription and Payment','Report a Problem','Feature Suggestion','Partnership or Business Enquiry','Other')),
 message text NOT NULL CHECK (length(message) BETWEEN 10 AND 10000),
 status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','resolved')),
 is_read boolean NOT NULL DEFAULT false,
 request_id uuid NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_messages_created ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_unread ON public.contact_messages(is_read);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_messages FROM anon, authenticated;
GRANT SELECT ON public.contact_messages TO authenticated;
GRANT UPDATE (is_read, status) ON public.contact_messages TO authenticated;
CREATE POLICY contact_admin_select ON public.contact_messages FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY contact_admin_update ON public.contact_messages FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TABLE IF NOT EXISTS public.contact_rate_limits (
 bucket text PRIMARY KEY, hits integer NOT NULL DEFAULT 1, expires_at timestamptz NOT NULL
);
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.save_contact_enquiry(payload jsonb, ip_hash text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE enquiry public.contact_messages; key text; hits integer;
BEGIN
 IF jsonb_typeof(payload) IS DISTINCT FROM 'object'
    OR NOT (payload ?& ARRAY['full_name','email','phone','subject','message','request_id'])
    OR EXISTS (SELECT 1 FROM jsonb_each(payload) p WHERE p.key = ANY(ARRAY['full_name','email','phone','subject','message','request_id']) AND jsonb_typeof(p.value) <> 'string')
    OR coalesce(payload->>'website','') <> ''
    OR length(trim(payload->>'full_name')) NOT BETWEEN 2 AND 120
    OR length(payload->>'email') > 254
    OR trim(payload->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR length(payload->>'phone') > 40
    OR length(trim(payload->>'message')) NOT BETWEEN 10 AND 10000
    OR coalesce(ip_hash,'') = '' THEN
   RAISE EXCEPTION 'Invalid contact enquiry';
 END IF;
 -- Serialize idempotent retries, including concurrent requests.
 PERFORM pg_advisory_xact_lock(hashtextextended(payload->>'request_id', 0));
 SELECT * INTO enquiry FROM contact_messages WHERE request_id = (payload->>'request_id')::uuid;
 IF FOUND THEN
   IF enquiry.full_name IS DISTINCT FROM trim(payload->>'full_name')
      OR enquiry.email IS DISTINCT FROM lower(trim(payload->>'email'))
      OR enquiry.phone IS DISTINCT FROM nullif(trim(payload->>'phone'),'')
      OR enquiry.subject IS DISTINCT FROM payload->>'subject'
      OR enquiry.message IS DISTINCT FROM trim(payload->>'message') THEN
     RAISE EXCEPTION 'Contact request already used';
   END IF;
   RETURN;
 END IF;
 DELETE FROM contact_rate_limits WHERE expires_at < now();
 FOREACH key IN ARRAY ARRAY['ip:' || ip_hash, 'email:' || lower(trim(payload->>'email'))] LOOP
   INSERT INTO contact_rate_limits(bucket, expires_at) VALUES(key, now() + interval '1 hour')
   ON CONFLICT(bucket) DO UPDATE SET
     hits = CASE WHEN contact_rate_limits.expires_at < now() THEN 1 ELSE contact_rate_limits.hits + 1 END,
     expires_at = CASE WHEN contact_rate_limits.expires_at < now() THEN now() + interval '1 hour' ELSE contact_rate_limits.expires_at END
   RETURNING contact_rate_limits.hits INTO hits;
   IF hits > 5 THEN RAISE EXCEPTION 'Contact rate limit exceeded'; END IF;
 END LOOP;
 INSERT INTO contact_messages(full_name,email,phone,subject,message,request_id)
 VALUES(trim(payload->>'full_name'),lower(trim(payload->>'email')),nullif(trim(payload->>'phone'),''),payload->>'subject',trim(payload->>'message'),(payload->>'request_id')::uuid)
 RETURNING * INTO enquiry;
 -- One shared admin alert per enquiry; existing notification RLS restricts null-user alerts to admins.
 INSERT INTO notifications(title,message,category,action_url,related_entity_type,related_entity_id)
 VALUES('New Contact Enquiry','A new ' || lower(enquiry.subject) || ' enquiry has been received.','contact','/admin/contact-messages?message=' || enquiry.id,'contact_message',enquiry.id::text);
END;
$$;
REVOKE ALL ON FUNCTION public.save_contact_enquiry(jsonb,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_contact_enquiry(jsonb,text) TO service_role;
CREATE OR REPLACE FUNCTION public.contact_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER contact_updated_at BEFORE UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.contact_updated_at();
COMMIT;
