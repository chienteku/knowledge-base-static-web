# Edge Deployment

> **Level 10 — Error Handling & Production**
> The practice of deploying a Nuxt application to global, serverless edge platforms, allowing Server-Side Rendering (SSR) and API routes to execute inside CDN nodes.

---

## 1. Prerequisites
- [Edge-Side Rendering (ESR)](../level_09/esr.md) — The rendering logic that Edge Deployment runs.
- [Nitro Engine](../level_01/nitro_engine.md) — The build engine that compiles edge targets.

---

## 2. Term Category

**Performance & Optimization** (Serverless Edge Platform Deployment): Edge Deployment compiles Nitro server handlers into WebAssembly or V8 isolates hosted on global edge networks (Vercel, Cloudflare, Netlify).



---

## 3. Explanation

### Environment Context
- **Server Only** (Hosted on serverless CDN environments).

### (1) Design Motivation — "Why did we design this?"
Hosting a Node.js server on a Virtual Private Server (VPS) is the traditional way to deploy full-stack apps. However, VPS deployments introduce operational overhead:
-   You must configure and update operating systems.
-   You must configure reverse proxies (like Nginx) and SSL certificates.
-   You must handle load-balancing and scaling to manage traffic spikes.

**Edge Deployment** solves this. Instead of a single persistent virtual server, you compile your Nuxt application into lightweight serverless functions and host them directly on global CDN providers (like Cloudflare Pages, Vercel, Netlify, or Deno Deploy). 

---

### (2) VPS vs Edge Hosting
| Feature | VPS Deployment (Standalone Node) | Edge Deployment (V8 Serverless) |
| :--- | :--- | :--- |
| **Server State** | Persistent (Runs 24/7) | Ephemeral (Spins up on request) |
| **Global Delivery** | Centralized (Requests hit one region) | Distributed (Requests hit nearest CDN node) |
| **Scaling** | Manual or auto-scaling clusters | Automatic (Handles traffic spikes instantly) |
| **Maintenance** | High (Docker, PM2, OS updates) | Low (Zero-config platform hosting) |

---

### (3) Edge Cold Starts
Traditional serverless environments (like standard AWS Lambda containers) suffer from "cold starts." If no request has hit the container recently, it shuts down. The next request must wait several seconds for the container to boot.

Edge Deployment platforms bypass this by utilizing **V8 Isolates** instead of full container images. V8 Isolates boot up in under 10 milliseconds, making cold starts imperceptible to the end user.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to use standard TCP database sockets

**The mistake:** Connecting to a traditional PostgreSQL or MySQL database using a standard TCP library (like pg or mysql2) inside server routes deployed to Cloudflare Workers or Vercel Edge:

```typescript
// server/api/users.ts
import { Client } from 'pg'; // ❌ Throws TCP socket exceptions on the Edge!

export default defineEventHandler(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect(); // Fails!
  const res = await client.query('SELECT * FROM users');
  return res.rows;
});
```

**Why it's wrong:** V8 Isolate runtimes running on Edge nodes do not support raw TCP socket connections. They restrict outgoing network connections to HTTP/HTTPS.

**Golden Rule:** When deploying to the Edge, you must use HTTP-based connection pools, serverless database drivers (like Neon's serverless driver or Cloudflare Hyperdrive), or a data proxy (such as Prisma Accelerate).

---

### Mistake 2: Attempting to Use C++ Node.js Modules (`fs`, `child_process`) in Edge Deployments

**The mistake:** Deploying a project to Cloudflare Pages that uses Node.js `fs.readFileSync()`.

**Why it's wrong:** Edge environments run on lightweight V8 runtimes that do NOT support Node.js C++ bindings. Use Web Standard APIs (`fetch`, `WebCrypto`) or Nitro storage abstraction (`useStorage()`).

*Incorrect:*
```vue
// server/api/read.ts
import fs from 'fs'; // ❌ Build compilation failure on Edge presets!
```

*Fix:*
```vue
// Use Web Standard fetch or Nitro unstorage drivers:
const data = await useStorage().getItem('key');
```

---

### Mistake 3: Caching User-Specific Private API Responses on Public Edge CDN Nodes

**The mistake:** Setting `Cache-Control: public, max-age=3600` on private `/api/user-profile` routes.

**Why it's wrong:** Setting `public` cache headers allows shared Edge CDN nodes to cache User A's private response and serve it to User B. Use `private, no-store` for private user data.

*Incorrect:*
```vue
setHeader(event, 'Cache-Control', 'public, max-age=3600'); // ❌ Exposes private user data on CDN!
```

*Fix:*
```vue
setHeader(event, 'Cache-Control', 'private, no-store'); // Prevents CDN edge caching
```


---

## 5. Practice Exercises

### Exercise 1: Configuring Edge Targets in Nitro

**Scenario:**
Configure `nuxt.config.ts` for Vercel Edge functions deployment.

**Requirements:**
1. Set `nitro.preset: "vercel-edge"`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   nitro: {
>     preset: "vercel-edge"
>   }
> });
> ```
> 
> #### Technical Explanation
>
> 1. `preset: "vercel-edge"` instructs Nitro to compile server handlers into V8 edge isolate code.
> 2. Deploys server logic to global CDN edge nodes near end users.
> 3. Lowers latency and eliminates traditional cold start delays.
> 
---

### Exercise 2: Auditing Edge-Compatible Node Dependencies

**Scenario:**
Audit third-party npm packages to ensure they do not depend on Node.js native C++ modules.

**Requirements:**
1. Replace Node `fs` or `crypto` imports with Web APIs (`fetch`, `Web Crypto`).

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/api/hash.ts
> export default defineEventHandler(async (event) => {
>   const body = await readBody(event);
>   
>   // Use Web-standard Crypto API compatible with Edge V8 Isolates!
>   const encoder = new TextEncoder();
>   const data = encoder.encode(body.text);
>   const hashBuffer = await crypto.subtle.digest("SHA-256", data);
>   
>   return { hashHex: Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("") };
> });
> ```
> 
> #### Technical Explanation
>
> 1. Edge runtimes lack full Node.js standard libraries (`node:fs`, `node:child_process`).
> 2. Web-standard APIs (`crypto.subtle`, `TextEncoder`) run seamlessly on Edge isolates, Cloudflare Workers, and Node.js.
> 3. Edge-ready API development standard.
> 
---

### Exercise 3: Setting Edge Cache Headers in Nitro Handlers

**Scenario:**
Configure Edge CDN cache headers (`Cache-Control: s-maxage=3600`) inside a server route handler.

**Requirements:**
1. Use `setResponseHeader(event, "Cache-Control", ...)`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/api/cdn-data.ts
> export default defineEventHandler((event) => {
>   // Instruct Edge CDN to cache response for 1 hour
>   setResponseHeader(event, "Cache-Control", "public, s-maxage=3600, stale-while-revalidate=60");
>   
>   return { data: "Cached Edge Payload" };
> });
> ```
> 
> #### Technical Explanation
>
> 1. `s-maxage=3600` instructs Edge CDN nodes to cache the response payload for 3600 seconds.
> 2. `stale-while-revalidate=60` allows CDN to serve stale content while fetching fresh updates in the background.
> 3. High performance Edge caching pattern.
> 
---


## 6. Related Terms
- [Edge-Side Rendering (ESR)](../level_09/esr.md) — The architecture used to execute edge code.
- [Standalone Build (Node server)](standalone_build.md) — The centralized alternative to edge deployments.
- [Nitro Engine](../level_01/nitro_engine.md) — Related concept: Nitro Engine.

---

## 7. Key Takeaways
- Edge Deployment distributes your server rendering globally across CDN nodes.
- Popular platforms include Cloudflare Pages, Vercel Edge, and Netlify.
- Edge runtimes use V8 Isolates, which have near-zero cold start times.
- VPS hosting runs persistently; Edge hosting runs on-demand.
- Do not use traditional TCP database connections in edge functions; use HTTP/websocket adapters instead.
