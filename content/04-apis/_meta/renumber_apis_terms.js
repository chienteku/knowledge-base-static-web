const fs = require('fs');
const path = require('path');

const metaFile = path.join(__dirname, 'apis_terms_zero_to_hero.md');
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
  if (name.includes('client-server model')) return 'client_server_model.md';
  if (name.includes('http / https')) return 'http_https.md';
  if (name.includes('url / uri')) return 'url_uri.md';
  if (name.includes('request & response lifecycle')) return 'request_response.md';
  if (name.includes('json (javascript object notation)')) return 'json.md';
  
  if (name.includes('http methods (verbs)')) return 'http_methods.md';
  if (name.includes('http status codes')) return 'status_codes.md';
  if (name.includes('request body & payloads')) return 'request_body.md';
  if (name.includes('query parameters & path variables')) return 'query_params.md';
  
  if (name.includes('api (application programming interface)')) return 'api.md';
  if (name.includes('rest (representational state transfer)')) return 'rest.md';
  if (name.includes('endpoints & resources')) return 'endpoints_resources.md';
  if (name.includes('crud operations')) return 'crud.md';
  
  if (name.includes('basic & bearer authentication')) return 'basic_bearer_auth.md';
  if (name.includes('jwt (json web tokens)')) return 'jwt.md';
  if (name.includes('oauth 2.0')) return 'oauth.md';
  if (name.includes('cors (cross-origin resource sharing)')) return 'cors.md';
  
  if (name.includes('the fetch() api')) return 'fetch.md';
  if (name.includes('promises (in the context of networks)')) return 'promises.md';
  if (name.includes('async / await') || name.includes('async/await')) return 'async_await.md';
  if (name.includes('error handling (try / catch)') || name.includes('error handling (try/catch)')) return 'error_handling.md';
  if (name.includes('the response object')) return 'response_object.md';
  
  if (name.includes('pagination (offset vs. cursor)')) return 'pagination.md';
  if (name.includes('rate limiting (429 too many requests)')) return 'rate_limiting.md';
  if (name.includes('caching (etag, cache-control)')) return 'caching.md';
  
  if (name.includes('serialization & deserialization')) return 'serialization.md';
  if (name.includes('json methods (parse / stringify)')) return 'json_methods.md';
  if (name.includes('graphql (the rest alternative)')) return 'graphql.md';
  
  if (name.includes('server-sent events (sse)')) return 'sse.md';
  if (name.includes('polling vs long polling')) return 'polling.md';
  if (name.includes('the websocket api (client-side)')) return 'websocket_api.md';
  if (name.includes('socket.io (ecosystem tool)')) return 'socket_io.md';
  
  if (name.includes('base64 encoding')) return 'base64.md';
  if (name.includes('localstorage &') || name.includes('localstorage')) return 'web_storage.md';
  
  if (name.includes('postman / insomnia')) return 'api_clients.md';
  if (name.includes('swagger / openapi')) return 'openapi.md';
  if (name.includes('devtools network')) return 'network_tab.md';
  if (name.includes('api contract')) return 'api_contract.md';
  if (name.includes('sdk / client')) return 'sdk.md';
  if (name.includes('api versioning')) return 'versioning.md';
  if (name.includes('deprecation & sunsetting')) return 'deprecation_sunsetting.md';
  if (name.includes('mocking apis')) return 'mocking.md';
  if (name.includes('microservices vs monolith')) return 'microservices_monolith.md';
  if (name.includes('api gateway')) return 'api_gateway.md';
  if (name.includes('load balancing')) return 'load_balancing.md';
  if (name.includes('grpc (remote procedure call)')) return 'grpc.md';
  if (name.includes('protocol buffers')) return 'protocol_buffers.md';
  if (name.includes('soap & xml-rpc')) return 'soap_xml_rpc.md';

  // Level 9 new ones
  if (name.includes('storage serialization')) return 'storage_serialization.md';
  if (name.includes('cookie attributes')) return 'cookie_attributes.md';
  if (name.includes('storage limits')) return 'storage_limits.md';
  if (name.includes('offline-first')) return 'offline_first.md';

  // Level 8 new ones
  if (name.includes('websocket handshake')) return 'websocket_handshake.md';
  if (name.includes('heartbeat')) return 'heartbeat_ping_pong.md';
  if (name.includes('reconnection & backoff')) return 'reconnection_backoff.md';
  if (name.includes('pub/sub & channels')) return 'pub_sub_channels.md';

  // Level 7 new ones
  if (name.includes('deserialization / parsing')) return 'deserialization.md';
  if (name.includes('character encoding')) return 'character_encoding.md';
  if (name.includes('binary vs text')) return 'binary_vs_text_formats.md';
  if (name.includes('blob & arraybuffer')) return 'blob_arraybuffer.md';
  if (name.includes('over-fetching vs under-fetching')) return 'overfetching_underfetching.md';

  // Level 6 new ones
  if (name.includes('bulk / batch')) return 'batch_requests.md';
  if (name.includes('circuit breaker')) return 'circuit_breaker.md';
  if (name.includes('idempotency keys')) return 'idempotency_keys.md';
  if (name.includes('cache invalidation')) return 'cache_invalidation.md';

  // Level 5 new ones
  if (name.includes('xmlhttprequest')) return 'xmlhttprequest_ajax.md';
  if (name.includes('promise.all')) return 'promise_all.md';
  if (name.includes('request timeout')) return 'request_timeout.md';
  if (name.includes('abortcontroller')) return 'abortcontroller.md';
  if (name.includes('retry & exponential')) return 'retry_backoff.md';
  if (name.includes('formdata')) return 'formdata.md';
  if (name.includes('cors errors')) return 'cors_errors.md';

  // Level 4 new ones
  if (name.includes('secrets & environment')) return 'secrets_env.md';
  if (name.includes('session vs token')) return 'session_vs_token_auth.md';
  if (name.includes('access token vs refresh') || name.includes('access/refresh token')) return 'access_refresh_tokens.md';
  if (name.includes('oauth scopes')) return 'oauth_scopes.md';
  if (name.includes('same-origin')) return 'same_origin_policy.md';
  if (name.includes('preflight request')) return 'preflight_request.md';
  if (name.includes('csrf')) return 'csrf.md';
  if (name.includes('xss')) return 'xss.md';

  // Level 3 new ones
  if (name.includes('resource naming')) return 'resource_naming.md';
  if (name.includes('hateoas')) return 'hateoas.md';
  if (name.includes('richardson maturity')) return 'richardson_maturity_model.md';

  // Level 2 new ones
  if (name.includes('idempotent vs safe')) return 'idempotent_vs_safe_methods.md';
  if (name.includes('content-type & mime')) return 'content_type.md';
  if (name.includes('content negotiation')) return 'content_negotiation.md';
  if (name.includes('url encoding')) return 'url_encoding.md';

  // Level 1 new ones
  if (name.includes('ip address & port') || name.includes('ip address')) return 'ip_address_port.md';
  if (name.includes('dns (domain name system)') || name.includes('dns')) return 'dns.md';
  if (name.includes('tcp/ip (high-level)') || name.includes('tcp/ip')) return 'tcp_ip.md';
  if (name.includes('ssl/tls & the handshake') || name.includes('ssl/tls')) return 'ssl_tls_handshake.md';
  if (name.includes('latency & bandwidth')) return 'latency_bandwidth.md';

  // Standard clean rule
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

  console.log(`Parsed ${parsedTerms.length} terms from APIs master list.`);

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
