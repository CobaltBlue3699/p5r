import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'lib/reverse-fusion.json');

function loadProgress() {
  return fs.existsSync(OUTPUT_FILE) ? JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8')) : {};
}

function saveProgress(data) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
}

async function scrapeReverseFusion(personaName) {
  const url = `https://wiki.biligame.com/persona/P5R/${encodeURIComponent(personaName)}`;
  try {
    const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
    const $ = cheerio.load(response.data);
    const recipes = [];
    
    let targetTable = null;
    $('table').each((i, el) => {
      const text = $(el).text();
      // 模糊匹配包含 素材1 和 素材2 的表格，且通常会有 "反向合成" 字样
      if (text.includes('素材1') && text.includes('素材2') && (text.includes('反向合成') || text.includes('素材1+素材2'))) {
        targetTable = $(el);
      }
    });

    if (!targetTable) return [];

    targetTable.find('tr').each((idx, row) => {
      const cells = $(row).find('td');
      // 跳过表头行：如果包含 "素材" 或 "价格" 字样
      const rowText = $(row).text();
      if (rowText.includes('素材') || rowText.includes('价格') || rowText.includes('种族')) return;
      
      if (cells.length >= 7) {
        const price = $(cells[0]).text().trim().replace(/,/g, '');
        const arcana1 = $(cells[1]).text().trim();
        const level1 = $(cells[2]).text().trim();
        const name1 = $(cells[3]).text().trim();
        const arcana2 = $(cells[4]).text().trim();
        const level2 = $(cells[5]).text().trim();
        const name2 = $(cells[6]).text().trim();
        
        if (name1 && name2 && name1 !== '素材1' && name2 !== '素材2') {
          recipes.push({
            price: parseInt(price) || 0,
            ingredient1: { name: name1, level: parseInt(level1) || 0, arcana: arcana1 },
            ingredient2: { name: name2, level: parseInt(level2) || 0, arcana: arcana2 }
          });
        }
      }
    });
    return recipes;
  } catch (error) {
    console.error(`Error ${personaName}:`, error.message);
    return null;
  }
}

async function main() {
  const personas = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'lib/personas.json'), 'utf-8'));
  let data = loadProgress();
  // 为了确保修复效果，我们强制重新抓取几个关键面具，或者如果传入参数则只抓取特定面具
  const forceScrape = ['辉夜', '亚森', '伊邪那岐', '俄耳普斯'];
  
  for (const p of personas) {
    if (data[p.name_cn] && data[p.name_cn].length > 0 && !forceScrape.includes(p.name_cn)) continue;
    
    console.log(`Scraping ${p.name_cn}...`);
    const recipes = await scrapeReverseFusion(p.name_cn);
    if (recipes !== null) {
      data[p.name_cn] = recipes;
      console.log(`  ✓ ${recipes.length} recipes`);
      saveProgress(data);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

main();
