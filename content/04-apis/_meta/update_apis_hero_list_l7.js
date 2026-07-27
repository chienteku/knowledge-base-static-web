const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/04-apis/_meta/apis_terms_zero_to_hero.md';

const newL7Terms = [
  { name: 'Deserialization / Parsing', desc: 'Turning a wire string back into a live object (the inverse of serialization).' },
  { name: 'Character Encoding (UTF-8)', desc: 'How text becomes bytes, and why non-ASCII/emoji break naive payloads.' },
  { name: 'Binary vs Text Formats', desc: 'When to send bytes (protobuf, files) instead of text (JSON, XML).' },
  { name: 'Blob & ArrayBuffer', desc: 'Handling binary response bodies in the browser (res.blob(), res.arrayBuffer()).' },
  { name: 'Over-fetching vs Under-fetching', desc: 'The REST pain points GraphQL was built to solve.' }
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

  const originalL7 = levels.find(l => l.num === 7).terms;
  const newL7 = [];
  
  const findTerm = (name) => {
    const term = originalL7.find(t => t.name.toLowerCase().includes(name.toLowerCase()));
    if (!term) throw new Error(`Could not find term: ${name}`);
    return term;
  };
  
  // 1. Serialization & Deserialization
  newL7.push(findTerm('Serialization & Deserialization'));
  // 2. Deserialization / Parsing (NEW)
  newL7.push(newL7Terms.find(t => t.name === 'Deserialization / Parsing'));
  // 3. JSON Methods (parse / stringify)
  newL7.push(findTerm('JSON Methods (parse / stringify)'));
  // 4. XML
  newL7.push(findTerm('XML'));
  // 5. Character Encoding (UTF-8) (NEW)
  newL7.push(newL7Terms.find(t => t.name === 'Character Encoding (UTF-8)'));
  // 6. Base64 Encoding
  newL7.push(findTerm('Base64 Encoding'));
  // 7. Binary vs Text Formats (NEW)
  newL7.push(newL7Terms.find(t => t.name === 'Binary vs Text Formats'));
  // 8. Blob & ArrayBuffer (NEW)
  newL7.push(newL7Terms.find(t => t.name === 'Blob & ArrayBuffer'));
  // 9. GraphQL (The REST Alternative)
  newL7.push(findTerm('GraphQL (The REST Alternative)'));
  // 10. Over-fetching vs Under-fetching (NEW)
  newL7.push(newL7Terms.find(t => t.name === 'Over-fetching vs Under-fetching'));

  levels.find(l => l.num === 7).terms = newL7;

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
