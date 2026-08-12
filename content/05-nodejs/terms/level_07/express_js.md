# Express.js

> **Level 7 — Web Servers & APIs**
> The most popular, minimalist web framework for Node.js, designed to abstract away the painful parts of the raw `http` module.

---

## 1. Prerequisites
- [NPM (Node Package Manager)](../level_04/npm.md) — Express is an external module, so you must download it.
- [The http Module Deep Dive](http_deep_dive.md) — The core Node.js module that Express wraps and improves.

---

## 2. Term Category

**Third-Party Framework (Node.js)**: Express.js is a fundamental concept in this technology stack. **Level 7 — Web Servers & APIs**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Express Application Dispatcher Simulator

**Scenario:** Simulates core Express.js route matching and middleware pipeline dispatching `app.use()` and `app.get()`.

**Requirements:**
1. Write createExpressSimulator().
2. Implement `use(path, fn)` and `get(path, fn)`.
3. Implement `handle(req, res)`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createExpressSimulator() {
>   const middlewareStack = [];
>
>   return {
>     use(fn) {
>       middlewareStack.push({ path: "*", fn });
>     },
>     get(path, fn) {
>       middlewareStack.push({ path, method: "GET", fn });
>     },
>     handle(req, res) {
>       let index = 0;
>
>       function next(err) {
>         if (err) {
>           res.statusCode = 500;
>           return res.end(`Express Error: ${err.message}`);
>         }
>
>         if (index >= middlewareStack.length) {
>           res.statusCode = 404;
>           return res.end("404 Not Found");
>         }
>
>         const layer = middlewareStack[index++];
>         const methodMatches = !layer.method || layer.method === req.method;
>         const pathMatches = layer.path === "*" || layer.path === req.url;
>
>         if (methodMatches && pathMatches) {
>           layer.fn(req, res, next);
>         } else {
>           next();
>         }
>       }
>
>       next();
>     }
>   };
> }
>
> // Verification tests
> const app = createExpressSimulator();
> let logged = false;
>
> app.use((req, res, next) => { logged = true; next(); });
> app.get("/users", (req, res) => { res.end("User List"); });
>
> let resBody = "";
> const mockRes = { end: (body) => { resBody = body; } };
>
> app.handle({ method: "GET", url: "/users" }, mockRes);
> console.assert(logged === true, "Test 1 Failed: Middleware executed");
> console.assert(resBody === "User List", "Test 2 Failed: Route handler executed");
> ```
>
> #### Technical Explanation
>
> 1. **Express Architecture**: Express is an unopinionated web framework built on a stack of middleware layers.
> 2. **Middleware Stack**: Each `app.use()` and `app.get()` adds a layer object containing path, method, and handler to an internal stack.
> 3. **The `next()` Callback**: Invoking `next()` advances execution to the next matching layer in the stack.
> 
---

### Exercise 2: Express Centralized Error Handling Middleware

**Scenario:** Implements a 4-parameter Express error handling middleware `(err, req, res, next)` to capture errors and return sanitized JSON responses.

**Requirements:**
1. Write expressErrorHandler(err, req, res, next).
2. Set status code (default 500).
3. Return sanitized JSON error object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function expressErrorHandler(err, req, res, next) {
>   const statusCode = err.statusCode || err.status || 500;
>
>   res.statusCode = statusCode;
>   res.setHeader("Content-Type", "application/json");
>
>   const errorResponse = {
>     success: false,
>     error: {
>       message: statusCode === 500 ? "Internal Server Error" : err.message,
>       code: err.code || "SERVER_ERROR"
>     }
>   };
>
>   res.end(JSON.stringify(errorResponse));
> }
>
> // Verification tests
> let statusSet = 0;
> let jsonSent = "";
>
> const mockRes = {
>   set statusCode(code) { statusSet = code; },
>   setHeader: () => {},
>   end: (data) => { jsonSent = data; }
> };
>
> const customErr = new Error("Resource not found");
> customErr.statusCode = 404;
>
> expressErrorHandler(customErr, {}, mockRes, () => {});
> console.assert(statusSet === 404, "Test 1 Failed");
> console.assert(JSON.parse(jsonSent).error.message === "Resource not found", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **4-Parameter Error Middleware Signature**: Express identifies error middleware strictly by its 4-parameter signature: `(err, req, res, next)`.
> 2. **Catch-All Placement**: Error middleware MUST be registered last in `app.use()` calls after all routes.
> 3. **Information Leakage Guard**: Sanitizes 500 internal errors to hide database connection strings and stack traces from clients.
> 
---

### Exercise 3: Sub-App Modular Mount Router

**Scenario:** Mounts a modular Express `Router` sub-application onto a parent API prefix path (`/api/v1`).

**Requirements:**
1. Write mountSubRouter(parentApp, prefix, subRouterMock).
2. Bind sub-router to prefix.
3. Verify URL path matching.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function mountSubRouter(parentAppMock, prefix = "/api/v1", subRouterMock) {
>   const cleanPrefix = prefix.replace(/\/$/, "");
>
>   parentAppMock.use((req, res, next) => {
>     if (req.url.startsWith(cleanPrefix)) {
>       const subPath = req.url.substring(cleanPrefix.length) || "/";
>       const subReq = { ...req, url: subPath, originalUrl: req.url };
>       return subRouterMock.handle(subReq, res, next);
>     }
>     next();
>   });
> }
>
> // Verification tests
> let subHandled = false;
> const mockParent = { use: (fn) => { mockParent.fn = fn; } };
> const mockSub = { handle: (req, res, next) => { subHandled = req.url === "/users"; } };
>
> mountSubRouter(mockParent, "/api/v1", mockSub);
> mockParent.fn({ url: "/api/v1/users" }, {}, () => {});
>
> console.assert(subHandled === true, "Test 1 Failed: Sub-router handled stripped path /users");
> ```
>
> #### Technical Explanation
>
> 1. **Express Router Modularization**: `express.Router()` creates isolated, modular mini-applications with their own routes and middleware.
> 2. **Path Prefix Stripping**: When mounting sub-routers (`app.use('/api/v1', v1Router)`), Express strips the prefix from `req.url` while storing full path in `req.originalUrl`.
> 3. **Maintainable API Architecture**: Allows organizing code into separate feature router files (e.g. `usersRouter.js`, `ordersRouter.js`).
## 6. Related Terms
- [Routing](routing.md) — The feature Express uses `app.get` and `app.post` for.
- [Middleware](middleware.md) — The most powerful feature of the Express framework.
- [The http Module](../level_02/http_module.md) — Related concept: The http Module.
- [The http Module Deep Dive](http_deep_dive.md) — Related concept: The http Module Deep Dive.
- [The req & res Objects](req_res.md) — Request and Response parameters.
- [CORS](../level_09/cors.md) — Related concept: CORS.

---

## 7. Key Takeaways
- **Express.js** is a minimalist, third-party web framework for Node.js.
- It acts as a wrapper around the built-in `http` module, removing the tedious boilerplate of parsing data and managing routes.
- It provides helper methods like `res.json()` and `app.get()`.
- It is "Unopinionated", meaning you must decide your own project structure and architecture.
