import React from 'react';
import LegalPageLayout from '../../components/legal/LegalPageLayout';
import { Link } from 'react-router-dom';

const SECTIONS = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'eligibility', title: 'Eligibility' },
  { id: 'account-registration', title: 'Account Registration' },
  { id: 'account-security', title: 'Account Security' },
  { id: 'services', title: 'PoultryPro Services' },
  { id: 'farmer-responsibilities', title: 'Farmer Responsibilities' },
  { id: 'subscription-plans', title: 'Subscription Plans' },
  { id: 'payments-billing', title: 'Payments and Billing' },
  { id: 'data-ownership', title: 'Farmer Data Ownership' },
  { id: 'acceptable-use', title: 'Acceptable Use' },
  { id: 'veterinary-disclaimer', title: 'Veterinary Disclaimer' },
  { id: 'service-availability', title: 'Service Availability' },
  { id: 'limitation-of-liability', title: 'Limitation of Liability' },
  { id: 'account-suspension', title: 'Account Suspension & Termination' },
  { id: 'account-deletion', title: 'Account Deletion' },
  { id: 'changes-to-terms', title: 'Changes to Terms' },
  { id: 'governing-law', title: 'Governing Law' },
  { id: 'contact', title: 'Contact Information' },
];

function Section({ id, number, title, children }) {
  return (
    <section id={id} className="mb-8 sm:mb-10 scroll-mt-28 sm:scroll-mt-24">
      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-3 sm:mb-4 flex items-start sm:items-center gap-2 sm:gap-2.5">
        <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black shrink-0 mt-0.5 sm:mt-0">{number}</span>
        <span className="leading-tight">{title}</span>
      </h2>
      <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermsOfService() {
  return (
    <LegalPageLayout
      pageTitle="Terms of Service"
      pageSlug="terms-of-service"
      description="Please read these Terms of Service carefully before creating an account or using the PoultryPro platform. By registering, you agree to be bound by these terms."
      version="1.0"
      effectiveDate="[To Be Confirmed — Pending Legal Review]"
      lastUpdated="October 2026"
      sections={SECTIONS}
    >
      <Section id="introduction" number="1" title="Introduction">
        <p>
          Welcome to <strong>PoultryPro</strong>. PoultryPro is a digital poultry farm management platform designed to assist
          poultry farmers in Nigeria and beyond to manage their farm operations, maintain structured records, monitor flock
          health and performance, and organise their poultry businesses more effectively.
        </p>
        <p>
          These Terms of Service ("<strong>Terms</strong>") govern your access to and use of the PoultryPro website and
          platform (collectively, the "<strong>Service</strong>"). The Service is operated by PoultryPro ("<strong>we</strong>",
          "<strong>us</strong>", or "<strong>our</strong>").
        </p>
        <p>
          By creating an account or using the Service, you confirm that you have read, understood, and agreed to these Terms.
          If you do not agree, you must not create an account or use the Service.
        </p>
      </Section>

      <Section id="acceptance" number="2" title="Acceptance of Terms">
        <p>
          By accessing or using PoultryPro, you agree to be legally bound by these Terms and our{' '}
          <Link to="/privacy-policy" className="text-emerald-600 hover:underline font-semibold">Privacy Policy</Link>. If you
          are using the platform on behalf of a farm or business, you confirm that you have authority to bind that organisation
          to these Terms.
        </p>
        <p>
          A required agreement checkbox is presented during registration. Completing registration constitutes your agreement to
          these Terms. Your agreement is recorded alongside your account.
        </p>
      </Section>

      <Section id="eligibility" number="3" title="Eligibility">
        <p>
          You may create a PoultryPro account if you are a poultry farmer, farm manager, or agricultural professional who
          operates or manages a poultry farm and who intends to use the platform for lawful farm management purposes.
        </p>
        <p>
          You must be capable of entering into a legally binding agreement under applicable Nigerian law. By registering,
          you confirm that you meet these requirements.
        </p>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg text-xs">
          <strong>Placeholder:</strong> Specific eligibility criteria, including minimum age requirements, should be confirmed
          by a qualified legal professional before these Terms are published.
        </p>
      </Section>

      <Section id="account-registration" number="4" title="Account Registration">
        <p>To use PoultryPro, you must register an account. During registration, you are required to provide:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Your full name</li>
          <li>A valid email address</li>
          <li>A phone number (optional at registration)</li>
          <li>Your farm name</li>
          <li>A secure password</li>
          <li>The poultry types you manage</li>
        </ul>
        <p>
          You must provide accurate, current, and complete information. If you provide information that is false, inaccurate,
          or incomplete, we may suspend or terminate your account.
        </p>
        <p>
          Your account is personal to you. You must not allow others to use your account credentials. You are responsible for
          all activities conducted through your account.
        </p>
        <p>
          Account registration is processed through Supabase Authentication. Depending on platform configuration, email
          verification may be required before your account becomes active.
        </p>
      </Section>

      <Section id="account-security" number="5" title="Account Security">
        <p>
          You are responsible for maintaining the confidentiality of your account password and for all activities that occur
          under your account. You must:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Choose a strong, unique password</li>
          <li>Not share your password with others</li>
          <li>Notify us immediately if you suspect any unauthorised access to your account</li>
          <li>Log out from shared devices after each session</li>
        </ul>
        <p>
          If you forget your password, you can initiate a password reset using the <strong>Forgot Password</strong> feature,
          which will send a reset link to your registered email address via Supabase's email authentication system.
        </p>
        <p>
          We will not be liable for any loss or damage arising from your failure to maintain appropriate account security.
        </p>
      </Section>

      <Section id="services" number="6" title="PoultryPro Services">
        <p>PoultryPro provides the following farm management features to registered farmers:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Flock Management</strong> — Record and monitor flock batches, bird counts, breeds, ages, and housing</li>
          <li><strong>Daily Farm Records</strong> — Log daily feed consumption, egg collections, and routine activities</li>
          <li><strong>Egg Production Records</strong> — Track egg production per flock and analyse collection trends</li>
          <li><strong>Feed Management</strong> — Monitor feed purchases, consumption, and current stock levels</li>
          <li><strong>Vaccination Records</strong> — Schedule and record vaccination activities per flock</li>
          <li><strong>Medication Records</strong> — Log medication courses, dosage, and treatment outcomes</li>
          <li><strong>Mortality Tracking</strong> — Record bird deaths, causes, and calculate mortality rates</li>
          <li><strong>Inventory Management</strong> — Track farm supplies, equipment, and stock levels</li>
          <li><strong>Sales Management</strong> — Record bird and egg sales, manage customer records, and track revenue</li>
          <li><strong>Expense Tracking</strong> — Log operating expenses and monitor cash flow</li>
          <li><strong>Farm Analytics</strong> — Review performance reports, production trends, and profitability summaries</li>
        </ul>
        <p>
          Available features depend on your active subscription plan. Features marked as unavailable on your plan will be
          indicated within the platform.
        </p>
      </Section>

      <Section id="farmer-responsibilities" number="7" title="Farmer Responsibilities">
        <p>By using PoultryPro, you accept responsibility for:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Providing accurate and complete farm information when setting up your account and recording activities</li>
          <li>Maintaining appropriate records and updating them regularly to reflect actual farm conditions</li>
          <li>Using the platform only for lawful farm management purposes</li>
          <li>Protecting your account credentials and preventing unauthorised access</li>
          <li>Making your own independent farm management and animal health decisions</li>
          <li>Complying with all applicable Nigerian laws and regulations governing poultry farming</li>
          <li>Ensuring that data you record does not infringe upon the rights of others</li>
        </ul>
      </Section>

      <Section id="subscription-plans" number="8" title="Subscription Plans">
        <p>PoultryPro offers the following subscription plans. Prices are displayed in Nigerian Naira (₦).</p>

        <div className="overflow-x-auto mt-4 mb-4">
          <p className="text-[11px] text-slate-500 sm:hidden mb-1.5 flex items-center gap-1 font-medium">
            <span>⇄ Swipe horizontally to view full table</span>
          </p>
          <table className="min-w-[620px] w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Plan</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Monthly</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Annual</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Max Flocks</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Max Birds</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Poultry Types</th>
                <th className="text-left px-4 py-3 font-bold text-slate-700">Staff Accounts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-white">
                <td className="px-4 py-3 font-bold text-slate-900">Basic</td>
                <td className="px-4 py-3">₦2,500/mo</td>
                <td className="px-4 py-3">₦25,000/yr</td>
                <td className="px-4 py-3">3</td>
                <td className="px-4 py-3">500</td>
                <td className="px-4 py-3">1</td>
                <td className="px-4 py-3">1</td>
              </tr>
              <tr className="bg-blue-50/50">
                <td className="px-4 py-3 font-bold text-blue-900">Pro</td>
                <td className="px-4 py-3">₦5,000/mo</td>
                <td className="px-4 py-3">₦50,000/yr</td>
                <td className="px-4 py-3">15</td>
                <td className="px-4 py-3">5,000</td>
                <td className="px-4 py-3">3</td>
                <td className="px-4 py-3">5</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-bold text-slate-900">Enterprise</td>
                <td className="px-4 py-3">₦12,000/mo</td>
                <td className="px-4 py-3">₦120,000/yr</td>
                <td className="px-4 py-3">Unlimited</td>
                <td className="px-4 py-3">Unlimited</td>
                <td className="px-4 py-3">Unlimited</td>
                <td className="px-4 py-3">Unlimited</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          All plans include a <strong>14-day unconditional free trial</strong> that begins on the date your account is
          successfully created. No payment is required to start your trial. You have full access to all features included in
          your selected plan during the trial period.
        </p>
        <p>
          Subscription plan limits and features are subject to change. Any changes will be communicated in advance and will
          not take effect during an active paid subscription period without notice.
        </p>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg text-xs">
          <strong>Note:</strong> These prices reflect the current default plan catalog. Administrators may update plan pricing.
          The most current prices are always displayed on the PoultryPro{' '}
          <a href="/#pricing" className="text-amber-700 underline">Pricing page</a>.
        </p>
      </Section>

      <Section id="payments-billing" number="9" title="Payments and Billing">
        <p>
          After your 14-day free trial expires, continued access to paid plan features requires an active subscription.
          Subscription payments are processed via <strong>Paystack</strong>, a third-party payment gateway.
        </p>
        <p>
          When you choose to subscribe, you will be directed to the Paystack payment interface where you can pay securely by
          card or bank transfer. Your subscription is activated only after successful payment verification by the PoultryPro
          platform.
        </p>
        <h3 className="font-bold text-slate-900 text-sm mt-4 mb-2">Renewal</h3>
        <p>
          PoultryPro does not currently operate automatic subscription renewals. When your subscription period ends, you
          will need to manually renew through the <strong>Subscription</strong> section in your account settings.
        </p>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg text-xs">
          <strong>[To Be Confirmed]:</strong> The renewal process, including whether automatic renewal will be introduced in
          future, requires confirmation from the PoultryPro business team before these Terms are published.
        </p>
        <h3 className="font-bold text-slate-900 text-sm mt-4 mb-2">Cancellation</h3>
        <p>
          You may stop using the platform at any time. If you do not renew your subscription after it expires, your account
          will revert to a restricted view-only state. Your existing farm data, flock history, and records will remain
          accessible for viewing.
        </p>
        <h3 className="font-bold text-slate-900 text-sm mt-4 mb-2">Refunds</h3>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg text-xs">
          <strong>[To Be Confirmed]:</strong> PoultryPro's refund policy has not yet been formally established. The business
          owner must confirm whether refunds will be offered, under what circumstances, and within what timeframe before
          these Terms are published.
        </p>
        <h3 className="font-bold text-slate-900 text-sm mt-4 mb-2">Failed Payments</h3>
        <p>
          If a payment attempt is unsuccessful, your subscription will not be activated or renewed until a successful payment
          is completed. PoultryPro is not responsible for payment failures caused by your payment provider or bank.
        </p>
      </Section>

      <Section id="data-ownership" number="10" title="Farmer Data Ownership">
        <p>
          You retain full ownership of the farm records, data, and information that you submit to PoultryPro. We do not claim
          any ownership rights over your farm data.
        </p>
        <p>
          By using PoultryPro, you grant us a limited, non-exclusive licence to store, process, and display your data as
          necessary to provide the Service to you. This licence is solely for the purpose of operating and improving the
          platform and does not extend to selling or sharing your data with third parties for commercial purposes beyond
          those described in our{' '}
          <Link to="/privacy-policy" className="text-emerald-600 hover:underline font-semibold">Privacy Policy</Link>.
        </p>
      </Section>

      <Section id="acceptable-use" number="11" title="Acceptable Use">
        <p>You agree not to use PoultryPro to:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Access or attempt to access another user's account without authorisation</li>
          <li>Submit false, fraudulent, or misleading information to the platform</li>
          <li>Interfere with or disrupt platform operations, servers, or networks</li>
          <li>Attempt to reverse-engineer, scrape, or extract platform data</li>
          <li>Use the platform for any unlawful purpose under Nigerian law</li>
          <li>Transmit malicious code, viruses, or other harmful software</li>
          <li>Misuse other users' personal information</li>
        </ul>
        <p>
          We reserve the right to investigate and take appropriate action against violations, including restricting, suspending,
          or terminating accounts.
        </p>
      </Section>

      <Section id="veterinary-disclaimer" number="12" title="Veterinary and Agricultural Disclaimer">
        <p>
          PoultryPro is a farm recordkeeping, monitoring, and management platform. The tools and information available through
          the platform — including flock health tracking, vaccination reminders, and mortality records — are intended to
          support your farm management decisions and help you maintain organised records.
        </p>
        <p>
          <strong>PoultryPro does not provide veterinary, agricultural, or animal health advice.</strong> The platform is not
          a substitute for consultation with a qualified veterinarian or agricultural professional. You remain solely
          responsible for consulting appropriate professionals when making important decisions about poultry health, disease
          prevention, medication, and treatment.
        </p>
        <p>
          PoultryPro expressly disclaims any liability for decisions made in reliance on data recorded or displayed within
          the platform.
        </p>
      </Section>

      <Section id="service-availability" number="13" title="Service Availability">
        <p>
          We strive to maintain continuous availability of the PoultryPro platform. However, access may be temporarily
          interrupted due to:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Scheduled maintenance and platform updates</li>
          <li>Unexpected technical issues or server outages</li>
          <li>Third-party service disruptions (including Supabase or Vercel)</li>
          <li>Circumstances beyond our reasonable control</li>
        </ul>
        <p>
          We do not guarantee uninterrupted, error-free access to the platform. We will endeavour to notify users of scheduled
          maintenance in advance where reasonably practicable.
        </p>
      </Section>

      <Section id="limitation-of-liability" number="14" title="Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable Nigerian law, PoultryPro and its operators shall not be liable for
          any indirect, incidental, consequential, or punitive losses arising from your use of or inability to access the
          platform, including but not limited to:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Loss of farm data due to technical failures, provided we have taken reasonable precautions</li>
          <li>Financial losses arising from decisions made based on farm records or analytics in the platform</li>
          <li>Losses caused by third-party services (Supabase, Vercel, Paystack) that are outside our direct control</li>
        </ul>
        <p>
          Nothing in these Terms limits or excludes liability for death or personal injury caused by our negligence, fraud, or
          any other liability that cannot lawfully be excluded.
        </p>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg text-xs">
          <strong>[To Be Confirmed]:</strong> This limitation of liability clause should be reviewed by a qualified Nigerian
          legal professional to ensure it complies with applicable consumer protection and commercial law requirements before
          publication.
        </p>
      </Section>

      <Section id="account-suspension" number="15" title="Account Suspension and Termination">
        <p>We may restrict, suspend, or terminate your account if:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>You breach these Terms</li>
          <li>You engage in fraudulent, abusive, or unlawful conduct</li>
          <li>Your account is used to compromise platform security or other users' accounts</li>
          <li>You provide materially false information during registration</li>
          <li>Your subscription has expired and you are in a restricted access state</li>
        </ul>
        <p>
          Where reasonably practicable, we will notify you of the reason for any suspension or termination. You may contact
          us at <a href="mailto:support@poultrypro.ng" className="text-emerald-600 hover:underline">support@poultrypro.ng</a> to
          appeal a suspension decision.
        </p>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg text-xs">
          <strong>[To Be Confirmed]:</strong> The official support email address and appeals process require confirmation from
          the business owner before publication.
        </p>
      </Section>

      <Section id="account-deletion" number="16" title="Account Deletion">
        <p>
          You may request deletion of your PoultryPro account at any time by contacting us at{' '}
          <a href="mailto:support@poultrypro.ng" className="text-emerald-600 hover:underline">support@poultrypro.ng</a>.
        </p>
        <p>When we receive a deletion request, we will:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Verify your identity as the registered account holder</li>
          <li>Process the request within a reasonable timeframe</li>
          <li>Delete or anonymise your personal account information</li>
          <li>Retain any records that we are required to keep under applicable law or for legitimate business purposes</li>
        </ul>
        <p>
          Please note that some farm data records may be retained in anonymised or aggregated form for platform analytics
          purposes, where individual identification is not possible.
        </p>
        <p>
          We recommend that you export any farm records you wish to retain before requesting deletion, as this process is
          not reversible.
        </p>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg text-xs">
          <strong>[To Be Confirmed]:</strong> The self-service account deletion feature is not currently implemented in the
          platform. Account deletion requests are currently handled manually by the PoultryPro support team. A dedicated
          self-service deletion function may be added in future updates.
        </p>
      </Section>

      <Section id="changes-to-terms" number="17" title="Changes to Terms">
        <p>
          We may update these Terms from time to time to reflect changes in our services, applicable law, or our business
          practices. When we make material changes, we will:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Update the version number and last updated date at the top of this page</li>
          <li>Where reasonably practicable, notify registered users by email or through a platform notification</li>
        </ul>
        <p>
          Your continued use of PoultryPro after the effective date of updated Terms constitutes your acceptance of those
          changes. If you do not agree to updated Terms, you should stop using the platform and may request account deletion.
        </p>
      </Section>

      <Section id="governing-law" number="18" title="Governing Law">
        <p>
          These Terms are intended to be governed by and construed in accordance with the laws of the Federal Republic of
          Nigeria.
        </p>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg text-xs">
          <strong>[To Be Confirmed]:</strong> The governing law, jurisdiction, and dispute resolution mechanism (including
          whether to specify arbitration, mediation, or court jurisdiction) should be confirmed by a qualified Nigerian legal
          professional before these Terms are published.
        </p>
      </Section>

      <Section id="contact" number="19" title="Contact Information">
        <p>If you have questions, concerns, or requests related to these Terms of Service, please contact us:</p>
        <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm space-y-2">
          <p><strong className="text-slate-900">Platform:</strong> PoultryPro</p>
          <p>
            <strong className="text-slate-900">Support Email:</strong>{' '}
            <a href="mailto:support@poultrypro.ng" className="text-emerald-600 hover:underline">support@poultrypro.ng</a>
          </p>
          <p>
            <strong className="text-slate-900">General Enquiries:</strong>{' '}
            <a href="mailto:hello@poultrypro.ng" className="text-emerald-600 hover:underline">hello@poultrypro.ng</a>
          </p>
        </div>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg text-xs mt-3">
          <strong>[To Be Confirmed]:</strong> The business postal address, registered business name, and company registration
          details should be provided by the business owner and included here before publication.
        </p>
      </Section>
    </LegalPageLayout>
  );
}
