import fs from 'fs';
import csv from 'csv-parser';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database(join(__dirname, 'vaayun.db'));

db.serialize(() => {
  // Create table with appropriate columns
  db.run(`CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sub_category TEXT,
    product_name TEXT,
    salt_composition TEXT,
    product_price TEXT,
    product_manufactured TEXT,
    medicine_desc TEXT,
    side_effects TEXT,
    drug_interactions TEXT
  )`);

  // Clear existing data to avoid duplicates if run multiple times
  db.run(`DELETE FROM medicines`);

  console.log('Importing 250,000+ medicines... This might take a minute or two.');

  let count = 0;
  
  // Use a transaction for fast bulk inserts
  db.run("BEGIN TRANSACTION");
  
  const stmt = db.prepare(`INSERT INTO medicines (
    sub_category, product_name, salt_composition, product_price, product_manufactured, medicine_desc, side_effects, drug_interactions
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  fs.createReadStream('medicine_data.csv')
    .pipe(csv())
    .on('data', (row) => {
      stmt.run([
        row.sub_category,
        row.product_name,
        row.salt_composition,
        row.product_price,
        row.product_manufactured,
        row.medicine_desc,
        row.side_effects,
        row.drug_interactions
      ]);
      count++;
      if (count % 10000 === 0) {
        console.log(`Imported ${count} medicines...`);
      }
    })
    .on('end', () => {
      stmt.finalize();
      db.run("COMMIT", () => {
        console.log(`✅ Successfully imported ${count} medicines into the database!`);
        
        // Add an index to product_name to make searches blazing fast
        db.run('CREATE INDEX IF NOT EXISTS idx_product_name ON medicines(product_name)', () => {
          console.log('✅ Created search index.');
          db.close();
        });
      });
    });
});
