const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/04-apis/_meta/apis_terms_zero_to_hero.md';

const newL3Terms = [
  { name: 'Resource Naming & URI Design', desc: 'Conventions for clean REST endpoints (/users/42/posts).' },
  { name: 'HATEOAS', desc: 'Responses that embed links to next actions (REST maturity).' },
  { name: 'Richardson Maturity Model', desc: 'The 0–3 scale that grades how "RESTful" an API really is.' }
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
    
    const termMatch = line.match(/^\|\s*\d+\s*\|\s*\*\*(.*?)\*\*\s*\|\s*(.*?)\s*\|/);
    if (termMatch && currentLevel) {
      currentLevel.terms.push({ name: termMatch[1].trim(), desc: termMatch[2].trim() });
    }
  }

  const originalL3 = levels.find(l => l.num === 3).terms;
  const newL3 = [];
  
  const findTerm = (name) => {
    const term = originalL3.find(t => t.name.toLowerCase().includes(name.toLowerCase()));
    if (!term) throw new Error(`Could not find term: ${name}`);
    return term;
  };
  
  // 1-3. API, REST, Endpoints
  newL3.push(findTerm('API (Application Programming Interface)'));
  newL3.push(findTerm('REST (Representational State Transfer)'));
  newL3.push(findTerm('Endpoints & Resources'));
  
  // 4. Resource Naming (NEW)
  newL3.push(newL3Terms.find(t => t.name === 'Resource Naming & URI Design'));
  
  // 5-6. Statelessness, CRUD
  newL3.push(findTerm('Statelessness'));
  newL3.push(findTerm('CRUD Operations'));
  
  // 7. HATEOAS (NEW)
  newL3.push(newL3Terms.find(t => t.name === 'HATEOAS'));
  // 8. Richardson Maturity Model (NEW)
  newL3.push(newL3Terms.find(t => t.name === 'Richardson Maturity Model'));

  levels.find(l => l.num === 3).terms = newL3;

  let out = `# 04-APIs: Zero to Hero

A progressive glossary of essential APIs, protocols, and network communication terms, ordered from physical connections to advanced tooling.

---
`;

  let globalIndex = 1;
  for (const level of levels) {
    out += `\n## Level ${level.num}: ${level.name}\n\n`;
    out += `| # | Term | Description |\n`;
    out += `|---|------|-------------|\n`;
    
    for (const term of level.terms) {
      out += `| ${globalIndex} | **${term.name}** | ${term.desc} |\n`;
      globalIndex++;
    }
    out += `\n---\n`;
  }
  
  out += `\n> **Total: ${globalIndex - 1} terms** covering Web APIs and networking protocols.\n`;
  
  fs.writeFileSync(srcFile, out, 'utf8');
  console.log(`Successfully updated Zero to Hero APIs master list with ${globalIndex - 1} terms.`);
}

main();
