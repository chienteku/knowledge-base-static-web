# Content Delivery Network (CDN) & Edge Cache

> **Level 10 — Advanced Architecture**
> A globally distributed network of proxy servers that cache website content (such as HTML, images, and scripts) close to users' physical locations, minimizing latency and server load.

---

## 1. Prerequisites
- [Static Site Generation (SSG)](../level_08/ssg.md) — The rendering strategy designed to produce CDN-cacheable files.
- [Edge Runtime vs Node.js Runtime](edge_runtime.md) — The runtime that runs code at these edge locations.
---

## 2. Term Category
- **Infrastructure**

---

## 3. Environment Context
- **Universal** (Content is cached and distributed across edge servers globally, while origin logic resides on centralized servers).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If your application server is physically located in a data center in Virginia, USA, a user visiting your site from Tokyo, Japan, faces a physical limitation. Data signals must travel across undersea cables, introducing speed-of-light propagation delays. This round-trip network latency makes the page load slowly.

A **Content Delivery Network (CDN)** solves this. Instead of directing all global visitors to a single origin server, a CDN replicates and caches static assets across hundreds of edge servers (called Points of Presence, or PoPs) located around the world. 

When a user in Tokyo requests a static page, the CDN serves the cached HTML file from a Tokyo edge server in milliseconds, bypassing the Virginia origin server entirely.

---

### (2) CDN Caching Layers
In modern hosting platforms (like Vercel or Cloudflare), the CDN manages multiple caching layers:
-   **Static Assets Cache:** Stores images, CSS stylesheets, and pre-compiled client JavaScript bundles permanently.
-   **Edge Cache (Full Route Cache):** Stores compiled page HTML and React Server Component Payloads (SSG/ISR outputs).
-   **Edge Compute:** Runs lightweight serverless JavaScript functions (Middleware or Edge Routes) directly at the edge server closest to the user, allowing dynamic intercepts before request traffic reaches the origin.

---

### (3) Edge Cache Invalidation (Purging)
Because CDN servers are external to your database, they do not automatically know when database values change. 

To prevent visitors from seeing outdated data, Next.js uses On-Demand Revalidation to send cache-purge instructions to the CDN. This invalidates the cached HTML files at the edge, forcing them to pull fresh content from the origin server on the next request.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting a CDN cache to update immediately after database mutations without revalidation

**The mistake:** Updating a product price inside a database and expecting global visitors to instantly see the new price on a static product page:

**Why it's wrong:** The static product page is cached at the CDN Edge. The edge server does not query your database; it simply returns the frozen HTML. It will continue serving the old price until the cache expires (Time-based ISR) or is explicitly purged.

**Golden Rule:** Always trigger On-Demand Revalidation (`revalidatePath` or `revalidateTag`) inside your Server Actions to purge the CDN Edge cache when mutating data.

---

### Mistake 2: Caching User-Specific Private API Responses on Public CDN Nodes

**The mistake:** Returning `Cache-Control: public, max-age=3600` on a private `/api/user-profile` route.

**Why it's wrong:** Setting `public` allows shared CDN edge nodes to cache user A's private response and serve it to user B. Use `Cache-Control: private, no-store` for user-specific data.

*Incorrect:*
```typescript
res.headers.set('Cache-Control', 'public, max-age=3600'); // ❌ Exposes private user data to CDN cache!
```

*Fix:*
```typescript
res.headers.set('Cache-Control', 'private, no-store'); // Prevents public CDN caching
```

---

### Mistake 3: Performing Heavy CPU Computations inside Edge CDN Nodes

**The mistake:** Running complex machine learning model inferences inside Edge Runtime functions.

**Why it's wrong:** Edge nodes have strict CPU execution time limits (e.g. 50ms). Exceeding CPU limits causes Edge function termination. Offload heavy CPU tasks to Node.js serverless functions.

*Incorrect:*
```tsx
/* Heavy CPU image processing inside Edge Runtime function */
```

*Fix:*
```tsx
/* Execute heavy CPU tasks in standard Node.js serverless functions */
```


---

## 6. Practice Exercises

### Exercise 1: Edge Redirection Flow

**Problem:** A user visits a page `/dashboard` that is cached at a CDN edge in London. However, the request passes through your `middleware.ts` first. Explain why redirecting the user to `/login` from middleware is faster than redirecting from a Server Component:

**Expected output:**
> [!check]- Answer
> ```text
> Middleware runs directly on the Edge server in London. 
> Because the middleware intercepts the request at the edge, it can read the cookies and trigger the redirect to /login immediately without sending the request across the network to the central origin server. 
> Redirecting from a Server Component requires routing the request to the origin server, compiling the component, and returning the response, wasting time and network resources.
> ```
> - Think about the physical travel path of the network request.

---

### Exercise 2: Vercel Edge Network Dynamic Purge

**Problem:** Which HTTP response header allows Next.js static pages to be cached on global Vercel Edge CDN nodes with background revalidation?

**Expected output:**
> [!check]- Answer
> ```text
> s-maxage (e.g. Cache-Control: s-maxage=60, stale-while-revalidate)
> ```
> - `s-maxage` directs shared CDN edge caches.
> 
> ```http
> Cache-Control: s-maxage=60, stale-while-revalidate=3600
> ```

---

### Exercise 3: Edge vs Origin Latency Advantage

**Problem:** How does executing Edge Functions at CDN edge nodes reduce TTFB latency for international users?

**Expected output:**
> [!check]- Answer
> ```text
> Edge functions execute in PoP data centers physically closest to the user, eliminating round-trip latency to a distant central origin server.
> ```
> - Executes in CDN PoP data centers closest to the user.
> 
> ```text
> Reduces physical network round-trip distance.
> ```


---

## 7. Related Terms
- [Incremental Static Regeneration (ISR)](../level_08/isr.md) — The hybrid cache strategy managed by CDNs.
- [Serverless Functions](serverless_functions.md) — The centralized handlers that compile dynamic pages.
---

## 8. Key Takeaways
- CDNs store cached files on globally distributed proxy servers.
- Serving content from a local CDN edge minimizes round-trip latency.
- Static assets and pre-rendered SSG HTML are cached globally at the edge.
- CDN caches must be explicitly purged (revalidated) after data mutations.
- Edge Computing runs lightweight middleware logic at the CDN edge for instant redirects.
