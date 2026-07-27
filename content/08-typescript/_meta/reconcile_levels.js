const fs = require('fs');
const path = require('path');

const termsDir = path.resolve(__dirname, '../terms');
const metaFile = path.resolve(__dirname, 'typescript_terms_zero_to_hero.md');

// The canonical 11-level mapping of terms and files
const fileMappings = [
  // Level 7 — Generics (31-35)
  { num: 31, name: 'generics.md', sourceDir: 'level_08', targetDir: 'level_07', levelHeader: 'Level 7 — Generics' },
  { num: 32, name: 'multiple_generics.md', sourceDir: 'level_08', targetDir: 'level_07', levelHeader: 'Level 7 — Generics' },
  { num: 33, name: 'generic_constraints.md', sourceDir: 'level_08', targetDir: 'level_07', levelHeader: 'Level 7 — Generics' },
  { num: 34, name: 'generic_interfaces_classes.md', sourceDir: 'level_08', targetDir: 'level_07', levelHeader: 'Level 7 — Generics' },
  { num: 35, name: 'default_generics.md', sourceDir: 'level_08', targetDir: 'level_07', levelHeader: 'Level 7 — Generics' },

  // Level 8 — Utility Types (36-40)
  { num: 36, name: 'utility_types.md', sourceDir: 'level_07', targetDir: 'level_08', levelHeader: 'Level 8 — Utility Types' },
  { num: 37, name: 'partial_required.md', sourceDir: 'level_07', targetDir: 'level_08', levelHeader: 'Level 8 — Utility Types' },
  { num: 38, name: 'pick_omit.md', sourceDir: 'level_07', targetDir: 'level_08', levelHeader: 'Level 8 — Utility Types' },
  { num: 39, name: 'record.md', sourceDir: 'level_07', targetDir: 'level_08', levelHeader: 'Level 8 — Utility Types' },
  { num: 40, name: 'returntype.md', sourceDir: 'level_07', targetDir: 'level_08', levelHeader: 'Level 8 — Utility Types' },

  // Level 9 — Advanced Types (41-45)
  { num: 41, name: 'keyof.md', sourceDir: 'level_10', targetDir: 'level_09', levelHeader: 'Level 9 — Advanced Types' },
  { num: 42, name: 'typeof.md', sourceDir: 'level_08', targetDir: 'level_09', levelHeader: 'Level 9 — Advanced Types' },
  { num: 43, name: 'indexed_access.md', sourceDir: 'level_08', targetDir: 'level_09', levelHeader: 'Level 9 — Advanced Types' },
  { num: 44, name: 'conditional_types.md', sourceDir: 'level_10', targetDir: 'level_09', levelHeader: 'Level 9 — Advanced Types' },
  { num: 45, name: 'mapped_types.md', sourceDir: 'level_10', targetDir: 'level_09', levelHeader: 'Level 9 — Advanced Types' },

  // Level 10 — Classes & OOP in TypeScript (46-51)
  { num: 46, name: 'classes.md', sourceDir: 'level_09', targetDir: 'level_10', levelHeader: 'Level 10 — Classes & OOP in TypeScript' },
  { num: 47, name: 'access_modifiers.md', sourceDir: 'level_09', targetDir: 'level_10', levelHeader: 'Level 10 — Classes & OOP in TypeScript' },
  { num: 48, name: 'implements.md', sourceDir: 'level_09', targetDir: 'level_10', levelHeader: 'Level 10 — Classes & OOP in TypeScript' },
  { num: 49, name: 'abstract_classes.md', sourceDir: 'level_09', targetDir: 'level_10', levelHeader: 'Level 10 — Classes & OOP in TypeScript' },
  { num: 50, name: 'static_members.md', sourceDir: 'level_09', targetDir: 'level_10', levelHeader: 'Level 10 — Classes & OOP in TypeScript' },
  { num: 51, name: 'parameter_properties.md', sourceDir: 'level_09', targetDir: 'level_10', levelHeader: 'Level 10 — Classes & OOP in TypeScript' },

  // Level 11 — Modules, Declaration Files & Configuration (52-58)
  { num: 52, name: 'modules.md', sourceDir: 'level_10', targetDir: 'level_11', levelHeader: 'Level 11 — Modules, Declaration Files & Configuration' },
  { num: 53, name: 'namespaces.md', sourceDir: 'level_10', targetDir: 'level_11', levelHeader: 'Level 11 — Modules, Declaration Files & Configuration' },
  { num: 54, name: 'declaration_files.md', sourceDir: 'level_10', targetDir: 'level_11', levelHeader: 'Level 11 — Modules, Declaration Files & Configuration' },
  { num: 55, name: 'definitely_typed.md', sourceDir: 'level_10', targetDir: 'level_11', levelHeader: 'Level 11 — Modules, Declaration Files & Configuration' },
  { num: 56, name: 'enums.md', sourceDir: 'level_10', targetDir: 'level_11', levelHeader: 'Level 11 — Modules, Declaration Files & Configuration' },
  { num: 57, name: 'const_assertions.md', sourceDir: 'level_10', targetDir: 'level_11', levelHeader: 'Level 11 — Modules, Declaration Files & Configuration' },
  { num: 58, name: 'strict_mode.md', sourceDir: 'level_10', targetDir: 'level_11', levelHeader: 'Level 11 — Modules, Declaration Files & Configuration' },
];

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
  console.log('--- STARTING RECONCILIATION ---');

  // 1. Create target directories if they don't exist
  const targets = new Set(fileMappings.map(m => m.targetDir));
  for (const target of targets) {
    const dirPath = path.join(termsDir, target);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  }

  // 2. Move files and update their internal headers
  for (const m of fileMappings) {
    const srcPath = path.join(termsDir, m.sourceDir, m.name);
    const destPath = path.join(termsDir, m.targetDir, m.name);

    if (fs.existsSync(srcPath)) {
      // Read content and rewrite the Level header
      let content = fs.readFileSync(srcPath, 'utf8');
      
      // Replace the blockquote Level header: > **Level X — ...**
      content = content.replace(/^>\s*\*\*Level\s+\d+\s+—.*?\*\*/m, `> **${m.levelHeader}**`);

      // Write to new destination
      fs.writeFileSync(destPath, content, 'utf8');
      
      // Delete from source if different directory
      if (srcPath !== destPath) {
        fs.unlinkSync(srcPath);
        console.log(`Moved ${m.name} from ${m.sourceDir} to ${m.targetDir}`);
      } else {
        console.log(`Updated Level header in ${m.name}`);
      }
    } else if (fs.existsSync(destPath)) {
      // Already moved, just update level header
      let content = fs.readFileSync(destPath, 'utf8');
      content = content.replace(/^>\s*\*\*Level\s+\d+\s+—.*?\*\*/m, `> **${m.levelHeader}**`);
      fs.writeFileSync(destPath, content, 'utf8');
      console.log(`Updated Level header in already-moved ${m.name}`);
    } else {
      console.warn(`File not found anywhere: ${m.name}`);
    }
  }

  // 3. Update all cross-links in all files
  const allFiles = getFiles(termsDir);
  console.log(`Updating cross-links across ${allFiles.length} files...`);

  // Build a map of filenames to their new targetDir
  const fileToDirMap = new Map();
  for (const m of fileMappings) {
    fileToDirMap.set(m.name, m.targetDir);
  }

  let totalLinkFixes = 0;

  for (const filePath of allFiles) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Matches relative links: [Link text](../level_XX/filename.md)
    const relativeLinkRegex = /\[([^\]]+)\]\(\.\.\/(level_\d+)\/([^)#\s]+)(#[^)]+)?\)/g;

    content = content.replace(relativeLinkRegex, (match, text, oldDir, fileName, anchor) => {
      const newDir = fileToDirMap.get(fileName);
      if (newDir && newDir !== oldDir) {
        totalLinkFixes++;
        modified = true;
        const anchorStr = anchor || '';
        return `[${text}](../${newDir}/${fileName}${anchorStr})`;
      }
      return match;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed cross-links in: ${path.relative(termsDir, filePath)}`);
    }
  }

  console.log(`\nReconciliation complete! Fixed ${totalLinkFixes} relative cross-links.`);
}

main();
