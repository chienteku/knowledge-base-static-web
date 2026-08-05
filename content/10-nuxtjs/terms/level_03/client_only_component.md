# ClientOnly Component

> **Level 3 — Components & Assets**
> A built-in Nuxt wrapper component that explicitly tells the framework to skip Server-Side Rendering (SSR) for the components placed inside it, rendering them exclusively in the browser.

---

## 1. Prerequisites
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The default rendering flow that `<ClientOnly>` purposely interrupts.
- [Hydration](../level_01/hydration.md) — The client-side lifecycle hook that mounts client-only structures.
---

## 2. Term Category
- **Component**

---

## 3. Environment Context
- **Client Only** (Bypasses server execution completely, rendering markup solely inside the browser).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Nuxt 3 uses Universal Rendering, meaning your Vue components are executed twice: once on the Node.js server to generate HTML, and once in the browser to become interactive.

However, some Vue components strictly depend on browser APIs (like `window`, `document`, or WebGL) or use third-party libraries (like interactive maps or charting libraries) that simply **cannot run on a Node.js server**. If Nuxt attempts to render these on the server, the application will crash with `window is not defined`. 

`<ClientOnly>` solves this by acting as a shield. Anything inside it is completely ignored by the server and only renders once the app has hydrated in the browser.

### (2) Core Concept
You do not need to import `<ClientOnly>`; it is automatically provided by Nuxt.

```vue
<template>
  <div>
    <h1>This title is SSR rendered for SEO</h1>
    
    <ClientOnly>
      <!-- This heavy, browser-only map will ONLY render on the client -->
      <InteractiveLeafletMap />

      <!-- Optional: Show a fallback while waiting for the client to render -->
      <template #fallback>
        <p>Loading interactive map...</p>
      </template>
    </ClientOnly>
  </div>
</template>
```

### (3) The `.client.vue` Alternative
If you have a component that should *never* be server-rendered anywhere in your app, you can append `.client.vue` to its filename (e.g., `components/InteractiveMap.client.vue`). Nuxt will automatically treat this component exactly as if it were wrapped in `<ClientOnly>`, no matter where it is used.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Overusing `<ClientOnly>` to fix Hydration Mismatches
**The mistake:** Encountering a Hydration Mismatch error and immediately wrapping the offending component in `<ClientOnly>` to make the error go away.

**Why it's wrong:** While it "fixes" the error, it completely destroys the SEO and initial load speed of that component. The user will see a blank space on initial load.
**Golden Rule:** Only use `<ClientOnly>` when the component *physically cannot* render on the server (e.g., relies on `localStorage` or `window`). If it's just a layout issue, fix the actual hydration logic.

---

### Mistake 2: Forgetting `<template #fallback>` When Rendering Heavy `<ClientOnly>` Widgets

**The mistake:** Using `<ClientOnly><ChartWidget /></ClientOnly>` without specifying a fallback template.

**Why it's wrong:** Without a fallback slot, the server renders empty HTML for the component area, causing sudden visual layout jumps when the client mounts. Provide a loading skeleton fallback.

*Incorrect:*
```vue
<ClientOnly>
  <ChartWidget /> <!-- ❌ Empty server HTML causes layout jump on mount! -->
</ClientOnly>
```

*Fix:*
```vue
<ClientOnly>
  <ChartWidget />
  <template #fallback>
    <div class="skeleton-loader">Loading chart...</div> <!-- Smooth fallback -->
  </template>
</ClientOnly>
```

---

### Mistake 3: Wrapping Entire Vue Pages inside `<ClientOnly>` (Destroying Universal SSR)

**The mistake:** Wrapping an entire public landing page template inside `<ClientOnly>`.

**Why it's wrong:** Wrapping entire pages in `<ClientOnly>` opts out of Universal SSR, serving empty HTML shells to search engines and degrading SEO rankings. Wrap ONLY browser-only components.

*Incorrect:*
```vue
<template>
  <ClientOnly> <!-- ❌ Destroys server HTML rendering for entire page! -->
    <PageContent />
  </ClientOnly>
</template>
```

*Fix:*
```vue
<template>
  <div>
    <ServerPageContent /> <!-- SSR rendered -->
    <ClientOnly><BrowserWidget /></ClientOnly> <!-- Isolated client widget -->
  </div>
</template>
```


---

## 6. Practice Exercises

### Exercise 1: File Naming

**Problem:** You created a third-party charting component. It throws a 500 server error because the library relies on `window.innerWidth`. Instead of using the `<ClientOnly>` tag in your templates, how can you rename the component file `Chart.vue` to force Nuxt to always render it on the client?

**Expected output:**
> [!check]- Answer
> ```text
> Chart.client.vue
> ```
> - You can append a suffix before the file extension to mark the component as client-only.

---

### Exercise 2: ClientOnly Component Fallback Pattern

**Problem:** Write Vue template wrapping browser-only canvas component `<CanvasEditor />` inside `<ClientOnly>` with a fallback skeleton element.

**Expected output:**
> [!check]- Answer
> ```vue
> <template>
>   <ClientOnly>
>     <CanvasEditor />
>     <template #fallback>
>       <div class="h-64 bg-gray-100 animate-pulse" />
>     </template>
>   </ClientOnly>
> </template>
> ```
> - `<template #fallback>` provides smooth skeleton rendering during SSR.
> 
> ```vue
> <template>
>   <ClientOnly>
>     <CanvasEditor />
>     <template #fallback>
>       <div class="h-64 bg-gray-100 animate-pulse">
>         Loading canvas editor...
>       </div>
>     </template>
>   </ClientOnly>
> </template>
> ```

---

### Exercise 3: .client.vue File Suffix Alternative

**Problem:** Which file naming suffix automatically restricts a component in `components/` to client-side execution without requiring `<ClientOnly>` tags?

**Expected output:**
> [!check]- Answer
> ```text
> Component.client.vue (e.g. Chart.client.vue)
> ```
> - `.client.vue` suffix restricts component rendering to the browser.
> 
> ```text
> components/Chart.client.vue
> ```


---

## 7. Related Terms
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The process this component skips.
- [Hydration](../level_01/hydration.md) — Related concept: Hydration.
---

## 8. Key Takeaways
- `<ClientOnly>` is a built-in wrapper that prevents Server-Side Rendering.
- Use it for components that rely on browser-only APIs (`window`, `localStorage`).
- It supports a `#fallback` slot to show a loading state during the server phase.
- Appending `.client.vue` to a filename achieves the same result automatically.
