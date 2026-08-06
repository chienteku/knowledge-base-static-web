# Lazy Components

> **Level 3 — Components & Assets**
> A performance optimization feature where Nuxt defers the downloading and parsing of a specific component's JavaScript until the moment it is actually needed in the UI.

---

## 1. Prerequisites
- [`components/` Directory](components_directory.md) — Where your components are stored.
- [Auto-imports](../level_01/auto_imports.md) — How Lazy Components are automatically triggered.

---

## 2. Term Category

**Performance & Optimization** (On-Demand Asynchronous Component Loading): Lazy components (`LazyMyComponent`) dynamically import component code chunks asynchronously on-demand when rendered.



---

## 3. Explanation

### Environment Context
- **Client Only** (Code-splitting and async fetching happens exclusively in the browser context).

### (1) Design Motivation — "Why did we design this?"
Imagine you have a massive, heavy component, like a rich-text editor or an interactive 3D map. If you place this component on a page but hide it inside a modal that the user *might never open*, the user is still forced to download that heavy JavaScript bundle on initial page load. This drastically hurts performance and Web Core Vitals.

**Lazy loading** solves this by splitting that heavy component into a separate JavaScript file that is only fetched over the network when the component is actually rendered (e.g., when `v-if="true"`).

### (2) Core Concept
In Nuxt 3, making a component lazy requires absolutely zero configuration. Because of the auto-import engine, Nuxt automatically creates a "Lazy" version of every single component in your `components/` directory.

To use it, you simply prefix the component name with `Lazy`.

```vue
<script setup lang="ts">
const showModal = ref(false);
</script>

<template>
  <div>
    <button @click="showModal = true">Open Heavy Map</button>

    <!-- The Javascript for this map is NOT downloaded on page load. -->
    <!-- It is only downloaded when `showModal` becomes true. -->
    <LazyHeavy3DMap v-if="showModal" />
  </div>
</template>
```

### (3) When NOT to use Lazy Components
Do not make *everything* lazy. If a component is visible immediately on the screen (above the fold) when the page loads, making it lazy will actually hurt performance. The browser will have to wait for the main app to load, discover the lazy component, and make a second network request. Only use `Lazy` for components hidden behind user interactions (`v-if`, modals, tabs).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Lazy components with `v-show`
**The mistake:** Trying to lazy-load a component but hiding it with CSS via `v-show`.

**Why it's wrong:** `v-show` simply applies `display: none` to the element. The element is still physically rendered in the DOM immediately on page load, which means the Lazy Component will be immediately downloaded.
**Golden Rule:** Always use `v-if` when working with Lazy components so they are completely removed from the DOM until needed.

*Incorrect:*
```vue
<LazyHeavyMap v-show="isMapOpen" />
```

*Fix:*
```vue
<LazyHeavyMap v-if="isMapOpen" />
```

---

### Mistake 2: Using `Lazy` Prefix on Instantly Visible Hero Components (Slower Hydration)

**The mistake:** Writing `<LazyHeroHeader />` for main above-the-fold hero banners.

**Why it's wrong:** Using `Lazy` component prefix forces dynamic code-splitting and dynamic chunk fetching. For above-the-fold critical UI, dynamic chunk fetching causes visual delay and layout shift.

*Incorrect:*
```vue
<LazyHeroHeader /> <!-- ❌ Delays initial render for above-the-fold critical hero! -->
```

*Fix:*
```vue
<HeroHeader /> <!-- Standard auto-imported component for critical UI -->
```

---

### Mistake 3: Forgetting `v-if` Conditional Directives When Using Lazy Components

**The mistake:** Writing `<LazyModal />` without a `v-if` condition.

**Why it's wrong:** Lazy components defer loading JavaScript code chunks ONLY until they are rendered. Without `v-if`, the component renders immediately, downloading its chunk on initial load.

*Incorrect:*
```vue
<LazyModal /> <!-- ❌ Downloads chunk immediately on initial load without v-if! -->
```

*Fix:*
```vue
<LazyModal v-if="isOpen" /> <!-- Downloads chunk only when isOpen becomes true -->
```


---

## 5. Practice Exercises

### Exercise 1: On-Demand Dynamic Component Loading with `Lazy` Prefix

**Scenario:**
Dynamically load a heavy modal component `components/UserModal.vue` ONLY when a button is clicked.

**Requirements:**
1. Consume `<LazyUserModal v-if="isOpen" />`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const isModalOpen = ref(false);
> </script>
> 
> <template>
>   <div>
>     <button @click="isModalOpen = true">Open User Modal</button>
>     
>     <!-- Code chunk is fetched asynchronously ONLY when isModalOpen becomes true! -->
>     <LazyUserModal v-if="isModalOpen" @close="isModalOpen = false" />
>   </div>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. Prepending `Lazy` to any auto-imported component name (`LazyUserModal`) converts it into an asynchronous component.
> 2. Vite creates a separate JavaScript bundle chunk for the lazy component.
> 3. Defers network fetching of the component JavaScript until `v-if` evaluates to `true`.
> 
---

### Exercise 2: Awaiting Lazy Component Hydration with `hydrateOnVisible`

**Scenario:**
Hydrate a lazy component when it enters the user's browser viewport using `hydrateOnVisible`.

**Requirements:**
1. Use `hydrateOnVisible()` or lazy component viewport trigger.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> // Trigger lazy chunk fetch when component enters viewport
> </script>
> 
> <template>
>   <main>
>     <div class="hero-section">Top Hero Content</div>
>     
>     <!-- Deferred loading until user scrolls down! -->
>     <LazyHeavyFooterWidget />
>   </main>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. Lazy components reduce initial page bundle size and improve Time-To-Interactive (TTI).
> 2. Non-critical below-the-fold UI components can be lazy-loaded on scroll.
> 3. Core bundle optimization pattern.
> 
---

### Exercise 3: Handling Async Loading States for Lazy Components

**Scenario:**
Handle async loading delays when rendering a Lazy component using Vue `<Suspense>`.

**Requirements:**
1. Wrap lazy component in `<Suspense>`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <template>
>   <div>
>     <Suspense>
>       <template #default>
>         <LazyHeavyDataGrid />
>       </template>
>       <template #fallback>
>         <div>Fetching Data Grid Bundle...</div>
>       </template>
>     </Suspense>
>   </div>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. Vue `<Suspense>` manages pending async loading states while lazy components download over the network.
> 2. Renders `#fallback` template until the JavaScript chunk resolves.
> 3. Prevents UI pop-in artifacts.
> 
---


## 6. Related Terms
- [`components/` Directory](components_directory.md) — The directory that auto-generates these Lazy versions.
- [Nuxt Server Components (Islands)](../level_09/nuxt_server_components.md) — Related concept: Nuxt Server Components (Islands).
- [NuxtLink Component](nuxtlink_component.md) — NuxtLink prefetching.

---

## 7. Key Takeaways
- Nuxt automatically generates a `Lazy` prefixed version of every auto-imported component.
- The JavaScript for a Lazy component is only downloaded when it is rendered into the DOM.
- Use this strictly for components hidden behind `v-if` (like modals, tabs, or heavy elements below the fold).
- Never use it with `v-show`.
