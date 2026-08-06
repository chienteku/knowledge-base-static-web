# Static Site Generation (SSG)

> **Level 9 — Advanced Rendering & Architecture**
> A rendering architecture where Nuxt pre-renders every single page of your application into fully complete, static HTML files *at build time*, rather than on-demand when a user requests them.

---

## 1. Prerequisites
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — SSR renders HTML on-demand. SSG renders HTML ahead of time.
- [Hydration](../level_01/hydration.md) — The client-side bootstrapping process that still runs after loading static HTML.

---

## 2. Term Category

**Rendering Strategy** (Static Site Generation Prerendering): Static Site Generation (SSG / `nuxi generate`) prerenders all application routes into static HTML and asset files at build time.



---

## 3. Explanation

### Environment Context
- **Build-Time**

### (1) Design Motivation — "Why did we design this?"
Server-Side Rendering (SSR) is great for SEO, but it requires a running Node.js server. If 100,000 users visit your blog post simultaneously, the Node server has to render that exact same blog post 100,000 times. This is inefficient and expensive.

If the content of the blog post hasn't changed, why render it over and over? 

**Static Site Generation (SSG)** solves this. When you run the `nuxi generate` command, Nuxt acts like a web crawler. It visits every single route in your application, executes the Vue components, fetches the API data, and saves the final result as a hardcoded `index.html` file on your disk.

### (2) The Ultimate Performance
Because the output is just raw `.html`, `.css`, and `.js` files, you do not need a Node.js server to host an SSG app. You can deploy it to a CDN (Content Delivery Network). 

When a user requests a page, the CDN serves the pre-built HTML file instantly. It is literally impossible to have a faster Time to First Byte (TTFB).

### (3) Enabling SSG
To tell Nuxt to generate static HTML files, you use the `nuxt generate` command instead of `nuxt build`.

```bash
# Development
npm run dev

# Production Build (SSR with Node.js Server)
npm run build

# Static Site Generation (Outputs static HTML files to the .output/public folder)
npm run generate
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using SSG for highly dynamic data
**The mistake:** Building a live sports ticker or a cryptocurrency dashboard and deploying it via `npm run generate`.

**Why it's wrong:** SSG fetches data *at build time*. If Bitcoin is $60,000 when you run `npm run generate` on Monday, the static HTML file will say $60,000 forever. If a user visits the site on Friday, they will still see $60,000 in the HTML until you trigger an entirely new build process.
**Golden Rule:** Only use SSG for content that changes infrequently (Blogs, Marketing Pages, Documentation). For highly dynamic data, use SSR or fetch the data purely on the client side using SPA mode.

---



### Mistake 2: Using `npx nuxi build` Instead of `npx nuxi generate` for Static Site Generation

**The mistake:** Running `nuxi build` expecting a static HTML output directory (`.output/public`).

**Why it's wrong:** `nuxi build` compiles a Node.js server output (`.output/server`). `nuxi generate` pre-renders all routes into static HTML files for static CDN hosting (`.output/public`).

*Incorrect:*
```bash
nuxi build // ❌ Builds Node.js server output, NOT static HTML files!
```

*Fix:*
```vue
nuxi generate # Pre-renders static HTML files into .output/public/
```

---



### Mistake 3: Using Dynamic Request Functions (`useCookie`, `useRequestHeaders`) in SSG Pages

**The mistake:** Reading request headers inside a static blog page intended for `nuxi generate`.

**Why it's wrong:** During `nuxi generate`, there is no incoming HTTP request object. Reading request headers returns `undefined` or throws build errors.

*Incorrect:*
```vue
<script setup>
const headers = useRequestHeaders(); // ❌ Undefined during nuxi generate static build!
</script>
```

*Fix:*
```vue
<script setup>
// Keep SSG pages pure; read user cookies in Client Components or onMounted
</script>
```


---


## 5. Practice Exercises

### Exercise 1: Generating Static Web Applications with `nuxi generate`

**Scenario:**
Configure static site generation (SSG) and execute `nuxi generate` build command.

**Requirements:**
1. Run `nuxi generate` CLI command.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> # Prerenders all static HTML files into .output/public/ directory
> npx nuxi generate
> ```
> 
> #### Technical Explanation
>
> 1. `nuxi generate` triggers Static Site Generation (SSG).
> 2. Nitro crawls all application routes, fetching data and saving rendered HTML files directly to disk.
> 3. Output directory `.output/public/` can be deployed directly to static hosts (GitHub Pages, Netlify, S3).
> 
---

### Exercise 2: Pre-Crawling Dynamic Routes for SSG Prerendering

**Scenario:**
Configure `nuxt.config.ts` `nitro.prerender.routes` to prerender dynamic blog post URLs (`/blog/post-1`, `/blog/post-2`).

**Requirements:**
1. Configure `nitro.prerender.routes` array in `nuxt.config.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   nitro: {
>     prerender: {
>       routes: ["/blog/post-1", "/blog/post-2", "/sitemap.xml"],
>       crawlLinks: true // Automatically crawls all discovered internal <NuxtLink> targets!
>     }
>   }
> });
> ```
> 
> #### Technical Explanation
>
> 1. Static site generators must know dynamic route paths during build time to generate corresponding HTML files.
> 2. `crawlLinks: true` automatically follows all `<NuxtLink>` elements discovered during prerendering.
> 3. `routes` array explicitly specifies dynamic route paths for SSG generation.
> 
---

### Exercise 3: Handling Fallback Routes for Static Hosting

**Scenario:**
Configure a 404 fallback page for static web servers when users access un-prerendered dynamic paths.

**Requirements:**
1. Configure `nitro.prerender.failOnError: false`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   nitro: {
>     prerender: {
>       failOnError: false
>     }
>   }
> });
> ```
> 
> #### Technical Explanation
>
> 1. Static file hosting services (Nginx, Netlify) route un-matched file requests to `200.html` or `404.html`.
> 2. Un-prerendered dynamic paths fall back to client-side SPA rendering in the browser.
> 3. Robust static site hosting pattern.
> 
---


## 6. Related Terms
- [Single Page Application (SPA) Mode](spa.md) — The other rendering mode that doesn't require a Node server, but sacrifices SEO.
- [Route Rules Configuration](../level_08/route_rules.md) — How to apply `prerender: true` to specific routes instead of the whole app.
- [`.output/` Directory](../level_10/output_directory.md) — Related concept: `.output/` Directory.
- [Hybrid Rendering](hybrid_rendering.md) — Related concept: Hybrid Rendering.

---

## 7. Key Takeaways
- SSG pre-renders your application into static HTML files during the build process.
- It is triggered using the `nuxi generate` command.
- It provides perfect SEO and the absolute fastest possible loading speeds.
- It does not require a Node.js server to host.
- It is not suitable for highly dynamic data that changes every minute.
