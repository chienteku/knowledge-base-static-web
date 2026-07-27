const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/04-apis/_meta/apis_terms_zero_to_hero.md';

const newL4Terms = [
  { name: 'Session vs Token Authentication', desc: 'Stateful server sessions vs stateless tokens — the core auth trade-off.' },
  { name: 'Access Token vs Refresh Token', desc: 'Short-lived access token + long-lived refresh token pattern.' },
  { name: 'OAuth Scopes', desc: 'Fine-grained permissions granted to a token (read:user).' },
  { name: 'Same-Origin Policy', desc: 'The default browser rule isolating one origin from another.' },
  { name: 'Preflight Request (OPTIONS)', desc: 'The automatic OPTIONS probe the browser sends before a cross-origin call.' },
  { name: 'CSRF (Cross-Site Request Forgery)', desc: "Attack that rides a logged-in user's cookies; why tokens/SameSite exist." },
  { name: 'XSS (Cross-Site Scripting)', desc: 'Injected script stealing tokens; why you never store JWT carelessly.' }
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

  const originalL4 = levels.find(l => l.num === 4).terms;
  const newL4 = [];
  
  const findTerm = (name) => {
    const term = originalL4.find(t => t.name.toLowerCase().includes(name.toLowerCase()));
    if (!term) throw new Error(`Could not find term: ${name}`);
    return term;
  };
  
  // 1-2. API Keys, Basic & Bearer
  newL4.push(findTerm('API Keys'));
  newL4.push(findTerm('Basic & Bearer Authentication'));
  
  // 3. Session vs Token (NEW)
  newL4.push(newL4Terms.find(t => t.name === 'Session vs Token Authentication'));
  
  // 4. JWT
  newL4.push(findTerm('JWT (JSON Web Tokens)'));
  
  // 5. Access vs Refresh Token (NEW)
  newL4.push(newL4Terms.find(t => t.name === 'Access Token vs Refresh Token'));
  
  // 6. OAuth 2.0
  newL4.push(findTerm('OAuth 2.0'));
  
  // 7. OAuth Scopes (NEW)
  newL4.push(newL4Terms.find(t => t.name === 'OAuth Scopes'));
  
  // 8. Same-Origin Policy (NEW)
  newL4.push(newL4Terms.find(t => t.name === 'Same-Origin Policy'));
  
  // 9. CORS
  newL4.push(findTerm('CORS (Cross-Origin Resource Sharing)'));
  
  // 10. Preflight Request (NEW)
  newL4.push(newL4Terms.find(t => t.name === 'Preflight Request (OPTIONS)'));
  
  // 11. CSRF (NEW)
  newL4.push(newL4Terms.find(t => t.name === 'CSRF (Cross-Site Request Forgery)'));
  
  // 12. XSS (NEW)
  newL4.push(newL4Terms.find(t => t.name === 'XSS (Cross-Site Scripting)'));

  levels.find(l => l.num === 4).terms = newL4;

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
