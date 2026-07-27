const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/05-nodejs/_meta/nodejs_terms_zero_to_hero.md';

const newL1Terms = [
  { name: 'The Call Stack', desc: 'The single stack of frames the main thread runs.' },
  { name: 'The Thread Pool (libuv)', desc: 'The pool of background C++ threads that perform blocking work.' },
  { name: 'CPU-bound vs I/O-bound', desc: 'Why Node shines at I/O but chokes on heavy computation.' },
  { name: 'Blocking the Event Loop', desc: 'Concrete anti-patterns that freeze the server.' }
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
      // Find the term in existing files or we'll define descriptions manually below
      currentLevel.terms.push({ name: termMatch[1].trim() });
    }
  }

  // Set description for existing Level 1 terms so they output nicely
  const l1Existing = levels.find(l => l.num === 1).terms;
  l1Existing[0].desc = 'Node.js (Runtime Environment)'; // Node.js (Runtime Environment)
  l1Existing[1].desc = 'V8 JavaScript Engine';
  l1Existing[2].desc = 'Single-Threaded Architecture';
  l1Existing[3].desc = 'Non-Blocking I/O';
  l1Existing[4].desc = 'The Event Loop & Libuv';

  const newL1 = [];
  // 1. Node.js (Runtime Environment)
  newL1.push(l1Existing[0]);
  // 2. V8 JavaScript Engine
  newL1.push(l1Existing[1]);
  // 3. Single-Threaded Architecture
  newL1.push(l1Existing[2]);
  // 4. The Call Stack (NEW)
  newL1.push(newL1Terms.find(t => t.name === 'The Call Stack'));
  // 5. Non-Blocking I/O
  newL1.push(l1Existing[3]);
  // 6. The Event Loop & Libuv
  newL1.push(l1Existing[4]);
  // 7. The Thread Pool (libuv) (NEW)
  newL1.push(newL1Terms.find(t => t.name === 'The Thread Pool (libuv)'));
  // 8. CPU-bound vs I/O-bound (NEW)
  newL1.push(newL1Terms.find(t => t.name === 'CPU-bound vs I/O-bound'));
  // 9. Blocking the Event Loop (NEW)
  newL1.push(newL1Terms.find(t => t.name === 'Blocking the Event Loop'));

  levels.find(l => l.num === 1).terms = newL1;

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
