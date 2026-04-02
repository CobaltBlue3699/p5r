import axios from 'axios';
import * as cheerio from 'cheerio';
import initSqlJs from 'sql.js';
import fs from 'fs';

const DATA_DIR = './data';
const DB_PATH = `${DATA_DIR}/personas.db`;
const RETRY_DELAY = 10000; // Start at 10 seconds

async function getProblematicPersonas() {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);
   
  const result = db.exec('SELECT name_cn, wiki_url FROM personas WHERE (strength IS NULL OR strength = 0) AND wiki_url IS NOT NULL');
  db.close();
   
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    name_cn: row[0],
    wiki_url: row[1]
  }));
}

async function scrapeWithRetry(url, retries = 15) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 120000 // Increased timeout to 2 minutes
      });
      
      if (response.status === 200 && response.data && response.data.length > 10000) {
        return response.data;
      }
      console.log(`  Status ${response.status}, content length: ${response.data?.length || 0}`);
    } catch (error) {
      const isRateLimit = error.response?.status === 567 || error.code === 'ECONNRESET';
      console.log(`  Attempt ${i + 1}/${retries}: ${error.message}${isRateLimit ? ' (rate limit)' : ''}`);
    }
    
    if (i < retries - 1) {
      // Much more aggressive backoff - start at 10s, max at 2min
      const delay = Math.min(RETRY_DELAY * Math.pow(1.5, i), 120000);
      console.log(`  Waiting ${delay}ms before retry...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  return null;
}

async function scrapePersonaDetail(url) {
  const html = await scrapeWithRetry(url);
  if (!html) return null;
  
  try {
    const $ = cheerio.load(html);
    const detail = {
      name_en: null,
      name_jp: null,
      arcana: '',
      level: 0,
      strength: 0,
      magic: 0,
      endurance: 0,
      agility: 0,
      luck: 0,
      trait: null,
      trait_desc: null,
      item_name: null,
    };
    
    const table = $('table').first();
    const rows = table.find('tr');
    
    rows.each((i, row) => {
      const cells = $(row).find('td');
      cells.each((j, cell) => {
        const text = $(cell).text().trim();
        
        if (text === '英文名') {
          const nextCell = $(cells[j + 1]);
          detail.name_en = nextCell.text().trim() || null;
        }
        if (text === '日文名') {
          const nextCell = $(cells[j + 1]);
          detail.name_jp = nextCell.text().trim() || null;
        }
        if (text === '阿尔卡那') {
          const nextCell = $(cells[j + 1]);
          detail.arcana = nextCell.text().trim();
        }
        if (text === '等级') {
          const nextCell = $(cells[j + 1]);
          detail.level = parseInt(nextCell.text().trim()) || 0;
        }
        if (text === '特性') {
          const nextCell = $(cells[j + 1]);
          detail.trait = nextCell.text().trim() || null;
          const descCell = $(cells[j + 2]);
          detail.trait_desc = descCell.text().trim() || null;
        }
        if (text === '电刑') {
          const nextCell = $(cells[j + 1]);
          detail.item_name = nextCell.text().trim() || null;
        }
      });
    });
    
    const statMap = {
      '力': 'strength',
      '魔': 'magic',
      '耐': 'endurance',
      '速': 'agility',
      '运': 'luck'
    };
    
    $('.test .item').each((i, item) => {
      const title = $(item).find('.title').text().trim();
      const num = $(item).find('.num').text().trim();
      
      if (statMap[title]) {
        detail[statMap[title]] = parseInt(num) || 0;
      }
    });
    
    return detail;
  } catch (error) {
    console.error(`Parse error: ${error.message}`);
    return null;
  }
}

async function updateDatabase(personas) {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);
   
  try {
    db.run(`ALTER TABLE personas ADD COLUMN strength INTEGER DEFAULT 0`);
    db.run(`ALTER TABLE personas ADD COLUMN magic INTEGER DEFAULT 0`);
    db.run(`ALTER TABLE personas ADD COLUMN endurance INTEGER DEFAULT 0`);
    db.run(`ALTER TABLE personas ADD COLUMN agility INTEGER DEFAULT 0`);
    db.run(`ALTER TABLE personas ADD COLUMN luck INTEGER DEFAULT 0`);
    db.run(`ALTER TABLE personas ADD COLUMN trait TEXT`);
    db.run(`ALTER TABLE personas ADD COLUMN item_name TEXT`);
  } catch (e) {
    // columns may already exist
  }
   
  let updated = 0;
  let skipped = 0;
  let total = personas.length;
  let progress = 0;
   
  for (const persona of personas) {
    if (!persona.wiki_url) {
      skipped++;
      continue;
    }
   
    progress++;
    process.stdout.write(`[${progress}/${total}] Scraping ${persona.name_cn}...`);
    const detail = await scrapePersonaDetail(persona.wiki_url);
   
    if (detail && detail.name_en) {
      db.run(`
        UPDATE personas SET
          name_en = ?,
          name_jp = ?,
          strength = ?,
          magic = ?,
          endurance = ?,
          agility = ?,
          luck = ?,
          trait = ?,
          item_name = ?
        WHERE name_cn = ?
      `, [
        detail.name_en,
        detail.name_jp,
        detail.strength,
        detail.magic,
        detail.endurance,
        detail.agility,
        detail.luck,
        detail.trait,
        detail.item_name,
        persona.name_cn
      ]);
   
      updated++;
      console.log(` OK (STR:${detail.strength} MAG:${detail.magic} END:${detail.endurance} AGI:${detail.agility} LUK:${detail.luck})`);
   
      if (updated % 10 === 0) {
        const data = db.export();
        fs.writeFileSync(DB_PATH, Buffer.from(data));
        console.log(`\nSaved progress (${updated} updated)...\n`);
      }
   
      await new Promise(r => setTimeout(r, 3000));
    } else {
      skipped++;
      console.log(` SKIP (rate limited or parse failed)`);
      await new Promise(r => setTimeout(r, 10000)); // Longer wait for skips
    }
  }
   
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  console.log(`\n\nUpdated ${updated} personas, ${skipped} skipped`);
  db.close();
}

async function main() {
  console.log('Fetching problematic personas...');
  const personas = await getProblematicPersonas();
  console.log(`Found ${personas.length} personas needing update\n`);
   
  if (personas.length === 0) {
    console.log('All personas already have stats!');
    return;
  }
   
  await updateDatabase(personas);
}

main();