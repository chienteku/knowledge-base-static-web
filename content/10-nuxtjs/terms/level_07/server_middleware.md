# Server Middleware

> **Level 7 — Server Engine (Nitro)**
> A directory containing functions that automatically execute on *every single incoming request* to the server, before any API route or Vue page is rendered.

---

## 1. Prerequisites
- [Nitro Engine](../level_01/nitro_engine.md) — The server engine that intercepts these requests.
- [`server/api/` Routes](server_api_routes.md) — The endpoints that middleware often protects.
- [Express.js (Legacy Node Server Context)](express_js.md) — The legacy request-intercepting middleware pattern Nitro replaces.

---

## 2. Term Category

**Server & Nitro Engine** (Global Request Interceptor Middleware): Server Middleware in `server/middleware/` runs on every incoming server request before route handlers, processing headers, auth tokens, and logging.



---

## 3. Explanation

### Environment Context
- **Server Only**

### (1) Design Motivation — "Why did we design this?"
If you have 50 different API routes that all require a user to be logged in, copying and pasting the token verification logic into all 50 files is a security risk. If you forget it in one file, your database is compromised.

Server Middleware allows you to run a block of logic globally. Every time a user visits a page, requests an image, or hits an API endpoint, the middleware runs first. This makes it the perfect place for global authentication, rate limiting, logging, or setting security headers.

### (2) Core Concept
Files placed in `server/middleware/` run automatically. You don't import them anywhere. They execute in alphabetical order based on their filename.

```typescript
// server/middleware/1.logger.ts
export default defineEventHandler((event) => {
  console.log('Incoming request: ' + event.node.req.url);
  // Do not return anything! If you return a value here, 
  // the request stops and the API route is never reached.
});
```

### (3) Modifying the Request / Context
A common pattern in middleware is extracting a user session from a cookie, validating it, and attaching the user object to the H3 `event.context`. This allows your API routes to easily access the user without verifying the token again.

```typescript
// server/middleware/2.auth.ts
export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token');
  
  if (token) {
    // Attach to context!
    event.context.user = await verifyToken(token);
  }
});
```

Now, inside `server/api/profile.ts`, you can safely do:
```typescript
export default defineEventHandler((event) => {
  if (!event.context.user) throw createError({ statusCode: 401 });
  return event.context.user;
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Returning data from middleware
**The mistake:** Using `return { success: true }` or `return next()` inside a server middleware file.

**Why it's wrong:** In Nitro (H3), returning a value from an event handler closes the connection and sends that value to the browser. If a middleware returns *anything*, the request stops dead in its tracks. The intended API route or Vue page will never load.
**Golden Rule:** Server middleware should almost always return `void` (nothing). If you need to stop a request (e.g., user is banned), throw an H3 error using `throw createError()`.

---

### Mistake 2: Executing Heavy Asynchronous Operations in Server Middleware for All Routes

**The mistake:** Querying SQL database on every request inside `server/middleware/auth.ts` without checking request path.

**Why it's wrong:** Server middleware in `server/middleware/` executes on EVERY SINGLE server request (including page assets and API routes). Un-filtered DB queries degrade server response latency.

*Incorrect:*
```typescript
// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  await db.query(); // ❌ Runs on EVERY request without path filtering!
});
```

*Fix:*
```vue
export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/protected')) return; // Filter targeted routes
  await verifyAuth(event);
});
```

---

### Mistake 3: Attempting to Return Response HTML/JSON Bodies from Server Middleware

**The mistake:** Returning `{ message: 'Blocked' }` inside `server/middleware/guard.ts`.

**Why it's wrong:** Server middleware is designed to inspect or extend `event.context`. Returning a value from server middleware closes the response prematurely without continuing to target route handlers. Throw `createError()` or send redirects.

*Incorrect:*
```typescript
export default defineEventHandler((event) => {
  if (!isAuth) return { error: 'Unauthorized' }; // ❌ Prematurely closes middleware chain!
});
```

*Fix:*
```vue
export default defineEventHandler((event) => {
  if (!isAuth) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
});
```


---

## 5. Practice Exercises

### Exercise 1: Creating Global Request Logging Server Middleware

**Scenario:**
Create a server middleware `server/middleware/logger.ts` logging request URL and execution method for every incoming request.

**Requirements:**
1. Export `defineEventHandler` in `server/middleware/logger.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/middleware/logger.ts
> export default defineEventHandler((event) => {
>   const method = event.method;
>   const url = getRequestURL(event).pathname;
>   
>   console.log(`[Nitro Server Log] ${method} ${url} at ${new Date().toISOString()}`);
> });
> ```
> 
> #### Technical Explanation
>
> 1. Files in `server/middleware/` run automatically on EVERY incoming server HTTP request (both page requests and API requests).
> 2. Server middleware does NOT return responses unless halting execution.
> 3. Ideal for global request logging and telemetry.
> 
---

### Exercise 2: Authenticating Bearer Tokens in Server Middleware

**Scenario:**
Validate authorization header tokens in server middleware, attaching user context to `event.context.user`.

**Requirements:**
1. Attach user data to `event.context.user`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/middleware/auth.ts
> export default defineEventHandler((event) => {
>   const authHeader = getHeader(event, "authorization");
>   
>   if (authHeader && authHeader.startsWith("Bearer ")) {
>     const token = authHeader.substring(7);
>     // Attach decoded user context to H3 event object!
>     event.context.user = { id: 42, role: "admin", token };
>   }
> });
> ```
> 
> #### Technical Explanation
>
> 1. `event.context` is a shared context object passed through the H3 handler lifecycle.
> 2. Server middleware can populate `event.context.user` for downstream API routes to consume.
> 3. Centralized request authentication pattern.
> 
---

### Exercise 3: Selectively Bypassing Middleware on Specific Paths

**Scenario:**
Skip token validation in server middleware when request path starts with `/public/` or `/_nuxt/`.

**Requirements:**
1. Check `event.path` in middleware conditional.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/middleware/auth-guard.ts
> export default defineEventHandler((event) => {
>   const path = event.path;
>   
>   // Skip authentication logic for static assets and public routes
>   if (path.startsWith("/_nuxt") || path.startsWith("/api/public")) {
>     return;
>   }
>   
>   // Perform protected path validation...
> });
> ```
> 
> #### Technical Explanation
>
> 1. Server middleware runs on all static asset and page requests unless explicitly conditionally bypassed.
> 2. Returning early without throwing errors allows execution to continue to target handlers.
> 3. Essential performance guard conditional.
> 
---


## 6. Related Terms
- [Route Middleware](../level_08/route_middleware.md) — The frontend equivalent that runs during Vue router navigation (do not confuse the two!).
- [H3 Request Handlers (`defineEventHandler`)](h3_handlers.md) — The utility `defineEventHandler` used to write the middleware.

---

## 7. Key Takeaways
- Server Middleware runs on the Node server for every single incoming request.
- It is ideal for logging, authentication checks, and setting headers.
- Never `return` a value from middleware unless you explicitly want to block the request.
- You can pass data from middleware to API routes using `event.context`.
