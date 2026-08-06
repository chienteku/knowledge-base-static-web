# NuxtLink Component

> **Level 3 — Components & Assets**
> The built-in component in Nuxt 3 used for all internal navigation. It replaces the standard HTML `<a>` tag and automatically pre-fetches the next page to make navigation lightning fast.

---

## 1. Prerequisites
- [File-based Routing](../level_02/file_based_routing.md) — The URL destinations that NuxtLink navigates to.
- [Directives](../../../07-vue/terms/level_03/directives.md) — How basic template bindings are applied.

---

## 2. Term Category

**Routing / Navigation** (Smart Client Navigation Link Component): `<NuxtLink>` is the core navigation component providing client-side SPA transitions, prefetching, and active route styling.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
If you use a standard HTML `<a>` tag (e.g., `<a href="/about">About</a>`), the browser performs a "hard navigation." It completely destroys the current web page, requests a brand new HTML file from the server, and rebuilds the entire UI from scratch. This defeats the purpose of building a Single Page Application (SPA).

Nuxt provides `<NuxtLink>`. It intercepts the click, prevents the browser's default hard navigation, and uses `vue-router` to smoothly swap the page components instantly.

### (2) Core Concept
You should use `<NuxtLink>` for **all** links in your application. 
- If the `to` prop points to an internal route, it performs smooth SPA routing.
- If the `to` prop points to an external URL (e.g., `https://google.com`), it automatically behaves like a standard `<a>` tag, complete with security attributes like `rel="noopener"`.

```vue
<template>
  <nav>
    <!-- Internal navigation (Instant SPA swap) -->
    <NuxtLink to="/about">About Us</NuxtLink>
    
    <!-- External navigation (Hard redirect, acts like <a>) -->
    <NuxtLink to="https://github.com/nuxt">Our GitHub</NuxtLink>
  </nav>
</template>
```

### (3) Smart Prefetching
What makes `<NuxtLink>` truly magical is **Prefetching**. 
When a `<NuxtLink>` becomes visible in the user's viewport (e.g., they scroll down and see the link), Nuxt silently downloads the JavaScript bundle and data payload for that destination route in the background.

When the user finally clicks the link, the page transition is truly instant, because the browser already has the assets!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `<a>` tags for internal navigation
**The mistake:** Writing `<a href="/dashboard">Dashboard</a>` instead of `<NuxtLink to="/dashboard">`.

**Why it's wrong:** You force the browser to do a full page refresh. This destroys any Vue state (like Pinia stores), breaks the SPA experience, and is significantly slower because you lose prefetching.
**Golden Rule:** If the link goes to a page inside your Nuxt application, it MUST be a `<NuxtLink>`.

---

### Mistake 2: Using Native `<a>` Anchors for Internal Navigation (Full Reload Trap)

**The mistake:** Writing `<a href="/dashboard">Dashboard</a>` for internal page navigation.

**Why it's wrong:** Native `<a>` tags trigger full hard browser page reloads, destroying Vue client state and bypassing fast SPA routing transitions. Always use `<NuxtLink to="/dashboard">`.

*Incorrect:*
```vue
<a href="/dashboard">Dashboard</a> <!-- ❌ Triggers full hard browser reload! -->
```

*Fix:*
```vue
<NuxtLink to="/dashboard">Dashboard</NuxtLink> <!-- Fast SPA client navigation -->
```

---

### Mistake 3: Adding `target="_blank"` to `<NuxtLink>` Without Rel Attribute Protection

**The mistake:** Writing `<NuxtLink to="https://external.com" target="_blank">` without `rel="noopener noreferrer"`.

**Why it's wrong:** Opening external links in new tabs without `noopener noreferrer` creates security vulnerabilities where external pages access `window.opener`.

*Incorrect:*
```vue
<NuxtLink to="https://external.com" target="_blank">Link</NuxtLink> <!-- ❌ Missing rel protection! -->
```

*Fix:*
```vue
<NuxtLink to="https://external.com" target="_blank" rel="noopener noreferrer">Link</NuxtLink>
```


---

## 5. Practice Exercises

### Exercise 1: Internal and External Routing with `<NuxtLink>`

**Scenario:**
Create internal navigation links (`/about`) and external links (`https://nuxt.com`) using `<NuxtLink>`.

**Requirements:**
1. Use `<NuxtLink to="/about">` and `<NuxtLink to="https://nuxt.com">`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <template>
>   <nav>
>     <!-- Internal SPA Client Navigation -->
>     <NuxtLink to="/about">About Us</NuxtLink>
>     
>     <!-- External URL Link (Renders standard <a> with rel="noopener") -->
>     <NuxtLink to="https://nuxt.com" target="_blank">Nuxt Documentation</NuxtLink>
>   </nav>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. `<NuxtLink>` automatically detects whether a URL is internal or external.
> 2. Internal links execute fast SPA route transitions without full page refreshes.
> 3. External links automatically render standard `<a>` tags with `rel="noopener noreferrer"`.
> 
---

### Exercise 2: Controlling Viewport Route Prefetching

**Scenario:**
Disable automatic route prefetching for a specific heavy dashboard link using `:prefetch="false"`.

**Requirements:**
1. Use `<NuxtLink to="/heavy-dashboard" :prefetch="false">`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <template>
>   <div>
>     <!-- Prefetching disabled for memory-intensive route -->
>     <NuxtLink to="/admin/analytics" :prefetch="false">
>       Admin Analytics
>     </NuxtLink>
>   </div>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. By default, `<NuxtLink>` prefetches code chunks for linked routes when they enter the browser viewport.
> 2. `:prefetch="false"` disables prefetching, preventing background bandwidth consumption on heavy routes.
> 3. Essential performance tuning prop.
> 
---

### Exercise 3: Styling Active and Exact-Active Route Links

**Scenario:**
Style active navigation items using `active-class` and `exact-active-class` props.

**Requirements:**
1. Configure `active-class="text-blue-500 font-bold"`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <template>
>   <nav>
>     <NuxtLink 
>       to="/products" 
>       active-class="active-nav-item" 
>       exact-active-class="exact-active-nav-item"
>     >
>       Products List
>     </NuxtLink>
>   </nav>
> </template>
> 
> <style scoped>
> .active-nav-item {
>   color: #3b82f6;
>   font-weight: bold;
> }
> </style>
> ```
> 
> #### Technical Explanation
>
> 1. `active-class` applies when the current route path starts with the link target path.
> 2. `exact-active-class` applies ONLY when the current route path matches the target path exactly.
> 3. Standard pattern for active navigation indicators.
> 
---


## 6. Related Terms
- [`pages/` Directory](../level_02/pages_directory.md) — The destination of internal NuxtLinks.
- [Lazy Components](lazy_components.md) — Related concept: Lazy Components.

---

## 7. Key Takeaways
- `<NuxtLink>` is the drop-in replacement for the `<a>` tag.
- It enables smooth, instant client-side routing without full page reloads.
- It automatically pre-fetches internal links when they enter the viewport.
- It seamlessly handles external links by automatically falling back to standard `<a>` tag behavior.
