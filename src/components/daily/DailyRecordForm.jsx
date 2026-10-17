import React, { useState } from 'react';
import { validateRecord, recordSummary, localDate } from '../../../shared/dailyRecords';
import { dailyRecordService } from '../../services/dailyRecordService';

const initial = {
  feed:{supplied:'',remaining:0,unit:'kg',feedType:'Starter'}, mortality:{count:'',cause:'Unknown'},
  eggs:{totalEggs:'',crackedEggs:0,brokenEggs:0,otherUnsellable:0,layingHens:''},
  health:{recordType:'Medication',birdsTreated:'',name:'',dosage:'',method:'',reason:'',administeredBy:'',nextDate:'',withdrawalUntil:''},
  water:{supplied:'',remaining:0,estimated:false},weight:{sampleSize:'',totalWeightKg:'',measurement:'Sample'},
  expenses:{expenseCategory:'Feed',description:'',amount:'',paymentMethod:'Bank Transfer'},
  sales:{product:'Live Birds',quantity:'',unitPrice:'',amountReceived:0,paymentMethod:'Bank Transfer'},
  activities:{activityType:'Pen Cleaning',description:'',staff:'',birdsMoved:'',targetFlockId:''},
};
const control='mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:ring-2 focus:ring-green-700 focus:outline-none';
export default function DailyRecordForm({category, farmId, flock, poultryType, date, feeds, flocks, record, initialValues={}, onSaved, onCancel}) {
  const [values,setValues]=useState(()=>({...initial[category],notes:'',...initialValues,...record?.values,...(category==='sales'?{paymentDate:record?localDate():date}:{})}));
  const [status,setStatus]=useState(record?.status || 'Recorded');
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [requestKey,setRequestKey]=useState(()=>crypto.randomUUID());
  const set=(key,value)=>setValues(v=>({...v,[key]:value}));
  const field=(key,label,type='text',options={})=><label className="block text-sm font-medium text-slate-700" key={key}>{label}<input className={control} type={type} value={values[key]??''} onChange={e=>set(key,e.target.value)} min={type==='number'?0:undefined} step={type==='number'?'any':undefined} {...options}/></label>;
  const select=(key,label,options)=><label className="block text-sm font-medium text-slate-700" key={key}>{label}<select className={control} value={values[key]||''} onChange={e=>set(key,e.target.value)}>{options.map(o=><option key={typeof o==='string'?o:o.value} value={typeof o==='string'?o:o.value}>{typeof o==='string'?o:o.label}</option>)}</select></label>;
  const payload={...record,category,farmId,flockId:flock?.id||null,poultryType:flock?.type||poultryType||null,date,status,values,requestKey};
  let preview='';try{preview=recordSummary(validateRecord(payload));}catch{/* Incomplete forms have no calculated preview yet. */}
  const submit=async e=>{
    e.preventDefault();setError('');setBusy(true);
    try { validateRecord(payload); await dailyRecordService.save(payload);setValues({...initial[category],notes:''});setRequestKey(crypto.randomUUID());await onSaved(); }
    catch(e){setError(e.message);}finally{setBusy(false);}
  };
  return <form onSubmit={submit} className="space-y-5" aria-label="Daily activity form">
    <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{date} · {flock?.name || 'Farm-wide record'}{flock && <> · {flock.currentBirds} live birds currently</>}</div>
    <label className="block text-sm font-medium text-slate-700">Record status<select className={control} value={status} onChange={e=>setStatus(e.target.value)}><option>Recorded</option><option>No Activity</option><option>Not Applicable</option></select></label>
    {status!=='Recorded' ? field('reason','Reason for confirmation','text',{required:true}) : <div className="grid gap-4 sm:grid-cols-2">
      {category==='feed' && <>
        <label className="block text-sm font-medium text-slate-700">Feed inventory item<select required className={control} value={values.feedId||''} onChange={e=>{const feed=feeds.find(f=>f.id===e.target.value);setValues(v=>({...v,feedId:feed?.id||'',feedType:feed?.type||''}));}}><option value="">Choose stocked feed</option>{feeds.map(f=><option key={f.id} value={f.id}>{f.name} · {(Number(f.quantityBags)*Number(f.bagWeightKg)).toFixed(2)} kg available</option>)}</select></label>
        {field('feedType','Feed type','text',{required:true,list:'feed-types'})}<datalist id="feed-types">{['Starter','Grower','Finisher','Layer Mash',...feeds.map(f=>f.type)].map((v,i)=><option key={i} value={v}/>)}</datalist>
        {select('unit','Feed unit',['kg','g'])}{field('supplied','Feed quantity given','number',{required:true})}{field('remaining','Feed remaining','number',{required:true})}
        <p className="text-xs text-slate-500 sm:col-span-2">Consumed feed is deducted from stock. Remaining feed stays in inventory. Include only this feeding entry’s supply and remainder.</p>
      </>}
      {category==='mortality' && <>{field('count','Number of dead birds (enter 0 for zero mortality)','number',{required:true,step:1})}{select('cause','Suspected cause',['Disease','Heat Stress','Injury','Predation','Unknown','Other'])}</>}
      {category==='eggs' && <>{field('totalEggs','Eggs collected','number',{required:true,step:1})}{field('crackedEggs','Cracked eggs','number',{required:true,step:1})}{field('brokenEggs','Broken eggs','number',{required:true,step:1})}{field('otherUnsellable','Other unsellable eggs','number',{required:true,step:1})}{field('layingHens','Live laying hens on this date','number',{required:true,min:1,step:1})}<p className="text-xs text-slate-500 sm:col-span-2">Count each damaged egg once. Use the actual laying-hen population for this recording date.</p></>}
      {category==='health' && <>{select('recordType','Record type',['Medication','Vaccination','Routine Health Check','Disease Observation','Treatment'])}{field('name','Medication / vaccine / treatment name')}{field('dosage','Dosage administered')}{field('method','Administration method')}{field('birdsTreated','Number of birds treated / checked','number',{required:true,step:1})}{field('reason','Reason / observation','text',{required:true})}{field('administeredBy','Administered / checked by','text',{required:true})}{field('nextDate','Next scheduled health follow-up','date',{min:date})}{field('withdrawalUntil','Withdrawal period ends (if relevant)','date',{min:date})}<p className="text-xs text-slate-500 sm:col-span-2">Record the dosage actually administered. Follow the product label and veterinary instructions.</p></>}
      {category==='water' && <>{field('supplied','Water supplied (litres)','number',{required:true})}{field('remaining','Water remaining (litres)','number',{required:true})}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!values.estimated} onChange={e=>set('estimated',e.target.checked)}/>Consumption is estimated</label></>}
      {category==='weight' && <>{select('measurement','Measurement scope',['Sample','Whole flock'])}{field('sampleSize','Number of birds weighed','number',{required:true,min:1,step:1})}{field('totalWeightKg','Total measured weight (kg)','number',{required:true,min:0.001,step:0.001})}</>}
      {category==='expenses' && <>{select('expenseCategory','Expense category',['Feed','Medication','Vaccination','Labour','Transportation','Electricity','Water','Equipment','Maintenance','Other Expenses'])}{field('description','Description','text',{required:true})}{field('amount','Amount','number',{required:true,min:0.01,step:0.01})}{select('paymentMethod','Payment method',['Bank Transfer','Cash','Card','Mobile Money','Other'])}</>}
      {category==='sales' && <>{select('product','Product sold',['Live Birds','Eggs','Processed Poultry Products','Manure','Other Farm Products'])}{field('customerName','Customer (optional)')}{field('quantity','Quantity sold (birds / eggs / product units)','number',{required:true,min:1,step:1})}{field('unitPrice','Unit price','number',{required:true,step:0.01})}{field('amountReceived','Total payments received so far','number',{required:true,step:0.01})}{field('paymentDate',record?'Date for additional payment':'Payment received date','date',{required:true,min:date,max:localDate()})}{select('paymentMethod','Payment method',['Bank Transfer','Cash','Card','Mobile Money','Other'])}<p className="text-xs text-slate-500 sm:col-span-2">Payment status is calculated. To collect an unpaid sale, edit it and increase payments received; only the additional amount is attributed to the payment date. Bird and egg inventory changes only when the sale quantity changes.</p></>}
      {category==='activities' && <>{select('activityType','Activity type',['Pen Cleaning','Disinfection','Litter Replacement','Equipment Maintenance','Farm Inspection','Bird Transfer','Culling','Other Farm Activities'])}{field('description','Description','text',{required:true})}{field('staff','Staff responsible','text',{required:true})}{['Bird Transfer','Culling'].includes(values.activityType) && field('birdsMoved','Number of birds','number',{required:true,min:1,step:1})}{values.activityType==='Bird Transfer' && select('targetFlockId','Destination flock',[{value:'',label:'Choose destination'},...flocks.filter(f=>f.id!==flock?.id&&f.type===flock?.type).map(f=>({value:f.id,label:f.name}))])}</>}
    </div>}
    <label className="block text-sm font-medium text-slate-700">Notes<textarea className={control} rows={3} value={values.notes||''} maxLength={4000} onChange={e=>set('notes',e.target.value)}/></label>
    {preview && <output className="block rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{preview}{category==='sales' && status==='Recorded' && <> · Received {Number(values.amountReceived||0).toLocaleString()} · {Number(values.amountReceived)===Number(values.quantity)*Number(values.unitPrice)?'Paid':Number(values.amountReceived)===0?'Unpaid':'Partial'}</>}</output>}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="flex flex-wrap gap-3"><button disabled={busy} className="rounded-lg bg-[#15803D] px-5 py-2.5 font-semibold text-white disabled:opacity-50">{busy?'Saving…':record?'Save Correction':'Save Daily Record'}</button>{onCancel && <button type="button" onClick={onCancel} disabled={busy} className="rounded-lg border px-4 py-2">Cancel</button>}</div>
  </form>;
}
