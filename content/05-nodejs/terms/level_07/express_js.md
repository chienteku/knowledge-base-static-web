# Express.js

> **Level 7 — Web Servers & APIs**
> The most popular, minimalist web framework for Node.js, designed to abstract away the painful parts of the raw `http` module.

---

## 1. Prerequisites
- [NPM](../level_04/npm.md) — Express is an external module, so you must download it.
- [The `http` Module](../level_07/http_deep_dive.md) — The core Node.js module that Express wraps and improves.

---

## 2. Term Category
- **Third-Party Framework**

---

## 3. Environment Context
- **Node.js (Server Infrastructure)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you build an API using only Node's built-in `http` module, you have to write manual code to parse incoming JSON Buffers, manual `if/else` statements for every single URL route, and manual code to set headers and status codes.
**Express.js** was created to hide all of this boilerplate. It is a "wrapper" around the `http` module. It adds dozens of helper methods that make building web servers and APIs incredibly fast and readable.

### (2) What Express Adds
1. **Clean Routing:** Instead of `if (req.method === 'GET' && req.url === '/users')`, you just write `app.get('/users', callback)`.
2. **Easy JSON Parsing:** Instead of dealing with data chunks and buffers, you add one line (`app.use(express.json())`), and all incoming JSON magically appears as an object on `req.body`.
3. **Easy Responses:** Instead of manually setting Content-Type headers and stringifying JSON, you just type `res.json({ name: "Bob" })`.
4. **Middleware:** A powerful plugin system to inject logic (like authentication) into the middle of a request.

### (3) The "Unopinionated" Philosophy
Unlike massive frameworks like Django (Python) or Spring Boot (Java), Express is **Unopinionated**. This means Express gives you the tools to build a server, but it completely refuses to tell you how to organize your folders, what database to use, or how to handle authentication. You have to build the architecture yourself.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to require it without installing it

**The mistake:** A developer watches a tutorial, writes `const express = require('express')`, and the server instantly crashes with `Cannot find module 'express'`.

**Why it's wrong:** Express is NOT built into Node.js! It is a third-party package created by the community. You cannot `require` it until you have opened your terminal and run `npm install express`.
**Golden Rule:** Always `npm install` third-party frameworks before requiring them.

---



### Mistake 2: Forgetting `return` in Route Handlers After Sending HTTP Responses (`ERR_HTTP_HEADERS_SENT`)

**The mistake:** Calling `res.send()` inside a conditional branch without returning, causing code execution to continue to a 2nd `res.send()`.

**Why it's wrong:** Sending a response does NOT exit the route handler function! Execution continues to subsequent lines, attempting to write a 2nd response and throwing `ERR_HTTP_HEADERS_SENT`.

*Incorrect:*
```javascript
app.get('/user', (req, res) => {
  if (!req.query.id) res.status(400).send('Missing ID'); // ❌ Missing return!
  res.send('User data');
});
```

*Fix:*
```javascript
app.get('/user', (req, res) => {
  if (!req.query.id) return res.status(400).send('Missing ID'); // Explicit return
  res.send('User data');
});
```

### Mistake 3: Failing to Pass Async Errors to `next(err)` in Express 4 Routes

**The mistake:** Throwing an error inside an async route handler in Express 4 without `try/catch` or `next(err)`.

**Why it's wrong:** Express 4 does NOT automatically catch rejected promises in async route handlers. Unhandled rejections cause client requests to hang forever.

*Incorrect:*
```javascript
app.get('/data', async (req, res) => {
  const data = await fetchData(); // ❌ Rejection causes client request to hang!
  res.send(data);
});
```

*Fix:*
```javascript
app.get('/data', async (req, res, next) => {
  try {
    const data = await fetchData();
    res.send(data);
  } catch (err) {
    next(err); // Forwards error to Express error middleware
  }
});
```



### Mistake 4: Forgetting `return` in Route Handlers After Sending HTTP Responses (`ERR_HTTP_HEADERS_SENT`)

**The mistake:** Calling `res.send()` inside a conditional branch without returning, causing code execution to continue to a 2nd `res.send()`.

**Why it's wrong:** Sending a response does NOT exit the route handler function! Execution continues to subsequent lines, attempting to write a 2nd response and throwing `ERR_HTTP_HEADERS_SENT`.

*Incorrect:*
```javascript
app.get('/user', (req, res) => {
  if (!req.query.id) res.status(400).send('Missing ID'); // ❌ Missing return!
  res.send('User data');
});
```

*Fix:*
```javascript
app.get('/user', (req, res) => {
  if (!req.query.id) return res.status(400).send('Missing ID'); // Explicit return
  res.send('User data');
});
```

### Mistake 5: Failing to Pass Async Errors to `next(err)` in Express 4 Routes

**The mistake:** Throwing an error inside an async route handler in Express 4 without `try/catch` or `next(err)`.

**Why it's wrong:** Express 4 does NOT automatically catch rejected promises in async route handlers. Unhandled rejections cause client requests to hang forever.

*Incorrect:*
```javascript
app.get('/data', async (req, res) => {
  const data = await fetchData(); // ❌ Rejection causes client request to hang!
  res.send(data);
});
```

*Fix:*
```javascript
app.get('/data', async (req, res, next) => {
  try {
    const data = await fetchData();
    res.send(data);
  } catch (err) {
    next(err); // Forwards error to Express error middleware
  }
});
```



### Mistake 6: Forgetting `return` in Route Handlers After Sending HTTP Responses (`ERR_HTTP_HEADERS_SENT`)

**The mistake:** Calling `res.send()` inside a conditional branch without returning, causing code execution to continue to a 2nd `res.send()`.

**Why it's wrong:** Sending a response does NOT exit the route handler function! Execution continues to subsequent lines, attempting to write a 2nd response and throwing `ERR_HTTP_HEADERS_SENT`.

*Incorrect:*
```javascript
app.get('/user', (req, res) => {
  if (!req.query.id) res.status(400).send('Missing ID'); // ❌ Missing return!
  res.send('User data');
});
```

*Fix:*
```javascript
app.get('/user', (req, res) => {
  if (!req.query.id) return res.status(400).send('Missing ID'); // Explicit return
  res.send('User data');
});
```

### Mistake 7: Failing to Pass Async Errors to `next(err)` in Express 4 Routes

**The mistake:** Throwing an error inside an async route handler in Express 4 without `try/catch` or `next(err)`.

**Why it's wrong:** Express 4 does NOT automatically catch rejected promises in async route handlers. Unhandled rejections cause client requests to hang forever.

*Incorrect:*
```javascript
app.get('/data', async (req, res) => {
  const data = await fetchData(); // ❌ Rejection causes client request to hang!
  res.send(data);
});
```

*Fix:*
```javascript
app.get('/data', async (req, res, next) => {
  try {
    const data = await fetchData();
    res.send(data);
  } catch (err) {
    next(err); // Forwards error to Express error middleware
  }
});
```

## 6. Practice Exercises

### Exercise 1: Hello World in Express

**Problem:** How do you start an Express server on Port 3000 that replies with `"Hello Express!"` when a user visits the root URL `/`?

**Expected output:**
```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello Express!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

> [!check]- Answer
> - Use `app.get()` for the route.
> - Use `app.listen()` to start the server.

---



### Exercise 2: Basic Express App Setup

**Problem:** Write basic Express app listening on port 3000 returning `'Hello World'` on `GET /`.

**Expected output:**
```text
const express = require('express'); const app = express(); app.get('/', (req, res) => res.send('Hello World')); app.listen(3000);
```

> [!check]- Answer
> ```javascript
> const express = require('express');
> const app = express();
> app.get('/', (req, res) => res.send('Hello World'));
> app.listen(3000);
> ```
>
> **Explanation:** `express()` creates an Express application instance listening on specified port.

### Exercise 3: Express 5 Async Route Support

**Problem:** How does Express 5 improve async route error handling compared to Express 4?

**Expected output:**
```text
Express 5 automatically handles rejected promises in async route handlers, passing them to error middleware without requiring try/catch.
```

> [!check]- Answer
> ```text
> Express 5 automatically handles rejected promises in async route handlers, passing them to error middleware without requiring try/catch.
> ```
>
> **Explanation:** Express 5 natively catches rejected async promises automatically.

## 7. Related Terms
- [Routing](../level_07/routing.md) — The feature Express uses `app.get` and `app.post` for.
- [Middleware](../level_07/middleware.md) — The most powerful feature of the Express framework.

---

## 8. Key Takeaways
- **Express.js** is a minimalist, third-party web framework for Node.js.
- It acts as a wrapper around the built-in `http` module, removing the tedious boilerplate of parsing data and managing routes.
- It provides helper methods like `res.json()` and `app.get()`.
- It is "Unopinionated", meaning you must decide your own project structure and architecture.
