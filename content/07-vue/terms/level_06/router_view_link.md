# Router View / Router Link

> **Level 6 — Routing (Vue Router)**
> The two core built-in template components provided by Vue Router for rendering active route components (`<RouterView>`) and declaring client-side navigation links (`<RouterLink>`).

---

## 1. Prerequisites

- [Vue Router](vue_router.md) — The plugin that provides these components globally.
- [Components](../level_04/components.md) — Understanding that these are globally registered components.

---

## 2. Term Category

**Vue Ecosystem (Template Components / Component API)**: `<RouterView>` and `<RouterLink>` are the two primary built-in template components provided by Vue Router. `<RouterView>` acts as a dynamic component viewport placeholder that mounts and renders whichever view component matches the active URL path. `<RouterLink>` renders accessible client-side navigation anchor tags (`<a>`) that execute seamless route transitions without reloading the page.

Unlike standard HTML anchor elements (`<a href="...">`)—which force browser page reloads, destroying in-memory Vue state and re-executing JavaScript bundles—`<RouterLink>` intercepts click events and uses HTML5 History API (`pushState`) under the hood. In React Router v6+, these components correspond to `<Outlet />` and `<Link />` / `<NavLink />`. `<RouterLink>` automatically applies active CSS classes (`router-link-active`, `router-link-exact-active`) to simplify navigation tab highlight styling.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In Single-Page Application (SPA) architecture, the browser must never perform traditional page reloads when navigating between views. If a user clicks an ordinary `<a href="/dashboard">` tag, the browser destroys all active JavaScript state, tears down the Vue application instance, and issues a fresh HTTP GET request to the server.

`<RouterLink>` and `<RouterView>` solve this by providing declarative, SPA-aware template primitives:
1. **`<RouterLink to="...">`**: Intercepts click events, cancels native page reload browser navigation, and calls `router.push()` internally. It also inspects current URL state to apply active CSS highlighting classes automatically.
2. **`<RouterView>`**: Serves as a dynamic placeholder element in template layouts where Vue Router mounts matching route components.

### (2) Reality Metaphor
Think of `<RouterView>` and `<RouterLink>` like a Cinema Projection System:
- **`<RouterView>` (The Projection Screen)**: A white screen mounted on the theater wall. The screen itself holds no image data; it is a placeholder. Whichever movie reel (view component) is currently loaded into the active film projector gets beamed onto the screen for the audience to watch.
- **`<RouterLink>` (The Movie Selection Console)**: Interactive push-buttons on the theater control desk. Pressing the "Sci-Fi" button (clicking `<RouterLink to="/scifi">`) smoothly switches the film reel playing on the screen without shutting down the theater power or clearing out the audience seating.

### (3) Vue Code Examples

#### Short Snippet
```vue
<template>
  <nav class="nav-bar">
    <!-- Declarative SPA links -->
    <RouterLink to="/">Home</RouterLink> |
    <RouterLink to="/about">About</RouterLink>
  </nav>

  <!-- Dynamic component viewport placeholder -->
  <main class="content-area">
    <RouterView />
  </main>
</template>
```

#### Fuller Example
```vue
<!-- AppLayout.vue - Advanced RouterView & RouterLink usage with KeepAlive and Transition -->
<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-layout">
    <!-- Navigation Bar -->
    <header class="navbar">
      <div class="brand">Enterprise Portal</div>
      <nav class="nav-links">
        <!-- exact-active-class guarantees exact path matching for root '/' -->
        <RouterLink to="/" exact-active-class="active-exact">
          Dashboard
        </RouterLink>

        <RouterLink to="/analytics" active-class="active-tab">
          Analytics
        </RouterLink>

        <!-- Object location syntax with query string -->
        <RouterLink :to="{ path: '/reports', query: { type: 'monthly' } }">
          Monthly Reports
        </RouterLink>

        <!-- Custom slot syntax for bespoke HTML link rendering -->
        <RouterLink to="/settings" custom v-slot="{ href, navigate, isActive }">
          <a :href="href" @click="navigate" :class="[ 'custom-btn', isActive ? 'btn-active' : '' ]">
            ⚙️ Settings
          </a>
        </RouterLink>
      </nav>
    </header>

    <!-- Main Viewport with Animation Transition & State Caching -->
    <main class="viewport-container">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <KeepAlive include="AnalyticsView">
            <component :is="Component" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.active-exact, .active-tab, .btn-active {
  font-weight: bold;
  border-bottom: 2px solid #42b883;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Standard `<a href="...">` Anchors for Internal SPA Navigation

**The mistake:** Using standard HTML `<a href="/dashboard">` tags for internal app navigation links instead of `<RouterLink to="/dashboard">`.

**Why it's wrong:** Standard `href` anchor tags trigger native browser page reloads. The browser destroys the active Vue application instance, clearing Pinia stores and resetting component state.

*Incorrect:*
```vue
<a href="/dashboard">Dashboard</a> <!-- ❌ Triggers full page reload; destroys app state -->
```

*Fix:* Use `<RouterLink>` for internal SPA route navigation:
```vue
<RouterLink to="/dashboard">Dashboard</RouterLink> <!-- Seamless client-side transition -->
```

---

### Mistake 2: Confusing `active-class` with `exact-active-class` on Root Links (`/`)

**The mistake:** Using `active-class="active"` on `<RouterLink to="/">`.

**Why it's wrong:** Because all URL paths start with `/` (e.g. `/about`, `/settings`), standard prefix matching causes `<RouterLink to="/">` to remain highlighted *permanently* across all routes.

*Incorrect:*
```vue
<!-- ❌ Permanently active because all routes start with '/' -->
<RouterLink to="/" active-class="active">Home</RouterLink>
```

*Fix:* Use `exact-active-class` for root paths:
```vue
<RouterLink to="/" exact-active-class="active">Home</RouterLink>
```

---

### Mistake 3: Omitting `<component :is="Component">` when using `<RouterView>` v-slot

**The mistake:** Using `<RouterView v-slot="{ Component }">` without passing `:is="Component"` to a dynamic `<component>` element.

**Why it's wrong:** When using `<RouterView>` with scoped slots (for `<Transition>` or `<KeepAlive>`), Vue Router exposes the resolved view component object via slot prop `{ Component }`. Omitting `<component :is="Component">` renders nothing.

*Incorrect:*
```vue
<RouterView v-slot="{ Component }">
  <Transition><Component /></Transition> <!-- ❌ Component is slot prop, not element tag -->
</RouterView>
```

*Fix:*
```vue
<RouterView v-slot="{ Component }">
  <Transition>
    <component :is="Component" />
  </Transition>
</RouterView>
```

---

## 5. Practice Exercises

### Exercise 1: Commercial Banking Navigation Bar

**Scenario:** Create a navigation bar for a commercial banking application. Render links for `/` (Dashboard), `/transfers` (Wire Transfers), and `/statements` (Account Statements). Apply class `nav-active` cleanly.

**Requirements:**
1. Use `<RouterLink>`.
2. Apply `exact-active-class="nav-active"` to root `/` link.
3. Apply `active-class="nav-active"` to sub-links.
4. Verify link click navigation without page reloads.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- BankNavbar.vue -->
> <script setup>
> import { RouterLink } from 'vue-router';
> </script>
> 
> <template>
>   <nav class="bank-navbar">
>     <RouterLink to="/" exact-active-class="nav-active">
>       Account Overview
>     </RouterLink>
>     
>     <RouterLink to="/transfers" active-class="nav-active">
>       Wire Transfers
>     </RouterLink>
>     
>     <RouterLink to="/statements" active-class="nav-active">
>       Statements
>     </RouterLink>
>   </nav>
> </template>
> 
> <style scoped>
> .bank-navbar { display: flex; gap: 16px; background: #1e293b; padding: 12px; }
> .bank-navbar a { color: #94a3b8; text-decoration: none; }
> .nav-active { color: #38bdf8 !important; font-weight: bold; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **`exact-active-class` Isolation**: Ensures root `'/'` link activates only when location matches path exactly.
> 2. **Client-Side History**: `<RouterLink>` intercepts mouse click events to trigger history `pushState`.
> 3. **Accessible Markups**: Renders accessible standard HTML `<a>` tags with proper ARIA attributes.
> 4. **Scoped Styling**: `nav-active` styles highlight active banking navigation links dynamically.
> 
---

### Exercise 2: E-Commerce Animated Transition Viewport (<RouterView> v-slot)

**Scenario:** An e-commerce catalog application wraps `<RouterView>` in a slide-left CSS transition using the `<RouterView v-slot>` template pattern.

**Requirements:**
1. Use `<RouterView v-slot="{ Component }">`.
2. Wrap inner component in `<Transition name="slide">`.
3. Render `<component :is="Component">`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- CatalogViewport.vue -->
> <script setup>
> import { RouterView } from 'vue-router';
> </script>
> 
> <template>
>   <div class="viewport-shell">
>     <RouterView v-slot="{ Component }">
>       <Transition name="slide" mode="out-in">
>         <component :is="Component" />
>       </Transition>
>     </RouterView>
>   </div>
> </template>
> 
> <style scoped>
> .slide-enter-active, .slide-leave-active {
>   transition: all 0.25s ease-out;
> }
> .slide-enter-from { opacity: 0; transform: translateX(20px); }
> .slide-leave-to { opacity: 0; transform: translateX(-20px); }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Slot Component Exposure**: `v-slot="{ Component }"` extracts active route component VNodes from Vue Router.
> 2. **Dynamic Component Rendering**: `<component :is="Component">` renders extracted VNodes dynamically.
> 3. **Transition Coordination**: `mode="out-in"` waits for exiting route view to complete leave animation before entering new route view.
> 4. **Encapsulated Viewport**: Manages view transitions without dirtying child component logic.
> 
---

### Exercise 3: Healthcare Custom Nav Button (<RouterLink custom>)

**Scenario:** A hospital EHR system requires custom navigation buttons using `<RouterLink custom>` to render custom Tailwind-styled `<button>` tags instead of standard `<a>` tags.

**Requirements:**
1. Use `<RouterLink to="/emergency" custom v-slot="{ href, navigate, isActive }">`.
2. Render `<button @click="navigate">` element.
3. Apply active CSS styling based on `isActive`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- CustomNavButton.vue -->
> <script setup>
> import { RouterLink } from 'vue-router';
> </script>
> 
> <template>
>   <div class="custom-nav-bar">
>     <RouterLink to="/emergency" custom v-slot="{ navigate, isActive }">
>       <button 
>         @click="navigate" 
>         class="btn-nav" 
>         :class="{ 'btn-emergency-active': isActive }"
>       >
>         🚨 Emergency Triage
>       </button>
>     </RouterLink>
>   </div>
> </template>
> 
> <style scoped>
> .btn-nav { padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer; }
> .btn-emergency-active { background: #dc2626; color: white; font-weight: bold; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **`custom` Prop**: Disables automatic `<RouterLink>` default `<a>` tag rendering.
> 2. **Scoped Slot Helpers**: Destructures `navigate` action handler and `isActive` boolean flag.
> 3. **Custom Element Binding**: Attaches `@click="navigate"` directly to a semantic `<button>` element.
> 4. **Design System Integration**: Permits custom button components to integrate with routing logic seamlessly.
> 
---

## 6. Related Terms

- [Nested Routes](nested_routes.md) — Requires multiple `<RouterView>` tags nested inside each other.
- [Vue Router](vue_router.md) — The engine that powers these tags.
- [Programmatic Navigation (`useRouter` / `useRoute`)](programmatic_navigation.md) — Related concept: Programmatic Navigation (`useRouter` / `useRoute`).

---

## 7. Key Takeaways

- **`<RouterView>`** is the dynamic viewport placeholder where Vue Router renders matching view components.
- **`<RouterLink to="...">`** renders accessible anchor tags (`<a>`) that execute client-side SPA navigation without full page reloads.
- `<RouterLink>` automatically applies **`router-link-active`** and **`router-link-exact-active`** CSS classes for active tab highlighting.
- Use **`exact-active-class`** on root links (`/`) to prevent permanent active class highlighting.
- Combine `<RouterView v-slot="{ Component }">` with **`<Transition>`** and **`<KeepAlive>`** for smooth view animations and component caching.
