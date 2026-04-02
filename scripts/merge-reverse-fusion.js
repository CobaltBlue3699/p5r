import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

function main() {
  const personasPath = path.join(ROOT_DIR, 'lib/personas.json');
  const reversePath = path.join(ROOT_DIR, 'lib/reverse-fusion.json');
  
  const personas = JSON.parse(fs.readFileSync(personasPath, 'utf-8'));
  const reverseData = JSON.parse(fs.readFileSync(reversePath, 'utf-8'));
  
  console.log(`Loaded ${personas.length} personas`);
  console.log(`Loaded ${Object.keys(reverseData).length} reverse fusion entries`);
  
  let updated = 0;
  
  for (const persona of personas) {
    const recipes = reverseData[persona.name_cn];
    if (recipes && recipes.length > 0) {
      persona.reverseRecipes = recipes;
      updated++;
    }
  }
  
  fs.writeFileSync(personasPath, JSON.stringify(personas, null, 2));
  console.log(`\nUpdated ${updated} personas with reverse recipes`);
  console.log('Saved to lib/personas.json');
}

main();
