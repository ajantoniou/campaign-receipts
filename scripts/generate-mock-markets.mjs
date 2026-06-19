import fs from 'fs';
import path from 'path';

// Predefined arrays to construct realistic sounding market questions
const prefixes = ["Will", "Who will win", "Does"];
const entities = ["Senator Cruz", "Governor DeSantis", "AOC", "Representative Bowman", "Donald Trump", "Joe Biden", "Gavin Newsom", "Super PAC 'Liberty First'", "The Tech Anti-Trust Bill", "The Crypto Regulation Bill"];
const actions = ["win re-election in", "announce campaign for", "raise more than $5M in", "drop out before", "endorse a primary challenger in", "be the top donor in"];
const contexts = ["2026", "the NY-14 primary", "Q3", "the general election", "Florida", "Texas"];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTitle() {
  const p = getRandomItem(prefixes);
  if (p === "Who will win") {
    return `${p} ${getRandomItem(contexts)}?`;
  }
  return `${p} ${getRandomItem(entities)} ${getRandomItem(actions)} ${getRandomItem(contexts)}?`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateMarkets(count) {
  const marketsDir = path.join(process.cwd(), 'data', 'markets');
  if (!fs.existsSync(marketsDir)) {
    fs.mkdirSync(marketsDir, { recursive: true });
  }

  const generatedSlugs = new Set();
  let generatedCount = 0;

  while (generatedCount < count) {
    let title = generateTitle();
    // Add some random string if title already used to ensure 1000 unique markets
    if (generatedSlugs.has(slugify(title))) {
        title += ` ${Math.floor(Math.random() * 10000)}`;
    }
    
    const slug = slugify(title);
    generatedSlugs.add(slug);

    const impliedProbability = parseFloat(Math.random().toFixed(2));
    const volume = Math.floor(Math.random() * 5000000) + 10000;
    
    const categories = ['FEDERAL', 'STATE', 'POLICY', 'DONOR_INTEL'];
    
    const market = {
      id: slug,
      title: title,
      category: getRandomItem(categories),
      impliedProbability: impliedProbability,
      volume: volume,
      expirationDate: new Date(Date.now() + Math.random() * 10000000000).toISOString(),
      status: Math.random() > 0.1 ? 'OPEN' : 'CLOSED',
      fecEdgeAvailable: true,
      options: [
        { name: 'Yes', price: impliedProbability },
        { name: 'No', price: parseFloat((1 - impliedProbability).toFixed(2)) }
      ],
      // Adding some mock intel data so we can display it if they pay
      intel: {
        summary: "A top donor just pivoted funds to a dark horse candidate.",
        fecFilings: 3,
        superPacSpend: Math.floor(Math.random() * 1000000)
      }
    };

    fs.writeFileSync(
      path.join(marketsDir, `${slug}.json`),
      JSON.stringify(market, null, 2)
    );
    
    generatedCount++;
  }

  console.log(`Successfully generated ${count} mock markets in data/markets/`);
}

generateMarkets(1000);
