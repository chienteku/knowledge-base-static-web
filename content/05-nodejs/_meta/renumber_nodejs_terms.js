const fs = require('fs');
const path = require('path');

const metaFile = path.join(__dirname, 'nodejs_terms_zero_to_hero.md');
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
  
  if (name.includes('node.js (runtime environment)')) return 'nodejs.md';
  if (name.includes('v8 javascript engine')) return 'v8_engine.md';
  if (name.includes('single-threaded architecture')) return 'single_threaded.md';
  if (name.includes('the call stack')) return 'call_stack.md';
  if (name.includes('non-blocking i/o')) return 'non_blocking_io.md';
  if (name.includes('the event loop & libuv')) return 'event_loop.md';
  if (name.includes('the thread pool')) return 'thread_pool.md';
  if (name.includes('cpu-bound vs i/o-bound') || name.includes('cpu_vs_io')) return 'cpu_vs_io.md';
  if (name.includes('blocking the event loop')) return 'blocking_event_loop.md';
  
  if (name.includes('global objects')) return 'global_objects.md';
  if (name.includes('the process object')) return 'process_object.md';
  if (name.includes('the fs module')) return 'fs_module.md';
  if (name.includes('the path module')) return 'path_module.md';
  if (name.includes('the http module') && !name.includes('deep dive')) return 'http_module.md';
  if (name.includes('the crypto module')) return 'crypto_module.md';
  // Level 2 new ones
  if (name.includes('the node.js repl')) return 'repl.md';
  if (name.includes('stdin / stdout / stderr')) return 'standard_streams.md';
  if (name.includes('the os & util modules')) return 'os_util_modules.md';
  if (name.includes('the events module')) return 'events_module.md';

  if (name.includes('commonjs')) return 'commonjs.md';
  if (name.includes('es modules')) return 'es_modules.md';
  if (name.includes('module resolution')) return 'module_resolution.md';
  if (name.includes('circular dependencies')) return 'circular_dependencies.md';
  if (name.includes('built-in vs external modules')) return 'module_types.md';
  
  if (name.includes('npm (node package manager)')) return 'npm.md';
  if (name.includes('package.json')) return 'package_json.md';
  if (name.includes('node_modules')) return 'node_modules.md';
  if (name.includes('semantic versioning')) return 'semantic_versioning.md';
  if (name.includes('package-lock.json')) return 'package_lock.md';
  
  if (name.includes('callbacks & callback hell')) return 'callbacks.md';
  if (name.includes('promisification')) return 'promisification.md';
  if (name.includes('async / await in node')) return 'async_await.md';
  if (name.includes('async error handling')) return 'async_error_handling.md';
  if (name.includes('unhandled promise rejections')) return 'unhandled_rejections.md';
  if (name.includes('event emitter')) return 'event_emitter.md';
  if (name.includes('microtasks vs macrotasks')) return 'microtasks_macrotasks.md';
  if (name.includes('nexttick() vs setimmediate()') || name.includes('nexttick')) return 'nexttick_setimmediate.md';
  
  if (name.includes('buffers')) return 'buffers.md';
  if (name.includes('character encoding & buffer')) return 'buffer_encoding.md';
  if (name.includes('streams (general concept)')) return 'streams.md';
  if (name.includes('readable & writable streams')) return 'readable_writable.md';
  if (name.includes('duplex & transform streams')) return 'duplex_transform_streams.md';
  if (name.includes('piping')) return 'piping.md';
  if (name.includes('backpressure')) return 'backpressure.md';
  if (name.includes('data chunks')) return 'chunks.md';
  
  if (name.includes('the http module deep dive')) return 'http_deep_dive.md';
  if (name.includes('body parsing')) return 'body_parsing.md';
  if (name.includes('serving static files')) return 'static_files.md';
  if (name.includes('express.js')) return 'express_js.md';
  if (name.includes('routing')) return 'routing.md';
  if (name.includes('route parameters & query')) return 'route_parameters.md';
  if (name.includes('the middleware chain & next')) return 'middleware_chain.md';
  if (name.includes('error handling middleware')) return 'error_handling_middleware.md';
  if (name.includes('middleware')) return 'middleware.md';
  if (name.includes('the req & res objects')) return 'req_res.md';
  
  if (name.includes('sql vs nosql')) return 'sql_vs_nosql.md';
  if (name.includes('orms & odms')) return 'orms_odms.md';
  if (name.includes('mongoose')) return 'mongoose.md';
  if (name.includes('prisma / sequelize')) return 'prisma_sequelize.md';
  if (name.includes('connection pooling')) return 'connection_pools.md';
  if (name.includes('migrations')) return 'migrations.md';
  if (name.includes('database transactions')) return 'db_transactions.md';
  if (name.includes('sql injection')) return 'sql_injection.md';
  if (name.includes('parameterized queries')) return 'parameterized_queries.md';
  
  if (name.includes('rest api design')) return 'rest_api.md';
  if (name.includes('api versioning')) return 'api_versioning.md';
  if (name.includes('http status codes')) return 'status_codes.md';
  if (name.includes('cors')) return 'cors.md';
  if (name.includes('pagination')) return 'pagination.md';
  if (name.includes('rate limiting')) return 'rate_limiting.md';
  if (name.includes('mvc pattern')) return 'mvc_pattern.md';
  if (name.includes('controllers & services')) return 'controllers_services.md';
  if (name.includes('input validation')) return 'input_validation.md';
  
  if (name.includes('bcrypt')) return 'bcrypt.md';
  if (name.includes('jwt')) return 'jwt.md';
  if (name.includes('environment variables')) return 'env_vars.md';
  if (name.includes('child processes')) return 'child_processes.md';
  if (name.includes('worker threads')) return 'worker_threads.md';
  if (name.includes('the cluster module')) return 'cluster_module.md';
  if (name.includes('pm2')) return 'pm2.md';
  if (name.includes('load balancing')) return 'load_balancing.md';
  if (name.includes('reverse proxy')) return 'reverse_proxy.md';
  if (name.includes('docker')) return 'docker.md';
  if (name.includes('graceful shutdown')) return 'graceful_shutdown.md';
  if (name.includes('logging & monitoring')) return 'logging_monitoring.md';
  if (name.includes('memory leaks')) return 'memory_leaks.md';

  name = name.replace(/[`\[\]!\?\(\)<]/g, '');
  name = name.replace(/[\s\-\/]+/g, '_');
  name = name.replace(/&/g, 'and');
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
  
  const termRegex = /^(\d+)\.\s*(.*)/;
  
  const parsedTerms = [];
  for (const line of lines) {
    const match = line.match(termRegex);
    if (match) {
      const num = parseInt(match[1], 10);
      const name = match[2].trim();
      parsedTerms.push({ num, name });
    }
  }

  console.log(`Parsed ${parsedTerms.length} terms from Node.js master list.`);

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
