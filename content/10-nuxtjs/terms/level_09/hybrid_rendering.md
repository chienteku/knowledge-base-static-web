# Hybrid Rendering

> **Level 9 — Advanced Rendering & Architecture**
> The modern Nuxt 3 paradigm that allows developers to mix and match different rendering strategies (SSR, SPA, SSG) on a route-by-route basis within the exact same application.

---

## 1. Prerequisites
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The default rendering strategy.
- [Single Page Application (SPA)](../level_09/spa.md) — The strategy that skips the server.
- [Static Site Generation (SSG)](../level_09/ssg.md) — The strategy that pre-builds HTML.

---

## 2. Term Category
- **Rendering Strategies**

---

## 3. Environment Context
- **Server / Build-Time**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

### Mistake 4: Disabling SSR Globally (`ssr: false`) Instead of Using Granular `routeRules`

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

### Mistake 5: Using `prerender: true` on Routes with Frequent User-Generated Dynamic Content

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

### Mistake 6: Disabling SSR Globally (`ssr: false`) Instead of Using Granular `routeRules`

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

### Mistake 7: Using `prerender: true` on Routes with Frequent User-Generated Dynamic Content

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

## 6. Practice Exercises

### Exercise 1: Caching the API

**Problem:** Hybrid rendering applies to API routes too! Write a route rule that caches all requests to `/api/public-stats` for exactly 1 hour (3600 seconds) using the Stale-While-Revalidate (SWR) strategy.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineNuxtConfig({
>   routeRules: {
>     '/api/public-stats': { swr: 3600 }
>   }
> })
> ```
> - SWR caching is applied using the `swr` configuration property, passing the duration in seconds.

---

### Exercise 2: Hybrid Rendering routeRules Pattern

**Problem:** Write `nuxt.config.ts` `routeRules` configuring:
1. `/` -> Prerendered SSG
2. `/blog/**` -> SWR 1 hour (3600s)
3. `/dashboard/**` -> Client SPA (`ssr: false`)

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineNuxtConfig({
>   routeRules: {
>     '/': { prerender: true },
>     '/blog/**': { swr: 3600 },
>     '/dashboard/**': { ssr: false }
>   }
> });
> ```
> - `routeRules` mixes SSG, SWR, SSR, and SPA in a single application.
> 
> ```typescript
> export default defineNuxtConfig({
>   routeRules: {
>     '/': { prerender: true },
>     '/blog/**': { swr: 3600 },
>     '/dashboard/**': { ssr: false }
>   }
> });
> ```

---

### Exercise 3: SWR vs Prerender Distinction

**Problem:** Contrast `swr: 60` vs `prerender: true` in `routeRules`.

**Expected output:**
> [!check]- Answer
> ```text
> swr: 60: Serves cached static page and revalidates in background on server every 60 seconds;
> prerender: true: Generates static page ONCE during build time.
> ```
> - `swr: 60` -> Background server revalidation on timer.
> - `prerender: true` -> Static build-time generation.
> 
> ```text
> swr = Background Revalidate; prerender = Build-Time Static
> ```


---

## 7. Related Terms
- [Route Rules Configuration](../level_08/route_rules.md) — The syntax used to configure Hybrid Rendering.

---

## 8. Key Takeaways
- Hybrid Rendering allows you to mix SSR, SPA, and SSG in the same application.
- It is configured using `routeRules` in `nuxt.config.ts`.
- It drastically optimizes server costs by only using SSR when necessary.
- Use `prerender: true` for SSG, `ssr: false` for SPA, and `swr: <seconds>` for cached SSR.
