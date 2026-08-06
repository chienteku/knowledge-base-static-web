# Data Caching (`force-cache`, `no-store`)

> **Level 5 — Data Fetching**
> The configuration options added to the `fetch()` API by Next.js that dictate whether a network response should be stored persistently across multiple user requests, or fetched fresh every time.

---

## 1. Prerequisites
- [Server-side Fetching (Extended `fetch`)](fetch.md) — The extended API we are configuring.
- [The Next.js Cache (The Four Caches)](../level_08/next_cache.md) — The underlying system where the data is stored.

---

## 2. Term Category

**Data Fetching & Caching** (Next.js Data Cache Layer): The Data Cache is Next.js's persistent server-side cache for storing fetched HTTP responses across requests and deployments.



---

## 3. Explanation

### Environment Context
- **Server Only**

### (1) Design Motivation — "Why did we design this?"
If you build an e-commerce site, you might have a list of products. Those products rarely change. If 10,000 users visit your site in an hour, making 10,000 identical database queries or API fetches is a massive waste of money and time.
Conversely, if you have a live stock market ticker, caching that data for even 10 seconds could cost someone millions of dollars.
Next.js solves this by allowing you to control the **Data Cache** at a granular, per-request level using standard `fetch` options.

### (2) `force-cache` (The Default in Next 13/14, changed in 15)
If you provide the `{ cache: 'force-cache' }` option, Next.js fetches the data once, stores the result in its persistent Data Cache, and then *never fetches it again*. Every subsequent user request instantly receives the cached data.

```tsx
export default async function ProductList() {
  // This data will be cached FOREVER until you manually revalidate it.
  const res = await fetch('https://api.store.com/products', {
    cache: 'force-cache' 
  });
  const data = await res.json();
  return <div>...</div>;
}
```

### (3) `no-store` (Dynamic Fetching)
If your data must be perfectly live and fresh on every single page load, you use `{ cache: 'no-store' }`. Next.js will bypass the cache entirely and make a fresh network request every time a user loads the page.

```tsx
export default async function LiveStockTicker() {
  // This guarantees fresh data on every single request
  const res = await fetch('https://api.finance.com/tsla', {
    cache: 'no-store' 
  });
  const data = await res.json();
  return <div>Price: ${data.price}</div>;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Not understanding default cache behaviors

**The mistake:** A developer writes `fetch('https://api.com/data')` without specifying a `cache` option, and gets confused why their data isn't updating when they refresh the page in production.

**Why it's wrong:** In Next.js 13 and 14, the default behavior for `fetch` is `force-cache`! If you omit the cache option, Next.js caches it forever. (Note: Next.js 15 changes the default to `no-store` for safer defaults, but you should always be explicit!).
**Golden Rule:** Always explicitly define your caching strategy (`force-cache` or `no-store`) on every `fetch` request so your intent is clear and future-proof.

---

### Mistake 2: Expecting Native `fetch()` Caching Behavior to Apply to Third-Party Database ORM Calls

**The mistake:** Expecting Prisma or Mongoose database queries to be automatically cached by Next.js Data Cache.

**Why it's wrong:** Next.js automatically caches native `fetch()` calls ONLY. Non-fetch database ORM calls (Prisma, Drizzle) bypass the Data Cache unless wrapped in `unstable_cache()` or `React.cache()`.

*Incorrect:*
```typescript
// app/page.tsx
const users = await prisma.user.findMany(); // ❌ NOT cached by Next.js Data Cache!
```

*Fix:*
```typescript
import { unstable_cache } from 'next/cache';
// Wrap ORM database queries in unstable_cache for Data Cache persistence:
const getCachedUsers = unstable_cache(async () => prisma.user.findMany(), ['users-key'], { revalidate: 3600 });
```

---

### Mistake 3: Confusing Request Memoization (`React.cache`) with Data Cache Persistence (`unstable_cache`)

**The mistake:** Using `React.cache()` expecting data to persist across different HTTP requests from different users.

**Why it's wrong:** `React.cache()` memoizes data ONLY within a single server render request lifecycle. `unstable_cache()` or `fetch({ next: { revalidate } })` persists cached data across multiple user requests.

*Incorrect:*
```tsx
/* Expecting React.cache() to persist data across different HTTP requests */
```

*Fix:*
```tsx
/* Use React.cache() for per-request deduplication; Use Data Cache (unstable_cache) for multi-request caching */
```


---

## 5. Practice Exercises

### Exercise 1: Controlling `fetch()` Data Caching Behavior

**Scenario:**
Configure `fetch()` caching options for static content (`force-cache`) vs dynamic content (`no-store`).

**Requirements:**
1. Pass `{ cache: "force-cache" }` or `{ cache: "no-store" }` to `fetch()`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> export default async function MultiCachePage() {
>   // 1. Cached permanently in Next.js Data Cache (Default):
>   const staticData = await fetch("https://api.example.com/static-info", {
>     cache: "force-cache"
>   }).then((r) => r.json());
> 
>   // 2. Never cached (Bypasses Data Cache on every request):
>   const dynamicData = await fetch("https://api.example.com/live-stocks", {
>     cache: "no-store"
>   }).then((r) => r.json());
> 
>   return (
>     <main>
>       <p>Static Info: {staticData.title}</p>
>       <p>Live Price: ${dynamicData.price}</p>
>     </main>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `cache: 'force-cache'` stores HTTP responses in Next.js's persistent Data Cache across requests and deployments.
> 2. `cache: 'no-store'` bypasses the Data Cache, executing a fresh origin network request on every page hit.
> 3. Core caching control mechanism in Next.js App Router.
> 
---

### Exercise 2: Setting Time-Based Cache Revalidation (`next.revalidate`)

**Scenario:**
Revalidate cached data automatically every 60 seconds using `next: { revalidate: 60 }`.

**Requirements:**
1. Pass `next: { revalidate: 60 }` to `fetch()`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> export default async function NewsFeed() {
>   const news = await fetch("https://api.example.com/news", {
>     next: { revalidate: 60 } // Revalidate every 60 seconds
>   }).then((r) => r.json());
> 
>   return (
>     <div>
>       <h1>Latest News (Cached 60s)</h1>
>       <ul>
>         {news.map((item: any) => (
>           <li key={item.id}>{item.title}</li>
>         ))}
>       </ul>
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `next: { revalidate: seconds }` enables Stale-While-Revalidate (SWR) caching behavior for the data request.
> 2. Serves cached data instantly for 60 seconds; subsequent requests trigger background revalidation.
> 3. Balances CDN speed with content freshness.
> 
---

### Exercise 3: Tag-Based On-Demand Cache Invalidation (`next: { tags }`)

**Scenario:**
Tag a data fetch request with `['posts']` and purge it on demand using `revalidateTag('posts')`.

**Requirements:**
1. Pass `next: { tags: ['posts'] }` to `fetch()`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/posts/page.tsx
> export default async function Posts() {
>   const posts = await fetch("https://api.example.com/posts", {
>     next: { tags: ["posts"] }
>   }).then((r) => r.json());
> 
>   return <div>Total Posts: {posts.length}</div>;
> }
> ```
> 
> ```typescript
> // app/actions/post.ts
> "use server";
> 
> import { revalidateTag } from "next/cache";
> 
> export async function addPostAction() {
>   // Save post...
>   revalidateTag("posts"); // Purges all Data Cache entries tagged with 'posts'!
> }
> ```
> 
> #### Technical Explanation
>
> 1. `next: { tags: ['tag-name'] }` attaches cache labels to fetched data entries.
> 2. `revalidateTag('tag-name')` invalidates matching Data Cache entries instantly across all pages.
> 3. Highly efficient on-demand cache invalidation pattern.
> 
---


## 6. Related Terms
- [Time-based Revalidation (`next.revalidate`)](revalidation.md) — A middle ground between `force-cache` and `no-store`.
- [Static Site Generation (SSG)](../level_08/ssg.md) — The page-level result of using `force-cache`.
- [Dynamic Rendering (SSR)](../level_08/ssr.md) — Related concept: Dynamic Rendering (SSR).
- [Server-side Fetching (Extended `fetch`)](fetch.md) — Related concept: Server-side Fetching (Extended `fetch`).
- [On-Demand Revalidation (`revalidatePath`, `revalidateTag`)](../level_06/on_demand_revalidation.md) — Related concept: On-Demand Revalidation (`revalidatePath`, `revalidateTag`).
- [Caching Route Handlers](../level_07/caching_route_handlers.md) — Related concept: Caching Route Handlers.
- [The Next.js Cache (The Four Caches)](../level_08/next_cache.md) — Related concept: The Next.js Cache (The Four Caches).
- [`React.cache()` Function](react_cache.md) — React cache memoization.

---

## 7. Key Takeaways
- Next.js extends the `fetch` API with a `cache` option to control the persistent Data Cache.
- `{ cache: 'force-cache' }` caches the result permanently across all user requests.
- `{ cache: 'no-store' }` forces a fresh network request on every page load.
- You should explicitly declare your cache strategy on every fetch to avoid version-specific default behaviors.
