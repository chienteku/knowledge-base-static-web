const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/04-apis/_meta/apis_terms_zero_to_hero.md';

const newL10Terms = [
  { name: 'DevTools Network Tab', desc: 'Inspecting real requests/responses in the browser.' },
  { name: 'API Contract / Schema-First Design', desc: 'Agreeing the interface before writing code.' },
  { name: 'SDK / Client Library', desc: 'Language wrappers that hide raw HTTP from consumers.' },
  { name: 'Deprecation & Sunsetting', desc: 'Retiring old API versions gracefully.' },
  { name: 'Microservices vs Monolith', desc: 'Why many small APIs vs one big one.' },
  { name: 'API Gateway', desc: 'The single entry point that routes/authenticates/rate-limits.' },
  { name: 'Load Balancing', desc: 'Spreading traffic across servers (and why statelessness enables it).' },
  { name: 'Protocol Buffers (protobuf)', desc: 'The binary schema format that powers gRPC.' },
  { name: 'SOAP & XML-RPC (legacy)', desc: 'The pre-REST protocols still alive in enterprise.' }
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

  const originalL10 = levels.find(l => l.num === 10).terms;
  const newL10 = [];
  
  const findTerm = (name) => {
    const term = originalL10.find(t => t.name.toLowerCase().includes(name.toLowerCase()));
    if (!term) throw new Error(`Could not find term: ${name}`);
    return term;
  };
  
  // 1. Postman / Insomnia (API Clients)
  newL10.push(findTerm('Postman / Insomnia'));
  // 2. DevTools Network Tab (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'DevTools Network Tab'));
  // 3. Swagger / OpenAPI Specification
  newL10.push(findTerm('Swagger / OpenAPI Specification'));
  // 4. API Contract / Schema-First Design (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'API Contract / Schema-First Design'));
  // 5. SDK / Client Library (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'SDK / Client Library'));
  // 6. API Versioning (v1, v2)
  newL10.push(findTerm('API Versioning'));
  // 7. Deprecation & Sunsetting (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'Deprecation & Sunsetting'));
  // 8. Mocking APIs
  newL10.push(findTerm('Mocking APIs'));
  // 9. Microservices vs Monolith (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'Microservices vs Monolith'));
  // 10. API Gateway (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'API Gateway'));
  // 11. Load Balancing (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'Load Balancing'));
  // 12. gRPC (Remote Procedure Call)
  newL10.push(findTerm('gRPC (Remote Procedure Call)'));
  // 13. Protocol Buffers (protobuf) (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'Protocol Buffers (protobuf)'));
  // 14. SOAP & XML-RPC (legacy) (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'SOAP & XML-RPC (legacy)'));

  levels.find(l => l.num === 10).terms = newL10;

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
