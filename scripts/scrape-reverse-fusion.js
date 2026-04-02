import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const OUTPUT_FILE = path.join(ROOT_DIR, 'lib/reverse-fusion.json');

function loadProgress() {
  if (fs.existsSync(OUTPUT_FILE)) {
    return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  }
  return {};
}

function saveProgress(data) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
}

async function scrapeReverseFusion(personaName) {
  const url = `https://wiki.biligame.com/persona/P5R/${encodeURIComponent(personaName)}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const recipes = [];
    
    const tables = $('table');
    let targetTable = null;
    
    tables.each((i, el) => {
      if ($(el).text().includes('素材1+素材2')) {
        targetTable = $(el);
      }
    });
    
    if (!targetTable) {
      return recipes;
    }
    
    targetTable.find('tbody tr').each((idx, row) => {
      if (idx === 0) return;
      
      const cells = $(row).find('td');
      if (cells.length < 7) return;
      
      const price = $(cells[0]).text().trim().replace(/,/g, '');
      const arcana1 = $(cells[1]).text().trim();
      const level1 = $(cells[2]).text().trim();
      const name1 = $(cells[3]).text().trim();
      const arcana2 = $(cells[4]).text().trim();
      const level2 = $(cells[5]).text().trim();
      const name2 = $(cells[6]).text().trim();
      
      if (name1 && name2) {
        recipes.push({
          price: parseInt(price) || 0,
          ingredient1: { name: name1, level: parseInt(level1) || 0, arcana: arcana1 },
          ingredient2: { name: name2, level: parseInt(level2) || 0, arcana: arcana2 }
        });
      }
    });
    
    return recipes;
  } catch (error) {
    console.error(`Error scraping ${personaName}:`, error.message);
    return null;
  }
}

async function main() {
  const personasPath = path.join(ROOT_DIR, 'lib/personas.json');
  const personas = JSON.parse(fs.readFileSync(personasPath, 'utf-8'));
  
  console.log(`Loaded ${personas.length} personas`);
  
  let reverseFusionData = loadProgress();
  const processed = new Set(Object.keys(reverseFusionData));
  
  let hasRecipes = processed.size;
  let idx = 0;
  
  for (const persona of personas) {
    if (processed.has(persona.name_cn)) {
      idx++;
      continue;
    }
    
    const recipes = await scrapeReverseFusion(persona.name_cn);
    
    if (recipes === null) {
      console.log(`⏳ ${persona.name_cn}: retry later`);
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    
    if (recipes.length > 0) {
      reverseFusionData[persona.name_cn] = recipes;
      console.log(`✓ ${persona.name_cn}: ${recipes.length} recipes`);
      hasRecipes++;
    } else {
      reverseFusionData[persona.name_cn] = [];
      console.log(`○ ${persona.name_cn}: no recipes`);
    }
    
    saveProgress(reverseFusionData);
    processed.add(persona.name_cn);
    idx++;
    
    if (idx % 10 === 0) {
      console.log(`Progress: ${idx}/${personas.length} (${hasRecipes} with recipes)`);
    }
    
    await new Promise(r => setTimeout(r, 400));
  }
  
  console.log(`\nCompleted! Total personas with recipes: ${hasRecipes}`);
}

main().catch(console.error);
