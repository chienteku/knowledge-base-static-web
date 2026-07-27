# `useSeoMeta`

> **Level 6 — SEO & Configuration**
> A specialized, highly-ergonomic composable built on top of `useHead` specifically designed to make writing Open Graph, Twitter Card, and standard SEO meta tags incredibly easy and type-safe.

---

## 1. Prerequisites
- [`useHead`](../level_06/use_head.md) — The underlying tool that `useSeoMeta` simplifies.
- [Search Engine Optimization (SEO)](../level_01/seo.md) — The core design requirement for dynamic indexing tags.

---

## 2. Term Category
- **SEO**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Open Graph Images

**Problem:** Write a `useSeoMeta` block that sets the Open Graph Image (`og:image`) to `https://mysite.com/banner.jpg` and the Twitter Card type (`twitter:card`) to `summary_large_image`.

**Expected output:**
```typescript
useSeoMeta({
  ogImage: 'https://mysite.com/banner.jpg',
  twitterCard: 'summary_large_image'
});
```

> [!check]- Answer
> - Set flat keys like `ogImage` and `twitterCard` directly on the metadata object.

---

### Exercise 2: useSeoMeta Full Social Card Pattern

**Problem:** Write `<script setup>` using `useSeoMeta()` configuring `title`, `description`, `ogTitle`, `ogDescription`, `ogImage`, and `twitterCard: 'summary_large_image'`.

**Expected output:**
```vue
<script setup>
useSeoMeta({
  title: 'Blog Post',
  description: 'Post summary',
  ogTitle: 'Blog Post',
  ogDescription: 'Post summary',
  ogImage: 'https://example.com/og.jpg',
  twitterCard: 'summary_large_image'
});
</script>
```

> [!check]- Answer
> - `useSeoMeta()` configures comprehensive social preview cards.
> 
> ```vue
> <script setup>
> useSeoMeta({
>   title: 'Nuxt 3 SEO Guide',
>   description: 'Master SEO in Nuxt 3 with useSeoMeta composable.',
>   ogTitle: 'Nuxt 3 SEO Guide',
>   ogDescription: 'Master SEO in Nuxt 3 with useSeoMeta composable.',
>   ogImage: 'https://example.com/social-card.png',
>   twitterCard: 'summary_large_image'
> });
> </script>
> ```

---

### Exercise 3: useSeoMeta Getter Function Reactivity

**Problem:** How do you make `ogTitle` reactive to a `post.value.title` ref inside `useSeoMeta()`?

**Expected output:**
```text
By passing a getter function: ogTitle: () => post.value?.title
```

> [!check]- Answer
> - Pass a getter function for dynamic reactivity.
> 
> ```typescript
> useSeoMeta({
>   ogTitle: () => post.value?.title ?? 'Default Title'
> });
> ```


---

## 7. Related Terms
- [`useHead`](../level_06/use_head.md) — The tool used for scripts and stylesheets.

---

## 8. Key Takeaways
- `useSeoMeta` is a syntactic sugar over `useHead` specifically for SEO tags.
- It provides perfect TypeScript autocomplete for over 100 meta tags.
- It flattens the complex array syntax into a simple key-value object.
- Use `useHead` alongside it if you need to inject scripts or styles.
