# Nitro Engine

> **Level 1 — Core Concepts & Architecture**
> The ultra-fast, lightweight server engine built specifically for Nuxt 3 that powers API routes, server-side rendering, and cross-platform edge deployments.

---

## 1. Prerequisites
- [Universal Rendering (SSR)](universal_rendering.md) — The process that Nitro performs to generate HTML on the server.
- [Node.js (Runtime Environment)](../../../05-nodejs/terms/level_01/nodejs.md) — The traditional execution host Nitro abstractly runs on or replaces.

---

## 2. Term Category

**Server & Nitro Engine** (Universal Server Engine): Nitro is Nuxt 3's lightweight, cross-platform server engine that powers API routes, server middleware, and hybrid rendering across any hosting provider.



---

## 3. Explanation

### Environment Context
- **Server Only** (Or Edge networks).

### (1) Design Motivation — "Why did we design this?"
In older versions of Nuxt (and most JavaScript frameworks), the server-side rendering engine was heavily tied to Node.js and frameworks like Express. This meant if you wanted to deploy your application to a modern "Edge" network (like Cloudflare Workers, Vercel Edge, or Deno) which don't run a full Node.js environment, your app simply wouldn't work.

**Nitro** was built from scratch to be completely independent of the Node.js runtime. It uses a universal, minimal API format. When you build your Nuxt app, Nitro compiles your server code into the exact format required by your deployment provider (Node, Serverless, Edge, Cloudflare, etc.) without you changing a single line of code.

### (2) Core Concept
Nitro is the "backend" half of your Nuxt application. It is responsible for:
1. Running the Vue SSR process to return HTML to the browser.
2. Serving the files inside the `server/api/` and `server/routes/` directories.
3. Automatically caching API responses or rendered HTML pages if configured.

Because Nitro is so deeply integrated into Nuxt, when you create an API route in `server/api/users.ts`, Nuxt automatically generates TypeScript types for the response, so your frontend code gets perfect autocomplete when fetching from it.

### (3) H3: The Minimal Web Framework
Under the hood, Nitro uses a library called **H3** to handle HTTP requests. H3 is incredibly fast and minimal. Instead of standard Express patterns (`req, res`), H3 uses `defineEventHandler` where you simply return the data you want to send to the client.

```typescript
// server/api/hello.ts
// Nitro automatically serves this at http://localhost:3000/api/hello

export default defineEventHandler((event) => {
  // You just return JSON. No need to call res.send() or res.json().
  return {
    message: "Hello from Nitro!"
  }
})
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to use Express/Node-specific APIs on the Edge
**The mistake:** Importing standard Node.js modules like `fs` (file system) or `child_process` inside a Nitro API route and then deploying to Cloudflare Workers.

**Why it's wrong:** Edge runtimes do not have access to a hard drive or full Node binaries. If you rely on Node-specific features, your app will crash when deployed to an Edge provider.
**Golden Rule:** If you plan to deploy to the Edge, only use web-standard APIs (like `fetch`, `Request`, `Response`, `URL`) inside your Nitro endpoints.

---

### Mistake 2: Attempting to Import Nitro Server Handlers into Client Vue Components

**The mistake:** Importing `import { defineEventHandler } from 'h3'` inside a `<script setup>` Vue component file.

**Why it's wrong:** Nitro server event handlers operate strictly in the backend server runtime (`server/api/`). Importing H3 server utilities into client components causes compilation errors.

*Incorrect:*
```vue
<script setup>
import { defineEventHandler } from 'h3'; // ❌ Server-only module imported in client!
</script>
```

*Fix:*
```vue
// Keep defineEventHandler in server/api/ files:
// server/api/users.ts
export default defineEventHandler((event) => { return { status: 'ok' }; });
```

---

### Mistake 3: Assuming Nitro Server Storage Cache Persists Across Ephemeral Container Restart

**The mistake:** Storing production user database records in Nitro memory storage (`useStorage('memory')`).

**Why it's wrong:** Memory storage driver is wiped whenever serverless Nitro instances restart. Use persistent storage drivers (Redis, MongoDB, Unstorage FS).

*Incorrect:*
```vue
/* Storing persistent database records in Nitro memory storage driver */
```

*Fix:*
```vue
/* Configure persistent unstorage drivers (Redis/MongoDB) in nuxt.config.ts storage options */
```


---

## 5. Practice Exercises

### Exercise 1: Creating Server API Endpoints with Nitro

**Scenario:**
Create a Nitro server endpoint `server/api/health.ts` returning JSON metadata including timestamp and server status.

**Requirements:**
1. Create `defineEventHandler` in `server/api/health.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/api/health.ts
> export default defineEventHandler((event) => {
>   return {
>     status: "ok",
>     timestamp: new Date().toISOString(),
>     engine: "Nitro"
>   };
> });
> ```

> #### Technical Explanation
>
> 1. Nitro maps files in `server/api/` directly to HTTP API endpoints.
> 2. `defineEventHandler` wraps H3 event context processing for incoming requests.
> 3. Objects returned from event handlers are automatically serialized as JSON responses.

---

### Exercise 2: Processing POST Requests and Request Bodies in Nitro

**Scenario:**
Create a Nitro endpoint `server/api/users.post.ts` handling HTTP POST requests and parsing JSON payload bodies with `readBody()`.

**Requirements:**
1. Export `defineEventHandler` using `readBody(event)`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/api/users.post.ts
> export default defineEventHandler(async (event) => {
>   const body = await readBody(event);
>   
>   if (!body.email) {
>     throw createError({
>       statusCode: 400,
>       statusMessage: "Email is required"
>     });
>   }

  return {
    success: true,
    user: { id: 101, email: body.email }
  };
});
```

> #### Technical Explanation
>
> 1. File suffix `.post.ts` restricts endpoint execution exclusively to HTTP POST requests.
> 2. `readBody(event)` parses JSON payload streams asynchronously.
> 3. `createError()` throws structured HTTP error responses handled automatically by Nitro.

---

### Exercise 3: Cross-Platform Deployment Target Selection

**Scenario:**
Configure `nuxt.config.ts` to build Nitro output targeting Vercel, Node.js server, or Cloudflare Workers.

**Requirements:**
1. Set `nitro.preset` in `nuxt.config.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   nitro: {
>     preset: "node-server" // Or 'vercel', 'cloudflare-pages', 'aws-lambda'
>   }
> });
> ```

> #### Technical Explanation
>
> 1. Nitro abstracts runtime differences across Node.js, Deno, Bun, and serverless edge providers.
> 2. Compiles server code into zero-dependency bundles optimized for the target deployment environment.
> 3. Enables vendor lock-in-free full-stack deployment.

---




---

## 6. Related Terms
- [`server/api/` Routes](../level_07/server_api_routes.md) — How you define endpoints in your project.
- [Edge Deployment](../level_10/edge_deployment.md) — The environments where Nitro truly shines.
- [Nuxt 3 Overview](nuxt_3_overview.md) — Related concept: Nuxt 3 Overview.
- [Universal Rendering (SSR)](universal_rendering.md) — Related concept: Universal Rendering (SSR).
- [Express.js (Legacy Node Server Context)](../level_07/express_js.md) — Related concept: Express.js (Legacy Node Server Context).
- [Edge-Side Rendering (ESR)](../level_09/esr.md) — Related concept: Edge-Side Rendering (ESR).
- [Nuxt DevTools](../level_10/nuxt_devtools.md) — Related concept: Nuxt DevTools.
- [`server/routes/`](../level_07/server_routes.md) — Nitro server routes.
- [H3 Request Handlers (`defineEventHandler`)](../level_07/h3_handlers.md) — H3 event handlers.
- [Standalone Build (Node server)](../level_10/standalone_build.md) — Related concept: Standalone Build (Node server).

---

## 7. Key Takeaways
- Nitro is the server engine that powers Nuxt 3.
- It handles both Server-Side Rendering (SSR) and API routes.
- It uses the ultra-fast H3 web framework.
- It compiles your backend code to run anywhere: Node.js, Serverless, or the Edge, with zero configuration.
