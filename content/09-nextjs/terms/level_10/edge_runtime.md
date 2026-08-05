# Edge Runtime vs Node.js Runtime

> **Level 10 — Advanced Architecture**
> A stripped-down, ultra-fast JavaScript execution environment based on V8 Web APIs, used by Next.js for Middleware and optional Edge Route Handlers.

---

## 1. Prerequisites
- [Middleware (`middleware.ts`)](middleware.md) — The feature that is forced to use the Edge Runtime.
- [V8 Engine](v8_engine.md) — The core JavaScript execution engine the Edge is built upon.
---

## 2. Term Category
- **Infrastructure / Runtime**

---

## 3. Environment Context
- **Server (Edge)**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: JWT Verification

**Problem:** You need to verify a JSON Web Token in your `middleware.ts`. You normally use the `jsonwebtoken` npm package, but it relies on the Node.js `crypto` module. What do you do?

**Expected output:**
> [!check]- Answer
> ```text
> You cannot use `jsonwebtoken`. 
> Instead, you must use a library specifically built for the Edge Runtime that utilizes the standard Web `crypto.subtle` API, such as the `jose` npm package.
> ```
> - The Edge only has access to browser-like Web APIs.

---

### Exercise 2: Edge Web Standard Crypto Usage

**Problem:** Write Edge Route Handler using Web Standard `crypto.subtle` or `crypto.randomUUID()`.

**Expected output:**
> [!check]- Answer
> ```typescript
> export const runtime = 'edge'; export async function GET() { const id = crypto.randomUUID(); return Response.json({ id }); }
> ```
> - Edge Runtime relies on Web Standard APIs (`crypto`, `fetch`, `Headers`).
> 
> ```typescript
> export const runtime = 'edge';
> 
> export async function GET() {
>   const uuid = crypto.randomUUID();
>   return Response.json({ uuid });
> }
> ```

---

### Exercise 3: Edge vs Node.js Runtime Matrix

**Problem:** Compare Edge Runtime vs Node.js Runtime across:
1. Cold start latency
2. Node.js API compatibility
3. Maximum execution time

**Expected output:**
> [!check]- Answer
> ```text
> 1. Edge: Near-zero (sub-5ms); Node.js: 100-500ms cold starts
> 2. Edge: Web Standards only; Node.js: Full C++ API modules (fs, net)
> 3. Edge: Short (30s max); Node.js: Up to 15 minutes
> ```
> - Edge -> Zero cold start, Web APIs only, short execution.
> - Node.js -> Cold start latency, full Node C++ modules, long execution.
> 
> ```text
> Edge = Fast cold-start routing; Node.js = Heavy backend computation.
> ```


---

## 7. Related Terms
- [Middleware (`middleware.ts`)](middleware.md) — The primary consumer of the Edge Runtime.
- [Route Handlers (`route.ts`)](../level_07/route_handlers.md) — Can optionally be opted into the Edge.
- [Serverless Functions](serverless_functions.md) — Related concept: Serverless Functions.
- [V8 Engine](v8_engine.md) — Related concept: V8 Engine.
---

## 8. Key Takeaways
- The **Edge Runtime** is an ultra-fast, lightweight JavaScript environment based on standard Web APIs rather than Node.js APIs.
- Next.js Middleware is forced to run on the Edge to ensure fast interception of requests.
- You can manually opt pages or API routes into the Edge by exporting `const runtime = 'edge'`.
- You **cannot** use native Node modules, read the file system, or use standard database drivers (TCP) on the Edge.
