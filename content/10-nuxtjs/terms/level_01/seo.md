# Search Engine Optimization (SEO)

> **Level 1 — Core Concepts & Architecture**
> The practice of structuring website content, HTML markup, and page indexing configurations to maximize organic search rankings on search engines (like Google and Bing).

---

## 1. Prerequisites
None (Entry-level term)
---

## 2. Term Category
- **SEO**

---

## 3. Environment Context
- **Universal** (SEO properties are compiled server-side inside header tags and parsed by external search crawler engines).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Organic search traffic is critical for e-commerce, blogs, and marketing platforms. To determine where your website ranks in search results, search engine spiders (crawlers) request page URLs, parse the raw text source, and analyze the content structure.

In standard Client-Side Rendered (CSR) applications, the server returns an empty HTML wrapper:
```html
<!DOCTYPE html>
<html>
<head><title>My App</title></head>
<body><div id="root"></div><script src="/bundle.js"></script></body>
</html>
```

Because the body content is empty initially, search crawlers that do not run JavaScript (or have strict computation limits) index your website as a completely blank page. 

Nuxt 3 uses Server-Side Rendering (SSR) to compile Vue components on the server first, delivering fully populated HTML documents that crawlers can index instantly.

---

### (2) Key SEO Head Meta Tags
To optimize search relevance, HTML documents include specific metadata inside the `<head>` block:
-   **Title Tag (`<title>`):** The page title displayed on search engine result lists.
-   **Meta Description (`<meta name="description">`):** A brief summary of the page contents displayed below the title.
-   **Open Graph (`og:title`, `og:image`):** Protocol tags used by social networks (such as LinkedIn, X, or Facebook) to generate rich link preview cards when a user shares the URL.

---

### (3) Nuxt 3 SEO Integration
Nuxt 3 builds on top of Vue's reactive head manager (`@unhead/vue`), exposing composables like `useHead()` and `useSeoMeta()`. These helper methods inject metadata dynamically into layout headers during server rendering, adjusting properties dynamically as the user navigates.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying on client-side client routing for initial SEO tags

**The mistake:** Assuming search crawlers will navigate your client-only pages and compile dynamic metadata:

```vue
<!-- Inside a ClientOnly wrapper -->
<ClientOnly>
  <div v-if="loaded">
    <!-- Too late for search crawler indexers! -->
    <h1>My Product Title</h1>
  </div>
</ClientOnly>
```

**Why it's wrong:** Search crawlers prefer static HTML. If your primary text headings and meta descriptions are locked inside client-only wrappers or require client-side execution to fetch, crawlers will index the page outline without this details.

**Golden Rule:** Keep primary SEO titles, descriptions, and structural tags inside Server Components so they compile directly into the initial HTML document payload.

---

### Mistake 2: Hardcoding Plain HTML `<head>` Tags Instead of Using `useHead()` or `useSeoMeta()`

**The mistake:** Writing `<head><title>My Site</title></head>` inside Vue page templates.

**Why it's wrong:** Vue templates in Nuxt 3 do NOT render direct `<head>` elements. Use `useHead()` or `useSeoMeta()` composables for reactive server-side head injection.

*Incorrect:*
```vue
<template>
  <head><title>My Site</title></head> <!-- ❌ Ignored by Nuxt renderer! -->
</template>
```

*Fix:*
```vue
<script setup>
useHead({
  title: 'My Site',
  meta: [{ name: 'description', content: 'SEO Description' }]
});
</script>
```

---

### Mistake 3: Passing Non-Reactive Strings to Dynamic `useHead()` Properties

**The mistake:** Passing un-ref'd variables `useHead({ title: product.title })` inside reactive data watchers.

**Why it's wrong:** If product data changes on the client side, static strings passed to `useHead` will not update. Pass getter functions `title: () => product.value.title` or refs for dynamic reactivity.

*Incorrect:*
```vue
useHead({ title: product.value.name }); // ❌ Does NOT update if product.value changes dynamically!
```

*Fix:*
```vue
useHead({
  title: () => product.value?.name ?? 'Default Title' // Getter function updates dynamically
});
```


---

## 6. Practice Exercises

### Exercise 1: Identify the SEO Value

**Problem:** Read the two HTML structures below. State which document is optimized for search indexing, and explain why:

**Document A:**
```html
<body><div id="app"></div></body>
```

**Document B:**
```html
<body>
  <div id="app">
    <h1>Nuxt.js Tutorial</h1>
    <p>Learn how to build server-side rendered Vue applications from scratch.</p>
  </div>
</body>
```

**Expected output:**
> [!check]- Answer
> ```text
> Document B is optimized for search indexing. 
> It contains raw semantic HTML elements (h1, p) directly inside the body. 
> Search crawlers can read this content immediately upon download without executing JavaScript, whereas Document A is blank and requires JS compilation to show any text.
> ```
> - Search engines inspect raw HTTP response text bodies.

---

### Exercise 2: useSeoMeta Composables Pattern

**Problem:** Write `<script setup>` using `useSeoMeta()` configuring `title`, `description`, and OpenGraph image `ogImage`.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup>
> useSeoMeta({
>   title: 'My Product',
>   description: 'Product Description',
>   ogImage: 'https://example.com/og.jpg'
> });
> </script>
> ```
> - `useSeoMeta()` provides strongly typed, auto-completed SEO metadata.
> 
> ```vue
> <script setup>
> useSeoMeta({
>   title: 'E-Commerce Store',
>   description: 'Shop top quality products online.',
>   ogTitle: 'E-Commerce Store',
>   ogImage: 'https://example.com/og-image.png'
> });
> </script>
> ```

---

### Exercise 3: Robots Meta Config

**Problem:** Write `useHead()` code line setting meta tag `robots: 'noindex, nofollow'` for secret admin pages.

**Expected output:**
> [!check]- Answer
> ```typescript
> useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] });
> ```
> - Prevents search engine crawlers from indexing secret routes.
> 
> ```typescript
> useHead({
>   meta: [{ name: 'robots', content: 'noindex, nofollow' }]
> });
> ```


---

## 7. Related Terms
- [Universal Rendering (SSR)](universal_rendering.md) — The process that produces the structured HTML.
- [`useHead`](../level_06/use_head.md) — The composable helper used to write head properties.
- [`useSeoMeta`](../level_06/use_seo_meta.md) — useSeoMeta composable.
---

## 8. Key Takeaways
- SEO optimizes website code to rank higher on search engines.
- Client-Side Rendering (CSR) serves blank HTML, which harms search ranking.
- Nuxt SSR renders Vue layouts on the server, serving fully readable HTML.
- Always include title, description, and Open Graph tags on public routes.
- Keep primary content and SEO tags out of client-only wrappers.
