import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_PATH = path.join(DATA_DIR, 'personas.db');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const PROGRESS_FILE = path.join(DATA_DIR, 'scraper-progress-details.json');

const RATE_LIMIT_WAIT = 10000;
const MAX_RETRIES = 5;

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { processed: [], failed: [], lastUpdate: null };
}

function saveProgress(progress) {
  progress.lastUpdate = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function downloadImage(imageUrl, localPath, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (fs.existsSync(localPath)) {
        return { success: true, path: localPath };
      }
      
      const response = await axios.get(imageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      fs.writeFileSync(localPath, Buffer.from(response.data));
      return { success: true, path: localPath };
      
    } catch (error) {
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
  }
  return { success: false, path: null };
}

async function scrapePersonaDetail(url, personaName, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 30000
      });
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const $ = cheerio.load(response.data);
      const detail = {
        strength: 0,
        magic: 0,
        endurance: 0,
        agility: 0,
        luck: 0,
        trait: null,
        trait_desc: null,
        inherit_phys: 0,
        inherit_gun: 0,
        inherit_fire: 0,
        inherit_ice: 0,
        inherit_elec: 0,
        inherit_wind: 0,
        inherit_psy: 0,
        inherit_nuke: 0,
        inherit_bless: 0,
        inherit_curse: 0,
        inherit_abnormal: 0,
        inherit_recovery: 0,
        reverseRecipes: [],
        image_url: null,
        local_image_path: null
      };
      
      // Image is now downloaded from the list page URL, not from detail page
      
      // Parse basic info table
      $('table').first().find('tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length < 2) return;
        
        const label = $(cells[0]).text().trim();
        const value = $(cells[1]).text().trim();
        
        if (label === '特性') detail.trait = value || null;
        if (label === '电刑') detail.trait_desc = value || null;
      });
      
      // Parse stats (力, 魔, 耐, 速, 运)
      const statMap = { '力': 'strength', '魔': 'magic', '耐': 'endurance', '速': 'agility', '运': 'luck' };
      const statText = $('body').text();
      
      for (const [label, stat] of Object.entries(statMap)) {
        const regex = new RegExp(`${label}[\\s:：]*(\\d+)`);
        const match = statText.match(regex);
        if (match) {
          detail[stat] = parseInt(match[1]) || 0;
        }
      }
      
      // Parse skill inheritance flags from Table 2 (index 1)
      // Structure: Row 0 = title "技能继承", Row 1 = header icons, Row 2 = 12 values (× or √)
      // Order: 物理, 枪械, 火焰, 冰冻, 电击, 疾风, 念动, 核热, 祝福, 咒怨, 异常, 恢复
      // Note: Each value cell is followed by an empty cell, so we filter non-empty cells
      const inheritOrder = [
        'inherit_phys',   // 物理
        'inherit_gun',    // 枪械
        'inherit_fire',   // 火焰
        'inherit_ice',    // 冰冻
        'inherit_elec',   // 电击
        'inherit_wind',   // 疾风
        'inherit_psy',    // 念动
        'inherit_nuke',   // 核热
        'inherit_bless',  // 祝福
        'inherit_curse',  // 咒怨
        'inherit_abnormal', // 异常
        'inherit_recovery'  // 恢复
      ];
      
      const tables = $('table');
      // Skill inheritance table is at index 2 (after base stats table at index 1)
      if (tables.length >= 3) {
        const inheritTable = tables.eq(2);
        const inheritText = inheritTable.text();
        
        if (inheritText.includes('技能继承')) {
          const rows = inheritTable.find('tr');
          if (rows.length >= 3) {
            const valueRow = rows.eq(2);
            const allCells = valueRow.find('td, th');
            
            // Filter out empty cells (each value is followed by an empty cell)
            const valueCells = allCells.filter((i, cell) => $(cell).text().trim() !== '');
            
            valueCells.each((idx, cell) => {
              if (idx < inheritOrder.length) {
                const text = $(cell).text().trim();
                if (text === '√') {
                  detail[inheritOrder[idx]] = 1;
                }
              }
            });
          }
        }
      }
      
      // Parse reverse fusion recipes
      $('table').each((i, table) => {
        const tableText = $(table).text();
        if (tableText.includes('素材1') && tableText.includes('素材2') && tableText.includes('价格')) {
          $(table).find('tbody tr, tr').each((j, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 7) {
              const priceText = $(cells[0]).text().trim();
              const arcana1 = $(cells[1]).text().trim();
              const level1 = parseInt($(cells[2]).text().trim()) || 0;
              const name1 = $(cells[3]).text().trim();
              const arcana2 = $(cells[4]).text().trim();
              const level2 = parseInt($(cells[5]).text().trim()) || 0;
              const name2 = $(cells[6]).text().trim();
              
              if (name1 && name2 && !name1.includes('素材') && !name2.includes('素材')) {
                detail.reverseRecipes.push({
                  price: parseInt(priceText.replace(/,/g, '')) || 0,
                  ingredient1: { name: name1, level: level1, arcana: arcana1 },
                  ingredient2: { name: name2, level: level2, arcana: arcana2 }
                });
              }
            }
          });
        }
      });
      
      return { success: true, detail };
      
    } catch (error) {
      const status = error.response?.status;
      
      if (status === 567 || status === 429 || status === 503) {
        console.log(`\n  Rate limited, waiting ${RATE_LIMIT_WAIT}ms...`);
        await new Promise(r => setTimeout(r, RATE_LIMIT_WAIT));
      } else if (attempt < retries - 1) {
        console.log(`\n  Error: ${error.message}, retrying...`);
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      } else {
        return { success: false, detail: null };
      }
    }
  }
  
  return { success: false, detail: null };
}

async function main() {
  console.log('Loading personas from database...');
  
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);
  
  // Ensure columns exist
  try {
    db.exec(`ALTER TABLE personas ADD COLUMN local_image_path TEXT`);
    db.exec(`ALTER TABLE personas ADD COLUMN trait TEXT`);
    db.exec(`ALTER TABLE personas ADD COLUMN trait_desc TEXT`);
    db.exec(`ALTER TABLE personas ADD COLUMN strength INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN magic INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN endurance INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN agility INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN luck INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN inherit_phys INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN inherit_gun INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN inherit_fire INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN inherit_ice INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN inherit_elec INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN inherit_wind INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN inherit_psy INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN inherit_nuke INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN inherit_bless INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN inherit_curse INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN inherit_abnormal INTEGER DEFAULT 0`);
    db.exec(`ALTER TABLE personas ADD COLUMN inherit_recovery INTEGER DEFAULT 0`);
    
    // Create fusion_recipes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS fusion_recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        result_persona_id INTEGER NOT NULL,
        price INTEGER DEFAULT 0,
        ingredient_a_id INTEGER NOT NULL,
        ingredient_b_id INTEGER NOT NULL,
        FOREIGN KEY (result_persona_id) REFERENCES personas(id),
        FOREIGN KEY (ingredient_a_id) REFERENCES personas(id),
        FOREIGN KEY (ingredient_b_id) REFERENCES personas(id)
      )
    `);
  } catch (e) {
    // Columns/tables may already exist
  }
  
  const personas = db.exec(`SELECT id, name_cn, wiki_url, image_url FROM personas`);
  const personaList = personas[0]?.values || [];
  console.log(`Found ${personaList.length} personas`);
  
  let progress = loadProgress();
  console.log(`Progress: ${progress.processed.length} processed, ${progress.failed.length} failed`);
  
  // Filter to only pending personas
  const pending = personaList.filter(p => !progress.processed.includes(p[1]));
  console.log(`Pending: ${pending.length}`);
  
  let successCount = 0;
  let failCount = 0;
  
  // Process each persona
  for (let i = 0; i < pending.length; i++) {
    const [id, name, wikiUrl, imageUrl] = pending[i];
    
    if (!wikiUrl) {
      console.log(`[${i + 1}/${pending.length}] ${name}: No wiki URL, skipping`);
      progress.processed.push(name);
      continue;
    }
    
    process.stdout.write(`[${i + 1}/${pending.length}] ${name}... `);
    
    const result = await scrapePersonaDetail(wikiUrl, name);
    
    if (result.success && result.detail) {
      const d = result.detail;
      
      // Download avatar image from list page URL
      let localImagePath = null;
      if (imageUrl) {
        const safeName = name.replace(/[\/\\:*?"<>|]/g, '_');
        const localFilename = `60px-P5R_${safeName}.png`;
        const localPath = path.join(IMAGES_DIR, localFilename);
        
        const downloadResult = await downloadImage(imageUrl, localPath);
        if (downloadResult.success) {
          localImagePath = `/data/images/${localFilename}`;
        }
      }
      
      // Update persona in database
      db.run(`
        UPDATE personas SET 
          trait = ?,
          trait_desc = ?,
          strength = ?,
          magic = ?,
          endurance = ?,
          agility = ?,
          luck = ?,
          inherit_phys = ?,
          inherit_gun = ?,
          inherit_fire = ?,
          inherit_ice = ?,
          inherit_elec = ?,
          inherit_wind = ?,
          inherit_psy = ?,
          inherit_nuke = ?,
          inherit_bless = ?,
          inherit_curse = ?,
          inherit_abnormal = ?,
          inherit_recovery = ?,
          image_url = ?,
          local_image_path = ?
        WHERE id = ?
      `, [
        d.trait, d.trait_desc,
        d.strength, d.magic, d.endurance, d.agility, d.luck,
        d.inherit_phys, d.inherit_gun, d.inherit_fire, d.inherit_ice,
        d.inherit_elec, d.inherit_wind, d.inherit_psy, d.inherit_nuke,
        d.inherit_bless, d.inherit_curse, d.inherit_abnormal, d.inherit_recovery,
        imageUrl, localImagePath,
        id
      ]);
      
      // Save reverse recipes to database
      if (d.reverseRecipes.length > 0) {
        // Delete existing recipes for this persona
        db.run(`DELETE FROM fusion_recipes WHERE result_persona_id = ?`, [id]);
        
        // Insert new recipes (look up ingredient persona IDs)
        for (const recipe of d.reverseRecipes) {
          // Find ingredient A ID by name
          const ing1Result = db.exec(`SELECT id FROM personas WHERE name_cn = '${recipe.ingredient1.name.replace(/'/g, "''")}'`);
          const ing1Id = ing1Result[0]?.values[0]?.[0];
          
          // Find ingredient B ID by name
          const ing2Result = db.exec(`SELECT id FROM personas WHERE name_cn = '${recipe.ingredient2.name.replace(/'/g, "''")}'`);
          const ing2Id = ing2Result[0]?.values[0]?.[0];
          
          if (ing1Id && ing2Id) {
            db.run(`
              INSERT INTO fusion_recipes (
                result_persona_id, price,
                ingredient_a_id, ingredient_b_id
              ) VALUES (?, ?, ?, ?)
            `, [id, recipe.price, ing1Id, ing2Id]);
          }
        }
      }
      
      console.log(`✓ traits=${!!d.trait}, stats=${d.strength}/${d.magic}/${d.endurance}/${d.agility}/${d.luck}, recipes=${d.reverseRecipes.length}, image=${localImagePath ? 'yes' : 'no'}`);
      
      progress.processed.push(name);
      progress.failed = progress.failed.filter(n => n !== name);
      successCount++;
    } else {
      console.log(`✗`);
      
      if (!progress.failed.includes(name)) {
        progress.failed.push(name);
      }
      failCount++;
    }
    
    // Save progress periodically
    if ((i + 1) % 10 === 0) {
      const data = db.export();
      fs.writeFileSync(DB_PATH, Buffer.from(data));
      saveProgress(progress);
      
      console.log(`\nProgress saved (${i + 1}/${pending.length})`);
    }
    
    // Be polite
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Final save
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  saveProgress(progress);
  
  // Get recipe count
  const recipeCount = db.exec(`SELECT COUNT(*) FROM fusion_recipes`)[0]?.values[0][0] || 0;
  const recipePersonaCount = db.exec(`SELECT COUNT(DISTINCT result_persona_id) FROM fusion_recipes`)[0]?.values[0][0] || 0;
  
  console.log(`\n=== Done ===`);
  console.log(`Success: ${successCount}, Failed: ${failCount}`);
  console.log(`Fusion recipes: ${recipeCount} recipes from ${recipePersonaCount} personas`);
  
  db.close();
}

main().catch(console.error);
