# `server/api/` Routes

> **Level 7 — Server Engine (Nitro)**
> A dedicated directory for creating custom backend API endpoints that are automatically prefixed with `/api` and feature perfect, out-of-the-box TypeScript typing when fetched from the frontend.

---

## 1. Prerequisites
- [Nitro Engine](../level_01/nitro_engine.md) — The server engine that hosts these files.
- [`$fetch` (ofetch)](../level_05/dollar_fetch.md) — The primary way to consume these API endpoints from the frontend.
- [Express.js (Legacy Node Server Context)](express_js.md) — The server pattern Nitro/H3 API routes replace.

---

## 2. Term Category

**Server & Nitro Engine** (JSON API Endpoints): Server API Routes in `server/api/` handle backend REST/JSON API endpoints, processing HTTP GET/POST/PUT/DELETE requests.



---

## 3. Explanation

### Environment Context
- **Server Only**

### (1) Design Motivation — "Why did we design this?"
In a typical Vue application, if you need a backend to talk to a database, you have to build a completely separate Node.js project (like an Express app). You must manage two repositories, configure CORS, and manually share TypeScript interfaces between the frontend and backend.

Nuxt 3 solves this by providing a first-class backend right inside the same repository via the `server/` directory. Any file placed inside `server/api/` automatically becomes a serverless function/endpoint that your frontend can query.

### (2) Core Concept
To create an API endpoint, you export an event handler using `defineEventHandler`.

```typescript
// server/api/hello.ts
export default defineEventHandler((event) => {
  return {
    message: "Hello World"
  }
})
```
Nuxt automatically maps this file to the URL: `http://localhost:3000/api/hello`.

### (3) HTTP Methods via File Naming
If you want an endpoint to only accept specific HTTP methods (like `POST` or `PUT`), you append the method to the filename.

```text
server/
└── api/
    ├── users.get.ts     # Only handles GET /api/users
    ├── users.post.ts    # Only handles POST /api/users
    └── [id].delete.ts   # Only handles DELETE /api/123
```

### (4) End-to-End Type Safety
The most powerful feature of `server/api/` is implicit type safety. When you fetch an endpoint using `useFetch('/api/hello')` in your Vue components, Nuxt automatically inspects the backend file, sees that it returns `{ message: string }`, and strictly types your frontend `data` variable.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Returning raw `res.send()` or `res.json()`
**The mistake:** Trying to use traditional Express.js syntax inside a Nitro API route.

**Why it's wrong:** Nitro uses H3, which is designed to be minimal and return-driven. Calling `res.send()` breaks the TypeScript return inference and goes against the H3 standard.
**Golden Rule:** Just `return` the data directly (JSON object, string, or boolean). H3 automatically sets the correct `Content-Type` and status codes for you.

*Incorrect:*
```typescript
export default defineEventHandler((event) => {
  event.res.statusCode = 200;
  event.res.end(JSON.stringify({ success: true }));
})
```

*Fix:*
```typescript
export default defineEventHandler((event) => {
  return { success: true };
})
```

---

### Mistake 2: Omitting `.get.ts`, `.post.ts` Suffixes When Structuring REST API Method Routing

**The mistake:** Creating `server/api/users.ts` handling both GET and POST requests with manual `if (req.method === 'POST')` checks.

**Why it's wrong:** Nitro supports file-based HTTP method routing using `.get.ts`, `.post.ts`, `.delete.ts` suffixes (e.g. `server/api/users.post.ts`), keeping method handlers clean and separated.

*Incorrect:*
```typescript
// server/api/users.ts
export default defineEventHandler((event) => {
  if (event.node.req.method === 'POST') { ... } // ❌ Manual method branching!
});
```

*Fix:*
```vue
// Create separate method files:
// server/api/users.get.ts for GET requests
// server/api/users.post.ts for POST requests
```

---

### Mistake 3: Placing API Route Files in `server/routes/` Instead of `server/api/` (Missing `/api/` Prefix)

**The mistake:** Creating `server/routes/users.ts` expecting URL path to be `/api/users`.

**Why it's wrong:** Files in `server/api/users.ts` automatically prepend `/api/` to the URL route (`/api/users`). Files in `server/routes/users.ts` resolve to `/users` without the `/api/` prefix.

*Incorrect:*
```vue
// server/routes/users.ts ❌ Resolves to /users, NOT /api/users!
```

*Fix:*
```vue
// server/api/users.ts Resolves automatically to /api/users
```


---

## 5. Practice Exercises

### Exercise 1: Handling HTTP Method Specific API Routes

**Scenario:**
Create explicit GET and DELETE endpoints for `/api/products` using file suffixes.

**Requirements:**
1. Create `server/api/products.get.ts` and `server/api/products.delete.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/api/products.get.ts
> export default defineEventHandler(() => {
>   return [
>     { id: 1, name: "Keyboard" },
>     { id: 2, name: "Mouse" }
>   ];
> });
> ```

> ```typescript
> // server/api/products.delete.ts
> export default defineEventHandler(async (event) => {
>   const query = getQuery(event);
>   return { deletedId: query.id, success: true };
> });
> ```

> #### Technical Explanation
>
> 1. File suffixes `.get.ts`, `.post.ts`, `.put.ts`, `.delete.ts` automatically bind route handlers to specific HTTP methods.
> 2. Returning non-matching HTTP methods throws an automatic 450/405 Method Not Allowed error.
> 3. Idiomatic REST API structure in Nuxt 3.

---

### Exercise 2: Implementing Server-Side Error Handling with `createError()`

**Scenario:**
Validate API payload input and throw an HTTP 400 Bad Request error if required fields are missing.

**Requirements:**
1. Throw `createError({ statusCode: 400, message: '...' })`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/api/contact.post.ts
> export default defineEventHandler(async (event) => {
>   const body = await readBody(event);
>   
>   if (!body.email || !body.message) {
>     throw createError({
>       statusCode: 400,
>       statusMessage: "Bad Request: Email and message are required fields."
>     });
>   }
>   
>   return { sent: true };
> });
> ```

> #### Technical Explanation
>
> 1. `createError()` constructs an H3 error object containing `statusCode` and `statusMessage`.
> 2. Nitro formats errors into standardized JSON response payloads for API clients.
> 3. Standard API error handling pattern.

---

### Exercise 3: Proxying External Third-Party APIs

**Scenario:**
Proxy a request to an external third-party API service while hiding private API credentials using `proxyRequest()`.

**Requirements:**
1. Execute `proxyRequest(event, targetUrl)`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/api/weather.ts
> export default defineEventHandler((event) => {
>   const config = useRuntimeConfig(event);
>   const targetUrl = `https://api.weather.com/v1?apiKey=${config.weatherApiKey}`;
>   
>   return proxyRequest(event, targetUrl);
> });
> ```

> #### Technical Explanation
>
> 1. `proxyRequest()` streams incoming request parameters directly to a target external URL.
> 2. Keeps private API keys (`weatherApiKey`) isolated on the backend server.
> 3. Prevents exposing third-party API credentials to client browser bundles.

---




---

## 6. Related Terms
- [`server/routes/`](server_routes.md) — Similar to `api/`, but does not prefix the URL with `/api`.
- [H3 Request Handlers (`defineEventHandler`)](h3_handlers.md) — The utility (`defineEventHandler`) used inside these files.
- [Nitro Engine](../level_01/nitro_engine.md) — Related concept: Nitro Engine.
- [Nitro Storage Layer (unstorage)](storage_layer.md) — Related concept: Nitro Storage Layer (unstorage).

---

## 7. Key Takeaways
- Files in `server/api/` automatically become backend endpoints at `/api/...`.
- Append the HTTP method to the filename (e.g., `user.post.ts`) to restrict allowed methods.
- Returns are automatically typed and available to `useFetch` on the frontend.
- Simply `return` the data; do not use Express-style `res.send()`.
