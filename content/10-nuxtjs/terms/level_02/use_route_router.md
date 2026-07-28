# `useRoute` & `useRouter` Hooks

> **Level 2 — Directory Structure & Routing**
> Built-in Nuxt composables that provide access to the active route's parameters and the global router instance for programmatic navigation.

---

## 1. Prerequisites
- [File-based Routing](../level_02/file_based_routing.md) — The routing system these composables inspect.
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — The execution scope where these hooks are called.

---

## 2. Term Category
- **Routing**

---

## 3. Environment Context
- **Server & Client** (Both hooks are active during SSR compilation on the server and dynamic hydration updates in the browser).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Applications must interact with the browser's address bar:
1.  **Reading URL Parameters:** If a user visits `/users/42`, the application needs to read the string `'42'` to query user data.
2.  **Programmatic Navigation:** When a user clicks a "Log In" button, the application needs to verify their credentials and redirect them to `/dashboard` programmatically.

In standard Vue Router, developers import routing tools manually. In Nuxt 3, these tools are exposed via global, auto-imported composables: **`useRoute()`** (for reading state) and **`useRouter()`** (for executing navigation).

---

### (2) Reading Route Parameters: `useRoute`
`useRoute()` returns the active route's state object. Key properties include:
-   **`params`:** An object containing the dynamic path variables (e.g., `{ id: '42' }`).
-   **`query`:** An object containing key-value URL query parameters (e.g., `?search=vue` results in `{ search: 'vue' }`).
-   **`path`:** The path pathname string (e.g. `/users/42`).

```vue
<!-- pages/users/[id].vue -->
<script setup lang="ts">
// Read the id path parameter automatically
const route = useRoute();
const userId = route.params.id; // '42'
const pageQuery = route.query.page; // '2' if URL has ?page=2
</script>

<template>
  <div>
    <h1>User Profile</h1>
    <p>User ID: {{ userId }}</p>
  </div>
</template>
```

---

### (3) Programmatic Navigation: `useRouter`
`useRouter()` returns the global Vue Router instance. Key methods include:
-   **`push(path)`:** Navigates to a new URL, adding a new entry to the browser history stack.
-   **`replace(path)`:** Navigates to a new URL, replacing the current history stack entry (so the user cannot click "Back" to return).
-   **`back()` / `forward()`:** Simulates browser back and forward actions.

```vue
<!-- components/LoginButton.vue -->
<script setup lang="ts">
const router = useRouter();

function handleLogin() {
  // 1. Perform authentication logic...
  // 2. Redirect programmatically
  router.push('/dashboard');
}
</script>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `useRouter().push` inside Route Middleware

**The mistake:** Triggering client-side router navigation commands inside route middleware files:

```typescript
// middleware/auth.ts
// BAD: Breaks Server-Side Rendering redirects!
export default defineNuxtRouteMiddleware((to) => {
  const router = useRouter();
  if (!isAuthenticated()) {
    router.push('/login'); 
  }
});
```

**Why it's wrong:** Middleware executes on the server during initial SSR. The `useRouter()` instance represents client-side navigation. Calling it on the server can result in blank screens or hydration errors.

**Golden Rule:** Inside middleware or server contexts, always use the Nuxt-specific redirect utility **`navigateTo('/path')`** instead of `useRouter().push()`.

---

### Mistake 2: Confusing `useRoute()` (Route State) with `useRouter()` (Router Actions)

**The mistake:** Attempting to call `useRoute().push('/dashboard')`.

**Why it's wrong:** `useRoute()` returns the CURRENT route state (params, query, path). `useRouter()` returns the router instance methods (`push()`, `replace()`, `back()`).

*Incorrect:*
```typescript
const route = useRoute();
route.push('/dashboard'); // ❌ TypeError: route.push is not a function!
```

*Fix:*
```typescript
const router = useRouter();
router.push('/dashboard'); // Correct router action method
```

---

### Mistake 3: Using `window.location.href` for Internal Page Navigation (Full Page Reload)

**The mistake:** Writing `window.location.href = '/about'` for internal navigation inside event handlers.

**Why it's wrong:** `window.location.href` triggers a full browser hard reload, wiping client state and destroying SPA fast transitions. Use `useRouter().push('/about')` or `<NuxtLink>`.

*Incorrect:*
```typescript
function navigate() {
  window.location.href = '/about'; // ❌ Triggers full hard browser reload!
}
```

*Fix:*
```typescript
function navigate() {
  const router = useRouter();
  router.push('/about'); // Fast client-side SPA navigation
}
```


---

## 6. Practice Exercises

### Exercise 1: Read Query Parameters

**Problem:** Complete the setup script block below to capture a search term parameter named `q` from the URL queries (e.g., `?q=javascript`) and store it in a constant:

```vue
<script setup lang="ts">
// Solution:
const route = useRoute();
const searchQuery = route.query.q;
</script>
```

> [!check]- Answer
> - Initialize `useRoute()` and inspect its `query` object property.

---

### Exercise 2: useRoute and useRouter Setup Pattern

**Problem:** Write `<script setup>` reading query parameter `q` from `useRoute()` and a button navigating to `/search?q=new` using `useRouter()`.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup>
> const route = useRoute();
> const router = useRouter();
> const currentQuery = computed(() => route.query.q);
> function updateQuery() {
>   router.push({ path: '/search', query: { q: 'new' } });
> }
> </script>
> ```
> - `useRoute()` reads state; `useRouter()` triggers navigation.
> 
> ```vue
> <script setup>
> const route = useRoute();
> const router = useRouter();
> 
> const searchWord = computed(() => route.query.q);
> 
> function searchNew() {
>   router.push({ path: '/search', query: { q: 'nuxt3' } });
> }
> </script>
> ```

---

### Exercise 3: router.replace vs router.push

**Problem:** What is the difference between `router.push('/login')` and `router.replace('/login')`?

**Expected output:**
> [!check]- Answer
> ```text
> push() adds a new entry to browser history stack; replace() overwrites the current history entry without creating a new back-button step.
> ```
> - `push()` -> Adds entry to history stack.
> - `replace()` -> Overwrites current history entry.
> 
> ```typescript
> router.replace('/login'); // Does not pollute back button history
> ```


---

## 7. Related Terms
- [Dynamic Routes](../level_02/dynamic_routes.md) — The route types that produce parameters.
- [Route Middleware](../level_08/route_middleware.md) — The routing interceptors where redirects occur.

---

## 8. Key Takeaways
- `useRoute` provides read-only details about the active route parameters, queries, and path.
- `useRouter` provides helper methods to execute programmatic routing updates.
- Access dynamic segments via `useRoute().params` and search queries via `useRoute().query`.
- Use `router.push()` for standard client navigations and `router.replace()` for redirects.
- Do not use `useRouter().push()` in server environments; use `navigateTo()` instead.
