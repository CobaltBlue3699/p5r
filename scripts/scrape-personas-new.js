import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDbConnection, saveDb, initSchema } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const PERSONA_LIST_URL = 'https://wiki.biligame.com/persona/P5R/%E4%BA%BA%E6%A0%BC%E9%9D%A2%E5%85%B7%E5%9B%BE%E9%89%B4';

const ARCANA_ORDER = [
  '愚者', '魔术师', '女教皇', '女皇', '皇帝', '教皇', '恋人', '战车',
  '正义', '隐士', '命运', '力量', '倒悬者', '死神', '节制', '恶魔',
  '塔', '星星', '月亮', '太阳', '审判', '信念', '顾问官', '世界'
];

const RESIST_MAP = {
  '-': null,
  '無': 'null',
  '弱': 'weak',
  '耐': 'resist',
  '反': 'repel',
  '吸': 'absorb',
  '封': 'block'
};

async function main() {
  console.log('Fetching persona list from BWIKI...');
  
  const response = await axios.get(PERSONA_LIST_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 60000
  });
  
  const $ = cheerio.load(response.data);
  const personas = [];
  
  // Parse table
  $('.wikitable tbody tr').each((index, row) => {
    if (index === 0) return;
    
    const cells = $(row).find('td');
    if (cells.length < 12) return;
    
    // Extract avatar image URL from the first cell (cell[0] contains the image)
    let imageUrl = null;
    $(cells[0]).find('img').each((i, img) => {
      const alt = $(img).attr('alt') || '';
      if (alt.includes('头像')) {
        const src = $(img).attr('src') || '';
        if (src) {
          imageUrl = src;
        }
      }
    });
    
    // Name is in the second cell (cells[1])
    const nameLink = $(cells[1]).find('a');
    const nameCn = nameLink.text().trim();
    const wikiUrl = 'https://wiki.biligame.com' + (nameLink.attr('href') || '');
    
    const level = parseInt($(cells[2]).text().trim()) || 0;
    const nameEn = $(cells[3]).text().trim() || null;
    const nameJp = $(cells[4]).text().trim() || null;
    const arcana = $(cells[5]).text().trim();
    
    const physResist = RESIST_MAP[$(cells[6]).text().trim()] || null;
    const gunResist = RESIST_MAP[$(cells[7]).text().trim()] || null;
    const fireResist = RESIST_MAP[$(cells[8]).text().trim()] || null;
    const iceResist = RESIST_MAP[$(cells[9]).text().trim()] || null;
    const elecResist = RESIST_MAP[$(cells[10]).text().trim()] || null;
    const windResist = RESIST_MAP[$(cells[11]).text().trim()] || null;
    const psyResist = $(cells[12]) ? (RESIST_MAP[$(cells[12]).text().trim()] || null) : null;
    const nukeResist = $(cells[13]) ? (RESIST_MAP[$(cells[13]).text().trim()] || null) : null;
    const blessResist = $(cells[14]) ? (RESIST_MAP[$(cells[14]).text().trim()] || null) : null;
    const curseResist = $(cells[15]) ? (RESIST_MAP[$(cells[15]).text().trim()] || null) : null;
    
    if (nameCn && level > 0) {
      personas.push({
        name_cn: nameCn,
        name_en: nameEn,
        name_jp: nameJp,
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
        wiki_url: wikiUrl,
        image_url: imageUrl
      });
    }
  });
  
  console.log(`Found ${personas.length} personas`);
  
  // Initialize database
  const db = await getDbConnection();
  initSchema(db);
  
  // Populate arcanas
  db.run(`DELETE FROM arcanas`);
  const arcanaIds = {};
  
  ARCANA_ORDER.forEach((name, index) => {
    db.run(`INSERT INTO arcanas (name_cn, name_tw, order_index) VALUES (?, ?, ?)`,
      [name, name, index + 1]);
    arcanaIds[name] = index + 1;
  });
  console.log(`Inserted ${ARCANA_ORDER.length} arcanas`);
  
  // Populate personas
  db.run(`DELETE FROM personas`);
  
  for (const p of personas) {
    const arcanaId = arcanaIds[p.arcana] || null;
    db.run(`
      INSERT INTO personas (arcana_id, name_cn, name_en, name_jp, level,
        phys_resist, gun_resist, fire_resist, ice_resist, elec_resist,
        wind_resist, psy_resist, nuke_resist, bless_resist, curse_resist, wiki_url, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      arcanaId, p.name_cn, p.name_en, p.name_jp, p.level,
      p.phys_resist, p.gun_resist, p.fire_resist, p.ice_resist, p.elec_resist,
      p.wind_resist, p.psy_resist, p.nuke_resist, p.bless_resist, p.curse_resist, p.wiki_url, p.image_url
    ]);
  }
  console.log(`Inserted ${personas.length} personas`);
  
  // Save
  saveDb(db);
  db.close();
  
  console.log('\nDone! Personas and arcanas tables populated.');
}

main().catch(console.error);
