import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wheat,
  Egg,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Package,
  Users,
  CheckCircle2,
  NotebookPen,
  PiggyBank,
  Clock,
  Bird,
  ArrowRight,
  ChevronDown,
  Megaphone,
  Star,
  Info,
  Feather,
  Sprout,
  Rocket,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { POULTRY_TYPES } from '../constants/poultryTypes';
import { TOP_BANNER_AD, HERO_AD, SPONSORED_CARD_ADS, ADVERTISER_TYPES } from '../constants/ads';
import { TopBannerAd, HeroAdCard, SponsoredAdCard } from '../components/landing/AdSlots';
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

function HeroDashCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-lg px-4 py-3">
      <span className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700" aria-hidden="true">
        {Icon && <Icon className="w-5 h-5 text-emerald-600" />}
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`text-lg font-extrabold leading-tight ${color}`}>{value}</p>
      </div>
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

  const startCta = isLoggedIn ? (
    <Link
      to="/dashboard"
      className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
    >
      Go to Your Dashboard
      <ArrowRight className="w-5 h-5" />
    </Link>
  ) : (
    <Link
      to="/register"
      className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
    >
      Start Managing Your Farm
      <ArrowRight className="w-5 h-5" />
    </Link>
  );

  return (
    <div id="top" className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* 1. Top sponsored banner */}
      <TopBannerAd ad={TOP_BANNER_AD} />

      {/* 2. Navigation bar */}
      <LandingNavbar />

      <main className="flex-1">
        {/* 3. Hero + 4. Hero advertisement */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3 text-center lg:text-left">

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                Manage Your Poultry Farm{' '}
                <span className="text-emerald-600 underline decoration-emerald-300 decoration-4 underline-offset-4">Smarter</span>.
              </h1>

              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                PoultryPro gives you everything you need to manage your flocks, feed, production,
                health, sales and expenses in one simple platform.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
                {startCta}
                <a
                  href="#features"
                  className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-base rounded-2xl transition-all shadow-sm"
                >
                  Explore PoultryPro
                </a>
              </div>

              {/* Floating dashboard preview cards */}
              <div className="mt-10 grid grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0">
                <HeroDashCard icon={Bird} label="Total Birds" value="4,500" color="text-emerald-600" />
                <HeroDashCard icon={Egg} label="Eggs Today" value="3,820" color="text-blue-600" />
                <HeroDashCard icon={Wheat} label="Feed Today" value="850 kg" color="text-amber-600" />
                <HeroDashCard icon={PiggyBank} label="Revenue (MTD)" value="₦485,000" color="text-slate-900" />
              </div>
            </div>

            {/* 4. Hero advertisement */}
            <div className="lg:col-span-2">
              <HeroAdCard ad={HERO_AD} />
            </div>
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
        <section id="poultry-types" className="py-20 bg-slate-50 border-t border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Personalized for you"
              title="Built Around the Poultry You Raise"
              subtitle="Whether you raise broilers, layers, turkeys, ducks or quails, PoultryPro adapts your farm dashboard to match your operation."
            />

            <div className="mt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {POULTRY_TYPES.map((t) => {
                const Icon = t.icon || Bird;
                return (
                  <div key={t.id} className="p-5 rounded-2xl bg-white border border-slate-200 text-center hover:border-emerald-300 hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto" aria-hidden="true">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="mt-3 text-sm font-extrabold text-slate-900">{t.label}</h3>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-3">{t.description}</p>
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

              <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-50 to-emerald-50/40">
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

        {/* 8. Sponsored ads section */}
        <section id="sponsored" className="py-20 bg-slate-50 border-t border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Marketplace"
              title="Recommended for Poultry Farmers"
              subtitle="Products and services from trusted agricultural businesses, curated for poultry operations."
            />
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {SPONSORED_CARD_ADS.map((ad) => (
                <SponsoredAdCard key={ad.id} ad={ad} />
              ))}
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
        <section id="benefits" className="py-20 bg-slate-50 border-t border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <section className="py-20 bg-gradient-to-br from-emerald-800 via-emerald-700 to-blue-800 border-t border-emerald-900/20">
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
              eyebrow="Pricing"
              title="Simple Plans for Every Farm"
              subtitle="Start free and upgrade as your flock grows."
            />

            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  name: 'Free',
                  icon: Feather,
                  price: '₦0',
                  period: '/month',
                  features: ['2 Flocks', 'Up to 500 Birds', '1 Farm', '1 User', 'Basic Dashboard', 'Flock Management', 'Basic Records'],
                  cta: 'Get Started',
                  popular: false,
                },
                {
                  name: 'Basic',
                  icon: Sprout,
                  price: '₦5,000',
                  period: '/month',
                  features: ['10 Flocks', 'Up to 5,000 Birds', '1 Farm', '3 Users', 'Advanced Dashboard', 'Feed Management', 'Egg Production', 'Health Records', 'Sales & Expenses', 'Reports'],
                  cta: 'Start Basic',
                  popular: true,
                },
                {
                  name: 'Pro',
                  icon: Rocket,
                  price: '₦15,000',
                  period: '/month',
                  features: ['Unlimited Flocks', 'Unlimited Birds', 'Multiple Farms', '10 Users', 'Advanced Analytics', 'PDF Reports', 'Staff Management', 'Notifications', 'Priority Support'],
                  cta: 'Go Pro',
                  popular: false,
                },
              ].map((p) => {
                const PlanIcon = p.icon;
                return (
                <div
                  key={p.name}
                  className={`relative p-8 rounded-2xl flex flex-col ${
                    p.popular
                      ? 'bg-emerald-900 text-white shadow-2xl shadow-emerald-900/25 ring-2 ring-emerald-500/40'
                      : 'bg-white border border-slate-200 shadow-sm'
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider shadow">
                      Most Popular
                    </span>
                  )}
                  <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${p.popular ? 'bg-emerald-800 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`} aria-hidden="true">
                    <PlanIcon className="w-6 h-6" />
                  </span>
                  <h3 className={`mt-4 text-xl font-extrabold ${p.popular ? 'text-white' : 'text-slate-900'}`}>{p.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className={`text-4xl font-black ${p.popular ? 'text-white' : 'text-slate-900'}`}>{p.price}</span>
                    <span className={`text-sm font-semibold ${p.popular ? 'text-emerald-300' : 'text-slate-500'}`}>{p.period}</span>
                  </div>
                  <ul className={`mt-6 space-y-2.5 border-t pt-6 flex-1 ${p.popular ? 'border-emerald-800' : 'border-slate-100'}`}>
                    {p.features.map((f) => (
                      <li key={f} className={`flex items-center gap-2.5 text-sm font-medium ${p.popular ? 'text-emerald-100' : 'text-slate-600'}`}>
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${p.popular ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={isLoggedIn ? '/dashboard' : '/register'}
                    className={`mt-8 w-full py-3.5 rounded-xl font-extrabold text-sm text-center transition-all ${
                      p.popular
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {p.cta}
                  </Link>
                </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 13. Advertise with us CTA */}
        <section id="advertise" className="py-20 bg-slate-50 border-t border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-8 sm:p-14 shadow-2xl">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full border-[36px] border-emerald-500/10" aria-hidden="true" />
              <div className="absolute -bottom-28 -left-16 w-72 h-72 rounded-full border-[30px] border-blue-500/10" aria-hidden="true" />

              <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-widest">
                    <Megaphone className="w-4 h-4" />
                    For agricultural businesses
                  </span>
                  <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                    Do You Sell Products or Services to Poultry Farmers?
                  </h2>
                  <p className="mt-4 text-slate-300 leading-relaxed">
                    Reach farmers who are actively managing their poultry businesses through PoultryPro —
                    from feed mills and hatcheries to vets, equipment suppliers and insurers.
                  </p>
                  <a
                    href="#"
                    className="mt-7 inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    Advertise With PoultryPro
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {ADVERTISER_TYPES.map((a) => {
                    const AdvIcon = a.icon;
                    return (
                      <div key={a.label} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10">
                        <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-emerald-300 shrink-0" aria-hidden="true">
                          {AdvIcon && <AdvIcon className="w-4 h-4" />}
                        </span>
                        <span className="text-sm font-semibold text-slate-200">{a.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
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
                { q: 'Is PoultryPro free?', a: 'Yes. PoultryPro has a Free plan with limited features, and paid Basic and Pro plans for larger operations.' },
                { q: 'Can I manage different types of poultry?', a: 'Yes. You can select and manage multiple poultry types — broilers, layers, turkeys, ducks, geese, guinea fowl, quails and more. Your dashboard adapts to the poultry you raise, and records for each type are kept separate.' },
                { q: 'Can I manage multiple flocks?', a: 'Yes. The number depends on your subscription plan — 2 flocks on Free, 10 on Basic and unlimited on Pro.' },
                { q: 'Can I use PoultryPro on my phone?', a: 'Yes. The whole platform is fully responsive and works on phones, tablets and computers.' },
                { q: 'Can I track my expenses?', a: 'Yes. You can record and categorize farm expenses, then see them broken down in reports.' },
                { q: 'Can PoultryPro calculate my profit?', a: 'Yes. PoultryPro calculates revenue, expenses and estimated profit based on your recorded data.' },
                { q: 'Can I add farm workers?', a: 'Staff management is available on supported plans — up to 3 users on Basic and 10 on Pro.' },
              ].map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </section>

        {/* 16. Final CTA */}
        <section className="py-20 bg-gradient-to-br from-emerald-600 via-emerald-600 to-blue-700 border-t border-emerald-700/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
                {isLoggedIn ? 'Open Your Dashboard' : 'Create Free Account'}
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
