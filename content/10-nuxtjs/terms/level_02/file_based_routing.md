# File-based Routing

> **Level 2 — Directory Structure & Routing**
> A core Nuxt.js feature that automatically generates your application's routes based strictly on the folder and file structure inside the `pages/` directory, eliminating the need for a manual router configuration file.

---

## 1. Prerequisites
- [Nuxt 3 Overview](../level_01/nuxt_3_overview.md) — The framework that implements this pattern.
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — The underlying UI component structure.

---

## 2. Term Category
- **Routing**

---

## 3. Environment Context
- **Build-Time** (Generates Vue Router configuration).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a standard Vue 3 application (without Nuxt), developers must manually configure `vue-router`. They create a `router.ts` file, import every single component, and map them to specific string paths (e.g., `{ path: '/about', component: About }`). As applications grow to hundreds of pages, this file becomes an unmaintainable, massive bottleneck.

Nuxt eliminates this entirely. It uses **File-based Routing**. If you create a file named `about.vue` inside the `pages/` directory, Nuxt automatically creates the `/about` route for you at build time.

### (2) Core Concept
Under the hood, Nuxt still uses `vue-router`. However, instead of you writing the configuration, Nuxt reads your file system and generates the `router.ts` file automatically.

**Example Structure:**
```text
pages/
├── index.vue        --> Maps to: /
├── about.vue        --> Maps to: /about
└── contact/
    └── index.vue    --> Maps to: /contact
```

If you don't need routing (e.g., you are building a simple single-page landing site), you don't even need a `pages/` directory! Nuxt will optimize the build by omitting `vue-router` entirely.

### (3) Nested Routes
If you want to create a layout specifically for a sub-section of your site (like a dashboard), you can use nested routing. Creating a `dashboard.vue` file *alongside* a `dashboard/` directory tells Nuxt that `dashboard.vue` is a wrapper layout for the child routes inside the directory.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Extraneous files in the `pages/` directory
**The mistake:** Putting UI components, API utilities, or test files directly inside the `pages/` folder.

**Why it's wrong:** Nuxt blindly converts *every single `.vue` file* inside `pages/` into a public route. If you put `Button.vue` inside `pages/`, users can navigate to `yoursite.com/Button` and view an isolated button.
**Golden Rule:** The `pages/` directory should *only* contain files that are meant to be full, navigable web pages. Put everything else in `components/` or `utils/`.

---

### Mistake 2: Creating Custom Vue Component Files inside `pages/` Directory (Unintended Route Generation)

**The mistake:** Placing helper components `pages/UserCard.vue` inside the `pages/` directory.

**Why it's wrong:** Nuxt 3 converts EVERY `.vue` file in `pages/` into a publicly accessible URL route. Placing helper components inside `pages/` creates accidental `/usercard` URLs. Put components in `components/`.

*Incorrect:*
```vue
// pages/UserCard.vue ❌ Exposes unexpected public URL route /usercard!
```

*Fix:*
```vue
// components/UserCard.vue Correct helper component directory
```

---

### Mistake 3: Capitalizing Folder Names in `pages/` (URL Case Sensitivity Conflicts)

**The mistake:** Naming route folder `pages/UserDashboard/Index.vue`.

**Why it's wrong:** Capitalized folder names create camelCase/PascalCase URL paths `/UserDashboard` that conflict with web URL conventions and cause case sensitivity issues on Linux servers. Use lowercase hyphenated names.

*Incorrect:*
```vue
// pages/UserDashboard/Index.vue ❌ Creates awkward /UserDashboard URL!
```

*Fix:*
```vue
// pages/user-dashboard/index.vue Creates clean /user-dashboard URL
```


---

## 6. Practice Exercises

### Exercise 1: Mapping Files to URLs

**Problem:** If you create a file at `pages/settings/profile/index.vue`, what URL path will Nuxt generate for it?

**Expected output:**
```text
/settings/profile
```

> [!check]- Answer
> - The `index.vue` filename is treated as the default route file for its containing directory.

---

### Exercise 2: File-to-URL Mapping Matrix

**Problem:** Resolve URL paths for the following Nuxt 3 page files:
1. `pages/about.vue` 
2. `pages/blog/index.vue` 
3. `pages/blog/[id].vue` 

**Expected output:**
```text
1. /about
2. /blog
3. /blog/:id (e.g. /blog/123)
```

> [!check]- Answer
> - `pages/about.vue` -> `/about`
> - `pages/blog/index.vue` -> `/blog`
> - `pages/blog/[id].vue` -> `/blog/123`
> 
> ```text
> File hierarchy maps directly to public URL routing.
> ```

---

### Exercise 3: Nested Routing Slot

**Problem:** Which component MUST be placed inside a parent page (e.g. `pages/parent.vue`) to render nested child route pages (`pages/parent/child.vue`)?

**Expected output:**
```text
<NuxtPage />
```

> [!check]- Answer
> - Parent page MUST include `<NuxtPage />` to render nested sub-routes.
> 
> ```vue
> <!-- pages/parent.vue -->
> <template>
>   <div><h1>Parent</h1><NuxtPage /></div>
> </template>
> ```


---

## 7. Related Terms
- [`pages/` Directory](../level_02/pages_directory.md) — The physical directory where this feature lives.
- [Dynamic Routes](../level_02/dynamic_routes.md) — How to handle URLs with variables (like `/users/123`).

---

## 8. Key Takeaways
- Nuxt automatically maps the file structure in `pages/` to application URLs.
- It removes the need to manually configure `vue-router`.
- `index.vue` always maps to the root of its current directory.
- Never put non-page components inside the `pages/` directory.
