import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import initSqlJs from 'sql.js';

const DATA_DIR = './data';
const DB_PATH = `${DATA_DIR}/personas.db`;
const RETRY_DELAY = 3000;

async function getExistingPersonas() {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);
  
  const result = db.exec('SELECT name_cn, wiki_url FROM personas');
  db.close();
  
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    name_cn: row[0],
    wiki_url: row[1]
  }));
}

async function scrapeWithRetry(url, retries = 15) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 120000 // Increased timeout to 2 minutes
      });
      
      if (response.status === 200 && response.data && response.data.length > 10000) {
        return response.data;
      }
      console.log(`  Status ${response.status}, content length: ${response.data?.length || 0}`);
    } catch (error) {
      const isRateLimit = error.response?.status === 567 || error.code === 'ECONNRESET';
      console.log(`  Attempt ${i + 1}/${retries}: ${error.message}${isRateLimit ? ' (rate limit)' : ''}`);
    }
    
    if (i < retries - 1) {
      // Much more aggressive backoff - start at 10s, max at 2min
      const delay = Math.min(10000 * Math.pow(1.5, i), 120000);
      console.log(`  Waiting ${delay}ms before retry...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  return null;
}

async function scrapePersonaDetail(url) {
  const html = await scrapeWithRetry(url);
  if (!html) return null;
  
  try {
    const $ = cheerio.load(html);
    const detail = {
      name_en: null,
      name_jp: null,
      arcana: '',
      level: 0,
      strength: 0,
      magic: 0,
      endurance: 0,
      agility: 0,
      luck: 0,
      trait: null,
      trait_desc: null,
      item_name: null,
      // 技能继承
      inherit_phys: 0,
      inherit_gun: 0,
      inherit_fire: 0,
      inherit_ice: 0,
      inherit_elec: 0,
      inherit_wind: 0,
      inherit_psy: 0,
      inherit_nuke: 0,
      inherit_bless: 0,
      inherit_curse: 0,
      inherit_abnormal: 0,
      inherit_recovery: 0,
      // 技能列表
      skills: [],
    };
    
    const table = $('table').first();
    const rows = table.find('tr');
    
    rows.each((i, row) => {
      const cells = $(row).find('td');
      cells.each((j, cell) => {
        const text = $(cell).text().trim();
        
        if (text === '英文名') {
          const nextCell = $(cells[j + 1]);
          detail.name_en = nextCell.text().trim() || null;
        }
        if (text === '日文名') {
          const nextCell = $(cells[j + 1]);
          detail.name_jp = nextCell.text().trim() || null;
        }
        if (text === '阿尔卡那') {
          const nextCell = $(cells[j + 1]);
          detail.arcana = nextCell.text().trim();
        }
        if (text === '等级') {
          const nextCell = $(cells[j + 1]);
          detail.level = parseInt(nextCell.text().trim()) || 0;
        }
        if (text === '特性') {
          const nextCell = $(cells[j + 1]);
          detail.trait = nextCell.text().trim() || null;
          const descCell = $(cells[j + 2]);
          detail.trait_desc = descCell.text().trim() || null;
        }
        if (text === '电刑') {
          const nextCell = $(cells[j + 1]);
          detail.item_name = nextCell.text().trim() || null;
        }
      });
    });
    
    const statMap = {
      '力': 'strength',
      '魔': 'magic',
      '耐': 'endurance',
      '速': 'agility',
      '运': 'luck'
    };
    
    $('.test .item').each((i, item) => {
      const title = $(item).find('.title').text().trim();
      const num = $(item).find('.num').text().trim();
      
      if (statMap[title]) {
        detail[statMap[title]] = parseInt(num) || 0;
      }
    });
    
    // 解析技能继承表格 (在 "技能继承" 标题后的表格)
    const inheritLabels = ['phys', 'gun', 'fire', 'ice', 'elec', 'wind', 'psy', 'nuke', 'bless', 'curse', 'abnormal', 'recovery'];
    let foundInherit = false;
    
    $('table').each((tIdx, tbl) => {
      const tableText = $(tbl).text();
      if (tableText.includes('技能继承') && !foundInherit) {
        const inheritRow = $(tbl).find('tr').eq(2); // 第3行是数据行
        if (inheritRow.length) {
          const inheritCells = inheritRow.find('td');
          inheritCells.each((cIdx, cell) => {
            if (cIdx > 0 && cIdx - 1 < inheritLabels.length) {
              const label = inheritLabels[cIdx - 1];
              const cellText = $(cell).text().trim();
              detail[`inherit_${label}`] = cellText === '√' ? 1 : 0;
            }
          });
          foundInherit = true;
        }
      }
    });
    
    // 解析技能表格 (找到包含 "消耗" 和 "解锁等级" 的表格，跳过表头行)
    let foundSkills = false;
    
    $('table').each((tIdx, tbl) => {
      if (foundSkills) return;
      
      const rows = $(tbl).find('tr');
      if (rows.length < 2) return;
      
      const headers = rows.eq(0).find('th, td');
      let hasSkillCol = false;
      let hasCostCol = false;
      let hasUnlockCol = false;
      let hasDescCol = false;
      
      headers.each((hIdx, h) => {
        const text = $(h).text().trim();
        if (text === '技能') hasSkillCol = true;
        if (text === '消耗') hasCostCol = true;
        if (text === '解锁等级') hasUnlockCol = true;
        if (text === '描述') hasDescCol = true;
      });
      
      // 找到技能表
      if (hasSkillCol && hasCostCol && hasUnlockCol && hasDescCol) {
        // 检查第一行数据是否是继承表的脏数据
        const firstDataRow = rows.eq(1).find('td');
        if (firstDataRow.length > 0) {
          const firstCellText = firstDataRow.eq(0).text().trim();
          if (firstCellText === '×' || firstCellText.includes('[[P5R')) {
            return; // 跳过这个表，继续找下一个
          }
        }
        
        const skillRows = rows.slice(1);
        
        skillRows.each((sIdx, row) => {
          const rowCells = $(row).find('td');
          if (rowCells.length >= 4) {
            let skillName = $(rowCells[0]).text().trim();
            let skillCost = $(rowCells[1]).text().trim();
            const unlockLevel = $(rowCells[2]).text().trim();
            let description = $(rowCells[3]).text().trim();
            
            // 過濾無效的技能行
            if (!skillName || 
                skillName === '技能' || 
                skillName.includes('[[P5R/技能_') || 
                skillName.includes('{') ||
                skillCost === '消耗' ||
                skillCost === '×') {
              return;
            }
            
            // 清理描述中的殘留字符
            description = description.replace(/[{}}]/g, '');
            
            detail.skills.push({
              name: skillName,
              cost: skillCost,
              unlock_level: unlockLevel === '自带' ? null : (parseInt(unlockLevel) || null),
              description: description
            });
          }
        });
        foundSkills = true;
      }
    });
    
    return detail;
  } catch (error) {
    console.error(`Parse error: ${error.message}`);
    return null;
  }
}

async function updateDatabase(personas) {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);
  
  // 添加新欄位
  const newColumns = [
    'strength INTEGER DEFAULT 0',
    'magic INTEGER DEFAULT 0',
    'endurance INTEGER DEFAULT 0',
    'agility INTEGER DEFAULT 0',
    'luck INTEGER DEFAULT 0',
    'trait TEXT',
    'item_name TEXT',
    'inherit_phys INTEGER DEFAULT 0',
    'inherit_gun INTEGER DEFAULT 0',
    'inherit_fire INTEGER DEFAULT 0',
    'inherit_ice INTEGER DEFAULT 0',
    'inherit_elec INTEGER DEFAULT 0',
    'inherit_wind INTEGER DEFAULT 0',
    'inherit_psy INTEGER DEFAULT 0',
    'inherit_nuke INTEGER DEFAULT 0',
    'inherit_bless INTEGER DEFAULT 0',
    'inherit_curse INTEGER DEFAULT 0',
    'inherit_abnormal INTEGER DEFAULT 0',
    'inherit_recovery INTEGER DEFAULT 0',
    'skills TEXT'
  ];
  
  for (const col of newColumns) {
    try {
      db.run(`ALTER TABLE personas ADD COLUMN ${col}`);
    } catch (e) {
      // column may already exist
    }
  }
  
  // 創建技能表
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS persona_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        persona_id INTEGER,
        skill_name TEXT,
        cost TEXT,
        unlock_level INTEGER,
        description TEXT,
        FOREIGN KEY (persona_id) REFERENCES personas(id)
      )
    `);
  } catch (e) {
    // table may already exist
  }
  
  let updated = 0;
  let skipped = 0;
  let total = personas.length;
  let progress = 0;
  
  for (const persona of personas) {
    if (!persona.wiki_url) {
      skipped++;
      continue;
    }
    
    progress++;
    process.stdout.write(`[${progress}/${total}] Scraping ${persona.name_cn}...`);
    const detail = await scrapePersonaDetail(persona.wiki_url);
    
    if (detail && detail.name_en) {
      // 更新 persona 記錄
      db.run(`
        UPDATE personas SET
          name_en = ?,
          name_jp = ?,
          strength = ?,
          magic = ?,
          endurance = ?,
          agility = ?,
          luck = ?,
          trait = ?,
          item_name = ?,
          inherit_phys = ?,
          inherit_gun = ?,
          inherit_fire = ?,
          inherit_ice = ?,
          inherit_elec = ?,
          inherit_wind = ?,
          inherit_psy = ?,
          inherit_nuke = ?,
          inherit_bless = ?,
          inherit_curse = ?,
          inherit_abnormal = ?,
          inherit_recovery = ?
        WHERE name_cn = ?
      `, [
        detail.name_en,
        detail.name_jp,
        detail.strength,
        detail.magic,
        detail.endurance,
        detail.agility,
        detail.luck,
        detail.trait,
        detail.item_name,
        detail.inherit_phys,
        detail.inherit_gun,
        detail.inherit_fire,
        detail.inherit_ice,
        detail.inherit_elec,
        detail.inherit_wind,
        detail.inherit_psy,
        detail.inherit_nuke,
        detail.inherit_bless,
        detail.inherit_curse,
        detail.inherit_abnormal,
        detail.inherit_recovery,
        persona.name_cn
      ]);
      
      // 獲取 persona id
      const personaIdResult = db.exec(`SELECT id FROM personas WHERE name_cn = '${persona.name_cn}'`);
      const personaId = personaIdResult[0]?.values[0]?.[0];
      
      // 插入技能數據
      if (personaId && detail.skills.length > 0) {
        // 清除舊技能
        db.run(`DELETE FROM persona_skills WHERE persona_id = ?`, [personaId]);
        
        // 插入新技能
        for (const skill of detail.skills) {
          db.run(`
            INSERT INTO persona_skills (persona_id, skill_name, cost, unlock_level, description)
            VALUES (?, ?, ?, ?, ?)
          `, [personaId, skill.name, skill.cost, skill.unlock_level, skill.description]);
        }
      }
      
      updated++;
      console.log(` OK (STR:${detail.strength} MAG:${detail.magic} SKILLS:${detail.skills.length})`);
      
      if (updated % 20 === 0) {
        const data = db.export();
        fs.writeFileSync(DB_PATH, Buffer.from(data));
        console.log(`\nSaved progress (${updated} updated)...\n`);
      }
      
      await new Promise(r => setTimeout(r, 3000));
    } else {
      skipped++;
      console.log(` SKIP (rate limited or parse failed)`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  console.log(`\n\nUpdated ${updated} personas, ${skipped} skipped`);
  db.close();
}

async function main() {
  console.log('Fetching persona list...');
  const personas = await getExistingPersonas();
  console.log(`Found ${personas.length} personas\n`);
  
  if (personas.length === 0) {
    console.error('No personas found. Run scrape first!');
    process.exit(1);
  }
  
  await updateDatabase(personas);
}

main();
