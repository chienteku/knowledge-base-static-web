const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/05-nodejs/_meta/nodejs_terms_zero_to_hero.md';

const newL10Terms = [
  { name: 'Child Processes (child_process)', desc: 'Spawning separate OS processes to run other programs / offload work.' },
  { name: 'Worker Threads', desc: 'True in-process parallelism for CPU-bound work without blocking the event loop.' },
  { name: 'The cluster Module', desc: 'Forking the server across all CPU cores to use the whole machine.' },
  { name: 'Load Balancing', desc: 'Spreading traffic across clustered Node processes/instances.' },
  { name: 'Reverse Proxy (Nginx)', desc: 'Why a proxy sits in front of Node for TLS, static files, and load balancing.' },
  { name: 'Graceful Shutdown & Process Signals', desc: 'Handling SIGTERM/SIGINT to drain connections before exit.' },
  { name: 'Logging & Monitoring', desc: 'Structured logs and health metrics beyond console.log in production.' },
  { name: 'Memory Leaks & Garbage Collection', desc: 'The V8 heap, how leaks happen, and how to spot them.' }
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

  const l10Existing = levels.find(l => l.num === 10).terms;
  const newL10 = [];
  
  // 1. Bcrypt
  newL10.push(l10Existing[0]);
  // 2. JWT
  newL10.push(l10Existing[1]);
  // 3. Environment Variables (dotenv)
  newL10.push(l10Existing[2]);
  // 4. Child Processes (child_process) (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'Child Processes (child_process)'));
  // 5. Worker Threads (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'Worker Threads'));
  // 6. The cluster Module (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'The cluster Module'));
  // 7. PM2 (Process Manager)
  newL10.push(l10Existing[4]);
  // 8. Load Balancing (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'Load Balancing'));
  // 9. Reverse Proxy (Nginx) (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'Reverse Proxy (Nginx)'));
  // 10. Docker
  newL10.push(l10Existing[3]);
  // 11. Graceful Shutdown & Process Signals (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'Graceful Shutdown & Process Signals'));
  // 12. Logging & Monitoring (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'Logging & Monitoring'));
  // 13. Memory Leaks & Garbage Collection (NEW)
  newL10.push(newL10Terms.find(t => t.name === 'Memory Leaks & Garbage Collection'));

  levels.find(l => l.num === 10).terms = newL10;

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
