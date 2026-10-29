-- Run against a staging database after the migration. All test writes roll back.
BEGIN;
DO $$
DECLARE payload jsonb; enquiry uuid; alert text; n integer;
BEGIN
 payload = jsonb_build_object('full_name','Integration Test','email','contact-test@example.invalid','phone','','subject','Technical Support','message','Contact integration test message.','request_id',gen_random_uuid());
 PERFORM public.save_contact_enquiry(payload, 'integration-test-ip');
 SELECT id INTO STRICT enquiry FROM public.contact_messages WHERE request_id=(payload->>'request_id')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.contact_messages WHERE id=enquiry AND is_read=false AND status='new') THEN RAISE EXCEPTION 'Incorrect defaults'; END IF;
 SELECT id INTO STRICT alert FROM public.notifications WHERE related_entity_type='contact_message' AND related_entity_id=enquiry::text;
 PERFORM public.save_contact_enquiry(payload, 'integration-test-ip');
 SELECT count(*) INTO n FROM public.notifications WHERE related_entity_type='contact_message' AND related_entity_id=enquiry::text;
 IF n<>1 THEN RAISE EXCEPTION 'Duplicate notification'; END IF;
 BEGIN
   PERFORM public.save_contact_enquiry(jsonb_set(payload,'message',to_jsonb('A different message with the same request ID.'::text)), 'integration-test-ip');
   RAISE EXCEPTION 'Changed retry content accepted';
 EXCEPTION WHEN raise_exception THEN
   IF SQLERRM <> 'Contact request already used' THEN RAISE; END IF;
 END;
 UPDATE public.contact_messages SET status='resolved' WHERE id=enquiry;
 IF NOT EXISTS(SELECT 1 FROM public.contact_messages WHERE id=enquiry AND is_read=false) THEN RAISE EXCEPTION 'Resolution changed read status'; END IF;
 UPDATE public.notifications SET is_read=true WHERE id=alert;
 IF NOT EXISTS(SELECT 1 FROM public.contact_messages WHERE id=enquiry AND is_read=false AND status='resolved') THEN RAISE EXCEPTION 'Notification changed enquiry'; END IF;
 UPDATE public.contact_messages SET is_read=true WHERE id=enquiry;
 IF NOT EXISTS(SELECT 1 FROM public.contact_messages WHERE id=enquiry AND is_read=true AND status='resolved') THEN RAISE EXCEPTION 'Read changed resolution'; END IF;
 FOR n IN 1..4 LOOP
   payload = jsonb_set(payload,'request_id',to_jsonb(gen_random_uuid()::text));
   PERFORM public.save_contact_enquiry(payload,'integration-test-ip');
 END LOOP;
 payload = jsonb_set(payload,'request_id',to_jsonb(gen_random_uuid()::text));
 BEGIN
   PERFORM public.save_contact_enquiry(payload,'integration-test-ip');
   RAISE EXCEPTION 'Rate limit failed';
 EXCEPTION WHEN raise_exception THEN
   IF SQLERRM <> 'Contact rate limit exceeded' THEN RAISE; END IF;
 END;
END $$;
-- All six combinations must yield three unread messages, including resolved ones.
DO $$
DECLARE fixture_ids uuid[]; resolution text; read_state boolean; fixture_id uuid; n integer;
BEGIN
 fixture_ids := ARRAY[]::uuid[];
 FOREACH resolution IN ARRAY ARRAY['new','in_progress','resolved'] LOOP
   FOREACH read_state IN ARRAY ARRAY[false,true] LOOP
     INSERT INTO public.contact_messages(full_name,email,subject,message,status,is_read,request_id)
     VALUES('Status Test','status-test@example.invalid','General Enquiry','Status independence fixture.',resolution,read_state,gen_random_uuid())
     RETURNING id INTO fixture_id;
     fixture_ids := array_append(fixture_ids, fixture_id);
   END LOOP;
 END LOOP;
 SELECT count(*) INTO n FROM public.contact_messages WHERE id=ANY(fixture_ids) AND is_read=false;
 IF n<>3 THEN RAISE EXCEPTION 'Unread count must be three across all resolution statuses'; END IF;
 UPDATE public.contact_messages SET status='resolved' WHERE id=ANY(fixture_ids);
 SELECT count(*) INTO n FROM public.contact_messages WHERE id=ANY(fixture_ids) AND is_read=false;
 IF n<>3 THEN RAISE EXCEPTION 'Resolution changed unread count'; END IF;
 UPDATE public.contact_messages SET is_read=true WHERE id=fixture_ids[1];
 SELECT count(*) INTO n FROM public.contact_messages WHERE id=ANY(fixture_ids) AND is_read=false;
 IF n<>2 THEN RAISE EXCEPTION 'Read did not decrease unread count'; END IF;
 UPDATE public.contact_messages SET is_read=false WHERE id=fixture_ids[1];
 SELECT count(*) INTO n FROM public.contact_messages WHERE id=ANY(fixture_ids) AND is_read=false;
 IF n<>3 THEN RAISE EXCEPTION 'Unread did not increase unread count'; END IF;
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM 1 FROM public.contact_messages; RAISE EXCEPTION 'Anonymous read allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.save_contact_enquiry('{}','forged'); RAISE EXCEPTION 'Anonymous RPC allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
-- With no JWT subject, RLS must expose no enquiries.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.contact_messages) THEN RAISE EXCEPTION 'Non-admin read allowed'; END IF;
 UPDATE public.contact_messages SET is_read=true;
 IF FOUND THEN RAISE EXCEPTION 'Non-admin updated an enquiry'; END IF;
 BEGIN
   UPDATE public.contact_messages SET email='forged@example.invalid';
   RAISE EXCEPTION 'Protected column update allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
