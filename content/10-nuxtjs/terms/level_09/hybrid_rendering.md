# Hybrid Rendering

> **Level 9 — Advanced Rendering & Architecture**
> The modern Nuxt 3 paradigm that allows developers to mix and match different rendering strategies (SSR, SPA, SSG) on a route-by-route basis within the exact same application.

---

## 1. Prerequisites
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The default rendering strategy.
- [Single Page Application (SPA) Mode](spa.md) — The strategy that skips the server.
- [Static Site Generation (SSG)](ssg.md) — The strategy that pre-builds HTML.

---

## 2. Term Category

**Rendering Strategy** (Per-Route Rendering Mode Selection): Hybrid Rendering allows Nuxt 3 applications to assign different rendering strategies (SSR, SWR, SSG, SPA) per route rule.



---

## 3. Explanation

### Environment Context
- **Server / Build-Time**

### (1) Design Motivation — "Why did we design this?"
Historically, web frameworks forced you into a global architectural decision. You had to choose: "Is my app an SPA? Or is it an SSR app? Or is it an SSG blog?"

But real-world applications don't fit into one box. 
Imagine an E-commerce platform:
1. The **Marketing Homepage** changes rarely. It should be SSG for maximum speed.
2. The **Product Pages** change frequently and need SEO. They should be SSR.
3. The **User Settings Panel** is private. It should be SPA to save server resources.

Nuxt 3 introduced **Hybrid Rendering** to solve this. Powered by the Nitro engine, you can now define completely different rendering rules for different URLs in the exact same codebase.

### (2) Implementation via Route Rules
Hybrid Rendering is entirely controlled via the `routeRules` object inside `nuxt.config.ts`. You write your Vue pages normally, and then tell Nitro how to render them.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // 1. SSG: Pre-render the marketing homepage at build time
    '/': { prerender: true },

    // 2. SWR: Server-Side Render the product page, but cache it for 60 seconds
    '/products/**': { swr: 60 },

    // 3. SPA: Disable SSR completely for the private settings area
    '/settings/**': { ssr: false },

    // 4. SSR: The default fallback for everything else!
  }
})
```

### (3) Why Hybrid Rendering is Revolutionary
By utilizing Hybrid Rendering, you drastically reduce your server costs. Instead of forcing your Node.js server to expensively compute the HTML for every single request (pure SSR), you offload the static pages to the CDN (SSG) and the private pages to the user's browser (SPA). The server only spends compute power exactly where it is needed.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `prerender` on routes with dynamic user content
**The mistake:** Setting `'/profile/**': { prerender: true }` so that user profiles load lightning fast.

**Why it's wrong:** `prerender` (SSG) happens at *build time*. Nuxt has no idea who is logged in during the build process, so it will likely render an empty profile or an error state. When User A visits `/profile/123`, they will get served the hardcoded HTML generated during the build.
**Golden Rule:** Never use `{ prerender: true }` on routes that require authentication or rely on dynamic URL parameters that constantly change.

---



### Mistake 2: Disabling SSR Globally (`ssr: false`) Instead of Using Granular `routeRules`

**The mistake:** Setting `ssr: false` in `nuxt.config.ts` when only `/admin` dashboard requires SPA mode.

**Why it's wrong:** Disabling SSR globally destroys server rendering and SEO for all public pages. Use `routeRules` for granular per-route rendering strategies.

*Incorrect:*
```vue
export default defineNuxtConfig({
  ssr: false // ❌ Turns entire app into SPA, destroying SEO!
});
```

*Fix:*
```vue
export default defineNuxtConfig({
  routeRules: {
    '/admin/**': { ssr: false } // SPA mode only for admin dashboard
  }
});
```

---



### Mistake 3: Using `prerender: true` on Routes with Frequent User-Generated Dynamic Content

**The mistake:** Setting `prerender: true` on live stock trading or real-time chat routes.

**Why it's wrong:** `prerender: true` generates static HTML once at build time. Users visiting live routes will see stale HTML generated during deployment. Use `ssr: true` or `swr: 60`.

*Incorrect:*
```vue
routeRules: { '/live-chat': { prerender: true } } // ❌ Serves stale build-time HTML!
```

*Fix:*
```vue
routeRules: { '/live-chat': { ssr: false } } // Dynamic client execution for live data
```


---


## 5. Practice Exercises

### Exercise 1: Multi-Mode Route Configuration with `routeRules`

**Scenario:**
Configure `nuxt.config.ts` to assign SSR, SWR, SSG, and SPA modes to different URL paths.

**Requirements:**
1. Configure `routeRules` with `/` (SSR), `/blog/**` (SWR), `/about` (prerender), `/admin/**` (SPA).

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   routeRules: {
>     "/": { ssr: true },                    // Universal SSR (Default)
>     "/about": { prerender: true },          // Static Site Generation (SSG)
>     "/blog/**": { swr: 3600 },              // SWR (Cached 1 hour)
>     "/admin/**": { ssr: false }             // Client-side Single Page App (SPA)
>   }
> });
> ```
> 
> #### Technical Explanation
>
> 1. Hybrid Rendering assigns the optimal rendering strategy per route path.
> 2. `prerender` generates static HTML during build time; `swr` caches responses dynamically at runtime.
> 3. `ssr: false` disables server rendering for private interactive dashboards.
> 
---

### Exercise 2: Configuring Invalidation Windows for Incremental Static Regeneration (ISR)

**Scenario:**
Configure ISR (Incremental Static Regeneration) for `/news/**` with a 5-minute background revalidation window.

**Requirements:**
1. Set `isr: 300` in `routeRules`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   routeRules: {
>     "/news/**": { isr: 300 } // Revalidates every 5 minutes (300 seconds)
>   }
> });
> ```
> 
> #### Technical Explanation
>
> 1. `isr` caches static HTML responses at the edge/server and updates them in the background after the expiration window.
> 2. Delivers static file performance with dynamic content updates.
> 3. Popular strategy for high-traffic content sites.
> 
---

### Exercise 3: Testing Hybrid Route Execution Modes

**Scenario:**
Verify route rendering modes by inspecting `X-Nitro-Cache` and HTML document structures.

**Requirements:**
1. Inspect response headers and HTML payloads.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Route Verification Audit:
> - Prerendered Route (/about): Renders static HTML file directly from disk.
> - SWR Route (/blog/1): Returns 'X-Nitro-Cache: HIT' on repeated requests.
> - SPA Route (/admin): Renders minimal <div id="__nuxt"></div> wrapper without initial content.
> ```
> 
> #### Technical Explanation
>
> 1. SWR routes emit Nitro cache headers indicating cache hit/miss status.
> 2. SPA routes contain empty HTML bodies relying on client JavaScript initialization.
> 3. Empirical verification of hybrid rendering setup.
> 
---


## 6. Related Terms
- [Route Rules Configuration](../level_08/route_rules.md) — The syntax used to configure Hybrid Rendering.
- [Edge-Side Rendering (ESR)](esr.md) — Related concept: Edge-Side Rendering (ESR).
- [Static Site Generation (SSG)](ssg.md) — Static site generation.
- [Single Page Application (SPA) Mode](spa.md) — Single page app mode.
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — Related concept: Universal Rendering (SSR).

---

## 7. Key Takeaways
- Hybrid Rendering allows you to mix SSR, SPA, and SSG in the same application.
- It is configured using `routeRules` in `nuxt.config.ts`.
- It drastically optimizes server costs by only using SSR when necessary.
- Use `prerender: true` for SSG, `ssr: false` for SPA, and `swr: <seconds>` for cached SSR.
