const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/05-nodejs/_meta/nodejs_terms_zero_to_hero.md';

const newL2Terms = [
  { name: 'The Node.js REPL', desc: 'The interactive shell for experimenting with Node.' },
  { name: 'stdin / stdout / stderr (Standard Streams)', desc: 'The process\'s built-in streams.' },
  { name: 'The os & util Modules', desc: 'Reading CPU/memory info and helpers like util.promisify.' },
  { name: 'The events Module', desc: 'The EventEmitter class\'s home module.' }
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

  const l2Existing = levels.find(l => l.num === 2).terms;
  const newL2 = [];
  
  // 1. Global Objects
  newL2.push(l2Existing[0]);
  // 2. The Node.js REPL (NEW)
  newL2.push(newL2Terms.find(t => t.name === 'The Node.js REPL'));
  // 3. The process Object
  newL2.push(l2Existing[1]);
  // 4. stdin / stdout / stderr (Standard Streams) (NEW)
  newL2.push(newL2Terms.find(t => t.name === 'stdin / stdout / stderr (Standard Streams)'));
  // 5. The fs Module (File System)
  newL2.push(l2Existing[2]);
  // 6. The path Module
  newL2.push(l2Existing[3]);
  // 7. The http Module
  newL2.push(l2Existing[4]);
  // 8. The os & util Modules (NEW)
  newL2.push(newL2Terms.find(t => t.name === 'The os & util Modules'));
  // 9. The events Module (NEW)
  newL2.push(newL2Terms.find(t => t.name === 'The events Module'));
  // 10. The crypto Module
  newL2.push(l2Existing[5]);

  levels.find(l => l.num === 2).terms = newL2;

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
