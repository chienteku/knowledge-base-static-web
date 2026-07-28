# Data Caching (`force-cache`, `no-store`)

> **Level 5 — Data Fetching**
> The configuration options added to the `fetch()` API by Next.js that dictate whether a network response should be stored persistently across multiple user requests, or fetched fresh every time.

---

## 1. Prerequisites
- [Server-side Fetching](../level_05/fetch.md) — The extended API we are configuring.
- [The Next.js Cache](../level_08/next_cache.md) — The underlying system where the data is stored.

---

## 2. Term Category
- **Data Fetching / Optimization**

---

## 3. Environment Context
- **Server Only**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Mixing Caches

**Problem:** You have a `page.tsx`. Inside it, you have two `fetch` calls. One fetches the static site navigation (`force-cache`). The other fetches the user's live shopping cart (`no-store`). How does Next.js render this page?

**Expected output:**
> [!check]- Answer
> ```text
> Next.js dynamically renders the page!
> Because at least ONE piece of data on the page requires fresh data (`no-store`), Next.js knows it cannot pre-build this page as static HTML. It will execute the page on the server on every request.
> However, it is highly optimized! The navigation fetch resolves instantly from the cache, while only the shopping cart fetch hits the network.
> ```
> - Think about the "lowest common denominator" of caching.

---

### Exercise 2: fetch Cache Options Matrix

**Problem:** Match `fetch()` cache option to behavior:
1. `{ cache: 'force-cache' }` 
2. `{ cache: 'no-store' }` 
3. `{ next: { revalidate: 60 } }` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Caches data indefinitely in Next.js Data Cache (Default)
> 2. Bypasses Data Cache; re-fetches fresh data on every request
> 3. Caches data with Time-To-Live of 60 seconds (ISR)
> ```
> - `force-cache` -> Persistent static cache
> - `no-store` -> Dynamic un-cached fetch
> - `revalidate: 60` -> Time-based ISR revalidation
> 
> ```typescript
> fetch(url, { next: { revalidate: 60 } });
> ```

---

### Exercise 3: unstable_cache Key and Tag Usage

**Problem:** Write `unstable_cache` wrapper for `getProducts()` with cache tag `'products-tag'` and 1-hour revalidation.

**Expected output:**
> [!check]- Answer
> ```typescript
> const getCachedProducts = unstable_cache(async () => getProducts(), ['products-key'], { tags: ['products-tag'], revalidate: 3600 });
> ```
> - `unstable_cache()` caches non-fetch data sources in Next.js Data Cache.
> 
> ```typescript
> import { unstable_cache } from 'next/cache';
> 
> export const getCachedProducts = unstable_cache(
>   async () => db.product.findMany(),
>   ['products-list'],
>   { tags: ['products-tag'], revalidate: 3600 }
> );
> ```


---

## 7. Related Terms
- [Time-based Revalidation](../level_05/revalidation.md) — A middle ground between `force-cache` and `no-store`.
- [Static Rendering (SSG)](../level_08/ssg.md) — The page-level result of using `force-cache`.

---

## 8. Key Takeaways
- Next.js extends the `fetch` API with a `cache` option to control the persistent Data Cache.
- `{ cache: 'force-cache' }` caches the result permanently across all user requests.
- `{ cache: 'no-store' }` forces a fresh network request on every page load.
- You should explicitly declare your cache strategy on every fetch to avoid version-specific default behaviors.
