import { usePlanCatalog } from '../../components/subscriptions/usePlanCatalog';
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Bird, Mail, Lock, User, Phone, Home, ArrowRight, ArrowLeft, Check, Sparkles } from '../../components/common/Icons';
import { useAuth } from '../../context/AuthContext';
import PoultryTypeSelect from '../../components/common/PoultryTypeSelect';
import { PLANS, PLAN_DETAILS } from '../../constants/plans';
import { getPlanTheme } from '../../constants/planThemes';
import { subscriptionService, createInitialSubscription } from '../../services/subscriptionService';

export default function Register() {
  const [searchParams] = useSearchParams();
  const { plans, loading: plansLoading, error: plansError } = usePlanCatalog();
  const planParam = searchParams.get('plan')?.toLowerCase();
  const initialPlan = (planParam === 'starter' || planParam === 'basic')
    ? (PLANS.BASIC || PLANS.STARTER)
    : planParam === 'enterprise'
    ? PLANS.ENTERPRISE
    : PLANS.PROFESSIONAL;

  const initialCycle = searchParams.get('cycle')?.toLowerCase() === 'annual' ? 'annual' : 'monthly';

  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [billingCycle, setBillingCycle] = useState(initialCycle);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    farmName: '',
    password: '',
    confirmPassword: ''
  });
  const [poultryTypes, setPoultryTypes] = useState([]);
  const { register } = useAuth();
  const navigate = useNavigate();

  const planInfo = PLAN_DETAILS[selectedPlan] || PLAN_DETAILS[PLANS.STARTER];
  const maxAllowedTypes = planInfo.limits.maxPoultryTypes;

  const handlePoultryTypesChange = (newTypes) => {
    if (maxAllowedTypes !== Infinity && newTypes.length > maxAllowedTypes) {
      alert(`The ${planInfo.name} plan supports up to ${maxAllowedTypes} poultry type${maxAllowedTypes > 1 ? 's' : ''}. Switch to ${selectedPlan === PLANS.STARTER ? 'Pro' : 'Enterprise'} to add more.`);
      return;
    }
    setPoultryTypes(newTypes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (poultryTypes.length === 0) {
      alert("Please select at least one poultry type.");
      return;
    }
    if (maxAllowedTypes !== Infinity && poultryTypes.length > maxAllowedTypes) {
      alert(`Your selected ${planInfo.name} plan allows up to ${maxAllowedTypes} poultry type(s).`);
      return;
    }

    try {
      await register({ ...formData, poultryTypes, planId: selectedPlan, billingCycle });
      navigate('/onboarding');
    } catch(e) { alert(e.message); }

  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl max-w-2xl w-full p-6 sm:p-8">
        <div className="text-center">
          <Link to="/" title="Go to Landing Page" className="inline-block hover:scale-105 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-600/25">
              <Bird className="w-7 h-7 stroke-[2.5]" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900">Create PoultryPro Account</h2>
          <p className="mt-1 text-sm text-slate-500">Includes 14-day unconditional free trial • No credit card required</p>
        </div>

        {plansLoading && <p role="status">Loading available plans…</p>}
        {plansError && <p role="alert" className="text-red-700">{plansError}</p>}
        {/* Plan Selection Section */}
        <div className="mt-6 p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">1. Select Your Subscription Plan</span>
              <span className="text-[11px] text-slate-500">Your 14-day trial gives full access to your selected plan</span>
            </div>
            {/* Billing Cycle Toggle */}
            <div className="inline-flex items-center p-0.5 bg-white border border-slate-200 rounded-lg text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  billingCycle === 'monthly' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                  billingCycle === 'annual' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-extrabold ${billingCycle === 'annual' ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'}`}>Annual</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {plans.filter(p => p.status === 'Active').map(raw => {
              const planKey = raw.id.toUpperCase();
              const p = PLAN_DETAILS[planKey];
              const isSelected = selectedPlan === planKey;
              const isPopular = raw.id.toLowerCase() === 'professional' || planKey === PLANS.PROFESSIONAL;
              const price = billingCycle === 'annual' ? p.annualPriceFormatted : p.priceFormatted;
              const period = billingCycle === 'annual' ? '/yr' : '/mo';
              const theme = getPlanTheme(raw.id);

              return (
                <div
                  key={planKey}
                  onClick={() => {
                    setSelectedPlan(planKey);
                    // trim poultry types if downgrading to starter/professional
                    if (p.limits.maxPoultryTypes !== Infinity && poultryTypes.length > p.limits.maxPoultryTypes) {
                      setPoultryTypes(poultryTypes.slice(0, p.limits.maxPoultryTypes));
                    }
                  }}
                  className={`cursor-pointer p-3.5 rounded-xl border transition-all duration-200 relative flex flex-col justify-between ${
                    isSelected ? theme.cardSelected : theme.card
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-2.5 right-2 px-2 py-0.5 bg-[#2563EB] text-white font-extrabold text-[9px] rounded-full uppercase tracking-wider shadow-xs">
                      Most Popular
                    </span>
                  )}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-black ${theme.title}`}>{p.name}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected ? theme.checkbox : theme.checkboxInactive
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <div className="mt-1">
                      <span className={`text-base font-extrabold ${theme.title}`}>{price}</span>
                      <span className={`text-[11px] font-medium ml-1 ${theme.muted}`}>{period}</span>
                    </div>
                    <div className={`mt-2 text-[11px] space-y-0.5 ${theme.body}`}>
                      <p className={`font-semibold ${theme.title}`}>• {p.limits.maxFlocks === Infinity ? 'Unlimited flocks' : `Up to ${p.limits.maxFlocks} flocks`}</p>
                      <p>• {p.limits.maxBirds === Infinity ? 'Unlimited birds' : `Up to ${p.limits.maxBirds.toLocaleString()} birds`}</p>
                      <p>• {p.limits.maxPoultryTypes === Infinity ? 'Unlimited types' : `${p.limits.maxPoultryTypes} poultry type`}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200/70">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>14-day free trial on <strong>{planInfo.name}</strong> will activate automatically upon registration.</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">2. Account & Farm Details</span>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Dr. Adebayo Folorunsho"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="farmer@greenvalley.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="+234 803 456 7890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Farm Name</label>
            <div className="relative">
              <Home className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Green Valley Poultry Farm"
                value={formData.farmName}
                onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Select Poultry Types
              </span>
              <span className="text-xs font-bold text-emerald-700">
                Allowed on {planInfo.name}: {maxAllowedTypes === Infinity ? 'Unlimited' : `Up to ${maxAllowedTypes}`}
              </span>
            </div>
            <PoultryTypeSelect selected={poultryTypes} onChange={handlePoultryTypesChange} columns="grid-cols-2 sm:grid-cols-3" />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-6"
          >
            Continue to Farm Setup
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-emerald-600 hover:underline">
              Log In
            </Link>
          </p>
          <div>
            <Link
              to="/"
              id="back-to-landing-bottom-btn"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-50 hover:bg-emerald-50/70 text-slate-600 hover:text-emerald-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-emerald-200 shadow-sm transition-all group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-slate-500 group-hover:text-emerald-600" />
              <span>Return to Landing Page</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
