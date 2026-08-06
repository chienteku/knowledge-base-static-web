# Search Engine Optimization (SEO)

> **Level 1 — Core Concepts & Architecture**
> The practice of structuring website content, HTML markup, and page indexing configurations to maximize organic search rankings on search engines (like Google and Bing).

---

## 1. Prerequisites
- None!

---

## 2. Term Category

**SEO & Meta Management** (Search Engine Optimization): SEO in Nuxt 3 integrates server-rendered semantic HTML with meta tag composables (`useHead`, `useSeoMeta`) for maximum search visibility.



---

## 3. Explanation

### Environment Context
- **Universal** (SEO properties are compiled server-side inside header tags and parsed by external search crawler engines).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Setting Meta Tags with `useHead()`

**Scenario:**
Configure page title, meta description, and canonical link tags inside a page component using `useHead()`.

**Requirements:**
1. Execute `useHead()` with title, meta array, and link array.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> useHead({
>   title: "Nuxt 3 SEO Guide",
>   meta: [
>     { name: "description", content: "Comprehensive guide to mastering SEO in Nuxt 3 applications." },
>     { property: "og:title", content: "Nuxt 3 SEO Guide" }
>   ],
>   link: [
>     { rel: "canonical", href: "https://example.com/seo-guide" }
>   ]
> });
> </script>

<template>
  <main>
    <h1>Nuxt 3 SEO Masterclass</h1>
  </main>
</template>
```

> #### Technical Explanation
>
> 1. `useHead()` updates the `<head>` section of HTML documents during SSR and client-side navigation.
> 2. Server-renders static HTML meta tags for search engine web crawlers.
> 3. Reactive options automatically update meta tags when reactive state changes.

---

### Exercise 2: Type-Safe Meta Tag Management with `useSeoMeta()`

**Scenario:**
Set OpenGraph and Twitter card social share preview metadata using `useSeoMeta()`.

**Requirements:**
1. Use `useSeoMeta()` with `ogTitle`, `ogDescription`, `ogImage`, and `twitterCard`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> useSeoMeta({
>   title: "Product Overview",
>   description: "Explore our next-generation cloud analytics platform.",
>   ogTitle: "Product Overview - Cloud Analytics",
>   ogDescription: "Explore our next-generation cloud analytics platform.",
>   ogImage: "https://example.com/og-image.jpg",
>   twitterCard: "summary_large_image"
> });
> </script>
> ```

> #### Technical Explanation
>
> 1. `useSeoMeta()` provides a flat, strongly typed interface for 100+ standard SEO and social meta tags.
> 2. Prevents syntax typos in meta tag names and properties.
> 3. Fully integrated with Nuxt 3 server-side HTML rendering.

---

### Exercise 3: Dynamic Meta Data from Async Data Fetching

**Scenario:**
Fetch article metadata from an API and dynamically populate page title and meta tags.

**Requirements:**
1. Combine `useFetch` data with dynamic `useSeoMeta()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const route = useRoute();
> const { data: article } = await useFetch(`/api/articles/${route.params.slug}`);

useSeoMeta({
  title: () => article.value?.title ?? "Article",
  description: () => article.value?.summary ?? "Default summary"
});
</script>

<template>
  <article v-if="article">
    <h1>{{ article.title }}</h1>
    <p>{{ article.content }}</p>
  </article>
</template>
```

> #### Technical Explanation
>
> 1. Passing getter functions (`() => article.value?.title`) ensures meta tags update reactively when async data resolves.
> 2. Server-renders fetched article meta tags into initial HTML response for social bots and crawlers.
> 3. Production pattern for dynamic SSR content pages.

---




---

## 6. Related Terms
- [Universal Rendering (SSR)](universal_rendering.md) — The process that produces the structured HTML.
- [`useHead`](../level_06/use_head.md) — The composable helper used to write head properties.
- [`useSeoMeta`](../level_06/use_seo_meta.md) — useSeoMeta composable.

---

## 7. Key Takeaways
- SEO optimizes website code to rank higher on search engines.
- Client-Side Rendering (CSR) serves blank HTML, which harms search ranking.
- Nuxt SSR renders Vue layouts on the server, serving fully readable HTML.
- Always include title, description, and Open Graph tags on public routes.
- Keep primary content and SEO tags out of client-only wrappers.
