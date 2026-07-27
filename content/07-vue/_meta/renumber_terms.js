const fs = require('fs');
const path = require('path');

const metaFile = path.join(__dirname, 'vue_terms_zero_to_hero.md');
const termsDir = path.join(__dirname, '..', 'terms');

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (fullPath.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  if (!fs.existsSync(metaFile)) {
    console.error(`Meta file not found: ${metaFile}`);
    process.exit(1);
  }

  let metaContent = fs.readFileSync(metaFile, 'utf8');
  const lines = metaContent.split('\n');
  
  let currentLevel = 0;
  let termCounter = 1;
  const parsedTerms = [];
  
  const newLines = lines.map(line => {
    // Check level headers e.g. ## Level 1: Core Concepts & Reactivity
    const levelMatch = line.match(/^## Level\s+(\d+):/i);
    if (levelMatch) {
      currentLevel = parseInt(levelMatch[1], 10);
      return line;
    }
    
    // Check term list item e.g. 1. Vue Instance (`vue_instance.md`)
    // or sometimes without backticks around filename, or with different number
    const termMatch = line.match(/^(\d+)\.\s+(.*?)\s+\(`?([^`\s\)]+\.md)`?\)/);
    if (termMatch) {
      const termName = termMatch[2].trim();
      const filename = termMatch[3].trim();
      const termNumber = termCounter++;
      
      parsedTerms.push({
        num: termNumber,
        name: termName,
        filename: filename,
        level: currentLevel
      });
      
      // Return updated index line with correct number
      return `${termNumber}. ${termName} (\`${filename}\`)`;
    }
    
    return line;
  });
  
  // Write the updated index file back
  fs.writeFileSync(metaFile, newLines.join('\n'), 'utf8');
  console.log(`Updated ${metaFile} with sequential numbers.`);

  // Get all existing files in terms directory
  const files = getFiles(termsDir);
  const fileMap = new Map();
  for (const file of files) {
    fileMap.set(path.basename(file), file);
  }

  let updatedHeaders = 0;
  let missingFilesCount = 0;

  for (const term of parsedTerms) {
    const fullPath = fileMap.get(term.filename);

    if (!fullPath) {
      console.log(`[Missing File] Term #${term.num}: ${term.name} -> (expected: ${term.filename} in level_${String(term.level).padStart(2, '0')})`);
      missingFilesCount++;
      continue;
    }

    // Verify file is in correct level directory
    const expectedDir = `level_${String(term.level).padStart(2, '0')}`;
    const actualDir = path.basename(path.dirname(fullPath));
    if (actualDir !== expectedDir) {
      console.warn(`[Location Mismatch] Term #${term.num} (${term.filename}) is in ${actualDir}, expected ${expectedDir}`);
    }

    let fileContent = fs.readFileSync(fullPath, 'utf8');
    const firstLineMatch = fileContent.match(/^# Term #\d+:\s*(.*)/);

    const expectedHeader = `# Term #${term.num}: ${term.name}`;
    if (firstLineMatch) {
      const actualHeader = firstLineMatch[0];

      if (actualHeader !== expectedHeader) {
        const fileLines = fileContent.split('\n');
        fileLines[0] = expectedHeader;
        fs.writeFileSync(fullPath, fileLines.join('\n'), 'utf8');
        console.log(`Updated header in ${term.filename}: ${actualHeader} -> ${expectedHeader}`);
        updatedHeaders++;
      }
    } else {
      console.warn(`[Malformed File] ${term.filename} has no valid Term header on line 1.`);
    }
  }

  console.log(`\nExecution complete.`);
  console.log(`Updated ${updatedHeaders} file headers.`);
  console.log(`${missingFilesCount} files are expected but do not yet exist.`);
}

main();
