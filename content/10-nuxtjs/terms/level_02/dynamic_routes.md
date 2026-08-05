# Dynamic Routes

> **Level 2 — Directory Structure & Routing**
> A file-naming convention in the `pages/` directory that uses square brackets (e.g., `[id].vue`) to capture variable segments of a URL.

---

## 1. Prerequisites
- [`pages/` Directory](pages_directory.md) — Where these dynamic files are created.
- [`useRoute` & `useRouter` Hooks](use_route_router.md) — The composables used to access parameter values.
---

## 2. Term Category
- **Routing**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: File Naming

**Problem:** You are building a blog. You want URLs to look like `/blog/2023/my-post`. What exact file and folder structure do you need to capture the year as `year` and the post name as `slug`?

**Expected output:**
> [!check]- Answer
> ```text
> pages/
> └── blog/
>     └── [year]/
>         └── [slug].vue
> ```
> - You can mix static folders (`blog/`) and dynamic parameter folders (`[year]/`) in your pages directory hierarchy.

---

### Exercise 2: Dynamic Route Parameter Fetch Pattern

**Problem:** Write `<script setup>` reading route parameter `id` from `useRoute()` and fetching product details via `useFetch()`.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup>
> const route = useRoute();
> const { data: product } = await useFetch(`/api/products/${route.params.id}`);
> </script>
> ```
> - `useRoute().params` exposes dynamic route parameters.
> 
> ```vue
> <script setup>
> const route = useRoute();
> const { data: product } = await useFetch(`/api/products/${route.params.id}`);
> </script>
> 
> <template>
>   <div v-if="product"><h1>{{ product.name }}</h1></div>
> </template>
> ```

---

### Exercise 3: Optional Catch-All Syntax

**Problem:** Which file naming convention defines an optional catch-all dynamic route in Nuxt 3?

**Expected output:**
> [!check]- Answer
> ```text
> [[...slug]].vue (Double square brackets)
> ```
> - `[[...slug]].vue` matches both root path `/` and nested paths `/a/b/c`.
> 
> ```text
> pages/docs/[[...slug]].vue
> ```


---

## 7. Related Terms
- [`useFetch`](../level_05/use_fetch.md) — The standard way to fetch data based on the dynamic route parameter.
- [File-based Routing](file_based_routing.md) — Related concept: File-based Routing.
- [`pages/` Directory](pages_directory.md) — Related concept: `pages/` Directory.
- [`useRoute` & `useRouter` Hooks](use_route_router.md) — Related concept: `useRoute` & `useRouter` Hooks.
---

## 8. Key Takeaways
- Wrap filenames or foldernames in `[]` to make them dynamic (e.g., `[id].vue`).
- Access the captured value using `useRoute().params.id`.
- Use `[...slug].vue` to catch multi-segment URLs.
- Always validate route parameters to prevent unexpected behavior.
