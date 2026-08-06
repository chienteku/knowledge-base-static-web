# `useHead`

> **Level 6 — SEO & Configuration**
> An auto-imported composable that allows you to dynamically inject metadata, scripts, and styles directly into the `<head>` of your HTML document from anywhere in your Vue components.

---

## 1. Prerequisites
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The process that ensures these `<head>` tags are actually visible to search engines on initial load.
- [Search Engine Optimization (SEO)](../level_01/seo.md) — The core design requirement for dynamic indexing tags.

---

## 2. Term Category

**SEO & Meta Management** (Reactive Document Head Composition): `useHead()` modifies the HTML `<head>` element (title, meta tags, external scripts, link tags) reactively across server and client renders.



---

## 3. Explanation

### Environment Context
- **Server & Client**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Configuring Document Head Meta and Script Tags

**Scenario:**
Add a third-party analytics script tag and custom CSS stylesheet link using `useHead()`.

**Requirements:**
1. Pass `script` and `link` arrays to `useHead()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> useHead({
>   title: "Dashboard Overview",
>   link: [
>     { rel: "stylesheet", href: "https://cdn.example.com/styles.css" }
>   ],
>   script: [
>     { src: "https://cdn.example.com/analytics.js", defer: true }
>   ]
> });
> </script>
> 
> <template>
>   <div>
>     <h1>Analytics Overview</h1>
>   </div>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. `useHead()` modifies the HTML `<head>` section during SSR rendering and dynamic client navigation.
> 2. `script` and `link` arrays append `<script>` and `<link>` tags to the rendered document head.
> 3. Integrates with `@unhead/vue` under the hood.
> 
---

### Exercise 2: Reactive Head Options with Computed Refs

**Scenario:**
Update document title reactively whenever a unread notifications counter changes.

**Requirements:**
1. Pass computed title to `useHead()`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const unreadCount = ref(3);
> 
> useHead({
>   title: computed(() => `(${unreadCount.value}) Inbox Messages`)
> });
> </script>
> 
> <template>
>   <div>
>     <button @click="unreadCount++">Receive Message</button>
>   </div>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. Passing computed refs to `useHead()` maintains reactive DOM updates in `document.title`.
> 2. Updates browser tab title immediately when reactive state changes in the client.
> 3. Declarative head management model.
> 
---

### Exercise 3: Setting Global Default Head Tags in `nuxt.config.ts`

**Scenario:**
Configure global fallback document title template and charset tags in `nuxt.config.ts`.

**Requirements:**
1. Configure `app.head` in `nuxt.config.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   app: {
>     head: {
>       titleTemplate: "%s - Enterprise SaaS",
>       charset: "utf-8",
>       viewport: "width=device-width, initial-scale=1"
>     }
>   }
> });
> ```
> 
> #### Technical Explanation
>
> 1. `app.head` sets global fallback document head properties across all pages.
> 2. `titleTemplate: '%s - Enterprise SaaS'` automatically appends the suffix to page titles set by `useHead({ title: 'Pricing' })` ("Pricing - Enterprise SaaS").
> 3. Standard global SEO configuration option.
> 
---


## 6. Related Terms
- [`useSeoMeta`](use_seo_meta.md) — A specialized version of `useHead` strictly for Open Graph and Twitter meta tags.
- [Search Engine Optimization (SEO)](../level_01/seo.md) — Related concept: Search Engine Optimization (SEO).

---

## 7. Key Takeaways
- `useHead` allows you to manage the `<head>` of your HTML document.
- It works flawlessly with SSR to ensure search engines see the correct tags.
- You can inject titles, meta tags, scripts, and stylesheets.
- Use `titleTemplate` in `app.vue` to create consistent title branding.
- Pass a function `() => value` if the metadata relies on reactive variables.
