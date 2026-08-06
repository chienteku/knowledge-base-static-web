# Single-File Components (SFCs)

> **Level 4 — Components & Props**
> Vue's signature file format (`.vue` files) that allows you to write HTML, JavaScript, and CSS for a single component all within the exact same file.

---

## 1. Prerequisites
- [Components](components.md) — What an SFC represents physically.
- [Composition API](../level_01/composition_api.md) — The JavaScript syntax usually written inside the SFC.

---

## 2. Term Category
- **Vue Tooling / File Format**

---

## 3. Environment Context
- **Build-Time (Requires Vite/Webpack)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional development, a button required 3 files: `button.html`, `button.js`, and `button.css`. Jumping between 3 files just to understand how one simple button works is annoying.
Vue invented the **Single-File Component (`.vue`)**. It perfectly encapsulates the three pillars of the web into three distinct blocks within one file.

### (2) The Anatomy of an SFC
A `.vue` file is strictly divided into three blocks:

```vue
<!-- 1. The Logic (JavaScript) -->
<script setup>
import { ref } from 'vue'
const color = ref('red')
</script>

<!-- 2. The Structure (HTML) -->
<template>
  <button class="btn">I am a {{ color }} button!</button>
</template>

<!-- 3. The Styling (CSS) -->
<style scoped>
.btn {
  border-radius: 4px;
}
</style>
```

### (3) The Compiler Requirement
Browsers have absolutely no idea what a `.vue` file is. If you send a `.vue` file to Chrome, it will fail.
SFCs are a "Developer Experience" (DX) feature. They require a build tool (like Vite or Webpack). When you run `npm run build`, the Vue Compiler parses the `.vue` file, rips out the `<style>` into a real `.css` file, and compiles the `<template>` and `<script>` into a standard `.js` file that the browser can understand.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `scoped` attribute

**The mistake:** A developer writes `<style>` inside `Header.vue` and sets `h1 { color: blue; }`. Suddenly, every `<h1>` on the entire website turns blue, not just the one in the header!

**Why it's wrong:** By default, CSS inside a Vue file is Global. It leaks out to the rest of the application. 
**Golden Rule:** Always add the `scoped` attribute: `<style scoped>`. Vue will automatically generate a unique data attribute (like `data-v-f3f3eg9`) and attach it to the component's HTML and CSS, guaranteeing the styles cannot leak to other components!

---

### Mistake 2: Using Global Unscoped `<style>` Tags Leading to CSS Class Leakage Across Components

**The mistake:** Adding plain `<style>` blocks with generic classes (`.button`, `.header`) inside an SFC component.

**Why it's wrong:** Unscoped `<style>` rules leak globally across the entire web application, overriding CSS styles in unrelated components. Use `<style scoped>`.

*Incorrect:*
```vue
<!-- Unscoped style leaks .title class to all components -->
<style>
.title { color: red; }
</style>
```

*Fix:*
```vue
<!-- Scoped style restricts class rules to current component scope -->
<style scoped>
.title { color: red; }
</style>
```

---

### Mistake 3: Attempting to Style Child Component Deep Elements Without the `:deep()` Pseudo-Class

**The mistake:** Writing `.parent-box .child-title` inside a `<style scoped>` block expecting to style child component elements.

**Why it's wrong:** Scoped CSS targets ONLY elements in the current component's template. To target elements rendered deep inside child components, use the `:deep()` selector (`:deep(.child-title)`).

*Incorrect:*
```vue
<style scoped>
.card .child-badge { color: blue; } /* ❌ Fails to target child component element! */
</style>
```

*Fix:*
```vue
<style scoped>
.card :deep(.child-badge) { color: blue; } /* Scoped deep selector */
</style>
```


---

## 6. Practice Exercises

### Exercise 1: Order of Blocks

**Problem:** Does Vue care what order the `<script>`, `<template>`, and `<style>` blocks are written in within the `.vue` file?

**Expected output:**
> [!check]- Answer
> ```text
> No! The Vue compiler doesn't care.
> However, the official Vue Style Guide strongly recommends a specific order for consistency across projects:
> 1. `<script setup>`
> 2. `<template>`
> 3. `<style scoped>`
> ```
> - Technically no, culturally yes.
> 
---

### Exercise 2: SFC Structure Breakdown

**Problem:** Identify the 3 top-level block tags that compose a standard Vue Single File Component (`.vue`).

**Expected output:**
> [!check]- Answer
> ```text
> 1. <script> (or <script setup>)
> 2. <template>
> 3. <style> (or <style scoped>)
> ```
> - `<script>` -> Component logic
> - `<template>` -> HTML layout structure
> - `<style>` -> CSS styling
> 
> ```vue
> <script setup></script>
> <template></template>
> <style scoped></style>
> ```
> 
---

### Exercise 3: CSS v-bind in SFC Style Blocks

**Problem:** Write CSS rule inside `<style scoped>` consuming dynamic JavaScript reactive variable `themeColor` using `v-bind()`.

**Expected output:**
> [!check]- Answer
> ```css
> <style scoped> .text { color: v-bind(themeColor); } </style>
> ```
> - SFC styles support `v-bind()` to consume script setup variables directly in CSS.
> 
> ```vue
> <script setup>
> const themeColor = ref('red');
> </script>
> 
> <style scoped>
> .text {
>   color: v-bind(themeColor);
> }
> </style>
> ```
> 
> 
---

## 7. Related Terms
- [Components](components.md) — The architectural concept that SFCs physically represent.
- [Vite](../level_10/vite.md) — The build tool that compiles `.vue` files.
- [Teleport](../level_05/teleport.md) — Related concept: Teleport.
- [Build Step (Compilation)](../level_10/build_step.md) — Related concept: Build Step (Compilation).
- [`<script setup>` & Compiler Macros](script_setup.md) — <script setup> compiler macro.
- [TypeScript with Vue](../level_10/typescript_vue.md) — Related concept: TypeScript with Vue.

---

## 8. Key Takeaways
- **Single-File Components (SFCs)** use the `.vue` extension.
- They encapsulate logic (`<script>`), structure (`<template>`), and styling (`<style>`) in one place.
- Browsers cannot read `.vue` files; they must be compiled by a build tool (like Vite) into standard JS/CSS.
- Always use `<style scoped>` to prevent your component's CSS from leaking and ruining the rest of the app's styling.
