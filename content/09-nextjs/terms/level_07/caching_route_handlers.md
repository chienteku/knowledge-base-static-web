# Caching Route Handlers

> **Level 7 — API & Route Handlers**
> The specific rules and behaviors that determine when a Next.js `route.ts` API endpoint caches its response at build-time versus calculating it dynamically on every request.

---

## 1. Prerequisites
- [Route Handlers (`route.ts`)](../level_07/route_handlers.md) — The endpoints being cached.
- [Data Caching](../level_05/data_caching.md) — Similar caching concepts, but applied to the entire API route rather than a single `fetch`.

---

## 2. Term Category
- **API Endpoint / Optimization**

---

## 3. Environment Context
- **Server Only (Build-Time & Request-Time)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you build an API endpoint `GET /api/products` that just returns a static JSON list of products from a file, it is extremely inefficient for the server to read that file and generate the JSON 10,000 times for 10,000 visitors.
Next.js optimizes Route Handlers by aggressively evaluating them at **Build Time**. If it determines the endpoint is static, it caches the JSON response forever. When a user requests the endpoint, Next.js just serves the cached string instantly.
Understanding *how* Next.js decides if a route is Static (cached) or Dynamic (not cached) is critical.

### (2) The Rules of Static vs Dynamic
By default, **`GET` requests are cached** (Static). 

However, Next.js will automatically switch your `GET` route to **Dynamic** (re-evaluated on every request) if it detects you doing any of the following:
1. Using the `Request` object (e.g., reading headers or URL search params).
2. Using dynamic functions like `cookies()` or `headers()`.
3. Using dynamic folder segments (e.g., `app/api/users/[id]/route.ts`).
4. Using an HTTP method other than `GET` (e.g., `POST`, `PUT`, `DELETE` are NEVER cached).

### (3) Forcing Dynamic Behavior
If your `GET` route doesn't use the `Request` object or cookies, but it checks a database that changes frequently, Next.js will incorrectly cache it forever!
You must manually force it to be dynamic using Route Segment Config.

```ts
// app/api/time/route.ts

// This forces Next.js to run this route dynamically on every request!
export const dynamic = 'force-dynamic'; 

export async function GET() {
  // If we didn't export `force-dynamic`, this time would be permanently
  // frozen at whatever time the `npm run build` command was executed!
  return Response.json({ time: new Date().toISOString() });
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Stale API Responses in Production

**The mistake:** A developer writes a `GET` Route Handler that queries a database to get a list of active users. They test it in development (`npm run dev`) and it updates perfectly. They deploy it to production, and the API always returns the exact same list of users forever.

**Why it's wrong:** In Development mode, caching is largely disabled so you can see your changes. But during the Production Build (`npm run build`), Next.js looks at the route, sees no `Request` usage, and caches the database result statically.
**Golden Rule:** If a `GET` Route Handler returns data that can change independently of a code deployment (like database queries), you MUST add `export const dynamic = 'force-dynamic';` or `export const revalidate = 0;` to the file!

---

### Mistake 2: Assuming `POST`, `PUT`, or `DELETE` Route Handlers Are Cached Automatically

**The mistake:** Expecting a `POST /api/orders` Route Handler response to be cached in Next.js Data Cache.

**Why it's wrong:** Next.js caches ONLY `GET` Route Handlers. Non-GET HTTP methods (`POST`, `PUT`, `DELETE`) are ALWAYS evaluated dynamically on every request.

*Incorrect:*
```tsx
/* Expecting POST route handler responses to be cached */
```

*Fix:*
```tsx
/* GET route handlers are cached by default; POST/PUT/DELETE are always dynamic */
```

---

### Mistake 3: Forgetting `export const dynamic = 'force-dynamic'` on GET Handlers Reading DB State

**The mistake:** Creating a `GET` Route Handler `app/api/users/route.ts` executing database queries without disabling static caching.

**Why it's wrong:** By default, GET Route Handlers returning static responses are evaluated and cached at BUILD TIME. New database entries added in production will NOT appear unless `force-dynamic` is set.

*Incorrect:*
```typescript
// app/api/users/route.ts
export async function GET() {
  const users = await db.user.findMany(); // ❌ Evaluated once at BUILD time!
  return Response.json(users);
}
```

*Fix:*
```typescript
// app/api/users/route.ts
export const dynamic = 'force-dynamic'; // Enforce dynamic request-time evaluation
export async function GET() {
  const users = await db.user.findMany();
  return Response.json(users);
}
```


---

## 6. Practice Exercises

### Exercise 1: The Request Opt-out

**Problem:** You have a static `GET` handler. You add `console.log(request.url)` to it for debugging. What happens to your production cache?

```ts
export async function GET(request: Request) {
  console.log(request.url); // Added this line
  return Response.json({ data: "Static" });
}
```

**Expected output:**
```text
You just destroyed your cache!
Merely referencing the `request` parameter in a `GET` handler automatically opts the entire route into Dynamic Rendering. Next.js assumes that if you are looking at the request, the response must depend on the specific user making the request.
```

> [!check]- Answer
> - Read "The Rules of Static vs Dynamic" above.

---

### Exercise 2: Route Handler Dynamic Opt-In Trigger Matrix

**Problem:** List 3 factors that automatically convert a GET Route Handler from static cached to dynamic request-time execution.

**Expected output:**
```text
1. Accessing `request.url` or request headers/cookies
2. Using non-GET HTTP verbs (POST, PUT, DELETE)
3. Setting `export const dynamic = 'force-dynamic'` (or `revalidate = 0`)
```

> [!check]- Answer
> - Accessing `request` object (cookies, headers, searchParams).
> - Using non-GET verbs (`POST`, `PUT`, `DELETE`).
> - Segment config: `export const dynamic = 'force-dynamic'`.
> 
> ```typescript
> export const dynamic = 'force-dynamic';
> ```

---

### Exercise 3: Route Handler Revalidation Config

**Problem:** Write segment config line setting a GET Route Handler cache revalidation interval to 60 seconds.

**Expected output:**
```typescript
export const revalidate = 60;
```

> [!check]- Answer
> - `export const revalidate = N` configures ISR timer for Route Handlers.
> 
> ```typescript
> export const revalidate = 60;
> 
> export async function GET() {
>   const data = await fetchExternalData();
>   return Response.json(data);
> }
> ```


---

## 7. Related Terms
- [Data Caching](../level_05/data_caching.md) — Caching individual fetches rather than whole routes.
- [Dynamic Route Handlers](../level_07/dynamic_route_handlers.md) — Routes that are automatically dynamic by default.

---

## 8. Key Takeaways
- `GET` Route Handlers are **cached statically by default**.
- `POST`, `PUT`, and `DELETE` handlers are **never** cached.
- A `GET` route becomes dynamic automatically if it reads the `Request` object, reads `cookies()`, or uses `[dynamic]` folder names.
- You can manually force a route to never cache by exporting `export const dynamic = 'force-dynamic';`.
- Development mode behaves differently than Production mode regarding caching. Always verify your API caching strategy!
