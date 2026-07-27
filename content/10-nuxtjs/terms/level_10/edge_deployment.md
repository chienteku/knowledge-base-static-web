# Edge Deployment

> **Level 10 — Error Handling & Production**
> The practice of deploying a Nuxt application to global, serverless edge platforms, allowing Server-Side Rendering (SSR) and API routes to execute inside CDN nodes.

---

## 1. Prerequisites
- [Edge-Side Rendering (ESR)](../level_09/esr.md) — The rendering logic that Edge Deployment runs.
- [Nitro Engine](../level_01/nitro_engine.md) — The build engine that compiles edge targets.

---

## 2. Term Category
- **Deployment**

---

## 3. Environment Context
- **Server Only** (Hosted on serverless CDN environments).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Database Adapter Choice

**Problem:** You are deploying a Nuxt application to Vercel Edge and need to query a PostgreSQL database. Which database connection method is edge-compatible: a standard TCP library (`pg`), or Neon's serverless driver using HTTP websockets?

**Expected output:**
```text
Neon's serverless driver using HTTP websockets.
Standard TCP libraries like `pg` require raw TCP socket access, which is blocked by Edge V8 isolates. Neon's driver uses HTTP/websockets to bypass this restriction.
```

> [!check]- Answer
> - Consider which network protocols are allowed inside V8 edge sandboxes.

---

### Exercise 2: Edge Preset Configuration

**Problem:** Write `nuxt.config.ts` Nitro preset setting for Cloudflare Workers edge deployment.

**Expected output:**
```typescript
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-module'
  }
});
```

> [!check]- Answer
> - `nitro.preset` compiles project output for specific edge providers.
> 
> ```typescript
> export default defineNuxtConfig({
>   nitro: {
>     preset: 'cloudflare-module'
>   }
> });
> ```

---

### Exercise 3: Edge Cold Start Performance

**Problem:** How do Edge deployments achieve sub-5ms cold start times compared to standard Node.js serverless functions?

**Expected output:**
```text
Edge platforms use V8 isolate contexts instead of spinning up heavy virtualized Node.js container environments.
```

> [!check]- Answer
> - V8 isolates start in sub-5ms by skipping heavy Node container initialization.
> 
> ```text
> V8 Isolates = Sub-5ms Cold Start Execution
> ```


---

## 7. Related Terms
- [Edge-Side Rendering (ESR)](../level_09/esr.md) — The architecture used to execute edge code.
- [Standalone Build (Node server)](../level_10/standalone_build.md) — The centralized alternative to edge deployments.

---

## 8. Key Takeaways
- Edge Deployment distributes your server rendering globally across CDN nodes.
- Popular platforms include Cloudflare Pages, Vercel Edge, and Netlify.
- Edge runtimes use V8 Isolates, which have near-zero cold start times.
- VPS hosting runs persistently; Edge hosting runs on-demand.
- Do not use traditional TCP database connections in edge functions; use HTTP/websocket adapters instead.
