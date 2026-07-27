const fs = require('fs');
const path = require('path');

const metaFile = path.join(__dirname, '_meta', 'react_terms_zero_to_hero.md');
const termsDir = path.join(__dirname, 'terms');

const metaContent = fs.readFileSync(metaFile, 'utf8');
const lines = metaContent.split('\n');

const metaFiles = new Set();
for (const line of lines) {
  const match = line.match(/\(`(.*\.md)`\)/);
  if (match) {
    metaFiles.add(match[1]);
  }
}

function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, filesList);
    } else if (fullPath.endsWith('.md')) {
      filesList.push(path.basename(fullPath));
    }
  }
  return filesList;
}

const physicalFiles = new Set(getFiles(termsDir));

console.log("=== IN META BUT MISSING FROM DISK ===");
for (const mf of metaFiles) {
  if (!physicalFiles.has(mf)) {
    console.log(mf);
  }
}

console.log("\n=== ON DISK BUT MISSING FROM META ===");
for (const pf of physicalFiles) {
  if (!metaFiles.has(pf)) {
    console.log(pf);
  }
}
