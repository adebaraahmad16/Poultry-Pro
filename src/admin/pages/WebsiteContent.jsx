import { SUPPORT_CONTACT } from '../../config/supportContact';
import React, { useState } from 'react';
import { Globe, Save, CheckCircle2, Plus, Trash2, HelpCircle, Phone, Mail } from '../../components/common/Icons';
import { useAdmin } from '../context/AdminContext';

export default function WebsiteContent() {
  const { cmsContent, updateCmsContent } = useAdmin();
  const [form, setForm] = useState(cmsContent);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    updateCmsContent(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddFaq = (e) => {
    e.preventDefault();
    if (!newFaqQ || !newFaqA) return;
    const updatedFaqs = [...(form.faqs || []), { q: newFaqQ, a: newFaqA }];
    setForm({ ...form, faqs: updatedFaqs });
    updateCmsContent({ ...form, faqs: updatedFaqs });
    setNewFaqQ('');
    setNewFaqA('');
  };

  const handleDeleteFaq = (index) => {
    const updatedFaqs = form.faqs.filter((_, i) => i !== index);
    setForm({ ...form, faqs: updatedFaqs });
    updateCmsContent({ ...form, faqs: updatedFaqs });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Website Content Management (CMS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Update PoultryPro's public landing page headlines and FAQs, and view official support contact details.
          </p>
        </div>
        {savedSuccess && (
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Website changes published successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Landing Page Hero Content (README Section 14A) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Globe className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-extrabold text-slate-900">
              Homepage Hero Section Content
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Main Hero Headline
              </label>
              <input
                type="text"
                required
                value={form.hero?.headline || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hero: { ...form.hero, headline: e.target.value }
                  })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Subheadline / Platform Overview
              </label>
              <textarea
                rows={3}
                required
                value={form.hero?.subheadline || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hero: { ...form.hero, subheadline: e.target.value }
                  })
                }
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Primary Call-To-Action Button
                </label>
                <input
                  type="text"
                  required
                  value={form.hero?.ctaPrimary || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      hero: { ...form.hero, ctaPrimary: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Secondary Action Button
                </label>
                <input
                  type="text"
                  required
                  value={form.hero?.ctaSecondary || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      hero: { ...form.hero, ctaSecondary: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contact Information (README Section 14E) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Phone className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-extrabold text-slate-900">
              Official Platform Support & Contact Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Official Support Email</label>
              <input
                type="email"
                required
                value={SUPPORT_CONTACT.email}
                readOnly
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Support Phone Line</label>
              <input
                type="text"
                required
                value={SUPPORT_CONTACT.phone}
                readOnly
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">WhatsApp Farmer Line</label>
              <input
                type="text"
                required
                value={SUPPORT_CONTACT.internationalPhone}
                readOnly
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1 text-xs">Official Office Address</label>
            <input
              type="text"
              required
              value={form.contact?.office || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  contact: { ...form.contact, office: e.target.value }
                })
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-[#15803D] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save & Publish Website Changes
          </button>
        </div>
      </form>

      {/* Section 3: Frequently Asked Questions (README Section 14D) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <HelpCircle className="w-5 h-5 text-emerald-700" />
          <h2 className="text-base font-extrabold text-slate-900">
            Manage Landing Page FAQs
          </h2>
        </div>

        {/* Existing FAQs */}
        <div className="divide-y divide-slate-100">
          {(form.faqs || []).map((faq, index) => (
            <div key={index} className="py-4 flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <span className="font-extrabold text-sm text-slate-900 block">{faq.q}</span>
                <p className="text-xs text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteFaq(index)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg shrink-0"
                title="Remove FAQ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add New FAQ Form */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase block">Add Question & Answer</span>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Question headline..."
              value={newFaqQ}
              onChange={(e) => setNewFaqQ(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
            />
            <textarea
              rows={2}
              placeholder="Answer explanation..."
              value={newFaqA}
              onChange={(e) => setNewFaqA(e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleAddFaq}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
}
