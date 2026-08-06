# File-based Routing

> **Level 2 — Directory Structure & Routing**
> A core Nuxt.js feature that automatically generates your application's routes based strictly on the folder and file structure inside the `pages/` directory, eliminating the need for a manual router configuration file.

---

## 1. Prerequisites
- [Nuxt 3 Overview](../level_01/nuxt_3_overview.md) — The framework that implements this pattern.
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — The underlying UI component structure.

---

## 2. Term Category

**Routing / Navigation** (Directory-Driven Route Generation): File-based routing automatically translates nested Vue files inside the `pages/` directory into Vue Router URL patterns.



---

## 3. Explanation

### Environment Context
- **Build-Time** (Generates Vue Router configuration).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Mapping Directory Structure to URL Routes

**Scenario:**
Map a list of file paths in `pages/` to their corresponding generated Vue Router URL paths.

**Requirements:**
1. Match `pages/index.vue`, `pages/about.vue`, `pages/blog/index.vue`, `pages/blog/[id].vue`.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> File-Based Routing Map:
> - Route 1: pages/index.vue        -> URL: /
> - Route 2: pages/about.vue        -> URL: /about
> - Route 3: pages/blog/index.vue   -> URL: /blog
> - Route 4: pages/blog/[id].vue    -> URL: /blog/:id
> ```
>
> #### Technical Explanation
>
> 1. Nuxt 3 automatically scans the `pages/` directory to generate the Vue Router table.
> 2. Files named `index.vue` serve as index routes for their parent directory folder.
> 3. Eliminates manual router table configuration (`router.js`).

---

### Exercise 2: Implementing Nested Child Routes with `<NuxtPage>`

**Scenario:**
Create a nested route parent `pages/parent.vue` rendering child route `pages/parent/child.vue`.

**Requirements:**
1. Include `<NuxtPage />` inside `pages/parent.vue`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- pages/parent.vue -->
> <template>
>   <div class="parent-layout">
>     <h1>Parent Container</h1>
>     <!-- Child route views render here! -->
>     <NuxtPage />
>   </div>
> </template>
> ```

> ```vue
> <!-- pages/parent/child.vue -->
> <template>
>   <div class="child-view">
>     <h2>Child View Content</h2>
>   </div>
> </template>
> ```

> #### Technical Explanation
>
> 1. When a component file `pages/parent.vue` shares a name with a directory `pages/parent/`, Nuxt creates a nested child route.
> 2. `<NuxtPage />` inside `pages/parent.vue` acts as the router-view viewport for child routes.
> 3. Enables nested view structures and persistent parent UI components.

---

### Exercise 3: Defining Custom Route Options via Component Names

**Scenario:**
Explain how file naming conventions enforce index route priorities and static vs dynamic route matching order.

**Requirements:**
1. Detail static vs dynamic route matching precedence.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Route Precedence Order:
> - Priority 1: Exact Static Routes (e.g. pages/posts/featured.vue -> /posts/featured)
> - Priority 2: Parameterized Routes (e.g. pages/posts/[id].vue -> /posts/:id)
> - Priority 3: Catch-All Routes (e.g. pages/posts/[...slug].vue -> /posts/*)
> ```
>
> #### Technical Explanation
>
> 1. Vue Router matches specific static route paths before evaluating dynamic parameterized routes.
> 2. `/posts/featured` matches `pages/posts/featured.vue` even if `pages/posts/[id].vue` exists.
> 3. Deterministic file-based route resolution rules.

---




---

## 6. Related Terms
- [`pages/` Directory](pages_directory.md) — The physical directory where this feature lives.
- [Dynamic Routes](dynamic_routes.md) — How to handle URLs with variables (like `/users/123`).

---

## 7. Key Takeaways
- Nuxt automatically maps the file structure in `pages/` to application URLs.
- It removes the need to manually configure `vue-router`.
- `index.vue` always maps to the root of its current directory.
- Never put non-page components inside the `pages/` directory.
