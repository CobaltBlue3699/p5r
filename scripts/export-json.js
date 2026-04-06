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
  
  // Load fusion_recipes from database
  const fusionRecipes = {};
  const recipesResult = db.exec(`
    SELECT 
      p.name_cn,
      fr.price,
      pa.name_cn as ing1_name,
      pa.level as ing1_level,
      a1.name_cn as ing1_arcana,
      pb.name_cn as ing2_name,
      pb.level as ing2_level,
      a2.name_cn as ing2_arcana
    FROM fusion_recipes fr
    JOIN personas p ON fr.result_persona_id = p.id
    JOIN personas pa ON fr.ingredient_a_id = pa.id
    JOIN arcanas a1 ON pa.arcana_id = a1.id
    JOIN personas pb ON fr.ingredient_b_id = pb.id
    JOIN arcanas a2 ON pb.arcana_id = a2.id
    ORDER BY p.name_cn, fr.price
  `);
  
  if (recipesResult[0]) {
    recipesResult[0].values.forEach(row => {
      const [name, price, i1name, i1level, i1arcana, i2name, i2level, i2arcana] = row;
      if (!fusionRecipes[name]) {
        fusionRecipes[name] = [];
      }
      fusionRecipes[name].push({
        price,
        ingredient1: { name: i1name, level: i1level, arcana: i1arcana },
        ingredient2: { name: i2name, level: i2level, arcana: i2arcana }
      });
    });
  }
  console.log(`Loaded fusion recipes for ${Object.keys(fusionRecipes).length} personas`);
  
  // Query personas with arcana info via JOIN
  const personasResult = db.exec(`
    SELECT 
      p.id,
      p.name_cn,
      p.name_en,
      p.name_jp,
      p.level,
      a.name_cn as arcana,
      a.name_tw as arcana_tw,
      p.phys_resist,
      p.gun_resist,
      p.fire_resist,
      p.ice_resist,
      p.elec_resist,
      p.wind_resist,
      p.psy_resist,
      p.nuke_resist,
      p.bless_resist,
      p.curse_resist,
      p.strength,
      p.magic,
      p.endurance,
      p.agility,
      p.luck,
      p.hp,
      p.sp,
      p.trait,
      p.trait_desc,
      p.item_name,
      p.inherit_phys,
      p.inherit_gun,
      p.inherit_fire,
      p.inherit_ice,
      p.inherit_elec,
      p.inherit_wind,
      p.inherit_psy,
      p.inherit_nuke,
      p.inherit_bless,
      p.inherit_curse,
      p.inherit_abnormal,
      p.inherit_recovery,
      p.image_url,
      p.local_image_path,
      p.wiki_url
    FROM personas p
    LEFT JOIN arcanas a ON p.arcana_id = a.id
    ORDER BY p.level, p.name_cn
  `);
  
  if (personasResult.length === 0 || personasResult[0].values.length === 0) {
    console.log('No personas found');
    process.exit(1);
  }
  
  const columns = personasResult[0].columns;
  let personas = personasResult[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
  
  // Query skills with full skill info via JOINs
  const skillsResult = db.exec(`
    SELECT 
      ps.persona_id,
      s.id as skill_id,
      s.name_cn,
      s.name_tw,
      s.cost,
      s.description_cn,
      s.description_tw,
      e.name_cn as element,
      ps.unlock_level
    FROM persona_skills ps
    JOIN skills s ON ps.skill_id = s.id
    LEFT JOIN elements e ON s.element_id = e.id
    ORDER BY ps.persona_id, ps.unlock_level, s.name_cn
  `);
  
  const skillsMap = {};
  if (skillsResult.length > 0) {
    skillsResult[0].values.forEach(row => {
      const [personaId, skillId, nameCn, nameTw, cost, descCn, descTw, element, unlockLevel] = row;
      if (!skillsMap[personaId]) {
        skillsMap[personaId] = [];
      }
      skillsMap[personaId].push({
        id: skillId,
        name: nameCn,
        name_tw: nameTw,
        element: element,
        cost: cost,
        description: descCn,
        description_tw: descTw,
        unlock_level: unlockLevel
      });
    });
  }
  
  // Build final personas array with skills and reverseRecipes
  personas = personas.map(p => {
    const skills = skillsMap[p.id] || [];
    
    // Add traditional Chinese versions
    p.name_tw = p.name_tw || toTW(p.name_cn);
    p.arcana_tw = p.arcana_tw || toTW(p.arcana);
    p.trait_tw = toTW(p.trait);
    p.trait_desc_tw = toTW(p.trait_desc);
    p.item_name_tw = toTW(p.item_name);
    
    // Add skills array
    p.skills = skills;
    
    // Add reverse recipes from fusion_recipes table
    const recipes = fusionRecipes[p.name_cn];
    if (recipes && recipes.length > 0) {
      p.reverseRecipes = recipes;
    }
    
    return p;
  });
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(personas, null, 2));
  console.log(`Exported ${personas.length} personas to ${OUTPUT_PATH}`);
  console.log(`Total skills associations: ${Object.keys(skillsMap).reduce((sum, k) => sum + skillsMap[k].length, 0)}`);
  
  db.close();
}

exportToJson();
