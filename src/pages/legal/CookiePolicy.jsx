import React from 'react';
import LegalPageLayout from '../../components/legal/LegalPageLayout';
import { openCookiePreferencesModal } from '../../services/cookieConsentService';

const SECTIONS = [
  { id: 'what-are-cookies', title: 'What Are Cookies?' },
  { id: 'how-we-use', title: 'How PoultryPro Uses Cookies' },
  { id: 'essential', title: 'Essential Technologies' },
  { id: 'functional', title: 'Functional Technologies' },
  { id: 'analytics', title: 'Analytics Technologies' },
  { id: 'marketing', title: 'Marketing Technologies' },
  { id: 'third-party', title: 'Third-Party Technologies' },
  { id: 'duration', title: 'Cookie Duration' },
  { id: 'managing', title: 'Managing Cookies' },
  { id: 'withdrawing', title: 'Withdrawing Consent' },
  { id: 'updates', title: 'Cookie Policy Updates' },
  { id: 'contact', title: 'Contact Information' },
];

function Section({ id, number, title, children }) {
  return (
    <section id={id} className="mb-10 scroll-mt-24">
      <h2 className="text-xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black shrink-0">{number}</span>
        {title}
      </h2>
      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">{children}</div>
    </section>
  );
}

export default function CookiePolicy() {
  return (
    <LegalPageLayout
      pageTitle="Cookie Policy"
      pageSlug="cookie-policy"
      description="This policy explains how PoultryPro uses cookies and similar browser storage technologies, and how you can manage your preferences."
      version="1.0"
      effectiveDate="[To Be Confirmed — Pending Legal Review]"
      lastUpdated="October 2026"
      sections={SECTIONS}
    >
      <Section id="what-are-cookies" number="1" title="What Are Cookies?">
        <p>
          Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a
          website. They are widely used to make websites work properly, to remember your preferences, and to improve the
          experience for visitors.
        </p>
        <p>
          In addition to traditional cookies, modern web applications also use other browser storage technologies, including
          <strong> localStorage</strong> and <strong>sessionStorage</strong>, which work similarly to cookies but store data
          directly within your browser without sending it back to the server on every request.
        </p>
        <p>
          PoultryPro uses both standard cookies (managed by Supabase for authentication) and browser localStorage for
          platform functionality and preferences.
        </p>
      </Section>

      <Section id="how-we-use" number="2" title="How PoultryPro Uses Cookies">
        <p>PoultryPro uses cookies and browser storage technologies for the following purposes:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>To keep you securely signed in to your account</li>
          <li>To maintain session security through Supabase Authentication</li>
          <li>To enforce Row Level Security so that your farm data is only accessible to you</li>
          <li>To remember your selected poultry type filter and dashboard view preferences</li>
          <li>To store your cookie and storage consent preferences</li>
        </ul>
        <p>
          <strong>PoultryPro does not load any third-party analytics, advertising, or marketing trackers.</strong> We do not
          use Google Analytics, Facebook Pixel, or similar tracking technologies.
        </p>
      </Section>

      <Section id="essential" number="3" title="Essential Technologies">
        <p>
          These technologies are strictly required for PoultryPro to function correctly. You cannot opt out of them without
          preventing yourself from using the platform.
        </p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-emerald-50">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Technology</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Provider</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Purpose</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold">Authentication Token</td>
                <td className="px-4 py-3">Supabase</td>
                <td className="px-4 py-3">Keeps you logged in and verifies your identity on each page</td>
                <td className="px-4 py-3">localStorage / Cookie</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="px-4 py-3 font-semibold">Session Refresh Token</td>
                <td className="px-4 py-3">Supabase</td>
                <td className="px-4 py-3">Extends your active session securely without requiring re-login</td>
                <td className="px-4 py-3">localStorage / Cookie</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold">RLS Identity</td>
                <td className="px-4 py-3">Supabase / PoultryPro</td>
                <td className="px-4 py-3">Ensures database row isolation — only your farm data is visible to you</td>
                <td className="px-4 py-3">Server-side (Supabase)</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="px-4 py-3 font-semibold">poultrypro_login_status</td>
                <td className="px-4 py-3">PoultryPro</td>
                <td className="px-4 py-3">Tracks whether you are logged in to improve page navigation</td>
                <td className="px-4 py-3">localStorage</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold">poultrypro_cookie_consent</td>
                <td className="px-4 py-3">PoultryPro</td>
                <td className="px-4 py-3">Stores your cookie consent decision so we do not repeat the prompt</td>
                <td className="px-4 py-3">localStorage</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="functional" number="4" title="Functional Technologies">
        <p>
          These technologies remember your preferences and improve your day-to-day experience. They are not required for
          core authentication but improve usability.
        </p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-blue-50">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Technology</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Provider</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold">Poultry Type Selection</td>
                <td className="px-4 py-3">PoultryPro</td>
                <td className="px-4 py-3">Remembers which poultry type (e.g. broilers, layers) you last selected so your dashboard loads correctly on return visits</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="px-4 py-3 font-semibold">Farm Scope Preference</td>
                <td className="px-4 py-3">PoultryPro</td>
                <td className="px-4 py-3">Remembers your selected farm view (e.g. All Poultry or a specific type) between sessions</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold">Subscription Data Cache</td>
                <td className="px-4 py-3">PoultryPro</td>
                <td className="px-4 py-3">Stores a local cache of your subscription status to reduce unnecessary server requests</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          You can opt out of functional storage technologies through the{' '}
          <button
            onClick={openCookiePreferencesModal}
            className="text-emerald-600 hover:underline font-semibold bg-transparent border-0 p-0 cursor-pointer"
          >
            Cookie Preferences
          </button>{' '}
          panel. Note that doing so may affect your experience, such as requiring you to reselect your poultry type each
          time you visit.
        </p>
      </Section>

      <Section id="analytics" number="5" title="Analytics Technologies">
        <p>
          <strong>PoultryPro does not currently use any third-party analytics cookies or tracking scripts.</strong> We do
          not load services such as Google Analytics, Hotjar, Mixpanel, or similar tools.
        </p>
        <p>
          We may collect limited, non-identifiable usage information from our server logs (via Vercel and Supabase) for
          the purpose of diagnosing technical errors and monitoring platform health. This information does not identify
          you personally and is not shared with advertising platforms.
        </p>
        <p>
          If we introduce third-party analytics technologies in the future, we will update this Cookie Policy and obtain
          appropriate consent before activating them.
        </p>
      </Section>

      <Section id="marketing" number="6" title="Marketing Technologies">
        <p>
          <strong>PoultryPro does not use marketing cookies, advertising trackers, or third-party advertising networks.</strong>
        </p>
        <p>
          We do not display third-party advertisements on the platform, share your data with advertising platforms, or
          track your browsing activity across other websites.
        </p>
        <p>
          If this changes in the future, we will update this Cookie Policy and provide you with the ability to opt in or
          out of marketing technologies before they are activated.
        </p>
      </Section>

      <Section id="third-party" number="7" title="Third-Party Technologies">
        <p>
          The following third-party services used by PoultryPro may set their own storage when you use the platform:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>Supabase</strong> — Sets authentication and session tokens required for secure login. These are
            essential technologies and cannot be disabled.
          </li>
          <li>
            <strong>Google Fonts</strong> — Loads typography assets from Google's Content Delivery Network. Standard CDN
            requests may include your IP address in server logs. No tracking cookies are set.
          </li>
          <li>
            <strong>Paystack</strong> — When you proceed to payment, Paystack may set cookies on their payment page
            for fraud prevention and transaction security. Please refer to{' '}
            <a href="https://paystack.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Paystack's Privacy Policy</a>{' '}
            for details.
          </li>
        </ul>
      </Section>

      <Section id="duration" number="8" title="Cookie Duration">
        <p>Browser storage technologies used by PoultryPro may be session-based or persistent:</p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Technology</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Duration</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold">Supabase Authentication</td>
                <td className="px-4 py-3">Session / persistent</td>
                <td className="px-4 py-3">Session until logout; refresh token duration set by Supabase configuration</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="px-4 py-3 font-semibold">Cookie Consent Preference</td>
                <td className="px-4 py-3">Persistent</td>
                <td className="px-4 py-3">Stored in localStorage until cleared by you or a browser reset</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-semibold">Poultry Type / Farm Scope</td>
                <td className="px-4 py-3">Persistent</td>
                <td className="px-4 py-3">Stored until you change your selection or clear browser data</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="px-4 py-3 font-semibold">Login Status Flag</td>
                <td className="px-4 py-3">Persistent (until logout)</td>
                <td className="px-4 py-3">Cleared automatically when you log out</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="managing" number="9" title="Managing Cookies">
        <p>You have several ways to manage cookies and browser storage:</p>
        <h3 className="font-bold text-slate-900 mt-4 mb-2">Via PoultryPro Preferences</h3>
        <p>
          You can manage optional browser storage categories through our{' '}
          <button
            onClick={openCookiePreferencesModal}
            className="text-emerald-600 hover:underline font-semibold bg-transparent border-0 p-0 cursor-pointer"
          >
            Cookie Preferences
          </button>{' '}
          panel. This allows you to accept or reject functional, analytics, and marketing storage categories without
          affecting essential authentication technologies.
        </p>
        <h3 className="font-bold text-slate-900 mt-4 mb-2">Via Your Browser Settings</h3>
        <p>
          Most browsers allow you to view, block, or delete cookies and localStorage data through their privacy or
          developer settings. The following links provide guidance for common browsers:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Mozilla Firefox</a></li>
          <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Microsoft Edge</a></li>
          <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Apple Safari</a></li>
        </ul>
        <p>
          Please note that clearing essential authentication storage will log you out of your PoultryPro account and may
          remove saved preferences.
        </p>
      </Section>

      <Section id="withdrawing" number="10" title="Withdrawing Consent">
        <p>
          You can change your cookie and storage preferences at any time by clicking the{' '}
          <button
            onClick={openCookiePreferencesModal}
            className="text-emerald-600 hover:underline font-semibold bg-transparent border-0 p-0 cursor-pointer"
          >
            Manage Cookie Preferences
          </button>{' '}
          link found in the PoultryPro website footer.
        </p>
        <p>
          Withdrawing consent for optional storage will take effect immediately for new storage activities. It does not
          affect essential authentication technologies, which remain active to allow you to use the platform.
        </p>
      </Section>

      <Section id="updates" number="11" title="Cookie Policy Updates">
        <p>
          We may update this Cookie Policy to reflect changes in the technologies we use or changes in applicable law.
          When we make material changes, we will update the version number and last updated date at the top of this page.
        </p>
        <p>
          If we introduce new categories of cookies or tracking technologies that require your consent, we will present a
          new consent prompt before activating them.
        </p>
      </Section>

      <Section id="contact" number="12" title="Contact Information">
        <p>
          If you have questions about our use of cookies or browser storage, please contact us:
        </p>
        <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm space-y-2">
          <p><strong className="text-slate-900">Platform:</strong> PoultryPro</p>
          <p>
            <strong className="text-slate-900">Privacy Contact:</strong>{' '}
            <a href="mailto:privacy@poultrypro.ng" className="text-emerald-600 hover:underline">privacy@poultrypro.ng</a>
          </p>
          <p>
            <strong className="text-slate-900">Support:</strong>{' '}
            <a href="mailto:support@poultrypro.ng" className="text-emerald-600 hover:underline">support@poultrypro.ng</a>
          </p>
        </div>
      </Section>
    </LegalPageLayout>
  );
}
