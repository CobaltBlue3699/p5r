import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import initSqlJs from 'sql.js';

const DATA_DIR = './data';
const DB_PATH = `${DATA_DIR}/personas.db`;

async function scrapeWithRetry(url, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 30000
      });
      if (response.status === 200) return response.data;
    } catch (error) {
      console.log(`  Attempt ${i + 1} failed: ${error.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return null;
}

async function scrapePersonaDetail(url) {
  const html = await scrapeWithRetry(url);
  if (!html) return null;
  const $ = cheerio.load(html);
  const detail = {
    inherit_phys: 0, inherit_gun: 0, inherit_fire: 0, inherit_ice: 0,
    inherit_elec: 0, inherit_wind: 0, inherit_psy: 0, inherit_nuke: 0,
    inherit_bless: 0, inherit_curse: 0, inherit_abnormal: 0, inherit_recovery: 0,
    skills: []
  };
  
  const inheritLabels = ['phys', 'gun', 'fire', 'ice', 'elec', 'wind', 'psy', 'nuke', 'bless', 'curse', 'abnormal', 'recovery'];
  let foundInherit = false;

  $('table').each((tIdx, tbl) => {
    const tableText = $(tbl).text();
    if (tableText.includes('技能继承') && !foundInherit) {
      const inheritRow = $(tbl).find('tr').eq(2);
      if (inheritRow.length) {
        const inheritCells = inheritRow.find('td');
        const offset = inheritCells.length > inheritLabels.length ? 1 : 0;
        inheritCells.each((cIdx, cell) => {
          if (cIdx >= offset && cIdx - offset < inheritLabels.length) {
            const label = inheritLabels[cIdx - offset];
            const cellText = $(cell).text().trim();
            detail[`inherit_${label}`] = cellText === '√' ? 1 : 0;
          }
        });
        foundInherit = true;
      }
    }
  });

  let foundSkills = false;
  $('table').each((tIdx, tbl) => {
    if (foundSkills) return;
    const rows = $(tbl).find('tr');
    if (rows.length < 2) return;
    
    let headerRowIdx = -1;
    let hasSkillCol = false;
    let hasCostCol = false;
    let hasUnlockCol = false;
    let hasDescCol = false;

    for (let rIdx = 0; rIdx < Math.min(2, rows.length); rIdx++) {
      const headers = rows.eq(rIdx).find('th, td');
      headers.each((hIdx, h) => {
        const text = $(h).text().trim();
        if (text === '技能') hasSkillCol = true;
        if (text === '消耗') hasCostCol = true;
        if (text === '解锁等级') hasUnlockCol = true;
        if (text === '描述') hasDescCol = true;
      });
      if (hasSkillCol && hasCostCol && hasUnlockCol && hasDescCol) {
        headerRowIdx = rIdx;
        break;
      } else {
        hasSkillCol = hasCostCol = hasUnlockCol = hasDescCol = false;
      }
    }
    
    if (headerRowIdx !== -1) {
      const skillRows = rows.slice(headerRowIdx + 1);
      skillRows.each((sIdx, row) => {
        const rowCells = $(row).find('td');
        if (rowCells.length >= 4) {
          let skillName = $(rowCells[0]).text().trim();
          let skillCost = $(rowCells[1]).text().trim();
          const unlockLevel = $(rowCells[2]).text().trim();
          let description = $(rowCells[3]).text().trim();
          if (!skillName || skillName === '技能' || skillName === '消耗' || skillCost === '×') return;
          detail.skills.push({ name: skillName, cost: skillCost, unlock_level: unlockLevel, description });
        }
      });
      foundSkills = true;
    }
  });

  return detail;
}

async function run() {
  const url = 'https://wiki.biligame.com/persona/P5R/%E8%BE%89%E5%A4%9C';
  console.log(`Scraping Kaguya: ${url}`);
  const detail = await scrapePersonaDetail(url);
  console.log('Result:', JSON.stringify(detail, null, 2));
}

run();
