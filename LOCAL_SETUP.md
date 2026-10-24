# PoultryPro Local Setup & Running Guide (Windows + XAMPP)

This guide explains how to run the PoultryPro Farm Management System completely locally on Windows using XAMPP MySQL.

---

## 1. Prerequisites

1. **XAMPP** installed (typically at `C:\xampp`)
2. **Node.js** (v18 or higher recommended)
3. **Git** (optional, for version control)

---

## 2. Database Setup (XAMPP MySQL)

1. Open the **XAMPP Control Panel**.
2. Click **Start** next to **MySQL** (port 3306).
3. The database `poultrypro_db` and all 26 required tables have been migrated and seeded.
   - If you ever need to recreate or reset the database from scratch:
     ```powershell
     # In PowerShell:
     cd C:\Users\USER\Desktop\Poultry-Pro\backend
     cmd /c "C:\xampp\mysql\bin\mysql.exe -u root poultrypro_db < migrations\001_create_tables.sql"
     npm run seed
     ```

---

## 3. Configuration (.env)

The local backend configuration is stored in `backend/.env`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=poultrypro_db
DB_SSL=false

FRONTEND_URL=http://localhost:5173

# Admin Account Credentials
ADMIN_EMAIL=admin@poultrypro.ng
ADMIN_PASSWORD_HASH=$2a$12$jYMogigGASkvhiWB2Y/LvO4TR1JZvjca5xLwBJGGmMKM/aB64rT8K

# JWT Secret
JWT_SECRET=b63c788c03166b2680f4f9f7d27e9999a09ddc8fec2db9c6df8bbfef7a641fe8f35cf5dd47d7c18408f65a127ee6dbefd123d573641219ee53896dfa2608fb6f
```

Frontend configuration in root `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 4. Running the Application

### Option A: Start Both Backend and Frontend Together (Recommended)
From the project root:
```powershell
cd C:\Users\USER\Desktop\Poultry-Pro
npm run dev
```
This script will:
1. Verify the backend is up on port 5000 (starting it automatically if not).
2. Start the Vite React development server on `http://localhost:5173`.

### Option B: Run Backend and Frontend in Separate Terminals

**Terminal 1 (Backend with nodemon):**
```powershell
cd C:\Users\USER\Desktop\Poultry-Pro\backend
npm run dev
```
Backend will run at: `http://localhost:5000`

**Terminal 2 (Frontend):**
```powershell
cd C:\Users\USER\Desktop\Poultry-Pro
npm run dev:frontend
```
Frontend will run at: `http://localhost:5173`

---

## 5. Verifying Health Endpoints

- **Backend Express Status:** `http://localhost:5000/health`
  ```json
  {"status":"OK","message":"PoultryPro backend is running"}
  ```
- **MySQL Database Status:** `http://localhost:5000/health/ready`
  ```json
  {"status":"OK","database":"connected"}
  ```

---

## 6. Default Login Credentials

### Administrator Dashboard
- **URL:** `http://localhost:5173/admin/login`
- **Email:** `admin@poultrypro.ng`
- **Password:** `Admin@PoultryPro2024`

### Farmer Dashboard (Demo User)
- **URL:** `http://localhost:5173/login`
- **Email:** `ahmad@maillator.com` (or create a new farmer at `/register`)
- **Password:** As set during registration (or register fresh at `/register`)

---

## 7. Key Features Configured Locally

- **XAMPP Local MySQL:** All data (flocks, feeds, eggs, mortality, vaccinations, sales, expenses, subscriptions, users, farms) persists in local MySQL `poultrypro_db`.
- **Nodemon Hot Reload:** Backend automatically reloads on code modifications.
- **Local Sandbox Checkout:** Plan switching and subscription payments use a built-in sandbox mock flow that tests database transactions and subscription status transitions without live payment charges.
- **Daily Records Ledger:** Automatically updates flock bird counts and inventory balances.
