# Time-based Revalidation (`next.revalidate`)

> **Level 5 — Data Fetching**
> A fetching strategy (also known as Incremental Static Regeneration) that caches data for a specific amount of time, automatically refreshing it in the background when the time expires.

---

## 1. Prerequisites
- [Data Caching](../level_05/data_caching.md) — The two extreme ends of caching (`force-cache` vs `no-store`).
- [Server-side Fetching](../level_05/fetch.md) — The API we are modifying.

---

## 2. Term Category
- **Data Fetching / Optimization**

---

## 3. Environment Context
- **Server Only**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
`force-cache` is great, but what if your marketing team updates the site copy? The site is stuck showing the old copy forever unless you completely rebuild and redeploy the app.
`no-store` fixes the staleness, but it destroys your server performance because every user request hits the database.
What if you could say: *"Cache this data, but every 60 seconds, check if there is an update"*? This is the perfect middle ground: **Time-based Revalidation**. It allows your site to be as fast as a static site, but stay relatively up-to-date automatically.

### (2) The `next.revalidate` Syntax
You pass the `next` object to your `fetch` call, specifying the `revalidate` time in seconds.

```tsx
export default async function BlogFeed() {
  // Cache the data. After 60 seconds have passed, the next user request 
  // will trigger a background update to fetch fresh data.
  const res = await fetch('https://api.myblog.com/posts', {
    next: { revalidate: 60 } // Revalidate every 60 seconds
  });
  
  const posts = await res.json();
  return <PostList posts={posts} />;
}
```

### (3) How Background Revalidation Works (Stale-While-Revalidate)
1. **0s-60s:** User A visits. They get the cached data instantly.
2. **61s:** User B visits. The cache has expired. **User B still gets the OLD cached data instantly!** 
3. **61s (Background):** Next.js realizes the cache is stale and triggers a background `fetch` to update the cache.
4. **65s:** User C visits. The background fetch is finished. User C gets the NEW data.

This ensures no user *ever* has to wait for a slow network request!

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Setting revalidate too low

**The mistake:** A developer sets `{ next: { revalidate: 1 } }` thinking they are getting "live" data.

**Why it's wrong:** Revalidating every 1 second effectively nullifies the benefits of caching while adding the overhead of constant background fetching. If you need data to be perfectly live within 1 second, you should just use `{ cache: 'no-store' }`. Revalidation is best used for data that changes on the scale of minutes, hours, or days (e.g., 60, 3600, 86400).
**Golden Rule:** Use time-based revalidation for content that updates periodically (blogs, product catalogs). Use `no-store` for highly dynamic user-specific data (shopping carts, user profiles).

---

### Mistake 2: Calling `revalidatePath()` or `revalidateTag()` inside Client Components

**The mistake:** Importing `import { revalidatePath } from 'next/cache'` inside a Client Component.

**Why it's wrong:** `revalidatePath()` and `revalidateTag()` are server-side cache purge methods. Calling them in Client Components throws a compilation error. Call them inside Server Actions or Route Handlers.

*Incorrect:*
```typescript
'use client';
import { revalidatePath } from 'next/cache'; // ❌ Client Component error!
```

*Fix:*
```typescript
// Call revalidatePath in Server Actions ('use server'):
'use server';
import { revalidatePath } from 'next/cache';
export async function updatePost() {
  await db.update();
  revalidatePath('/posts'); // Purge cached posts path
}
```

---

### Mistake 3: Using Overly Broad `revalidatePath('/', 'layout')` Purging Entire Application Cache

**The mistake:** Purging root layout cache `revalidatePath('/', 'layout')` when updating a single blog comment.

**Why it's wrong:** Purging root layout invalidates the cached HTML and Data Cache for the entire application, forcing every page to re-render dynamically. Use targeted tags (`revalidateTag('comments')`).

*Incorrect:*
```typescript
revalidatePath('/', 'layout'); // ❌ Purges cache for ENTIRE web app!
```

*Fix:*
```typescript
revalidateTag('comments'); // Targeted cache purge for specific tag
```


---

## 6. Practice Exercises

### Exercise 1: Route Segment Config

**Problem:** You aren't using `fetch`. You are using a direct database client (`await prisma.user.findMany()`), so you can't pass the `next.revalidate` option. How can you apply a 60-second revalidation to the *entire page*?

**Expected output:**
> [!check]- Answer
> ```tsx
> // You export a Route Segment Config variable at the top of page.tsx!
> export const revalidate = 60; // Applies a 60s cache to the entire route
> 
> export default async function Page() {
>   const users = await prisma.user.findMany(); // Now this is cached for 60s!
>   return <div>...</div>;
> }
> ```
> - There are exported variables Next.js looks for in a `page.tsx` file to configure the route.

---

### Exercise 2: Tag-Based Revalidation Flow

**Problem:** Write a `fetch()` call tagged with `'products'` and a Server Action `revalidateTag('products')` purging product cache upon mutation.

**Expected output:**
> [!check]- Answer
> ```typescript
> // Fetch: fetch(url, { next: { tags: ['products'] } });
> // Revalidate: 'use server'; import { revalidateTag } from 'next/cache'; revalidateTag('products');
> ```
> - Tag-based revalidation allows targeted cache invalidation.
> 
> ```typescript
> // Data Fetching:
> const res = await fetch('https://api.com/products', {
>   next: { tags: ['products'] }
> });
> 
> // Server Action Invalidation:
> 'use server';
> import { revalidateTag } from 'next/cache';
> 
> export async function addProduct() {
>   await db.product.create(...);
>   revalidateTag('products');
> }
> ```

---

### Exercise 3: Time-Based vs On-Demand Revalidation

**Problem:** Contrast Time-Based Revalidation vs On-Demand Revalidation.

**Expected output:**
> [!check]- Answer
> ```text
> Time-Based: Revalidates automatically after a specified time interval (e.g. revalidate: 60).
> On-Demand: Revalidates instantly when triggered by events via revalidatePath() or revalidateTag().
> ```
> - Time-Based: Automatic background refresh on timer interval.
> - On-Demand: Instant purge triggered by user mutations.
> 
> ```text
> Time-Based = ISR revalidate timer; On-Demand = revalidateTag() trigger.
> ```


---

## 7. Related Terms
- [Data Caching](../level_05/data_caching.md) — The alternative caching strategies.
- [On-Demand Revalidation](../level_06/on_demand_revalidation.md) — Updating the cache via a button click rather than a timer.

---

## 8. Key Takeaways
- **Time-based Revalidation** (`next: { revalidate: seconds }`) caches data for a specific duration.
- It uses a "Stale-While-Revalidate" pattern. When the cache expires, the next visitor gets the stale data instantly, but triggers a background refresh so future visitors get fresh data.
- It is the perfect balance between the speed of `force-cache` and the freshness of `no-store`.
- If you use a database ORM instead of `fetch`, you can export `const revalidate = 60` from your `page.tsx` to cache the whole route.
