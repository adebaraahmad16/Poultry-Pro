import HeroDashboardPreview from '../components/landing/HeroDashboardPreview';
import SectionPhoto from '../components/landing/SectionPhoto';
import PlanCards from '../components/subscriptions/PlanCards';
import { usePlanCatalog } from '../components/subscriptions/usePlanCatalog';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wheat, Egg, ShieldCheck, BarChart3, Package, Users, NotebookPen, PiggyBank, Clock, Bird, ArrowRight, ChevronDown, Star, Info } from '../components/common/Icons';
import { useAuth } from '../context/AuthContext';
import { POULTRY_TYPES } from '../constants/poultryTypes';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function SectionHeading({ eyebrow, title, subtitle, light = false }) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      {eyebrow && (
        <p className={`text-xs font-extrabold uppercase tracking-widest ${light ? 'text-emerald-300' : 'text-emerald-600'}`}>
          {eyebrow}
        </p>
      )}
      <h2 className={`mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 text-base sm:text-lg leading-relaxed ${light ? 'text-slate-300' : 'text-slate-600'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-sm sm:text-base font-bold text-slate-900">{q}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{a}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Landing page                                                        */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const { plans, loading: plansLoading, error: plansError, retry: retryPlans } = usePlanCatalog();

  const startCta = isLoggedIn ? (
    <Link
      to="/dashboard"
      className="w-full sm:w-auto px-8 py-4 bg-[#15803D] hover:bg-green-800 text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
    >
      Go to Your Dashboard
      <ArrowRight className="w-5 h-5" />
    </Link>
  ) : (
    <Link
      to="/register"
      className="w-full sm:w-auto px-8 py-4 bg-[#15803D] hover:bg-green-800 text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
    >
      Get Started
      <ArrowRight className="w-5 h-5" />
    </Link>
  );

  return (
    <div id="top" className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">

      {/* 2. Navigation bar */}
      <LandingNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section id="hero" aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-[#123524]">
          <SectionPhoto name="hero" eager />
          <div className="absolute inset-0 bg-slate-950/75" aria-hidden="true" />
          <div data-hero-layout className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:px-8">
            <div data-hero-content className="min-w-0">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Smart management. Healthier flocks.</p>
              <h1 id="hero-title" className="max-w-xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl xl:text-[3.25rem]">
                Manage Your Poultry Farm <span className="text-emerald-300">Smarter,</span> Grow Your Business Faster.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-100 sm:text-lg">
                PoultryPro helps poultry farmers manage their flocks, monitor bird health, track feeding,
                record expenses, and analyse farm performance, all from one powerful platform.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                {startCta}
                <a href="#features" className="flex w-full items-center justify-center rounded-2xl border border-white/50 bg-white px-7 py-4 text-base font-bold text-[#1F2937] transition-colors hover:bg-slate-100 sm:w-auto">Explore Features</a>
              </div>
              <div className="mt-7 border-t border-white/20 pt-5">
                <h2 className="text-sm font-bold text-white">Everything You Need to Manage Your Poultry Farm</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">{[
                  {icon:Package,title:'All-in-One Management',text:'Manage important farm operations from one dashboard.'},
                  {icon:NotebookPen,title:'Easy Record Keeping',text:'Organise flock, feeding, health and financial records.'},
                  {icon:BarChart3,title:'Better Farm Decisions',text:'Understand performance through reports and analytics.'},
                ].map(({icon:Icon,title,text}) => <div key={title} className="flex gap-2 sm:block">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"/><div><h3 className="text-xs font-bold text-white sm:mt-2">{title}</h3><p className="mt-1 text-xs leading-relaxed text-slate-200">{text}</p></div>
                </div>)}</div>
              </div>
            </div>
            <HeroDashboardPreview />
          </div>
        </section>

        {/* 5. Features — "Everything Your Farm Needs" */}
        <section id="features" className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Features"
              title="Everything You Need to Run Your Farm"
              subtitle="Purpose-built tools for flocks, feed, production, health, money and people — all in one place."
            />

            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Bird, title: 'Flock Management', desc: 'Track your birds, breeds, ages, flock sizes and mortality.' },
                { icon: Wheat, title: 'Feed Management', desc: 'Monitor feed purchases, consumption and remaining stock.' },
                { icon: Egg, title: 'Production Tracking', desc: 'Track egg production and other poultry-specific production metrics.' },
                { icon: ShieldCheck, title: 'Health Management', desc: 'Manage vaccinations, medication and health records.' },
                { icon: PiggyBank, title: 'Sales & Expenses', desc: 'Track your income, expenses and farm profitability.' },
                { icon: BarChart3, title: 'Farm Analytics', desc: 'Turn your farm records into useful insights.' },
                { icon: Package, title: 'Inventory', desc: 'Know what farm supplies you have and when you need to restock.' },
                { icon: Users, title: 'Worker Management', desc: 'Manage farm workers and assign daily tasks.' },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                    <div className="mb-4">
                      <div className="p-3 w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. Poultry-type personalization */}
        <section id="poultry-types" className="relative isolate overflow-hidden border-t border-slate-200/60 bg-[#123524] py-16 sm:py-20">
          <SectionPhoto name="poultry-types" />
          <div className="absolute inset-0 bg-[#F8FAF9]/80" aria-hidden="true" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Personalized for you"
              title="Built Around the Poultry You Raise"
              subtitle="Whether you raise broilers, layers, turkeys or ducks, PoultryPro adapts your farm dashboard to match your operation."
            />

            <div className="mt-10 grid grid-cols-1 auto-rows-fr md:grid-cols-2 lg:grid-cols-4 gap-6">
              {POULTRY_TYPES.filter(t => t.id !== 'quails').map((t) => {
                const Icon = Bird;
                return (
                  <div key={t.id} data-poultry-type={t.id} className="flex h-full min-w-0 flex-col items-center rounded-2xl border border-slate-200 bg-white/95 p-6 text-center shadow-sm transition-shadow hover:shadow-md">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto" aria-hidden="true">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="mt-3 text-sm font-extrabold text-slate-900">{t.label}</h3>
                    <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{t.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 text-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-emerald-600/20 transition-all"
              >
                Explore Poultry Management
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* 7. Dashboard preview */}
        <section id="dashboard-preview" className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Dashboard"
              title="See Your Farm at a Glance"
              subtitle="Monitor your flock, production, feed, expenses and revenue without going through piles of notebooks or spreadsheets."
            />

            {/* Browser-frame dashboard mockup */}
            <div className="mt-14 max-w-5xl mx-auto rounded-3xl border border-slate-200 shadow-2xl overflow-hidden bg-slate-50">
              <div className="h-10 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 px-4">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-4 text-xs text-slate-400 font-semibold">poultrypro.app/dashboard</span>
              </div>

              <div className="p-6 sm:p-8 bg-[#F8FAFC]">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Birds', value: '6,800', color: 'text-emerald-600' },
                    { label: 'Active Flocks', value: '8', color: 'text-blue-600' },
                    { label: 'Eggs Today', value: '3,820', color: 'text-blue-600' },
                    { label: 'Feed (kg/week)', value: '2,140', color: 'text-amber-600' },
                    { label: 'Mortality Rate', value: '1.8%', color: 'text-rose-600' },
                    { label: 'Revenue', value: '₦2.45m', color: 'text-emerald-600' },
                    { label: 'Expenses', value: '₦1.62m', color: 'text-rose-600' },
                    { label: 'Est. Profit', value: '₦830k', color: 'text-emerald-600' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                      <p className={`mt-1 text-xl font-extrabold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Mini chart mockup */}
                <div className="mt-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-extrabold text-slate-900">Revenue vs Expenses</p>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Revenue</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Expenses</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-2 h-32" aria-hidden="true">
                    {[62, 48, 71, 55, 80, 66, 88, 74, 92, 70, 96, 84].map((h, i) => (
                      <div key={i} className="flex-1 flex items-end gap-0.5">
                        <div className="flex-1 rounded-t-md bg-emerald-500/85" style={{ height: `${h}%` }} />
                        <div className="flex-1 rounded-t-md bg-rose-300" style={{ height: `${Math.max(20, h - 28)}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 text-center">
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl shadow-md transition-all"
              >
                See How It Works
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>


        {/* 9. How PoultryPro Works */}
        <section id="how-it-works" className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="How it works"
              title="How PoultryPro Works"
              subtitle="Five simple steps from notebooks to a data-driven farm."
            />

            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                { step: '1', title: 'Create Your Account', desc: 'Register and tell us what type of poultry you manage.' },
                { step: '2', title: 'Set Up Your Farm', desc: 'Add your farm information and create your flocks.' },
                { step: '3', title: 'Record Your Activities', desc: 'Record feed, production, health, sales, expenses and other activities.' },
                { step: '4', title: 'Monitor Your Farm', desc: "View your farm's performance through your personalized dashboard." },
                { step: '5', title: 'Make Better Decisions', desc: "Use your farm data to understand what's working and where improvements are needed." },
              ].map((s) => (
                <div key={s.step} className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="absolute -top-4 left-6 w-9 h-9 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center shadow-md">
                    {s.step}
                  </span>
                  <h3 className="mt-4 text-base font-extrabold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. Benefits */}
        <section id="benefits" className="relative isolate py-20 bg-slate-50 border-t border-slate-200/60">
          <SectionPhoto name="farmer" />
          <div className="absolute inset-0 bg-slate-50/90" aria-hidden="true" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Benefits"
              title="Why Farmers Choose PoultryPro"
            />
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: NotebookPen, title: 'Less Paperwork', desc: 'Keep your farm records digitally.' },
                { icon: BarChart3, title: 'Better Decisions', desc: 'Understand your farm using real data.' },
                { icon: PiggyBank, title: 'Know Your Profit', desc: 'Track revenue and expenses.' },
                { icon: Wheat, title: 'Control Feed Costs', desc: 'Monitor your feed consumption and stock.' },
                { icon: Bird, title: 'Monitor Your Flocks', desc: 'Know exactly what is happening with your birds.' },
                { icon: Clock, title: 'Save Time', desc: 'Manage your farm from your phone or computer.' },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="flex gap-4 p-6 rounded-2xl bg-white border border-slate-200/80 hover:shadow-md transition-all">
                    <div className="p-3 w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {b.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 11. Farmer statistics */}
        <section className="py-20 bg-[#15803D] border-t border-emerald-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              light
              eyebrow="Built for modern poultry farming"
              title="Your Farm, in Numbers"
            />
            <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {[
                { value: '10,000+', label: 'Birds Tracked' },
                { value: '500+', label: 'Farm Records' },
                { value: '98%', label: 'Data Accuracy' },
                { value: '24/7', label: 'Farm Access' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-4xl sm:text-5xl font-black text-white">{s.value}</p>
                  <p className="mt-2 text-sm font-bold uppercase tracking-widest text-emerald-200">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 flex items-center justify-center gap-1.5 text-xs text-emerald-200/80">
              <Info className="w-3.5 h-3.5" />
              Illustrative figures shown for demonstration — real usage statistics will replace them as the platform grows.
            </p>
          </div>
        </section>

        {/* 12. Pricing */}
        <section id="pricing" className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Subscription Plans"
              title="Transparent Pricing for Every Poultry Operation"
              subtitle="All plans include a 14-day free trial with full access. No credit card required to start."
            />

            {/* Monthly / Annual Billing Toggle */}
            <div className="mt-10 flex items-center justify-center">
              <div className="inline-flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-5 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
                    billingCycle === 'annual'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Annual Billing</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    billingCycle === 'annual' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    Annual pricing
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
              {plansLoading && <p role="status">Loading plans…</p>}
              {plansError && <p role="alert" className="text-red-700">{plansError} <button onClick={retryPlans} className="underline">Retry</button></p>}
              <div className="col-span-full"><PlanCards plans={plans} cycle={billingCycle} onChoose={p => navigate(`/register?plan=${p.id}&cycle=${billingCycle}`)} /></div>
            </div>
          </div>
        </section>


        {/* 14. Testimonials (placeholder content) */}
        <section id="testimonials" className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Testimonials"
              title="What Farmers Say"
            />
            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { quote: 'PoultryPro has made it much easier for me to keep track of my flock and expenses.', name: 'Adebayo', role: 'Poultry Farmer' },
                { quote: 'I can see my eggs collected, feed used and profit without touching a single notebook.', name: 'Chioma', role: 'Layer Farmer' },
                { quote: 'The mortality alerts alone helped me spot a problem in my broiler batch early.', name: 'Musa', role: 'Broiler Farmer' },
              ].map((t) => (
                <figure key={t.name} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex gap-1 text-amber-400" aria-label="5 out of 5 stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-3 text-sm text-slate-700 leading-relaxed">“{t.quote}”</blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="font-extrabold text-slate-900">{t.name}</span>
                    <span className="text-slate-500"> — {t.role}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Info className="w-3.5 h-3.5" />
              Placeholder content — sample testimonials for development, to be replaced with real farmer reviews.
            </p>
          </div>
        </section>

        {/* 15. FAQ */}
        <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200/60">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="FAQ"
              title="Frequently Asked Questions"
            />
            <div className="mt-12 space-y-3">
              {[
                { q: 'Is there a free trial for PoultryPro?', a: 'Yes! Every newly registered farm gets an unconditional 14-day free trial on any subscription plan (Basic, Pro, or Enterprise). No credit card or upfront payment is required to start your trial.' },
                { q: 'What subscription plans are available?', a: 'PoultryPro offers Basic, Pro, and Enterprise. See the pricing cards above for current prices and limits.' },
                { q: 'Can I manage different types of poultry?', a: 'Available capacity depends on your plan. The pricing cards above show the current limits.' },
                { q: 'Can I manage multiple flocks?', a: 'Available capacity depends on your plan. The pricing cards above show the current limits.' },
                { q: 'What happens when my 14-day free trial ends?', a: 'When your trial expires, all your existing farm data, flock history, and production records remain safe and viewable. To add new flocks or records, you can activate your subscription via Paystack.' },
                { q: 'Can I use PoultryPro on my phone?', a: 'Yes. The platform is fully responsive and optimized for smartphones, tablets, and desktop computers.' },
                { q: 'Can I track farm expenses and profit?', a: 'Yes. You can record daily expenses, track feed costs, and monitor gross and net margins with automatic profitability calculations.' },
                { q: 'Can I add farm workers and staff accounts?', a: 'Available capacity depends on your plan. The pricing cards above show the current limits.' },
              ].map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </section>

        {/* 16. Final CTA */}
        <section className="relative isolate overflow-hidden py-20 bg-[#123524] border-t border-emerald-700/30">
          <SectionPhoto name="cta" />
          <div className="absolute inset-0 bg-slate-950/75" aria-hidden="true" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Your Farm. Your Data. Your Growth.
            </h2>
            <p className="mt-4 text-lg text-emerald-50">
              Start managing your poultry operation with PoultryPro today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={isLoggedIn ? '/dashboard' : '/register'}
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-base rounded-2xl shadow-lg transition-all"
              >
                {isLoggedIn ? 'Open Your Dashboard' : 'Start 14-Day Free Trial'}
              </Link>
              <a
                href="#pricing"
                className="w-full sm:w-auto px-8 py-4 border-2 border-white/60 hover:bg-white/10 text-white font-extrabold text-base rounded-2xl transition-all"
              >
                View Pricing
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* 17. Footer */}
      <LandingFooter />
    </div>
  );
}
