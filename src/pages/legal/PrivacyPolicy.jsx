import React from 'react';
import LegalPageLayout from '../../components/legal/LegalPageLayout';
import { Link } from 'react-router-dom';

const SECTIONS = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'information-we-collect', title: 'Information We Collect' },
  { id: 'how-we-use', title: 'How We Use Information' },
  { id: 'legal-basis', title: 'Legal Basis for Processing' },
  { id: 'data-storage', title: 'Data Storage' },
  { id: 'third-party-services', title: 'Third-Party Services' },
  { id: 'data-sharing', title: 'Data Sharing' },
  { id: 'data-security', title: 'Data Security' },
  { id: 'data-retention', title: 'Data Retention' },
  { id: 'privacy-rights', title: 'Your Privacy Rights' },
  { id: 'account-deletion', title: 'Account Deletion & Data Removal' },
  { id: 'international-transfers', title: 'International Data Transfers' },
  { id: 'childrens-privacy', title: "Children's Privacy" },
  { id: 'cookies', title: 'Cookies and Similar Technologies' },
  { id: 'policy-updates', title: 'Privacy Policy Updates' },
  { id: 'contact', title: 'Contact Information' },
];

function Section({ id, number, title, children }) {
  return (
    <section id={id} className="mb-10 scroll-mt-24">
      <h2 className="text-xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-black shrink-0">{number}</span>
        {title}
      </h2>
      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout
      pageTitle="Privacy Policy"
      pageSlug="privacy-policy"
      description="PoultryPro is committed to protecting your personal information. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data."
      version="1.0"
      effectiveDate="[To Be Confirmed — Pending Legal Review]"
      lastUpdated="October 2026"
      sections={SECTIONS}
    >
      <Section id="introduction" number="1" title="Introduction">
        <p>
          PoultryPro ("<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>") operates the PoultryPro
          poultry farm management platform. We are committed to handling your personal information responsibly and with
          transparency.
        </p>
        <p>
          This Privacy Policy explains what information we collect about you, why we collect it, how we use it, who we
          share it with, how we protect it, and what rights you have regarding your information.
        </p>
        <p>
          This policy has been prepared with consideration for applicable Nigerian data protection requirements, including the
          Nigeria Data Protection Act 2023 (NDPA). We have not yet obtained formal legal certification under the NDPA.
          If you are a registered Data Protection Officer or legal professional and require further information, please
          contact us directly.
        </p>
      </Section>

      <Section id="information-we-collect" number="2" title="Information We Collect">
        <h3 className="font-bold text-slate-900 mt-4 mb-2">Personal Account Information</h3>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Full name</li>
          <li>Email address</li>
          <li>Phone number (if provided during registration)</li>
          <li>Account profile information</li>
          <li>Password (stored in hashed form by Supabase — not accessible to us)</li>
        </ul>

        <h3 className="font-bold text-slate-900 mt-4 mb-2">Farm Information</h3>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Farm name and location</li>
          <li>Poultry types managed (e.g. broilers, layers, turkeys)</li>
          <li>Flock records (batch names, bird counts, breeds, ages, housing)</li>
          <li>Feed purchase and consumption records</li>
          <li>Egg production records</li>
          <li>Mortality records (bird deaths and causes)</li>
          <li>Vaccination records</li>
          <li>Medication and treatment records</li>
          <li>Daily farm activity records</li>
          <li>Inventory items and stock levels</li>
        </ul>

        <h3 className="font-bold text-slate-900 mt-4 mb-2">Financial Information</h3>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Sales records and revenue figures you record in the platform</li>
          <li>Operating expense records you submit</li>
          <li>Customer names and purchase records you enter</li>
          <li>Subscription plan information</li>
          <li>Paystack payment transaction references (if you have made a subscription payment)</li>
        </ul>
        <p className="text-xs text-slate-500 italic">
          Note: Full payment card details are not collected or stored by PoultryPro. Card processing is handled directly by
          Paystack in accordance with their PCI-DSS compliance standards.
        </p>

        <h3 className="font-bold text-slate-900 mt-4 mb-2">Technical Information</h3>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Authentication session tokens (managed by Supabase)</li>
          <li>Browser local storage data (used for UI preferences and session continuity)</li>
          <li>Device type information (collected as part of standard web sessions)</li>
          <li>Supabase authentication logs for security purposes</li>
        </ul>
        <p className="text-xs text-slate-500 italic">
          Note: PoultryPro does not use third-party analytics trackers such as Google Analytics. No advertising cookies or
          third-party tracking scripts are loaded on this platform.
        </p>
      </Section>

      <Section id="how-we-use" number="3" title="How We Use Information">
        <p>We use the information we collect for the following purposes:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Account creation and authentication</strong> — To register your account and verify your identity</li>
          <li><strong>Farm management</strong> — To provide you with a personalised farm management dashboard</li>
          <li><strong>Record storage</strong> — To securely store your farm records and make them accessible to you</li>
          <li><strong>Dashboard analytics</strong> — To generate farm performance summaries and production reports for you</li>
          <li><strong>Subscription management</strong> — To track your subscription plan, trial status, and access limits</li>
          <li><strong>Payment verification</strong> — To verify subscription payments made via Paystack</li>
          <li><strong>Account security</strong> — To protect your account and detect unauthorised access attempts</li>
          <li><strong>Customer support</strong> — To respond to your questions, reports, and support requests</li>
          <li><strong>Service improvement</strong> — To identify and fix technical issues and improve platform features</li>
          <li><strong>Legal compliance</strong> — To comply with applicable legal obligations</li>
        </ul>
        <p>
          We do not use your farm records or personal information for advertising purposes or sell your data to third parties.
        </p>
      </Section>

      <Section id="legal-basis" number="4" title="Legal Basis for Processing">
        <p>
          Under the Nigeria Data Protection Act 2023 and applicable privacy principles, we process your personal information
          on the following grounds:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>Contract performance</strong> — Processing necessary to provide you with the PoultryPro service and
            fulfil your subscription
          </li>
          <li>
            <strong>Consent</strong> — Where you have specifically agreed to processing, such as optional browser storage
            preferences
          </li>
          <li>
            <strong>Legitimate interests</strong> — For security monitoring, fraud prevention, platform maintenance, and
            service improvement, where these do not override your rights
          </li>
          <li>
            <strong>Legal obligation</strong> — Where we are required to retain or disclose information by applicable law
          </li>
        </ul>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg text-xs">
          <strong>[To Be Confirmed]:</strong> The precise legal bases for each processing activity should be reviewed by a
          qualified legal professional before this policy is published.
        </p>
      </Section>

      <Section id="data-storage" number="5" title="Data Storage">
        <p>
          PoultryPro uses <strong>Supabase</strong> for user authentication and database services. Your account information
          and farm records are stored in Supabase's PostgreSQL database, which incorporates Row Level Security (RLS) to
          ensure that each farmer's data is isolated and accessible only by the authenticated account holder.
        </p>
        <p>
          The PoultryPro platform is hosted on <strong>Vercel</strong>. Supabase operates data centres in multiple regions.
          We have not independently verified specific data residency locations or obtained formal security certifications
          for these third-party services.
        </p>
        <p>
          We rely on the security measures implemented and maintained by Supabase and Vercel for cloud infrastructure
          protection. We do not guarantee absolute security of data stored on third-party infrastructure.
        </p>
      </Section>

      <Section id="third-party-services" number="6" title="Third-Party Services">
        <p>PoultryPro currently integrates with the following third-party services:</p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Service</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Purpose</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Data Shared</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-white">
                <td className="px-4 py-3 font-bold">Supabase</td>
                <td className="px-4 py-3">Authentication and database storage</td>
                <td className="px-4 py-3">Account credentials (hashed), all farm records</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="px-4 py-3 font-bold">Vercel</td>
                <td className="px-4 py-3">Website and application hosting</td>
                <td className="px-4 py-3">Standard web server access logs</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-bold">Paystack</td>
                <td className="px-4 py-3">Subscription payment processing</td>
                <td className="px-4 py-3">Email address, payment amount (card details processed by Paystack directly)</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="px-4 py-3 font-bold">Google Fonts</td>
                <td className="px-4 py-3">Typography rendering</td>
                <td className="px-4 py-3">IP address (standard CDN request)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          Each of these providers has their own privacy policy and data practices. We are not responsible for the privacy
          practices of these third-party services.
        </p>
      </Section>

      <Section id="data-sharing" number="7" title="Data Sharing">
        <p>We do not sell your personal information to third parties. We may share your information in limited circumstances:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>Authorised service providers</strong> — Supabase, Vercel, and Paystack process your data on our behalf
            as described in Section 6. These providers are contractually bound to protect your data and may not use it for
            their own commercial purposes.
          </li>
          <li>
            <strong>Legal requirements</strong> — We may disclose information where required by Nigerian law, court order,
            or regulatory authority.
          </li>
          <li>
            <strong>Protection of rights</strong> — Where necessary to protect the rights, property, or safety of PoultryPro,
            our users, or the public.
          </li>
        </ul>
      </Section>

      <Section id="data-security" number="8" title="Data Security">
        <p>We implement the following security measures to protect your information:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>Supabase Authentication</strong> — Account passwords are hashed and not stored in plain text. We do not
            have access to your password.
          </li>
          <li>
            <strong>Row Level Security (RLS)</strong> — Supabase RLS policies ensure that each farmer's data is only
            accessible to the authenticated account holder.
          </li>
          <li>
            <strong>Secure connections</strong> — All data transmitted between your browser and our platform is encrypted
            via HTTPS (TLS).
          </li>
          <li>
            <strong>Role-based access controls</strong> — Administrative access to farm data is restricted to authorised
            platform administrators.
          </li>
          <li>
            <strong>Payment security</strong> — Payment card details are processed directly by Paystack and are not stored
            on PoultryPro servers.
          </li>
        </ul>
        <p>
          Despite these measures, no digital system can guarantee complete security. We encourage you to use a strong password,
          keep your login credentials confidential, and report any suspected unauthorised access immediately.
        </p>
      </Section>

      <Section id="data-retention" number="9" title="Data Retention">
        <p>
          We retain your personal information and farm records for as long as your account is active and for a reasonable
          period thereafter, to allow for account reactivation, support requests, or legal obligations.
        </p>
        <p>
          If you request account deletion, we will delete or anonymise your personal information within a reasonable
          timeframe, subject to any legal retention obligations that may apply.
        </p>
        <p>
          Paystack transaction references may be retained for a longer period for financial record-keeping and audit
          purposes.
        </p>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg text-xs">
          <strong>[To Be Confirmed]:</strong> Specific data retention periods for each data category should be established
          and confirmed by the business owner before this policy is published.
        </p>
      </Section>

      <Section id="privacy-rights" number="10" title="Your Privacy Rights">
        <p>
          Under the Nigeria Data Protection Act 2023 and applicable privacy law, you have the following rights regarding
          your personal information:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>Right of access</strong> — You may request a copy of the personal information we hold about you.
          </li>
          <li>
            <strong>Right to rectification</strong> — You may request correction of inaccurate or incomplete information.
            You can update your profile directly within your account settings.
          </li>
          <li>
            <strong>Right to erasure</strong> — You may request deletion of your personal information, subject to applicable
            legal retention requirements. See Section 11 below.
          </li>
          <li>
            <strong>Right to withdraw consent</strong> — Where we process your data based on consent (e.g. optional browser
            storage), you may withdraw consent at any time via Cookie Preferences without affecting prior processing.
          </li>
          <li>
            <strong>Right to object</strong> — You may object to certain processing activities, including processing based
            on legitimate interests.
          </li>
          <li>
            <strong>Right to data portability</strong> — Where applicable, you may request your farm data in a portable format.
          </li>
        </ul>
        <p>
          To exercise any of these rights, please contact us at{' '}
          <a href="mailto:privacy@poultrypro.ng" className="text-emerald-600 hover:underline">privacy@poultrypro.ng</a>{' '}
          or <a href="mailto:support@poultrypro.ng" className="text-emerald-600 hover:underline">support@poultrypro.ng</a>.
          We will respond to verified requests within a reasonable timeframe.
        </p>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg text-xs">
          <strong>[To Be Confirmed]:</strong> The privacy email address requires confirmation from the business owner.
        </p>
      </Section>

      <Section id="account-deletion" number="11" title="Account Deletion and Data Removal">
        <p>
          You may request deletion of your PoultryPro account by contacting our support team at{' '}
          <a href="mailto:support@poultrypro.ng" className="text-emerald-600 hover:underline">support@poultrypro.ng</a>.
        </p>
        <p>Upon receiving a deletion request:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>We will verify your identity as the registered account holder</li>
          <li>We will delete or anonymise your personal account information</li>
          <li>Your farm records will be deleted or rendered non-identifiable</li>
          <li>Payment transaction references may be retained for legal and financial audit purposes</li>
        </ul>
        <p>
          We recommend that you export any farm data you need before submitting a deletion request, as account deletion
          cannot be reversed.
        </p>
        <p>
          <strong>Note:</strong> A self-service account deletion feature is not currently available within the PoultryPro
          platform. Requests are processed manually by the support team.
        </p>
      </Section>

      <Section id="international-transfers" number="12" title="International Data Transfers">
        <p>
          PoultryPro uses Supabase for database services and Vercel for hosting. These services operate infrastructure in
          multiple geographic regions. Your data may be stored or processed outside Nigeria as part of these services.
        </p>
        <p>
          We rely on Supabase and Vercel's compliance with applicable international data transfer standards and their own
          privacy commitments. We have not independently verified the specific regions in which your data is processed.
        </p>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg text-xs">
          <strong>[To Be Confirmed]:</strong> International data transfer arrangements should be reviewed against NDPA
          requirements and confirmed with a qualified legal professional before publication.
        </p>
      </Section>

      <Section id="childrens-privacy" number="13" title="Children's Privacy">
        <p>
          PoultryPro is a professional farm management platform intended for use by adults engaged in poultry farming
          or farm management.
        </p>
        <p>
          We do not knowingly collect personal information from children. If you believe that a child has registered an
          account without appropriate parental or guardian consent, please contact us at{' '}
          <a href="mailto:support@poultrypro.ng" className="text-emerald-600 hover:underline">support@poultrypro.ng</a>{' '}
          and we will take appropriate action.
        </p>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg text-xs">
          <strong>[To Be Confirmed]:</strong> Specific minimum age requirements should be established by the business owner
          and confirmed by a legal professional before publication.
        </p>
      </Section>

      <Section id="cookies" number="14" title="Cookies and Similar Technologies">
        <p>
          PoultryPro uses cookies and similar browser storage technologies for authentication, security, and optional
          interface preferences. We do not use third-party advertising or analytics tracking technologies.
        </p>
        <p>
          For detailed information about how we use browser storage and how you can manage your preferences, please read
          our{' '}
          <Link to="/cookie-policy" className="text-emerald-600 hover:underline font-semibold">Cookie Policy</Link>.
        </p>
      </Section>

      <Section id="policy-updates" number="15" title="Privacy Policy Updates">
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our data practices, applicable law,
          or our services. When we make material changes, we will:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Update the version number and last updated date at the top of this page</li>
          <li>Where reasonably practicable, notify registered users by email or through a platform notification</li>
        </ul>
        <p>
          We encourage you to review this Privacy Policy periodically. Continued use of PoultryPro after changes take
          effect constitutes your acceptance of the updated policy.
        </p>
      </Section>

      <Section id="contact" number="16" title="Contact Information">
        <p>
          If you have questions, concerns, or requests related to this Privacy Policy or your personal data, please
          contact us:
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
          <p>
            <strong className="text-slate-900">General Enquiries:</strong>{' '}
            <a href="mailto:hello@poultrypro.ng" className="text-emerald-600 hover:underline">hello@poultrypro.ng</a>
          </p>
        </div>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg text-xs mt-3">
          <strong>[To Be Confirmed]:</strong> The business postal address, registered business name, and privacy contact
          details require confirmation from the business owner before publication.
        </p>
      </Section>
    </LegalPageLayout>
  );
}
