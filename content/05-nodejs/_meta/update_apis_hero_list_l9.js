const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/05-nodejs/_meta/nodejs_terms_zero_to_hero.md';

const newL9Terms = [
  { name: 'API Versioning', desc: '/api/v1/... — evolving an API without breaking existing clients.' },
  { name: 'MVC Pattern (Model–View–Controller)', desc: 'The folder/architecture pattern for organizing a real server.' },
  { name: 'Controllers & Services', desc: 'Splitting route handlers (controllers) from business logic (services).' },
  { name: 'Input Validation (joi / zod)', desc: 'Rejecting bad payloads at the edge before they hit the DB.' },
  { name: 'Error Handling Middleware', desc: 'Express\'s 4-arg (err, req, res, next) handler.' }
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

  const l9Existing = levels.find(l => l.num === 9).terms;
  const newL9 = [];
  
  // 1. REST API Design
  newL9.push(l9Existing[0]);
  // 2. API Versioning (NEW)
  newL9.push(newL9Terms.find(t => t.name === 'API Versioning'));
  // 3. HTTP Status Codes
  newL9.push(l9Existing[1]);
  // 4. CORS
  newL9.push(l9Existing[2]);
  // 5. Pagination
  newL9.push(l9Existing[3]);
  // 6. Rate Limiting
  newL9.push(l9Existing[4]);
  // 7. MVC Pattern (Model–View–Controller) (NEW)
  newL9.push(newL9Terms.find(t => t.name === 'MVC Pattern (Model–View–Controller)'));
  // 8. Controllers & Services (NEW)
  newL9.push(newL9Terms.find(t => t.name === 'Controllers & Services'));
  // 9. Input Validation (joi / zod) (NEW)
  newL9.push(newL9Terms.find(t => t.name === 'Input Validation (joi / zod)'));
  // 10. Error Handling Middleware (NEW)
  newL9.push(newL9Terms.find(t => t.name === 'Error Handling Middleware'));

  levels.find(l => l.num === 9).terms = newL9;

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
