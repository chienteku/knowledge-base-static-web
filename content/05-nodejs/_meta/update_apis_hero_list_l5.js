const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/05-nodejs/_meta/nodejs_terms_zero_to_hero.md';

const newL5Terms = [
  { name: 'async / await in Node', desc: 'The modern syntax syntax for asynchronous control flow.' },
  { name: 'Async Error Handling (try/catch + .catch)', desc: 'Catching async rejections before they crash the process.' },
  { name: 'process.nextTick() vs setImmediate()', desc: 'The two special queues and their priority in the loop.' }
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

  const l5Existing = levels.find(l => l.num === 5).terms;
  const newL5 = [];
  
  // 1. Callbacks & Callback Hell
  newL5.push(l5Existing[0]);
  // 2. Promisification
  newL5.push(l5Existing[1]);
  // 3. async / await in Node (NEW)
  newL5.push(newL5Terms.find(t => t.name === 'async / await in Node'));
  // 4. Async Error Handling (try/catch + .catch) (NEW)
  newL5.push(newL5Terms.find(t => t.name === 'Async Error Handling (try/catch + .catch)'));
  // 5. Unhandled Promise Rejections
  newL5.push(l5Existing[4]);
  // 6. Event Emitter
  newL5.push(l5Existing[2]);
  // 7. Microtasks vs Macrotasks
  newL5.push(l5Existing[3]);
  // 8. process.nextTick() vs setImmediate() (NEW)
  newL5.push(newL5Terms.find(t => t.name === 'process.nextTick() vs setImmediate()'));

  levels.find(l => l.num === 5).terms = newL5;

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
