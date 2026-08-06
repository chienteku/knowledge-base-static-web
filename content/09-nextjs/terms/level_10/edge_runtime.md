# Edge Runtime vs Node.js Runtime

> **Level 10 — Advanced Architecture**
> A stripped-down, ultra-fast JavaScript execution environment based on V8 Web APIs, used by Next.js for Middleware and optional Edge Route Handlers.

---

## 1. Prerequisites
- [Middleware (`middleware.ts`)](middleware.md) — The feature that is forced to use the Edge Runtime.
- [V8 Engine](v8_engine.md) — The core JavaScript execution engine the Edge is built upon.

---

## 2. Term Category

**Server & Edge API** (Lightweight Edge Isolate Engine): The Edge Runtime executes middleware and route handlers on V8 isolate engines deployed to global CDN edge networks.



---

## 3. Explanation

### Environment Context
- **Server (Edge)**

### (1) Design Motivation — "Why did we design this?"
A standard Node.js server is powerful. It has access to the computer's file system (`fs`), operating system (`os`), and heavy database drivers. But booting up a Node.js process takes time (Cold Starts), and deploying Node servers to hundreds of data centers around the world is expensive.
The **Edge Runtime** was created by companies like Vercel and Cloudflare. It takes the core V8 JavaScript engine (the same one in Google Chrome), rips out all the heavy Node.js APIs, and leaves only standard Web APIs (`fetch`, `Request`, `Response`, `URL`). 
Because it is so lightweight, an Edge function can boot up in 1 millisecond and be deployed to thousands of servers worldwide (the "Edge" of the network), physically close to the user.

### (2) Where is the Edge Runtime used?
In Next.js, **Middleware** is *strictly required* to run on the Edge. It cannot run on Node.js.
However, you can also optionally opt-in your Route Handlers or Server Components to run on the Edge if you want them to be globally distributed and ultra-fast.

```ts
// app/api/fast-data/route.ts

// 1. Opt this specific route into the Edge runtime!
export const runtime = 'edge'; 

export async function GET() {
  // This will run globally on the Edge, meaning a user in Tokyo gets 
  // the response from a Tokyo server, not a centralized US server.
  return Response.json({ message: "I am speed" });
}
```

### (3) The Limitations of the Edge
The speed comes at a massive cost:
- You cannot read or write files to the disk.
- You cannot use native Node.js modules like `crypto`, `path`, or `child_process`.
- You cannot use NPM packages that rely on Node.js (which includes almost all major database ORMs like Prisma, Sequelize, or Mongoose).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Deploying a database connection to the Edge

**The mistake:** A developer sets `export const runtime = 'edge'` on a `page.tsx`, and then tries to connect to their PostgreSQL database using the `pg` npm library.

**Why it's wrong:** Standard database connections use TCP sockets, which are a Node.js API feature. The Edge Runtime doesn't have TCP sockets. The app will crash.
**Golden Rule:** If you are running code on the Edge Runtime, you can ONLY communicate with external services using HTTP (`fetch`). If you want to talk to a database from the Edge, you must use an HTTP-based database driver (like Supabase, Firebase, or PlanetScale's serverless driver).

---

### Mistake 2: Importing Native Node.js Modules (`fs`, `net`, `crypto`) inside Edge Runtime Routes

**The mistake:** Importing `import fs from 'fs'` in an Edge Runtime route file.

**Why it's wrong:** The Edge Runtime is a V8 JavaScript engine runtime that lacks Node.js C++ bindings. Importing Node.js built-ins causes build compilation failures.

*Incorrect:*
```typescript
export const runtime = 'edge';
import fs from 'fs'; // ❌ Build Error: Node.js module 'fs' not supported in Edge Runtime!
```

*Fix:*
```typescript
// Use Web standard APIs (fetch, Web Crypto, TextEncoder) in Edge Runtime
```

---

### Mistake 3: Exceeding Edge Function Memory or Execution Time Boundaries

**The mistake:** Running long-running tasks (> 30s) inside Edge Middleware.

**Why it's wrong:** Edge functions are designed for sub-50ms HTTP request routing and headers modification. Long execution times cause requests to be aborted.

*Incorrect:*
```tsx
/* Running 30-second image conversion task inside Edge Middleware */
```

*Fix:*
```tsx
/* Offload long tasks to Node.js serverless functions or background queues */
```


---

## 5. Practice Exercises

### Exercise 1: Specifying Edge Runtime in Route Handlers

**Scenario:**
Configure an API Route Handler to execute on the Edge Runtime using `export const runtime = 'edge'`.

**Requirements:**
1. Export `runtime = "edge"` in `route.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/api/geo/route.ts
> export const runtime = "edge";
> 
> export async function GET(req: Request) {
>   const country = req.headers.get("x-vercel-ip-country") || "Unknown";
>   return Response.json({ country, engine: "V8 Edge Isolate" });
> }
> ```
> 
> #### Technical Explanation
>
> 1. `export const runtime = 'edge'` compiles the route handler for execution on lightweight V8 edge isolates.
> 2. Deploys handlers globally near end users, reducing latency and cold starts.
> 3. Restricted to Web-standard APIs (`fetch`, `Request`, `Response`, `Crypto`).
> 
---

### Exercise 2: Auditing Edge Runtime Node.js Module Restrictions

**Scenario:**
Explain why importing Node.js built-in modules (`fs`, `child_process`, `net`) in Edge Runtime handlers throws a compilation error.

**Requirements:**
1. Detail V8 edge isolate runtime limitations.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Edge Runtime Limitation:
> ❌ import fs from 'node:fs'; // FAILS: Native C++ Node.js modules do not exist on Edge V8 isolates.
> ✅ Use Web-standard APIs: fetch(), TransformStream, crypto.subtle, TextEncoder.
> ```
> 
> #### Technical Explanation
>
> 1. Edge runtimes run on stripped-down V8 JavaScript engines without Node.js C++ bindings.
> 2. Standard Web APIs guarantee cross-platform compatibility across Cloudflare Workers, Vercel Edge, and browsers.
> 3. Core rule for edge-native Next.js development.
> 
---

### Exercise 3: Comparative Analysis: Node.js Runtime vs Edge Runtime

**Scenario:**
Formulate an architectural selection decision matrix comparing Node.js Runtime vs Edge Runtime.

**Requirements:**
1. Contrast npm package support, cold start speed, latency, and ORM compatibility.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Runtime Selection Matrix:
> - Node.js Runtime (Default): Full Node.js API & npm compatibility (Prisma, fs, native C packages), slightly higher cold starts. Use for DB operations & heavy server logic.
> - Edge Runtime (runtime = 'edge'): Ultra-low latency, zero cold starts, Web-standard APIs ONLY (no fs/native C ORMs). Use for geo-routing, A/B testing, lightweight proxying.
> ```
> 
> #### Technical Explanation
>
> 1. Node.js runtime is preferred for database access and heavy server computations.
> 2. Edge runtime is preferred for ultra-fast global request routing and light API proxies.
> 3. Fundamental platform runtime choice.
> 
---


## 6. Related Terms
- [Middleware (`middleware.ts`)](middleware.md) — The primary consumer of the Edge Runtime.
- [Route Handlers (`route.ts`)](../level_07/route_handlers.md) — Can optionally be opted into the Edge.
- [Serverless Functions](serverless_functions.md) — Related concept: Serverless Functions.
- [V8 Engine](v8_engine.md) — Related concept: V8 Engine.

---

## 7. Key Takeaways
- The **Edge Runtime** is an ultra-fast, lightweight JavaScript environment based on standard Web APIs rather than Node.js APIs.
- Next.js Middleware is forced to run on the Edge to ensure fast interception of requests.
- You can manually opt pages or API routes into the Edge by exporting `const runtime = 'edge'`.
- You **cannot** use native Node modules, read the file system, or use standard database drivers (TCP) on the Edge.
