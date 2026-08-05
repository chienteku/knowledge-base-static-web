# H3 Request Handlers (`defineEventHandler`)

> **Level 7 — Server Engine (Nitro)**
> The minimal, composable HTTP framework that powers Nitro. It provides the core utility `defineEventHandler` and a massive suite of helper functions to read and write data during a server request.

---

## 1. Prerequisites
- [Nitro Engine](../level_01/nitro_engine.md) — Nitro is built entirely on top of H3.
- [`server/api/` Routes](server_api_routes.md) — Where H3 handlers are primarily used.
- [Express.js (Legacy Node Server Context)](express_js.md) — The request/response routing pattern H3 abstracts and replaces.
---

## 2. Term Category
- **Server-Side Development**

---

## 3. Environment Context
- **Server Only**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard Express.js apps, everything is attached to two massive objects: `req` (Request) and `res` (Response). If you want to read a cookie, you do `req.cookies`. If you want to read the body, you need body-parser middleware and then read `req.body`. This mutates the core Node.js objects and makes the code difficult to run in Edge environments (like Cloudflare) where Node.js `req/res` objects don't exist.

H3 solves this by using pure, composable utility functions. Instead of mutating objects, you pass the universal H3 `event` into specific helper functions to get exactly what you need.

### (2) The `event` Object
Every H3 endpoint uses `defineEventHandler`, which provides a single `event` argument. This event represents the current HTTP request.

### (3) H3 Helper Functions
H3 provides dozens of auto-imported utilities to read data from the `event`. You do not need to install plugins or body-parsers.

```typescript
// server/api/submit.post.ts
export default defineEventHandler(async (event) => {
  // 1. Read the JSON body from a POST request
  const body = await readBody(event);
  
  // 2. Read query parameters (e.g., ?id=123)
  const query = getQuery(event);
  
  // 3. Read a specific cookie
  const sessionToken = getCookie(event, 'session_id');
  
  // 4. Set a response header
  setResponseHeader(event, 'Cache-Control', 'max-age=3600');
  
  // 5. Throw an error if validation fails
  if (!body.name) {
    throw createError({ statusCode: 400, message: "Name is required" });
  }

  // Return data directly!
  return { success: true, received: body.name };
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use `readBody` on a GET request
**The mistake:** Calling `const body = await readBody(event)` inside an endpoint that processes `GET` requests.

**Why it's wrong:** HTTP `GET` requests are not allowed to have a body payload. If H3 attempts to parse a body from a GET request, it will throw an error or return null, crashing your logic.
**Golden Rule:** Only use `readBody(event)` inside endpoints explicitly designated for `.post.ts`, `.put.ts`, or `.patch.ts`. If you need data in a GET request, pass it in the URL and use `getQuery(event)`.

---

### Mistake 2: Reading Request Body Synchronously Without Awaiting `readBody(event)`

**The mistake:** Writing `const body = readBody(event)` without `await`.

**Why it's wrong:** `readBody(event)` returns a Promise resolving to the parsed JSON request body. Reading it synchronously assigns a Promise object rather than the parsed JSON data.

*Incorrect:*
```typescript
export default defineEventHandler((event) => {
  const body = readBody(event); // ❌ Missing await! body is a Promise!
});
```

*Fix:*
```vue
export default defineEventHandler(async (event) => {
  const body = await readBody(event); // Await parsed JSON body
});
```

---

### Mistake 3: Using `res.end()` or `res.json()` Instead of Returning Values directly in H3

**The mistake:** Attempting to call Express methods like `event.node.res.json(data)` inside H3 event handlers.

**Why it's wrong:** H3 event handlers automatically serialize returned JavaScript objects into JSON responses. Returning values directly is clean and cross-platform.

*Incorrect:*
```typescript
export default defineEventHandler((event) => {
  event.node.res.json({ status: 'ok' }); // ❌ Express method call!
});
```

*Fix:*
```vue
export default defineEventHandler((event) => {
  return { status: 'ok' }; // Return object directly for automatic JSON serialization
});
```


---

## 6. Practice Exercises

### Exercise 1: Redirecting Users

**Problem:** You are migrating old routes. Write a Nitro endpoint at `server/routes/old-page.ts` that intercepts the request and instantly redirects the user to `/new-page` with a 301 Permanent Redirect status code. (Hint: H3 provides a `sendRedirect` utility).

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineEventHandler(async (event) => {
>   await sendRedirect(event, '/new-page', 301);
> });
> ```
> - H3 auto-imports `sendRedirect`, which accepts the current `event`, target redirect URL, and optional HTTP status code.

---

### Exercise 2: H3 Utility Functions Matrix

**Problem:** Match H3 utility helper to its purpose:
1. `getQuery(event)` 
2. `readBody(event)` 
3. `getRouterParam(event, 'id')` 
4. `setCookie(event, name, val)` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Parses URL query search parameters
> 2. Reads and parses JSON request body payload
> 3. Retrieves dynamic route parameters
> 4. Sets HTTP response cookie header
> ```
> - `getQuery(event)` -> Reads URL query params (`?q=val`)
> - `readBody(event)` -> Reads JSON body payload
> - `getRouterParam(event, 'id')` -> Reads dynamic path params
> - `setCookie(event, 'token', val)` -> Sets response cookie
> 
> ```typescript
> export default defineEventHandler(async (event) => {
>   const query = getQuery(event);
>   const body = await readBody(event);
> });
> ```

---

### Exercise 3: H3 Custom Error Throwing

**Problem:** Write H3 line throwing HTTP 401 Unauthorized error using `createError()`.

**Expected output:**
> [!check]- Answer
> ```typescript
> throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
> ```
> - `createError` throws structured H3 HTTP error exceptions.
> 
> ```typescript
> throw createError({
>   statusCode: 401,
>   statusMessage: 'Unauthorized Access'
> });
> ```


---

## 7. Related Terms
- [Server Middleware](server_middleware.md) — Middleware files use the exact same H3 `defineEventHandler` syntax.
- [Express.js (Legacy Node Server Context)](express_js.md) — Related concept: Express.js (Legacy Node Server Context).
- [`server/api/` Routes](server_api_routes.md) — Related concept: `server/api/` Routes.
- [`server/routes/`](server_routes.md) — Related concept: `server/routes/`.
- [Nitro Engine](../level_01/nitro_engine.md) — Nitro server engine.
---

## 8. Key Takeaways
- H3 is the underlying HTTP framework powering Nuxt backend routes.
- It relies on pure utility functions (`readBody`, `getQuery`, `getCookie`) instead of mutating global request objects.
- It is highly optimized to run in Node.js, Serverless, and Edge environments.
- Handlers are defined using `defineEventHandler(event => { ... })`.
