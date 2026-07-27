const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/04-apis/_meta/apis_terms_zero_to_hero.md';

const newL6Terms = [
  { name: 'Bulk / Batch Requests', desc: 'Combining many operations into one call.' },
  { name: 'Circuit Breaker', desc: 'Failing fast when a downstream API is down.' },
  { name: 'Idempotency Keys', desc: 'Client-supplied key so a retried POST doesn\'t double-charge.' },
  { name: 'Cache Invalidation', desc: 'Knowing when cached data is stale (the "hard problem").' }
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

  const originalL6 = levels.find(l => l.num === 6).terms;
  const newL6 = [];
  
  const findTerm = (name) => {
    const term = originalL6.find(t => t.name.toLowerCase().includes(name.toLowerCase()));
    if (!term) throw new Error(`Could not find term: ${name}`);
    return term;
  };
  
  // 1. Pagination
  newL6.push(findTerm('Pagination (Offset vs. Cursor)'));
  // 2. Bulk / Batch (NEW)
  newL6.push(newL6Terms.find(t => t.name === 'Bulk / Batch Requests'));
  // 3. Rate Limiting
  newL6.push(findTerm('Rate Limiting (429 Too Many Requests)'));
  // 4. Circuit Breaker (NEW)
  newL6.push(newL6Terms.find(t => t.name === 'Circuit Breaker'));
  // 5. Idempotency
  newL6.push(findTerm('Idempotency'));
  // 6. Idempotency Keys (NEW)
  newL6.push(newL6Terms.find(t => t.name === 'Idempotency Keys'));
  // 7. Caching
  newL6.push(findTerm('Caching (ETag, Cache-Control)'));
  // 8. Cache Invalidation (NEW)
  newL6.push(newL6Terms.find(t => t.name === 'Cache Invalidation'));
  // 9. Webhooks
  newL6.push(findTerm('Webhooks'));

  levels.find(l => l.num === 6).terms = newL6;

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
