import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';
import SupportCards from '../components/contact/SupportCards';
import { CONTACT_SUBJECTS, submitContact } from '../services/contactService';

const faqs = [
  ['What is PoultryPro?', 'PoultryPro is a poultry farm management platform for tracking flocks, daily records, production, health, and farm finances.'],
  ['How do I create an account?', 'Select Create Account on the website, complete registration, and follow the farm setup steps.'],
  ['Can I manage multiple poultry types?', 'Yes. PoultryPro supports multiple poultry types. Your subscription determines the available limits.'],
  ['How do I report a technical problem?', 'Choose Technical Support or Report a Problem in the form. Describe what happened and any error shown. Never include passwords or payment card details.'],
  ['How can I make enquiries about subscriptions?', 'Choose Subscription and Payment in the contact form and tell us which plan or billing question you need help with.'],
];
const field = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-600';
export default function Contact() {
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, []);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', subject: '', message: '', website: '' });
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const requestId = useRef(crypto.randomUUID());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const change = e => {
    setForm(v => ({ ...v, [e.target.name]: e.target.value }));
    requestId.current = crypto.randomUUID();
    setSuccess(false);
  };
  const send = async e => {
    e.preventDefault();
    if (lock.current) return;
    if (form.full_name.trim().length < 2 || form.message.trim().length < 10) { setError('Please enter your full name and a message of at least 10 characters.'); return; }
    lock.current = true; setBusy(true); setError(''); setSuccess(false);
    try { await submitContact({ ...form, request_id: requestId.current }); setSuccess(true); setForm({ full_name: '', email: '', phone: '', subject: '', message: '', website: '' }); requestId.current = crypto.randomUUID(); }
    catch (err) { setError(err.message); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div className="min-h-screen bg-slate-50 text-slate-800"><LandingNavbar />
    <main>
      <section className="bg-emerald-950 text-white px-4 py-16 text-center"><h1 className="text-4xl font-extrabold">Contact Us</h1><p className="mt-5 max-w-2xl mx-auto text-emerald-100 leading-relaxed">Have questions about PoultryPro? Whether you need technical assistance, have a business enquiry, or want to share feedback, our team is here to help.</p></section>
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 min-w-0"><h2 className="text-2xl font-bold">Send Us a Message</h2>
          {success && <div role="status" className="mt-5 p-4 rounded-xl bg-emerald-50 text-emerald-900"><strong>Message Sent Successfully!</strong><p className="mt-2">Thank you for contacting PoultryPro. Our support team will review your enquiry and get back to you as soon as possible.</p></div>}
          {error && <p role="alert" className="mt-5 rounded-xl p-4 bg-red-50 text-red-800">{error}</p>}
          <form onSubmit={send} className="mt-6 space-y-5">
            <fieldset disabled={busy} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">{[['full_name','Full Name','text',120,true],['email','Email Address','email',254,true],['phone','Phone Number (optional)','tel',40,false]].map(([name,label,type,max,required]) => <label key={name} className="block text-sm font-semibold">{label}{required && ' *'}<input className={field} name={name} type={type} autoComplete={name === 'full_name' ? 'name' : type === 'tel' ? 'tel' : 'email'} maxLength={max} required={required} value={form[name]} onChange={change} /></label>)}
                <label className="block text-sm font-semibold">Subject *<select className={field} name="subject" value={form.subject} required onChange={change}><option value="">Select a subject</option>{CONTACT_SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></label></div>
              <label className="block text-sm font-semibold">Message *<textarea className={field} name="message" rows={7} required minLength={10} maxLength={10000} value={form.message} onChange={change} /></label>
              <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={change} /></label></div>
              <button className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 text-white font-bold disabled:opacity-60" disabled={busy}>{busy ? 'Sending…' : 'Send Message'}</button>
            </fieldset>
            <p className="text-xs text-slate-500 leading-relaxed">We use your contact details to respond to your enquiry. Please do not share passwords or sensitive payment information. Read our <Link className="text-blue-700 underline" to="/privacy-policy">Privacy Policy</Link>.</p>
          </form>
        </section>
        <aside className="space-y-5"><h2 className="text-xl font-bold">Other Ways to Reach Us</h2>
          <SupportCards />
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6"><h3 className="font-bold text-blue-900">Customer Support</h3><p className="mt-3 text-sm leading-relaxed">We provide assistance with account registration, subscription enquiries, technical problems, general enquiries, and business partnerships.</p></div>
        </aside>
      </div>
      <section className="max-w-4xl mx-auto px-4 pb-16"><h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2><div className="space-y-3">{faqs.map(([q,a]) => <details key={q} className="group bg-white border rounded-xl p-5"><summary className="font-semibold cursor-pointer text-emerald-900">{q}</summary><p className="mt-4 text-sm leading-relaxed text-slate-600">{a}</p></details>)}</div></section>
    </main><LandingFooter /></div>;
}
