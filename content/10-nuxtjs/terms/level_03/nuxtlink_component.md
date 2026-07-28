# NuxtLink Component

> **Level 3 — Components & Assets**
> The built-in component in Nuxt 3 used for all internal navigation. It replaces the standard HTML `<a>` tag and automatically pre-fetches the next page to make navigation lightning fast.

---

## 1. Prerequisites
- [File-based Routing](../level_02/file_based_routing.md) — The URL destinations that NuxtLink navigates to.
- [Vue Template Directives](../../../07-vue/terms/level_03/directives.md) — How basic template bindings are applied.

---

## 2. Term Category
- **Component**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: External Links

**Problem:** Write a NuxtLink that redirects the user to `https://google.com`. Will Nuxt try to prefetch this link?

**Expected output:**
> [!check]- Answer
> ```vue
> <NuxtLink to="https://google.com">Google</NuxtLink>
> <!-- No, Nuxt is smart enough to detect it is external and disable prefetching. -->
> ```
> - Nuxt inspects the scheme/prefix of the link (like `http` or `https`) to classify if the destination is internal or external.

---

### Exercise 2: NuxtLink Active Class Pattern

**Problem:** Write `<NuxtLink>` component navigating to `/about` setting active class `'font-bold text-green-500'` when current route matches.

**Expected output:**
> [!check]- Answer
> ```vue
> <NuxtLink to="/about" active-class="font-bold text-green-500">About</NuxtLink>
> ```
> - `active-class` applies CSS styles to active link matching current route.
> 
> ```vue
> <template>
>   <NuxtLink to="/about" active-class="font-bold text-green-500">
>     About Us
>   </NuxtLink>
> </template>
> ```

---

### Exercise 3: NuxtLink Prefetching Behavior

**Problem:** When does `<NuxtLink>` automatically prefetch code payload for targeted routes?

**Expected output:**
> [!check]- Answer
> ```text
> When the <NuxtLink> enters the browser viewport in production mode.
> ```
> - Prefetches route payload when link enters the browser viewport.
> 
> ```text
> Intersection Observer -> Prefetch Route Payload in Background
> ```


---

## 7. Related Terms
- [`pages/` Directory](../level_02/pages_directory.md) — The destination of internal NuxtLinks.

---

## 8. Key Takeaways
- `<NuxtLink>` is the drop-in replacement for the `<a>` tag.
- It enables smooth, instant client-side routing without full page reloads.
- It automatically pre-fetches internal links when they enter the viewport.
- It seamlessly handles external links by automatically falling back to standard `<a>` tag behavior.
