import axios from 'axios';
import * as cheerio from 'cheerio';

const url = 'https://wiki.biligame.com/persona/P5R/%E4%BA%9A%E6%A3%AE';
const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
const $ = cheerio.load(response.data);

// Find all td elements
const tds = $('td');
console.log(`Found ${tds.length} td elements`);

// Look for specific content
tds.each((i, td) => {
  const text = $(td).text().trim();
  if (['英文名', '日文名', '阿尔卡那', '等级', '力', '魔', '耐', '速', '运'].includes(text)) {
    const nextText = $(td).next('td').text().trim();
    console.log(`${text}: "${nextText}"`);
  }
});
