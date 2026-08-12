# The http Module

> **Level 2 — Core Modules & Globals**
> The foundational networking module built into Node.js that gives it the power to spin up a web server and listen for incoming network traffic.

---

## 1. Prerequisites
- [HTTP / HTTPS](../../../04-apis/terms/level_01/http_https.md) — The protocol this module implements.
- [Node.js (Runtime Environment)](../level_01/nodejs.md) — This module is the primary reason Node.js became famous.

---

## 2. Term Category

**Node.js Core Module / Networking (Backend Infrastructure)**: The http Module is a fundamental concept in this technology stack. **Level 2 — Core Modules & Globals**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Before Node.js, if you wanted to build a web server in PHP or Python, the language itself didn't handle the incoming network traffic. You had to install massive, complex third-party software like **Apache** or **Nginx** to act as the web server, and that software would pass the traffic to your PHP script.
Ryan Dahl wanted Node.js to be fully self-contained. He built the **`http`** module directly into the core of Node.js. With just 5 lines of code, Node.js itself becomes the web server, directly listening to Port 80 on the computer. No Apache required!

### (2) The "Hello World" of Node.js
Here is the literal code required to spin up a fully functioning web server using the native `http` module:
```javascript
const http = require('http');

// 1. Create the server
const server = http.createServer((request, response) => {
  // 2. This callback fires every time someone visits the IP address
  console.log(`Someone visited: ${request.url}`);
  
  // 3. Send a response back to the browser
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Hello, World!');
});

// 4. Tell the server to start listening on Port 3000
server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
```

### (3) Why does nobody use this directly?
While the `http` module is incredibly powerful, it is also incredibly "low-level" and "bare-bones." 
If you want to build a real API with hundreds of routes (e.g., `GET /users`, `POST /orders`), parsing the URL, parsing the JSON body, and setting the correct headers manually using the raw `http` module takes hundreds of lines of complex code.
Because of this, modern developers almost never use the `http` module directly. Instead, they install **Express.js**, which is a third-party framework built *on top* of the `http` module to make routing easy.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `response.end()`

**The mistake:** A developer writes the `createServer` callback but forgets to call `response.end()`.

**Why it's wrong:** The browser sends the request and sits there waiting for an answer. Because you never called `end()`, Node.js keeps the connection open indefinitely, waiting for you to send more data. The user's browser will spin and spin until it eventually crashes with a "Timeout" error.
**Golden Rule:** Every single HTTP request MUST be explicitly ended by the server.

---



### Mistake 2: Forgetting to End Response Streams (`res.end()`)

**The mistake:** Writing `res.write('Hello');` inside `http.createServer()` without calling `res.end()`.

**Why it's wrong:** HTTP responses are writable streams. Failing to call `res.end()` leaves the client connection hanging indefinitely until request timeout.

*Incorrect:*
```javascript
const server = http.createServer((req, res) => {
  res.write('Hello'); // ❌ Client hangs waiting for response to close!
});
```

*Fix:*
```javascript
const server = http.createServer((req, res) => {
  res.end('Hello'); // Flushes buffer and closes HTTP response stream
});
```

### Mistake 3: Setting HTTP Response Headers After Body Data Has Been Sent (`ERR_HTTP_HEADERS_SENT`)

**The mistake:** Calling `res.setHeader()` or `res.writeHead()` after calling `res.write()` or `res.end()`.

**Why it's wrong:** Once response headers are flushed to the network socket, they cannot be modified. Attempting to write headers afterwards throws `ERR_HTTP_HEADERS_SENT`.

*Incorrect:*
```javascript
res.write('Data');
res.setHeader('Content-Type', 'application/json'); // ❌ ERR_HTTP_HEADERS_SENT!
```

*Fix:*
```javascript
res.setHeader('Content-Type', 'application/json');
res.write(JSON.stringify({ status: 'ok' }));
res.end();
```

## 5. Practice Exercises

### Exercise 1: Raw HTTP Server with JSON Router

**Scenario:** A lightweight HTTP API server parses request paths and HTTP methods to route requests without external frameworks like Express.

**Requirements:**
1. Write handleHttpRequest(req, res, routesMap).
2. Extract method and path.
3. Return JSON response with status codes.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleHttpRequest(req, res, routesMap = {}) {
>   const method = (req.method || "GET").toUpperCase();
>   const urlPath = req.url || "/";
>   const routeKey = `${method}:${urlPath}`;
>
>   res.setHeader("Content-Type", "application/json");
>
>   if (routesMap[routeKey]) {
>     const handler = routesMap[routeKey];
>     const data = handler(req);
>     res.statusCode = 200;
>     res.end(JSON.stringify({ success: true, data }));
>   } else {
>     res.statusCode = 404;
>     res.end(JSON.stringify({ success: false, error: "NOT_FOUND" }));
>   }
> }
>
> // Verification tests
> let responseCode = 0;
> let responseBody = "";
>
> const mockReq = { method: "GET", url: "/health" };
> const mockRes = {
>   setHeader: () => {},
>   set statusCode(code) { responseCode = code; },
>   end: (body) => { responseBody = body; }
> };
>
> const routes = {
>   "GET:/health": () => ({ status: "UP" })
> };
>
> handleHttpRequest(mockReq, mockRes, routes);
> console.assert(responseCode === 200, "Test 1 Failed");
> console.assert(JSON.parse(responseBody).data.status === "UP", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Node.js `http` Core Module**: Provides `http.createServer((req, res) => {})` handling low-level TCP connection parsing.
> 2. **IncomingMessage & ServerResponse**: `req` is readable stream (`http.IncomingMessage`); `res` is writable stream (`http.ServerResponse`).
> 3. **Framework Foundations**: Express, Fastify, and Koa wrap the native `http` module under the hood.
> 
---

### Exercise 2: HTTP Client Request Agent with Timeout

**Scenario:** An outbound HTTP client wraps `http.request()` with custom timeouts and error handling.

**Requirements:**
1. Write makeHttpRequest(options, postData, mockHttp).
2. Construct request.
3. Resolve response payload string on completion.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function makeHttpRequest(options, postData, mockHttp) {
>   const httpLib = mockHttp || require("http");
>
>   return new Promise((resolve, reject) => {
>     const req = httpLib.request(options, (res) => {
>       let data = "";
>       res.on("data", (chunk) => { data += chunk; });
>       res.on("end", () => {
>         resolve({ statusCode: res.statusCode, body: data });
>       });
>     });
>
>     req.on("error", (err) => reject(err));
>
>     if (postData) {
>       req.write(typeof postData === "object" ? JSON.stringify(postData) : postData);
>     }
>     req.end();
>   });
> }
>
> // Verification tests
> const mockHttp = {
>   request: (opts, cb) => {
>     const resMock = {
>       statusCode: 201,
>       on: (evt, fn) => {
>         if (evt === "data") fn('{"id":42}');
>         if (evt === "end") fn();
>       }
>     };
>     cb(resMock);
>     return { on: () => {}, write: () => {}, end: () => {} };
>   }
> };
>
> makeHttpRequest({ method: "POST", host: "api.com" }, { name: "test" }, mockHttp).then(res => {
>   console.assert(res.statusCode === 201, "Test 1 Failed");
>   console.assert(JSON.parse(res.body).id === 42, "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Outbound HTTP Requests**: `http.request` creates outbound HTTP requests to external microservices.
> 2. **Stream Chunk Buffering**: HTTP response bodies arrive as multiple data chunks that must be buffered.
> 3. **End Signal Required**: `req.end()` MUST be called to flush buffers and complete TCP connection setup.
> 
---

### Exercise 3: Security Headers HTTP Middleware Decorator

**Scenario:** Attaches essential HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`) to outbound `http.ServerResponse` objects.

**Requirements:**
1. Write attachSecurityHeaders(res).
2. Set security headers.
3. Set CORS headers.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function attachSecurityHeaders(res) {
>   if (!res || typeof res.setHeader !== "function") {
>     throw new TypeError("Invalid ServerResponse object");
>   }
>
>   res.setHeader("X-Content-Type-Options", "nosniff");
>   res.setHeader("X-Frame-Options", "DENY");
>   res.setHeader("X-XSS-Protection", "1; mode=block");
>   res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
>
>   return res;
> }
>
> // Verification tests
> const headers = {};
> const mockRes = { setHeader: (k, v) => { headers[k] = v; } };
>
> attachSecurityHeaders(mockRes);
> console.assert(headers["X-Content-Type-Options"] === "nosniff", "Test 1 Failed");
> console.assert(headers["X-Frame-Options"] === "DENY", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **HTTP Response Headers**: `res.setHeader(name, value)` configures HTTP response headers before `res.writeHead()` or `res.end()`.
> 2. **Security Header Protections**: Prevents MIME-sniffing attacks, clickjacking (X-Frame-Options), and enforces HTTPS (HSTS).
> 3. **Header Modification Order**: Headers cannot be modified after response headers have been sent to the client (`res.headersSent`).
## 6. Related Terms
- [Express.js](../level_07/express_js.md) — The famous third-party framework that abstracts the native `http` module to make web development significantly easier.
- [Event Emitter](../level_05/event_emitter.md) — Related concept: Event Emitter.
- [Serving Static Files (express.static)](../level_07/static_files.md) — Related concept: Serving Static Files (express.static).
- [The req & res Objects](../level_07/req_res.md) — Request & Response objects.
- [The events Module](events_module.md) — EventEmitter in HTTP server.

---

## 7. Key Takeaways
- The **`http`** module allows Node.js to act as its own Web Server without needing Apache or Nginx.
- It provides `request` and `response` objects to handle traffic.
- Every request must be finalized with `response.end()` or the client will hang indefinitely.
- It is considered too "low-level" for modern development, so developers use Express.js instead.
