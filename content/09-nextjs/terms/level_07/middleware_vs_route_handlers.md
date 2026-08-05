# Middleware vs Route Handlers

> **Level 7 — API & Route Handlers**
> A conceptual comparison of two backend environments in Next.js. Route Handlers process specific API requests, while Middleware intercepts *all* requests globally before they reach their destination.

---

## 1. Prerequisites
- [Route Handlers (`route.ts`)](route_handlers.md) — Specific API endpoints.
- [Next.js Overview](../level_01/nextjs.md) — Understanding the full-stack nature of Next.js.
---

## 2. Term Category
- **Architecture / Backend Logic**

---

## 3. Environment Context
- **Edge Runtime (Middleware) vs Node.js/Edge (Route Handlers)**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Execution Order

**Problem:** A user makes a `POST` request to `/api/admin/deleteUser`. You have a `middleware.ts` file that checks for an admin token, and an `app/api/admin/deleteUser/route.ts` file that deletes the user from the database. In what order does the code execute?

**Expected output:**
> [!check]- Answer
> ```text
> 1. The request hits Next.js.
> 2. `middleware.ts` executes FIRST. It checks the token.
> 3. If the token is valid, Middleware calls `NextResponse.next()` allowing the request to pass.
> 4. The request arrives at `route.ts`.
> 5. `route.ts` executes the database deletion and returns the JSON.
> ```
> - Middleware is the outer shield.

---

### Exercise 2: Middleware vs Route Handler Architecture Matrix

**Problem:** Compare Middleware (`middleware.ts`) vs Route Handlers (`route.ts`) across:
1. Execution scope
2. Execution timing
3. Primary use case

**Expected output:**
> [!check]- Answer
> ```text
> 1. Middleware: Global (all matching routes); Route Handler: Specific URL endpoint
> 2. Middleware: Runs BEFORE route resolution; Route Handler: Runs WHEN specific endpoint is called
> 3. Middleware: Auth redirects & header rewrites; Route Handler: REST API CRUD data endpoints
> ```
> - Middleware: Global request interceptor before routing.
> - Route Handler: Dedicated API endpoint handler.
> 
> ```text
> Middleware = Global Auth & Redirects; Route Handlers = REST API Endpoints.
> ```

---

### Exercise 3: Middleware Matcher Config

**Problem:** Write `config.matcher` array for `middleware.ts` targeting `/dashboard/:path*` and `/admin/:path*`.

**Expected output:**
> [!check]- Answer
> ```typescript
> export const config = { matcher: ['/dashboard/:path*', '/admin/:path*'] };
> ```
> - `config.matcher` restricts middleware execution to matching URL paths.
> 
> ```typescript
> export const config = {
>   matcher: ['/dashboard/:path*', '/admin/:path*']
> };
> ```


---

## 7. Related Terms
- [Middleware (`middleware.ts`)](../level_10/middleware.md) — A deep dive into the syntax of `middleware.ts` (Level 10).
- [Route Handlers (`route.ts`)](route_handlers.md) — The specific endpoints.
---

## 8. Key Takeaways
- **Route Handlers** are the final destination for API requests, returning specific data payloads. They run on full Node.js (by default).
- **Middleware** is a global interceptor that runs before any route or page. It is used for routing, redirects, and lightweight auth checks.
- Middleware runs strictly on the Edge Runtime, meaning it cannot use native Node.js modules or heavy database ORMs.
