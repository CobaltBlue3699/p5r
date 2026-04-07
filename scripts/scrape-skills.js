import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDbConnection, saveDb, initSchema } from './db.js';
import { Converter } from 'opencc-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const WIKI_URL = 'https://wiki.biligame.com/persona/P5R%E6%8A%80%E8%83%BD%E5%88%97%E8%A1%A8';

const ELEMENTS = [
  { name_cn: '物理' }, { name_cn: '枪击' }, { name_cn: '火焰' }, { name_cn: '冰冻' }, { name_cn: '电击' },
  { name_cn: '疾风' }, { name_cn: '念动' }, { name_cn: '核热' }, { name_cn: '祝福' }, { name_cn: '咒怨' },
  { name_cn: '异常' }, { name_cn: '恢复' }, { name_cn: '辅助' }, { name_cn: '万能' }, { name_cn: '被动' }
];

const opencc = Converter({ from: 'cn', to: 'tw' });
function toTW(text) {
  if (!text || typeof text !== 'string') return text;
  return opencc(text);
}

function parseAcquisition(acqText) {
  // Format 1: "佐罗、(13)、背负怪、(9)" - can learn at specific level
  // Format 2: "真神、朱雀、琼安" - naturally learns (level = 0)
  const results = [];
  
  if (!acqText || acqText === '—' || acqText === '-') {
    return results;
  }
  
  // Check if it's a level format: 名字、(數字)
  const levelRegex = /([^、(]+)、?\((\d+)\)?/g;
  let match;
  let hasLevelFormat = false;
  
  while ((match = levelRegex.exec(acqText)) !== null) {
    const personaName = match[1].trim();
    const level = parseInt(match[2]);
    
    if (personaName && level) {
      results.push({ personaName, level });
      hasLevelFormat = true;
    }
  }
  
  // If no level format found, treat as natural learning (names separated by 、)
  if (!hasLevelFormat) {
    const names = acqText.split(/[、,，,、]/).filter(n => n.trim());
    for (const name of names) {
      const personaName = name.trim();
      if (personaName) {
        results.push({ personaName, level: 0 }); // 0 = naturally learned
      }
    }
  }
  
  return results;
}

async function main() {
  console.log('Fetching skills from BWIKI...');
  
  const response = await axios.get(WIKI_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 60000
  });
  
  const $ = cheerio.load(response.data);
  const skills = [];
  const personaSkills = [];
  
  // Skills table is in #CardSelectTr
  $('#CardSelectTr tbody tr').each((index, row) => {
    if (index === 0) return; // Skip header
    
    const cells = $(row).find('td');
    if (cells.length < 5) return;
    
    const nameLink = $(cells[0]).find('a');
    const nameCn = nameLink.text().trim();
    const wikiUrl = 'https://wiki.biligame.com' + (nameLink.attr('href') || '');
    
    const elementCn = $(cells[1]).text().trim();
    const cost = $(cells[2]).text().trim();
    const description = $(cells[3]).text().trim();
    const acquisition = $(cells[4]).text().trim();
    
    if (nameCn && elementCn) {
      skills.push({
        name_cn: nameCn,
        name_tw: toTW(nameCn),
        element_cn: elementCn,
        cost: cost || null,
        description_cn: description || null,
        description_tw: toTW(description),
        wiki_url: wikiUrl
      });
      
      // Parse acquisition to extract persona-skill relationships
      const acquisitions = parseAcquisition(acquisition);
      for (const acq of acquisitions) {
        personaSkills.push({
          persona_name: acq.personaName,
          skill_name: nameCn,
          unlock_level: acq.level
        });
      }
    }
  });
  
  console.log(`Found ${skills.length} skills`);
  console.log(`Found ${personaSkills.length} persona-skill relationships`);
  
  // Name mapping: wiki names -> database names
  const NAME_MAP = {
    '纳西瑟斯': '那耳喀索斯',
    '贝利亚': '贝利亚/彼列',
    '吉祥天': '吉祥天女',
    '蒂坦妮娅': '缇坦妮娅',
    '俄耳普斯·贼神': '俄耳甫斯·贼神',
    '俄耳普斯·贼神F': '俄耳甫斯·贼神F',
    '马利亚': '玛利亚',
    '撒坦耶尔': '撒旦耶尔',
    '阿巴顿': '亚巴顿',
  };
  
  // Apply name mapping
  for (const ps of personaSkills) {
    if (NAME_MAP[ps.persona_name]) {
      ps.persona_name = NAME_MAP[ps.persona_name];
    }
  }
  
  // Initialize database
  const db = await getDbConnection();
  initSchema(db); // Ensure schema is up to date
  
  // Populate elements
  db.run(`DELETE FROM elements`);
  const elementIds = {};
  
  for (const elem of ELEMENTS) {
    db.run(`INSERT INTO elements (name_cn) VALUES (?)`, [elem.name_cn]);
    const result = db.exec(`SELECT last_insert_rowid()`);
    elementIds[elem.name_cn] = result[0].values[0][0];
  }
  console.log(`Inserted ${ELEMENTS.length} elements`);
  
  // Populate skills
  db.run(`DELETE FROM skills`);
  
  for (const skill of skills) {
    const elementId = elementIds[skill.element_cn] || null;
    db.run(`
      INSERT INTO skills (element_id, name_cn, name_tw, cost, description_cn, description_tw, wiki_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [elementId, skill.name_cn, skill.name_tw, skill.cost, skill.description_cn, skill.description_tw, skill.wiki_url]);
  }
  console.log(`Inserted ${skills.length} skills`);
  
  // Build skill name to ID map
  const skillNameMap = new Map();
  const skillResult = db.exec(`SELECT id, name_cn, name_tw FROM skills`);
  if (skillResult[0]) {
    skillResult[0].values.forEach(row => {
      const [id, nameCn, nameTw] = row;
      skillNameMap.set(nameCn, id);
      if (nameTw) skillNameMap.set(nameTw, id);
    });
  }
  console.log(`Built skill map with ${skillNameMap.size} entries`);
  
  // Build persona name to ID map
  const personaNameMap = new Map();
  const personaResult = db.exec(`SELECT id, name_cn FROM personas`);
  if (personaResult[0]) {
    personaResult[0].values.forEach(row => {
      const [id, nameCn] = row;
      personaNameMap.set(nameCn, id);
    });
  }
  console.log(`Persona map: ${personaNameMap.size} entries`);
  
  // Populate persona_skills
  db.run(`DELETE FROM persona_skills`);
  
  let savedCount = 0;
  const notFoundSkills = [];
  const notFoundPersonas = [];
  
  // Sort by persona level (lower level first)
  personaSkills.sort((a, b) => {
    const pA = personaNameMap.get(a.persona_name);
    const pB = personaNameMap.get(b.persona_name);
    return (pA?.level || 999) - (pB?.level || 999);
  });
  
  for (const ps of personaSkills) {
    const skillId = skillNameMap.get(ps.skill_name);
    
    if (!skillId) {
      if (!notFoundSkills.includes(ps.skill_name)) notFoundSkills.push(ps.skill_name);
      continue;
    }
    
    const personaId = personaNameMap.get(ps.persona_name);
    
    if (!personaId) {
      if (!notFoundPersonas.includes(ps.persona_name)) notFoundPersonas.push(ps.persona_name);
      continue;
    }
    
    db.run(`INSERT OR IGNORE INTO persona_skills (persona_id, skill_id, unlock_level) VALUES (?, ?, ?)`,
      [personaId, skillId, ps.unlock_level]);
    savedCount++;
  }
  
  console.log(`Inserted ${savedCount} persona-skill relationships`);
  if (notFoundSkills.length > 0) console.log(`Skills not in DB: ${notFoundSkills.length}`, notFoundSkills.slice(0, 3));
  if (notFoundPersonas.length > 0) console.log(`Personas not in DB: ${notFoundPersonas.length}`, notFoundPersonas);
  
  // Save
  saveDb(db);
  
  // Summary
  const counts = {
    arcanas: db.exec(`SELECT COUNT(*) FROM arcanas`)[0]?.values[0][0],
    elements: db.exec(`SELECT COUNT(*) FROM elements`)[0]?.values[0][0],
    skills: db.exec(`SELECT COUNT(*) FROM skills`)[0]?.values[0][0],
    personas: db.exec(`SELECT COUNT(*) FROM personas`)[0]?.values[0][0],
    persona_skills: db.exec(`SELECT COUNT(*) FROM persona_skills`)[0]?.values[0][0]
  };
  
  console.log('\n=== Summary ===');
  console.log(counts);
  
  db.close();
  console.log('\nDone!');
}

main().catch(console.error);

