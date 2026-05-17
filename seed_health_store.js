import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new sqlite3.Database(path.join(__dirname, 'vaayun.db'));

const newProducts = [
  // Baby Needs
  {
    sub_category: 'Baby Needs',
    product_name: "Pampers Active Baby Taped Diapers - Large (L), 62 Count",
    salt_composition: "Cotton, Absorbent Polymers",
    product_price: "₹1,150.00",
    product_manufactured: "Procter & Gamble",
    medicine_desc: "Provides up to 12 hours of dryness for your baby's comfortable sleep. Gentle on baby's skin.",
    side_effects: "Rarely causes diaper rash if left unchanged for extended periods.",
    drug_interactions: "None"
  },
  {
    sub_category: 'Baby Needs',
    product_name: "Johnson's Baby Powder, 400g",
    salt_composition: "Talc, Fragrance",
    product_price: "₹240.00",
    product_manufactured: "Johnson & Johnson",
    medicine_desc: "Keeps baby's skin comfortable and dry. Clinically proven mild.",
    side_effects: "Avoid inhalation to prevent respiratory issues.",
    drug_interactions: "None"
  },
  {
    sub_category: 'Baby Needs',
    product_name: "Nestle Cerelac Wheat Apple, 300g",
    salt_composition: "Wheat flour, Apple juice concentrate, Milk solids",
    product_price: "₹280.00",
    product_manufactured: "Nestle",
    medicine_desc: "A complimentary food for babies from 6 months onwards. Rich in Iron.",
    side_effects: "None. Ensure baby is not allergic to milk solids.",
    drug_interactions: "None"
  },

  // Personal Care
  {
    sub_category: 'Personal Care',
    product_name: "Dove Cream Beauty Bathing Bar, 3x100g",
    salt_composition: "1/4 Moisturizing Cream",
    product_price: "₹165.00",
    product_manufactured: "Hindustan Unilever",
    medicine_desc: "Deeply nourishes skin while cleansing. Doesn't dry skin like ordinary soap.",
    side_effects: "Avoid contact with eyes.",
    drug_interactions: "None"
  },
  {
    sub_category: 'Personal Care',
    product_name: "Nivea Body Lotion, Nourishing Body Milk, 400ml",
    salt_composition: "Almond Oil, Vitamin E",
    product_price: "₹399.00",
    product_manufactured: "Nivea",
    medicine_desc: "Provides 48 hours of deep moisture. Ideal for very dry skin.",
    side_effects: "None",
    drug_interactions: "None"
  },

  // Women Care
  {
    sub_category: 'Women Care',
    product_name: "Whisper Choice Ultra Sanitary Pads, XL (20 Count)",
    salt_composition: "Cotton, Super Absorbent Gel",
    product_price: "₹185.00",
    product_manufactured: "Procter & Gamble",
    medicine_desc: "Provides up to 100% stain protection. Extra long for night use.",
    side_effects: "None. Change regularly to maintain hygiene.",
    drug_interactions: "None"
  },
  {
    sub_category: 'Women Care',
    product_name: "V-Wash Plus Expert Intimate Hygiene, 100ml",
    salt_composition: "Lactic Acid, Tea Tree Oil",
    product_price: "₹190.00",
    product_manufactured: "Glenmark Pharmaceuticals",
    medicine_desc: "Maintains natural pH balance of the intimate area. Prevents itchiness.",
    side_effects: "Discontinue if irritation occurs.",
    drug_interactions: "None"
  },

  // Health & Nutrition
  {
    sub_category: 'Health & Nutrition',
    product_name: "Ensure Vanilla Nutrition Powder, 400g",
    salt_composition: "Vitamins, Minerals, Proteins",
    product_price: "₹650.00",
    product_manufactured: "Abbott",
    medicine_desc: "Complete, balanced nutrition for adults. Supports immune system.",
    side_effects: "May cause bloating in lactose-intolerant individuals.",
    drug_interactions: "Consult doctor if on strict dietary restrictions."
  },
  {
    sub_category: 'Health & Nutrition',
    product_name: "Horlicks Health Nutrition Drink, 500g",
    salt_composition: "Malted Barley, Wheat, Milk Solids",
    product_price: "₹340.00",
    product_manufactured: "GlaxoSmithKline",
    medicine_desc: "Clinically proven to improve signs of growth. Rich in calcium and vitamins.",
    side_effects: "None",
    drug_interactions: "None"
  },

  // OTC & Health Needs
  {
    sub_category: 'OTC & Health Needs',
    product_name: "Vicks Vaporub, 50g",
    salt_composition: "Menthol, Camphor, Eucalyptus Oil",
    product_price: "₹145.00",
    product_manufactured: "Procter & Gamble",
    medicine_desc: "Provides relief from cold and cough symptoms. Use as a rub or in steam.",
    side_effects: "Do not apply inside nostrils.",
    drug_interactions: "None"
  },
  {
    sub_category: 'OTC & Health Needs',
    product_name: "Volini Pain Relief Spray, 60g",
    salt_composition: "Diclofenac Diethylamine",
    product_price: "₹180.00",
    product_manufactured: "Sun Pharma",
    medicine_desc: "Fast relief from muscle pain, sprains, and backache.",
    side_effects: "Skin irritation at the application site.",
    drug_interactions: "Do not use on open wounds."
  },

  // Vitamins & Supplements
  {
    sub_category: 'Vitamins & Supplements',
    product_name: "Supradyn Daily Multivitamin Tablets (15 Count)",
    salt_composition: "Multivitamins, Minerals",
    product_price: "₹55.00",
    product_manufactured: "Bayer",
    medicine_desc: "Daily multivitamin tablet for immunity and energy.",
    side_effects: "Nausea if taken on an empty stomach.",
    drug_interactions: "Avoid taking with dairy products."
  },
  {
    sub_category: 'Vitamins & Supplements',
    product_name: "Shelcal 500 Calcium + Vitamin D3 Tablets (15 Count)",
    salt_composition: "Calcium 500mg, Vitamin D3 250 IU",
    product_price: "₹110.00",
    product_manufactured: "Torrent Pharma",
    medicine_desc: "Used to treat calcium and Vitamin D deficiency.",
    side_effects: "Constipation, bloating.",
    drug_interactions: "Interacts with certain antibiotics."
  },

  // Diabetic Needs
  {
    sub_category: 'Diabetic Needs',
    product_name: "Accu-Chek Active Test Strips (50 Count)",
    salt_composition: "Test strips",
    product_price: "₹999.00",
    product_manufactured: "Roche",
    medicine_desc: "For quantitative blood glucose testing. Requires very small blood sample.",
    side_effects: "None",
    drug_interactions: "None"
  },
  {
    sub_category: 'Diabetic Needs',
    product_name: "Sugar Free Gold Pellets (500 Count)",
    salt_composition: "Aspartame",
    product_price: "₹280.00",
    product_manufactured: "Zydus Wellness",
    medicine_desc: "Zero calorie sweetener for diabetic patients or weight watchers.",
    side_effects: "Not recommended for children.",
    drug_interactions: "None"
  },

  // Ayurvedic
  {
    sub_category: 'Ayurvedic',
    product_name: "Dabur Chyawanprash, 1kg",
    salt_composition: "Amla, Herbs, Honey",
    product_price: "₹360.00",
    product_manufactured: "Dabur",
    medicine_desc: "Ayurvedic health supplement. Boosts immunity and strength.",
    side_effects: "May cause minor stomach upset in sensitive individuals.",
    drug_interactions: "None"
  },
  {
    sub_category: 'Ayurvedic',
    product_name: "Himalaya Liv.52 DS Tablets (60 Count)",
    salt_composition: "Caper Bush, Chicory",
    product_price: "₹160.00",
    product_manufactured: "Himalaya",
    medicine_desc: "Protects the liver against hepatotoxins. Promotes appetite and growth.",
    side_effects: "None reported.",
    drug_interactions: "None"
  },

  // Combo Products
  {
    sub_category: 'Combo Products',
    product_name: "Essential First Aid Kit",
    salt_composition: "Bandages, Antiseptic Cream, Cotton",
    product_price: "₹450.00",
    product_manufactured: "Vaayun Care",
    medicine_desc: "Complete first aid box for home and travel emergencies.",
    side_effects: "None",
    drug_interactions: "None"
  }
];

const insertQuery = `INSERT INTO medicines (sub_category, product_name, salt_composition, product_price, product_manufactured, medicine_desc, side_effects, drug_interactions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

db.serialize(() => {
  let count = 0;
  const stmt = db.prepare(insertQuery);
  newProducts.forEach((p) => {
    stmt.run([p.sub_category, p.product_name, p.salt_composition, p.product_price, p.product_manufactured, p.medicine_desc, p.side_effects, p.drug_interactions], (err) => {
      if (err) console.error(err);
      else count++;
    });
  });
  stmt.finalize(() => {
    console.log(`Successfully inserted ${count} health store products.`);
    db.close();
  });
});
