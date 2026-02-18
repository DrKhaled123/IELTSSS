import fs from 'fs';

const DATABASE_PATH = 'src/data/vocabulary-database.json';

const newWords = [
  // ECONOMY
  {
    word: "Fiscal",
    definition: "Relating to government revenue, especially taxes.",
    level: "C1",
    category: "economy",
    type: "adjective",
    pronunciation: "FIS-kul",
    examples: ["The government enacted a new fiscal policy to stimulate growth."]
  },
  {
    word: "Inflation",
    definition: "A general increase in prices and fall in the purchasing value of money.",
    level: "B2",
    category: "economy",
    type: "noun",
    pronunciation: "in-FLAY-shun",
    examples: ["High inflation has reduced the spending power of consumers."]
  },
  {
    word: "Subsidy",
    definition: "A sum of money granted by the government or a public body to assist an industry or business.",
    level: "C1",
    category: "economy",
    type: "noun",
    pronunciation: "SUB-si-dee",
    examples: ["Agricultural subsidies help farmers compete in the global market."]
  },
  {
    word: "Recession",
    definition: "A period of temporary economic decline during which trade and industrial activity are reduced.",
    level: "B2",
    category: "economy",
    type: "noun",
    pronunciation: "ri-SESH-un",
    examples: ["The country is slowly recovering from a deep recession."]
  },
  {
    word: "Commodity",
    definition: "A raw material or primary agricultural product that can be bought and sold.",
    level: "C1",
    category: "economy",
    type: "noun",
    pronunciation: "kuh-MOD-i-tee",
    examples: ["Oil is a valuable commodity in the international market."]
  },
  {
    word: "GDP",
    definition: "Gross Domestic Product; the total value of goods produced and services provided in a country during one year.",
    level: "B2",
    category: "economy",
    type: "noun",
    pronunciation: "jee-dee-pee",
    examples: ["The country's GDP grew by 3% last year."]
  },
  {
    word: "Monopoly",
    definition: "The exclusive possession or control of the supply or trade in a commodity or service.",
    level: "C1",
    category: "economy",
    type: "noun",
    pronunciation: "muh-NOP-uh-lee",
    examples: ["The company was accused of having a monopoly on the software market."]
  },
  {
    word: "Tariff",
    definition: "A tax or duty to be paid on a particular class of imports or exports.",
    level: "C1",
    category: "economy",
    type: "noun",
    pronunciation: "TAR-if",
    examples: ["New tariffs were imposed on imported steel."]
  },

  // ENVIRONMENT (Avoiding global warming & gravity)
  {
    word: "Biodiversity",
    definition: "The variety of life in the world or in a particular habitat or ecosystem.",
    level: "B2",
    category: "environment",
    type: "noun",
    pronunciation: "bye-oh-di-VER-si-tee",
    examples: ["Preserving biodiversity is crucial for a healthy ecosystem."]
  },
  {
    word: "Conservation",
    definition: "The action of conserving something, in particular the preservation of natural resources.",
    level: "B2",
    category: "environment",
    type: "noun",
    pronunciation: "kon-ser-VAY-shun",
    examples: ["Water conservation is essential during the drought."]
  },
  {
    word: "Habitat",
    definition: "The natural home or environment of an animal, plant, or other organism.",
    level: "B1",
    category: "environment",
    type: "noun",
    pronunciation: "HAB-i-tat",
    examples: ["Deforestation destroys the habitat of many species."]
  },
  {
    word: "Sustainable",
    definition: "Able to be maintained at a certain rate or level; conserving an ecological balance.",
    level: "B2",
    category: "environment",
    type: "adjective",
    pronunciation: "suh-STAY-nuh-bul",
    examples: ["We need to find sustainable sources of energy."]
  },
  {
    word: "Contamination",
    definition: "The action or state of making or being made impure by polluting or poisoning.",
    level: "C1",
    category: "environment",
    type: "noun",
    pronunciation: "kun-tam-i-NAY-shun",
    examples: ["Industrial waste caused severe contamination of the river."]
  },
  {
    word: "Ecosystem",
    definition: "A biological community of interacting organisms and their physical environment.",
    level: "B2",
    category: "environment",
    type: "noun",
    pronunciation: "EE-koh-sis-tum",
    examples: ["Coral reefs are fragile ecosystems."]
  },
  {
    word: "Renewable",
    definition: "(of a natural resource or source of energy) not depleted when used.",
    level: "B2",
    category: "environment",
    type: "adjective",
    pronunciation: "ri-NOO-uh-bul",
    examples: ["Solar and wind power are renewable energy sources."]
  },
  {
    word: "Deforestation",
    definition: "The action of clearing a wide area of trees.",
    level: "B2",
    category: "environment",
    type: "noun",
    pronunciation: "dee-for-uh-STAY-shun",
    examples: ["Deforestation contributes to soil erosion."]
  }
];

function updateDatabase() {
  const content = fs.readFileSync(DATABASE_PATH, 'utf8');
  const data = JSON.parse(content);

  // Check for duplicates
  const existingWords = new Set(data.vocabulary.map(w => w.word.toLowerCase()));
  
  let addedCount = 0;
  newWords.forEach(newWord => {
    if (!existingWords.has(newWord.word.toLowerCase())) {
      data.vocabulary.push(newWord);
      existingWords.add(newWord.word.toLowerCase());
      addedCount++;
    }
  });

  if (addedCount > 0) {
    fs.writeFileSync(DATABASE_PATH, JSON.stringify(data, null, 2));
    console.log(`Added ${addedCount} new words to database.`);
  } else {
    console.log('No new words added (all duplicates).');
  }
}

updateDatabase();
