const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/04-apis/_meta/apis_terms_zero_to_hero.md';

const newL4Terms = [
  { name: 'Secrets & Environment Variables', desc: 'Keeping API keys out of source code (.env, secret managers).' }
];

const newL5Terms = [
  { name: 'XMLHttpRequest / AJAX', desc: 'The legacy request API fetch() replaced; explains fetch\'s "why".' },
  { name: '`Promise.all` / Parallel Requests', desc: 'Firing many requests concurrently and awaiting all.' },
  { name: 'Request Timeout', desc: 'Aborting a request that hangs too long.' },
  { name: 'AbortController / Cancellation', desc: 'Canceling an in-flight fetch.' },
  { name: 'Retry & Exponential Backoff', desc: 'Re-attempting failed calls with growing delays.' },
  { name: 'FormData & Multipart Uploads', desc: 'Sending files/binary instead of JSON.' },
  { name: 'CORS Errors in the Browser', desc: 'Reading and diagnosing a blocked cross-origin fetch.' }
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

  // Rearrange Level 4
  const originalL4 = levels.find(l => l.num === 4).terms;
  const newL4 = [];
  const findL4Term = (name) => {
    const term = originalL4.find(t => t.name.toLowerCase().includes(name.toLowerCase()));
    if (!term) throw new Error(`Could not find L4 term: ${name}`);
    return term;
  };
  
  newL4.push(findL4Term('API Keys'));
  newL4.push(newL4Terms[0]); // Secrets & Environment Variables (NEW)
  newL4.push(findL4Term('Basic & Bearer Authentication'));
  newL4.push(findL4Term('Session vs Token Authentication'));
  newL4.push(findL4Term('JWT (JSON Web Tokens)'));
  newL4.push(findL4Term('Access Token vs Refresh Token'));
  newL4.push(findL4Term('OAuth 2.0'));
  newL4.push(findL4Term('OAuth Scopes'));
  newL4.push(findL4Term('Same-Origin Policy'));
  newL4.push(findL4Term('CORS (Cross-Origin Resource Sharing)'));
  newL4.push(findL4Term('Preflight Request (OPTIONS)'));
  newL4.push(findL4Term('CSRF (Cross-Site Request Forgery)'));
  newL4.push(findL4Term('XSS (Cross-Site Scripting)'));
  
  levels.find(l => l.num === 4).terms = newL4;

  // Rearrange Level 5
  const originalL5 = levels.find(l => l.num === 5).terms;
  const newL5 = [];
  const findL5Term = (name) => {
    const term = originalL5.find(t => t.name.toLowerCase().includes(name.toLowerCase()));
    if (!term) throw new Error(`Could not find L5 term: ${name}`);
    return term;
  };
  
  newL5.push(newL5Terms.find(t => t.name === 'XMLHttpRequest / AJAX'));
  newL5.push(findL5Term('The `fetch()` API'));
  newL5.push(findL5Term('Promises (in the context of networks)'));
  newL5.push(findL5Term('`async` / `await`'));
  newL5.push(newL5Terms.find(t => t.name === '`Promise.all` / Parallel Requests'));
  newL5.push(findL5Term('Error Handling (`try` / `catch`)'));
  newL5.push(findL5Term('The `Response` Object (`res.json()`, `res.ok`)'));
  newL5.push(newL5Terms.find(t => t.name === 'Request Timeout'));
  newL5.push(newL5Terms.find(t => t.name === 'AbortController / Cancellation'));
  newL5.push(newL5Terms.find(t => t.name === 'Retry & Exponential Backoff'));
  newL5.push(newL5Terms.find(t => t.name === 'FormData & Multipart Uploads'));
  newL5.push(newL5Terms.find(t => t.name === 'CORS Errors in the Browser'));
  
  levels.find(l => l.num === 5).terms = newL5;

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
