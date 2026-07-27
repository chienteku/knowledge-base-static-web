# The http Module Deep Dive

> **Level 7 — Web Servers & APIs**
> The low-level, built-in Node.js module responsible for listening to network ports and handling the raw TCP/IP data of HTTP requests.

---

## 1. Prerequisites
- [The `http` Module (Level 2)](../level_02/http_module.md) — The basic introduction to this core module.
- [Event Emitter](../level_05/event_emitter.md) — The `http.Server` class is actually just an Event Emitter!

---

## 2. Term Category
- **Node.js Core Module**

---

## 3. Environment Context
- **Node.js Only** (Browsers have `fetch()`, which is a high-level client, not a server).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Confusing HTTP Request Headers (`req.headers`) Case Sensitivity

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

### Mistake 5: Failing to Handle HTTP Keep-Alive Connection Timeouts

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



### Mistake 6: Confusing HTTP Request Headers (`req.headers`) Case Sensitivity

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

### Mistake 7: Failing to Handle HTTP Keep-Alive Connection Timeouts

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

## 6. Practice Exercises

### Exercise 1: The Raw Router

**Problem:** Using only the raw `http` module, how do you send different text depending on if the user visits `/` versus `/about`?

**Expected output:**
```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.end('Home Page');
  } else if (req.url === '/about') {
    res.end('About Page');
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

server.listen(3000);
```
*Explanation: You have to manually write massive `if/else` statements to check the `req.url`. This is why we use Express!*

> [!check]- Answer
> - You need an `if` statement checking `req.url`.

---



### Exercise 2: Identifying HTTP Status Code Ranges

**Problem:** Match status code range to HTTP category:
1. 2xx
2. 3xx
3. 4xx
4. 5xx

**Expected output:**
```text
1. 2xx: Success
2. 3xx: Redirection
3. 4xx: Client Error
4. 5xx: Server Error
```

> [!check]- Answer
> ```text
> 1. 2xx -> Success (e.g. 200 OK, 201 Created)
> 2. 3xx -> Redirection (e.g. 301 Moved, 304 Not Modified)
> 3. 4xx -> Client Error (e.g. 400 Bad Request, 404 Not Found)
> 4. 5xx -> Server Error (e.g. 500 Internal Error, 502 Bad Gateway)
> ```
>
> **Explanation:** Standard HTTP status categories designate response outcome states.

### Exercise 3: Setting HTTP Response Status & Headers

**Problem:** Write native Node HTTP response lines setting status 201 Created and JSON content-type header.

**Expected output:**
```text
res.writeHead(201, { 'Content-Type': 'application/json' });
```

> [!check]- Answer
> ```javascript
> res.writeHead(201, { 'Content-Type': 'application/json' });
> ```
>
> **Explanation:** `writeHead()` sets HTTP status code and response header key-values in a single call.



### Exercise 4: Identifying HTTP Status Code Ranges

**Problem:** Match status code range to HTTP category:
1. 2xx
2. 3xx
3. 4xx
4. 5xx

**Expected output:**
```text
1. 2xx: Success
2. 3xx: Redirection
3. 4xx: Client Error
4. 5xx: Server Error
```

> [!check]- Answer
> ```text
> 1. 2xx -> Success (e.g. 200 OK, 201 Created)
> 2. 3xx -> Redirection (e.g. 301 Moved, 304 Not Modified)
> 3. 4xx -> Client Error (e.g. 400 Bad Request, 404 Not Found)
> 4. 5xx -> Server Error (e.g. 500 Internal Error, 502 Bad Gateway)
> ```
>
> **Explanation:** Standard HTTP status categories designate response outcome states.

### Exercise 5: Setting HTTP Response Status & Headers

**Problem:** Write native Node HTTP response lines setting status 201 Created and JSON content-type header.

**Expected output:**
```text
res.writeHead(201, { 'Content-Type': 'application/json' });
```

> [!check]- Answer
> ```javascript
> res.writeHead(201, { 'Content-Type': 'application/json' });
> ```
>
> **Explanation:** `writeHead()` sets HTTP status code and response header key-values in a single call.



### Exercise 6: Identifying HTTP Status Code Ranges

**Problem:** Match status code range to HTTP category:
1. 2xx
2. 3xx
3. 4xx
4. 5xx

**Expected output:**
```text
1. 2xx: Success
2. 3xx: Redirection
3. 4xx: Client Error
4. 5xx: Server Error
```

> [!check]- Answer
> ```text
> 1. 2xx -> Success (e.g. 200 OK, 201 Created)
> 2. 3xx -> Redirection (e.g. 301 Moved, 304 Not Modified)
> 3. 4xx -> Client Error (e.g. 400 Bad Request, 404 Not Found)
> 4. 5xx -> Server Error (e.g. 500 Internal Error, 502 Bad Gateway)
> ```
>
> **Explanation:** Standard HTTP status categories designate response outcome states.

### Exercise 7: Setting HTTP Response Status & Headers

**Problem:** Write native Node HTTP response lines setting status 201 Created and JSON content-type header.

**Expected output:**
```text
res.writeHead(201, { 'Content-Type': 'application/json' });
```

> [!check]- Answer
> ```javascript
> res.writeHead(201, { 'Content-Type': 'application/json' });
> ```
>
> **Explanation:** `writeHead()` sets HTTP status code and response header key-values in a single call.

## 7. Related Terms
- [Express.js](../level_07/express_js.md) — The framework that hides the ugly parts of the `http` module.
- [The Request & Response Objects](../level_07/req_res.md) — What the `http` module passes into your callback.

---

## 8. Key Takeaways
- The **`http` module** allows Node.js to act as its own web server without needing Apache or NGINX.
- It is an `EventEmitter` that listens to network ports and emits `'request'` events.
- It is too low-level for modern API development, requiring manual Buffer parsing and massive `if/else` routing.
