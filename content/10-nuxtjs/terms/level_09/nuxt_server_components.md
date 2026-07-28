# Nuxt Server Components (Islands)

> **Level 9 — Advanced Rendering & Architecture**
> An advanced architecture (also known as Islands Architecture) where specific components are rendered exclusively on the server, sending raw static HTML to the browser with zero client-side JavaScript.

---

## 1. Prerequisites
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The server-rendering execution pipeline used to build these static nodes.
- [Lazy Components](../level_03/lazy_components.md) — Understanding dynamic import patterns for bundles.

---

## 2. Term Category
- **Rendering Strategies**

---

## 3. Environment Context
- **Server Only** (Executed strictly on the backend Nitro server; the browser receives raw HTML output without hydrating Vue reactivity).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard Vue, every component is isomorphic—it runs on the server to output HTML, and then sends its JavaScript payload to the client so it can hydrate and become interactive.

However, many components are completely static:
-   A **Markdown Parser** that renders blog post content.
-   A **Syntax Highlighter** for code blocks.
-   A **Footer** with static copyright links.

To render a static code snippet, you might have to import a heavy syntax highlighting library (like Shiki, which is 200KB+). Sending this 200KB library to the browser just to show a colored block of text wastes CPU power and bandwidth on mobile devices.

**Nuxt Server Components** solve this: they run purely on the server, output raw HTML, and send **zero JavaScript** to the browser for that component, keeping your bundle size tiny.

---

### (2) Implementation: `.server.vue` suffix
To convert any component into a Server Component, append `.server.vue` to the file name.

```vue
<!-- components/MarkdownViewer.server.vue -->
<script setup lang="ts">
// Shiki is imported and executed strictly on the server!
import { codeToHtml } from 'shiki';

const props = defineProps<{ code: string }>();
const highlightedCode = await codeToHtml(props.code, { lang: 'javascript', theme: 'nord' });
</script>

<template>
  <!-- Outputs static HTML. The shiki library is never sent to the browser! -->
  <div v-html="highlightedCode"></div>
</template>
```

You can now use this component in standard pages normally:
```vue
<!-- pages/blog.vue -->
<template>
  <div>
    <h1>My Technical Blog</h1>
    <MarkdownViewer code="const x = 10;" />
  </div>
</template>
```

---

### (3) Critical Limitations
Because Server Components do not hydrate on the client, they have strict runtime constraints:
1.  **No Client Reactivity:** You cannot use `ref`, `reactive`, or computed states that depend on user interaction.
2.  **No Lifecycle Hooks:** Hooks like `onMounted` or `onUnmounted` will never fire.
3.  **No DOM Events:** Event listeners like `@click`, `@submit`, or `@keydown` will simply be ignored.
4.  **Props are Static:** Props sent from parent interactive components are passed once during rendering and cannot dynamically update reactively.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Placing interactive form buttons inside a Server Component

**The mistake:** Trying to implement a newsletter submit form inside a `.server.vue` file:

```vue
<!-- components/Newsletter.server.vue -->
<script setup>
const subscribe = () => {
  // ❌ Will never fire!
  alert('Subscribed!');
};
</script>

<template>
  <div>
    <input type="email" placeholder="Enter email" />
    <button @click="subscribe">Subscribe</button> 
  </div>
</template>
```

**Why it's wrong:** The click handler `@click="subscribe"` requires Vue's client-side reactivity to listen to DOM clicks. Since the component is compiled strictly to HTML on the server and sent without JavaScript, clicking the button does nothing.

**Golden Rule:** If a component requires any form of user interaction (clicks, typing, inputs, animations), it must be a standard component. Use Server Components exclusively for static data display.

---

### Mistake 2: Passing Client Event Listeners (`@click`) to Nuxt Server Components

**The mistake:** Writing `<ServerWidget @click="handleClick" />` on a `.server.vue` component.

**Why it's wrong:** Nuxt Server Components (`.server.vue`) execute exclusively on the server and transmit zero JavaScript to the browser. Client event listeners like `@click` cannot execute on server components.

*Incorrect:*
```vue
<!-- pages/index.vue -->
<ServerWidget @click="handleClick" /> <!-- ❌ Cannot pass event listeners to .server.vue! -->
```

*Fix:*
```vue
<!-- Keep event listeners inside Client components; render Server components for static data -->
```

---

### Mistake 3: Using Vue Client Hooks (`useState`, `onMounted`, `useCookie`) inside `.server.vue` Components

**The mistake:** Adding `onMounted()` or client state hooks inside `components/Widget.server.vue`.

**Why it's wrong:** Server components render on the server and skip client hydration entirely. `onMounted` will never execute inside `.server.vue` files.

*Incorrect:*
```vue
<!-- components/Widget.server.vue -->
<script setup>
onMounted(() => { ... }); // ❌ Never executes in .server.vue components!
</script>
```

*Fix:*
```vue
<!-- Use server-side data fetching directly in <script setup> of .server.vue -->
```


---

### Mistake 4: Passing Client Event Listeners (`@click`) to Nuxt Server Components

**The mistake:** Writing `<ServerWidget @click="handleClick" />` on a `.server.vue` component.

**Why it's wrong:** Nuxt Server Components (`.server.vue`) execute exclusively on the server and transmit zero JavaScript to the browser. Client event listeners like `@click` cannot execute on server components.

*Incorrect:*
```vue
<!-- pages/index.vue -->
<ServerWidget @click="handleClick" /> <!-- ❌ Cannot pass event listeners to .server.vue! -->
```

*Fix:*
```vue
<!-- Keep event listeners inside Client components; render Server components for static data -->
```

---

### Mistake 5: Using Vue Client Hooks (`useState`, `onMounted`, `useCookie`) inside `.server.vue` Components

**The mistake:** Adding `onMounted()` or client state hooks inside `components/Widget.server.vue`.

**Why it's wrong:** Server components render on the server and skip client hydration entirely. `onMounted` will never execute inside `.server.vue` files.

*Incorrect:*
```vue
<!-- components/Widget.server.vue -->
<script setup>
onMounted(() => { ... }); // ❌ Never executes in .server.vue components!
</script>
```

*Fix:*
```vue
<!-- Use server-side data fetching directly in <script setup> of .server.vue -->
```


---

### Mistake 6: Passing Client Event Listeners (`@click`) to Nuxt Server Components

**The mistake:** Writing `<ServerWidget @click="handleClick" />` on a `.server.vue` component.

**Why it's wrong:** Nuxt Server Components (`.server.vue`) execute exclusively on the server and transmit zero JavaScript to the browser. Client event listeners like `@click` cannot execute on server components.

*Incorrect:*
```vue
<!-- pages/index.vue -->
<ServerWidget @click="handleClick" /> <!-- ❌ Cannot pass event listeners to .server.vue! -->
```

*Fix:*
```vue
<!-- Keep event listeners inside Client components; render Server components for static data -->
```

---

### Mistake 7: Using Vue Client Hooks (`useState`, `onMounted`, `useCookie`) inside `.server.vue` Components

**The mistake:** Adding `onMounted()` or client state hooks inside `components/Widget.server.vue`.

**Why it's wrong:** Server components render on the server and skip client hydration entirely. `onMounted` will never execute inside `.server.vue` files.

*Incorrect:*
```vue
<!-- components/Widget.server.vue -->
<script setup>
onMounted(() => { ... }); // ❌ Never executes in .server.vue components!
</script>
```

*Fix:*
```vue
<!-- Use server-side data fetching directly in <script setup> of .server.vue -->
```


---

## 6. Practice Exercises

### Exercise 1: JS Payload Comparison

**Problem:** You implement a static component displaying table information. Compare what the client browser receives when this component is defined as `InfoTable.vue` vs `InfoTable.server.vue`.

**Expected output:**
```text
With InfoTable.vue, the client receives the HTML markup AND the JavaScript bundle code required to load and hydrate the table component in memory.
With InfoTable.server.vue, the client receives ONLY the static HTML markup; zero JavaScript code for the component is sent to the browser.
```

> [!check]- Answer
> - Think about the hydration process and how client-side JS bundling differs.

---

### Exercise 2: Nuxt Server Component Setup Pattern

**Problem:** Write Nuxt Server Component `components/Highlight.server.vue` parsing heavy Markdown on the server without sending parser JS to browser.

**Expected output:**
```vue
<!-- components/Highlight.server.vue -->
<script setup>
const props = defineProps<{ code: string }>();
const html = await highlightCode(props.code);
</script>
<template>
  <div v-html="html" />
</template>
```

> [!check]- Answer
> - `.server.vue` suffix restricts component execution to server, keeping heavy JS libraries out of browser bundles.
> 
> ```vue
> <!-- components/Highlight.server.vue -->
> <script setup>
> import { marked } from 'marked'; // Heavy parser library stays on server!
> const props = defineProps<{ markdown: string }>();
> const html = marked(props.markdown);
> </script>
> 
> <template>
>   <div class="prose" v-html="html" />
> </template>
> ```

---

### Exercise 3: Server Components Experimental Flag

**Problem:** Which configuration flag in `nuxt.config.ts` enables Nuxt Island Server Components?

**Expected output:**
```text
experimental: { componentIslands: true }
```

> [!check]- Answer
> - `experimental.componentIslands` enables `.server.vue` component islands.
> 
> ```typescript
> export default defineNuxtConfig({
>   experimental: {
>     componentIslands: true
>   }
> });
> ```


---

## 7. Related Terms
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The process that compiles server components.
- [Lazy Components](../level_03/lazy_components.md) — Dynamic code-splitting for interactive components.

---

## 8. Key Takeaways
- Nuxt Server Components (Islands) compile entirely to static HTML on the server.
- They send zero JavaScript to the browser, significantly reducing bundle size.
- Enable them by naming the component file with a `.server.vue` suffix.
- They cannot use Vue client reactivity, event handlers (`@click`), or client lifecycle hooks.
- Use them strictly for static, heavy library-reliant rendering tasks (parsers, highlighters).
