import axios from 'axios';
import * as cheerio from 'cheerio';
import initSqlJs from 'sql.js';
import fs from 'fs';

const DB_PATH = './data/personas.db';

async function scrapeWithRetry(url, retries = 15) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 30000
      });
      
      if (response.status === 200 && response.data.length > 50000) {
        return response.data;
      }
    } catch (error) {
      const status = error.response?.status;
      if (status === 404 || status === 567) {
        const delay = Math.min(10000 * Math.pow(1.3, i), 60000);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
    }
  }
  return null;
}

function scrapeDetail(html) {
  const $ = cheerio.load(html);
  const detail = { name_en: null, name_jp: null, arcana: '', level: 0, strength: 0, magic: 0, endurance: 0, agility: 0, luck: 0, trait: null, item_name: null };
  
  const table = $('table').first();
  const rows = table.find('tr');
  
  // First row contains headers, second row contains values
  const headerRow = rows.eq(1);
  const valueRow = rows.eq(2);
  
  headerRow.find('td').each((j, cell) => {
    const text = $(cell).text().trim();
    const valueCell = valueRow.find('td').eq(j);
    const value = valueCell.text().trim();
    
    if (text === '英文名') detail.name_en = value || null;
    if (text === '日文名') detail.name_jp = value || null;
    if (text === '阿尔卡那') detail.arcana = value;
    if (text === '等级') detail.level = parseInt(value) || 0;
    if (text === '特性') detail.trait = value || null;
    if (text === '电刑') detail.item_name = value || null;
  });

  const stats = { '力': 'strength', '魔': 'magic', '耐': 'endurance', '速': 'agility', '运': 'luck' };
  $('.test .item').each((i, item) => {
    const title = $(item).find('.title').text().trim();
    const num = parseInt($(item).find('.num').text().trim()) || 0;
    if (stats[title]) detail[stats[title]] = num;
  });

  return detail;
}

async function getPersonasNeedingUpdate() {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  // Get personas with strength > 0 but missing name_en/name_jp
  const result = db.exec('SELECT name_cn, wiki_url, strength FROM personas WHERE strength > 0 AND (name_en IS NULL OR name_en = \"\")');
  db.close();
  return result[0]?.values.map(([name, url, str]) => ({ name_cn: name, wiki_url: url, strength: str })) || [];
}

async function updatePersona(persona, detail) {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  db.run(`UPDATE personas SET name_en=?, name_jp=? WHERE name_cn=?`,
    [detail.name_en, detail.name_jp, persona.name_cn]);
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();
}

async function main() {
  const personas = await getPersonasNeedingUpdate();
  console.log(`Found ${personas.length} personas needing name_en/name_jp update\n`);
  
  let updated = 0, failed = 0;
  
  for (let i = 0; i < personas.length; i++) {
    const p = personas[i];
    process.stdout.write(`[${i+1}/${personas.length}] ${p.name_cn}... `);
    
    const html = await scrapeWithRetry(p.wiki_url);
    if (html) {
      const detail = scrapeDetail(html);
      if (detail.name_en) {
        await updatePersona(p, detail);
        console.log(`OK (${detail.name_en})`);
        updated++;
      } else {
        console.log('PARSE FAILED');
        failed++;
      }
    } else {
      console.log('FETCH FAILED');
      failed++;
    }
    
    if ((i + 1) % 10 === 0) {
      console.log(`\nProgress: ${updated} updated, ${failed} failed\n`);
    }
    
    await new Promise(r => setTimeout(r, 5000));
  }
  
  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);
}

main();
