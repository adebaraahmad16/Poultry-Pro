// PoultryPro Realistic Demo Data Engine (Ilorin, Kwara State, Nigeria)

export const initialFarmData = {
  id: "farm-101",
  name: "Green Valley Poultry Farm",
  location: "Ilorin, Kwara State, Nigeria",
  type: "Mixed Poultry",
  poultryTypes: ["broilers", "layers", "other"],
  size: "5,000 sqm (1.2 Acres)",
  workersCount: 4,
  currency: "₦",
  units: {
    weight: "kg",
    feedBag: "50kg bag",
    eggs: "crates (30 eggs/crate)"
  },
  createdAt: "2024-01-15",
};

export const initialUserData = {
  id: "user-1",
  name: "Dr. Adebayo Folorunsho",
  email: "farmer@greenvalley.com",
  phone: "+234 803 456 7890",
  role: "Farm Director",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
};

export const initialFlocks = [
  {
    id: "flock-1",
    name: "Broiler Batch A",
    type: "Broiler",
    breed: "Cobb 500",
    initialBirds: 2500,
    currentBirds: 2450,
    dateAcquired: "2026-06-15",
    ageWeeks: 10,
    costPerBird: 900,
    totalCost: 2250000,
    pen: "House 1",
    source: "Agrited Hatchery, Ibadan",
    status: "Active",
    healthStatus: "Healthy",
    notes: "High growth rate broiler flock ready for market harvesting."
  },
  {
    id: "flock-2",
    name: "Layer Batch B",
    type: "Layer",
    breed: "Isa Brown",
    initialBirds: 4000,
    currentBirds: 3910,
    dateAcquired: "2026-02-10",
    ageWeeks: 28,
    costPerBird: 1200,
    totalCost: 4800000,
    pen: "House 2 & 3",
    source: "Zartech Farms, Oyo",
    status: "Active",
    healthStatus: "Monitoring",
    notes: "Peak egg production layer flock. High lay efficiency (~88%)."
  },
  {
    id: "flock-3",
    name: "Broiler Batch C",
    type: "Broiler",
    breed: "Ross 308",
    initialBirds: 1800,
    currentBirds: 1790,
    dateAcquired: "2026-08-01",
    ageWeeks: 4,
    costPerBird: 900,
    totalCost: 1620000,
    pen: "House 4",
    source: "CHI Hatchery, Sagamu",
    status: "Active",
    healthStatus: "Healthy",
    notes: "Young brooding batch. Fed on Starter Mash."
  },
  {
    id: "flock-4",
    name: "Cockerel Batch D",
    type: "Cockerel",
    breed: "Black Harco",
    initialBirds: 1500,
    currentBirds: 1480,
    dateAcquired: "2026-04-05",
    ageWeeks: 20,
    costPerBird: 700,
    totalCost: 1050000,
    pen: "House 5",
    source: "AMO Hatchery, Jos",
    status: "Active",
    healthStatus: "Healthy",
    notes: "Targeted for Festive Season sales."
  }
];

export const initialFeedInventory = [
  {
    id: "feed-1",
    name: "Ultima Broiler Starter Mash",
    type: "Starter",
    quantityBags: 80,
    bagWeightKg: 25,
    unitPrice: 14500,
    supplier: "Grand Cereals Ltd (Vital Feeds)",
    purchaseDate: "2026-08-15",
    expiryDate: "2026-11-15",
    status: "In Stock",
    minStockThresholdBags: 20
  },
  {
    id: "feed-2",
    name: "TopFeeds Layer Mash Phase 1",
    type: "Layer Mash",
    quantityBags: 18,
    bagWeightKg: 25,
    unitPrice: 13800,
    supplier: "Premier Feeds Nigeria",
    purchaseDate: "2026-08-10",
    expiryDate: "2026-11-10",
    status: "Low Stock",
    minStockThresholdBags: 25
  },
  {
    id: "feed-3",
    name: "Vital Broiler Finisher Pellets",
    type: "Finisher",
    quantityBags: 95,
    bagWeightKg: 25,
    unitPrice: 15200,
    supplier: "Grand Cereals Ltd",
    purchaseDate: "2026-08-18",
    expiryDate: "2026-11-18",
    status: "In Stock",
    minStockThresholdBags: 30
  },
  {
    id: "feed-4",
    name: "Chick Grower Mash Premium",
    type: "Grower",
    quantityBags: 45,
    bagWeightKg: 25,
    unitPrice: 12900,
    supplier: "Animal Care Services Konsult",
    purchaseDate: "2026-08-05",
    expiryDate: "2026-10-30",
    status: "In Stock",
    minStockThresholdBags: 15
  }
];

export const initialEggProduction = [
  { id: "egg-1", date: "2026-08-28", flockId: "flock-2", flockName: "Layer Batch B", totalEggs: 3450, brokenEggs: 18, rejectedEggs: 12, goodEggs: 3420, crates: 114, notes: "Morning & Afternoon collection normal." },
  { id: "egg-2", date: "2026-08-27", flockId: "flock-2", flockName: "Layer Batch B", totalEggs: 3480, brokenEggs: 22, rejectedEggs: 8, goodEggs: 3450, crates: 115, notes: "High shell quality observed." },
  { id: "egg-3", date: "2026-08-26", flockId: "flock-2", flockName: "Layer Batch B", totalEggs: 3420, brokenEggs: 15, rejectedEggs: 15, goodEggs: 3390, crates: 113, notes: "Calcium supplement added in water." },
  { id: "egg-4", date: "2026-08-25", flockId: "flock-2", flockName: "Layer Batch B", totalEggs: 3510, brokenEggs: 20, rejectedEggs: 10, goodEggs: 3480, crates: 116, notes: "Cool environment maintained." },
  { id: "egg-5", date: "2026-08-24", flockId: "flock-2", flockName: "Layer Batch B", totalEggs: 3390, brokenEggs: 25, rejectedEggs: 14, goodEggs: 3351, crates: 111.7, notes: "Mild afternoon heat." },
  { id: "egg-6", date: "2026-08-23", flockId: "flock-2", flockName: "Layer Batch B", totalEggs: 3440, brokenEggs: 19, rejectedEggs: 11, goodEggs: 3410, crates: 113.6, notes: "Normal routine." },
  { id: "egg-7", date: "2026-08-22", flockId: "flock-2", flockName: "Layer Batch B", totalEggs: 3460, brokenEggs: 17, rejectedEggs: 13, goodEggs: 3430, crates: 114.3, notes: "Standard collection." }
];

export const initialMortalityRecords = [
  { id: "mort-1", date: "2026-08-28", flockId: "flock-2", flockName: "Layer Batch B", count: 2, cause: "Heat Stress", notes: "Found dead near ventilator." },
  { id: "mort-2", date: "2026-08-27", flockId: "flock-1", flockName: "Broiler Batch A", count: 1, cause: "Injury", notes: "Leg trauma from feeder grid." },
  { id: "mort-3", date: "2026-08-25", flockId: "flock-3", flockName: "Broiler Batch C", count: 3, cause: "Natural Causes", notes: "Post-brooding routine loss." },
  { id: "mort-4", date: "2026-08-22", flockId: "flock-2", flockName: "Layer Batch B", count: 2, cause: "Disease", notes: "Isolating suspected sick birds." },
  { id: "mort-5", date: "2026-08-20", flockId: "flock-4", flockName: "Cockerel Batch D", count: 1, cause: "Natural Causes", notes: "Routine observation." }
];

export const initialVaccinations = [
  { id: "vac-1", vaccine: "Newcastle Disease Vaccine (Lasota)", flockId: "flock-2", flockName: "Layer Batch B", scheduledDate: "2026-08-29", status: "Upcoming", administeredBy: "Dr. Folorunsho", notes: "Administer via drinking water early morning." },
  { id: "vac-2", vaccine: "Gumboro (IBD) Vaccine Booster", flockId: "flock-3", flockName: "Broiler Batch C", scheduledDate: "2026-08-15", status: "Completed", administeredBy: "Blessing Adebayo", notes: "Successfully administered at 2 weeks." },
  { id: "vac-3", vaccine: "Fowl Pox Vaccine (Wing Web)", flockId: "flock-2", flockName: "Layer Batch B", scheduledDate: "2026-07-02", status: "Completed", administeredBy: "Dr. Folorunsho", notes: "Take wing-web reaction check after 7 days." },
  { id: "vac-4", vaccine: "Infectious Bronchitis (IB)", flockId: "flock-1", flockName: "Broiler Batch A", scheduledDate: "2026-07-10", status: "Completed", administeredBy: "Blessing Adebayo", notes: "Sprayed via fine mist aerosol." }
];

export const initialMedications = [
  { id: "med-1", medicationName: "Coxi-Stop Oral Solution", flockId: "flock-3", flockName: "Broiler Batch C", reason: "Coccidiosis Prevention", dosage: "1ml / 2L water", startDate: "2026-08-24", endDate: "2026-08-27", cost: 18500, notes: "3-day course completed." },
  { id: "med-2", medicationName: "Poultry Multivitamin Super Booster", flockId: "flock-2", flockName: "Layer Batch B", reason: "Stress Relief after Heat", dosage: "100g / 200L water", startDate: "2026-08-27", endDate: "2026-08-30", cost: 24000, notes: "Given during hot afternoon peak." }
];

export const initialCustomers = [
  { id: "cust-1", name: "Kwara Fresh Supermarkets", contactPerson: "Mr. Taiwo Balogun", phone: "+234 802 345 6789", email: "orders@kwarafresh.com", address: "Unity Road, Ilorin", type: "Retailer", totalPurchases: 4250000, outstandingBalance: 250000, notes: "Weekly standing order for 80 crates of jumbo eggs." },
  { id: "cust-2", name: "Ilorin Central Confectioneries", contactPerson: "Mrs. Halima Ahmed", phone: "+234 813 987 6543", email: "halima@ilorinbakes.ng", address: "Taiwo Isale, Ilorin", type: "Wholesaler", totalPurchases: 2890000, outstandingBalance: 0, notes: "Buys 50 crates twice weekly. Pays cash on delivery." },
  { id: "cust-3", name: "Grand Crown Hotel & Suites", contactPerson: "Chef Chef Anthony", phone: "+234 805 112 2334", email: "kitchen@grandcrown.com", address: "Fate Road, Ilorin", type: "Restaurant", totalPurchases: 1750000, outstandingBalance: 120000, notes: "Purchases live broilers (50 birds bi-weekly)." },
  { id: "cust-4", name: "Alhaji Sanni Agro Distributors", contactPerson: "Alhaji Sanni Omotosho", phone: "+234 809 888 7766", email: "sanniagro@gmail.com", address: "Ganmo Market, Ilorin", type: "Distributor", totalPurchases: 8900000, outstandingBalance: 450000, notes: "Bulk buyer for spent layers & poultry manure." }
];

export const initialSales = [
  { id: "sale-1", date: "2026-08-28", customerId: "cust-1", customerName: "Kwara Fresh Supermarkets", product: "Eggs", flockId: "flock-2", quantity: 80, unitPrice: 2800, totalAmount: 224000, paymentStatus: "Pending", paymentMethod: "Bank Transfer", notes: "Invoice #INV-2026-088. Due in 5 days." },
  { id: "sale-2", date: "2026-08-27", customerId: "cust-2", customerName: "Ilorin Central Confectioneries", product: "Eggs", flockId: "flock-2", quantity: 50, unitPrice: 2800, totalAmount: 140000, paymentStatus: "Paid", paymentMethod: "Cash", notes: "Paid in full upon delivery." },
  { id: "sale-3", date: "2026-08-26", customerId: "cust-3", customerName: "Grand Crown Hotel & Suites", product: "Live Birds", flockId: "flock-1", quantity: 60, unitPrice: 4500, totalAmount: 270000, paymentStatus: "Partially Paid", paymentMethod: "Bank Transfer", notes: "Paid ₦150,000 balance of ₦120,000 pending." },
  { id: "sale-4", date: "2026-08-24", customerId: "cust-4", customerName: "Alhaji Sanni Agro Distributors", product: "Manure", flockId: "flock-2", quantity: 150, unitPrice: 1500, totalAmount: 225000, paymentStatus: "Paid", paymentMethod: "Bank Transfer", notes: "Poultry manure clearing from House 2." }
];

export const initialExpenses = [
  { id: "exp-1", date: "2026-08-26", category: "Feed", description: "Purchase of 50 bags TopFeeds Layer Mash", amount: 690000, paymentMethod: "Bank Transfer", flockId: "flock-2", notes: "Purchased from Premier Feeds distributor." },
  { id: "exp-2", date: "2026-08-25", category: "Medication", description: "Coxi-Stop & Multivitamins", amount: 42500, paymentMethod: "Cash", flockId: "flock-3", notes: "Bought from Veterinary Pharmacy." },
  { id: "exp-3", date: "2026-08-24", category: "Electricity", description: "Diesel for 30kVA Generator (200 Litres)", amount: 260000, paymentMethod: "Bank Transfer", flockId: "all", notes: "Farm power backup." },
  { id: "exp-4", date: "2026-08-20", category: "Labour", description: "Monthly Farm Staff Payroll (August)", amount: 350000, paymentMethod: "Bank Transfer", flockId: "all", notes: "Salaries for 4 staff members." },
  { id: "exp-5", date: "2026-08-18", category: "Transportation", description: "Feed haulage & delivery trip charges", amount: 35000, paymentMethod: "Cash", flockId: "all", notes: "Delivery to farm warehouse." }
];

export const initialInventoryItems = [
  { id: "inv-1", name: "Automatic Bell Drinkers", category: "Equipment", quantity: 45, unit: "pcs", minStock: 10, supplier: "AgroTech Supplies", cost: 8500, dateAdded: "2026-01-20", status: "In Stock" },
  { id: "inv-2", name: "Plastic Feeders (10kg)", category: "Equipment", quantity: 60, unit: "pcs", minStock: 15, supplier: "AgroTech Supplies", cost: 4200, dateAdded: "2026-01-20", status: "In Stock" },
  { id: "inv-3", name: "Paper Egg Trays (30 cells)", category: "Packaging materials", quantity: 8, unit: "bundles (100s)", minStock: 12, supplier: "Kwara Packaging Ind", cost: 18000, dateAdded: "2026-08-01", status: "Low Stock" },
  { id: "inv-4", name: "Virkon S Disinfectant (5kg)", category: "Farm supplies", quantity: 4, unit: "tubs", minStock: 2, supplier: "VetCare Nig", cost: 32000, dateAdded: "2026-07-15", status: "In Stock" }
];

export const initialWorkers = [
  { id: "wrk-1", name: "Emmanuel Okafor", phone: "+234 802 111 2233", email: "emmanuel@greenvalley.com", role: "Farm Manager", startDate: "2023-03-01", status: "Active", assignedPen: "All Pens" },
  { id: "wrk-2", name: "Blessing Adebayo", phone: "+234 814 333 4455", email: "blessing@greenvalley.com", role: "Supervisor", startDate: "2023-08-15", status: "Active", assignedPen: "House 2 & 3 (Layers)" },
  { id: "wrk-3", name: "Suleiman Ibrahim", phone: "+234 806 555 6677", email: "suleiman@greenvalley.com", role: "Farm Worker", startDate: "2024-02-10", status: "Active", assignedPen: "House 1 & 4 (Broilers)" },
  { id: "wrk-4", name: "Joy Amos", phone: "+234 818 777 8899", email: "joy@greenvalley.com", role: "Accountant", startDate: "2024-05-01", status: "Active", assignedPen: "Office / Store" }
];

export const initialTasks = [
  { id: "task-1", title: "Feed Layer Batch B (Morning Feed)", assignedTo: "Suleiman Ibrahim", dueDate: "2026-08-28", priority: "Urgent", status: "Completed", notes: "Use 6 bags of Layer Mash." },
  { id: "task-2", title: "Collect & Crate Morning Eggs", assignedTo: "Blessing Adebayo", dueDate: "2026-08-28", priority: "High", status: "Completed", notes: "Record broken vs intact count." },
  { id: "task-3", title: "Administer Newcastle Lasota Vaccine", assignedTo: "Emmanuel Okafor", dueDate: "2026-08-29", priority: "Urgent", status: "In Progress", notes: "Prepare ice bath for vaccine vial." },
  { id: "task-4", title: "Clean & Disinfect House 1 Brooder", assignedTo: "Suleiman Ibrahim", dueDate: "2026-08-30", priority: "Medium", status: "Pending", notes: "Spray Virkon S solution." },
  { id: "task-5", title: "Restock Layer Mash from Distributor", assignedTo: "Joy Amos", dueDate: "2026-08-31", priority: "High", status: "Pending", notes: "Order 50 bags to replenish low stock." }
];

export const initialWeightRecords = [
  { id: "wt-1", date: "2026-08-28", flockId: "flock-1", flockName: "Broiler Batch A", averageWeightKg: 2.35, sampleSize: 50, notes: "Weekly weighing — on target for Cobb 500." },
  { id: "wt-2", date: "2026-08-21", flockId: "flock-1", flockName: "Broiler Batch A", averageWeightKg: 2.05, sampleSize: 50, notes: "Good uniformity across the pen." },
  { id: "wt-3", date: "2026-08-14", flockId: "flock-1", flockName: "Broiler Batch A", averageWeightKg: 1.72, sampleSize: 50, notes: "Finisher phase started." },
  { id: "wt-4", date: "2026-08-27", flockId: "flock-3", flockName: "Broiler Batch C", averageWeightKg: 0.95, sampleSize: 40, notes: "Grower phase — healthy weight gain." },
  { id: "wt-5", date: "2026-08-20", flockId: "flock-3", flockName: "Broiler Batch C", averageWeightKg: 0.68, sampleSize: 40, notes: "Starter phase." },
  { id: "wt-6", date: "2026-08-26", flockId: "flock-4", flockName: "Cockerel Batch D", averageWeightKg: 1.85, sampleSize: 30, notes: "Slow but steady gain." }
];

export const initialNotifications = [
  { id: "notif-1", title: "Low Feed Warning", message: "TopFeeds Layer Mash Phase 1 is low (18 bags remaining).", type: "Warning", time: "1 hour ago", read: false },
  { id: "notif-2", title: "Vaccination Due Tomorrow", message: "Layer Batch B is scheduled for Newcastle Disease Vaccine.", type: "Information", time: "3 hours ago", read: false },
  { id: "notif-3", title: "Payment Pending", message: "Kwara Fresh Supermarkets has an open invoice of ₦224,000.", type: "Warning", time: "Yesterday", read: true },
  { id: "notif-4", title: "Record Egg Yield", message: "Today's morning egg collection is verified: 114 Crates.", type: "Success", time: "5 hours ago", read: true }
];
