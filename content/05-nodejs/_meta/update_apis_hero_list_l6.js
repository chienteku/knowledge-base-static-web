const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/05-nodejs/_meta/nodejs_terms_zero_to_hero.md';

const newL6Terms = [
  { name: 'Character Encoding & Buffer ↔ String', desc: 'Turning raw bytes into text (\'utf8\') and back.' },
  { name: 'Duplex & Transform Streams', desc: 'Streams that both read and write / transform data mid-flow.' },
  { name: 'Backpressure', desc: 'Flow control that pauses a fast reader when a slow writer can\'t keep up.' }
];

function main() {
  const content = fs.readFileSync(srcFile, 'utf8');
  const lines = content.split('\n');
  
  const levels = [];
  let currentLevel = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lvlMatch = line.match(/^## Level (\d+): (.*)/);
    if (lvlMatch) {
      const num = parseInt(lvlMatch[1], 10);
      currentLevel = { num, name: lvlMatch[2], terms: [] };
      levels.push(currentLevel);
      continue;
    }
    
    const termMatch = line.match(/^\d+\.\s*(.*)/);
    if (termMatch && currentLevel) {
      currentLevel.terms.push({ name: termMatch[1].trim() });
    }
  }

  const l6Existing = levels.find(l => l.num === 6).terms;
  const newL6 = [];
  
  // 1. Buffers
  newL6.push(l6Existing[0]);
  // 2. Character Encoding & Buffer ↔ String (NEW)
  newL6.push(newL6Terms.find(t => t.name === 'Character Encoding & Buffer ↔ String'));
  // 3. Streams (General Concept)
  newL6.push(l6Existing[1]);
  // 4. Readable & Writable Streams
  newL6.push(l6Existing[2]);
  // 5. Duplex & Transform Streams (NEW)
  newL6.push(newL6Terms.find(t => t.name === 'Duplex & Transform Streams'));
  // 6. Piping (.pipe())
  newL6.push(l6Existing[3]);
  // 7. Backpressure (NEW)
  newL6.push(newL6Terms.find(t => t.name === 'Backpressure'));
  // 8. Data Chunks
  newL6.push(l6Existing[4]);

  levels.find(l => l.num === 6).terms = newL6;

  let out = `# 05-Node.js: Zero to Hero

A progressive glossary of essential Node.js architecture, modules, and performance concepts.

`;

  let globalIndex = 1;
  for (const level of levels) {
    out += `\n## Level ${level.num}: ${level.name}\n\n`;
    for (const term of level.terms) {
      out += `${globalIndex}. ${term.name}\n`;
      globalIndex++;
    }
  }
  
  fs.writeFileSync(srcFile, out + '\n', 'utf8');
  console.log(`Successfully updated Zero to Hero Node.js master list with ${globalIndex - 1} terms.`);
}

main();
