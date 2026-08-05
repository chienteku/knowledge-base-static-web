# Nitro Engine

> **Level 1 — Core Concepts & Architecture**
> The ultra-fast, lightweight server engine built specifically for Nuxt 3 that powers API routes, server-side rendering, and cross-platform edge deployments.

---

## 1. Prerequisites
- [Universal Rendering (SSR)](universal_rendering.md) — The process that Nitro performs to generate HTML on the server.
- nodejs — The traditional execution host Nitro abstractly runs on or replaces.
---

## 2. Term Category
- **Server Engine**

---

## 3. Environment Context
- **Server Only** (Or Edge networks).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Creating a Nitro API Route

**Problem:** How do you define a server route in Nitro that returns a boolean value `true`?

**Expected output:**
> [!check]- Answer
> ```typescript
> // Inside server/api/status.ts
> export default defineEventHandler((event) => {
>   return true;
> });
> ```
> - Create a file in `server/api/` containing a default export wrapped in `defineEventHandler()`. Returning JSON is as simple as returning the value itself.

---

### Exercise 2: Nitro Server API Handler Pattern

**Problem:** Write Nitro server handler `server/api/status.ts` returning JSON object `{ status: 'online', timestamp: Date.now() }`.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineEventHandler((event) => { return { status: 'online', timestamp: Date.now() }; });
> ```
> - `defineEventHandler` creates Nitro backend server routes.
> 
> ```typescript
> // server/api/status.ts
> export default defineEventHandler((event) => {
>   return {
>     status: 'online',
>     timestamp: Date.now()
>   };
> });
> ```

---

### Exercise 3: Nitro Cross-Platform Deployment Target

**Problem:** Name 3 serverless/edge deployment platforms supported natively as preset build targets by Nitro.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Vercel (Edge & Serverless)
> 2. Cloudflare Workers / Pages
> 3. AWS Lambda (or Netlify / Node.js standalone)
> ```
> - Vercel, Cloudflare Workers, AWS Lambda, Netlify, Node.js.
> 
> ```text
> Nitro presets compile to multi-cloud serverless and edge runtimes.
> ```


---

## 7. Related Terms
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

## 8. Key Takeaways
- Nitro is the server engine that powers Nuxt 3.
- It handles both Server-Side Rendering (SSR) and API routes.
- It uses the ultra-fast H3 web framework.
- It compiles your backend code to run anywhere: Node.js, Serverless, or the Edge, with zero configuration.
