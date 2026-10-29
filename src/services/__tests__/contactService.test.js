import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validContact, readContactBody } from '../../../supabase/functions/_shared/contactValidation.js';

const valid = { full_name: 'Test Farmer', email: 'farmer@example.test', phone: '', subject: 'Technical Support', message: 'Please help with my farm account.', request_id: '12cfb2ce-9c5f-4fa7-a13d-dc82264e967a', website: '' };
assert.equal(validContact(valid), true);
assert.deepEqual(await readContactBody(new Request('https://example.test', { method: 'POST', body: JSON.stringify(valid) })), valid);
await assert.rejects(readContactBody(new Request('https://example.test', { method: 'POST', body: '{' })), SyntaxError);
await assert.rejects(readContactBody(new Request('https://example.test', { method: 'POST', body: 'x'.repeat(65537) })), RangeError);
await assert.rejects(readContactBody(new Request('https://example.test', { method: 'POST', body: '{}', headers: {'content-length':'65537'} })), RangeError);
// Multi-byte messages within the documented character limit remain supported.
const unicode = { ...valid, message: '🐔'.repeat(5000) };
assert.equal(validContact(unicode), true);
assert.deepEqual(await readContactBody(new Request('https://example.test', { method: 'POST', body: JSON.stringify(unicode) })), unicode);
for (const patch of [null, { email: 'invalid' }, { full_name: ' ' }, { subject: 'Forged subject' }, { message: 'short' }, { message: 'x'.repeat(10001) }, { website: 'spam' }, { request_id: 'invalid' }, { phone: 123 }, { email: null }]) {
  assert.equal(validContact(patch === null ? null : { ...valid, ...patch }), false);
}
let records = ['new','in_progress','resolved'].flatMap((status,i) => [false,true].map((is_read,j) => ({id:`${i}-${j}`,status,is_read})));
let failed = false;
const mutations = [];
globalThis.__contactDB = {
  from(table) {
    assert.equal(table, 'contact_messages');
    let filter, patch, id;
    const query = {
      select(_columns, options) { if (options) assert.equal(options.head, true); return query; },
      eq(key,value) { if (key === 'id') id = value; else filter = [key,value]; return query; },
      update(value) { patch = value; mutations.push(value); return query; },
      single() {
        if (failed) return Promise.resolve({error: new Error('Database unavailable')});
        records = records.map(r => r.id === id ? { ...r,...patch } : r);
        return Promise.resolve({data:records.find(r=>r.id===id)});
      },
      then(resolve,reject) { return Promise.resolve(failed ? {error:new Error('Database unavailable')} : {count:records.filter(r=>!filter || r[filter[0]]===filter[1]).length}).then(resolve,reject); },
    };
    return query;
  },
};
let events = 0;
globalThis.window = {dispatchEvent: () => events++};
const source = (await readFile(new URL('../contactService.js',import.meta.url),'utf8')).replace("import { supabase } from '../lib/supabaseClient';", 'const supabase = globalThis.__contactDB;');
const {getContactStats,updateContact,submitContact} = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
globalThis.__contactDB.functions = { invoke: async (name, options) => {
  assert.equal(name, 'submit-contact');
  assert.deepEqual(options.body, valid);
  return { data: {success:true} };
} };
await submitContact(valid);
globalThis.__contactDB.functions.invoke = async () => ({error:{context:new Response(JSON.stringify({error:'Too many enquiries.'}))}});
await assert.rejects(submitContact(valid), /Too many enquiries/);
globalThis.__contactDB.functions.invoke = async () => ({error:new Error('Network failure')});
await assert.rejects(submitContact(valid), /Unable to send/);
for (const patch of [{}, {is_read:'false'}, {status:'invalid'}, {email:'changed@example.test'}]) {
  await assert.rejects(updateContact('0-0', patch), /Invalid contact message update/);
}
assert.deepEqual(await getContactStats(), {total:6,unread:3,inProgress:2,resolved:2});
await updateContact('0-0',{status:'resolved'});
assert.equal((await getContactStats()).unread,3,'Resolving unread message must preserve unread count');
assert.equal(records.find(r=>r.id==='0-0').is_read,false);
await updateContact('2-0',{is_read:true});
assert.equal((await getContactStats()).unread,2);
assert.equal(records.find(r=>r.id==='2-0').status,'resolved','Reading must preserve resolution');
await updateContact('2-0',{is_read:false});
assert.equal((await getContactStats()).unread,3);
assert.deepEqual(mutations,[{status:'resolved'},{is_read:true},{is_read:false}]);
assert.equal(events,3);
failed=true;
await assert.rejects(updateContact('0-0',{is_read:true}));
assert.equal(events,3,'Failed mutations must not announce success');
await assert.rejects(getContactStats());
const rewrites = JSON.parse(await readFile(new URL('../../../vercel.json',import.meta.url))).rewrites;
assert.ok(new RegExp(`^${rewrites[0].source}$`).test('/contact'));
assert.ok(new RegExp(`^${rewrites[0].source}$`).test('/admin/contact-messages'));
console.log('PASS contact validation, six read/resolution combinations, independent updates, database errors, SPA refresh routing');
delete globalThis.__contactDB;
