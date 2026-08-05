# Edge-Side Rendering (ESR)

> **Level 9 — Advanced Rendering & Architecture**
> A rendering strategy where Server-Side Rendering (SSR) is executed inside serverless V8 runtimes running on regional CDN edge nodes closest to the user, drastically lowering latency and time to first byte.

---

## 1. Prerequisites
- [Nitro Engine](../level_01/nitro_engine.md) — The compiler engine that enables deployment to Edge runtimes.
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The server-side rendering logic executed at the edge nodes.
---

## 2. Term Category
- **Rendering Strategies**

---

## 3. Environment Context
- **Server Only** (Executed strictly inside remote CDN serverless edge runtimes like Cloudflare Workers or Vercel Edge).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

### Mistake 4: Using Full Node.js Core Modules (`fs`, `child_process`) in Edge Side Rendering (ESR) Builds

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

### Mistake 5: Assuming ESR Edge Functions Have Unlimited CPU Execution Times

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

### Mistake 6: Using Full Node.js Core Modules (`fs`, `child_process`) in Edge Side Rendering (ESR) Builds

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

### Mistake 7: Assuming ESR Edge Functions Have Unlimited CPU Execution Times

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

## 6. Practice Exercises

### Exercise 1: Nitro Preset Config

**Problem:** You are deploying your Nuxt application to Cloudflare Pages. Write the build configuration block in `nuxt.config.ts` to instruct Nitro to compile the application for the `cloudflare-pages` preset.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineNuxtConfig({
>   nitro: {
>     preset: 'cloudflare-pages'
>   }
> })
> ```
> - Specify the target platform name inside the `nitro.preset` property in the config.

---

### Exercise 2: ESR Nitro Preset Configuration

**Problem:** Write `nuxt.config.ts` setting Nitro preset to `'cloudflare-pages'` for Edge Side Rendering.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineNuxtConfig({
>   nitro: {
>     preset: 'cloudflare-pages'
>   }
> });
> ```
> - `nitro.preset` compiles project output to Edge runtimes.
> 
> ```typescript
> export default defineNuxtConfig({
>   nitro: {
>     preset: 'cloudflare-pages'
>   }
> });
> ```

---

### Exercise 3: ESR Global Edge Network Benefit

**Problem:** Why does Edge Side Rendering (ESR) dramatically lower TTFB latency for global users?

**Expected output:**
> [!check]- Answer
> ```text
> ESR executes HTML rendering and API logic on CDN PoP nodes located geographically close to the user, eliminating physical network distance roundtrips.
> ```
> - Executes rendering logic in CDN PoP data centers nearest to the user.
> 
> ```text
> User Request -> Nearest CDN Edge Node (Renders HTML) -> User Response
> ```


---

## 7. Related Terms
- [Nitro Engine](../level_01/nitro_engine.md) — The engine that compiles the edge-compatible output.
- [Hybrid Rendering](hybrid_rendering.md) — The routing system that coordinates edge caching.
- [Edge Deployment](../level_10/edge_deployment.md) — Related concept: Edge Deployment.
---

## 8. Key Takeaways
- ESR runs server rendering inside regional V8 runtimes closest to the user.
- It bypasses global network latency to deliver near-zero Time to First Byte (TTFB).
- It is enabled by Nitro compiling the server code into Edge V8 sandboxes.
- Do not use Node.js built-ins (`fs`, `path`) or raw TCP drivers inside Edge server routes.
- Pair ESR with SWR rules to store compiled page HTML inside CDN edge caches.
