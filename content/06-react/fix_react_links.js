const fs = require('fs');
const path = require('path');

const termsDir = path.join(__dirname, 'terms');

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

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix level_07 links that moved to level_09
  content = content.replace(/(\.\.\/level_07\/(client_side_routing|dynamic_segments|link_component|react_router|use_navigate)\.md)/g, '../level_09/$2.md');
  
  // Fix level_09 links that moved to level_10
  content = content.replace(/(\.\.\/level_09\/(hydration|nextjs|rsc|ssg|ssr)\.md)/g, '../level_10/$2.md');
  
  // Fix specific link from hoc.md to higher_order_functions.md
  content = content.replace(/\.\.\/\.\.\/02-javascript\/terms\/level_03\/higher_order_functions\.md/g, '../../../03-javascript/terms/level_03/higher_order_functions.md');

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
}

console.log("Fixed react links.");
