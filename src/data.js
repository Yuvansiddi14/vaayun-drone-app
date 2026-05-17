export const categories = [
  { id: 'medicines', name: 'Medicines', icon: 'Pill' },
  { id: 'healthcare', name: 'Healthcare', icon: 'HeartPulse' },
  { id: 'labtests', name: 'Lab Tests', icon: 'Microscope' },
  { id: 'personal', name: 'Personal Care', icon: 'Sparkles' },
  { id: 'ayurveda', name: 'Ayurveda', icon: 'Leaf' },
  { id: 'devices', name: 'Devices', icon: 'Thermometer' },
  { id: 'baby', name: 'Baby Care', icon: 'Baby' },
  { id: 'nutrition', name: 'Nutrition', icon: 'Apple' },
];

export const medicines = [
  // Medicines
  { id: 1, name: "Dolo 650 Tablet 15'S", brand: "Micro Labs Ltd", price: 33.15, mrp: 39.00, discount: "15% OFF", category: "medicines", type: "Tablet", droneEligible: true, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop" },
  { id: 2, name: "Calpol 500mg Tablet 15'S", brand: "GSK", price: 15.50, mrp: 18.00, discount: "14% OFF", category: "medicines", type: "Tablet", droneEligible: true, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop" },
  { id: 3, name: "Augmentin 625 Duo Tablet", brand: "GSK", price: 201.00, mrp: 220.00, discount: "8% OFF", category: "medicines", type: "Tablet", droneEligible: true, image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop" },
  { id: 4, name: "Pan 40 Tablet 15'S", brand: "Alkem", price: 155.00, mrp: 180.00, discount: "14% OFF", category: "medicines", type: "Tablet", droneEligible: true, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop" },
  { id: 5, name: "Allegra 120mg Tablet 10'S", brand: "Sanofi", price: 215.00, mrp: 240.00, discount: "10% OFF", category: "medicines", type: "Tablet", droneEligible: true, image: "https://images.unsplash.com/photo-1550572017-ed200f545dec?w=200&h=200&fit=crop" },
  
  // Pain Relief
  { id: 6, name: "Volini Pain Relief Gel 30gm", brand: "Sun Pharma", price: 99.00, mrp: 110.00, discount: "10% OFF", category: "medicines", type: "Gel", droneEligible: true, image: "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=200&h=200&fit=crop" },
  { id: 7, name: "Moov Pain Relief Cream 50gm", brand: "Reckitt", price: 180.00, mrp: 195.00, discount: "7% OFF", category: "medicines", type: "Cream", droneEligible: true, image: "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=200&h=200&fit=crop" },

  // Cough & Cold
  { id: 8, name: "Honitus Cough Syrup 100ml", brand: "Dabur", price: 95.00, mrp: 105.00, discount: "9% OFF", category: "ayurveda", type: "Syrup", droneEligible: true, image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=200&h=200&fit=crop" },
  { id: 9, name: "Benadryl Cough Syrup 150ml", brand: "J&J", price: 125.00, mrp: 140.00, discount: "10% OFF", category: "medicines", type: "Syrup", droneEligible: true, image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=200&h=200&fit=crop" },
  { id: 10, name: "Vicks VapoRub 50ml", brand: "P&G", price: 145.00, mrp: 155.00, discount: "6% OFF", category: "healthcare", type: "Balm", droneEligible: true, image: "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=200&h=200&fit=crop" },

  // Devices
  { id: 11, name: "Accu-Chek Active Test Strips 50's", brand: "Roche", price: 849.00, mrp: 999.00, discount: "15% OFF", category: "devices", type: "Strips", droneEligible: false, image: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=200&h=200&fit=crop" },
  { id: 12, name: "Omron BP Monitor", brand: "Omron", price: 2150.00, mrp: 2500.00, discount: "14% OFF", category: "devices", type: "Device", droneEligible: false, image: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=200&h=200&fit=crop" },
  { id: 13, name: "Dr Trust Pulse Oximeter", brand: "Dr Trust", price: 999.00, mrp: 1499.00, discount: "33% OFF", category: "devices", type: "Device", droneEligible: true, image: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=200&h=200&fit=crop" },

  // Personal Care
  { id: 14, name: "Cetaphil Gentle Skin Cleanser 125ml", brand: "Galderma", price: 320.00, mrp: 350.00, discount: "8% OFF", category: "personal", type: "Lotion", droneEligible: true, image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&h=200&fit=crop" },
  { id: 15, name: "Dove Soap Bar 100g", brand: "Unilever", price: 55.00, mrp: 60.00, discount: "8% OFF", category: "personal", type: "Soap", droneEligible: true, image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&h=200&fit=crop" },

  // Ayurveda
  { id: 16, name: "Patanjali Chyawanprash 1kg", brand: "Patanjali", price: 340.00, mrp: 360.00, discount: "5% OFF", category: "ayurveda", type: "Paste", droneEligible: false, image: "https://images.unsplash.com/photo-1611078810613-2d2c70034a2e?w=200&h=200&fit=crop" },
  { id: 17, name: "Himalaya Liv.52 DS 60's", brand: "Himalaya", price: 170.00, mrp: 190.00, discount: "10% OFF", category: "ayurveda", type: "Tablet", droneEligible: true, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop" },
  
  // Nutrition
  { id: 18, name: "Ensure Vanilla Powder 400g", brand: "Abbott", price: 740.00, mrp: 790.00, discount: "6% OFF", category: "nutrition", type: "Powder", droneEligible: false, image: "https://images.unsplash.com/photo-1550572017-ed200f545dec?w=200&h=200&fit=crop" },
  { id: 19, name: "Revital H Capsules 30's", brand: "Sun Pharma", price: 290.00, mrp: 320.00, discount: "9% OFF", category: "nutrition", type: "Capsule", droneEligible: true, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop" },

  // Baby Care
  { id: 20, name: "Pampers Active Baby Diapers (L) 30's", brand: "P&G", price: 540.00, mrp: 599.00, discount: "10% OFF", category: "baby", type: "Diaper", droneEligible: false, image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=200&h=200&fit=crop" },
  { id: 21, name: "Johnson's Baby Powder 200g", brand: "J&J", price: 160.00, mrp: 175.00, discount: "8% OFF", category: "baby", type: "Powder", droneEligible: true, image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&h=200&fit=crop" },
];
