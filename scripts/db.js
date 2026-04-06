import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_PATH = path.join(DATA_DIR, 'personas.db');

/**
 * Get a connection to the SQLite database.
 * @returns {Promise<any>} The sql.js database instance.
 */
export async function getDbConnection() {
  const SQL = await initSqlJs();
  
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let db;
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  return db;
}

/**
 * Save the database to disk.
 * @param {any} db The sql.js database instance.
 */
export function saveDb(db) {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/**
 * Initialize all tables with the normalized schema.
 * @param {any} db The sql.js database instance.
 */
export function initSchema(db) {
  // 1. Arcanas
  db.run(`
    CREATE TABLE IF NOT EXISTS arcanas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_cn TEXT NOT NULL,
      name_tw TEXT,
      order_index INTEGER
    )
  `);

  // 2. Elements
  db.run(`
    CREATE TABLE IF NOT EXISTS elements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_cn TEXT NOT NULL,
      name_tw TEXT
    )
  `);

  // 3. Skills
  db.run(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      element_id INTEGER,
      name_cn TEXT NOT NULL,
      name_tw TEXT,
      cost TEXT,
      description_cn TEXT,
      description_tw TEXT,
      wiki_url TEXT,
      FOREIGN KEY (element_id) REFERENCES elements(id)
    )
  `);

  // 4. Personas
  db.run(`
    CREATE TABLE IF NOT EXISTS personas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arcana_id INTEGER,
      name_cn TEXT NOT NULL,
      name_en TEXT,
      name_jp TEXT,
      level INTEGER NOT NULL,
      hp INTEGER,
      sp INTEGER,
      strength INTEGER,
      magic INTEGER,
      endurance INTEGER,
      agility INTEGER,
      luck INTEGER,
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
      trait TEXT,
      trait_desc TEXT,
      item_name TEXT,
      inherit_phys INTEGER DEFAULT 0,
      inherit_gun INTEGER DEFAULT 0,
      inherit_fire INTEGER DEFAULT 0,
      inherit_ice INTEGER DEFAULT 0,
      inherit_elec INTEGER DEFAULT 0,
      inherit_wind INTEGER DEFAULT 0,
      inherit_psy INTEGER DEFAULT 0,
      inherit_nuke INTEGER DEFAULT 0,
      inherit_bless INTEGER DEFAULT 0,
      inherit_curse INTEGER DEFAULT 0,
      inherit_abnormal INTEGER DEFAULT 0,
      inherit_recovery INTEGER DEFAULT 0,
      image_url TEXT,
      local_image_path TEXT,
      wiki_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (arcana_id) REFERENCES arcanas(id)
    )
  `);

  // 5. Persona-Skills Relationship
  db.run(`
    CREATE TABLE IF NOT EXISTS persona_skills (
      persona_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      unlock_level INTEGER,
      PRIMARY KEY (persona_id, skill_id),
      FOREIGN KEY (persona_id) REFERENCES personas(id),
      FOREIGN KEY (skill_id) REFERENCES skills(id)
    )
  `);

  // 6. Fusion Recipes
  db.run(`
    CREATE TABLE IF NOT EXISTS fusion_recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      result_persona_id INTEGER NOT NULL,
      price INTEGER DEFAULT 0,
      ingredient_a_id INTEGER NOT NULL,
      ingredient_b_id INTEGER NOT NULL,
      FOREIGN KEY (result_persona_id) REFERENCES personas(id),
      FOREIGN KEY (ingredient_a_id) REFERENCES personas(id),
      FOREIGN KEY (ingredient_b_id) REFERENCES personas(id)
    )
  `);

  // Indices
  db.run(`CREATE INDEX IF NOT EXISTS idx_personas_level ON personas(level)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_personas_arcana ON personas(arcana_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_personas_name_cn ON personas(name_cn)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_skills_element ON skills(element_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_persona_skills_persona ON persona_skills(persona_id)`);
}
