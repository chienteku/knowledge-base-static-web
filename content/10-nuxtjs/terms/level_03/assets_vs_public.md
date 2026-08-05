# `assets/` vs `public/`

> **Level 3 — Components & Assets**
> The two distinct directories in Nuxt for managing static files (like images, fonts, and stylesheets). The difference lies in whether the files should be processed by the build tool (Vite) or served directly to the browser as-is.

---

## 1. Prerequisites
- [Nuxt 3 Overview](../level_01/nuxt_3_overview.md) — Specifically the Vite bundler that powers the build process.
---

## 2. Term Category
- **Directory Structure**

---

## 3. Environment Context
- **Build-Time vs. Server**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Choosing the correct directory

**Problem:** You have a `sitemap.xml` file that Google uses to crawl your site. It must be accessible exactly at `yoursite.com/sitemap.xml`. Which directory should you put it in?

**Expected output:**
> [!check]- Answer
> ```text
> public/
> ```
> - If a file needs to be accessible by name exactly at the root URL path of your site, it must not be compiled by Vite.

---

### Exercise 2: assets vs public Selection Matrix

**Problem:** Match the file asset to its correct directory (`assets/` vs `public/`):
1. `favicon.ico` 
2. `robots.txt` 
3. `global.scss` 
4. SVG icons processed by Vite inline loader

**Expected output:**
> [!check]- Answer
> ```text
> 1. public/
> 2. public/
> 3. assets/
> 4. assets/
> ```
> - `public/` -> Static un-processed root files (`favicon.ico`, `robots.txt`).
> - `assets/` -> Bundled/compiled source files (`global.scss`, inline SVGs).
> 
> ```text
> public/ = Un-processed root static files;
> assets/ = Bundled build source assets.
> ```

---

### Exercise 3: Public Directory Root Path Reference

**Problem:** Given image file `public/images/banner.jpg`, write `<img />` tag referencing its URL path.

**Expected output:**
> [!check]- Answer
> ```vue
> <img src="/images/banner.jpg" alt="Banner" />
> ```
> - `public/` contents map directly to root URL `/`.
> 
> ```vue
> <img src="/images/banner.jpg" alt="Banner" />
> ```


---

## 7. Related Terms
- [`nuxt.config.ts`](../level_06/nuxt_config.md) — Where you can configure global SCSS stylesheets from the `assets/` directory.
---

## 8. Key Takeaways
- `public/` is for files that should not be compiled. They are mapped to the root URL `/`.
- `assets/` is for files that Vite should optimize, minify, and hash. Accessed via `~/assets/`.
- Dynamic image paths must use the `public/` directory.
