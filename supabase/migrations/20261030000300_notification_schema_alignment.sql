-- Align contact alert creation with the verified existing notification columns.
-- No tables, columns, records, credentials, privileges, or RLS policies are changed.
BEGIN;
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
 INSERT INTO notifications(id,title,message,category,type,time,is_read)
 VALUES('contact:' || enquiry.id::text,'New Contact Enquiry','A new ' || lower(enquiry.subject) || ' enquiry has been received.','contact','info',now()::text,false);
END;
$$;
COMMIT;
