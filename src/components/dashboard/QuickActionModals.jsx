import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useFarm } from '../../context/FarmContext';
import { flockService } from '../../services/flockService';
import { eggService } from '../../services/productionService';
import { healthService } from '../../services/healthService';
import { weightService } from '../../services/weightService';
import { salesService, expenseService } from '../../services/businessService';

/**
 * Quick action modals for the poultry dashboards.
 * All records are scoped to the active poultry type's flocks so records of
 * different poultry types never mix.
 *
 * activeModal: 'flock' | 'egg' | 'mortality' | 'weight' | 'expense' | 'sale' | null
 */
export default function QuickActionModals({ activeModal, onClose, poultryType }) {
  const { flocks, scopedDataFor, refreshAllData } = useFarm();
  const today = new Date().toISOString().split('T')[0];

  // Flocks belonging to the active poultry type (records stay scoped per type)
  const typeFlocks = poultryType ? scopedDataFor(poultryType.id).flocks : flocks;

  const [flockForm, setFlockForm] = useState({
    name: '',
    type: poultryType?.flockTypes[0] || 'Broiler',
    breed: '',
    initialBirds: 500,
    costPerBird: 1000,
    pen: 'House 1'
  });
  const [eggForm, setEggForm] = useState({ flockId: '', totalEggs: 1000, brokenEggs: 5, rejectedEggs: 3, date: today });
  const [mortalityForm, setMortalityForm] = useState({ flockId: '', count: 1, cause: 'Natural Causes', date: today, notes: '' });
  const [weightForm, setWeightForm] = useState({ flockId: '', averageWeightKg: 1.5, sampleSize: 30, date: today, notes: '' });
  const [expenseForm, setExpenseForm] = useState({ category: 'Feed', description: '', amount: 50000, paymentMethod: 'Bank Transfer', date: today, flockId: '' });
  const [saleForm, setSaleForm] = useState({ customerName: '', product: poultryType?.salesProduct || 'Live Birds', quantity: 10, unitPrice: 4000, paymentStatus: 'Paid', date: today, flockId: '' });

  const commonInput = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm';
  const close = () => {
    onClose();
  };

  const handleSubmit = (fn) => (e) => {
    e.preventDefault();
    fn();
    refreshAllData();
    close();
  };

  const handleAddFlock = handleSubmit(() => {
    flockService.create({
      ...flockForm,
      type: poultryType?.flockTypes[0] || flockForm.type,
      breed: flockForm.breed || poultryType?.label || 'Local',
      initialBirds: Number(flockForm.initialBirds),
      costPerBird: Number(flockForm.costPerBird)
    });
  });

  const handleRecordEgg = handleSubmit(() => {
    const flock = typeFlocks.find((f) => f.id === eggForm.flockId) || typeFlocks[0];
    eggService.createRecord({
      ...eggForm,
      flockId: flock?.id || '',
      flockName: flock?.name || 'Flock',
      totalEggs: Number(eggForm.totalEggs),
      brokenEggs: Number(eggForm.brokenEggs),
      rejectedEggs: Number(eggForm.rejectedEggs)
    });
  });

  const handleRecordMortality = handleSubmit(() => {
    const flock = typeFlocks.find((f) => f.id === mortalityForm.flockId) || typeFlocks[0];
    healthService.recordMortality({
      ...mortalityForm,
      flockId: flock?.id || '',
      flockName: flock?.name || 'Flock',
      count: Number(mortalityForm.count)
    });
  });

  const handleRecordWeight = handleSubmit(() => {
    const flock = typeFlocks.find((f) => f.id === weightForm.flockId) || typeFlocks[0];
    weightService.addWeightRecord({
      ...weightForm,
      flockId: flock?.id || '',
      flockName: flock?.name || 'Flock',
      averageWeightKg: Number(weightForm.averageWeightKg),
      sampleSize: Number(weightForm.sampleSize)
    });
  });

  const handleAddExpense = handleSubmit(() => {
    expenseService.createExpense({
      ...expenseForm,
      amount: Number(expenseForm.amount),
      // Attribute to the selected flock so the expense stays in this poultry type's books
      flockId: expenseForm.flockId || typeFlocks[0]?.id || undefined,
      description: expenseForm.description || `${poultryType?.label || 'Poultry'} ${expenseForm.category}`
    });
  });

  const handleRecordSale = handleSubmit(() => {
    salesService.createSale({
      ...saleForm,
      quantity: Number(saleForm.quantity),
      unitPrice: Number(saleForm.unitPrice),
      flockId: typeFlocks[0]?.id || undefined
    });
  });

  const flockSelect = (value, onChange, label = 'Select Flock') => (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{label}</label>
      <select value={value} onChange={onChange} className={commonInput}>
        {typeFlocks.length === 0 && <option value="">No {poultryType?.label || ''} flocks yet</option>}
        {typeFlocks.map((f) => (
          <option key={f.id} value={f.id}>{f.name} ({f.currentBirds} birds)</option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      {/* Add Flock */}
      <Modal isOpen={activeModal === 'flock'} onClose={close} title={`Add ${poultryType?.label || ''} Flock`}>
        <form onSubmit={handleAddFlock} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Flock Name</label>
            <input
              type="text" required placeholder={`e.g. ${poultryType?.label || ''} Batch A`}
              value={flockForm.name}
              onChange={(e) => setFlockForm({ ...flockForm, name: e.target.value })}
              className={commonInput}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Breed</label>
              <input
                type="text" required placeholder="e.g. Cobb 500"
                value={flockForm.breed}
                onChange={(e) => setFlockForm({ ...flockForm, breed: e.target.value })}
                className={commonInput}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Pen / House</label>
              <input
                type="text" required placeholder="e.g. House 1"
                value={flockForm.pen}
                onChange={(e) => setFlockForm({ ...flockForm, pen: e.target.value })}
                className={commonInput}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Initial Bird Count</label>
              <input
                type="number" required min="1"
                value={flockForm.initialBirds}
                onChange={(e) => setFlockForm({ ...flockForm, initialBirds: Number(e.target.value) })}
                className={commonInput}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cost Per Bird (₦)</label>
              <input
                type="number" required min="0"
                value={flockForm.costPerBird}
                onChange={(e) => setFlockForm({ ...flockForm, costPerBird: Number(e.target.value) })}
                className={commonInput}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">Bird type is fixed to <strong>{poultryType?.label}</strong> so records stay scoped to this poultry type.</p>
          <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
            Save Flock
          </button>
        </form>
      </Modal>

      {/* Record Eggs */}
      <Modal isOpen={activeModal === 'egg'} onClose={close} title="Record Daily Egg Yield">
        <form onSubmit={handleRecordEgg} className="space-y-4">
          {flockSelect(eggForm.flockId, (e) => setEggForm({ ...eggForm, flockId: e.target.value }), 'Select Flock')}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Total Eggs</label>
              <input type="number" required value={eggForm.totalEggs}
                onChange={(e) => setEggForm({ ...eggForm, totalEggs: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Broken</label>
              <input type="number" value={eggForm.brokenEggs}
                onChange={(e) => setEggForm({ ...eggForm, brokenEggs: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Rejected</label>
              <input type="number" value={eggForm.rejectedEggs}
                onChange={(e) => setEggForm({ ...eggForm, rejectedEggs: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
            Calculated Good Eggs: {Math.max(0, eggForm.totalEggs - eggForm.brokenEggs - eggForm.rejectedEggs)} (~{((Math.max(0, eggForm.totalEggs - eggForm.brokenEggs - eggForm.rejectedEggs)) / 30).toFixed(1)} Crates)
          </div>
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
            Save Egg Record
          </button>
        </form>
      </Modal>

      {/* Record Mortality */}
      <Modal isOpen={activeModal === 'mortality'} onClose={close} title="Record Mortality">
        <form onSubmit={handleRecordMortality} className="space-y-4">
          {flockSelect(mortalityForm.flockId, (e) => setMortalityForm({ ...mortalityForm, flockId: e.target.value }), 'Select Flock')}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Number of Birds</label>
              <input type="number" required min="1" value={mortalityForm.count}
                onChange={(e) => setMortalityForm({ ...mortalityForm, count: Number(e.target.value) })}
                className={commonInput} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cause</label>
              <select value={mortalityForm.cause}
                onChange={(e) => setMortalityForm({ ...mortalityForm, cause: e.target.value })}
                className={commonInput}>
                <option>Natural Causes</option>
                <option>Disease</option>
                <option>Heat Stress</option>
                <option>Injury</option>
                <option>Predation</option>
                <option>Unknown</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes</label>
            <input type="text" placeholder="Optional observation..."
              value={mortalityForm.notes}
              onChange={(e) => setMortalityForm({ ...mortalityForm, notes: e.target.value })}
              className={commonInput} />
          </div>
          <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl">
            Save Mortality Record
          </button>
        </form>
      </Modal>

      {/* Record Weight */}
      <Modal isOpen={activeModal === 'weight'} onClose={close} title="Record Bird Weight">
        <form onSubmit={handleRecordWeight} className="space-y-4">
          {flockSelect(weightForm.flockId, (e) => setWeightForm({ ...weightForm, flockId: e.target.value }), 'Select Flock')}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Average Weight (kg)</label>
              <input type="number" required min="0.01" step="0.01" value={weightForm.averageWeightKg}
                onChange={(e) => setWeightForm({ ...weightForm, averageWeightKg: Number(e.target.value) })}
                className={commonInput} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Sample Size (birds)</label>
              <input type="number" min="1" value={weightForm.sampleSize}
                onChange={(e) => setWeightForm({ ...weightForm, sampleSize: Number(e.target.value) })}
                className={commonInput} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes</label>
            <input type="text" placeholder="e.g. Weekly weighing, uniform growth..."
              value={weightForm.notes}
              onChange={(e) => setWeightForm({ ...weightForm, notes: e.target.value })}
              className={commonInput} />
          </div>
          <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl">
            Save Weight Record
          </button>
        </form>
      </Modal>

      {/* Add Expense */}
      <Modal isOpen={activeModal === 'expense'} onClose={close} title={`Add ${poultryType?.label || ''} Expense`}>
        <form onSubmit={handleAddExpense} className="space-y-4">
          {flockSelect(expenseForm.flockId, (e) => setExpenseForm({ ...expenseForm, flockId: e.target.value }), 'Charge To Flock (optional)')}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
            <select value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              className={commonInput}>
              <option>Feed</option>
              <option>Medication</option>
              <option>Labour</option>
              <option>Transportation</option>
              <option>Electricity</option>
              <option>Equipment</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description</label>
            <input type="text" required placeholder="e.g. 50 bags TopFeeds Layer Mash"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              className={commonInput} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount (₦)</label>
            <input type="number" required value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
              className={commonInput} />
          </div>
          <button type="submit" className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl">
            Save Expense
          </button>
        </form>
      </Modal>

      {/* Record Sale */}
      <Modal isOpen={activeModal === 'sale'} onClose={close} title={`Record ${poultryType?.label || ''} Sale`}>
        <form onSubmit={handleRecordSale} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Customer Name</label>
            <input type="text" required placeholder="e.g. Kwara Fresh Supermarket"
              value={saleForm.customerName}
              onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
              className={commonInput} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Product</label>
              <select value={saleForm.product}
                onChange={(e) => setSaleForm({ ...saleForm, product: e.target.value })}
                className={commonInput}>
                <option>{poultryType?.salesProduct || 'Live Birds'}</option>
                <option>Live Birds</option>
                <option>Manure</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quantity</label>
              <input type="number" required value={saleForm.quantity}
                onChange={(e) => setSaleForm({ ...saleForm, quantity: Number(e.target.value) })}
                className={commonInput} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Unit Price (₦)</label>
              <input type="number" required value={saleForm.unitPrice}
                onChange={(e) => setSaleForm({ ...saleForm, unitPrice: Number(e.target.value) })}
                className={commonInput} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Status</label>
              <select value={saleForm.paymentStatus}
                onChange={(e) => setSaleForm({ ...saleForm, paymentStatus: e.target.value })}
                className={commonInput}>
                <option>Paid</option>
                <option>Pending</option>
                <option>Partially Paid</option>
              </select>
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold">
            Total Sale Value: ₦{(saleForm.quantity * saleForm.unitPrice).toLocaleString()}
          </div>
          <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl">
            Save Sale
          </button>
        </form>
      </Modal>
    </>
  );
}
