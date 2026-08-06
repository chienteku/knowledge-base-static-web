# Dynamic Routes

> **Level 2 — Directory Structure & Routing**
> A file-naming convention in the `pages/` directory that uses square brackets (e.g., `[id].vue`) to capture variable segments of a URL.

---

## 1. Prerequisites
- [`pages/` Directory](pages_directory.md) — Where these dynamic files are created.
- [`useRoute` & `useRouter` Hooks](use_route_router.md) — The composables used to access parameter values.

---

## 2. Term Category

**Routing / Navigation** (Parameterized & Catch-All Routes): Dynamic Routes generate URL parameter matching (`[id].vue`, `[...slug].vue`) from filename conventions in the `pages/` directory.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
If you are building an e-commerce store, you don't create a separate physical file for every single product (e.g., `iphone.vue`, `macbook.vue`, `airpods.vue`). That would require millions of files. Instead, you create a single "Product Template" file that can dynamically render any product based on the URL (e.g., `/products/iphone`, `/products/macbook`).

Nuxt needs a way to know that a specific part of the file path is a variable, not a literal string.

### (2) Core Concept
In Nuxt, if you wrap a file or folder name in square brackets `[]`, it becomes a **Dynamic Route**. The string inside the brackets becomes the name of the parameter you can access in your code.

**Structure:**
```text
pages/
└── products/
    └── [id].vue    # Matches /products/1, /products/apple, etc.
```

### (3) Accessing the Parameter
Inside `[id].vue`, you can access the exact value the user typed in the URL by using the auto-imported `useRoute()` composable.

```vue
<!-- pages/products/[id].vue -->
<script setup lang="ts">
const route = useRoute();

// If the URL is /products/apple, route.params.id will be 'apple'
const productId = route.params.id;

// Fetch data dynamically based on the URL parameter
const { data: product } = await useFetch(`/api/products/${productId}`);
</script>

<template>
  <div v-if="product">
    <h1>{{ product.name }}</h1>
  </div>
</template>
```

### (4) Catch-All Routes
If you want a route to match *everything* that comes after it (e.g., `/docs/getting-started/installation/step-1`), you use a catch-all route by putting `...` inside the brackets: `[...slug].vue`. This will capture the entire path as an array.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on route params for secure operations without validation
**The mistake:** Directly passing `route.params.id` to a database query without validating what the user actually typed.

**Why it's wrong:** The user can type *anything* into the URL bar. If they type `/products/DROP-TABLE`, your code will crash or execute a malicious query if you aren't careful.
**Golden Rule:** Always validate dynamic route parameters before using them, especially in database queries or API requests. You can even validate routes directly in Nuxt using `definePageMeta`.

*Example Validation:*
```vue
<script setup lang="ts">
definePageMeta({
  validate: async (route) => {
    // Only allow numbers for the ID
    return /^\d+$/.test(route.params.id as string);
  }
})
</script>
```

---

### Mistake 2: Using Single Brackets `[id]` When Catch-All Brackets `[...slug]` Are Required

**The mistake:** Naming route folder `pages/docs/[slug].vue` and expecting it to match multi-segment paths `/docs/api/v1`.

**Why it's wrong:** Standard dynamic segments `[slug].vue` match ONLY a single path segment (`/docs/api`). Use catch-all `[...slug].vue` for multi-segment paths.

*Incorrect:*
```vue
// pages/docs/[slug].vue ❌ Fails to match multi-segment /docs/a/b/c!
```

*Fix:*
```vue
// pages/docs/[...slug].vue Matches /docs/a/b/c as array ['a', 'b', 'c']
```

---

### Mistake 3: Accessing Un-Ref'd `route.params.id` inside Reactive Watchers

**The mistake:** Destructuring `const { id } = useRoute().params` at top level and expecting it to update on same-page route navigation.

**Why it's wrong:** Destructuring `route.params` severs Vue reactivity. When navigating between `/users/1` and `/users/2`, destructured `id` will retain the old value `'1'`. Use `route.params.id` directly or `toRefs(useRoute())`.

*Incorrect:*
```vue
<script setup>
const { id } = useRoute().params; // ❌ Destructuring severs reactivity on route changes!
</script>
```

*Fix:*
```vue
<script setup>
const route = useRoute();
const userId = computed(() => route.params.id); // Reactive computed property updates on navigation
</script>
```


---

## 5. Practice Exercises

### Exercise 1: Extracting Named Route Parameters from Filenames

**Scenario:**
Create a dynamic route `pages/posts/[slug].vue` and render parameter `slug` using `useRoute()`.

**Requirements:**
1. Create `pages/posts/[slug].vue`.
2. Extract `route.params.slug`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- pages/posts/[slug].vue -->
> <script setup lang="ts">
> const route = useRoute();
> const slug = computed(() => route.params.slug as string);
> </script>

<template>
  <article>
    <h1>Article Slug: {{ slug }}</h1>
  </article>
</template>
```

> #### Technical Explanation
>
> 1. Bracket filename notation `[slug].vue` generates a named dynamic URL route parameter `slug`.
> 2. Matches paths like `/posts/hello-world` or `/posts/nuxt-3-guide`.
> 3. `useRoute().params.slug` accesses current path parameter values reactively.

---

### Exercise 2: Implementing Catch-All Routes for CMS Pages

**Scenario:**
Create a catch-all route `pages/[...slug].vue` to render dynamic multi-segment CMS pages (`/docs/guide/getting-started`).

**Requirements:**
1. Create `pages/[...slug].vue`.
2. Join `route.params.slug` array.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- pages/[...slug].vue -->
> <script setup lang="ts">
> const route = useRoute();
> // route.params.slug is an array of path segments e.g. ['docs', 'guide', 'getting-started']
> const fullPath = computed(() => {
>   const segments = route.params.slug;
>   return Array.isArray(segments) ? segments.join("/") : segments;
> });
> </script>

<template>
  <main>
    <h1>CMS Page Path: /{{ fullPath }}</h1>
  </main>
</template>
```

> #### Technical Explanation
>
> 1. Ellipsis syntax `[...slug].vue` generates a catch-all route matching single or multi-segment URL paths.
> 2. `route.params.slug` parses path segments as a string array (`['docs', 'guide']`).
> 3. Ideal for dynamic documentation portals and CMS content hierarchies.

---

### Exercise 3: Optional Catch-All Routes for Default Fallbacks

**Scenario:**
Create an optional catch-all route `pages/[[...slug]].vue` matching `/` as well as nested sub-paths.

**Requirements:**
1. Code `[[...slug]].vue` optional catch-all structure.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <!-- pages/[[...slug]].vue -->
> <script setup lang="ts">
> const route = useRoute();
> const isHome = computed(() => !route.params.slug || route.params.slug.length === 0);
> </script>

<template>
  <div>
    <h1 v-if="isHome">Root Homepage Content</h1>
    <h1 v-else>Nested Path: {{ route.params.slug }}</h1>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. Double bracket ellipsis `[[...slug]].vue` makes the catch-all parameter optional.
> 2. Matches `/` (where `slug` is undefined) and `/any/nested/path`.
> 3. Flexible route structure for single-file CMS routing.

---




---

## 6. Related Terms
- [`useFetch`](../level_05/use_fetch.md) — The standard way to fetch data based on the dynamic route parameter.
- [File-based Routing](file_based_routing.md) — Related concept: File-based Routing.
- [`pages/` Directory](pages_directory.md) — Related concept: `pages/` Directory.
- [`useRoute` & `useRouter` Hooks](use_route_router.md) — Related concept: `useRoute` & `useRouter` Hooks.

---

## 7. Key Takeaways
- Wrap filenames or foldernames in `[]` to make them dynamic (e.g., `[id].vue`).
- Access the captured value using `useRoute().params.id`.
- Use `[...slug].vue` to catch multi-segment URLs.
- Always validate route parameters to prevent unexpected behavior.
