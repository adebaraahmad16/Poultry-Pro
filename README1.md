# 🐔 PoultryPro

> **Smart Management. Healthier Flocks. Better Profits.**

PoultryPro is a production-ready poultry farm management SaaS platform. It helps poultry farmers manage farms, poultry types, flocks, feed, egg production, health, mortality, sales, customers, expenses, inventory, workers, tasks, reports, notifications, and profitability, all in one place.

PoultryPro is a real commercial web application. It is **not** a static frontend, mockup, or visual-only prototype.

---

## Table of Contents

1. [Core Principle: Everything Must Work](#1-core-principle-everything-must-work)
2. [Tech Stack](#2-tech-stack)
3. [Brand Identity](#3-brand-identity)
4. [Authentication](#4-authentication)
5. [User Roles](#5-user-roles)
6. [Onboarding](#6-onboarding)
7. [Multiple Poultry Types](#7-multiple-poultry-types)
8. [Poultry-Specific Dashboards](#8-poultry-specific-dashboards)
9. [Dashboard & Sidebar](#9-dashboard--sidebar)
10. [Flock Management](#10-flock-management)
11. [Feed Management](#11-feed-management)
12. [Egg Production](#12-egg-production)
13. [Health Management](#13-health-management)
14. [Mortality](#14-mortality)
15. [Sales](#15-sales)
16. [Customers](#16-customers)
17. [Expenses](#17-expenses)
18. [Inventory](#18-inventory)
19. [Workers](#19-workers)
20. [Task Management](#20-task-management)
21. [Analytics](#21-analytics)
22. [Profit & Loss](#22-profit--loss)
23. [Reports](#23-reports)
24. [Notifications](#24-notifications)
25. [Search, Filters & Modals](#25-search-filters--modals)
26. [Settings](#26-settings)
27. [Subscription Plans & Limits](#27-subscription-plans--limits)
28. [Landing Page](#28-landing-page)
29. [Advertisement System](#29-advertisement-system)
30. [Routes](#30-routes)
31. [Button Functionality Audit](#31-button-functionality-audit)
32. [Form Validation](#32-form-validation)
33. [Data Persistence](#33-data-persistence)
34. [Demo Data](#34-demo-data)
35. [Responsive Design](#35-responsive-design)
36. [Loading, Empty & Error States](#36-loading-empty--error-states)
37. [Security](#37-security)
38. [User Profile & Global UX](#38-user-profile--global-ux)
39. [Real Calculations](#39-real-calculations)
40. [Quality Control Checklist](#40-quality-control-checklist)
41. [Guiding Questions](#41-guiding-questions)

---

## 1. Core Principle: Everything Must Work

Every visible interactive element must perform a real action.

**Do NOT create:**

- Dead buttons
- Fake links
- Empty navigation items
- Non-functional forms
- Fake login or signup buttons
- Placeholder dashboard actions
- Buttons that only show `alert()`
- "Coming soon" for core features
- Static tables that cannot be edited
- Fake search fields or filters
- Fake charts
- Fake notifications
- Fake profile settings
- Fake subscription buttons

**Every button and link must either:**

1. Navigate to a real page,
2. Open a functional modal or drawer,
3. Submit, update, or delete actual data,
4. Filter or search actual data,
5. Trigger a real application action,
6. Download or export actual generated data, or
7. Clearly explain why an external service is required.

---

## 2. Tech Stack

| Area | Technology |
|---|---|
| Framework | React.js (JavaScript, JSX) |
| Styling | Tailwind CSS |
| Routing | React Router |
| Icons | Lucide React |
| Charts | Recharts |
| State | Context API (or another appropriate state-management approach) |
| Validation | Custom form validation |
| Design | Fully responsive |

The application is structured so a real backend and database can be connected cleanly.

- If a backend is available, implement proper API communication.
- If not, use a **functional local data layer with LocalStorage** so CRUD operations persist after refresh.
- Do not hardcode dashboard data in UI components.

### Reusable Services

```text
authService
farmService
flockService
feedService
productionService
healthService
salesService
customerService
expenseService
inventoryService
workerService
taskService
reportService
notificationService
subscriptionService
```

---

## 3. Brand Identity

Use the selected **Professional Agricultural PoultryPro** logo concept.

| Token | Hex |
|---|---|
| Primary Green | `#16A34A` |
| Dark Green | `#15803D` |
| Light Green | `#DCFCE7` |
| Primary Blue | `#2563EB` |
| Dark Blue | `#1D4ED8` |
| Light Blue | `#DBEAFE` |
| Background | `#F8FAFC` |
| White | `#FFFFFF` |
| Dark Text | `#0F172A` |
| Muted Text | `#64748B` |

Use the logo consistently in: landing page, navbar, login, registration, dashboard, sidebar, loading screen, favicon/app icon, reports, and PDF exports.

---

## 4. Authentication

### Registration

**Fields:** Full name, Email, Phone number, Password, Confirm password

**Validation:** Required fields, valid email, password strength, password confirmation, duplicate email

**Flow:**

```text
Register → Create account → Login → Farm onboarding → Dashboard
```

### Login

**Fields:** Email, Password, Remember me

**Actions:** Login, Forgot password, Show/hide password

### Forgot Password

Create a real password-reset flow. If a production email service is not connected, implement the UI and a local development reset flow **without pretending an email was actually sent**.

### Logout

Logout must:

- Clear the active session
- Clear authentication state
- Redirect to `/login`

Users must not be able to access protected dashboard routes after logout.

---

## 5. User Roles

| Role | Access |
|---|---|
| **Farm Owner** | Full access to their farm |
| **Farm Manager** | Access based on permissions |
| **Worker** | Limited access to assigned tasks and permitted farm records |

Users must never be able to access another farmer's data.

---

## 6. Onboarding

After registration, show a proper onboarding process that collects:

**Farmer information:** Name, Phone, Email

**Farm information:** Farm name, Farm location, State, Country, Farm size, Number of workers

**Poultry types:** The farmer **must** select at least one. Multiple selections are allowed:

- Broilers
- Layers
- Chickens/Chicks
- Ducks
- Turkeys
- Geese
- Guinea Fowl
- Quails
- Other Poultry

Selections are saved to the farmer's farm profile.

---

## 7. Multiple Poultry Types

This is a critical feature.

- If the farmer selects only **Layers**, show a layer-focused dashboard.
- If they select **Broilers, Layers, Turkeys**, show a poultry selector with:

```text
All Poultry | Broilers | Layers | Turkeys
```

### "All Poultry" view

Displays combined: total birds, active flocks, feed stock, mortality, revenue, expenses, and profit.

Poultry-specific production records must **not** be mixed incorrectly. For example, layer egg production must never appear as broiler egg production.

---

## 8. Poultry-Specific Dashboards

| Poultry Type | Dashboard Metrics |
|---|---|
| **Broiler** | Total birds, active flocks, average weight, growth, feed consumption, feed conversion ratio, mortality, age, sales |
| **Layer** | Total layers, egg production today, egg production rate, good / broken / rejected eggs, feed consumption, mortality, sales |
| **Turkey** | Total birds, average weight, growth, feed consumption, mortality, health records, sales |
| **Duck** | Population, egg production (where applicable), feed consumption, weight, mortality, health, sales |
| **Quail** | Population, egg production, production rate, feed consumption, mortality, sales |

The system must be built so **new poultry types can be added later without rewriting the application**.

---

## 9. Dashboard & Sidebar

A professional SaaS dashboard with the following sidebar. Every item must navigate to a working route.

```text
Dashboard
Farm Overview

Flock Management
    Flocks

Production
    Egg Production
    Feed Management

Health
    Health Records
    Vaccinations
    Medication
    Mortality

Business
    Sales
    Customers
    Expenses
    Inventory

Management
    Workers
    Tasks

Analytics
    Reports
    Profit & Loss

Settings
    Farm Profile
    Notifications
    Security
    Subscription

Logout
```

---

## 10. Flock Management

**Capabilities:** Create, view, edit, delete, search, filter, sort, and view flock details.

**Fields:**

```text
Flock Name, Poultry Type, Breed, Initial Number, Current Number,
Date Acquired, Source, Cost, Pen/Location, Notes, Status
```

**Auto-calculated:** Current Birds, Mortality, Mortality Rate, Age

### Flock Details Page

Clicking **View Details** opens a complete flock page showing: Overview, Population, Age, Feed, Health, Mortality, Production, Sales, Expenses, and Performance charts.

**Actions (all must work):**

```text
Edit Flock
Record Mortality
Add Feed Record
Add Health Record
Record Sale
Delete Flock
```

---

## 11. Feed Management

**Capabilities:** Add, edit, delete, record usage, record purchase, search, filter, low-stock alerts.

**Fields:** Feed Type, Quantity, Unit, Cost, Supplier, Purchase Date, Expiry Date, Minimum Stock

**Auto-calculated:** Current Stock, Total Feed Cost, Low Stock Status

---

## 12. Egg Production

Only show egg production where relevant.

**Record:** Date, Flock, Total Eggs, Broken Eggs, Rejected Eggs

**Calculations:**

```text
Good Eggs = Total Eggs - Broken Eggs - Rejected Eggs
Egg Production Rate (calculated from stored records)
```

**Charts:** Daily production, Weekly production, Monthly production, Production by flock

---

## 13. Health Management

### Vaccination

**Fields:** Vaccine, Flock, Date, Next Due Date, Administered By, Notes

Automatic reminders for upcoming vaccinations.

### Medication

**Fields:** Medication Name, Flock, Reason, Dosage, Start Date, End Date, Cost, Notes

### Health Records

Record: Disease, Symptoms, Treatment, Recovery, Notes

---

## 14. Mortality

**Record:** Date, Flock, Number of Birds, Cause, Notes

**Causes:** Disease, Heat Stress, Injury, Predators, Unknown, Other

- Mortality rate is calculated automatically.
- Alerts fire when mortality rises above configured thresholds.

---

## 15. Sales

**Capabilities:** Add, edit, delete, view, search, filter.

**Fields:** Date, Customer, Product, Flock, Quantity, Unit Price, Total, Payment Status, Payment Method

**Products:** Live Birds, Eggs, Manure, Spent Layers, Other

```text
Total = Quantity × Unit Price
```

---

## 16. Customers

**Capabilities:** Add, edit, delete, view, search.

**Fields:** Name, Phone, Email, Address, Customer Type, Notes

**Customer types:** Individual, Restaurant, Retailer, Wholesaler, Distributor

**Customer profile shows:** Total Purchases, Outstanding Balance, Purchase History

---

## 17. Expenses

**Categories:** Feed, Medication, Labour, Transport, Electricity, Water, Equipment, Repairs, Housing, Other

**Fields:** Date, Category, Description, Amount, Payment Method, Notes

---

## 18. Inventory

**Categories:** Feed, Vaccines, Medication, Equipment, Packaging, Supplies

**Fields:** Name, Category, Quantity, Unit, Minimum Stock, Cost, Supplier, Expiry Date, Status

**Status display:** In Stock / Low Stock / Out of Stock

---

## 19. Workers

Owners and managers can add, edit, delete, and view workers.

**Fields:** Name, Phone, Email, Role, Start Date, Status

**Roles:** Farm Manager, Worker, Accountant, Supervisor

---

## 20. Task Management

**Capabilities:** Create, edit, delete, assign, complete.

**Fields:** Task, Assignee, Due Date, Priority, Status, Notes

- **Priorities:** Low, Medium, High, Urgent
- **Statuses:** Pending, In Progress, Completed

Workers see their assigned tasks.

---

## 21. Analytics

Real calculations from stored farm data, rendered with Recharts:

- Flock population
- Egg production
- Feed consumption
- Revenue vs expenses
- Mortality
- Sales
- Profit
- Production trends

Charts must update when underlying records change. **Do not hardcode chart values.**

---

## 22. Profit & Loss

```text
Revenue       = Total Sales
Expenses      = Total Recorded Expenses
Profit        = Revenue - Expenses
Profit Margin = (Profit / Revenue) × 100
```

**Display:** Revenue, Expenses, Gross profit, Profit margin, Expense breakdown, Revenue trends. Date filtering is supported.

---

## 23. Reports

**Report types:**

```text
Flock Report
Egg Production Report
Feed Report
Mortality Report
Sales Report
Expense Report
Inventory Report
Health Report
Profit & Loss Report
```

**Filters:** Today, 7 Days, 30 Days, This Month, Last Month, Custom Date

**Actions:** Export PDF, Export CSV, Print

Exported reports must contain the actual selected farm data.

---

## 24. Notifications

A real notification system. Examples:

```text
Low feed stock
Vaccination due
Medication ending
High mortality
Pending customer payment
Overdue task
Low inventory
```

Users can open, mark as read, mark all as read, and delete notifications. The unread count updates dynamically.

---

## 25. Search, Filters & Modals

- Every major data table has **search, filtering, sorting**, and **pagination** where appropriate. Search must actually filter the underlying data.
- All destructive actions use professional confirmation dialogs:

```text
Delete Flock?

This action cannot be undone.

[Cancel]  [Delete Flock]
```

Deletion occurs only after confirmation.

---

## 26. Settings

| Section | Capabilities |
|---|---|
| **Farm Profile** | Edit farm name, location, farm size, poultry types, contact information |
| **Poultry Types** | Add or remove poultry types; dashboard selectors and relevant modules update accordingly |
| **Notifications** | Enable/disable notification categories |
| **Security** | Change password, session management, log out from all sessions |
| **Subscription** | Show Free / Basic / Pro, current plan, usage, limits, upgrade button, billing information |

---

## 27. Subscription Plans & Limits

| | **Free** | **Basic** | **Pro** |
|---|---|---|---|
| Farms | 1 | 1 | Multiple |
| Flocks | 2 | 10 | Unlimited |
| Birds | 500 | 5,000 | Unlimited |
| Users | 1 | 3 | 10 |
| Features | Basic Dashboard | Reports, Advanced Management | Advanced Analytics, PDF Reports, Notifications |

Plan-limit checks are enforced. Example when a Free user hits the flock limit:

```text
You have reached your flock limit.

Upgrade your plan to add more flocks.
```

The upgrade button navigates to the subscription page.

---

## 28. Landing Page

A professional commercial landing page.

**Sections:**

1. Sponsored Advertisement Banner
2. Navbar
3. Hero
4. Hero Advertisement
5. Features
6. Poultry Type Personalization
7. Dashboard Preview
8. Sponsored Recommendations
9. How PoultryPro Works
10. Benefits
11. Pricing
12. Advertise With Us
13. Testimonials
14. FAQ
15. Final CTA
16. Footer

**Hero headline:**

> **Manage Your Poultry Farm Smarter.**

**Supporting text:**

> PoultryPro gives you everything you need to manage your flocks, feed, production, health, sales and expenses in one simple platform.

**Buttons (both must work):** `Start Managing Your Farm` · `Explore PoultryPro`

---

## 29. Advertisement System

Ads must be clearly labelled **Sponsored** and must not look like system notifications.

**Relevant advertisers:** Feed manufacturers, hatcheries, veterinary companies, poultry equipment suppliers, egg tray suppliers, poultry medication companies, agricultural insurance, farm equipment, agricultural financial services.

**Reusable components:**

```text
SponsoredBanner
SponsoredCard
SponsoredRecommendation
```

Include an **Advertise With PoultryPro** CTA with a working contact/advertiser form.

---

## 30. Routes

Every route must work. No route may lead to a blank page.

```text
/
/login
/register
/forgot-password
/onboarding
/dashboard
/farm
/farm/flocks
/farm/flocks/:id
/production/eggs
/production/feed
/health
/health/vaccinations
/health/medication
/health/mortality
/business/sales
/business/customers
/business/expenses
/business/inventory
/management/workers
/management/tasks
/reports
/reports/profit-loss
/settings
/settings/profile
/settings/farm
/settings/notifications
/settings/security
/settings/subscription
```

---

## 31. Button Functionality Audit

Every button must do something real:

| Button | Behaviour |
|---|---|
| + Add Flock | Opens Add Flock form |
| View Details | Opens flock details |
| Edit | Opens edit form |
| Delete | Opens confirmation modal |
| Save | Saves data |
| Cancel | Closes modal/form |
| Search | Filters records |
| Export | Generates actual export |
| View Report | Opens report |
| Upgrade | Opens subscription page |
| Add Poultry Type | Opens selection interface |
| Logout | Logs user out |
| View All Notifications | Opens notification page |
| Mark as Read | Updates notification state |

No button should exist without functionality.

---

## 32. Form Validation

Every form must have:

- Required-field validation
- Appropriate input types
- Error messages (e.g. *"Please enter the flock name."*)
- Success messages
- Loading states
- Disabled submit state while processing
- Duplicate-data protection where appropriate

Do not rely only on HTML validation.

---

## 33. Data Persistence

All created, edited, and deleted records must persist. For frontend-only development, use LocalStorage with a structured, database-like approach:

```text
users, farms, flocks, feedRecords, eggRecords, healthRecords,
vaccinations, medications, mortalityRecords, sales, customers,
expenses, inventory, workers, tasks, notifications, subscriptions
```

Data must survive **refresh**, **logout/login**, and **navigation**. Use user/farm IDs to isolate data.

---

## 34. Demo Data

Include an optional, clearly labelled **Demo Farm**.

- **Load Demo Data** and **Clear Demo Data** actions
- Demo data is clearly labelled as demonstration data
- Demo data is never mixed with real user data

---

## 35. Responsive Design

The app works on desktop, laptop, tablet, and mobile.

- **Desktop:** Sidebar + main content
- **Mobile:** Top bar, hamburger, slide-out sidebar
- Tables become mobile-friendly cards or scroll horizontally where necessary

### Mobile Sidebar Behaviour

| Action | Result |
|---|---|
| Click hamburger | Sidebar opens |
| Click outside | Sidebar closes |
| Click navigation item | Navigate and sidebar closes |

---

## 36. Loading, Empty & Error States

Every data-driven page supports:

- **Loading:** skeleton or spinner
- **Empty:** e.g. *"No flocks have been added yet."* with an **Add Your First Flock** button
- **Error:** a useful message with a retry action

No blank screens.

---

## 37. Security

- Protected routes
- Role-based access
- Session handling
- Input validation
- User/farm data isolation
- No plain-text passwords in a production architecture
- No unnecessary exposure of sensitive data
- With a backend: proper authentication and authorization

---

## 38. User Profile & Global UX

### User Profile

Displays the logged-in user's name, email, profile picture, and farm name.

**Profile menu (all items work):** My Profile · Farm Settings · Subscription · Notifications · Logout

### Global UX

- Toast notifications (e.g. *Flock created successfully.*, *Sale recorded successfully.*, *Farm profile updated.*, *Task completed.*)
- Confirmation modals
- Smooth transitions
- Clear hover and disabled states
- Loading states
- Accessible labels
- Keyboard-friendly forms
- Consistent spacing and typography

---

## 39. Real Calculations

No fake calculations. All dashboard statistics derive from actual stored records.

```text
Current Birds  = Initial Birds - Total Mortality
Mortality Rate = (Total Mortality / Initial Birds) × 100
Good Eggs      = Total Eggs - Broken Eggs - Rejected Eggs
Revenue        = Sum of Sales
Expenses       = Sum of Expenses
Profit         = Revenue - Expenses
Profit Margin  = Profit / Revenue × 100
```

---

## 40. Quality Control Checklist

Before considering the application complete, run a full functionality audit.

- [ ] **Authentication:** Register, Login, Logout, Forgot password, Protected routes
- [ ] **Farm:** Create, Edit, Poultry types, Multiple poultry types
- [ ] **Flocks:** Add, Edit, Delete, Search, Filter, Details
- [ ] **Production:** Feed, Eggs
- [ ] **Health:** Vaccination, Medication, Mortality
- [ ] **Business:** Sales, Customers, Expenses, Inventory
- [ ] **Management:** Workers, Tasks
- [ ] **Reports:** Generate, Filter, Export, Print
- [ ] **Settings:** Profile, Farm, Notifications, Security, Subscription
- [ ] **UI:** Desktop, Tablet, Mobile, light/dark backgrounds where applicable, Sidebar, Navbar, Modals, Toasts, Empty states, Error states

---

## 41. Guiding Questions

**Do not stop at designing the interface.** Build PoultryPro as if real poultry farmers will use it tomorrow. For every feature, ask:

- *"What happens when the farmer clicks this?"* → Implement that behaviour.
- *"Where is this data stored?"* → Implement the data flow.
- *"Where does this number come from?"* → Calculate it from stored records.
- *"Where should this link take the user?"* → Create the correct route.
- *"How is the user protected from accidental deletion?"* → Implement confirmation.
- *"What happens when the user reaches the limit?"* → Implement the restriction and upgrade flow.

The final result must feel like a **real commercial SaaS product**, not a template, landing-page mockup, or CRUD demonstration, and the architecture must allow the frontend to connect to a production backend/API later without a rebuild.
