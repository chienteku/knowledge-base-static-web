# `server/api/` Routes

> **Level 7 — Server Engine (Nitro)**
> A dedicated directory for creating custom backend API endpoints that are automatically prefixed with `/api` and feature perfect, out-of-the-box TypeScript typing when fetched from the frontend.

---

## 1. Prerequisites
- [Nitro Engine](../level_01/nitro_engine.md) — The server engine that hosts these files.
- [`$fetch` (ofetch)](../level_05/dollar_fetch.md) — The primary way to consume these API endpoints from the frontend.
- [Express.js (Legacy Node Server Context)](../level_07/express_js.md) — The server pattern Nitro/H3 API routes replace.

---

## 2. Term Category
- **Server-Side Development**

---

## 3. Environment Context
- **Server Only**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: File Naming

**Problem:** You want to create an endpoint that creates a new product in the database. The URL should be `/api/products` and it should strictly only accept `POST` requests. What should the exact file path and name be?

**Expected output:**
> [!check]- Answer
> ```text
> server/api/products.post.ts
> ```
> - Restricting to a specific HTTP method requires appending `.post`, `.get`, etc., to the file path structure within the server api directory.

---

### Exercise 2: Nitro REST API POST Handler Pattern

**Problem:** Write Nitro server handler `server/api/items.post.ts` reading JSON body `{ title }` and returning status HTTP 201 response.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineEventHandler(async (event) => {
>   const body = await readBody(event);
>   setResponseStatus(event, 201);
>   return { success: true, item: body };
> });
> ```
> - `.post.ts` file suffix routes POST HTTP requests automatically.
> 
> ```typescript
> // server/api/items.post.ts
> export default defineEventHandler(async (event) => {
>   const body = await readBody(event);
>   setResponseStatus(event, 201);
>   return {
>     success: true,
>     created: body
>   };
> });
> ```

---

### Exercise 3: Dynamic Route Parameters in Server API Routes

**Problem:** How do you access parameter `id` in dynamic server API file `server/api/users/[id].ts`?

**Expected output:**
> [!check]- Answer
> ```text
> Via getRouterParam(event, 'id') or event.context.params.id.
> ```
> - `getRouterParam(event, 'id')` extracts dynamic route parameters.
> 
> ```typescript
> export default defineEventHandler((event) => {
>   const id = getRouterParam(event, 'id');
>   return { userId: id };
> });
> ```


---

## 7. Related Terms
- [`server/routes/`](../level_07/server_routes.md) — Similar to `api/`, but does not prefix the URL with `/api`.
- [H3 Request Handlers](../level_07/h3_handlers.md) — The utility (`defineEventHandler`) used inside these files.

---

## 8. Key Takeaways
- Files in `server/api/` automatically become backend endpoints at `/api/...`.
- Append the HTTP method to the filename (e.g., `user.post.ts`) to restrict allowed methods.
- Returns are automatically typed and available to `useFetch` on the frontend.
- Simply `return` the data; do not use Express-style `res.send()`.
