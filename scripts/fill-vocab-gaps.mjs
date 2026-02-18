import fs from 'fs';
import https from 'https';

const DATABASE_PATH = 'src/data/vocabulary-database.json';

// Simple delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function translate(text, targetLang) {
  return new Promise((resolve) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    https.get(url, {
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json[0][0][0]);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function processFile() {
  const content = fs.readFileSync(DATABASE_PATH, 'utf8');
  const data = JSON.parse(content);
  let updatedCount = 0;

  console.log(`Scanning ${data.vocabulary.length} words...`);

  for (let i = 0; i < data.vocabulary.length; i++) {
    const word = data.vocabulary[i];
    let changed = false;

    if (!word.hindi) {
      const tr = await translate(word.word, 'hi');
      if (tr) { word.hindi = tr; changed = true; }
      await delay(200);
    }
    if (!word.chinese) {
      const tr = await translate(word.word, 'zh-CN');
      if (tr) { word.chinese = tr; changed = true; }
      await delay(200);
    }
    if (!word.urdu) {
      const tr = await translate(word.word, 'ur');
      if (tr) { word.urdu = tr; changed = true; }
      await delay(200);
    }

    if (changed) {
      updatedCount++;
      process.stdout.write(`\rUpdated: ${word.word} (${i + 1}/${data.vocabulary.length})`);
    } else {
        process.stdout.write(`\rChecked: ${word.word} (${i + 1}/${data.vocabulary.length})`);
    }

    // Save every 10 updates
    if (updatedCount % 10 === 0 && changed) {
      fs.writeFileSync(DATABASE_PATH, JSON.stringify(data, null, 2));
    }
  }

  fs.writeFileSync(DATABASE_PATH, JSON.stringify(data, null, 2));
  console.log(`\nDone! Updated ${updatedCount} words.`);
}

processFile();
