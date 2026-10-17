# PoultryPro Admin Dashboard: Subscription Management System

## Project Overview

Update the existing PoultryPro Admin Dashboard by implementing a professional, fully functional **Subscription Management System**.

Administrators must be able to manage subscription plans, monitor farmers' subscriptions, track payments, analyse subscription revenue, manage free trials, and configure subscription settings.

The subscription system must integrate with the existing farmer dashboard and use the same subscription data.

### Technology Stack

- React.js
- Tailwind CSS
- JavaScript
- Existing backend and database architecture

### Brand Colours

| Role | Hex |
| --- | --- |
| Primary Green | `#15803D` |
| Secondary Blue | `#2563EB` |
| Background | `#F8FAF9` |
| Text | `#1F2937` |

### Design Requirements

- Professional SaaS admin dashboard.
- Clean and modern interface.
- No gradients.
- Fully responsive design.
- Consistent with the existing PoultryPro admin interface.
- Do not use Lucide React icons.
- Maintain the existing sidebar navigation.

---

## Table of Contents

1. [Admin Sidebar and Subscription Page Structure](#1-admin-sidebar--subscription-page-structure)
2. [Subscription Overview Tab](#2-subscription-overview-tab)
3. [Subscription Plans Tab](#3-subscription-plans-tab)
4. [Farmers' Subscriptions Tab](#4-farmers-subscriptions-tab)
5. [Free Trial Management Tab](#5-free-trial-management-tab)
6. [Subscription Settings Tab](#6-subscription-settings-tab)
7. [Payments & Transactions (Separate Sidebar Page)](#7-payments--transactions--separate-sidebar-page)
8. [Revenue Analytics (Separate Sidebar Page)](#8-revenue-analytics--separate-sidebar-page)
9. [Admin Notifications](#9-admin-notifications)
10. [Admin Roles & Security](#10-admin-roles--security)
11. [Farmer Dashboard Integration](#11-farmer-dashboard-integration)
12. [UI/UX Requirements](#12-uiux-requirements)
13. [Backend & Database Integration](#13-backend--database-integration)
14. [Functionality & Testing](#14-functionality--testing)
15. [Important Implementation Instructions](#15-important-implementation-instructions)
16. [Final Objective](#final-objective)

---

## 1. Admin Sidebar & Subscription Page Structure

### A. Admin Sidebar

Maintain the existing admin sidebar design and navigation. The following must remain **three separate sidebar menu items**:

1. Subscriptions
2. Payments & Transactions
3. Revenue Analytics

Do not place Payments & Transactions or Revenue Analytics inside the Subscriptions page. They must remain independent sidebar navigation items.

```text
ADMIN SIDEBAR
│
├── Dashboard
├── Farmers
├── Farms
├── Subscriptions
├── Payments & Transactions
├── Revenue Analytics
├── Settings
└── Other Existing Menu Items
```

Preserve the existing sidebar's appearance, behaviour, and responsive functionality.

### B. Subscription Management Page

Clicking **Subscriptions** opens a dedicated Subscription Management page.

- **Title:** Subscription Management
- **Description:** Manage subscription plans, monitor farmers' subscriptions, track free trials, and configure subscription settings.

Below the header, add a professional horizontal tab navigation with five tabs:

1. Subscription Overview
2. Subscription Plans
3. Farmers' Subscriptions
4. Free Trial Management
5. Subscription Settings

```text
SUBSCRIPTION MANAGEMENT
│
├── Overview
├── Subscription Plans
├── Farmers' Subscriptions
├── Free Trial Management
└── Subscription Settings
```

#### Tab Navigation Requirements

- All five sections exist within the same Subscription Management page.
- Clicking a tab displays its corresponding content.
- Navigation happens without a full-page refresh.
- Highlight the active tab using PoultryPro's green brand colour.
- Maintain the selected tab when navigating back, where practical.
- Make the tab navigation responsive, with horizontal scrolling on smaller screens.
- Do not create separate sidebar items for these five sections.
- Preserve all existing subscription functionality.

#### Important Navigation Rules

- **Payments & Transactions** and **Revenue Analytics** remain separate sidebar menu items.
- Do not duplicate their full interfaces inside the Subscription Management page.
- The Subscription Overview may display summary metrics such as revenue and pending payments.
- Quick-action buttons such as **View Payments** navigate to the existing Payments & Transactions page.

---

## 2. Subscription Overview Tab

Give administrators a complete summary of PoultryPro's subscription performance.

### A. Summary Cards

| Card | Definition |
| --- | --- |
| Total Subscribers | Total farmers with subscription records, with percentage change versus the previous period |
| Active Subscriptions | Farmers with active paid subscriptions |
| Trial Users | Farmers currently using the 14-day free trial |
| Expired Subscriptions | Subscriptions that have expired |
| Monthly Recurring Revenue (MRR) | Total normalised monthly recurring subscription revenue |
| Annual Recurring Revenue (ARR) | MRR multiplied by 12 |
| Pending Payments | Payments awaiting verification |
| Cancelled Subscriptions | Cancelled subscriptions |

### B. Subscription Distribution

Show the number of farmers subscribed to Starter, Professional, and Enterprise using a professional bar chart or doughnut chart.

### C. Recent Subscription Activities

| Farmer | Subscription Plan | Activity | Date | Status |
| --- | --- | --- | --- | --- |
| Farmer Name | Starter | New Subscription | Date | Active |
| Farmer Name | Professional | Renewal | Date | Successful |
| Farmer Name | Enterprise | Cancellation | Date | Cancelled |

Use actual subscription records rather than hardcoded demonstration data.

### D. Quick Actions

Functional buttons for:

- View All Subscriptions
- Manage Plans
- View Payments (navigates to the Payments & Transactions sidebar page)
- View Expiring Subscriptions

---

## 3. Subscription Plans Tab

Administrators can view and manage all subscription plans. There must be exactly **three** publicly available paid plans.

### A. Starter Plan

**₦2,500 / month** · **₦25,000 / year**

- Maximum of 3 active flocks.
- Maximum capacity of 500 birds.
- 1 poultry type.
- Feed management.
- Health and mortality tracking.
- Egg production management.
- Basic financial management.
- Basic reports and analytics.
- Vaccination reminders.
- 1 staff account.
- Single farm location.

### B. Professional Plan (Most Popular)

**₦5,000 / month** · **₦50,000 / year**

- Maximum of 15 active flocks.
- Maximum capacity of 5,000 birds.
- Up to 3 poultry types.
- All Starter features.
- Advanced financial management.
- Advanced reports and analytics.
- Farm profitability analysis.
- Up to 5 staff accounts.
- Data export.
- Priority support.
- Single farm location.

Mark Professional as **Most Popular**.

### C. Enterprise Plan

**₦12,000 / month** · **₦120,000 / year**

- Unlimited active flocks.
- Unlimited bird capacity.
- Unlimited poultry types.
- All Professional features.
- Comprehensive farm analytics.
- Unlimited staff accounts.
- Multiple farm locations.
- Advanced profitability insights.
- Priority customer support.
- Complete data export.

### D. Plan Management Actions

Each plan offers:

- View Plan
- Edit Plan
- Update Monthly Price
- Update Annual Price
- Edit Feature Limits
- Enable or Disable Plan
- View Subscribers

Editing opens a professional modal or dedicated editing interface within the Subscription Management page. Administrators can modify:

- Plan name and description.
- Monthly and annual price.
- Maximum active flocks.
- Maximum bird capacity.
- Maximum poultry types.
- Maximum staff accounts.
- Maximum farm locations.
- Available features.

### Important Rules

1. Do not introduce a permanent Free plan.
2. All three plans must remain paid.
3. Do not allow negative subscription prices.
4. Validate all feature limits before saving.
5. Show a confirmation dialog before major changes.
6. Display a success notification after updates.
7. Synchronise approved changes with the farmer-facing pricing page.
8. Preserve existing subscriptions when plan pricing changes.
9. Apply new pricing to existing subscribers only according to their agreed billing terms and applicable notice requirements.

---

## 4. Farmers' Subscriptions Tab

Display all farmers and their subscription details.

### A. Subscription Table

| Column | Description |
| --- | --- |
| Farmer Name | Registered farmer |
| Email | Farmer's email address |
| Farm Name | Registered farm |
| Plan | Starter, Professional, or Enterprise |
| Billing Cycle | Monthly or Annual |
| Amount | Subscription price |
| Start Date | Subscription activation date |
| Expiry Date | Subscription expiration date |
| Status | Current subscription status |
| Actions | View and manage subscription |

### B. Subscription Status

Supported statuses, each with a clearly differentiated badge:

- Active
- Trial
- Expired
- Cancelled
- Past Due
- Pending Activation

### C. Search and Filters

- Search by farmer name, email, and farm name.
- Filter by subscription plan.
- Filter by subscription status.
- Filter by billing cycle.
- Filter by registration date.

### D. Farmer Subscription Details

Clicking **View Details** displays:

**Farmer Information:** name, email address, farm name, registration date.

**Subscription Information:** current plan, billing cycle, status, activation date, renewal date, expiration date, automatic renewal status.

**Subscription Usage:** active flocks, total active birds, poultry types, staff accounts, farm locations.

**Payment Information:** total payments, last payment, payment history, outstanding payments.

### E. Admin Actions

Authorised administrators can:

- View subscription details.
- Change a farmer's subscription plan.
- Extend a subscription.
- Cancel a subscription.
- Reactivate an eligible subscription.
- View payment history.
- Review subscription activity.

Every administrative modification must:

1. Require confirmation.
2. Be validated by the backend.
3. Update the farmer's dashboard.
4. Create an audit log.
5. Preserve existing farm data.

Administrators must not be able to mark an unverified payment as successful.

---

## 5. Free Trial Management Tab

Manage PoultryPro's 14-day free trial.

### A. Trial Overview

- Total Trial Users
- Active Trials
- Expired Trials
- Trials Converted to Paid
- Trial Conversion Rate

### B. Trial Users Table

| Farmer | Selected Plan | Trial Start | Trial End | Days Remaining | Status |
| --- | --- | --- | --- | --- | --- |

### C. Trial Management Features

- View trial users.
- Monitor trial expiration dates.
- View trial-to-paid conversions.
- Extend a trial for an individual farmer.
- Review expired trials.
- Monitor trial usage.

### D. Trial Rules

1. Every eligible new farmer receives one 14-day trial.
2. A trial does not constitute a permanent Free subscription.
3. Trial users must select Starter, Professional, or Enterprise.
4. Trial access follows the selected plan's feature limits.
5. Trial extensions require authorised administrative action.
6. Trial extensions must be recorded in the audit log.
7. Expired trials must not delete existing farm records.
8. Farmers must activate a paid subscription to continue using restricted features after trial expiration.

---

## 6. Subscription Settings Tab

Configure subscription policies.

### A. General Settings

- Enable or disable new subscriptions.
- Enable or disable free trials.
- Configure trial duration.
- Enable or disable annual billing.
- Configure subscription renewal reminders.
- Configure subscription expiration reminders.

### B. Renewal Settings

- Automatic renewal availability.
- Renewal notification timing.
- Failed payment retry policy.
- Subscription grace period.

### C. Notification Settings

Configure notifications for:

- Successful subscription activation.
- Upcoming subscription expiration.
- Successful renewal.
- Failed payment.
- Subscription cancellation.
- Trial expiration.
- Subscription plan changes.

### D. Payment Settings

Display payment gateway status, supported payment methods, payment currency (NGN), and payment verification status.

Sensitive payment credentials must be managed securely through backend configuration, not exposed in the admin frontend.

---

## 7. Payments & Transactions: Separate Sidebar Page

> **Important:** This must remain an independent sidebar page. It must not appear as a tab inside Subscriptions.

Maintain or update the existing Payments & Transactions page.

### A. Payment Summary Cards

- Total Payments Received
- Successful Payments
- Pending Payments
- Failed Payments
- Refunded Payments

### B. Transactions Table

| Column | Description |
| --- | --- |
| Transaction ID | Unique payment reference |
| Farmer | Farmer who initiated payment |
| Plan | Subscription plan |
| Billing Cycle | Monthly or Annual |
| Amount | Amount paid |
| Payment Method | Payment channel |
| Payment Date | Transaction date |
| Status | Payment status |
| Actions | View transaction |

### C. Payment Status

Successful, Pending, Failed, Refunded.

### D. Payment Features

- Search transactions.
- Filter by payment status, subscription plan, and date range.
- View transaction details.
- Download receipts.
- Export transaction reports.

### E. Paystack Integration

Use the existing payment integration where available. Ensure that:

- Payment verification occurs securely on the backend.
- Payment references are unique.
- Duplicate webhook events do not create duplicate transactions.
- Subscription activation occurs only after verified payment.
- Failed transactions do not activate subscriptions.
- Payment secrets are never exposed in frontend code.
- Refunds are processed only through authorised payment workflows.

---

## 8. Revenue Analytics: Separate Sidebar Page

> **Important:** Revenue Analytics must remain an independent sidebar page. It must not appear as a tab inside Subscriptions.

Maintain or update the existing Revenue Analytics page.

### A. Revenue Overview

- Total Revenue
- Monthly Revenue
- Annual Revenue
- Monthly Recurring Revenue
- Annual Recurring Revenue
- Average Revenue Per Paying Subscriber
- Subscription Churn Rate
- Trial-to-Paid Conversion Rate

### B. Revenue Charts

- **Revenue Over Time:** line chart with filters for last 7 days, 30 days, 90 days, 12 months, and a custom date range.
- **Revenue by Subscription Plan:** Starter, Professional, Enterprise.
- **Monthly vs Annual Subscriptions:** distribution of billing cycles.
- **Subscription Growth:** new paying subscribers over time.

### C. Analytics Requirements

- Use actual transaction and subscription data.
- Display all financial values in Nigerian Naira.
- Clearly distinguish recognised revenue, collected payments, and recurring revenue.
- Exclude free-trial users from paying-subscriber metrics.
- Do not count failed or pending payments as revenue.
- Avoid counting the full annual subscription price as monthly recurring revenue.
- Provide appropriate loading and empty states.

---

## 9. Admin Notifications

Integrate subscription-related notifications into the existing admin notification system. Administrators are notified when:

- A farmer purchases a subscription.
- A subscription expires.
- A subscription is cancelled.
- A payment fails.
- A trial converts to a paid subscription.
- A payment requires administrative review.

Each notification links to the relevant subscription or transaction record.

---

## 10. Admin Roles & Security

Subscription management actions are protected by the existing authentication and role-based access control system.

### A. Permissions

| Role | Permissions |
| --- | --- |
| **Super Admin** | Full subscription management, plan pricing configuration, subscription policy management, authorised subscription adjustments |
| **Admin** | View subscriptions, monitor payments, view analytics, perform explicitly authorised subscription actions |
| **Support Staff** | View permitted subscription information, assist farmers with enquiries; no access to modify prices or payment verification records |

All sensitive operations must be authorised by the backend.

### B. Audit Logs

Record:

- Administrator performing the action.
- Action performed.
- Affected subscription.
- Previous value.
- Updated value.
- Date and time.
- Reason for modification, where applicable.

---

## 11. Farmer Dashboard Integration

The admin subscription system must connect directly with the farmer-facing subscription system. When an administrator updates a farmer's subscription:

- The farmer dashboard reflects the authorised change.
- Subscription limits update correctly.
- Newly available features become accessible.
- Restricted features follow the updated plan.
- Subscription dates remain accurate.
- Existing farm records remain intact.

Do not create separate, conflicting subscription records for the admin and farmer dashboards. Both interfaces must use the same authoritative backend subscription data.

---

## 12. UI/UX Requirements

Match the existing PoultryPro admin dashboard.

### A. Layout

- Existing admin sidebar and top navigation bar.
- Page title and description.
- Horizontal subscription tabs.
- Summary cards.
- Search and filter controls.
- Professional data tables.
- Charts and analytics.
- Action buttons.
- Confirmation modals.

### B. Design Guidelines

- Green and blue brand colours.
- No gradients.
- Clean typography and consistent spacing.
- Professional icons, excluding Lucide React.
- Responsive sidebar and mobile-friendly tables.
- Clear status indicators.
- Pagination for large datasets.
- Loading skeletons and empty states.
- Error and success notifications.

Do not redesign unrelated admin dashboard sections.

---

## 13. Backend & Database Integration

Use the existing backend and database structure. Inspect the current architecture before implementing new services or endpoints.

### Data Entities

- Subscription Plans
- Farmer Subscriptions
- Subscription Payments
- Free Trials
- Subscription Settings
- Subscription Activity Logs
- Admin Audit Logs

### Requirements

1. Subscription records are linked to the correct farmer.
2. Subscription plan limits are enforced on the backend.
3. Payment transactions are securely verified.
4. Subscription changes are reflected across the application.
5. Existing farm data is preserved.
6. Administrative changes are logged.
7. Payment and subscription updates are handled consistently.
8. Existing subscription service methods remain compatible with `FarmContext.jsx` and other dependent components.

Do not introduce duplicate subscription services or conflicting subscription expiration logic.

---

## 14. Functionality & Testing

Every feature must work correctly. Test the following:

1. Admin login and authorisation.
2. Subscription overview metrics.
3. Subscription plan editing.
4. Subscription pricing updates.
5. Farmer subscription searches and filters.
6. Subscription upgrades and downgrades.
7. Trial activation and expiration.
8. Subscription renewals.
9. Payment verification.
10. Revenue calculations.
11. Subscription expiration handling.
12. Subscription cancellation.
13. Farmer dashboard synchronisation.
14. Subscription limit enforcement.
15. Responsive layout.
16. Subscription tab navigation.
17. Payments & Transactions sidebar navigation.
18. Revenue Analytics sidebar navigation.

Invalid or missing subscription data must not crash the application.

Do not use hardcoded subscriber counts, fake revenue figures, or simulated successful payments in production.

---

## 15. Important Implementation Instructions

1. Inspect the existing PoultryPro admin dashboard before making changes.
2. Preserve the existing sidebar design and navigation.
3. Implement the five subscription sections as tabs within one page.
4. Keep Payments & Transactions as an independent sidebar page.
5. Keep Revenue Analytics as an independent sidebar page.
6. Do not duplicate the payment and revenue pages inside Subscriptions.
7. Maintain all existing backend integrations.
8. Use the existing subscription service where possible.
9. Do not introduce conflicting subscription expiration logic.
10. Preserve all existing farmer accounts, farm records, and payment history.
11. Ensure all admin changes are reflected in the farmer dashboard.
12. Do not introduce a permanent Free subscription plan.
13. Maintain the 14-day free trial.
14. Do not use gradients.
15. Do not use Lucide React icons.
16. Do not redesign unrelated admin pages.
17. Ensure all buttons, filters, forms, modals, and navigation links work correctly.

---

## Final Objective

Build a **complete, professional, secure, and scalable Subscription Management System for the PoultryPro Admin Dashboard**.

| Plan | Monthly | Annual |
| --- | --- | --- |
| Starter | ₦2,500 | ₦25,000 |
| Professional | ₦5,000 | ₦50,000 |
| Enterprise | ₦12,000 | ₦120,000 |

The system must support a **14-day free trial**, subscription monitoring, payment tracking, revenue analytics, subscription settings, and administrative controls.

### Final Navigation Structure

**Admin Sidebar**

```text
Dashboard
Farmers
Farms
Subscriptions
Payments & Transactions
Revenue Analytics
Settings
Other Existing Menu Items
```

**Subscriptions Page**

```text
Subscription Management
│
├── Overview
├── Subscription Plans
├── Farmers' Subscriptions
├── Free Trial Management
└── Subscription Settings
```

### Critical Requirements

- The five subscription sections are accessible through tabs within the Subscriptions page.
- Payments & Transactions and Revenue Analytics remain separate sidebar pages.
- The admin and farmer subscription systems use consistent subscription data.
- All existing PoultryPro functionality is preserved.
- All buttons, filters, tables, forms, modals, and navigation links function correctly.
- The application remains responsive and free from runtime errors.
