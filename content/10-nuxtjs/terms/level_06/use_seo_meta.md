# `useSeoMeta`

> **Level 6 — SEO & Configuration**
> A specialized, highly-ergonomic composable built on top of `useHead` specifically designed to make writing Open Graph, Twitter Card, and standard SEO meta tags incredibly easy and type-safe.

---

## 1. Prerequisites
- [`useHead`](use_head.md) — The underlying tool that `useSeoMeta` simplifies.
- [Search Engine Optimization (SEO)](../level_01/seo.md) — The core design requirement for dynamic indexing tags.

---

## 2. Term Category

**SEO & Meta Management** (Type-Safe Social & Search Meta Composable): `useSeoMeta()` provides a flat, strongly typed interface for setting OpenGraph, Twitter card, and search engine metadata.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
Writing meta tags manually using `useHead` is extremely tedious and prone to typos. 

If you want a page to look good when shared on Twitter and Facebook, you have to write this using `useHead`:
```typescript
useHead({
  meta: [
    { name: 'description', content: 'My page' },
    { property: 'og:title', content: 'My Title' },
    { property: 'og:description', content: 'My page' },
    { name: 'twitter:title', content: 'My Title' },
    { name: 'twitter:card', content: 'summary_large_image' }
  ]
})
```
This is a massive array of poorly-typed objects. Nuxt introduced `useSeoMeta` to flatten this structure, provide perfect TypeScript autocomplete, and automatically handle the differences between `name` and `property` attributes.

### (2) Core Concept
With `useSeoMeta`, you just pass a flat object. Nuxt generates the complex array of objects for you under the hood.

```vue
<script setup lang="ts">
// Perfectly typed! If you typo 'ogTitle', TypeScript will warn you.
useSeoMeta({
  title: 'My Awesome Page',
  description: 'This is my awesome page, let me tell you all about it.',
  ogTitle: 'My Awesome Page',
  ogDescription: 'This is my awesome page, let me tell you all about it.',
  ogImage: 'https://example.com/social-card.png',
  twitterCard: 'summary_large_image',
})
</script>
```

### (3) Reactivity
Just like `useHead`, if you are injecting dynamic data (like the title of an article you fetched from an API), you must wrap the values in a getter function so they remain reactive.

```vue
<script setup lang="ts">
const { data: article } = await useFetch('/api/article/1');

useSeoMeta({
  title: () => article.value.title,
  ogTitle: () => article.value.title
});
</script>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to use `useSeoMeta` for scripts or stylesheets
**The mistake:** Searching the `useSeoMeta` autocomplete for a way to inject a `<script src="...">` tag.

**Why it's wrong:** `useSeoMeta` is *strictly* for `<meta>` tags and the `<title>` tag. It deliberately does not support scripts, links, or styles.
**Golden Rule:** If you need to inject a script or a stylesheet, you must use `useHead`. It is perfectly fine (and common) to use both `useSeoMeta` and `useHead` in the exact same component!

---

### Mistake 2: Using `useSeoMeta()` for Injecting Non-SEO Head Elements (`<script>`, `<link>`)

**The mistake:** Attempting to inject external stylesheet `<link>` or `<script>` tags using `useSeoMeta()`.

**Why it's wrong:** `useSeoMeta()` is designed specifically for flat SEO meta properties (`title`, `description`, `ogTitle`, `twitterCard`). Use `useHead()` for scripts and link tags.

*Incorrect:*
```vue
useSeoMeta({ script: [{ src: '/api.js' }] }); // ❌ Invalid useSeoMeta property!
```

*Fix:*
```vue
useHead({ script: [{ src: '/api.js' }] }); // Use useHead for scripts and link tags
```

---

### Mistake 3: Misspelling OpenGraph Property Names in `useSeoMeta()`

**The mistake:** Writing `useSeoMeta({ 'og:title': 'Title' })` using raw string keys.

**Why it's wrong:** `useSeoMeta()` provides camelCase property names (`ogTitle`, `ogDescription`, `ogImage`, `twitterCard`). Using raw string keys breaks TypeScript auto-completion.

*Incorrect:*
```vue
useSeoMeta({ 'og:title': 'Title' }); // ❌ Disables camelCase TypeScript auto-completion!
```

*Fix:*
```vue
useSeoMeta({ ogTitle: 'Title', ogDescription: 'Description' }); // Strongly typed camelCase
```


---

## 5. Practice Exercises

### Exercise 1: Setting Social Share Metadata with `useSeoMeta()`

**Scenario:**
Set OpenGraph and Twitter card share preview metadata for a blog post.

**Requirements:**
1. Call `useSeoMeta()` with title, description, ogImage, twitterCard.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> useSeoMeta({
>   title: "Nuxt 3 Hybrid Rendering Architecture",
>   description: "Learn how hybrid rendering optimizes web performance and SEO.",
>   ogTitle: "Nuxt 3 Hybrid Rendering Architecture",
>   ogDescription: "Learn how hybrid rendering optimizes web performance and SEO.",
>   ogImage: "https://example.com/images/og-hybrid.png",
>   twitterCard: "summary_large_image",
>   twitterSite: "@nuxt_js"
> });
> </script>
> 
> <template>
>   <article>
>     <h1>Nuxt 3 Hybrid Rendering Architecture</h1>
>   </article>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. `useSeoMeta()` provides a flat, strongly-typed interface for setting 100+ standard SEO and social meta tags.
> 2. Prevents property name typos (`ogTitle` vs `og:title`).
> 3. Renders static HTML meta tags during server SSR for social media web crawlers.
> 
---

### Exercise 2: Dynamic Reactive Metadata from Async Fetch

**Scenario:**
Set SEO metadata dynamically using getters resolved from async `useFetch()`.

**Requirements:**
1. Pass getter functions `() => data.value?.title` to `useSeoMeta()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const route = useRoute();
> const { data: product } = await useFetch(`/api/products/${route.params.id}`);
> 
> useSeoMeta({
>   title: () => product.value?.name ?? "Product",
>   description: () => product.value?.description ?? "Default description",
>   ogImage: () => product.value?.imageUrl
> });
> </script>
> 
> <template>
>   <div v-if="product">
>     <h1>{{ product.name }}</h1>
>   </div>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. Passing getter functions ensures metadata updates reactively once async fetch promises resolve.
> 2. Server-renders exact dynamic product meta tags into initial HTML responses.
> 3. Essential dynamic SEO pattern for e-commerce and CMS pages.
> 
---

### Exercise 3: Canonical URLs and Robots Meta Directives

**Scenario:**
Configure page canonical URL and `noindex` directives for staging environments.

**Requirements:**
1. Set `canonical` and `robots` in `useSeoMeta()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> useSeoMeta({
>   title: "Staging Admin Panel",
>   robots: "noindex, nofollow"
> });
> </script>
> 
> <template>
>   <div>
>     <h1>Staging Panel</h1>
>   </div>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. `robots: 'noindex, nofollow'` instructs search engine crawlers not to index the page.
> 2. Protects staging or private admin environments from appearing in public search results.
> 3. Production search security directive.
> 
---


## 6. Related Terms
- [`useHead`](use_head.md) — The tool used for scripts and stylesheets.
- [Search Engine Optimization (SEO)](../level_01/seo.md) — SEO fundamentals.

---

## 7. Key Takeaways
- `useSeoMeta` is a syntactic sugar over `useHead` specifically for SEO tags.
- It provides perfect TypeScript autocomplete for over 100 meta tags.
- It flattens the complex array syntax into a simple key-value object.
- Use `useHead` alongside it if you need to inject scripts or styles.
