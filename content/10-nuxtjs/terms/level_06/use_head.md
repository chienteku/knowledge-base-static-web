# `useHead`

> **Level 6 — SEO & Configuration**
> An auto-imported composable that allows you to dynamically inject metadata, scripts, and styles directly into the `<head>` of your HTML document from anywhere in your Vue components.

---

## 1. Prerequisites
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The process that ensures these `<head>` tags are actually visible to search engines on initial load.
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
In a traditional Single Page Application, the `index.html` file has a static `<title>` and `<meta>` tags. If you navigate to the "About" page, the title in the browser tab doesn't change unless you manually write JavaScript to mutate `document.title`. This is terrible for SEO, as search engines rely heavily on dynamic titles and descriptions.

Nuxt integrates **Unhead** under the hood, exposing it via the `useHead` composable. It allows every single Vue component to safely inject and manage its own tags in the HTML `<head>`.

### (2) Core Concept
You can call `useHead` inside any `<script setup>`. Nuxt will automatically merge this data into the server-rendered HTML. If the user navigates on the client, Nuxt will dynamically update the browser's `<head>`.

```vue
<script setup lang="ts">
// Injecting a title, a meta description, and an external script
useHead({
  title: 'My Awesome Nuxt Site',
  meta: [
    { name: 'description', content: 'The best Nuxt tutorial on the web.' }
  ],
  script: [
    { src: 'https://third-party-analytics.com/tracker.js', defer: true }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ]
});
</script>

<template>
  <h1>Welcome to my site!</h1>
</template>
```

### (3) Title Templates
If you want every page to have a suffix (e.g., `About Us - My Company`), you can define a `titleTemplate` in your root `app.vue`.

```vue
<!-- app.vue -->
<script setup>
useHead({
  // The %s is replaced by the title of the current page!
  titleTemplate: '%s - My Company'
});
</script>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Not making `useHead` reactive
**The mistake:** Passing static strings into `useHead` when the data actually depends on an API response that might change.

**Why it's wrong:** If you pass a static string, Unhead evaluates it once. If your data updates, the `<head>` won't update.
**Golden Rule:** If the data inside `useHead` relies on a Vue `ref` or `computed`, you must pass a function or a computed property into `useHead`.

*Incorrect:*
```vue
<script setup>
const { data: user } = await useFetch('/api/user/1');

// If 'user' changes, the title will NOT update!
useHead({
  title: user.value.name
});
</script>
```

*Fix:*
```vue
<script setup>
const { data: user } = await useFetch('/api/user/1');

// Passing a getter function ensures reactivity!
useHead({
  title: () => user.value?.name || 'Loading...'
});
</script>
```

---

### Mistake 2: Passing Non-Function Static Strings for Dynamic Reactive Meta Tags

**The mistake:** Writing `useHead({ title: titleRef.value })` inside component setup when `titleRef` updates dynamically.

**Why it's wrong:** Passing static strings `titleRef.value` evaluates once at setup time. When `titleRef.value` updates later, the `<title>` tag will NOT update. Pass a getter function `title: () => titleRef.value`.

*Incorrect:*
```typescript
const title = ref('Initial');
useHead({ title: title.value }); // ❌ Does NOT update when title.value changes!
```

*Fix:*
```vue
const title = ref('Initial');
useHead({ title: () => title.value }); // Getter function updates reactively
```

---

### Mistake 3: Injecting Inline Custom Scripts without `key` Identifiers in `useHead`

**The mistake:** Adding script tags to `useHead({ script: [{ children: 'alert(1)' }] })` without unique keys.

**Why it's wrong:** Omitting key identifiers on inline scripts added via `useHead` can cause duplicate script injections during client SPA page transitions.

*Incorrect:*
```vue
useHead({ script: [{ children: 'console.log(1)' }] }); // ❌ Missing key identifier!
```

*Fix:*
```vue
useHead({ script: [{ key: 'my-script', children: 'console.log(1)' }] }); // Key prevents duplicates
```


---

## 6. Practice Exercises

### Exercise 1: Adding an external CSS file

**Problem:** Write the `useHead` block required to inject an external stylesheet (`https://example.com/styles.css`) into the document head.

**Expected output:**
```typescript
useHead({
  link: [
    { rel: 'stylesheet', href: 'https://example.com/styles.css' }
  ]
});
```

> [!check]- Answer
> - Link elements inside `useHead` are passed as an array of objects inside the `link` key.

---

### Exercise 2: useHead Dynamic Canonical URL Pattern

**Problem:** Write `<script setup>` using `useHead()` setting reactive `<title>`, `<meta name="description">`, and `<link rel="canonical">`.

**Expected output:**
```vue
<script setup>
const route = useRoute();
useHead({
  title: 'Dynamic Page',
  meta: [{ name: 'description', content: 'Page description' }],
  link: [{ rel: 'canonical', href: () => `https://example.com${route.path}` }]
});
</script>
```

> [!check]- Answer
> - `useHead()` manages reactive HTML head elements.
> 
> ```vue
> <script setup>
> const route = useRoute();
> 
> useHead({
>   title: () => `Product Page | Store`,
>   meta: [{ name: 'description', content: 'Shop our top quality products.' }],
>   link: [
>     { rel: 'canonical', href: () => `https://example.com${route.path}` }
>   ]
> });
> </script>
> ```

---

### Exercise 3: useHead titleTemplate Feature

**Problem:** Write `useHead()` line setting `titleTemplate` so page title `'About'` formats as `'About - My Store'`.

**Expected output:**
```typescript
useHead({ titleTemplate: '%s - My Store' });
```

> [!check]- Answer
> - `titleTemplate` applies a global string format template to titles.
> 
> ```typescript
> useHead({
>   titleTemplate: '%s - My Store'
> });
> ```


---

## 7. Related Terms
- [`useSeoMeta`](../level_06/use_seo_meta.md) — A specialized version of `useHead` strictly for Open Graph and Twitter meta tags.

---

## 8. Key Takeaways
- `useHead` allows you to manage the `<head>` of your HTML document.
- It works flawlessly with SSR to ensure search engines see the correct tags.
- You can inject titles, meta tags, scripts, and stylesheets.
- Use `titleTemplate` in `app.vue` to create consistent title branding.
- Pass a function `() => value` if the metadata relies on reactive variables.
