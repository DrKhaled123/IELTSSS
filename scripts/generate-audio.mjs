import fs from 'fs';
import path from 'path';
import https from 'https';

const DATABASE_PATH = 'src/data/vocabulary-database.json';
const AUDIO_DIR = 'public/audio/vocab';

// Ensure directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Simple delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadAudio(text, filename) {
  const filePath = path.join(AUDIO_DIR, filename);
  if (fs.existsSync(filePath)) {
    return true; // Already exists
  }

  return new Promise((resolve) => {
    // Google Translate TTS (unofficial endpoint, reliable for this purpose)
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
    
    https.get(url, {
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        resolve(false);
        return;
      }
      const fileStream = fs.createWriteStream(filePath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(true);
      });
    }).on('error', () => resolve(false));
  });
}

async function processFile() {
  const content = fs.readFileSync(DATABASE_PATH, 'utf8');
  const data = JSON.parse(content);
  let updatedCount = 0;

  console.log(`Generating audio for ${data.vocabulary.length} words...`);

  for (let i = 0; i < data.vocabulary.length; i++) {
    const word = data.vocabulary[i];
    const filename = `${word.word.toLowerCase().replace(/[^a-z0-9]/g, '_')}.mp3`;
    
    // Download audio if missing
    const success = await downloadAudio(word.word, filename);
    
    if (success) {
      // Update database with audio path if not present
      if (!word.audio) {
        word.audio = `/audio/vocab/${filename}`;
        updatedCount++;
      }
      process.stdout.write(`\rProcessed: ${word.word} (${i + 1}/${data.vocabulary.length})`);
    } else {
      console.log(`\nFailed to download audio for: ${word.word}`);
    }
    
    // Small delay to be polite
    await delay(100);
  }

  if (updatedCount > 0) {
    fs.writeFileSync(DATABASE_PATH, JSON.stringify(data, null, 2));
    console.log(`\nUpdated database references for ${updatedCount} words.`);
  } else {
    console.log('\nAll audio files verified.');
  }
}

processFile();
