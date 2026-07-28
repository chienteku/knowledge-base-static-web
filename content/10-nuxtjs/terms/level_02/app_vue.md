# `app.vue`

> **Level 2 — Directory Structure & Routing**
> The main entry point component of every Nuxt 3 application, acting as the absolute root of the Vue tree where global layouts and top-level logic reside.

---

## 1. Prerequisites
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — The syntax used inside this file.
- [File-based Routing](../level_02/file_based_routing.md) — The routing system initialized by this component.

---

## 2. Term Category
- **Directory Structure**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Every UI framework needs a single "Root Node" where the entire component tree begins. In standard Vue, this is usually an `App.vue` file that gets manually mounted to an HTML div in a `main.ts` file. 

Nuxt 3 simplifies this. It removes the need for a `main.ts` file entirely and designates `app.vue` (at the very root of your project folder) as the unbreakable entry point of your application.

### (2) Core Concept
By default, a new Nuxt 3 project contains a single `app.vue` file. If you are building a simple, single-page landing site, you can put all your code directly in here and delete the `pages/` directory.

However, if you want routing, `app.vue` is responsible for rendering the current page. You do this by inserting the `<NuxtPage />` component inside it.

```vue
<!-- app.vue -->
<template>
  <div>
    <!-- This Header will appear on EVERY page in the app -->
    <header>Global Navigation</header>

    <!-- This acts as the "Outlet" where Nuxt injects the current route -->
    <NuxtPage />
    
    <!-- This Footer will appear on EVERY page in the app -->
    <footer>Global Footer</footer>
  </div>
</template>
```

### (3) Global vs Layouts
While you *can* put global headers and footers in `app.vue`, doing so means they will appear on *every single route* without exception (even login pages or error pages). If you need different layouts for different pages, you should use Nuxt's layout system (`<NuxtLayout />`) instead.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `<NuxtPage />` when using the `pages/` directory
**The mistake:** Creating files inside the `pages/` directory, but wondering why the URL changes but the screen remains completely blank.

**Why it's wrong:** Nuxt does not automatically assume you want to use routing. If `app.vue` exists but does not contain `<NuxtPage />`, Nuxt simply renders `app.vue` and ignores the `pages/` directory entirely.
**Golden Rule:** If you are building a multi-page site, your `app.vue` MUST contain `<NuxtPage />`.

*Incorrect:*
```vue
<template>
  <div>
    <h1>Welcome to Nuxt</h1>
    <!-- The pages/ directory is effectively ignored -->
  </div>
</template>
```

*Fix:*
```vue
<template>
  <div>
    <h1>Welcome to Nuxt</h1>
    <NuxtPage />
  </div>
</template>
```

---

### Mistake 2: Forgetting `<NuxtPage />` in `app.vue` When Using the `pages/` Directory

**The mistake:** Creating a `pages/` directory but writing `<template><div><NuxtWelcome /></div></template>` in `app.vue`.

**Why it's wrong:** Without `<NuxtPage />` inside `app.vue`, Nuxt routing will NOT render page components matching URL paths.

*Incorrect:*
```vue
<!-- app.vue -->
<template>
  <div><h1>Static Site</h1></div> <!-- ❌ Pages in pages/ directory will never render! -->
</template>
```

*Fix:*
```vue
<!-- app.vue -->
<template>
  <div>
    <NuxtLayout>
      <NuxtPage /> <!-- Renders page matching current route URL -->
    </NuxtLayout>
  </div>
</template>
```

---

### Mistake 3: Overloading `app.vue` with Page-Specific State and Layout Components

**The mistake:** Putting page headers, footers, and page data fetches directly inside `app.vue`.

**Why it's wrong:** `app.vue` is the top-level main component entrypoint. Page-specific state belongs in `pages/` and persistent layouts belong in `layouts/`.

*Incorrect:*
```vue
/* Writing page-specific state and API fetches inside root app.vue */
```

*Fix:*
```vue
/* Keep app.vue lightweight with <NuxtLayout><NuxtPage /></NuxtLayout> */
```


---

## 6. Practice Exercises

### Exercise 1: Initializing the Router

**Problem:** Write the most minimal `app.vue` file required to activate the Nuxt routing system so the `pages/` directory works.

**Expected output:**
> [!check]- Answer
> ```vue
> <template>
>   <NuxtPage />
> </template>
> ```
> - The built-in component `<NuxtPage />` acts as a placeholder viewport that tells Nuxt where to render matching routing templates from the `pages/` directory.

---

### Exercise 2: Minimal app.vue Router Entrypoint Pattern

**Problem:** Write a minimal `app.vue` component combining `<NuxtLayout>` and `<NuxtPage />`.

**Expected output:**
> [!check]- Answer
> ```vue
> <template>
>   <div>
>     <NuxtLayout>
>       <NuxtPage />
>     </NuxtLayout>
>   </div>
> </template>
> ```
> - `<NuxtLayout>` wraps page rendering with layout templates.
> 
> ```vue
> <template>
>   <div>
>     <NuxtLayout>
>       <NuxtPage />
>     </NuxtLayout>
>   </div>
> </template>
> ```

---

### Exercise 3: app.vue vs pages/index.vue Distinction

**Problem:** Contrast `app.vue` vs `pages/index.vue`.

**Expected output:**
> [!check]- Answer
> ```text
> app.vue is the top-most main root wrapper component that renders on every route; pages/index.vue is the page component matching root URL path '/'.
> ```
> - `app.vue` -> Global application wrapper.
> - `pages/index.vue` -> Route handler for `/` URL.
> 
> ```text
> app.vue (Global Wrapper) > pages/index.vue (Root Route Page)
> ```


---

## 7. Related Terms
- [`pages/` Directory](../level_02/pages_directory.md) — The folder whose contents are injected into `<NuxtPage />`.
- [`layouts/` Directory](../level_02/layouts_directory.md) — The feature used to create switchable page wrappers.

---

## 8. Key Takeaways
- `app.vue` is the absolute root component of a Nuxt 3 application.
- It is the perfect place to put global styles or global meta tags.
- It must contain `<NuxtPage />` if you want to use file-based routing.
