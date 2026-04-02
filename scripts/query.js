import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/personas.db');

const args = process.argv.slice(2);
const command = args[0];

const RESIST_DISPLAY = {
  weak: '弱',
  resist: '耐',
  repel: '反',
  absorb: '吸',
  null: '無',
  block: '封'
};

function formatResist(resist) {
  return RESIST_DISPLAY[resist] || resist || '-';
}

function formatPersona(p) {
  const resists = [
    `物:${formatResist(p.phys_resist)}`,
    `槍:${formatResist(p.gun_resist)}`,
    `火:${formatResist(p.fire_resist)}`,
    `冰:${formatResist(p.ice_resist)}`,
    `電:${formatResist(p.elec_resist)}`,
    `風:${formatResist(p.wind_resist)}`,
    `念:${formatResist(p.psy_resist)}`,
    `核:${formatResist(p.nuke_resist)}`,
    `祝:${formatResist(p.bless_resist)}`,
    `咒:${formatResist(p.curse_resist)}`
  ].join(' | ');
  
  console.log(`[Lv.${p.level}] ${p.name_cn} (${p.arcana})`);
  console.log(`  ${resists}`);
  if (p.wiki_url) console.log(`  Wiki: ${p.wiki_url}`);
  console.log();
}

async function main() {
  const SQL = await initSqlJs();
  
  if (!fs.existsSync(dbPath)) {
    console.log('Database not found. Run "pnpm scrape" first.');
    process.exit(1);
  }
  
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);
  
  switch (command) {
    case 'list': {
      const result = db.exec('SELECT * FROM personas ORDER BY level');
      if (result.length === 0) {
        console.log('No personas found.');
        break;
      }
      const personas = result[0].values.map(row => ({
        id: row[0],
        name_cn: row[1],
        name_en: row[2],
        name_jp: row[3],
        level: row[4],
        arcana: row[5],
        phys_resist: row[6],
        gun_resist: row[7],
        fire_resist: row[8],
        ice_resist: row[9],
        elec_resist: row[10],
        wind_resist: row[11],
        psy_resist: row[12],
        nuke_resist: row[13],
        bless_resist: row[14],
        curse_resist: row[15],
        image_url: row[16],
        local_image_path: row[17],
        wiki_url: row[18]
      }));
      console.log(`Total: ${personas.length} personas\n`);
      personas.forEach(p => {
        console.log(`[Lv.${p.level.toString().padStart(2)}] ${p.name_cn} (${p.arcana})`);
      });
      break;
    }
    
    case 'arcana': {
      const arcana = args[1];
      if (!arcana) {
        const result = db.exec('SELECT arcana, COUNT(*) as count FROM personas GROUP BY arcana ORDER BY arcana');
        if (result.length === 0) {
          console.log('No personas found.');
          break;
        }
        console.log('Available arcanas:');
        result[0].values.forEach(row => {
          console.log(`  ${row[0]}: ${row[1]}`);
        });
        break;
      }
      const stmt = db.prepare('SELECT * FROM personas WHERE arcana = ? ORDER BY level');
      stmt.bind([arcana]);
      const personas = [];
      while (stmt.step()) {
        personas.push(stmt.getAsObject());
      }
      stmt.free();
      if (personas.length === 0) {
        console.log(`No personas found for arcana: ${arcana}`);
        break;
      }
      console.log(`${arcana} (${personas.length}):\n`);
      personas.forEach(formatPersona);
      break;
    }
    
    case 'search': {
      const keyword = args[1];
      if (!keyword) {
        console.log('Usage: node query.js search <keyword>');
        break;
      }
      const stmt = db.prepare(
        'SELECT * FROM personas WHERE name_cn LIKE ? OR name_en LIKE ? OR name_jp LIKE ? ORDER BY level'
      );
      const pattern = `%${keyword}%`;
      stmt.bind([pattern, pattern, pattern]);
      const personas = [];
      while (stmt.step()) {
        personas.push(stmt.getAsObject());
      }
      stmt.free();
      console.log(`Found ${personas.length} results:\n`);
      personas.forEach(p => {
        console.log(`[Lv.${p.level}] ${p.name_cn} (${p.arcana}) - ${p.name_en || 'N/A'}`);
      });
      break;
    }
    
    case 'detail': {
      const name = args.slice(1).join(' ');
      if (!name) {
        console.log('Usage: node query.js detail <name>');
        break;
      }
      const stmt = db.prepare('SELECT * FROM personas WHERE name_cn = ?');
      stmt.bind([name]);
      if (!stmt.step()) {
        console.log('Not found');
        stmt.free();
        break;
      }
      const p = stmt.getAsObject();
      stmt.free();
      
      console.log(`${p.name_cn} (${p.name_en || 'N/A'})\n`);
      console.log(`Level: ${p.level}`);
      console.log(`Arcana: ${p.arcana}`);
      console.log(`Japanese: ${p.name_jp || 'N/A'}`);
      console.log(`Wiki: ${p.wiki_url || 'N/A'}`);
      if (p.local_image_path) {
        console.log(`Image: ${p.local_image_path}`);
      }
      console.log('\nResistances:');
      console.log(`  Physical: ${formatResist(p.phys_resist)}`);
      console.log(`  Gun: ${formatResist(p.gun_resist)}`);
      console.log(`  Fire: ${formatResist(p.fire_resist)}`);
      console.log(`  Ice: ${formatResist(p.ice_resist)}`);
      console.log(`  Electric: ${formatResist(p.elec_resist)}`);
      console.log(`  Wind: ${formatResist(p.wind_resist)}`);
      console.log(`  Psychic: ${formatResist(p.psy_resist)}`);
      console.log(`  Nuclear: ${formatResist(p.nuke_resist)}`);
      console.log(`  Bless: ${formatResist(p.bless_resist)}`);
      console.log(`  Curse: ${formatResist(p.curse_resist)}`);
      break;
    }
    
    default:
      console.log('Usage:');
      console.log('  node query.js list                    - List all personas');
      console.log('  node query.js arcana [name]           - Filter by arcana');
      console.log('  node query.js search <keyword>        - Search by name');
      console.log('  node query.js detail <name>           - Show persona details');
      console.log('\nExamples:');
      console.log('  node query.js arcana 愚者');
      console.log('  node query.js search 亚森');
      console.log('  node query.js detail 亚森');
  }
  
  db.close();
}

main();
