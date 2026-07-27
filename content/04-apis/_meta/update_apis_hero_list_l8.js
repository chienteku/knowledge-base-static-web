const fs = require('fs');
const path = require('path');

const srcFile = '/home/kennygu/trunk/javascript-tutorial/knowledge-base/04-apis/_meta/apis_terms_zero_to_hero.md';

const newL8Terms = [
  { name: 'WebSocket Handshake (Upgrade)', desc: 'The HTTP→WS Upgrade request that opens a socket.' },
  { name: 'Heartbeat / Ping-Pong', desc: 'Keep-alive frames that detect a dead connection.' },
  { name: 'Reconnection & Backoff', desc: 'Re-establishing a dropped real-time connection.' },
  { name: 'Pub/Sub & Channels', desc: 'The messaging pattern behind rooms/topics in real-time apps.' }
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

  const originalL8 = levels.find(l => l.num === 8).terms;
  const newL8 = [];
  
  const findTerm = (name) => {
    const term = originalL8.find(t => t.name.toLowerCase().includes(name.toLowerCase()));
    if (!term) throw new Error(`Could not find term: ${name}`);
    return term;
  };
  
  // 1. WebSockets
  newL8.push(findTerm('WebSockets'));
  // 2. WebSocket Handshake (Upgrade) (NEW)
  newL8.push(newL8Terms.find(t => t.name === 'WebSocket Handshake (Upgrade)'));
  // 3. The WebSocket API (Client-side)
  newL8.push(findTerm('The WebSocket API (Client-side)'));
  // 4. Heartbeat / Ping-Pong (NEW)
  newL8.push(newL8Terms.find(t => t.name === 'Heartbeat / Ping-Pong'));
  // 5. Reconnection & Backoff (NEW)
  newL8.push(newL8Terms.find(t => t.name === 'Reconnection & Backoff'));
  // 6. Server-Sent Events (SSE)
  newL8.push(findTerm('Server-Sent Events (SSE)'));
  // 7. Polling vs Long Polling
  newL8.push(findTerm('Polling vs Long Polling'));
  // 8. Socket.io (Ecosystem tool)
  newL8.push(findTerm('Socket.io (Ecosystem tool)'));
  // 9. Pub/Sub & Channels (NEW)
  newL8.push(newL8Terms.find(t => t.name === 'Pub/Sub & Channels'));

  levels.find(l => l.num === 8).terms = newL8;

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
