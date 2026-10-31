import{PGlite}from'../.ui-checks/sql-engine/node_modules/@electric-sql/pglite/dist/index.js';import{readFile}from'node:fs/promises';import assert from'node:assert/strict';
const pg=new PGlite();
try{
 await pg.exec(`CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;GRANT USAGE ON SCHEMA auth TO authenticated;GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text);ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;GRANT USAGE ON SCHEMA storage TO authenticated;GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql AS $$SELECT string_to_array(name,'/')$$;`);
 const sql=await readFile('supabase/optional/setup_profile_images.sql','utf8');await pg.exec(sql);await pg.exec(sql);
 const query=async(sql,params=[])=>(await pg.query(sql,params)).rows;
 assert.equal((await query('SELECT * FROM storage.buckets')).length,1);assert.equal((await query('SELECT * FROM storage.buckets'))[0].public,false);assert.equal(Number((await query('SELECT file_size_limit FROM storage.buckets'))[0].file_size_limit),2097152);
 const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
 await pg.exec(`SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','${a}',false);`);
 await query('INSERT INTO storage.objects(bucket_id,name) VALUES($1,$2)',['avatars',a+'/one.png']);
 await assert.rejects(query('INSERT INTO storage.objects(bucket_id,name) VALUES($1,$2)',['avatars',b+'/spoof.png']),/row-level security/);
 await assert.rejects(query('UPDATE storage.objects SET name=$1',[b+'/renamed.png']),/row-level security/);
 await pg.exec(`RESET ROLE;SELECT set_config('request.jwt.claim.sub','${b}',false);SET ROLE authenticated;`);
 assert.equal((await query('SELECT * FROM storage.objects')).length,0,'Another farmer cannot read the image');assert.equal((await query('DELETE FROM storage.objects RETURNING id')).length,0,'Another farmer cannot delete the image');
 await pg.exec('RESET ROLE');await query("UPDATE storage.buckets SET public=true WHERE id='avatars'");await assert.rejects(pg.exec(sql),/is public/);await pg.exec('ROLLBACK');assert.equal((await query('SELECT * FROM storage.buckets')).length,1,'Public bucket is not duplicated');
 console.log('PASS actual Storage setup SQL: private bucket creation/reuse, idempotency, 2 MB configuration, own-folder upload/read/update/delete isolation, and refusal to alter public-bucket privacy. Isolated PostgreSQL only.');
}catch(error){console.error('FAIL avatar Storage SQL:',error.message);process.exitCode=1;}finally{await pg.close();}
