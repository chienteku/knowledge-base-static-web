# Middleware vs Route Handlers

> **Level 7 — API & Route Handlers**
> A conceptual comparison of two backend environments in Next.js. Route Handlers process specific API requests, while Middleware intercepts *all* requests globally before they reach their destination.

---

## 1. Prerequisites
- [Route Handlers (`route.ts`)](route_handlers.md) — Specific API endpoints.
- [Next.js Overview](../level_01/nextjs.md) — Understanding the full-stack nature of Next.js.

---

## 2. Term Category

**Framework Architecture** (Server Interceptor vs Endpoint): Middleware intercepts all incoming server requests before routing, whereas Route Handlers serve specific URL endpoints.



---

## 3. Explanation

### Environment Context
- **Edge Runtime (Middleware) vs Node.js/Edge (Route Handlers)**

### (1) Design Motivation — "Why did we design this?"
You have an application with 50 pages and 20 API endpoints. You want to ensure that NO ONE can access the `/admin/` section of the site or the `/api/admin/` endpoints unless they have a valid JWT auth cookie.
If you use **Route Handlers** or Server Components, you would have to write `const token = cookies().get('token')` and an `if (!token) redirect()` check inside all 70 files! This is highly repetitive and error-prone.
**Middleware** solves this. It is a single file that sits at the very edge of your application. Every single HTTP request passes through the Middleware *first*, before it even reaches your Route Handlers or `page.tsx` files.

### (2) The Core Difference
- **Route Handler (`route.ts`):** The *destination* of a specific request. (e.g., A client explicitly asks for `GET /api/user/123`, the Route Handler executes and sends the final JSON response).
- **Middleware (`middleware.ts`):** The *gatekeeper*. It intercepts a request going to `/admin`, checks the cookies, and either allows the request to continue to its destination, or instantly intercepts it and redirects the user to `/login`.

### (3) Performance & Runtime Differences
- Route Handlers usually run on a full Node.js server. They can use any NPM package and talk directly to complex databases using heavy ORMs like Prisma or TypeORM.
- Middleware runs on the **Edge Runtime**. It must be incredibly fast because it runs on *every single request*. Because it runs on the Edge, it **cannot use Node.js APIs** (like `fs`, `path`, or native Node modules) and cannot use heavy ORMs. It is strictly limited to lightweight Web APIs (`fetch`, `Request`, `Response`, `crypto`).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to query the database in Middleware

**The mistake:** A developer tries to import their Prisma database client into `middleware.ts` to check if a user's subscription is active.

**Why it's wrong:** As mentioned, Middleware runs on the Edge Runtime. Prisma and most database drivers rely on Node.js native bindings (like TCP sockets). Your app will instantly crash with an error saying the module is not supported.
**Golden Rule:** Keep Middleware incredibly lightweight. Use it for verifying JWTs (using the native Edge `crypto` API), checking basic cookie existence, or routing logic based on headers. Do heavy database lookups in your Route Handlers or Server Components.

---

### Mistake 2: Writing Heavy Database Queries inside Next.js `middleware.ts`

**The mistake:** Importing Prisma or querying SQL databases inside global `middleware.ts`.

**Why it's wrong:** `middleware.ts` executes on EVERY SINGLE HTTP request before routing. Querying databases in middleware creates heavy latency bottlenecks and runs in Edge Runtime where full Node.js ORMs fail. Use Route Handlers or Edge Redis.

*Incorrect:*
```typescript
// middleware.ts
import { prisma } from '@/lib/db';
export async function middleware() {
  const user = await prisma.user.findFirst(); // ❌ Database latency on EVERY HTTP request!
}
```

*Fix:*
```typescript
// Keep heavy DB queries in Route Handlers (route.ts) or Server Actions;
// Use lightweight JWT verification in middleware.ts
```

---

### Mistake 3: Confusing Middleware Global Request Interception with Route Handler API Endpoints

**The mistake:** Creating a REST CRUD endpoint inside `middleware.ts` instead of `route.ts`.

**Why it's wrong:** `middleware.ts` is for global request preprocessing (redirects, rewrite headers, auth guards). `route.ts` is for specific API endpoint data operations.

*Incorrect:*
```tsx
/* Writing REST CRUD controllers inside global middleware.ts */
```

*Fix:*
```tsx
/* Use middleware.ts for global guards; Use route.ts for REST API endpoints */
```


---

## 5. Practice Exercises

### Exercise 1: Formulating Architectural Differences (Middleware vs Route Handlers)

**Scenario:**
Formulate an architectural comparison matrix contrasting Next.js Middleware against Route Handlers.

**Requirements:**
1. Contrast execution timing, URL scope, runtime limits, and response targets.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Middleware vs Route Handlers Matrix:
> - Middleware (middleware.ts): Executes ON EVERY REQUEST before routing. Runs on Edge runtime. Purpose: Authentication redirect, geo-blocking, header mutation.
> - Route Handlers (app/api/.../route.ts): Executes ONLY when specific URL endpoint is hit. Runs on Node.js/Edge. Purpose: REST API endpoints, Webhooks, JSON endpoints.
> ```

> #### Technical Explanation
>
> 1. Middleware acts as a global request interceptor pipeline before page/route resolution.
> 2. Route Handlers act as specific destination endpoints serving raw data or files.
> 3. Core architectural separation of concerns.

---

### Exercise 2: Chaining Request Pipeline (Middleware to Route Handler)

**Scenario:**
Pass custom authenticated user headers from `middleware.ts` down to a Route Handler.

**Requirements:**
1. Set custom header `x-user-id` in Middleware request headers.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // middleware.ts
> import { NextResponse } from "next/server";
> import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", "user_123");

  return NextResponse.next({
    request: { headers: requestHeaders }
  });
}
```

> ```typescript
> // app/api/profile/route.ts
> import { headers } from "next/headers";

export async function GET() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  return Response.json({ userId });
}
```

> #### Technical Explanation
>
> 1. Middleware can mutate request headers using `NextResponse.next({ request: { headers } })`.
> 2. Downstream Route Handlers read modified request headers via `headers()`.
> 3. Standard pipeline pattern for user authentication propagation.

---

### Exercise 3: Auditing Edge Runtime Constraints in Middleware

**Scenario:**
Explain why heavy Node.js libraries (`fs`, `pg`, `child_process`) must be excluded from `middleware.ts`.

**Requirements:**
1. Detail Edge runtime isolate limitations.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Middleware Runtime Constraint:
> - middleware.ts executes ON THE EDGE RUNTIME (lightweight V8 isolates).
> - C++ bindings (fs, net, native Node ORMs like pg/prisma) are NOT supported in middleware.ts!
> - Solution: Perform heavy ORM operations inside Route Handlers or Server Actions (Node.js runtime).
> ```

> #### Technical Explanation
>
> 1. Next.js Middleware runs on edge isolates for fast global request interception.
> 2. Heavy Node.js modules are unsupported in edge runtime isolates.
> 3. Keep middleware light and delegate data storage logic to Route Handlers.

---




---

## 6. Related Terms
- [Middleware (`middleware.ts`)](../level_10/middleware.md) — A deep dive into the syntax of `middleware.ts` (Level 10).
- [Route Handlers (`route.ts`)](route_handlers.md) — The specific endpoints.

---

## 7. Key Takeaways
- **Route Handlers** are the final destination for API requests, returning specific data payloads. They run on full Node.js (by default).
- **Middleware** is a global interceptor that runs before any route or page. It is used for routing, redirects, and lightweight auth checks.
- Middleware runs strictly on the Edge Runtime, meaning it cannot use native Node.js modules or heavy database ORMs.
