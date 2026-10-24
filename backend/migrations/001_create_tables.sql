-- PoultryPro Local Database Migration
-- Migration: 001_create_tables.sql
-- Database:  poultrypro_db (XAMPP MySQL)
-- Run this once before starting the backend for the first time.
-- The backend services auto-create the remaining tables
-- (subscription_plans, farm_subscriptions, daily_records, etc.)
-- on the first API request.

USE poultrypro_db;

-- -------------------------------------------------------------------
-- farms
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farms (
  id          VARCHAR(64)   PRIMARY KEY,
  name        VARCHAR(255)  NOT NULL DEFAULT 'My Farm',
  location    VARCHAR(255)  NOT NULL DEFAULT '',
  currency    VARCHAR(10)   NOT NULL DEFAULT 'NGN',
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- users
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             VARCHAR(64)   PRIMARY KEY,
  farm_id        VARCHAR(64)   NOT NULL,
  name           VARCHAR(255)  NOT NULL,
  email          VARCHAR(255)  NOT NULL UNIQUE,
  phone          VARCHAR(50)   NOT NULL DEFAULT '',
  password_hash  VARCHAR(255)  NOT NULL,
  role           VARCHAR(50)   NOT NULL DEFAULT 'Farm Owner',
  status         VARCHAR(30)   NOT NULL DEFAULT 'Active',
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
  INDEX idx_users_email (email),
  INDEX idx_users_farm  (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- flocks
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flocks (
  id              VARCHAR(64)     PRIMARY KEY,
  farm_id         VARCHAR(64)     NOT NULL,
  name            VARCHAR(255)    NOT NULL,
  type            VARCHAR(100)    NOT NULL,
  breed           VARCHAR(100)    NOT NULL DEFAULT '',
  initial_birds   INT             NOT NULL DEFAULT 0,
  current_birds   INT             NOT NULL DEFAULT 0,
  date_acquired   DATE            NOT NULL,
  age_weeks       INT             NOT NULL DEFAULT 1,
  cost_per_bird   DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  total_cost      DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  pen             VARCHAR(100)    NOT NULL DEFAULT '',
  source          VARCHAR(255)    NOT NULL DEFAULT '',
  status          VARCHAR(30)     NOT NULL DEFAULT 'Active',
  health_status   VARCHAR(30)     NOT NULL DEFAULT 'Healthy',
  notes           TEXT,
  created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
  INDEX idx_flocks_farm   (farm_id),
  INDEX idx_flocks_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- feed_inventory
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_inventory (
  id                       VARCHAR(64)     PRIMARY KEY,
  farm_id                  VARCHAR(64)     NOT NULL,
  name                     VARCHAR(255)    NOT NULL,
  type                     VARCHAR(100)    NOT NULL DEFAULT '',
  quantity_bags            DECIMAL(16,6)   NOT NULL DEFAULT 0,
  bag_weight_kg            DECIMAL(10,2)   NOT NULL DEFAULT 25.00,
  unit_price               DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  supplier                 VARCHAR(255)    NOT NULL DEFAULT '',
  status                   VARCHAR(30)     NOT NULL DEFAULT 'In Stock',
  min_stock_threshold_bags INT             NOT NULL DEFAULT 20,
  created_at               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
  INDEX idx_feed_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- egg_production
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS egg_production (
  id            VARCHAR(64)     PRIMARY KEY,
  flock_id      VARCHAR(64),
  flock_name    VARCHAR(255)    NOT NULL DEFAULT '',
  date          DATE            NOT NULL,
  total_eggs    INT             NOT NULL DEFAULT 0,
  broken_eggs   INT             NOT NULL DEFAULT 0,
  rejected_eggs INT             NOT NULL DEFAULT 0,
  good_eggs     INT             NOT NULL DEFAULT 0,
  crates        DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  notes         TEXT,
  created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE SET NULL,
  INDEX idx_eggs_flock (flock_id),
  INDEX idx_eggs_date  (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- mortality_records
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mortality_records (
  id          VARCHAR(64)   PRIMARY KEY,
  flock_id    VARCHAR(64),
  flock_name  VARCHAR(255)  NOT NULL DEFAULT '',
  date        DATE          NOT NULL,
  count       INT           NOT NULL DEFAULT 0,
  cause       VARCHAR(255)  NOT NULL DEFAULT 'Unknown',
  notes       TEXT,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE SET NULL,
  INDEX idx_mortality_flock (flock_id),
  INDEX idx_mortality_date  (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- sales
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
  id              VARCHAR(64)     PRIMARY KEY,
  farm_id         VARCHAR(64)     NOT NULL,
  flock_id        VARCHAR(64),
  customer_id     VARCHAR(64),
  customer_name   VARCHAR(255)    NOT NULL DEFAULT '',
  product         VARCHAR(255)    NOT NULL DEFAULT '',
  quantity        DECIMAL(14,4)   NOT NULL DEFAULT 0,
  unit_price      DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  total_amount    DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  payment_status  VARCHAR(30)     NOT NULL DEFAULT 'Paid',
  payment_method  VARCHAR(50)     NOT NULL DEFAULT 'Bank Transfer',
  date            DATE            NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id)  REFERENCES farms(id) ON DELETE CASCADE,
  FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE SET NULL,
  INDEX idx_sales_farm (farm_id),
  INDEX idx_sales_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- expenses
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id              VARCHAR(64)     PRIMARY KEY,
  farm_id         VARCHAR(64)     NOT NULL,
  flock_id        VARCHAR(64),
  category        VARCHAR(100)    NOT NULL DEFAULT '',
  description     VARCHAR(500)    NOT NULL DEFAULT '',
  amount          DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  payment_method  VARCHAR(50)     NOT NULL DEFAULT 'Bank Transfer',
  date            DATE            NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id)  REFERENCES farms(id) ON DELETE CASCADE,
  FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE SET NULL,
  INDEX idx_expenses_farm (farm_id),
  INDEX idx_expenses_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- customers
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id                  VARCHAR(64)     PRIMARY KEY,
  farm_id             VARCHAR(64)     NOT NULL,
  name                VARCHAR(255)    NOT NULL,
  contact_person      VARCHAR(255)    NOT NULL DEFAULT '',
  phone               VARCHAR(50)     NOT NULL DEFAULT '',
  email               VARCHAR(255)    NOT NULL DEFAULT '',
  address             TEXT,
  type                VARCHAR(100)    NOT NULL DEFAULT 'Retailer',
  total_purchases     DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  outstanding_balance DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  notes               TEXT,
  created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
  INDEX idx_customers_farm (farm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- vaccinations
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vaccinations (
  id               VARCHAR(64)   PRIMARY KEY,
  flock_id         VARCHAR(64),
  flock_name       VARCHAR(255)  NOT NULL DEFAULT '',
  vaccine          VARCHAR(255)  NOT NULL,
  scheduled_date   DATE          NOT NULL,
  status           VARCHAR(30)   NOT NULL DEFAULT 'Upcoming',
  administered_by  VARCHAR(255)  NOT NULL DEFAULT '',
  notes            TEXT,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE SET NULL,
  INDEX idx_vacc_flock  (flock_id),
  INDEX idx_vacc_date   (scheduled_date),
  INDEX idx_vacc_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- medications
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medications (
  id               VARCHAR(64)     PRIMARY KEY,
  flock_id         VARCHAR(64),
  flock_name       VARCHAR(255)    NOT NULL DEFAULT '',
  medication_name  VARCHAR(255)    NOT NULL,
  reason           VARCHAR(500)    NOT NULL DEFAULT '',
  dosage           VARCHAR(255)    NOT NULL DEFAULT '',
  start_date       DATE,
  end_date         DATE,
  cost             DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  notes            TEXT,
  created_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (flock_id) REFERENCES flocks(id) ON DELETE SET NULL,
  INDEX idx_meds_flock (flock_id),
  INDEX idx_meds_date  (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
