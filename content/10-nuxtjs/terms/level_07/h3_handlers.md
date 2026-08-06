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

**Server & Nitro Engine** (H3 Event Handlers): H3 Event Handlers (`defineEventHandler()`) provide lightweight, composable HTTP event processing powering Nitro server routes.



---

## 3. Explanation

### Environment Context
- **Server Only**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Extracting Route Parameters and Headers in H3

**Scenario:**
Create an H3 handler `server/api/users/[id].ts` parsing path parameters, query parameters, and custom request headers.

**Requirements:**
1. Use `getRouterParam()`, `getQuery()`, and `getHeader()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/api/users/[id].ts
> export default defineEventHandler((event) => {
>   const id = getRouterParam(event, "id");
>   const query = getQuery(event);
>   const authHeader = getHeader(event, "authorization");
>   
>   return {
>     userId: id,
>     filter: query.filter,
>     hasToken: !!authHeader
>   };
> });
> ```
> 
> #### Technical Explanation
>
> 1. `getRouterParam(event, name)` extracts dynamic path parameters (`[id]`).
> 2. `getQuery(event)` parses incoming URL query parameters into a typed object.
> 3. `getHeader(event, name)` reads HTTP request headers case-insensitively.
> 
---

### Exercise 2: Setting HTTP Status Codes and Headers

**Scenario:**
Set a custom response header `X-Cache-Status: HIT` and return HTTP status `201 Created` upon resource creation.

**Requirements:**
1. Use `setResponseStatus()` and `setResponseHeader()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/api/items.post.ts
> export default defineEventHandler(async (event) => {
>   const body = await readBody(event);
>   
>   setResponseStatus(event, 201);
>   setResponseHeader(event, "X-Cache-Status", "BYPASS");
>   setResponseHeader(event, "Location", `/api/items/${body.id}`);
>   
>   return { success: true, item: body };
> });
> ```
> 
> #### Technical Explanation
>
> 1. `setResponseStatus(event, code)` explicitly sets the HTTP response status code.
> 2. `setResponseHeader(event, key, val)` attaches custom HTTP response headers.
> 3. Standard REST API handler pattern in H3.
> 
---

### Exercise 3: Reading and Writing HTTP Cookies in H3

**Scenario:**
Read a session cookie `session_id` and set a new secure cookie in an H3 event handler.

**Requirements:**
1. Use `getCookie()` and `setCookie()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/api/session.ts
> export default defineEventHandler((event) => {
>   const currentSession = getCookie(event, "session_id");
>   
>   setCookie(event, "session_id", "new_sec_token_999", {
>     httpOnly: true,
>     secure: true,
>     sameSite: "lax",
>     maxAge: 60 * 60 * 24
>   });
>   
>   return { previousSession: currentSession, active: true };
> });
> ```
> 
> #### Technical Explanation
>
> 1. `getCookie(event, name)` parses request cookie headers on the server.
> 2. `setCookie(event, name, value, options)` appends `Set-Cookie` headers to HTTP responses.
> 3. `httpOnly: true` prevents browser client-side JavaScript access to sensitive cookies.
> 
---


## 6. Related Terms
- [Server Middleware](server_middleware.md) — Middleware files use the exact same H3 `defineEventHandler` syntax.
- [Express.js (Legacy Node Server Context)](express_js.md) — Related concept: Express.js (Legacy Node Server Context).
- [`server/api/` Routes](server_api_routes.md) — Related concept: `server/api/` Routes.
- [`server/routes/`](server_routes.md) — Related concept: `server/routes/`.
- [Nitro Engine](../level_01/nitro_engine.md) — Nitro server engine.

---

## 7. Key Takeaways
- H3 is the underlying HTTP framework powering Nuxt backend routes.
- It relies on pure utility functions (`readBody`, `getQuery`, `getCookie`) instead of mutating global request objects.
- It is highly optimized to run in Node.js, Serverless, and Edge environments.
- Handlers are defined using `defineEventHandler(event => { ... })`.
