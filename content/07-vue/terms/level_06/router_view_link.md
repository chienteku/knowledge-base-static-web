# Router View / Router Link

> **Level 6 — Routing (Vue Router)**
> The two fundamental HTML-like components provided by Vue Router. `<RouterView>` acts as the placeholder where pages render, and `<RouterLink>` is the modern replacement for the `<a>` tag.

---

## 1. Prerequisites
- [Vue Router](../level_06/vue_router.md) — The plugin that provides these components globally.
- [Components](../level_04/components.md) — Understanding that these are globally registered components.

---

## 2. Term Category
- **Vue Ecosystem / Routing Components**

---

## 3. Environment Context
- **Vue Templates**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you build a Single-Page Application, you need two things:
1. A physical box on the screen where the "pages" are swapped in and out.
2. A way for users to click links *without* triggering a standard browser page refresh.
Vue Router provides two global components to solve this exactly: **`<RouterView>`** and **`<RouterLink>`**.

### (2) `<RouterView>` (The Hole)
This component does not render any UI of its own. It acts purely as a placeholder (a "hole" in your layout). Whenever the URL changes, Vue Router injects the corresponding Component into this exact spot.

```vue
<!-- App.vue -->
<template>
  <nav>My Permanent Navbar</nav>
  
  <main>
    <!-- The page content will be injected here! -->
    <RouterView /> 
  </main>
  
  <footer>My Permanent Footer</footer>
</template>
```

### (3) `<RouterLink>` (The Magic Anchor)
In an SPA, you must never use a standard HTML `<a href="/about">` tag. Clicking it causes the browser to delete the Vue app and fetch a new HTML file from the server.
Instead, you use `<RouterLink>`. Under the hood, it renders an `<a>` tag, but it uses JavaScript (`event.preventDefault()`) to stop the browser from refreshing. It then commands Vue Router to update the URL and swap the `<RouterView>`.

```html
<!-- BAD: Causes full page refresh -->
<a href="/about">About Us</a>

<!-- GOOD: Smooth, instant SPA navigation -->
<RouterLink to="/about">About Us</RouterLink>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Hardcoding Paths instead of using Named Routes

**The mistake:** A developer writes `<RouterLink to="/user/settings/profile/edit">`. Six months later, the marketing team decides the URL should be `/account/edit`. The developer has to run a Find & Replace across 500 files to fix the hardcoded string.

**Why it's wrong:** URLs change frequently. 
**Golden Rule:** Give your routes a `name` in `router.js` (`{ name: 'editProfile', path: '/...' }`). Then, use the `to` object syntax in your links: 
`<RouterLink :to="{ name: 'editProfile' }">`. 
Now, if the URL path changes in the router config, every single link in your entire app updates automatically!

---

### Mistake 2: Using Plain HTML `<a>` Anchors for Internal SPA Navigation (Full Page Reload)

**The mistake:** Writing `<a href="/about">About</a>` for internal application routes.

**Why it's wrong:** Standard HTML `<a>` href tags trigger full browser page reloads, destroying in-memory state and defeating the Single Page Application (SPA) architecture. Use `<RouterLink to="/about">`.

*Incorrect:*
```vue
<a href="/dashboard">Dashboard</a> <!-- ❌ Triggers full browser reload! -->
```

*Fix:*
```vue
<RouterLink to="/dashboard">Dashboard</RouterLink> <!-- Client-side SPA navigation -->
```

---

### Mistake 3: Applying Active Navigation CSS Classes Manually Without `RouterLink` Active Classes

**The mistake:** Writing custom JS checks to append active CSS class to navigation links.

**Why it's wrong:** `<RouterLink>` provides built-in `active-class` and `exact-active-class` props and CSS classes (`.router-link-active`, `.router-link-exact-active`) automatically.

*Incorrect:*
```vue
<a :class="{ active: route.path === '/home' }">Home</a> <!-- Manual active class handling -->
```

*Fix:*
```vue
<RouterLink to="/home" active-class="active">Home</RouterLink> <!-- Automatic active link styling -->
```


---

## 6. Practice Exercises

### Exercise 1: The Active Class

**Problem:** You have a navigation bar. You want the "Home" link to turn red when the user is actually on the Home page. How does `<RouterLink>` help you with this?

**Expected output:**
> [!check]- Answer
> ```text
> Vue Router does this automatically!
> When the current URL matches a `<RouterLink>`'s destination, Vue automatically injects a CSS class called `router-link-active` onto the rendered `<a>` tag.
> All you have to do is write the CSS: 
> `.router-link-active { color: red; }`
> ```
> - Inspect a Vue Router link in the browser DevTools when you click it.

---

### Exercise 2: RouterLink Custom Slot Rendering

**Problem:** Write `<RouterLink>` using custom slot scope destructuring `href`, `navigate`, and `isActive` to render a custom `<button>`.

**Expected output:**
> [!check]- Answer
> ```html
> <RouterLink to="/profile" v-slot="{ href, navigate, isActive }"> <button :href="href" @click="navigate" :class="{ active: isActive }">Profile</button> </RouterLink>
> ```
> - `<RouterLink>` slot exposes `href`, `navigate`, `isActive`, and `isExactActive`.
> 
> ```html
> <RouterLink to="/profile" v-slot="{ href, navigate, isActive }">
>   <button :href="href" @click="navigate" :class="{ active: isActive }">
>     Profile
>   </button>
> </RouterLink>
> ```

---

### Exercise 3: RouterView Slot with KeepAlive & Transition

**Problem:** Write standard Vue Router 4 slot template wrapping `<RouterView>` with `<Transition>` and `<KeepAlive>`.

**Expected output:**
> [!check]- Answer
> ```html
> <RouterView v-slot="{ Component }"> <Transition> <KeepAlive> <component :is="Component" /> </KeepAlive> </Transition> </RouterView>
> ```
> - Vue Router 4 uses `<RouterView v-slot="{ Component }">` for transitions.
> 
> ```html
> <RouterView v-slot="{ Component }">
>   <Transition name="fade">
>     <KeepAlive>
>       <component :is="Component" />
>     </KeepAlive>
>   </Transition>
> </RouterView>
> ```


---

## 7. Related Terms
- [Nested Routes](../level_06/nested_routes.md) — Requires multiple `<RouterView>` tags nested inside each other.
- [Vue Router](../level_06/vue_router.md) — The engine that powers these tags.

---

## 8. Key Takeaways
- **`<RouterView>`** is the dynamic placeholder where your route components are injected.
- **`<RouterLink>`** is the SPA replacement for the `<a>` tag. It navigates without reloading the browser.
- Never use `<a href="...">` for internal app navigation in Vue; always use `<RouterLink to="...">`.
- Always use the **Named Route syntax** (`:to="{ name: 'route-name' }"`) instead of hardcoding URL strings to make your app resilient to URL restructuring.
- Vue automatically applies a `.router-link-active` CSS class to the active link.
