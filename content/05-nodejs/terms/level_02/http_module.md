# The http Module

> **Level 2 — Core Modules & Globals**
> The foundational networking module built into Node.js that gives it the power to spin up a web server and listen for incoming network traffic.

---

## 1. Prerequisites
- http_https — The protocol this module implements.
- [Node.js (Runtime Environment)](../level_01/nodejs.md) — This module is the primary reason Node.js became famous.
---

## 2. Term Category
- **Node.js Core Module / Networking**

---

## 3. Environment Context
- **Backend Infrastructure**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Port

**Problem:** In the example code above, we ran `server.listen(3000)`. What is a Port, and why do we need it?

**Expected output:**
> [!check]- Answer
> ```text
> A Port is like an "apartment number" for an IP address. 
> If your server's IP address (the street address) receives network traffic, the computer needs to know *which program* should handle it. Because Node.js is listening on Port 3000, any traffic directed to `123.45.67.89:3000` is routed directly to your Node.js application.
> ```
> - Does a computer run more than one program at a time? How does it differentiate traffic meant for an email server vs a web server?

---



### Exercise 2: Creating Basic HTTP Server

**Problem:** Create an HTTP server using `http.createServer()` returning status 200 and text `'OK'` on port 8080.

**Expected output:**
> [!check]- Answer
> ```text
> http.createServer((req, res) => { res.writeHead(200, {'Content-Type': 'text/plain'}); res.end('OK'); }).listen(8080);
> ```
> ```javascript
> const http = require('http');
> const server = http.createServer((req, res) => {
>   res.writeHead(200, { 'Content-Type': 'text/plain' });
>   res.end('OK');
> });
> server.listen(8080);
> ```
>
> **Explanation:** `http.createServer` instantiates a basic native HTTP web server listening on specified port.

---

### Exercise 3: Reading HTTP Request Method & URL

**Problem:** Write code inside request handler to return 404 if `req.method !== 'GET'` or `req.url !== '/api'`. 

**Expected output:**
> [!check]- Answer
> ```text
> if (req.method !== 'GET' || req.url !== '/api') { res.statusCode = 404; res.end('Not Found'); }
> ```
> ```javascript
> if (req.method !== 'GET' || req.url !== '/api') {
>   res.statusCode = 404;
>   return res.end('Not Found');
> }
> ```
>
> **Explanation:** `req.method` and `req.url` inspect incoming HTTP request route properties.

## 7. Related Terms
- [Express.js](../level_07/express_js.md) — The famous third-party framework that abstracts the native `http` module to make web development significantly easier.
- [Event Emitter](../level_05/event_emitter.md) — Related concept: Event Emitter.
- [Serving Static Files (express.static)](../level_07/static_files.md) — Related concept: Serving Static Files (express.static).
- [The req & res Objects](../level_07/req_res.md) — Request & Response objects.
- [The events Module](events_module.md) — EventEmitter in HTTP server.
---

## 8. Key Takeaways
- The **`http`** module allows Node.js to act as its own Web Server without needing Apache or Nginx.
- It provides `request` and `response` objects to handle traffic.
- Every request must be finalized with `response.end()` or the client will hang indefinitely.
- It is considered too "low-level" for modern development, so developers use Express.js instead.
