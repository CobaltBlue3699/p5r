import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const dbPath = path.join(DATA_DIR, 'personas.db');

async function init() {
  const SQL = await initSqlJs();
  
  let db;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS personas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_cn TEXT NOT NULL,
      name_en TEXT,
      name_jp TEXT,
      level INTEGER NOT NULL,
      arcana TEXT NOT NULL,
      phys_resist TEXT,
      gun_resist TEXT,
      fire_resist TEXT,
      ice_resist TEXT,
      elec_resist TEXT,
      wind_resist TEXT,
      psy_resist TEXT,
      nuke_resist TEXT,
      bless_resist TEXT,
      curse_resist TEXT,
      image_url TEXT,
      local_image_path TEXT,
      wiki_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_personas_level ON personas(level)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_personas_arcana ON personas(arcana)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_personas_name_cn ON personas(name_cn)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      persona_id INTEGER NOT NULL,
      name_cn TEXT NOT NULL,
      name_en TEXT,
      cost TEXT,
      effect TEXT,
      type TEXT,
      FOREIGN KEY (persona_id) REFERENCES personas(id)
    )
  `);
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_skills_persona ON skills(persona_id)`);
  
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  
  console.log('Database initialized successfully!');
  console.log('Tables created: personas, skills');
  console.log(`Database saved to: ${dbPath}`);
  
  db.close();
}

init();
