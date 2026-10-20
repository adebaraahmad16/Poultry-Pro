export const CATEGORIES = [
  { id: 'feed', label: 'Feed Consumption', essential: true, flock: true },
  { id: 'mortality', label: 'Mortality', essential: true, flock: true },
  { id: 'eggs', label: 'Egg Production', essential: true, flock: true },
  { id: 'health', label: 'Health Activities', essential: true, flock: true },
  { id: 'water', label: 'Water Consumption', essential: true, flock: true },
  { id: 'weight', label: 'Body Weight', flock: true },
  { id: 'expenses', label: 'Farm Expenses' },
  { id: 'sales', label: 'Sales and Income' },
  { id: 'activities', label: 'General Farm Activities' },
];
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const eggEligible = type => /^(Layer|Duck|Goose|Guinea Fowl|Quail|Other)$/i.test(type || '');
export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
}
const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
export function validateRecord(input, today = localDate()) {
  const r = { category: input.category, date: input.date, flockId: input.flockId || null, poultryType: input.poultryType || null, status: input.status || 'Recorded', values: { ...input.values } };
  const c = CATEGORIES.find(c => c.id === r.category);
  if (!c) fail('Choose a valid record category.');
  if (!validDate(r.date) || r.date > today) fail('Enter a valid recording date that is not in the future.');
  if (!['Recorded','No Activity','Not Applicable'].includes(r.status)) fail('Invalid record status.');
  if (c.flock && !r.flockId) fail('Select a flock for this activity.');
  if (r.status !== 'Recorded') {
    if (!String(r.values.reason || '').trim()) fail('Explain this confirmation.');
    r.values = { reason: String(r.values.reason).slice(0,2000), notes: String(r.values.notes || '').slice(0,4000) };
    return r;
  }
  const v = r.values;
  const num = (key, min = 0, integer = false) => {
    if (v[key] === '' || v[key] == null) fail(`${key}: a value is required.`);
    const n = Number(v[key]);
    if (!Number.isFinite(n) || n < min || n > 1000000000 || (integer && !Number.isSafeInteger(n))) fail(`${key}: enter a valid ${integer ? 'whole ' : ''}number of at least ${min}.`);
    v[key] = n; return n;
  };
  const text = key => { if (!String(v[key] || '').trim()) fail(`${key}: a value is required.`); };
  const money = key => { num(key); if(Math.abs(v[key]*100-Math.round(v[key]*100))>0.000001) fail(`${key}: use at most two decimal places.`); };
  const choice = (key, choices) => { if (!choices.includes(v[key])) fail(`Choose a valid ${key}.`); };
  for (const [key,value] of Object.entries(v)) if (typeof value === 'string' && value.length > 4000) fail(`${key} is too long.`);
  if (['feed','water'].includes(r.category)) {
    num('supplied'); num('remaining');
    if (v.remaining > v.supplied) fail('Remaining quantity cannot exceed the quantity supplied.');
    v.consumed = v.supplied - v.remaining;
    if (r.category === 'feed') { text('feedId'); text('feedType'); choice('unit',['kg','g']); v.consumedKg = v.consumed / (v.unit === 'g' ? 1000 : 1); }
    else { v.unit = 'Litres'; v.estimated = v.estimated === true; }
  }
  if (r.category === 'mortality') { num('count',0,true); text('cause'); }
  if (r.category === 'eggs') {
    for (const key of ['totalEggs','crackedEggs','brokenEggs','otherUnsellable']) num(key,0,true);
    v.damagedEggs = v.crackedEggs + v.brokenEggs + v.otherUnsellable;
    if (v.damagedEggs > v.totalEggs) fail('Damaged eggs cannot exceed collected eggs. Enter each damaged egg in only one category.');
    v.saleableEggs = v.totalEggs - v.damagedEggs;
    // A measured population is required: total flock birds is not necessarily laying hens.
    if (v.layingHens != null && v.layingHens !== '') { num('layingHens',1,true); v.productionRate = v.totalEggs / v.layingHens * 100; }
    else { v.layingHens = null; v.productionRate = null; }
  }
  if (r.category === 'health') {
    choice('recordType',['Medication','Vaccination','Routine Health Check','Disease Observation','Treatment']);
    if (['Medication','Vaccination','Treatment'].includes(v.recordType)) { text('name'); text('dosage'); text('method'); }
    num('birdsTreated',0,true); text('reason'); text('administeredBy');
    for (const key of ['nextDate','withdrawalUntil']) if (v[key] && (!validDate(v[key]) || v[key] < r.date)) fail(`${key} cannot precede the activity date.`);
  }
  if (r.category === 'weight') {
    num('sampleSize',1,true); num('totalWeightKg',0.001); choice('measurement',['Sample','Whole flock']);
    v.averageWeightKg = v.totalWeightKg / v.sampleSize;
  }
  if (r.category === 'expenses') { text('expenseCategory'); text('description'); num('amount',0.01); money('amount'); text('paymentMethod'); }
  if (r.category === 'sales') {
    choice('product',['Live Birds','Eggs','Processed Poultry Products','Manure','Other Farm Products']);
    num('quantity',1,true); money('unitPrice'); money('amountReceived');
    v.totalAmount = Math.round(v.quantity * v.unitPrice * 100)/100;
    if(v.totalAmount>1000000000) fail('Sales total exceeds the supported transaction limit.');
    if (v.amountReceived > v.totalAmount) fail('Payments received cannot exceed sales revenue.');
    v.paymentStatus = v.amountReceived === v.totalAmount ? 'Paid' : v.amountReceived === 0 ? 'Unpaid' : 'Partial';
    if (v.product === 'Live Birds' && !r.flockId) fail('Select the flock for live bird sales.');
    text('paymentMethod');
  }
  if (r.category === 'activities') {
    text('activityType'); text('description'); text('staff');
    if (['Bird Transfer','Culling'].includes(v.activityType)) {
      if (!r.flockId) fail('Select a source flock for bird movements.');
      num('birdsMoved',1,true);
      if (v.activityType === 'Bird Transfer' && (!v.targetFlockId || v.targetFlockId === r.flockId)) fail('Choose a different destination flock.');
    }
  }
  return r;
}
export function recordSummary(r) {
  if (r.status !== 'Recorded') return r.values.reason || r.status;
  const v = r.values;
  return ({feed: `${Number(v.consumedKg || 0).toLocaleString()} kg consumed`, mortality: `${v.count} deaths`, eggs: `${v.totalEggs} eggs collected · ${v.saleableEggs} saleable`, health: `${v.recordType}: ${v.name || v.reason || ''}`, water: `${v.consumed} L${v.estimated ? ' (estimated)' : ''}`, weight: `${Number(v.averageWeightKg).toFixed(3)} kg average (${v.measurement || 'Sample'})`, expenses: `${v.expenseCategory}: ${Number(v.amount).toLocaleString()}`, sales: `${v.product}: ${v.quantity} · revenue ${Number(v.totalAmount).toLocaleString()}`, activities: v.activityType})[r.category] || '';
}
export function completion(records, date, flock) {
  const day = records.filter(r => r.date === date && (r.flockId || null) === (flock?.id || null));
  const items = CATEGORIES.map(c => {
    const entries = day.filter(r => r.category === c.id);
    const recorded = entries.filter(r => r.status === 'Recorded');
    const status = recorded.length ? 'Recorded' : entries.some(r => r.status === 'No Activity') ? 'No Activity' : entries.some(r => r.status === 'Not Applicable') || (c.id === 'eggs' && flock && !eggEligible(flock.type)) || (c.flock && !flock) ? 'Not Applicable' : 'Pending';
    return { ...c, entries, status };
  });
  const applicable = items.filter(c => c.essential && c.status !== 'Not Applicable');
  const pending = applicable.filter(c => c.status === 'Pending');
  return { items, total: applicable.length, completed: applicable.length - pending.length, pending, percentage: applicable.length ? Math.round((applicable.length-pending.length)/applicable.length*100) : 0 };
}
export function birdDelta(r, flockId) {
  if (r.status !== 'Recorded') return 0;
  const v = r.values;
  if (r.flockId === flockId) {
    if (r.category === 'mortality') return -Number(v.count);
    if (r.category === 'sales' && v.product === 'Live Birds') return -(Number(v.quantity)-Number(v.birdInventoryBaseline||0));
    if (r.category === 'activities' && ['Bird Transfer','Culling'].includes(v.activityType)) return -Number(v.birdsMoved);
  }
  return r.category === 'activities' && v.activityType === 'Bird Transfer' && v.targetFlockId === flockId ? Number(v.birdsMoved) : 0;
}
export function birdsOnDate(flock, records, date, start = false) {
  if (!flock || (flock.dateAcquired && flock.dateAcquired > date)) return null;
  return Number(flock.currentBirds) - records.filter(r => start ? r.date >= date : r.date > date).reduce((n,r) => n + birdDelta(r,flock.id),0);
}
export function totals(records) {
  const t = { feed:0, water:0, mortality:0, eggs:0, saleable:0, damaged:0, expenses:0, revenue:0, received:0, netCash:0, supplied:0, remaining:0 };
  for (const r of records.filter(r => r.status === 'Recorded')) {
    const v = r.values;
    if (r.category === 'feed') { const unit = v.unit === 'g' ? 1000 : 1; t.feed += Number(v.consumedKg || 0); t.supplied += Number(v.supplied || 0)/unit; t.remaining += Number(v.remaining || 0)/unit; }
    if (r.category === 'water') t.water += Number(v.consumed || 0);
    if (r.category === 'mortality') t.mortality += Number(v.count || 0);
    if (r.category === 'eggs') { t.eggs += Number(v.totalEggs || 0); t.saleable += Number(v.saleableEggs || 0); t.damaged += Number(v.damagedEggs || 0); }
    if (r.category === 'expenses') t.expenses += Number(v.amount || 0);
    if (r.category === 'sales') { t.revenue += Number(v.totalAmount || 0); t.received += Number(v.amountReceived || 0); }
  }
  t.netCash = t.received - t.expenses; return t;
}
export function paymentsFor(record) {
  if(record.category!=='sales'||record.status!=='Recorded') return [];
  return Array.isArray(record.values.payments)?record.values.payments:Number(record.values.amountReceived)>0?[{date:record.date,amount:Number(record.values.amountReceived)}]:[];
}
export function receivedInPeriod(records,from,to) {
  return records.flatMap(paymentsFor).filter(p=>p.date>=from&&p.date<=to).reduce((n,p)=>n+Number(p.amount),0);
}
