# Route Rules Configuration

> **Level 8 — Middleware & Plugins**
> A powerful configuration block inside `nuxt.config.ts` that allows you to change the caching, rendering mode, and CORS headers for specific URLs without writing any server middleware code.

---

## 1. Prerequisites
- [`nuxt.config.ts`](../level_06/nuxt_config.md) — Where route rules are defined.
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The default rendering mode that Route Rules can override.

---

## 2. Term Category

**Rendering Strategy** (Route-Level Hybrid Rendering Configuration): `routeRules` configures per-route rendering strategies (SWR, ISR, SSG, SPA) and proxy rules in `nuxt.config.ts`.



---

## 3. Explanation

### Environment Context
- **Server / Build-Time**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Configuring SWR Edge Caching with `routeRules`

**Scenario:**
Configure Stale-While-Revalidate caching for all product pages (`/products/**`) for 10 minutes in `nuxt.config.ts`.

**Requirements:**
1. Configure `routeRules` with `swr: 600`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   routeRules: {
>     "/products/**": { swr: 600 },
>     "/blog/**": { isr: 3600 }
>   }
> });
> ```
> 
> #### Technical Explanation
>
> 1. `swr: 600` caches rendered HTML responses at the CDN/server edge for 600 seconds (10 minutes).
> 2. Subsequent requests receive instant cached responses while revalidating fresh HTML in the background.
> 3. Core Hybrid Rendering optimization feature.
> 
---

### Exercise 2: Setting Custom Response Headers and Redirect Rules

**Scenario:**
Configure permanent 301 redirects from `/old-about` to `/about` and attach CORS headers to `/api/**`.

**Requirements:**
1. Configure `redirect` and `headers` in `routeRules`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   routeRules: {
>     "/old-about": { redirect: { to: "/about", statusCode: 301 } },
>     "/api/**": {
>       headers: { "Access-Control-Allow-Origin": "*" }
>     }
>   }
> });
> ```
> 
> #### Technical Explanation
>
> 1. `redirect` rule delegates HTTP redirects directly to the Nitro engine layer without booting Vue application logic.
> 2. `headers` attaches default HTTP headers to all matching route responses.
> 3. High performance server configuration rule.
> 
---

### Exercise 3: Configuring SPA Fallback Rendering for Protected Apps

**Scenario:**
Disable server SSR rendering for all dashboard routes (`/app/**`) to run as a pure client-side SPA.

**Requirements:**
1. Configure `ssr: false` in `routeRules`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   routeRules: {
>     "/app/**": { ssr: false }
>   }
> });
> ```
> 
> #### Technical Explanation
>
> 1. `ssr: false` disables server-side rendering for matched paths, sending a lightweight HTML wrapper to the browser.
> 2. Client browser executes full rendering as a Single Page Application (SPA).
> 3. Reduces server Node.js CPU rendering overhead for authenticated user dashboards.
> 
---


## 6. Related Terms
- [Hybrid Rendering](../level_09/hybrid_rendering.md) — The architectural pattern that Route Rules enables.
- [Static Site Generation (SSG)](../level_09/ssg.md) — The `prerender: true` rule.
- [Single Page Application (SPA) Mode](../level_09/spa.md) — Related concept: Single Page Application (SPA) Mode.
- [`nuxt.config.ts`](../level_06/nuxt_config.md) — nuxt.config.ts configuration.

---

## 7. Key Takeaways
- `routeRules` in `nuxt.config.ts` give you fine-grained control over specific URLs.
- You can mix SSR, SPA, and SSG in the exact same application.
- Use `{ ssr: false }` to disable server rendering for highly dynamic or secure routes.
- Use `{ swr: 60 }` to cache HTML on the server to handle high-traffic spikes.
