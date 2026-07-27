const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/04-apis/_meta/apis_terms_zero_to_hero.md';

const newL9Terms = [
  { name: 'Storage Serialization', desc: 'Why Web Storage only holds strings (JSON.stringify round-trip).' },
  { name: 'Cookie Attributes (HttpOnly, Secure, SameSite)', desc: 'The flags that make cookies safe for auth.' },
  { name: 'Storage Limits & Eviction', desc: 'Quotas and when browsers purge cached/stored data.' },
  { name: 'Offline-First / PWA', desc: 'Designing apps that work without a network.' }
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

  const originalL9 = levels.find(l => l.num === 9).terms;
  const newL9 = [];
  
  const findTerm = (name) => {
    const term = originalL9.find(t => t.name.toLowerCase().includes(name.toLowerCase()));
    if (!term) throw new Error(`Could not find term: ${name}`);
    return term;
  };
  
  // 1. localStorage & sessionStorage
  newL9.push(findTerm('localStorage'));
  // 2. Storage Serialization (NEW)
  newL9.push(newL9Terms.find(t => t.name === 'Storage Serialization'));
  // 3. Cookies
  newL9.push(findTerm('Cookies'));
  // 4. Cookie Attributes (HttpOnly, Secure, SameSite) (NEW)
  newL9.push(newL9Terms.find(t => t.name === 'Cookie Attributes (HttpOnly, Secure, SameSite)'));
  // 5. IndexedDB
  newL9.push(findTerm('IndexedDB'));
  // 6. Cache API
  newL9.push(findTerm('Cache API'));
  // 7. Storage Limits & Eviction (NEW)
  newL9.push(newL9Terms.find(t => t.name === 'Storage Limits & Eviction'));
  // 8. Service Workers
  newL9.push(findTerm('Service Workers'));
  // 9. Offline-First / PWA (NEW)
  newL9.push(newL9Terms.find(t => t.name === 'Offline-First / PWA'));

  levels.find(l => l.num === 9).terms = newL9;

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
