# `assets/` vs `public/`

> **Level 3 — Components & Assets**
> The two distinct directories in Nuxt for managing static files (like images, fonts, and stylesheets). The difference lies in whether the files should be processed by the build tool (Vite) or served directly to the browser as-is.

---

## 1. Prerequisites
- [Nuxt 3 Overview](../level_01/nuxt_3_overview.md) — Specifically the Vite bundler that powers the build process.

---

## 2. Term Category

**Framework Architecture** (Static Asset & Build Asset Directories): `assets/` holds compiled, bundled asset files (SCSS, images optimized by Vite), whereas `public/` serves uncompiled static files directly at the domain root.



---

## 3. Explanation

### Environment Context
- **Build-Time vs. Server**

### (1) Design Motivation — "Why did we design this?"
When building a website, you have two types of static files:
1. **Uncompiled files:** SCSS files that need to be compiled to CSS, or large images that need to be minified and hashed with a version string for browser caching.
2. **Raw files:** Things like `robots.txt`, `favicon.ico`, or a `.pdf` download that must never be modified by the build tool and must retain their exact file name and URL.

Nuxt separates these into two folders: `assets/` and `public/`.

### (2) The `public/` Directory
Files placed in the `public/` directory are **not** touched by Vite. They are copied exactly as they are to the root of your final deployed server. 

Because they map to the root URL (`/`), you access them via an absolute path starting with `/`.

**Example:**
If you place a file at `public/images/logo.png`, you access it in your template like this:
```html
<!-- Maps directly to yoursite.com/images/logo.png -->
<img src="/images/logo.png" alt="Logo" />
```

Use `public/` for: `robots.txt`, `favicon.ico`, open graph images, or downloadable PDFs.

### (3) The `assets/` Directory
Files placed in the `assets/` directory **are** processed by Vite. When you build your app, Vite will minify them, optimize them, and append a hash to their filename (e.g., `hero-banner.8f2a1b.jpg`) to ensure browsers never serve a stale cached version.

To access these files, you use the `~/assets/` alias.

**Example:**
If you place an image at `assets/hero.jpg`, you access it in your template like this:
```html
<!-- Vite intercepts this, processes the image, and outputs a hashed URL -->
<img src="~/assets/hero.jpg" alt="Hero" />
```

Use `assets/` for: SCSS/CSS files, fonts, and images used within your UI components.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using the `~/assets/` alias in dynamic bindings
**The mistake:** Trying to use string interpolation with the `~/assets/` alias inside a dynamic `v-bind:src` attribute.

**Why it's wrong:** The `~/assets/` alias is processed by Vite at *build time*. If you try to construct the string dynamically at *runtime* (in the browser), Vite has already finished running and cannot resolve the image path.
**Golden Rule:** If the image path is dynamic (e.g., loading different images based on an API response), the image MUST be placed in the `public/` directory and referenced via an absolute URL.

*Incorrect:*
```vue
<script setup>
const currentImage = 'hero.jpg';
</script>

<template>
  <!-- Vite cannot process this at build time! It will fail. -->
  <img :src="`~/assets/${currentImage}`" />
</template>
```

*Fix:*
```vue
<script setup>
const currentImage = 'hero.jpg';
</script>

<template>
  <!-- Image moved to public/. URL resolves perfectly at runtime. -->
  <img :src="`/${currentImage}`" />
</template>
```

---

### Mistake 2: Referencing Un-Processed `assets/` Files Using Static `/` Paths

**The mistake:** Writing `<img src="/assets/images/logo.png">`.

**Why it's wrong:** Files in `assets/` are processed by Vite/Webpack and MUST be referenced using alias `~/assets/` or `@/assets/`. Static root `/` path references ONLY files inside the `public/` directory.

*Incorrect:*
```vue
<img src="/assets/logo.png"> <!-- ❌ 404 Error: /assets path does not exist publicly! -->
```

*Fix:*
```vue
<img src="~/assets/images/logo.png"> <!-- Correct processed asset alias -->
```

---

### Mistake 3: Putting Processed Sass/CSS Source Files inside `public/` Directory

**The mistake:** Placing `public/styles/main.scss` expecting Nitro to compile it to CSS.

**Why it's wrong:** Files in `public/` are served AS-IS at root URL `/` without compilation or bundling. Place Sass/SCSS files in `assets/` for compilation.

*Incorrect:*
```vue
/* Placing main.scss inside public/ directory expecting Vite compilation */
```

*Fix:*
```vue
/* Place main.scss inside assets/scss/main.scss and import in nuxt.config.ts css array */
```


---

## 5. Practice Exercises

### Exercise 1: Referencing Assets in `assets/` vs `public/`

**Scenario:**
Reference a Vite-processed asset image from `assets/images/logo.png` and a raw static asset file from `public/favicon.ico`.

**Requirements:**
1. Reference asset file via `~/assets/images/logo.png`.
2. Reference static public file via `/favicon.ico`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <template>
>   <header>
>     <!-- Processed and hashed by Vite at build time -->
>     <img src="~/assets/images/logo.png" alt="Company Logo" />
>     
>     <!-- Served directly as uncompiled raw static file from public/ -->
>     <link rel="icon" href="/favicon.ico" />
>   </header>
> </template>
> ```

> #### Technical Explanation
>
> 1. `~/assets/` files are processed by Vite, enabling image optimization, hash caching, and CSS preprocessor compilation.
> 2. `public/` files are copied directly to the build root without modification and served at `/filename`.
> 3. Use `assets/` for application stylesheets and graphics; use `public/` for `robots.txt`, `favicon.ico`, and raw static downloads.

---

### Exercise 2: Importing SCSS Stylesheets from `assets/`

**Scenario:**
Import a global SCSS variable file `assets/scss/variables.scss` across the entire application in `nuxt.config.ts`.

**Requirements:**
1. Configure `css` array in `nuxt.config.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   css: ["~/assets/scss/main.scss"]
> });
> ```

> #### Technical Explanation
>
> 1. `css` configuration registers stylesheets in `assets/` as global application styles.
> 2. Vite processes and bundles SCSS/CSS into optimized production stylesheet assets.
> 3. Standard method for registering design systems and custom Tailwind/SCSS stylesheets.

---

### Exercise 3: Dynamic Image Asset Path Binding

**Scenario:**
Dynamically import image assets from `assets/images/` using Vite `import.meta.glob` or dynamic asset URL helpers.

**Requirements:**
1. Resolve dynamic asset path in `<script setup>`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> // Resolve dynamic image URL using Vite URL constructor
> const getImageUrl = (name: string) => {
>   return new URL(`../assets/images/${name}.png`, import.meta.url).href;
> };
> </script>

<template>
  <img :src="getImageUrl('hero')" alt="Hero Banner" />
</template>
```

> #### Technical Explanation
>
> 1. Dynamic string interpolation in template `:src` attributes cannot be static-analyzed by Vite compilers.
> 2. Using `new URL(path, import.meta.url)` allows Vite to resolve dynamic asset URLs during production compilation.
> 3. Standard pattern for dynamic asset resolution in Vite/Nuxt.

---




---

## 6. Related Terms
- [`nuxt.config.ts`](../level_06/nuxt_config.md) — Where you can configure global SCSS stylesheets from the `assets/` directory.

---

## 7. Key Takeaways
- `public/` is for files that should not be compiled. They are mapped to the root URL `/`.
- `assets/` is for files that Vite should optimize, minify, and hash. Accessed via `~/assets/`.
- Dynamic image paths must use the `public/` directory.
