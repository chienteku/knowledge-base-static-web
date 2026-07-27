const fs = require('fs');
const path = require('path');

const termsDir = path.resolve(__dirname, '../terms');
const roadmapFile = path.resolve(__dirname, 'typescript_terms_zero_to_hero.md');
const missingTermsFile = path.resolve(__dirname, 'missing_terms.md');

const levelTitles = {
  'level_01': 'Level 1: Core Concepts & Environment Setup',
  'level_02': 'Level 2: Basic Types',
  'level_03': 'Level 3: Object Types & Interfaces',
  'level_04': 'Level 4: Functions',
  'level_05': 'Level 5: Union & Intersection Types',
  'level_06': 'Level 6: Type Narrowing & Guards',
  'level_07': 'Level 7: Generics',
  'level_08': 'Level 8: Utility Types',
  'level_09': 'Level 9: Advanced Types',
  'level_10': 'Level 10: Classes & OOP in TypeScript',
  'level_11': 'Level 11: Modules, Declaration Files & Configuration'
};

const levels = Object.keys(levelTitles).sort();

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
  console.log('=== STARTING TS TERM RENUMBERING ===');
  
  // 1. Gather all terms across all levels
  const allTerms = [];

  for (const lvl of levels) {
    const lvlDir = path.join(termsDir, lvl);
    if (!fs.existsSync(lvlDir)) continue;
    
    const files = fs.readdirSync(lvlDir).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      const filePath = path.join(lvlDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const firstLine = lines[0];
      
      const match = firstLine.match(/# Term #([\d.]+):\s*(.*)/);
      if (!match) {
        console.error(`Error: Could not parse header in file: ${lvl}/${file}. First line: ${firstLine}`);
        continue;
      }
      
      const termNoStr = match[1];
      const termNoFloat = parseFloat(termNoStr);
      const title = match[2].trim();
      
      allTerms.push({
        level: lvl,
        file: file,
        filePath: filePath,
        oldNoStr: termNoStr,
        oldNoFloat: termNoFloat,
        title: title,
        contentLines: lines
      });
    }
  }

  // 2. Sort terms by level first, then by their parsed float number
  allTerms.sort((a, b) => {
    if (a.level !== b.level) {
      return a.level.localeCompare(b.level);
    }
    return a.oldNoFloat - b.oldNoFloat;
  });

  console.log(`Found and sorted ${allTerms.length} terms.`);

  // 3. Assign new consecutive integer numbers (1 to 76)
  allTerms.forEach((term, index) => {
    term.newNo = index + 1;
  });

  // 4. Update the term files on disk
  for (const term of allTerms) {
    const newHeader = `# Term #${term.newNo}: ${term.title}`;
    term.contentLines[0] = newHeader;
    const newContent = term.contentLines.join('\n');
    fs.writeFileSync(term.filePath, newContent, 'utf8');
    console.log(`Updated ${term.level}/${term.file}: Term #${term.oldNoStr} -> Term #${term.newNo}`);
  }

  // 5. Regenerate typescript_terms_zero_to_hero.md
  let roadmapContent = `# TypeScript: Zero to Hero Roadmap\n\n`;
  roadmapContent += `This roadmap defines the ${allTerms.length} essential TypeScript terms grouped into 11 progressive levels.\n`;

  for (const lvl of levels) {
    const lvlTerms = allTerms.filter(t => t.level === lvl);
    if (lvlTerms.length === 0) continue;

    roadmapContent += `\n## ${levelTitles[lvl]}\n`;
    lvlTerms.forEach(t => {
      // Strip any backticks or formatting from the title to keep it clean in the roadmap list if needed, or keep it exact
      roadmapContent += `${t.newNo}. ${t.title} (\`${t.file}\`)\n`;
    });
  }

  fs.writeFileSync(roadmapFile, roadmapContent, 'utf8');
  console.log(`Roadmap file regenerated at: ${roadmapFile}`);

  // 6. Update missing_terms.md
  if (fs.existsSync(missingTermsFile)) {
    let missingContent = fs.readFileSync(missingTermsFile, 'utf8');
    const lines = missingContent.split('\n');
    
    // Find the header separator line: |---|---|---|---|
    let separatorIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('|---|')) {
        separatorIdx = i;
        break;
      }
    }
    
    if (separatorIdx !== -1) {
      const headerLines = lines.slice(0, separatorIdx + 1);
      const newRows = [];
      
      // Parse original rows to map them by filename
      // Format: | 2.1 | Level 1 | Structural Typing / Duck Typing | `level_01/structural_typing.md` |
      for (let i = separatorIdx + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.startsWith('|')) continue;
        
        const parts = line.split('|').map(p => p.trim());
        // parts[0] is empty, parts[1] is Term #, parts[2] is Level, parts[3] is Term Name, parts[4] is Filename
        const fileRef = parts[4].replace(/`/g, ''); // strip backticks
        const filename = path.basename(fileRef);
        const levelName = path.dirname(fileRef); // e.g. level_01
        
        const matchedTerm = allTerms.find(t => t.file === filename && t.level === levelName);
        if (matchedTerm) {
          const formattedLevel = levelTitles[levelName].split(':')[0]; // e.g. "Level 1"
          newRows.push(`| ${matchedTerm.newNo} | ${formattedLevel} | ${matchedTerm.title} | \`${levelName}/${filename}\` |`);
        } else {
          // If we couldn't match, preserve the original row
          newRows.push(line);
        }
      }
      
      const updatedMissingContent = headerLines.concat(newRows).join('\n') + '\n';
      fs.writeFileSync(missingTermsFile, updatedMissingContent, 'utf8');
      console.log(`Missing terms tracker updated at: ${missingTermsFile}`);
    }
  }

  console.log('\n=== RENUMBERING COMPLETED SUCCESSFULLY ===');
}

main();
