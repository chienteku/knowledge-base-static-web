# Static Site Generation (SSG)

> **Level 9 — Server-Side Rendering (SSR) & Nuxt**
> A rendering strategy where a compiler pre-renders a Vue application into static, pre-populated HTML files during the build step, enabling ultra-fast delivery via CDNs and optimal SEO.

---

## 1. Prerequisites
- [Server-Side Rendering (SSR)](../level_09/ssr.md) — Dynamic server pre-rendering.
- [Universal Code](../level_09/universal_code.md) — JavaScript that runs on both server and client.
- [Nuxt.js](../level_09/nuxt.md) — The Vue meta-framework that compiles SSG sites.

---

## 2. Term Category
- **Rendering Mechanic**

---

## 3. Environment Context
- **Build-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard Client-Side Rendering (CSR), the server sends a blank `index.html` and a massive JavaScript bundle to the browser. The browser must download and execute this JavaScript before anything appears on the screen. This results in two major issues:
1. **Poor SEO:** Search engine spiders crawling your page see a blank canvas.
2. **Slow Initial Load:** Users on slow mobile connections stare at a blank screen while the script downloads.

Server-Side Rendering (SSR) fixes this by generating HTML dynamically on the server for *every* page request. However, SSR introduces new problems:
- You must run and maintain a live Node.js server.
- The server takes time to render the page, increasing time-to-first-byte (TTFB) latency.
- High server CPU costs during heavy traffic spikes.

**Static Site Generation (SSG)** is the ultimate hybrid solution. Instead of generating HTML dynamically in response to a page request, a compiler renders the HTML *once* during the project's build step. Since the pages are simple static files (`.html`, `.css`, `.js`), you can host them on a global CDN edge cache. Pages load instantly, server compute costs fall to zero, and search engines receive fully populated HTML documents.

### (2) How it works under the hood
During the build step (e.g. running `npx nuxt generate`):
1. A Node.js environment boots up and runs your Vue application.
2. The Nuxt compiler crawls your pages. For dynamic paths (like `/blog/:id`), it fetches list data from your CMS/database and builds a list of URLs.
3. For each URL, Vue's virtual DOM is rendered to a static HTML string using Vue's server-renderer utility.
4. The generated HTML is written to disk alongside pre-minified JS bundles.
5. When a user requests `/about`, the CDN serves `/about/index.html` instantly.
6. Once loaded in the browser, the static HTML is **hydrated** by Vue's client-side script, transitioning it into a highly interactive Vue SPA.

### (3) Code Examples

#### Short Snippet
Configuring Nuxt for static site generation in `nuxt.config.js`:
```javascript
export default defineNuxtConfig({
  // Enable SSR so pages can be pre-rendered to HTML
  ssr: true,
  
  // Set the deployment target to static hosting
  routeRules: {
    // Generate static pages at build time
    '/**': { prerender: true }
  }
})
```

#### Fuller Example
When compiling dynamic routes (like a blog with thousands of articles), the SSG engine needs to know what routes exist so it can pre-render their files. In Nuxt 3, you specify these dynamic routes inside the build config:

```javascript
// nuxt.config.js
import axios from 'axios'

export default defineNuxtConfig({
  ssr: true,
  
  nitro: {
    prerender: {
      // Pre-compile index, contact, and fallback routes automatically
      routes: ['/', '/contact', '/404']
    }
  },
  
  // Custom build hook to fetch product IDs and feed them to the static generator
  hooks: {
    async 'nitro:config'(config) {
      if (process.env.NODE_ENV === 'production') {
        const res = await axios.get('https://api.example.com/products')
        const productRoutes = res.data.map(product => `/product/${product.id}`)
        
        // Push the paths into Nitro's prerender list
        config.prerender.routes.push(...productRoutes)
      }
    }
  }
})
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Fetching user-specific or real-time data during the build step

**The mistake:** Fetching live notifications, user profile status, or real-time shopping cart counts during the initial render hook.

**Why it's wrong:** The HTML of an SSG site is created *once* at compile time. If you fetch user profile data during the build, the compiler will freeze the builder's profile (or throw an error because there is no logged-in user in Node). Every user visiting the site will see that cached build-time HTML state.

*Incorrect:*
```vue
<!-- This runs at build time on the developer's laptop or CI/CD server! -->
<script setup>
const response = await fetch('https://api.example.com/user/profile')
const user = await response.json()
</script>
```

*Fix:* Perform static API fetches at build time, and defer dynamic user-specific actions to run client-side inside `onMounted` after the static page is hydrated.
```vue
<script setup>
import { ref, onMounted } from 'vue'

const user = ref(null)

onMounted(async () => {
  // Runs strictly in the browser after hydration has completed!
  const response = await fetch('/api/user/profile')
  user.value = await response.json()
})
</script>
```

**Golden Rule:** SSG HTML is completely static. Fetch global, public page data at build time, and load user-specific or real-time data on the client side after hydration.

---

### Mistake 2: Choosing Static Site Generation (SSG) for Real-Time High-Frequency Dynamic User Data

**The mistake:** Attempting to use SSG for a real-time stock trading application with 1,000 price updates per second.

**Why it's wrong:** SSG pre-renders static HTML files at BUILD TIME. Real-time dynamic user data requires SSR or CSR. Re-building 10,000 SSG pages for every price tick is impossible.

*Incorrect:*
```vue
/* Attempting to use static site generation for live stock ticker pages */
```

*Fix:*
```vue
/* Use SSR (Server-Side Rendering) or Client-Side WebSockets for live data */
```

---

### Mistake 3: Failing to Trigger Re-Build Pipelines When CMS Content Updates in SSG Applications

**The mistake:** Updating articles in a headless CMS and expecting SSG production sites to update automatically without triggering a build.

**Why it's wrong:** SSG pages are static HTML artifacts generated during build time. Updating CMS data requires triggering a webhook deploy build pipeline (`nuxt generate` / `vite build`).

*Incorrect:*
```vue
/* Updating Headless CMS data without triggering SSG build webhooks */
```

*Fix:*
```vue
/* Configure CMS webhooks to trigger automated SSG deployment builds */
```


---

## 6. Practice Exercises

### Exercise 1: Optimizing Blog Render Times

**Problem:** You are building an SSG documentation portal. Some pages contain large code listings. If you use standard fetching, the compiler makes a network request for every page, dragging down build times. Complete the script block using `useAsyncData` with `getCachedData` to prevent redundant network fetches during the static compile.

```vue
<script setup>
const route = useRoute()

// Fetch doc article details, using key caching to speed up the compile build
const { data: doc } = await useAsyncData(
  `doc-${route.params.slug}`,
  () => $fetch(`https://api.example.com/docs/${route.params.slug}`),
  {
    // Provide cache helper logic
    getCachedData(key) {
      const nuxtApp = useNuxtApp()
      return nuxtApp.payload.data[key] || null
    }
  }
)
</script>
```

**Expected output:**
```text
The compiler reuses compiled data payloads between pages rather than re-requesting the API.
```

> [!check]- Answer
> - In Nuxt, `useAsyncData` can cache payload states.
> - The third argument configuration object supports `getCachedData(key)`.

---

### Exercise 2: Nuxt SSG Build Command

**Problem:** Which CLI command generates a static pre-rendered SSG deployment build in Nuxt 3?

**Expected output:**
```text
npx nuxi generate (or npm run generate)
```

> [!check]- Answer
> - `nuxi generate` pre-renders all application routes into static HTML/JS files.
> 
> ```bash
> npx nuxi generate
> ```

---

### Exercise 3: SSG vs SSR Hosting Comparison

**Problem:** Can SSG static site outputs be hosted on free CDN hosting services (GitHub Pages, Netlify) without a running Node.js server?

**Expected output:**
```text
Yes. SSG generates pure static HTML, CSS, and JS files that require zero server-side Node.js execution runtime.
```

> [!check]- Answer
> - SSG outputs static files compatible with all web servers and CDNs.
> 
> ```text
> Yes. SSG requires zero server runtime environment.
> ```


---

## 7. Related Terms
- [Server-Side Rendering (SSR)](../level_09/ssr.md) — 
- [Universal Code](../level_09/universal_code.md) — 
- [Nuxt.js](../level_09/nuxt.md) — 

---

## 8. Key Takeaways
- **SSG** pre-renders a Vue application into static HTML files during the build step.
- Enables deployment on simple CDN hosts, lowering hosting overhead to almost zero.
- Ensures excellent SEO and near-instant initial loading times because browsers receive structured HTML immediately.
- Once loaded, client-side scripts hydrate the static document, converting the page into a dynamic Vue single page application.
- Real-time or user-specific data must be deferred to load in the browser after hydration.
