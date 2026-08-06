# Node.js Runtime

> **Level 1 — Core Concepts & Architecture**
> The server-side JavaScript runtime environment where Server Components, routes, and compilation build scripts execute.

---

## 1. Prerequisites
- None!

---

## 2. Term Category

**Build & Deployment** (Node.js Server Execution Engine): The Node.js Runtime provides server-side execution environments for Next.js Server Components, API handlers, and Server Actions.



---

## 3. Explanation

### Environment Context
- **Server Only**

### (1) Design Motivation — "Why did we design this?"
JavaScript was originally designed as a client-side scripting language running inside web browsers. To build full-stack web applications, developers had to write their frontend code in JavaScript and their backend APIs in a different server-side language (like Ruby, Python, or Java). 

**Node.js** was created to solve this split by executing JavaScript on the server. Next.js relies heavily on the Node.js runtime environment to perform server-side rendering (SSR), compile build-time static pages, run Server Components (RSC), and execute Route Handlers (API routes). Without a server runtime, Next.js could not connect to databases, read files, or serve dynamic requests.

---

### (2) Core Concept — Node.js vs. Browser Environment
While both Node.js and modern browsers execute JavaScript, they provide completely different global APIs:

| Feature | Browser Environment | Node.js Runtime |
|---|---|---|
| **Global Object** | `window` / `self` | `global` / `process` |
| **DOM Access** | Yes (`document.querySelector`) | No (`ReferenceError: document is not defined`) |
| **File System** | No (Sandboxed security) | Yes (`import fs from 'fs'`) |
| **Network Requests** | `fetch` / `XMLHttpRequest` | `fetch` (Node 18+) / `http` module |

In Next.js, Server Components execute *only* inside the Node.js runtime environment. When they render, they output HTML and JSON, which are streamed to the client's browser.

---

### (3) Reading Files in Next.js Server Components
Because Server Components run in Node.js, they can directly import and call standard Node modules like `fs` (File System):

```typescript
// app/blog/page.tsx (Server Component)
import fs from 'fs';
import path from 'path';

interface Post {
  title: string;
  slug: string;
}

export default async function BlogPage() {
  // Resolve path inside the Node.js context
  const filePath = path.join(process.cwd(), 'data', 'posts.json');
  
  // Read file synchronously using Node fs module
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const posts: Post[] = JSON.parse(fileContents);

  return (
    <div>
      <h1>Blog Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Accessing browser-only APIs in Server Components

**The mistake:** Trying to read `window`, `document`, or client-side storage keys directly inside a Server Component:

```typescript
// app/dashboard/page.tsx (Server Component)
export default function Dashboard() {
  // BAD: window is not defined in the Node.js runtime environment!
  const theme = typeof window !== 'undefined' ? localStorage.getItem('theme') : 'light';
  return <div>Active Theme: {theme}</div>;
}
```

**Why it's wrong:** Server Components run *exclusively* on the server in the Node.js runtime. At execution time, `window`, `document`, and `localStorage` do not exist, causing the server render path to throw a runtime error.

**Golden Rule:** Only access browser-only APIs (like `window` or `localStorage`) inside Client Components within a `useEffect` hook or event handler.

---

### Mistake 2: Attempting to Use Node.js Native Modules (`fs`, `child_process`) in the Edge Runtime

**The mistake:** Configuring `export const runtime = 'edge'` on a route handler that uses `fs.readFileSync()`.

**Why it's wrong:** The Edge Runtime is a lightweight V8 JS engine environment. It does NOT support full Node.js C++ bindings like `fs` or `child_process`. Use default Node.js runtime for `fs` access.

*Incorrect:*
```typescript
export const runtime = 'edge';
import fs from 'fs'; // ❌ Build Error: Node.js module 'fs' not supported in Edge Runtime!
```

*Fix:*
```typescript
export const runtime = 'nodejs'; // Use Node.js runtime for file system access
import fs from 'fs';
```

---

### Mistake 3: Assuming Serverless Function State Persists Across Requests

**The mistake:** Storing user session tokens in a global memory variable `const activeSessions = []` in a Node.js route handler.

**Why it's wrong:** Serverless Node.js functions spin up and down dynamically. Memory state is wiped when instances terminate. Store persistent state in Redis or database.

*Incorrect:*
```typescript
const sessions = new Map(); // ❌ Wiped when serverless function cold-starts!
```

*Fix:*
```typescript
// Store session state in external persistent cache like Redis / Upstash
await redis.set(`session:${id}`, token);
```


---

## 5. Practice Exercises

### Exercise 1: Configuring Runtime Environments (Node.js vs Edge)

**Scenario:**
Configure a route segment to execute on Node.js runtime vs Edge runtime.

**Requirements:**
1. Export `runtime = "nodejs"` or `runtime = "edge"`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/api/compute/route.ts
> export const runtime = "nodejs"; // Default Node.js runtime

export async function GET() {
  return Response.json({ runtime: "Node.js Server" });
}
```

> #### Technical Explanation
>
> 1. `export const runtime = 'nodejs'` forces execution inside a full Node.js environment.
> 2. Node.js runtime grants access to native C++ modules, filesystem (`fs`), and full npm packages.
> 3. Default execution engine for Next.js App Router.

---

### Exercise 2: Reading Environment Variables in Node.js Runtime

**Scenario:**
Read server-only environment variables securely inside a Server Component.

**Requirements:**
1. Access `process.env.DATABASE_URL`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> export default async function ServerSecretView() {
>   const dbUrl = process.env.DATABASE_URL;
>   
>   return (
>     <div>
>       <p>Database Connection Status: {dbUrl ? "Configured" : "Missing"}</p>
>     </div>
>   );
> }
> ```

> #### Technical Explanation
>
> 1. Environment variables without `NEXT_PUBLIC_` prefix are available ONLY in Node.js server execution contexts.
> 2. Stripped from client bundles automatically to prevent credential leaks.
> 3. Core security guarantee of Node.js Server Component runtimes.

---

### Exercise 3: Handling Node.js Streams in Server Routes

**Scenario:**
Stream file contents asynchronously using Node.js `fs.createReadStream()`.

**Requirements:**
1. Return readable stream in Route Handler.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/api/file/route.ts
> import fs from "node:fs";

export async function GET() {
  const fileStream = fs.createReadStream("./public/large-dataset.csv");
  return new Response(fileStream as any, {
    headers: { "Content-Type": "text/csv" }
  });
}
```

> #### Technical Explanation
>
> 1. Node.js runtime supports streaming data buffers via native `fs` streams and Web Streams.
> 2. Avoids reading entire multi-gigabyte files into server RAM memory.
> 3. Standard backend Node.js performance optimization pattern.

---




---

## 6. Related Terms
- [Next.js Overview](nextjs.md) — The framework running on top of Node.js.
- [React Server Components (RSC)](rsc.md) — Components executing inside this runtime.
- [Node.js `path` Module](../level_04/path_module.md) — Related concept: Node.js `path` Module.
- [Node.js Environment Variables (`process.env`)](../level_10/process_env.md) — Related concept: Node.js Environment Variables (`process.env`).
- [Turbopack](../level_10/turbopack.md) — Related concept: Turbopack.
- [V8 Engine](../level_10/v8_engine.md) — Related concept: V8 Engine.

---

## 7. Key Takeaways
- Node.js is a server-side JavaScript runtime built on Chrome's V8 engine.
- Next.js uses the Node.js runtime to compile static sites, render pages, and run API routes.
- Browser APIs like `window`, `document`, and `localStorage` are not available in Node.js.
- Server-side APIs like `fs`, `path`, and `process.env` are available in Server Components.
