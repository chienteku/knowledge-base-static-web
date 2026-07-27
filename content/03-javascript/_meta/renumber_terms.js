const fs = require('fs');
const path = require('path');

const metaFile = path.join(__dirname, 'javascript_terms_zero_to_hero.md');
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

function termToFilename(term) {
  let name = term.replace(/`/g, '').trim().toLowerCase();
  
  // Custom manual mappings matching physical files
  if (name === 'strict vs loose equality (=== vs ==)') return 'strict_vs_loose_equality.md';
  if (name === 'increment / decrement (++ / --)') return 'increment_decrement.md';
  if (name === 'ternary / conditional operator (? :)') return 'ternary_operator.md';
  if (name === 'infinity / -infinity') return 'infinity.md';
  if (name === 'dynamic & weak typing') return 'dynamic_weak_typing.md';
  if (name === 'operator precedence & associativity') return 'operator_precedence.md';
  if (name === 'automatic semicolon insertion (asi)') return 'asi.md';
  if (name === 'local / function scope') return 'local_scope.md';
  if (name === 'for...of') return 'for_of.md';
  if (name === 'dom (document object model)') return 'dom.md';
  
  if (name.includes('break / continue')) return 'break_continue.md';
  if (name.includes('property access')) return 'property_access.md';
  if (name.includes('array index')) return 'array_index_length.md';
  if (name.includes('string methods')) return 'string_methods.md';
  if (name.includes('number methods')) return 'number_methods.md';
  if (name.includes('math object')) return 'math_object.md';
  if (name.includes('date object')) return 'date_object.md';
  if (name.includes('call / apply / bind')) return 'call_apply_bind.md';
  if (name.includes('default this binding')) return 'default_this_binding.md';
  if (name.includes('mutating vs non-mutating')) return 'mutating_vs_non_mutating.md';
  if (name.includes('push / pop / shift / unshift')) return 'push_pop_shift_unshift.md';
  if (name.includes('slice / splice')) return 'slice_splice.md';
  if (name.includes('concat / join / split')) return 'concat_join_split.md';
  if (name.includes('indexof / includes / findindex')) return 'indexof_includes_findindex.md';
  if (name.includes('sort / reverse')) return 'sort_reverse.md';
  if (name.includes('flat / flatmap')) return 'flat_flatmap.md';
  if (name.includes('array.from')) return 'array_from_of_isarray.md';
  if (name.includes('window object / bom')) return 'window_bom.md';
  if (name.includes('document object')) return 'document_object.md';
  if (name.includes('queryselectorall')) return 'queryselectorall_nodelist.md';
  if (name.includes('getelementbyid')) return 'getelementbyid_legacy.md';
  if (name.includes('dom manipulation')) return 'dom_manipulation.md';
  if (name.includes('innerhtml / textcontent / innertext')) return 'innerhtml_textcontent.md';
  if (name.includes('classlist')) return 'classlist_attributes.md';
  if (name.includes('event object')) return 'event_object.md';
  if (name.includes('event.target vs event.currenttarget')) return 'event_target_currenttarget.md';
  if (name.includes('web storage')) return 'web_storage.md';
  if (name.includes('timers (settimeout')) return 'timers.md';
  if (name.includes('domcontentloaded')) return 'domcontentloaded_load.md';
  if (name.includes('promise.all')) return 'promise_combinators.md';
  if (name.includes('promise.resolve')) return 'promise_static.md';
  if (name.includes('error object & error types')) return 'error_object.md';
  if (name.includes('try/catch with async/await')) return 'try_catch_async_await.md';
  if (name.includes('for await...of')) return 'for_await_of.md';
  if (name.includes('reference vs value')) return 'reference_vs_value.md';
  if (name.includes('shallow copy vs deep copy')) return 'shallow_vs_deep_copy.md';
  if (name.includes('json / json.stringify / json.parse')) return 'json.md';
  if (name.includes('object.freeze')) return 'object_freeze_seal.md';
  if (name.includes('hasownproperty')) return 'hasownproperty_getprototypeof.md';
  if (name.includes('private class fields')) return 'private_class_fields.md';
  if (name.includes('iterators & iterables')) return 'iterators_iterables.md';
  if (name.includes('named vs default exports')) return 'named_vs_default_exports.md';
  if (name.includes('dynamic import')) return 'dynamic_import.md';
  if (name.includes('commonjs vs es modules')) return 'commonjs_vs_esm.md';
  if (name.includes('specific bundlers')) return 'specific_bundlers.md';
  if (name.includes('tree shaking')) return 'tree_shaking_code_splitting.md';
  if (name.includes('minification')) return 'minification_source_maps.md';
  if (name.includes('linter (eslint)')) return 'linter_formatter.md';
  if (name.includes('semantic versioning')) return 'semver_lockfiles.md';
  if (name.includes('alternative runtimes')) return 'alternative_runtimes.md';
  if (name.includes('browser devtools')) return 'browser_devtools.md';
  if (name.includes('unit testing')) return 'unit_testing.md';
  if (name.includes('framework vs library')) return 'framework_vs_library.md';
  if (name.includes('web apis vs the language')) return 'web_apis_vs_language.md';
  if (name.includes('error handling (try/catch/finally)')) return 'error_handling.md';
  if (name.includes('object.keys')) return 'object_keys.md';
  if (name.includes('object.values')) return 'object_values.md';
  if (name.includes('object.entries')) return 'object_entries.md';
  if (name.includes('console.log')) return 'console_log.md';
  if (name.includes('do...while')) return 'do_while.md';
  // New corrections matching disk
  if (name.includes('object.assign')) return 'object_assign.md';
  if (name.includes('shorthand properties & methods')) return 'shorthand_properties_methods.md';
  if (name.includes('getters & setters')) return 'getters_setters.md';
  if (name.includes('object.create')) return 'object_create.md';
  if (name.includes('static methods & properties')) return 'static_methods_properties.md';
  if (name.includes('logical assignment')) return 'logical_assignment.md';
  if (name.includes('weakmap')) return 'weakmap_weakset.md';
  if (name.includes('regular expressions')) return 'regexp.md';
  if (name.includes('functional programming')) return 'functional_programming.md';
  if (name.includes('design patterns')) return 'design_patterns.md';
  if (name.includes('semantic versioning')) return 'semver_lockfiles.md';
  if (name.includes('commonjs vs es modules')) return 'commonjs_vs_esm.md';
  if (name.includes('alternative runtimes')) return 'alternative_runtimes.md';
  if (name.includes('specific bundlers')) return 'specific_bundlers.md';
  if (name.includes('tree shaking')) return 'tree_shaking_code_splitting.md';
  if (name.includes('minification')) return 'minification_source_maps.md';
  if (name.includes('linter (eslint)')) return 'linter_formatter.md';
  if (name.includes('browser devtools')) return 'browser_devtools.md';
  if (name.includes('unit testing')) return 'unit_testing.md';
  if (name.includes('framework vs library')) return 'framework_vs_library.md';
  if (name.includes('web apis')) return 'web_apis_vs_language.md';
  if (name.includes('for...in')) return 'for_in.md';
  if (name.includes('document.queryselector()')) return 'document_queryselector.md';
  if (name.includes('event.preventdefault()')) return 'event_preventdefault.md';
  if (name.includes('event.stoppropagation()')) return 'event_stoppropagation.md';
  if (name.includes('modules (import/export)')) return 'modules.md';
  if (name.includes('node.js')) return 'node_js.md';
  if (name.includes('spread syntax')) return 'spread_syntax.md';
  if (name.includes('rest parameter')) return 'rest_parameter.md';
  if (name.includes('optional chaining')) return 'optional_chaining.md';
  if (name.includes('strict mode')) return 'strict_mode.md';
  if (name.includes('generator')) return 'generator.md';
  if (name.includes('then') && name.includes('catch')) return 'then_catch.md';
  if (name.includes('foreach')) return 'for_each.md';
  if (name.includes('package.json')) return 'package_json.md';

  // Standard clean rule
  name = name.replace(/[`\[\]!\?\(\)<]/g, '');
  name = name.replace(/[\s\-\/]+/g, '_');
  name = name.replace(/^_+|_+$/g, '');
  return name + '.md';
}

function main() {
  if (!fs.existsSync(metaFile)) {
    console.error(`Meta file not found: ${metaFile}`);
    process.exit(1);
  }

  const metaContent = fs.readFileSync(metaFile, 'utf8');
  const lines = metaContent.split('\n');
  
  // Find all terms in the table: | # | Term | Description |
  const termRegex = /^\|\s*(\d+)\s*\|\s*\*\*(.*?)\*\*\s*\|\s*(.*?)\s*\|/;
  
  const parsedTerms = [];
  for (const line of lines) {
    const match = line.match(termRegex);
    if (match) {
      const num = parseInt(match[1], 10);
      const name = match[2].trim();
      parsedTerms.push({ num, name });
    }
  }

  console.log(`Parsed ${parsedTerms.length} terms from master list.`);

  // Get all existing files in terms directory
  const files = getFiles(termsDir);
  const fileMap = new Map();
  for (const file of files) {
    fileMap.set(path.basename(file), file);
  }

  let updatedCount = 0;
  let missingFilesCount = 0;

  for (const term of parsedTerms) {
    const targetFilename = termToFilename(term.name);
    const fullPath = fileMap.get(targetFilename);

    if (!fullPath) {
      console.log(`Missing file for term #${term.num}: **${term.name}** -> (expected filename: ${targetFilename})`);
      missingFilesCount++;
      continue;
    }

    let fileContent = fs.readFileSync(fullPath, 'utf8');
    const firstLineMatch = fileContent.match(/^# Term #\d+:\s*(.*)/);

    if (firstLineMatch) {
      const cleanTermName = term.name.replace(/`/g, '').trim();
      const expectedHeader = `# Term #${term.num}: ${cleanTermName}`;
      const actualHeader = firstLineMatch[0];

      if (actualHeader !== expectedHeader) {
        // Replace the first line
        const lines = fileContent.split('\n');
        lines[0] = expectedHeader;
        fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
        console.log(`Updated header in ${path.relative(process.cwd(), fullPath)}: ${actualHeader} -> ${expectedHeader}`);
        updatedCount++;
      }
    } else {
      console.warn(`File ${path.relative(process.cwd(), fullPath)} does not have a standard Term header on line 1.`);
    }
  }

  console.log(`\nExecution complete. Updated ${updatedCount} headers. ${missingFilesCount} files are expected but do not yet exist.`);
}

main();
