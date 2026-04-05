import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import initSqlJs from 'sql.js';

const DATA_DIR = './data';
const DB_PATH = `${DATA_DIR}/personas.db`;

async function getExistingPersonas() {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);
  const result = db.exec('SELECT name_cn, wiki_url FROM personas');
  db.close();
  return result.length === 0 ? [] : result[0].values.map(row => ({ name_cn: row[0], wiki_url: row[1] }));
}

async function scrapeWithRetry(url, retries = 15) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 60000
      });
      if (response.status === 200 && response.data.length > 15000) {
        return response.data;
      }
    } catch (error) {}
    await new Promise(r => setTimeout(r, 8000 + Math.random() * 4000));
  }
  return null;
}

async function scrapePersonaDetail(url) {
  const html = await scrapeWithRetry(url);
  if (!html) return null;
  const $ = cheerio.load(html);
  const detail = {
    name_en: null, name_jp: null, strength: 0, magic: 0, endurance: 0, agility: 0, luck: 0,
    trait: null, item_name: null,
    inherit_phys: 0, inherit_gun: 0, inherit_fire: 0, inherit_ice: 0, inherit_elec: 0, inherit_wind: 0,
    inherit_psy: 0, inherit_nuke: 0, inherit_bless: 0, inherit_curse: 0, inherit_abnormal: 0, inherit_recovery: 0,
    skills: []
  };

  $('table').first().find('tr').each((i, row) => {
    const cells = $(row).find('td');
    cells.each((j, cell) => {
      const text = $(cell).text().trim();
      if (text === '英文名') detail.name_en = $(cells[j+1]).text().trim() || null;
      if (text === '日文名') detail.name_jp = $(cells[j+1]).text().trim() || null;
      if (text === '特性') detail.trait = $(cells[j+1]).text().trim() || null;
      if (text === '电刑') detail.item_name = $(cells[j+1]).text().trim() || null;
    });
  });

  const statMap = { '力': 'strength', '魔': 'magic', '耐': 'endurance', '速': 'agility', '运': 'luck' };
  $('.test .item').each((i, item) => {
    const title = $(item).find('.title').text().trim();
    const num = $(item).find('.num').text().trim();
    if (statMap[title]) detail[statMap[title]] = parseInt(num) || 0;
  });

  const inheritLabels = ['phys', 'gun', 'fire', 'ice', 'elec', 'wind', 'psy', 'nuke', 'bless', 'curse', 'abnormal', 'recovery'];
  $('table').each((i, tbl) => {
    if ($(tbl).text().includes('技能继承') && !$(tbl).text().includes('反彈')) {
      $(tbl).find('tr').each((rIdx, row) => {
        const rowText = $(row).text();
        if ((rowText.includes('√') || rowText.includes('×')) && !rowText.includes('技能繼承')) {
          const cells = $(row).find('td');
          const offset = cells.length > 12 ? 1 : 0;
          cells.each((cIdx, cell) => {
            if (cIdx >= offset && cIdx - offset < 12) {
              detail[`inherit_${inheritLabels[cIdx-offset]}`] = $(cell).text().trim() === '√' ? 1 : 0;
            }
          });
        }
      });
    }
  });

  let foundSkills = false;
  $('table').each((tIdx, tbl) => {
    if (foundSkills) return;
    const rows = $(tbl).find('tr');
    let headerRowIdx = -1;
    rows.each((rIdx, row) => {
      const rowText = $(row).text();
      if (rowText.includes('技能') && rowText.includes('消耗') && rowText.includes('解锁等级')) headerRowIdx = rIdx;
    });
    if (headerRowIdx !== -1) {
      rows.slice(headerRowIdx + 1).each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 4) {
          const name = $(cells[0]).text().trim().replace(/\[\[.*?\|(.*?)\]\]/g, '$1').replace(/\[\[(.*?)\]\]/g, '$1');
          const cost = $(cells[1]).text().trim();
          const level = $(cells[2]).text().trim();
          const desc = $(cells[3]).text().trim();
          if (name && name !== '技能' && cost !== '消耗' && cost !== '×' && !name.includes('技能表')) {
            detail.skills.push({ name, cost, unlock_level: level === '自带' ? null : parseInt(level) || null, description: desc.replace(/[{}}]/g, '') });
          }
        }
      });
      if (detail.skills.length > 0) foundSkills = true;
    }
  });
  return detail;
}

async function main() {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));
  const personas = await getExistingPersonas();
  let count = 0;
  
  for (const p of personas) {
    count++;
    process.stdout.write(`[${count}/${personas.length}] Scraping ${p.name_cn}...`);
    const detail = await scrapePersonaDetail(p.wiki_url);
    if (detail && detail.name_en) {
      db.run(`UPDATE personas SET name_en=?, name_jp=?, strength=?, magic=?, endurance=?, agility=?, luck=?, trait=?, item_name=?, 
        inherit_phys=?, inherit_gun=?, inherit_fire=?, inherit_ice=?, inherit_elec=?, inherit_wind=?, inherit_psy=?, inherit_nuke=?, 
        inherit_bless=?, inherit_curse=?, inherit_abnormal=?, inherit_recovery=? WHERE name_cn=?`, 
        [detail.name_en, detail.name_jp, detail.strength, detail.magic, detail.endurance, detail.agility, detail.luck, detail.trait, detail.item_name,
         detail.inherit_phys, detail.inherit_gun, detail.inherit_fire, detail.inherit_ice, detail.inherit_elec, detail.inherit_wind, 
         detail.inherit_psy, detail.inherit_nuke, detail.inherit_bless, detail.inherit_curse, detail.inherit_abnormal, detail.inherit_recovery, p.name_cn]);
      const res = db.exec(`SELECT id FROM personas WHERE name_cn='${p.name_cn}'`);
      if (res[0]) {
        const id = res[0].values[0][0];
        db.run(`DELETE FROM persona_skills WHERE persona_id=?`, [id]);
        for (const s of detail.skills) {
          db.run(`INSERT INTO persona_skills (persona_id, skill_name, cost, unlock_level, description) VALUES (?,?,?,?,?)`,
            [id, s.name, s.cost, s.unlock_level, s.description]);
        }
      }
      console.log(` OK (${detail.skills.length} skills)`);
      if (count % 10 === 0) fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
    } else {
      console.log(` FAILED`);
    }
    await new Promise(r => setTimeout(r, 5000));
  }
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  db.close();
}

main();
