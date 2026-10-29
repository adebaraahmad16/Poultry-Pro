import React from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { SUPPORT_CONTACT } from '../../config/supportContact';

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
    <path d="M20.5 3.5A11.9 11.9 0 0 0 1.8 17.8L.2 23.8l6.2-1.6A11.9 11.9 0 0 0 24 11.9c0-3.2-1.3-6.2-3.5-8.4ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.3-.4A9.9 9.9 0 1 1 12 21.8Zm5.4-7.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.2l-.9 1.1c-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.4.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.6-.5-.5-.7-.5H8c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.7 1.2 2.9c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.2-.3-.2-.5-.4Z" />
  </svg>;
}

const methods = [
  { title: 'Email', description: SUPPORT_CONTACT.email, action: 'Send Email', href: SUPPORT_CONTACT.emailUrl, icon: Mail },
  { title: 'WhatsApp', description: 'Message on WhatsApp', action: 'Open Chat', href: SUPPORT_CONTACT.whatsappUrl, icon: WhatsAppIcon, external: true },
];

export default function SupportCards() {
  return <div className="space-y-3">
    {methods.map(({ title, description, action, href, icon: Icon, external }) => (
      <a key={title} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}
        className="group grid min-h-[96px] grid-cols-[40px_minmax(0,1fr)] min-[420px]:grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
        <span className="row-span-2 min-[420px]:row-span-1 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0"><span className="block text-sm font-bold text-slate-900">{title}</span><span className="mt-1 block break-words text-xs leading-5 text-slate-600 [overflow-wrap:anywhere]">{description}</span></span>
        <span className="col-start-2 min-[420px]:col-start-auto inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-emerald-700">
          {action}<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </a>
    ))}
  </div>;
}
