# Static Site Generation (SSG)

> **Level 9 — Server-Side Rendering (SSR) & Nuxt**
> A pre-rendering architecture where a compiler generates complete, static HTML files for all application routes during the build step, enabling instant delivery via CDNs and zero server compute overhead.

---

## 1. Prerequisites

- [Server-Side Rendering (SSR)](ssr.md) — Dynamic server rendering mechanics used during build compilation.
- [Universal Code (Isomorphic)](universal_code.md) — Cross-platform JavaScript that executes in build Node environments and browser clients.
- [Nuxt.js](nuxt.md) — The Vue meta-framework that compiles static site builds.

---

## 2. Term Category

**Rendering Architecture (Static Compilation)**: Static Site Generation (SSG) is a deployment strategy where an application compiler (e.g. Nuxt Nitro) executes component setup, data fetching hooks, and template rendering *once* at build time. The build process writes static HTML, CSS, and pre-minified JavaScript assets to disk, which are deployed globally across CDN edge networks.

Unlike Client-Side Rendering (CSR), SSG serves populated HTML documents instantly. Unlike dynamic Server-Side Rendering (SSR), SSG requires no active Node.js server running per request, delivering maximum TTFB (Time to First Byte) performance, infinite scalability, and zero backend compute costs for static content.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Dynamic Server-Side Rendering (SSR) solved Client-Side Rendering's SEO and initial load speed problems. However, running a live Node.js server for every incoming request introduces backend server costs, security attack vectors, potential server crashes under traffic spikes, and network latency while waiting for server page compilation.

Static Site Generation (SSG) was designed as the ultimate rendering compromise for content that changes infrequently (blogs, documentation, e-commerce product catalogs). By pre-compiling all pages into static HTML files during CI/CD build deployment, applications achieve sub-100ms global CDN load speeds, robust security (no runtime server to hack), and resilience against traffic surges.

### (2) Reality Metaphor
Imagine a book printing press. Instead of hiring an author to write a custom manuscript by hand every time a customer walks into a bookstore (dynamic SSR), or handing the customer blank paper and pens to write the book themselves (CSR), the publisher prints 50,000 identical hardcopy books in advance (SSG build step) and stores them in local bookstores worldwide (CDNs).

When a customer wants a book, the clerk hands them a pre-printed copy off the shelf instantly. No waiting, no writing, no author required at the moment of purchase.

### (3) Vue Code Examples

#### Short Snippet
```javascript
// nuxt.config.ts (SSG Configuration)
export default defineNuxtConfig({
  // Enable static site generation prerendering
  ssr: true,
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/about', '/contact']
    }
  }
})
```

#### Fuller Example
```vue
<!-- pages/blog/[slug].vue (SSG Blog Post Page) -->
<script setup>
const route = useRoute()
const slug = route.params.slug

// Data fetched during build compilation step (nuxi generate)
const { data: post } = await useAsyncData(`blog-${slug}`, () => {
  return $fetch(`https://api.example.com/posts/${slug}`)
})

// Head metadata pre-rendered directly into build HTML headers
useSeoMeta({
  title: post.value?.title || 'Blog Post',
  description: post.value?.summary || 'Read our latest insights.'
})
</script>

<template>
  <main class="blog-container">
    <article v-if="post" class="post-content">
      <header>
        <h1>{{ post.title }}</h1>
        <p class="meta">Published on {{ post.publishedDate }}</p>
      </header>
      <div class="content" v-html="post.contentHtml"></div>
    </article>

    <div v-else class="not-found">
      <p>Article not found in pre-rendered static index.</p>
    </div>
  </main>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Fetching User-Specific or Dynamic Real-Time State During Build Step

**The mistake:** Calling authenticated APIs (user profile, current cart items, live stock ticks) during setup in an SSG page.

**Why it's wrong:** SSG builds execute component setup *once* on the build server. If you fetch user profile data during build time, the builder's profile (or an error state) gets frozen into the static HTML served to all visitors globally.

*Incorrect:*
```vue
<script setup>
// ❌ Runs ONCE during CI build! Freezes static user state for all visitors!
const user = await $fetch('/api/user/profile')
</script>
```

*Fix:*
```vue
<script setup>
import { ref, onMounted } from 'vue'
const user = ref(null)

onMounted(async () => {
  // ✅ Defer dynamic user state fetching to client browser post-hydration
  user.value = await $fetch('/api/user/profile')
})
</script>
```

---

### Mistake 2: Choosing SSG for Rapidly Changing, High-Frequency Real-Time Applications

**The mistake:** Using Static Site Generation for a live stock exchange trading platform or real-time sports score portal.

**Why it's wrong:** SSG pre-renders pages during deployment builds. Re-building tens of thousands of static HTML files for every stock price tick (multiple times per second) is computationally impossible. Use dynamic SSR or WebSocket CSR for high-frequency data.

*Incorrect:*
```javascript
// nuxt.config.ts
// ❌ Attempting to SSG pre-render dynamic stock ticker routes updated every second
nitro: { prerender: { routes: ['/stocks/live'] } }
```

*Fix:*
```javascript
// Use dynamic SSR or client-side WebSockets for real-time dynamic routes
routeRules: {
  '/stocks/live': { ssr: true } // Dynamic SSR per request
}
```

---

### Mistake 3: Failing to Trigger Re-Build Deployment Webhooks When CMS Content Updates

**The mistake:** Editing articles in a Headless CMS and expecting SSG production sites to update automatically without triggering deployment builds.

**Why it's wrong:** SSG pages are static HTML files on a CDN. Updating CMS database items does not modify pre-built HTML files until a new build script (`nuxi generate`) is executed.

*Incorrect:*
```text
Updating CMS content without configuring deployment build triggers.
```

*Fix:*
```text
Configure CMS webhooks (e.g. Contentful / Strapi) to trigger CI/CD build deployment pipelines automatically upon publishing.
```

---

## 5. Practice Exercises

### Exercise 1: IoT Documentation Portal Prerender Hook

**Scenario:** An industrial IoT hardware vendor pre-renders technical documentation using Nuxt SSG. To speed up CI build pipelines, dynamic doc routes are pre-fetched and fed into Nitro's prerender queue.

**Requirements:**
1. Configure dynamic route generation for doc slugs.
2. Use `useAsyncData` with key payload caching.
3. Inject doc title and description into SEO tags.
4. Include a test assertion validating static slug parameter parsing.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- pages/docs/[slug].vue -->
> <script setup>
> const route = useRoute()
> const slug = route.params.slug
> 
> const { data: doc } = await useAsyncData(`doc-${slug}`, () => ({
>   title: `Device Spec: ${slug}`,
>   content: 'Operational voltage: 24V. Operating temp: -40C to 85C.'
> }))
> 
> useSeoMeta({
>   title: doc.value.title
> })
> 
> function testDocSSG() {
>   console.assert(slug === 'sensor-modbus', 'Test Failed: Incorrect doc slug')
>   console.assert(doc.value.title.includes('sensor-modbus'), 'Test Failed: Title mismatch')
>   console.log('IoT Doc SSG Test Passed')
> }
> 
> onMounted(() => {
>   testDocSSG()
> })
> </script>
> 
> <template>
>   <div class="doc-page">
>     <h2>{{ doc.title }}</h2>
>     <div class="spec-body">{{ doc.content }}</div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: SSG compilers evaluate `useAsyncData` during build time to output static HTML pages.
> 2. **Concept**: Static meta headers (`useSeoMeta`) are compiled directly into index `.html` files.
> 3. **Concept**: Fast CDN delivery serves pre-built documentation instantly without database queries.
> 4. **Concept**: Unit assertions verify static route compilation data integrity.
> 
---

### Exercise 2: Financial Quarterly Report Static Generator

**Scenario:** An investment bank publishes quarterly financial audit reports. Reports must be compiled as static SSG pages for regulatory immutability and instant CDN distribution.

**Requirements:**
1. Fetch static audit report data during build compilation.
2. Format financial tables with zero client network fetch dependencies.
3. Provide a print CSS helper trigger post-mount.
4. Verify via inline test assertions that financial metrics are rendered in static output.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> const { data: report } = await useAsyncData('q4-report', () => ({
>   year: 2025,
>   quarter: 'Q4',
>   revenue: 125000000,
>   netMargin: 0.24
> }))
> 
> function testFinancialSSG() {
>   console.assert(report.value.quarter === 'Q4', 'Test Failed: Report quarter mismatch')
>   console.assert(report.value.revenue === 125000000, 'Test Failed: Revenue data missing')
>   console.log('Financial SSG Test Passed')
> }
> 
> onMounted(() => {
>   testFinancialSSG()
> })
> </script>
> 
> <template>
>   <div class="report-container">
>     <h1>{{ report.year }} {{ report.quarter }} Audit Report</h1>
>     <p>Total Revenue: ${{ (report.revenue / 1e6).toFixed(1) }}M</p>
>     <p>Net Margin: {{ (report.netMargin * 100).toFixed(1) }}%</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Financial report HTML is baked into immutable static assets during deployment.
> 2. **Concept**: Zero database connection required on host server during client page visits.
> 3. **Concept**: SSG outputs achieve optimal security because no backend execution environment is exposed.
> 4. **Concept**: Assertions verify static financial report data consistency.
> 
---

### Exercise 3: E-Commerce Static Product Catalog Generation

**Scenario:** An online apparel store pre-renders 5,000 product catalog pages using SSG to maximize SEO search rankings and lower hosting infrastructure costs.

**Requirements:**
1. Fetch product catalog payload at build time.
2. Render product images, pricing, and structured JSON-LD schema.
3. Defer real-time inventory stock checks to client `onMounted` calls.
4. Verify via inline assertions that static pricing matches pre-rendered values.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted } from 'vue'
> 
> // Build-time static product details
> const { data: product } = await useAsyncData('prod-101', () => ({
>   id: 101,
>   name: 'Leather Jacket',
>   price: 199.99
> }))
> 
> // Dynamic client inventory check
> const inStock = ref(true)
> 
> onMounted(async () => {
>   // Fetch live stock status post-hydration
>   inStock.value = await new Promise(res => setTimeout(() => res(true), 100))
>   testCatalogSSG()
> })
> 
> function testCatalogSSG() {
>   console.assert(product.value.price === 199.99, 'Test Failed: Product price mismatch')
>   console.assert(inStock.value === true, 'Test Failed: Inventory state unverified')
>   console.log('E-Commerce SSG Catalog Test Passed')
> }
> </script>
> 
> <template>
>   <div class="catalog-card">
>     <h2>{{ product.name }}</h2>
>     <p class="price">${{ product.price }}</p>
>     <p>Availability: {{ inStock ? 'In Stock' : 'Out of Stock' }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Hybrid SSG pattern pre-renders static product content while deferring real-time stock checks to client runtime.
> 2. **Concept**: Static HTML allows search engine bots to index product pages instantly.
> 3. **Concept**: Client-side hydration updates dynamic inventory state without requiring full-page server builds.
> 4. **Concept**: Unit tests confirm static and dynamic state integration.
> 
---

## 6. Related Terms

- [Server-Side Rendering (SSR)](ssr.md) — Dynamic per-request server rendering alternative to static compilation.
- [Universal Code (Isomorphic)](universal_code.md) — Cross-platform JavaScript required for build-time compilation.
- [Nuxt.js](nuxt.md) — The framework executing SSG build triggers (`nuxi generate`).
- [Client-Side Rendering (CSR)](csr.md) — Client activation model post-SSG HTML hydration.

---

## 7. Key Takeaways

- **Static Site Generation (SSG)** pre-renders a Vue application into static HTML files during the build compilation step.
- Delivers maximum initial page load speed (TTFB) and infinite scalability via global CDN distribution.
- Eliminates backend Node.js server compute costs and runtime server security vulnerabilities.
- Real-time user data or authenticated state must be deferred to client execution post-hydration.
- Content updates in Headless CMS platforms require automated build webhooks to re-generate static assets.
