const fs = require('fs');
const path = require('path');

const metaFile = path.join(__dirname, '_meta', 'react_terms_zero_to_hero.md');
const termsDir = path.join(__dirname, 'terms');

const metaContent = fs.readFileSync(metaFile, 'utf8');
const lines = metaContent.split('\n');

const termMap = new Map();

for (const line of lines) {
  const match = line.match(/^(\d+)\.\s+.*?\(`(.*\.md)`\)$/);
  if (match) {
    let num = parseInt(match[1], 10);
    let filename = match[2];
    termMap.set(filename, num);
  }
}

function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, filesList);
    } else if (fullPath.endsWith('.md')) {
      filesList.push(fullPath);
    }
  }
  return filesList;
}

const allFiles = getFiles(termsDir);
let shiftedCount = 0;
let notFound = [];

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  let filename = path.basename(file);

  if (!termMap.has(filename)) {
    notFound.push(filename);
    continue;
  }

  let correctNum = termMap.get(filename);

  content = content.replace(/^# Term #(\d+):\s*(.*)$/m, (fullMatch, currentNum, rawTitle) => {
    if (parseInt(currentNum, 10) !== correctNum) {
      shiftedCount++;
      return `# Term #${correctNum}: ${rawTitle}`;
    }
    return fullMatch;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
}

console.log(`Shifted headers in ${shiftedCount} files.`);
if (notFound.length > 0) {
  console.log('Could not find mappings for:');
  notFound.forEach(item => console.log(`  - ${item}`));
}
