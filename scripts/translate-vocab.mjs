import fs from 'fs';

const DATABASE_PATH = 'src/data/vocabulary-database.json';
const EXTRA_PATH = 'src/data/vocabulary-extra.json';

async function translate(text, targetLang) {
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data[0][0][0];
  } catch (err) {
    console.error(`Error translating "${text}" to ${targetLang}:`, err.message);
    return null;
  }
}

async function runPool(items, fn, concurrency = 5) {
  const results = [];
  const executing = [];
  for (const item of items) {
    const p = fn(item).then(res => results.push(res));
    executing.push(p);
    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p.status === 'fulfilled'), 1); // remove fulfilled
    }
  }
  await Promise.all(executing);
  return results;
}


async function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  let updatedCount = 0;

  console.log(`Processing ${filePath}... (${data.vocabulary.length} words)`);

  // We process in chunks to avoid rate limiting
  const CHUNK_SIZE = 10;
  for (let i = 0; i < data.vocabulary.length; i += CHUNK_SIZE) {
    const chunk = data.vocabulary.slice(i, i + CHUNK_SIZE);
    
    await Promise.all(chunk.map(async (word) => {
      let changed = false;
      if (!word.hindi) {
        const tr = await translate(word.word, 'hi');
        if (tr) { word.hindi = tr; changed = true; }
      }
      if (!word.chinese) {
        const tr = await translate(word.word, 'zh-CN');
        if (tr) { word.chinese = tr; changed = true; }
      }
      if (!word.urdu) {
        const tr = await translate(word.word, 'ur');
        if (tr) { word.urdu = tr; changed = true; }
      }
      if (changed) updatedCount++;
    }));
    
    // Save progress periodically
    if (i % 50 === 0) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Saved progress: ${i}/${data.vocabulary.length}`);
    }
    
    // Small delay to be nice to the API
    await new Promise(r => setTimeout(r, 1000));
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Finished ${filePath}. Updated ${updatedCount} words.`);
}

async function main() {
  await processFile(DATABASE_PATH);
  // vocabulary-extra.json usually has translations, but check anyway
  if (fs.existsSync(EXTRA_PATH)) {
      await processFile(EXTRA_PATH);
  }
}

main().catch(console.error);
