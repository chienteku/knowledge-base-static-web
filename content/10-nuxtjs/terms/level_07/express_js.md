# Express.js (Legacy Node Server Context)

> **Level 7 — Server Engine (Nitro)**
> The classic, unopinionated Node.js web application framework that popularized the `(req, res, next)` middleware pattern, serving as the conceptual model that modern isomorphic engines like H3/Nitro build upon and replace.

---

## 1. Prerequisites
- [Nitro Engine](../level_01/nitro_engine.md) — The modern Nuxt server engine that replaces traditional Express setups.
- [Node.js (Runtime Environment)](../../../05-nodejs/terms/level_01/nodejs.md) — The execution host for standard Express servers.

---

## 2. Term Category

**Server & Nitro Engine** (Express Middleware Interoperability): Express.js middleware compatibility in Nuxt 3 allows wrapping legacy Connect/Express HTTP middleware inside H3 handlers using `fromNodeMiddleware()`.



---

## 3. Explanation

### Environment Context
- **Server Only** (Express runs strictly in a Node.js process runtime).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Adapting Legacy Express Middleware with `fromNodeMiddleware()`

**Scenario:**
Integrate legacy Connect/Express CORS or body parser middleware into a Nitro server handler using `fromNodeMiddleware()`.

**Requirements:**
1. Import `fromNodeMiddleware` from `h3`.
2. Wrap legacy middleware function.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/middleware/cors.ts
> import cors from "cors";
> import { fromNodeMiddleware } from "h3";

const corsMiddleware = cors({
  origin: ["https://example.com"],
  methods: ["GET", "POST"]
});

export default fromNodeMiddleware(corsMiddleware);
```

> #### Technical Explanation
>
> 1. `fromNodeMiddleware()` translates standard Node.js `(req, res, next)` Express middleware signatures into H3 event handlers.
> 2. Enables seamless integration of existing Express ecosystem packages inside Nitro.
> 3. Bridges Node.js HTTP ecosystem with modern H3 event architecture.

---

### Exercise 2: Migrating Express Route Handlers to H3 Event Handlers

**Scenario:**
Refactor an Express route handler `app.post('/api/user', (req, res) => ...)` to a Nitro `defineEventHandler`.

**Requirements:**
1. Use `readBody(event)` and return object.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/api/user.post.ts
> export default defineEventHandler(async (event) => {
>   const body = await readBody(event);
>   const query = getQuery(event);
>   
>   return {
>     status: "success",
>     user: body,
>     page: query.page
>   };
> });
> ```

> #### Technical Explanation
>
> 1. H3 event handlers use `readBody()` and `getQuery()` helpers instead of reading mutating properties on `req`.
> 2. Returning objects directly serializes JSON without requiring explicit `res.json()` calls.
> 3. Idiomatic Nitro server development pattern.

---

### Exercise 3: Handling Node.js Streams in Nitro Handlers

**Scenario:**
Pipe a Node.js file read stream to the HTTP response using `sendStream()`.

**Requirements:**
1. Use `sendStream(event, stream)`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import fs from "node:fs";

export default defineEventHandler((event) => {
  const filePath = "./public/large-dataset.csv";
  const stream = fs.createReadStream(filePath);
  
  setResponseHeader(event, "Content-Type", "text/csv");
  return sendStream(event, stream);
});
```

> #### Technical Explanation
>
> 1. `sendStream()` streams large file payloads without loading the entire buffer into RAM.
> 2. Works with Node.js `Readable` streams and web Streams API.
> 3. Prevents memory spikes during large file downloads.

---




---

## 6. Related Terms
- [Nitro Engine](../level_01/nitro_engine.md) — The modern server compiler powering Nuxt.
- [H3 Request Handlers (`defineEventHandler`)](h3_handlers.md) — The modern event-driven API engine replacing Express routes in Nuxt.

---

## 7. Key Takeaways
- Express.js is the legacy Node.js framework that popularized request/response middleware chains.
- It is heavily coupled to Node.js runtime globals, making it unsuitable for modern serverless edge hosting.
- Nuxt 3 replaces Express with H3 to achieve lightweight, platform-agnostic server execution.
- Express routes rely on `(req, res, next)`. H3 routes rely on event-driven wrappers `defineEventHandler(event)`.
