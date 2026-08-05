# Route Rules Configuration

> **Level 8 — Middleware & Plugins**
> A powerful configuration block inside `nuxt.config.ts` that allows you to change the caching, rendering mode, and CORS headers for specific URLs without writing any server middleware code.

---

## 1. Prerequisites
- [`nuxt.config.ts`](../level_06/nuxt_config.md) — Where route rules are defined.
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The default rendering mode that Route Rules can override.
---

## 2. Term Category
- **Routing**

---

## 3. Environment Context
- **Server / Build-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Historically, if you wanted to change how a framework behaved, it was an "all or nothing" decision. You either made your *entire* site a Single Page App (SPA), or your *entire* site Server-Side Rendered (SSR).

But modern apps are complex. The `/admin` dashboard should probably be an SPA (so the server doesn't waste resources rendering secure data). The `/blog` should probably be statically generated (SSG) for perfect SEO. The `/api` routes might need strict CORS headers.

**Route Rules** (powered by Nitro) allow you to apply completely different rendering modes, caching strategies, and headers on a route-by-route basis inside your `nuxt.config.ts`.

### (2) Core Concept
You define `routeRules` as an object where the key is a glob pattern (matching the URL path) and the value is the configuration.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // 1. Make the admin dashboard SPA-only (Skip SSR)
    '/admin/**': { ssr: false },

    // 2. Add CORS headers to all API routes automatically
    '/api/**': { cors: true },

    // 3. Setup a permanent redirect
    '/old-page': { redirect: '/new-page' },

    // 4. Cache the blog index page for 60 seconds (SWR/ISR)
    '/blog': { swr: 60 },
    
    // 5. Statically generate all blog posts at build time!
    '/blog/**': { prerender: true }
  }
})
```

### (3) The Power of SWR (Stale-While-Revalidate)
The `{ swr: 60 }` rule is incredible for high-traffic sites. If 1,000 users visit the `/blog` page at the same time, Nitro will SSR the page *once*, cache the HTML, and serve that exact HTML to the other 999 users. After 60 seconds, the cache is marked stale, and Nitro will secretly render a fresh version in the background. This allows your app to handle massive traffic spikes flawlessly.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing Route Rules with Route Middleware
**The mistake:** Trying to use Route Rules to secure an admin dashboard.

**Why it's wrong:** Route Rules control *how* a page is rendered by the server (caching, headers, SSR). They do not evaluate Vue logic or check authentication cookies dynamically. 
**Golden Rule:** Use Route Middleware (`middleware/auth.ts`) to check if a user is logged in. Use Route Rules (`routeRules: { '/admin/**': { ssr: false } }`) to tell the server *how* to build that admin page.

---

### Mistake 2: Confusing Client-Side Route Middleware with Server-Side Nitro `routeRules`

**The mistake:** Attempting to set `routeRules` dynamically inside Vue component `<script setup>`.

**Why it's wrong:** `routeRules` is a Nitro server configuration defined in `nuxt.config.ts`. It cannot be executed inside client Vue component files.

*Incorrect:*
```vue
<script setup>
routeRules({ '/admin/**': { ssr: false } }); // ❌ Invalid client script call!
</script>
```

*Fix:*
```vue
// Configure routeRules in nuxt.config.ts:
export default defineNuxtConfig({
  routeRules: { '/admin/**': { ssr: false } }
});
```

---

### Mistake 3: Setting SWR Revalidate Rules on Highly Dynamic Real-Time Routes

**The mistake:** Setting `swr: 3600` (1 hour cache) on real-time stock ticker or live chat routes.

**Why it's wrong:** `swr: 3600` caches server responses on CDN nodes for 1 hour. Users visiting live stock routes will receive stale cached HTML.

*Incorrect:*
```vue
routeRules: { '/live-ticker': { swr: 3600 } } // ❌ Serves stale data on live routes!
```

*Fix:*
```vue
routeRules: { '/live-ticker': { ssr: false } } // Disable SSR for real-time client routes
```


---

## 6. Practice Exercises

### Exercise 1: Hybrid Architecture

**Problem:** You are building a Nuxt app. The default is SSR. Write the `routeRules` block to achieve two things:
1. Make every route under `/app/` render as a Single Page App (No SSR).
2. Ensure requests to `/api/v1/public` include CORS headers.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineNuxtConfig({
>   routeRules: {
>     '/app/**': { ssr: false },
>     '/api/v1/public/**': { cors: true }
>   }
> })
> ```
> - Map glob patterns to specific rule targets: `/app/**` maps to `{ ssr: false }` and `/api/v1/public/**` maps to `{ cors: true }`.

---

### Exercise 2: Hybrid Rendering routeRules Matrix

**Problem:** Write `nuxt.config.ts` `routeRules` configuring:
1. `/` -> Prerender static SSG
2. `/blog/**` -> SWR cache for 1 hour (3600s)
3. `/admin/**` -> SPA mode (`ssr: false`)
4. `/old-path` -> Redirect to `/new-path` (301)

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineNuxtConfig({
>   routeRules: {
>     '/': { prerender: true },
>     '/blog/**': { swr: 3600 },
>     '/admin/**': { ssr: false },
>     '/old-path': { redirect: { to: '/new-path', statusCode: 301 } }
>   }
> });
> ```
> - `routeRules` configures per-route hybrid rendering and caching.
> 
> ```typescript
> export default defineNuxtConfig({
>   routeRules: {
>     '/': { prerender: true },
>     '/blog/**': { swr: 3600 },
>     '/admin/**': { ssr: false },
>     '/old-path': { redirect: { to: '/new-path', statusCode: 301 } }
>   }
> });
> ```

---

### Exercise 3: routeRules CORS Config

**Problem:** Write `routeRules` snippet applying `cors: true` headers to all API endpoints under `/api/**`.

**Expected output:**
> [!check]- Answer
> ```typescript
> routeRules: { '/api/**': { cors: true } }
> ```
> - `cors: true` adds CORS headers to matching route patterns.
> 
> ```typescript
> routeRules: {
>   '/api/**': { cors: true }
> }
> ```


---

## 7. Related Terms
- [Hybrid Rendering](../level_09/hybrid_rendering.md) — The architectural pattern that Route Rules enables.
- [Static Site Generation (SSG)](../level_09/ssg.md) — The `prerender: true` rule.
- [Single Page Application (SPA) Mode](../level_09/spa.md) — Related concept: Single Page Application (SPA) Mode.
- [`nuxt.config.ts`](../level_06/nuxt_config.md) — nuxt.config.ts configuration.
---

## 8. Key Takeaways
- `routeRules` in `nuxt.config.ts` give you fine-grained control over specific URLs.
- You can mix SSR, SPA, and SSG in the exact same application.
- Use `{ ssr: false }` to disable server rendering for highly dynamic or secure routes.
- Use `{ swr: 60 }` to cache HTML on the server to handle high-traffic spikes.
