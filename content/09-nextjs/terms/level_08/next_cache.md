# The Next.js Cache (The Four Caches)

> **Level 8 — Rendering Strategies & Cache**
> The complex, multi-layered caching architecture in Next.js that spans both the server and the browser to maximize performance and minimize database queries.

---

## 1. Prerequisites
- [Data Caching (`force-cache`)](../level_05/data_caching.md) — One layer of this cache.
- [Static Site Generation (SSG)](../level_08/ssg.md) — Another layer of this cache.

---

## 2. Term Category
- **Architecture / Optimization**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

### Mistake 4: Confusing Next.js Cache Architecture Layers (Data Cache vs Full Route Cache)

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

### Mistake 5: Disabling Data Cache Globally in Next.js Production Deployments

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

### Mistake 6: Confusing Next.js Cache Architecture Layers (Data Cache vs Full Route Cache)

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

### Mistake 7: Disabling Data Cache Globally in Next.js Production Deployments

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

## 6. Practice Exercises

### Exercise 1: The Hard Refresh

**Problem:** A user is navigating around your app. They see stale data on a page because of the Client Router Cache. They press `Cmd+R` (hard refresh the browser window). What happens to the Router Cache?

**Expected output:**
```text
It is completely wiped!
The Router Cache only exists in the browser's JavaScript memory. A hard refresh resets the memory state, forcing the browser to request fresh HTML and RSC Payloads from the server.
(However, if the server's Data Cache is still holding stale data, the user will still see stale data!).
```

> [!check]- Answer
> - Think about what happens to React state when you refresh a page.

---

### Exercise 2: Next.js 4 Cache Layers Matrix

**Problem:** Identify the location (Server vs Client) for the 4 Next.js cache layers:
1. Request Memoization
2. Data Cache
3. Full Route Cache
4. Router Cache

**Expected output:**
```text
1. Server (Single request scope)
2. Server (Persistent across requests)
3. Server (HTML & RSC payload)
4. Client (Browser memory)
```

> [!check]- Answer
> - Request Memoization -> Server (Single request)
> - Data Cache -> Server (Persistent data store)
> - Full Route Cache -> Server (HTML & RSC payload)
> - Router Cache -> Client (Browser memory)
> 
> ```text
> 3 Server Caches + 1 Client Router Cache
> ```

---

### Exercise 3: Router Cache Stale Time Config (Next.js 14.2+)

**Problem:** Which `next.config.js` property configures client Router Cache stale times in Next.js 14.2+?

**Expected output:**
```text
experimental.staleTimes (e.g. staleTimes: { dynamic: 30, static: 180 })
```

> [!check]- Answer
> - `experimental.staleTimes` configures client Router Cache durations.
> 
> ```javascript
> module.exports = {
>   experimental: {
>     staleTimes: { dynamic: 30, static: 180 }
>   }
> };
> ```


---

## 7. Related Terms
- [On-Demand Revalidation](../level_06/on_demand_revalidation.md) — The primary tool for clearing Layers 2, 3, and 4.
- [Static Site Generation (SSG)](../level_08/ssg.md) — Essentially Layer 3.

---

## 8. Key Takeaways
- The Next.js Cache is made of four layers: Request Memoization, Data Cache, Full Route Cache, and Router Cache.
- **Request Memoization** deduplicates identical `fetch` calls during a single page render.
- **Data Cache** stores persistent data across multiple visitors on the server.
- **Full Route Cache** stores pre-rendered HTML on the server (SSG).
- **Router Cache** stores previously visited pages in the user's browser for instant backward/forward navigation.
