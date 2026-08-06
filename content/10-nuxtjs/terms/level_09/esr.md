# Edge-Side Rendering (ESR)

> **Level 9 — Advanced Rendering & Architecture**
> A rendering strategy where Server-Side Rendering (SSR) is executed inside serverless V8 runtimes running on regional CDN edge nodes closest to the user, drastically lowering latency and time to first byte.

---

## 1. Prerequisites
- [Nitro Engine](../level_01/nitro_engine.md) — The compiler engine that enables deployment to Edge runtimes.
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The server-side rendering logic executed at the edge nodes.

---

## 2. Term Category

**Rendering Strategy** (Edge-Side Rendering Architecture): Edge-Side Rendering (ESR) deploys Nitro server handlers to global edge networks (Cloudflare Workers, Vercel Edge) to render HTML close to end users.



---

## 3. Explanation

### Environment Context
- **Server Only** (Executed strictly inside remote CDN serverless edge runtimes like Cloudflare Workers or Vercel Edge).

### (1) Design Motivation — "Why did we design this?"
In traditional Server-Side Rendering (SSR), your Node.js application runs on a single server or cluster in a specific data center (e.g., Virginia, USA). 

If a user from Tokyo visits your site, their request must travel across the Pacific Ocean, hit your server, wait for rendering, and travel all the way back. This creates a physical latency bottleneck (high TTFB - Time to First Byte) that no amount of code optimization can solve.

**Edge-Side Rendering (ESR)** solves this by distributing the rendering work globally. Instead of a centralized server, your SSR code is deployed to hundreds of CDN (Content Delivery Network) edge locations around the world. When a user in Tokyo requests a page, the closest edge node renders the HTML instantly, bypassing global latency.

---

### (2) The Role of Nitro
Traditional Node.js frameworks cannot run at the edge because edge platforms (like Cloudflare Workers, Vercel Edge, or Deno Deploy) do not use Node.js. Instead, they use lightweight, secure **V8 Isolates** that implement standard Web APIs (`fetch`, `Request`, `Response`).

Nuxt 3's **Nitro server engine** compiles your application into target-agnostic bundles. When you configure a deployment preset, Nitro automatically adapts your server API routes and SSR code to run flawlessly on the target edge platform.

---

### (3) Edge-Side Caching (SWR at the Edge)
When combined with **Hybrid Rendering**, ESR becomes exceptionally powerful. If you apply a Stale-While-Revalidate rule (`swr: 60`), Nitro caches the rendered HTML directly in the edge node's local Key-Value (KV) cache. Subsequent users hitting that specific CDN node receive the cached HTML page instantly, just like static files, while Nitro re-renders stale content in the background.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Importing Node.js built-in modules in Edge routes

**The mistake:** Using Node-specific modules (like `fs`, `path`, or `process`) or standard Node database libraries inside your Nitro server routes when deploying to an Edge runtime:

```typescript
// server/api/read-config.ts
import fs from 'node:fs'; // ❌ Fails on Edge!

export default defineEventHandler((event) => {
  // fs.readFileSync will throw a runtime error in V8 edge environments
  const file = fs.readFileSync('./config.json', 'utf-8');
  return JSON.parse(file);
});
```

**Why it's wrong:** Edge platforms do not support the Node.js filesystem (`fs`) or standard TCP sockets. They operate under strict sandbox restrictions.

**Golden Rule:** Keep your server routes lightweight and platform-agnostic. Use `unstorage` for filesystem-like caching and utilize HTTP-based API database connectors (like Prisma Accelerate or Neon serverless drivers) for edge compatibility.

---



### Mistake 2: Using Full Node.js Core Modules (`fs`, `child_process`) in Edge Side Rendering (ESR) Builds

**The mistake:** Configuring Nitro preset `nitro: { preset: 'cloudflare-pages' }` while importing Node `fs` in server routes.

**Why it's wrong:** Edge environments (Cloudflare Workers, Vercel Edge) run on lightweight V8 engines that do NOT support Node.js C++ bindings like `fs`. Use Web Standard APIs (`fetch`, `crypto`, `WebStreams`).

*Incorrect:*
```typescript
// server/api/file.ts on Cloudflare Pages preset
import fs from 'fs'; // ❌ Build Error: Node module 'fs' not supported in Edge Runtime!
```

*Fix:*
```vue
// Use Web Standard APIs or persistent storage drivers (useStorage('kv'))
```

---



### Mistake 3: Assuming ESR Edge Functions Have Unlimited CPU Execution Times

**The mistake:** Running 60-second video encoding scripts inside an Edge Side Rendered route.

**Why it's wrong:** Edge networks enforce strict CPU limits (e.g. 50ms CPU time). Exceeding CPU limits causes Edge function termination. Offload heavy processing to standard Node.js serverless functions.

*Incorrect:*
```vue
/* Running 60-second video processing script inside Edge route */
```

*Fix:*
```vue
/* Execute heavy processing tasks in standard Node.js serverless functions */
```


---




---

## 5. Practice Exercises

### Exercise 1: Configuring Edge Deployment Presets in Nitro

**Scenario:**
Configure `nuxt.config.ts` to target Cloudflare Pages edge deployment using Nitro preset settings.

**Requirements:**
1. Set `nitro.preset: "cloudflare-pages"`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   nitro: {
>     preset: "cloudflare-pages" // Or 'vercel-edge', 'deno-deploy', 'netlify-edge'
>   }
> });
> ```

> #### Technical Explanation
>
> 1. Edge-Side Rendering (ESR) executes Nitro server handlers on global CDN edge nodes.
> 2. `preset: "cloudflare-pages"` compiles server code into lightweight WebAssembly/V8 isolates.
> 3. Reduces TTFB (Time-To-First-Byte) latency by rendering HTML geographically close to users.

---

### Exercise 2: Accessing Edge Request Context Objects

**Scenario:**
Access request geo-location data provided by edge runtime headers (`cf-ipcountry` or `x-vercel-ip-country`).

**Requirements:**
1. Read edge headers using `getHeader()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/api/geo.ts
> export default defineEventHandler((event) => {
>   // Read geo-location headers attached by edge networks
>   const country = getHeader(event, "cf-ipcountry") || getHeader(event, "x-vercel-ip-country") || "US";
>   
>   return { country };
> });
> ```

> #### Technical Explanation
>
> 1. Edge networks attach client geo-location metadata to incoming HTTP request headers.
> 2. `getHeader()` reads custom edge headers inside Nitro event handlers.
> 3. Enables instant localized edge HTML rendering.

---

### Exercise 3: Optimizing Edge Bundle Sizes

**Scenario:**
Explain why heavy Node.js built-in modules (`fs`, `child_process`) must be avoided when deploying to Edge runtime isolates.

**Requirements:**
1. Detail V8 edge isolate runtime limitations.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Edge Runtime Bundle Rules:
> - Edge isolates (V8 isolates) lack full Node.js C++ bindings (no fs, child_process, or native C modules).
> - Solution: Use web-standard APIs (fetch, Request, Response, TransformStream, Web Crypto API) inside Nitro handlers.
> ```

> #### Technical Explanation
>
> 1. Edge runtimes execute on lightweight JS engine workers rather than full Node.js servers.
> 2. Standard Web APIs (`fetch`, `crypto`) guarantee cross-platform edge compatibility.
> 3. Essential rule for building edge-ready Nuxt applications.

---




---

## 6. Related Terms
- [Nitro Engine](../level_01/nitro_engine.md) — The engine that compiles the edge-compatible output.
- [Hybrid Rendering](hybrid_rendering.md) — The routing system that coordinates edge caching.
- [Edge Deployment](../level_10/edge_deployment.md) — Related concept: Edge Deployment.

---

## 7. Key Takeaways
- ESR runs server rendering inside regional V8 runtimes closest to the user.
- It bypasses global network latency to deliver near-zero Time to First Byte (TTFB).
- It is enabled by Nitro compiling the server code into Edge V8 sandboxes.
- Do not use Node.js built-ins (`fs`, `path`) or raw TCP drivers inside Edge server routes.
- Pair ESR with SWR rules to store compiled page HTML inside CDN edge caches.
