import { getDbConnection, saveDb, initSchema } from './db.js';

async function init() {
  console.log('Initializing database with normalized schema...');
  const db = await getDbConnection();
  
  initSchema(db);
  
  saveDb(db);
  console.log('Database initialized successfully!');
  db.close();
}

init().catch(console.error);
