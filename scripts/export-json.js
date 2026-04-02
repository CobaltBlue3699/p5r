import initSqlJs from 'sql.js';
import { Converter } from 'opencc-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DB_PATH = path.join(ROOT_DIR, 'data/personas.db');
const OUTPUT_PATH = path.join(ROOT_DIR, 'lib/personas.json');

const opencc = Converter({ from: 'cn', to: 'tw' });

function toTW(text) {
  if (!text || typeof text !== 'string') return text;
  return opencc(text);
}

async function exportToJson() {
  const SQL = await initSqlJs();
  
  if (!fs.existsSync(DB_PATH)) {
    console.error('Database not found at:', DB_PATH);
    process.exit(1);
  }
  
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);
  
  const result = db.exec('SELECT * FROM personas ORDER BY level, name_cn');
  
  if (result.length === 0) {
    console.log('No personas found');
    process.exit(1);
  }
  
  const columns = result[0].columns;
  const personas = result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
  
  // 獲取技能數據
  const skillsResult = db.exec('SELECT * FROM persona_skills');
  const skillsMap = {};
  
  if (skillsResult.length > 0) {
    const skillColumns = skillsResult[0].columns;
    skillsResult[0].values.forEach(row => {
      const skillObj = {};
      skillColumns.forEach((col, i) => {
        skillObj[col] = row[i];
      });
      const personaId = skillObj.persona_id;
      if (!skillsMap[personaId]) {
        skillsMap[personaId] = [];
      }
      skillsMap[personaId].push({
        name: skillObj.skill_name,
        cost: skillObj.cost,
        unlock_level: skillObj.unlock_level,
        description: skillObj.description
      });
    });
  }
  
  // 將技能添加到 persona 對象 (過濾無效的技能)
  personas.forEach(p => {
    const skills = skillsMap[p.id] || [];
    // 過濾掉無效的技能名稱
    p.skills = skills.filter(s => 
      s.name && 
      s.name !== '技能' && 
      !s.name.includes('[[P5R') && 
      !s.name.includes('{') &&
      s.cost !== '×' &&
      s.cost !== '消耗' &&
      !['英文名', 'Diego', '五維', '3', '2', 'Mandrake', '拜斯堤', '等级'].includes(s.name) &&
      !/^\d+$/.test(s.name) &&  // 不是純數字
      s.name.length < 20 &&  // 過濾太長的異常資料
      !s.name.includes('五维') &&
      !s.name.includes('等級')
    );
    
    // 添加繁體中文版本
    p.name_tw = toTW(p.name_cn);
    p.trait_tw = toTW(p.trait);
    p.trait_desc_tw = toTW(p.trait_desc);
    p.item_name_tw = toTW(p.item_name);
    p.arcana_tw = toTW(p.arcana);
    
    // 技能也需要繁體中文版
    p.skills = p.skills.map(s => ({
      ...s,
      name_tw: toTW(s.name),
      description_tw: toTW(s.description)
    }));
  });
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(personas, null, 2));
  console.log(`Exported ${personas.length} personas with skills to ${OUTPUT_PATH}`);
  
  db.close();
}

exportToJson();
