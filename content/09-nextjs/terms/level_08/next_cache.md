# The Next.js Cache (The Four Caches)

> **Level 8 — Rendering Strategies & Cache**
> The complex, multi-layered caching architecture in Next.js that spans both the server and the browser to maximize performance and minimize database queries.

---

## 1. Prerequisites
- [Static Site Generation (SSG)](ssg.md) — Another layer of this cache.
- [React Server Components (RSC)](../level_01/rsc.md) — Caching data fetches in React Server Components.

---

## 2. Term Category

**Data Fetching & Caching** (Next.js Cache Management API): `next/cache` utilities (`revalidatePath`, `revalidateTag`, `unstable_cache`) manage Data Cache and Full Route Cache invalidation.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
Next.js is designed to be fast by default. To achieve this, it aggressively caches almost everything it can. However, understanding *what* is cached, *where* it is cached, and *how* to clear it is the #1 source of confusion for new Next.js developers.
The Next.js Cache is actually composed of **four distinct layers**.

### (2) The Four Layers of the Cache

#### Layer 1: Request Memoization (Server)
- **What it caches:** The return values of `fetch` requests.
- **Lifespan:** Only lasts for a single render pass of a single React component tree.
- **Purpose:** Prevents you from making the same API call 5 times in different components on the same page.
- **How to clear:** Automatically clears as soon as the page is finished rendering.

#### Layer 2: Data Cache (Server)
- **What it caches:** The persistent JSON data returned from a `fetch` or database query.
- **Lifespan:** Permanent (by default via `force-cache`), across all user requests.
- **Purpose:** Prevents hitting your backend database thousands of times for the same data.
- **How to clear:** `revalidatePath`, `revalidateTag`, or time-based `revalidate: 60`.

#### Layer 3: Full Route Cache (Server)
- **What it caches:** The final rendered HTML and React Server Component Payload of a page.
- **Lifespan:** Permanent (This is essentially what SSG is).
- **Purpose:** Prevents running the React rendering engine on the server.
- **How to clear:** Automatically cleared when the underlying Data Cache is revalidated.

#### Layer 4: Router Cache (Client / Browser)
- **What it caches:** The React Server Component Payload (the UI) of pages the user has already visited, stored in browser memory.
- **Lifespan:** Lasts for the duration of the user's browser session (clears on hard refresh).
- **Purpose:** Makes navigating back and forth between pages (e.g., clicking the "Back" button) instantaneous because no network request is made.
- **How to clear:** Call `router.refresh()` or trigger a Server Action.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: The "Why isn't my data updating!?" panic

**The mistake:** A developer updates data in their database. They click a `<Link>` to go to the page showing that data. The data hasn't updated. They get frustrated with Next.js caching.

**Why it's wrong:** They are fighting **Layer 4: The Router Cache**. Even if you didn't cache the database query on the server, the browser remembers the UI of the page from 10 seconds ago and instantly restores it from memory to be fast.
**Golden Rule:** When dealing with mutations (Server Actions), always call `revalidatePath()` on the server. This explicitly tells Next.js to not only clear the Server Caches (Layers 2 & 3), but it also sends an instruction down to the browser to clear the Client Cache (Layer 4) so the user sees the new data!

---



### Mistake 2: Confusing Next.js Cache Architecture Layers (Data Cache vs Full Route Cache)

**The mistake:** Expecting `revalidateTag()` to purge browser-side Router Cache instances immediately.

**Why it's wrong:** Next.js maintains 4 distinct cache layers: Client Router Cache, Full Route Cache (Server HTML), Data Cache (fetch data), and Request Memoization. `revalidateTag()` purges Data Cache & Full Route Cache, but browser Router Cache persists for 30s.

*Incorrect:*
```tsx
/* Expecting revalidateTag() to clear client browser Router Cache instantly */
```

*Fix:*
```tsx
/* Call router.refresh() on client to refresh client-side Router Cache alongside revalidateTag() */
```

---



### Mistake 3: Disabling Data Cache Globally in Next.js Production Deployments

**The mistake:** Adding `export const dynamic = 'force-dynamic'` to root layout component.

**Why it's wrong:** Force-dynamic on root layout disables static caching across the ENTIRE web application, causing every request to execute dynamic server rendering.

*Incorrect:*
```typescript
// app/layout.tsx
export const dynamic = 'force-dynamic'; // ❌ Disables caching globally for entire app!
```

*Fix:*
```tsx
// Keep root layout static; set force-dynamic only on specific dynamic pages
```


---




---

## 5. Practice Exercises

### Exercise 1: Caching Custom Database Queries with `unstable_cache`

**Scenario:**
Wrap an expensive database ORM query in `unstable_cache()` with custom cache tags and revalidation timers.

**Requirements:**
1. Import `unstable_cache` from `next/cache`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { unstable_cache } from "next/cache";
> import { db } from "@/lib/db";

export const getCachedUsers = unstable_cache(
  async (role: string) => {
    return db.user.findMany({ where: { role } });
  },
  ["users-by-role"], // Key parts
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["users"]   # Tag for on-demand invalidation
  }
);
```

> #### Technical Explanation
>
> 1. `unstable_cache()` extends Data Cache functionality to arbitrary async functions (database queries, ORM calls, computations).
> 2. `tags` allow purging cached database query results on demand via `revalidateTag('users')`.
> 3. Crucial for caching database calls that do NOT use the `fetch()` API.

---

### Exercise 2: Purging Data Cache Entries with `revalidateTag`

**Scenario:**
Purge all cached data associated with tag `'inventory'` inside a Server Action.

**Requirements:**
1. Call `revalidateTag('inventory')` in Server Action.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> "use server";

import { revalidateTag } from "next/cache";

export async function updateStockLevel(productId: string) {
  // Update DB...
  revalidateTag("inventory");
}
```

> #### Technical Explanation
>
> 1. `revalidateTag('tag-name')` invalidates matching Data Cache entries globally across all pages.
> 2. Affects both `fetch()` requests and `unstable_cache()` queries tagged with the same string.
> 3. Targeted cache invalidation pattern.

---

### Exercise 3: Purging Route Segment Cache with `revalidatePath`

**Scenario:**
Purge all cached route pages under `/shop` using `revalidatePath('/shop', 'page')`.

**Requirements:**
1. Call `revalidatePath('/shop', 'page')`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> "use server";

import { revalidatePath } from "next/cache";

export async function updateCatalog() {
  revalidatePath("/shop", "page");
}
```

> #### Technical Explanation
>
> 1. `revalidatePath()` purges static Full Route Cache HTML and associated Data Cache entries for specified URL paths.
> 2. Passing `'page'` limits invalidation to the specific page component.
> 3. Core cache management API usage.

---




---

## 6. Related Terms
- [On-Demand Revalidation (`revalidatePath`, `revalidateTag`)](../level_06/on_demand_revalidation.md) — The primary tool for clearing Layers 2, 3, and 4.
- [Static Site Generation (SSG)](ssg.md) — Essentially Layer 3.
- [React Server Component Payload (RSC Payload)](rsc_payload.md) — Related concept: React Server Component Payload (RSC Payload).
- [Data Caching (`force-cache`, `no-store`)](../level_05/data_caching.md) — One layer of this cache.

---

## 7. Key Takeaways
- The Next.js Cache is made of four layers: Request Memoization, Data Cache, Full Route Cache, and Router Cache.
- **Request Memoization** deduplicates identical `fetch` calls during a single page render.
- **Data Cache** stores persistent data across multiple visitors on the server.
- **Full Route Cache** stores pre-rendered HTML on the server (SSG).
- **Router Cache** stores previously visited pages in the user's browser for instant backward/forward navigation.
