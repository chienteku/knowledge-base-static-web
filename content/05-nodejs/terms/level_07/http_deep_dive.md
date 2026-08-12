# The http Module Deep Dive

> **Level 7 — Web Servers & APIs**
> The low-level, built-in Node.js module responsible for listening to network ports and handling the raw TCP/IP data of HTTP requests.

---

## 1. Prerequisites
- [The http Module](../level_02/http_module.md) — The basic introduction to this core module.
- [Event Emitter](../level_05/event_emitter.md) — The `http.Server` class is actually just an Event Emitter!

---

## 2. Term Category

**Node.js Core Module (Node.js Only `, which is a high-level client, not a server).)**: The http Module Deep Dive is a fundamental concept in this technology stack. **Level 7 — Web Servers & APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Before Node.js, if you wanted to host a website, you had to install massive external software like Apache or NGINX. Those programs listened to the internet, and when a request came in, they forwarded it to your PHP or Ruby code.
Node.js changed the paradigm. Node.js *is* the web server. The `http` module allows your JavaScript code to talk directly to the computer's network card, meaning you don't need Apache or NGINX to run a basic server!

### (2) How it works under the hood
When you run `http.createServer()`, Node.js creates a long-running process that binds to a specific Port on your computer (e.g., 3000).
It sits in an infinite loop, acting as an `EventEmitter`. When a user's browser sends an HTTP packet to Port 3000, the server emits a `'request'` event.
Your callback function `(req, res) => {}` is actually just the listener for that `'request'` event!

### (3) The Pain of Raw `http`
While powerful, the raw `http` module is extremely tedious to use for modern APIs.
Because it is so low-level, it doesn't understand "JSON" or "URL Parameters." If a user sends a POST request with JSON data, the `http` module just gives you a raw stream of binary Buffers. You have to manually concatenate the chunks, convert them to a string, and parse the JSON yourself!
Because of this pain, nobody uses raw `http` in production. They use frameworks like Express.js built *on top* of the `http` module.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to close the response

**The mistake:** A developer writes a server that does `console.log(req.url)` but forgets to call `res.end()`.

**Why it's wrong:** The user's browser will show a spinning loading wheel forever until it eventually times out. The `http` module keeps the network socket open, waiting for you to finish sending data. If you don't call `res.end()`, the server essentially ghosts the user.
**Golden Rule:** Every single HTTP request must eventually hit a `res.end()` (or a framework equivalent like `res.send()`).

---



### Mistake 2: Confusing HTTP Request Headers (`req.headers`) Case Sensitivity

**The mistake:** Accessing `req.headers['Content-Type']` expecting exact uppercase key matching.

**Why it's wrong:** Node.js automatically lowercases ALL incoming HTTP request header keys (`req.headers['content-type']`) per HTTP standards.

*Incorrect:*
```javascript
const type = req.headers['Content-Type']; // ❌ undefined! Key is lowercased!
```

*Fix:*
```javascript
const type = req.headers['content-type']; // Access using lowercase key
```

### Mistake 3: Failing to Handle HTTP Keep-Alive Connection Timeouts

**The mistake:** Setting server keep-alive timeouts lower than reverse proxy (Nginx / ALB) timeouts.

**Why it's wrong:** If Node.js closes a keep-alive connection right as Nginx sends a request, Nginx receives a 502 Bad Gateway error (`ECONNRESET`). Node's `keepAliveTimeout` must exceed upstream proxy timeouts.

*Incorrect:*
```javascript
// Server keepAliveTimeout default (5s) lower than AWS ALB timeout (60s)
```

*Fix:*
```javascript
const server = app.listen(3000);
server.keepAliveTimeout = 65000; // Exceed proxy 60s timeout
```

## 5. Practice Exercises

### Exercise 1: Raw Node.js HTTP/1.1 Connection Keep-Alive Inspector

**Scenario:** Inspects HTTP/1.1 request headers to determine whether TCP socket connections should be kept alive (`Connection: keep-alive`) or closed (`Connection: close`).

**Requirements:**
1. Write evaluateKeepAlive(reqHeaders, httpVersion).
2. Check `Connection` header value.
3. Default to keep-alive for HTTP/1.1; default to close for HTTP/1.0.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function evaluateKeepAlive(reqHeaders = {}, httpVersion = "1.1") {
>   const connectionHeader = (reqHeaders["connection"] || reqHeaders["Connection"] || "").toLowerCase();
>
>   if (connectionHeader === "close") {
>     return { shouldKeepAlive: false, header: "close" };
>   }
>
>   if (connectionHeader === "keep-alive") {
>     return { shouldKeepAlive: true, header: "keep-alive" };
>   }
>
>   const isHttp11 = httpVersion.startsWith("1.1");
>   return {
>     shouldKeepAlive: isHttp11,
>     header: isHttp11 ? "keep-alive" : "close"
>   };
> }
>
> // Verification tests
> console.assert(evaluateKeepAlive({}, "1.1").shouldKeepAlive === true, "Test 1 Failed: HTTP/1.1 defaults to keep-alive");
> console.assert(evaluateKeepAlive({}, "1.0").shouldKeepAlive === false, "Test 2 Failed: HTTP/1.0 defaults to close");
> console.assert(evaluateKeepAlive({ "Connection": "close" }, "1.1").shouldKeepAlive === false, "Test 3 Failed: Explicit close");
> ```
>
> #### Technical Explanation
>
> 1. **HTTP Persistent Connections (Keep-Alive)**: Reuses single TCP socket connection for multiple HTTP requests, eliminating TCP 3-way handshake overhead.
> 2. **HTTP/1.1 Defaults**: HTTP/1.1 defaults to persistent connections unless `Connection: close` is specified.
> 3. **Socket Pooling**: Node.js HTTP client uses `http.Agent` to manage persistent socket pools.
> 
---

### Exercise 2: Chunked Transfer Encoding Stream Writer

**Scenario:** Constructs a raw HTTP response emitting `Transfer-Encoding: chunked` headers to stream dynamic content without declaring `Content-Length`.

**Requirements:**
1. Write setupChunkedHttpResponse(resMock).
2. Set Transfer-Encoding: chunked.
3. Stream chunks asynchronously.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function setupChunkedHttpResponse(resMock) {
>   resMock.setHeader("Transfer-Encoding", "chunked");
>   resMock.setHeader("Content-Type", "text/plain");
>
>   return {
>     writeChunk(dataStr) {
>       resMock.write(dataStr);
>     },
>     finish() {
>       resMock.end();
>     }
>   };
> }
>
> // Verification tests
> const headers = {};
> let body = "";
> const mockRes = {
>   setHeader: (k, v) => { headers[k] = v; },
>   write: (chunk) => { body += chunk; },
>   end: () => {}
> };
>
> const writer = setupChunkedHttpResponse(mockRes);
> writer.writeChunk("Chunk 1
> ");
> writer.writeChunk("Chunk 2
> ");
> writer.finish();
>
> console.assert(headers["Transfer-Encoding"] === "chunked", "Test 1 Failed");
> console.assert(body === "Chunk 1
> Chunk 2
> ", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Transfer-Encoding: chunked**: Allows streaming responses when total payload size is unknown at response start time.
> 2. **Dynamic Streaming**: Useful for Server-Sent Events (SSE), video streaming, and dynamic DB queries.
> 3. **Content-Length Mutual Exclusivity**: HTTP spec forbids sending `Content-Length` header alongside `Transfer-Encoding: chunked`.
> 
---

### Exercise 3: Custom HTTP Method Router & Status Code Mapping

**Scenario:** A lightweight Node.js HTTP server router handles OPTIONS preflight requests and method routing.

**Requirements:**
1. Write routeHttpMethod(reqMethod, reqPath, handlersMap).
2. Support OPTIONS CORS preflight.
3. Return 405 Method Not Allowed if route exists but method mismatches.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function routeHttpMethod(reqMethod, reqPath, handlersMap = {}) {
>   const method = (reqMethod || "GET").toUpperCase();
>
>   if (method === "OPTIONS") {
>     return { status: 204, body: null, isPreflight: true };
>   }
>
>   const pathRoutes = handlersMap[reqPath];
>   if (!pathRoutes) {
>     return { status: 404, body: { error: "NOT_FOUND" } };
>   }
>
>   const handler = pathRoutes[method];
>   if (!handler) {
>     return { status: 405, body: { error: "METHOD_NOT_ALLOWED" } };
>   }
>
>   return { status: 200, body: handler() };
> }
>
> // Verification tests
> const routes = {
>   "/users": { GET: () => [{ id: 1 }] }
> };
>
> console.assert(routeHttpMethod("OPTIONS", "/users").status === 204, "Test 1 Failed: CORS Preflight 204");
> console.assert(routeHttpMethod("POST", "/users", routes).status === 405, "Test 2 Failed: POST not allowed on /users");
> console.assert(routeHttpMethod("GET", "/users", routes).status === 200, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **HTTP Options Method**: Browsers send OPTIONS preflight requests to check CORS permission before sending complex cross-origin requests.
> 2. **405 Method Not Allowed**: HTTP status code indicating requested endpoint exists but doesn't support target HTTP method.
> 3. **REST Semantics**: RESTful APIs map GET (read), POST (create), PUT (update), DELETE (remove).
## 6. Related Terms
- [Express.js](express_js.md) — The framework that hides the ugly parts of the `http` module.
- [The req & res Objects](req_res.md) — What the `http` module passes into your callback.

---

## 7. Key Takeaways
- The **`http` module** allows Node.js to act as its own web server without needing Apache or NGINX.
- It is an `EventEmitter` that listens to network ports and emits `'request'` events.
- It is too low-level for modern API development, requiring manual Buffer parsing and massive `if/else` routing.
