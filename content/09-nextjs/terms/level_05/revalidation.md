# Time-based Revalidation (`next.revalidate`)

> **Level 5 — Data Fetching**
> A fetching strategy (also known as Incremental Static Regeneration) that caches data for a specific amount of time, automatically refreshing it in the background when the time expires.

---

## 1. Prerequisites
- [Data Caching (`force-cache`, `no-store`)](data_caching.md) — The two extreme ends of caching (`force-cache` vs `no-store`).
- [Server-side Fetching (Extended `fetch`)](fetch.md) — The API we are modifying.

---

## 2. Term Category

**Data Fetching & Caching** (Data Cache Revalidation Strategies): Revalidation (`revalidatePath`, `revalidateTag`, `next.revalidate`) purges cached data to render updated content on demand or time intervals.



---

## 3. Explanation

### Environment Context
- **Server Only**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Time-Based Cache Revalidation (`next.revalidate`)

**Scenario:**
Configure a page segment to revalidate cached data every 300 seconds (5 minutes) using `revalidate` route segment config.

**Requirements:**
1. Export `export const revalidate = 300` in `page.tsx`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/blog/page.tsx
> export const revalidate = 300; // Revalidate route every 300 seconds
> 
> export default async function BlogIndex() {
>   const posts = await fetch("https://api.example.com/posts").then((r) => r.json());
> 
>   return (
>     <main className="p-6">
>       <h1>Blog Posts (SWR 5m)</h1>
>       <ul>
>         {posts.map((p: any) => (
>           <li key={p.id}>{p.title}</li>
>         ))}
>       </ul>
>     </main>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `export const revalidate = seconds` configures Stale-While-Revalidate (ISR) for all data requests in the route segment.
> 2. Serves static cached HTML instantly while triggering background revalidation after 300 seconds.
> 3. Standard pattern for time-based static site updates.
> 
---

### Exercise 2: Path-Based On-Demand Revalidation (`revalidatePath`)

**Scenario:**
Purge cached HTML/data for route path `/products` inside a Server Action using `revalidatePath()`.

**Requirements:**
1. Import `revalidatePath` from `next/cache`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/actions/product.ts
> "use server";
> 
> import { revalidatePath } from "next/cache";
> 
> export async function updateProductPrice(id: string, newPrice: number) {
>   // Update price in database...
> 
>   // Instantly purge cached route data for /products
>   revalidatePath("/products");
> }
> ```
> 
> #### Technical Explanation
>
> 1. `revalidatePath('/products')` purges cached HTML and Data Cache entries for the specified route path.
> 2. Next request to `/products` will render fresh data from the server.
> 3. Crucial for instant post-mutation UI updates.
> 
---

### Exercise 3: Tag-Based On-Demand Revalidation (`revalidateTag`)

**Scenario:**
Purge all cached data associated with tag `'user-profile'` across multiple pages using `revalidateTag()`.

**Requirements:**
1. Execute `revalidateTag('user-profile')` in Server Action.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> "use server";
> 
> import { revalidateTag } from "next/cache";
> 
> export async function updateUserProfile(userId: string) {
>   // Update user in database...
> 
>   // Purges all fetch requests tagged with 'user-profile' across ALL routes!
>   revalidateTag("user-profile");
> }
> ```
> 
> #### Technical Explanation
>
> 1. `revalidateTag('tag-name')` purges matching Data Cache entries globally, regardless of which page requested them.
> 2. Superior to `revalidatePath` when the same data entity is rendered across multiple distinct URL routes.
> 3. Fine-grained, targeted cache invalidation pattern.
> 
---


## 6. Related Terms
- [Data Caching (`force-cache`, `no-store`)](data_caching.md) — The alternative caching strategies.
- [On-Demand Revalidation (`revalidatePath`, `revalidateTag`)](../level_06/on_demand_revalidation.md) — Updating the cache via a button click rather than a timer.
- [Incremental Static Regeneration (ISR)](../level_08/isr.md) — Related concept: Incremental Static Regeneration (ISR).

---

## 7. Key Takeaways
- **Time-based Revalidation** (`next: { revalidate: seconds }`) caches data for a specific duration.
- It uses a "Stale-While-Revalidate" pattern. When the cache expires, the next visitor gets the stale data instantly, but triggers a background refresh so future visitors get fresh data.
- It is the perfect balance between the speed of `force-cache` and the freshness of `no-store`.
- If you use a database ORM instead of `fetch`, you can export `const revalidate = 60` from your `page.tsx` to cache the whole route.
