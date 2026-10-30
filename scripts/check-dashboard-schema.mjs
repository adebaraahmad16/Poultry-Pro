// Read-only metadata checks. No profile, farmer, payment, or enquiry records are read.
import { readFile } from 'node:fs/promises';
const env={...process.env};
for(const line of (await readFile('.env','utf8')).split(/\r?\n/)){
  const match=line.match(/^([A-Z_]+)=(.*)$/);if(match&&!env[match[1]])env[match[1]]=match[2].trim().replace(/^['"]|['"]$/g,'');
}
const url=env.VITE_SUPABASE_URL;
const key=env.VITE_SUPABASE_PUBLISHABLE_KEY||env.VITE_SUPABASE_ANON_KEY;
if(!url||!key)throw Error('Configure the existing Supabase public URL and key before checking metadata.');
const headers={apikey:key,Accept:'application/openapi+json'};
try{
  const response=await fetch(url+'/rest/v1/',{headers,signal:AbortSignal.timeout(10000)});
  const schema=await response.json();
  for(const [table,definition]of Object.entries(schema.definitions||{}))if(/profile|setting|preference|inventory|vaccination|medication|subscription|contact/.test(table))console.log(table, Object.keys(definition.properties||{}).join(', '));
}catch(error){console.log('OpenAPI metadata unavailable:',error.message);}
for(const [table,columns]of [['app_settings','id,owner_id,value,updated_at'],['profiles','id,full_name,avatar_url,account_status'],['inventory','id,notes,last_movement'],['vaccinations','disease_prevented,birds_vaccinated,cost,dose'],['medications','status,duration_days'],['contact_messages','id,is_read,status']]){
  const response=await fetch(url+'/rest/v1/'+table+'?select='+encodeURIComponent(columns)+'&limit=0',{headers:{apikey:key},signal:AbortSignal.timeout(10000)});
  const body=await response.json();
  console.log(JSON.stringify({table,status:response.status,code:body.code||null,message:body.message||'Metadata query returned no records (limit=0)'}));
}
