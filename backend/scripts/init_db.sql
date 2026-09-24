-- PoultryPro MySQL Database Initialization Schema
CREATE DATABASE IF NOT EXISTS poultrypro_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE poultrypro_db;

-- 1. Farms Table
CREATE TABLE IF NOT EXISTS farms (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL DEFAULT 'Mixed Poultry',
  size VARCHAR(100) NOT NULL DEFAULT '5,000 sqm',
  currency VARCHAR(10) NOT NULL DEFAULT '₦',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  farm_id VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'Farm Owner',
  avatar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL
);

-- 3. Flocks Table
CREATE TABLE IF NOT EXISTS flocks (
  id VARCHAR(64) PRIMARY KEY,
  farm_id VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  breed VARCHAR(100) NOT NULL,
  initial_birds INT NOT NULL,
  current_birds INT NOT NULL,
  date_acquired DATE NOT NULL,
  age_weeks INT DEFAULT 0,
  cost_per_bird DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  pen VARCHAR(100),
  source VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Active',
  health_status VARCHAR(50) DEFAULT 'Healthy',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- 4. Feed Inventory Table
CREATE TABLE IF NOT EXISTS feed_inventory (
  id VARCHAR(64) PRIMARY KEY,
  farm_id VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  quantity_bags INT NOT NULL DEFAULT 0,
  bag_weight_kg INT NOT NULL DEFAULT 25,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier VARCHAR(255),
  status VARCHAR(50) DEFAULT 'In Stock',
  min_stock_threshold_bags INT DEFAULT 20,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- 5. Egg Production Table
CREATE TABLE IF NOT EXISTS egg_production (
  id VARCHAR(64) PRIMARY KEY,
  flock_id VARCHAR(64),
  flock_name VARCHAR(255),
  date DATE NOT NULL,
  total_eggs INT NOT NULL DEFAULT 0,
  broken_eggs INT NOT NULL DEFAULT 0,
  rejected_eggs INT NOT NULL DEFAULT 0,
  good_eggs INT NOT NULL DEFAULT 0,
  crates DECIMAL(10,1) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE CASCADE
);

-- 6. Mortality Records Table
CREATE TABLE IF NOT EXISTS mortality_records (
  id VARCHAR(64) PRIMARY KEY,
  flock_id VARCHAR(64),
  flock_name VARCHAR(255),
  date DATE NOT NULL,
  count INT NOT NULL DEFAULT 1,
  cause VARCHAR(100) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE CASCADE
);

-- 7. Vaccinations Table
CREATE TABLE IF NOT EXISTS vaccinations (
  id VARCHAR(64) PRIMARY KEY,
  flock_id VARCHAR(64),
  flock_name VARCHAR(255),
  vaccine VARCHAR(255) NOT NULL,
  scheduled_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'Upcoming',
  administered_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE CASCADE
);

-- 8. Medications Table
CREATE TABLE IF NOT EXISTS medications (
  id VARCHAR(64) PRIMARY KEY,
  flock_id VARCHAR(64),
  flock_name VARCHAR(255),
  medication_name VARCHAR(255) NOT NULL,
  reason VARCHAR(255),
  dosage VARCHAR(100),
  start_date DATE,
  end_date DATE,
  cost DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE CASCADE
);

-- 9. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  farm_id VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  type VARCHAR(100) DEFAULT 'Retailer',
  total_purchases DECIMAL(12,2) DEFAULT 0,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- 10. Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(64) PRIMARY KEY,
  farm_id VARCHAR(64),
  customer_id VARCHAR(64),
  customer_name VARCHAR(255),
  product VARCHAR(100) NOT NULL,
  flock_id VARCHAR(64),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(50) DEFAULT 'Paid',
  payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- 11. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(64) PRIMARY KEY,
  farm_id VARCHAR(64),
  category VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
  flock_id VARCHAR(64),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- 12. Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(64) PRIMARY KEY,
  farm_id VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'pcs',
  min_stock INT DEFAULT 5,
  supplier VARCHAR(255),
  cost DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'In Stock',
  date_added DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- 13. Workers Table
CREATE TABLE IF NOT EXISTS workers (
  id VARCHAR(64) PRIMARY KEY,
  farm_id VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  role VARCHAR(100) DEFAULT 'Farm Worker',
  assigned_pen VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Active',
  start_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- 14. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(64) PRIMARY KEY,
  farm_id VARCHAR(64),
  title VARCHAR(255) NOT NULL,
  assigned_to VARCHAR(255),
  due_date DATE,
  priority VARCHAR(50) DEFAULT 'Medium',
  status VARCHAR(50) DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- 15. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  farm_id VARCHAR(64),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'Information',
  time VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);
