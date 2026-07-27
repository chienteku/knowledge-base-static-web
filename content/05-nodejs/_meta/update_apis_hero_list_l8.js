const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/05-nodejs/_meta/nodejs_terms_zero_to_hero.md';

const newL8Terms = [
  { name: 'Mongoose (MongoDB ODM)', desc: 'The concrete ODM; makes the generic ORM/ODM term tangible.' },
  { name: 'Prisma / Sequelize (SQL ORMs)', desc: 'The concrete SQL ORMs.' },
  { name: 'Database Transactions', desc: 'All-or-nothing operations (ACID).' },
  { name: 'Parameterized Queries / Prepared Statements', desc: 'The actual fix for SQL Injection.' }
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

  const l8Existing = levels.find(l => l.num === 8).terms;
  const newL8 = [];
  
  // 1. SQL vs NoSQL
  newL8.push(l8Existing[0]);
  // 2. ORMs & ODMs
  newL8.push(l8Existing[1]);
  // 3. Mongoose (MongoDB ODM) (NEW)
  newL8.push(newL8Terms.find(t => t.name === 'Mongoose (MongoDB ODM)'));
  // 4. Prisma / Sequelize (SQL ORMs) (NEW)
  newL8.push(newL8Terms.find(t => t.name === 'Prisma / Sequelize (SQL ORMs)'));
  // 5. Connection Pooling
  newL8.push(l8Existing[2]);
  // 6. Migrations
  newL8.push(l8Existing[3]);
  // 7. Database Transactions (NEW)
  newL8.push(newL8Terms.find(t => t.name === 'Database Transactions'));
  // 8. SQL Injection
  newL8.push(l8Existing[4]);
  // 9. Parameterized Queries / Prepared Statements (NEW)
  newL8.push(newL8Terms.find(t => t.name === 'Parameterized Queries / Prepared Statements'));

  levels.find(l => l.num === 8).terms = newL8;

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
