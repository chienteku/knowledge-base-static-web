const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/05-nodejs/_meta/nodejs_terms_zero_to_hero.md';

const newL7Terms = [
  { name: 'Route Parameters & Query Strings', desc: 'req.params vs req.query — the two ways routes receive input.' },
  { name: 'The Middleware Chain & next()', desc: 'How next() passes control down the middleware pipeline.' },
  { name: 'Body Parsing (express.json())', desc: 'The middleware that turns the raw request stream into req.body.' },
  { name: 'Serving Static Files (express.static)', desc: 'Serving HTML/CSS/images straight from a folder.' }
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

  const l7Existing = levels.find(l => l.num === 7).terms;
  const newL7 = [];
  
  // 1. The http Module Deep Dive
  newL7.push(l7Existing[0]);
  // 2. Express.js
  newL7.push(l7Existing[1]);
  // 3. Routing
  newL7.push(l7Existing[2]);
  // 4. Route Parameters & Query Strings (NEW)
  newL7.push(newL7Terms.find(t => t.name === 'Route Parameters & Query Strings'));
  // 5. Middleware
  newL7.push(l7Existing[3]);
  // 6. The Middleware Chain & next() (NEW)
  newL7.push(newL7Terms.find(t => t.name === 'The Middleware Chain & next()'));
  // 7. Body Parsing (express.json()) (NEW)
  newL7.push(newL7Terms.find(t => t.name === 'Body Parsing (express.json())'));
  // 8. Serving Static Files (express.static) (NEW)
  newL7.push(newL7Terms.find(t => t.name === 'Serving Static Files (express.static)'));
  // 9. The req & res Objects
  newL7.push(l7Existing[4]);

  levels.find(l => l.num === 7).terms = newL7;

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
