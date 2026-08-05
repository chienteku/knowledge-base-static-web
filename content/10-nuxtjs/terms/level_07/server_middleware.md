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
- **Server-Side Development**

---

## 3. Environment Context
- **Server Only**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Protecting specific routes

**Problem:** Server middleware runs on *every* request, including requests for public CSS files. Write the logic inside a middleware file to only execute a block of auth-checking code if the URL starts with `/api/admin`.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineEventHandler((event) => {
>   // Read the requested URL
>   const url = getRequestURL(event);
>   
>   // Only intercept /api/admin routes
>   if (url.pathname.startsWith('/api/admin')) {
>      const token = getCookie(event, 'token');
>      if (!token) throw createError({ statusCode: 401, message: 'Unauthorized' });
>   }
> });
> ```
> - Read the pathname using the `getRequestURL(event)` helper and conditionally check auth credentials.

---

### Exercise 2: Server Middleware Context Extension Pattern

**Problem:** Write server middleware `server/middleware/user.ts` parsing JWT token cookie and attaching `event.context.user` object.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineEventHandler((event) => {
>   const token = getCookie(event, 'token');
>   if (token) {
>     event.context.user = verifyToken(token);
>   }
> });
> ```
> - Server middleware extends `event.context` for downstream route handlers.
> 
> ```typescript
> // server/middleware/user.ts
> export default defineEventHandler((event) => {
>   const token = getCookie(event, 'auth_token');
>   if (token) {
>     event.context.user = { id: 1, name: 'Alice' }; // Extend context
>   }
> });
> ```

---

### Exercise 3: Server Middleware vs Route Middleware

**Problem:** Contrast Nitro Server Middleware (`server/middleware/`) vs Vue Route Middleware (`middleware/`).

**Expected output:**
> [!check]- Answer
> ```text
> Server Middleware: Executes on Node.js server before Nitro routes for all HTTP requests;
> Route Middleware: Vue Router navigation guard executing on page transitions.
> ```
> - Server Middleware -> Backend Nitro HTTP request interceptor.
> - Route Middleware -> Frontend Vue Router page navigation guard.
> 
> ```text
> server/middleware/ = Nitro Backend; middleware/ = Vue Frontend Router.
> ```


---

## 7. Related Terms
- [Route Middleware](../level_08/route_middleware.md) — The frontend equivalent that runs during Vue router navigation (do not confuse the two!).
- [H3 Request Handlers (`defineEventHandler`)](h3_handlers.md) — The utility `defineEventHandler` used to write the middleware.
---

## 8. Key Takeaways
- Server Middleware runs on the Node server for every single incoming request.
- It is ideal for logging, authentication checks, and setting headers.
- Never `return` a value from middleware unless you explicitly want to block the request.
- You can pass data from middleware to API routes using `event.context`.
