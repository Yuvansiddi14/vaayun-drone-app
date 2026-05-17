import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new sqlite3.Database(path.join(__dirname, 'vaayun.db'));

const CSV_FILE = path.join(__dirname, 'en.openbeautyfacts.org.products.csv');

const healthStoreCategories = [
  'Factory Direct', 'Gift Store', 'Baby Needs', 'Personal Care', 'Women Care', 
  'Health & Nutrition', 'OTC & Health Needs', 'Vitamins & Supplements', 
  'Diabetic Needs', 'Household Needs', 'Ayurvedic', 'Fashion & Lifestyle', 'Combo Products'
];

function getRandomCategory(categoriesString) {
  if (!categoriesString) return 'Personal Care';
  const lowerCat = categoriesString.toLowerCase();
  if (lowerCat.includes('baby')) return 'Baby Needs';
  if (lowerCat.includes('women') || lowerCat.includes('feminine')) return 'Women Care';
  if (lowerCat.includes('nutrition') || lowerCat.includes('vitamin') || lowerCat.includes('supplement')) return 'Health & Nutrition';
  if (lowerCat.includes('ayurved')) return 'Ayurvedic';
  if (lowerCat.includes('diabetic')) return 'Diabetic Needs';
  return 'Personal Care'; // Default fallback
}

function getRandomPrice() {
  const price = Math.floor(Math.random() * (1500 - 50 + 1)) + 50;
  return `₹${price}.00`;
}

console.log("Starting OpenBeautyFacts import process...");

let totalProcessed = 0;
let totalInserted = 0;
const BATCH_SIZE = 1000;
let batch = [];

db.run("PRAGMA synchronous = OFF");
db.run("PRAGMA journal_mode = MEMORY");

function insertBatch(currentBatch, callback) {
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare(`INSERT INTO medicines (sub_category, product_name, salt_composition, product_price, product_manufactured, medicine_desc, side_effects, drug_interactions, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    for (const p of currentBatch) {
      stmt.run([p.sub_category, p.product_name, p.salt_composition, p.product_price, p.product_manufactured, p.medicine_desc, p.side_effects, p.drug_interactions, p.image_url]);
    }
    
    stmt.finalize();
    db.run("COMMIT", callback);
  });
}

// Check if file exists
if (!fs.existsSync(CSV_FILE)) {
  console.error("CSV file not found! Ensure it is downloaded and extracted.");
  process.exit(1);
}

fs.createReadStream(CSV_FILE)
  .pipe(csv({ separator: '\t' })) // OpenBeautyFacts uses tabs
  .on('data', (row) => {
    totalProcessed++;
    
    const name = row['product_name'] || row['generic_name'];
    if (!name || name.trim() === '') return;

    const ingredients = row['ingredients_text'] || 'Proprietary Blend';
    const brand = row['brands'] || 'Generic Beauty';
    const desc = row['categories_en'] || 'Personal Care & Beauty Item';
    const imageUrl = row['image_small_url'] || row['image_url'] || null;
    
    const product = {
      sub_category: getRandomCategory(desc),
      product_name: name,
      salt_composition: ingredients,
      product_price: getRandomPrice(),
      product_manufactured: brand,
      medicine_desc: desc,
      side_effects: "For external use only. Discontinue if irritation occurs.",
      drug_interactions: "None known for topical application.",
      image_url: imageUrl
    };

    batch.push(product);

    if (batch.length >= BATCH_SIZE) {
      const currentBatch = [...batch];
      batch = [];
      totalInserted += currentBatch.length;
      insertBatch(currentBatch, () => {
        if (totalInserted % 5000 === 0) {
          console.log(`Inserted ${totalInserted} products so far...`);
        }
      });
    }
  })
  .on('end', () => {
    if (batch.length > 0) {
      totalInserted += batch.length;
      insertBatch(batch, () => {
        console.log(`\nImport Complete!`);
        console.log(`Total Rows Processed: ${totalProcessed}`);
        console.log(`Total Valid Products Inserted: ${totalInserted}`);
        db.close();
      });
    } else {
      console.log(`\nImport Complete!`);
      console.log(`Total Rows Processed: ${totalProcessed}`);
      console.log(`Total Valid Products Inserted: ${totalInserted}`);
      db.close();
    }
  });
