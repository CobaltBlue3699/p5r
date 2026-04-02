import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const IMAGES_DIR = path.join(DATA_DIR, 'images');

const WIKI_URL = 'https://wiki.biligame.com/persona/P5R/%E4%BA%BA%E6%A0%BC%E9%9D%A2%E5%85%B7%E5%9B%BE%E9%89%B4';
const IMAGE_BASE_URL = 'https://patchwiki.biligame.com/images/persona/';

const RESIST_MAP = {
  '-': null,
  '無': 'null',
  '弱': 'weak',
  '耐': 'resist',
  '反': 'repel',
  '吸': 'absorb',
  '封': 'block'
};

async function downloadImage(imageUrl, savePath) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(savePath, response.data);
    return true;
  } catch (error) {
    console.error(`Failed to download ${imageUrl}:`, error.message);
    return false;
  }
}

function parseResist(value) {
  return RESIST_MAP[value] || null;
}

async function scrape() {
  console.log('Fetching wiki page...');
  
  const response = await axios.get(WIKI_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 30000
  });
  
  const $ = cheerio.load(response.data);
  const personas = [];
  
  const wikiTable = $('.wikitable tbody tr');
  
  wikiTable.each((index, row) => {
    if (index === 0) return;
    
    const cells = $(row).find('td');
    if (cells.length < 12) return;
    
    const imgTag = $(cells[0]).find('img');
    const imageUrl = imgTag.attr('src') || '';
    
    const nameLink = $(cells[1]).find('a');
    const nameCn = nameLink.text().trim();
    const wikiUrl = 'https://wiki.biligame.com' + (nameLink.attr('href') || '');
    
    const level = parseInt($(cells[2]).text().trim()) || 0;
    const nameEn = $(cells[3]).text().trim();
    const nameJp = $(cells[4]).text().trim();
    const arcana = $(cells[5]).text().trim();
    
    const physResist = parseResist($(cells[6]).text().trim());
    const gunResist = parseResist($(cells[7]).text().trim());
    const fireResist = parseResist($(cells[8]).text().trim());
    const iceResist = parseResist($(cells[9]).text().trim());
    const elecResist = parseResist($(cells[10]).text().trim());
    const windResist = parseResist($(cells[11]).text().trim());
    const psyResist = $(cells[12]) ? parseResist($(cells[12]).text().trim()) : null;
    const nukeResist = $(cells[13]) ? parseResist($(cells[13]).text().trim()) : null;
    const blessResist = $(cells[14]) ? parseResist($(cells[14]).text().trim()) : null;
    const curseResist = $(cells[15]) ? parseResist($(cells[15]).text().trim()) : null;
    
    if (nameCn && level > 0) {
      personas.push({
        name_cn: nameCn,
        name_en: nameEn || null,
        name_jp: nameJp || null,
        level,
        arcana,
        phys_resist: physResist,
        gun_resist: gunResist,
        fire_resist: fireResist,
        ice_resist: iceResist,
        elec_resist: elecResist,
        wind_resist: windResist,
        psy_resist: psyResist,
        nuke_resist: nukeResist,
        bless_resist: blessResist,
        curse_resist: curseResist,
        image_url: imageUrl,
        wiki_url: wikiUrl,
        local_image_path: null
      });
    }
  });
  
  console.log(`Found ${personas.length} personas`);
  return personas;
}

async function saveToDatabase(personas) {
  const SQL = await initSqlJs();
  const dbPath = path.join(DATA_DIR, 'personas.db');
  
  let db;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS personas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_cn TEXT NOT NULL,
      name_en TEXT,
      name_jp TEXT,
      level INTEGER NOT NULL,
      arcana TEXT NOT NULL,
      phys_resist TEXT,
      gun_resist TEXT,
      fire_resist TEXT,
      ice_resist TEXT,
      elec_resist TEXT,
      wind_resist TEXT,
      psy_resist TEXT,
      nuke_resist TEXT,
      bless_resist TEXT,
      curse_resist TEXT,
      image_url TEXT,
      local_image_path TEXT,
      wiki_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  
  db.run(`DELETE FROM personas`);
  
  const stmt = db.prepare(`
    INSERT INTO personas (
      name_cn, name_en, name_jp, level, arcana,
      phys_resist, gun_resist, fire_resist, ice_resist, elec_resist,
      wind_resist, psy_resist, nuke_resist, bless_resist, curse_resist,
      image_url, local_image_path, wiki_url, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  
  for (const p of personas) {
    stmt.run([
      p.name_cn, p.name_en, p.name_jp, p.level, p.arcana,
      p.phys_resist, p.gun_resist, p.fire_resist, p.ice_resist, p.elec_resist,
      p.wind_resist, p.psy_resist, p.nuke_resist, p.bless_resist, p.curse_resist,
      p.image_url, p.local_image_path, p.wiki_url
    ]);
  }
  
  stmt.free();
  
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  
  console.log(`Saved ${personas.length} personas to database`);
  db.close();
}

async function downloadImages(personas) {
  let downloaded = 0;
  
  for (const persona of personas) {
    if (!persona.image_url) continue;
    
    const filename = persona.image_url.split('/').pop();
    const savePath = path.join(IMAGES_DIR, filename);
    
    if (fs.existsSync(savePath)) {
      persona.local_image_path = savePath;
      downloaded++;
      continue;
    }
    
    const fullUrl = persona.image_url.startsWith('http') 
      ? persona.image_url 
      : IMAGE_BASE_URL + persona.image_url;
    
    const success = await downloadImage(fullUrl, savePath);
    if (success) {
      persona.local_image_path = savePath;
      downloaded++;
    }
    
    if (downloaded % 20 === 0) {
      console.log(`Downloaded ${downloaded}/${personas.length} images...`);
    }
  }
  
  console.log(`Downloaded ${downloaded} images`);
  return personas;
}

async function main() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }
    
    const personas = await scrape();
    
    const withImages = await downloadImages(personas);
    
    await saveToDatabase(withImages);
    
    console.log('\nDone! Database: ./data/personas.db');
    console.log('Images: ./data/images/');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
