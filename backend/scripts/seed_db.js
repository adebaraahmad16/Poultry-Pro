import pool from '../config/db.js';
import {
  initialFarmData,
  initialUserData,
  initialFlocks,
  initialFeedInventory,
  initialEggProduction,
  initialMortalityRecords,
  initialVaccinations,
  initialMedications,
  initialCustomers,
  initialSales,
  initialExpenses,
  initialInventoryItems,
  initialWorkers,
  initialTasks,
  initialNotifications
} from '../../src/services/mockData.js';

async function seedDatabase() {
  try {
    console.log('🌱 Starting MySQL database seeding for poultrypro_db...');

    // 1. Farms
    await pool.query(
      `INSERT INTO farms (id, name, location, type, size, currency)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), location=VALUES(location);`,
      [initialFarmData.id, initialFarmData.name, initialFarmData.location, initialFarmData.type, initialFarmData.size, initialFarmData.currency]
    );

    // 2. Users
    await pool.query(
      `INSERT INTO users (id, farm_id, name, email, phone, role, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name);`,
      [initialUserData.id, initialFarmData.id, initialUserData.name, initialUserData.email, initialUserData.phone, initialUserData.role, initialUserData.avatar]
    );

    // 3. Flocks
    for (const f of initialFlocks) {
      await pool.query(
        `INSERT INTO flocks (id, farm_id, name, type, breed, initial_birds, current_birds, date_acquired, age_weeks, cost_per_bird, total_cost, pen, source, status, health_status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE current_birds=VALUES(current_birds);`,
        [f.id, initialFarmData.id, f.name, f.type, f.breed, f.initialBirds, f.currentBirds, f.dateAcquired, f.ageWeeks, f.costPerBird, f.totalCost, f.pen, f.source, f.status, f.healthStatus, f.notes]
      );
    }

    // 4. Feed Inventory
    for (const feed of initialFeedInventory) {
      await pool.query(
        `INSERT INTO feed_inventory (id, farm_id, name, type, quantity_bags, bag_weight_kg, unit_price, supplier, status, min_stock_threshold_bags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity_bags=VALUES(quantity_bags);`,
        [feed.id, initialFarmData.id, feed.name, feed.type, feed.quantityBags, feed.bagWeightKg, feed.unitPrice, feed.supplier, feed.status, feed.minStockThresholdBags]
      );
    }

    // 5. Egg Production
    for (const egg of initialEggProduction) {
      await pool.query(
        `INSERT INTO egg_production (id, flock_id, flock_name, date, total_eggs, broken_eggs, rejected_eggs, good_eggs, crates, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE total_eggs=VALUES(total_eggs);`,
        [egg.id, egg.flockId, egg.flockName, egg.date, egg.totalEggs, egg.brokenEggs, egg.rejectedEggs, egg.goodEggs, egg.crates, egg.notes]
      );
    }

    // 6. Mortality Records
    for (const m of initialMortalityRecords) {
      await pool.query(
        `INSERT INTO mortality_records (id, flock_id, flock_name, date, count, cause, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE count=VALUES(count);`,
        [m.id, m.flockId, m.flockName, m.date, m.count, m.cause, m.notes]
      );
    }

    // 7. Vaccinations
    for (const v of initialVaccinations) {
      await pool.query(
        `INSERT INTO vaccinations (id, flock_id, flock_name, vaccine, scheduled_date, status, administered_by, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status);`,
        [v.id, v.flockId, v.flockName, v.vaccine, v.scheduledDate, v.status, v.administeredBy, v.notes]
      );
    }

    // 8. Medications
    for (const med of initialMedications) {
      await pool.query(
        `INSERT INTO medications (id, flock_id, flock_name, medication_name, reason, dosage, start_date, end_date, cost, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE cost=VALUES(cost);`,
        [med.id, med.flockId, med.flockName, med.medicationName, med.reason, med.dosage, med.startDate, med.endDate, med.cost, med.notes]
      );
    }

    // 9. Customers
    for (const c of initialCustomers) {
      await pool.query(
        `INSERT INTO customers (id, farm_id, name, contact_person, phone, email, address, type, total_purchases, outstanding_balance, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE outstanding_balance=VALUES(outstanding_balance);`,
        [c.id, initialFarmData.id, c.name, c.contactPerson, c.phone, c.email, c.address, c.type, c.totalPurchases, c.outstandingBalance, c.notes]
      );
    }

    // 10. Sales
    for (const s of initialSales) {
      await pool.query(
        `INSERT INTO sales (id, farm_id, customer_id, customer_name, product, flock_id, quantity, unit_price, total_amount, payment_status, payment_method, date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE payment_status=VALUES(payment_status);`,
        [s.id, initialFarmData.id, s.customerId, s.customerName, s.product, s.flockId, s.quantity, s.unitPrice, s.totalAmount, s.paymentStatus, s.paymentMethod, s.date, s.notes]
      );
    }

    // 11. Expenses
    for (const exp of initialExpenses) {
      await pool.query(
        `INSERT INTO expenses (id, farm_id, category, description, amount, payment_method, flock_id, date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE amount=VALUES(amount);`,
        [exp.id, initialFarmData.id, exp.category, exp.description, exp.amount, exp.paymentMethod, exp.flockId, exp.date, exp.notes]
      );
    }

    // 12. Inventory
    for (const inv of initialInventoryItems) {
      await pool.query(
        `INSERT INTO inventory (id, farm_id, name, category, quantity, unit, min_stock, supplier, cost, status, date_added)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);`,
        [inv.id, initialFarmData.id, inv.name, inv.category, inv.quantity, inv.unit, inv.minStock, inv.supplier, inv.cost, inv.status, inv.dateAdded]
      );
    }

    // 13. Workers
    for (const w of initialWorkers) {
      await pool.query(
        `INSERT INTO workers (id, farm_id, name, phone, email, role, assigned_pen, status, start_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status);`,
        [w.id, initialFarmData.id, w.name, w.phone, w.email, w.role, w.assignedPen, w.status, w.startDate]
      );
    }

    // 14. Tasks
    for (const t of initialTasks) {
      await pool.query(
        `INSERT INTO tasks (id, farm_id, title, assigned_to, due_date, priority, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status);`,
        [t.id, initialFarmData.id, t.title, t.assignedTo, t.dueDate, t.priority, t.status, t.notes]
      );
    }

    // 15. Notifications
    for (const n of initialNotifications) {
      await pool.query(
        `INSERT INTO notifications (id, farm_id, title, message, type, time, is_read)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE is_read=VALUES(is_read);`,
        [n.id, initialFarmData.id, n.title, n.message, n.type, n.time, n.read]
      );
    }

    console.log('✅ MySQL Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedDatabase();
