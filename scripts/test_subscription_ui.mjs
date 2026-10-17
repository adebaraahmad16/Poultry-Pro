import { build } from 'esbuild';
import { mkdir, rm, rmdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const folder = new URL('../.subscription-test-build/',import.meta.url);
await mkdir(folder,{recursive:true});
const output = new URL('render.mjs',folder);
try {
 await build({stdin:{contents:`
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import PlanCards from './src/components/subscriptions/PlanCards.jsx';
import { DEFAULT_PLANS, presentPlan } from './shared/subscriptionPlans.js';
const render = props => renderToStaticMarkup(React.createElement(PlanCards,props));
const plans = DEFAULT_PLANS.map(p => presentPlan(p,DEFAULT_PLANS));
const publicMarkup = render({plans});
const adminMarkup = render({plans,admin:true,subscriberCount:()=>4});
for (const p of plans) {
 for (const markup of [publicMarkup,adminMarkup]) {
  assert.ok(markup.includes(p.name)); assert.ok(markup.includes(p.description));
  assert.ok(markup.includes(p.monthlyPrice.toLocaleString())); assert.ok(markup.includes(p.annualPrice.toLocaleString()));
  for(const feature of p.features) assert.ok(markup.includes(feature));
 }
}
for(const html of [publicMarkup,adminMarkup]) { assert.ok(html.includes('bg-white border-slate-200')); assert.ok(html.includes('bg-[#EFF6FF]')); assert.ok(html.includes('border-[#93C5FD]')); assert.ok(html.includes('bg-[#172554]')); assert.ok(html.includes('bg-[#FACC15]')); }
assert.ok(adminMarkup.includes('Edit Plan')); assert.ok(adminMarkup.includes('View Subscribers'));
assert.ok(adminMarkup.includes('4 subscribed farmers')); assert.ok(publicMarkup.includes('Most Popular'));
const changed = plans.map(p => p.id === 'professional' ? presentPlan({...p,name:'Growth',monthlyPrice:6100,annualPrice:61000,maxFlocks:20,description:'Updated farm tools'}) : p);
for(const admin of [true,false]) {
 const html = render({plans:changed,admin,cycle:'annual',subscriberCount:()=>0});
 assert.ok(html.includes('Growth')); assert.ok(html.includes('6,100')); assert.ok(html.includes('61,000'));
 assert.ok(html.includes('Maximum of 20 active flocks')); assert.ok(html.includes('Updated farm tools'));
}
const disabled = plans.map(p=>({...p,status:'Disabled'}));
assert.ok(!render({plans:disabled}).includes('data-plan='));
assert.ok(render({plans:disabled,admin:true,subscriberCount:()=>0}).includes('Disabled'));
console.log('PASS shared landing/admin/farmer rendering, all prices and features, annual billing, admin controls, updated configuration and disabled plans');
`,resolveDir:process.cwd(),loader:'jsx'},bundle:true,platform:'node',format:'esm',outfile:fileURLToPath(output),packages:'external'});
 const result = spawnSync(process.execPath,[fileURLToPath(output)],{stdio:'inherit'});
 if(result.error) throw result.error;
 if(result.status) process.exitCode=result.status;
} finally {await rm(output,{force:true});await rmdir(folder);}
