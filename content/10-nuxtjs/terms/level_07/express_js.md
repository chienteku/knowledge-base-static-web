# Express.js (Legacy Node Server Context)

> **Level 7 — Server Engine (Nitro)**
> The classic, unopinionated Node.js web application framework that popularized the `(req, res, next)` middleware pattern, serving as the conceptual model that modern isomorphic engines like H3/Nitro build upon and replace.

---

## 1. Prerequisites
- [Nitro Engine](../level_01/nitro_engine.md) — The modern Nuxt server engine that replaces traditional Express setups.
- [Node.js Runtime](../../../05-nodejs/terms/level_01/nodejs.md) — The execution host for standard Express servers.

---

## 2. Term Category
- **Server-Side Development**

---

## 3. Environment Context
- **Server Only** (Express runs strictly in a Node.js process runtime).

---

## 4. Explanation

### (1) Design Motivation — "Why do we study this?"
Historically, building a backend in Node.js meant writing raw HTTP handlers using Node's built-in `http` module. This module provides a raw incoming stream (`req` or `IncomingMessage`) and an outgoing response stream (`res` or `ServerResponse`). 

Parsing query parameters, reading JSON request bodies, and setting cookie headers manually from these streams required writing verbose, error-prone boilerplate.

To simplify this, the community built **Express.js**. Express wrapped raw streams with helper utilities (e.g., `res.json(data)`, `req.query`) and introduced the **middleware pipeline pattern**, allowing developers to build servers with modular logic chains.

---

### (2) The Middleware Pipeline Pattern
Express is built entirely around middleware functions that accept three parameters: `req` (request), `res` (response), and `next` (the callback to trigger the next middleware function in the queue).

```javascript
// A classic Express.js server setup
const express = require('express');
const app = express();

// Middleware 1: Logger
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next(); // Pass control to the next handler
});

// Route Handler
app.get('/api/user', (req, res) => {
  res.json({ id: 1, name: 'Alex' });
});

app.listen(3000);
```

---

### (3) Why Nuxt 3 Replaced Express with H3
While Express is the most popular Node framework, it has architectural limitations when deployed to modern infrastructure:
1.  **Node.js Dependency:** Express is tightly coupled to Node.js core libraries. It cannot run inside non-Node runtimes like Cloudflare Workers, Vercel Edge, or browser-based WebContainers.
2.  **Mutable Streams:** Express mutates `req` and `res` throughout the middleware chain, leading to side-effects.

Nuxt 3 uses **H3** (via Nitro) instead of Express. H3 abstracts requests and responses into a single, isomorphic **`H3Event`** object. This enables Nitro server code to compile and run on serverless edge networks using native web standards.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use Express middlewares directly in Nuxt server routes

**The mistake:** Importing standard Express middleware packages (like `body-parser` or `cors`) into a Nuxt `server/middleware/` folder:

```typescript
// server/middleware/cors.ts
// BAD: Express middleware signature is incompatible with H3!
import cors from 'cors';

export default defineEventHandler((event) => {
  // ❌ Crashes Nuxt. cors() expects Express (req, res, next) arguments
  cors()(event.node.req, event.node.res, () => {});
});
```

**Why it's wrong:** Nuxt server handlers are powered by H3, which expects modern event-based handler structures instead of classic Express callback pipelines.

**Golden Rule:** Do not use Express-specific middleware libraries in Nuxt. Use native H3 helpers (like `handleCors()`) or modern isomorphic event handlers.

---

### Mistake 2: Building a Separate External Express Server for Basic REST Endpoints in Nuxt 3

**The mistake:** Setting up a standalone Express.js server for simple backend endpoints in a Nuxt 3 app.

**Why it's wrong:** Nitro (powered by H3) provides built-in backend server capabilities in `server/api/` out of the box, executing serverlessly without needing a separate Express process.

*Incorrect:*
```vue
/* Setting up an external Express server for basic Nuxt backend routes */
```

*Fix:*
```vue
/* Use Nitro server handlers (server/api/users.ts) built into Nuxt 3 */
```

---

### Mistake 3: Using Express Middleware Signatures (`req, res, next`) directly in Nitro Handlers

**The mistake:** Writing `export default function(req, res, next) {}` inside `server/api/route.ts`.

**Why it's wrong:** Nitro server handlers use H3 event signatures (`defineEventHandler((event) => {})`). Using Express `req, res, next` callback signatures throws a runtime exception.

*Incorrect:*
```typescript
export default function(req, res, next) { res.send('OK'); } // ❌ Express syntax invalid in Nitro!
```

*Fix:*
```vue
export default defineEventHandler((event) => { return 'OK'; }); // Correct H3 event handler
```


---

## 6. Practice Exercises

### Exercise 1: Query Extraction Comparison

**Problem:** How does reading a URL query parameter named `id` differ between an Express route handler and a Nuxt H3 handler? Write both code blocks side by side.

**Expected output:**
> [!check]- Answer
> ```javascript
> // Express.js
> app.get('/api', (req, res) => {
>   const id = req.query.id;
> });
> 
> // Nuxt H3
> export default defineEventHandler((event) => {
>   const query = getQuery(event);
>   const id = query.id;
> });
> ```
> - Express attaches parsed queries directly to `req.query`. H3 uses the auto-imported helper `getQuery(event)`.

---

### Exercise 2: fromNodeMiddleware Express Bridge Pattern

**Problem:** Which H3 helper function adapts legacy Express middleware functions for use in Nitro server handlers?

**Expected output:**
> [!check]- Answer
> ```text
> fromNodeMiddleware(expressMiddleware)
> ```
> - `fromNodeMiddleware` bridges Node.js Express middleware into Nitro handlers.
> 
> ```typescript
> import { fromNodeMiddleware } from 'h3';
> import expressMiddleware from 'legacy-express-plugin';
> 
> export default fromNodeMiddleware(expressMiddleware);
> ```

---

### Exercise 3: Nitro vs Express Performance

**Problem:** Why are H3/Nitro server handlers faster and lighter than Express.js?

**Expected output:**
> [!check]- Answer
> ```text
> H3 is a minimal, composable web server framework designed for zero-dependency execution across Node.js, Edge, and Serverless environments.
> ```
> - H3 is zero-dependency and optimized for Edge and Serverless runtimes.
> 
> ```text
> H3 = Lightweight, Multi-Runtime, Zero-Dependency Server Framework
> ```


---

## 7. Related Terms
- [Nitro Engine](../level_01/nitro_engine.md) — The modern server compiler powering Nuxt.
- [H3 Request Handlers](../level_07/h3_handlers.md) — The modern event-driven API engine replacing Express routes in Nuxt.

---

## 8. Key Takeaways
- Express.js is the legacy Node.js framework that popularized request/response middleware chains.
- It is heavily coupled to Node.js runtime globals, making it unsuitable for modern serverless edge hosting.
- Nuxt 3 replaces Express with H3 to achieve lightweight, platform-agnostic server execution.
- Express routes rely on `(req, res, next)`. H3 routes rely on event-driven wrappers `defineEventHandler(event)`.
