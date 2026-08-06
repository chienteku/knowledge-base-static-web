# Global vs Named Middleware

> **Level 8 — Middleware & Plugins**
> The two distinct types of Route Middleware in Nuxt: one that runs automatically on every single page transition, and one that must be explicitly opted into on a per-page basis.

---

## 1. Prerequisites
- [Route Middleware](route_middleware.md) — The overarching concept of intercepting Vue routing.
- [Dynamic Routes](../level_02/dynamic_routes.md) — Understanding route paths and structure.

---

## 2. Term Category

**Security & Middleware** (Middleware Scope & Precedence): Global middleware (`.global.ts`) executes automatically on every route transition, whereas named middleware (`auth.ts`) is assigned per-page.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
Not all routing rules are created equal. 
Some rules apply exclusively to one page: "Only Admins can view the `/admin` page." 
Other rules apply to the entire website: "If the user hasn't accepted the Terms of Service, block them from viewing *any* page and force them to `/tos`."

Nuxt splits Route Middleware into two categories—Named and Global—so you don't have to manually apply global rules to every single Vue component you write.

### (2) Named Middleware
Named middleware is created by putting a file in the `middleware/` directory (e.g., `middleware/auth.ts`). 

It **does not run** unless a page explicitly requests it using `definePageMeta`.

```vue
<!-- pages/settings.vue -->
<script setup>
definePageMeta({
  middleware: 'auth' // Runs middleware/auth.ts
});
</script>
```

### (3) Global Middleware
Global middleware is created by adding the `.global` suffix to the filename (e.g., `middleware/analytics.global.ts`).

Once this file is created, Nuxt will automatically execute it on **every single route change** across the entire application. You do not need to update `definePageMeta` anywhere.

```typescript
// middleware/analytics.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  // This will log to the console every time the user clicks a <NuxtLink>
  console.log(`Navigating from ${from.path} to ${to.path}`);
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Infinite Redirect Loops in Global Middleware
**The mistake:** Writing a global middleware that redirects unauthenticated users to `/login`, but forgetting to check if they are *already* going to `/login`.

**Why it's wrong:** The middleware runs. It sees the user isn't logged in. It redirects to `/login`. This triggers the router. The global middleware runs again. It sees the user isn't logged in. It redirects to `/login`. This creates an infinite loop that crashes the browser.
**Golden Rule:** When redirecting from a **Global** middleware, you MUST always check the `to.path` to ensure the user isn't already heading to the destination route!

*Incorrect:*
```typescript
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useCookie('user');
  if (!user.value) {
    return navigateTo('/login'); // INFINITE LOOP!
  }
});
```

*Fix:*
```typescript
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useCookie('user');
  
  // Explicitly allow them to visit the login page!
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login');
  }
});
```

---

### Mistake 2: Creating `.global.ts` Middleware for Targeted Pages (Performance Bottleneck)

**The mistake:** Naming middleware `middleware/auth.global.ts` when authentication is required for `/admin` pages only.

**Why it's wrong:** `.global.ts` suffix forces middleware to execute on EVERY SINGLE page transition in the entire application. Use named middleware (`middleware/auth.ts`) for targeted pages.

*Incorrect:*
```vue
// middleware/auth.global.ts ❌ Executes on every page transition (homepage, about, etc.)!
```

*Fix:*
```vue
// middleware/auth.ts Named middleware applied only via definePageMeta({ middleware: 'auth' })
```

---

### Mistake 3: Forgetting to Register Named Middleware in Page Components

**The mistake:** Creating `middleware/check.ts` and expecting it to execute automatically on `/profile` without registration.

**Why it's wrong:** Named middleware (without `.global.ts` suffix) must be registered explicitly on pages using `definePageMeta({ middleware: ['check'] })`.

*Incorrect:*
```vue
/* Expecting named middleware/check.ts to run automatically without page registration */
```

*Fix:*
```vue
/* Add definePageMeta({ middleware: 'check' }) to target page components */
```


---

## 5. Practice Exercises

### Exercise 1: Authoring Global Route Middleware

**Scenario:**
Create a global middleware `middleware/01.analytics.global.ts` that tracks route views for every page navigation.

**Requirements:**
1. Create `middleware/*.global.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // middleware/01.analytics.global.ts
> export default defineNuxtRouteMiddleware((to, from) => {
>   if (import.meta.client) {
>     console.log(`[Global Analytics] Navigating from ${from.path} to ${to.path}`);
>   }
> });
> ```
> 
> #### Technical Explanation
>
> 1. Filenames ending in `.global.ts` are automatically registered as global route middleware.
> 2. Executes on every route transition without requiring `definePageMeta()` configuration on individual pages.
> 3. Numeric prefix `01.` controls middleware execution order.
> 
---

### Exercise 2: Authoring Named Page Middleware

**Scenario:**
Create a named middleware `middleware/auth.ts` and attach it to `pages/dashboard.vue`.

**Requirements:**
1. Create `middleware/auth.ts`.
2. Attach via `definePageMeta({ middleware: ["auth"] })`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // middleware/auth.ts
> export default defineNuxtRouteMiddleware((to) => {
>   const { isLoggedIn } = useAuth();
>   
>   if (!isLoggedIn.value) {
>     return navigateTo("/login");
>   }
> });
> ```
> 
> ```vue
> <!-- pages/dashboard.vue -->
> <script setup lang="ts">
> definePageMeta({
>   middleware: ["auth"]
> });
> </script>
> ```
> 
> #### Technical Explanation
>
> 1. Named middleware files (without `.global.ts`) are executed ONLY when explicitly referenced in `definePageMeta()`.
> 2. `middleware: ['auth']` executes named guard logic before component rendering.
> 3. Modular route protection pattern.
> 
---

### Exercise 3: Middleware Execution Precedence Rules

**Scenario:**
Formulate an execution order matrix for inline middleware, global middleware, and named middleware.

**Requirements:**
1. Outline execution order steps.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Route Middleware Execution Order:
> - Step 1: Global Middleware (sorted alphabetically or by numeric prefix e.g. 01.auth.global.ts).
> - Step 2: Named Middleware (defined in middleware/ and assigned in page definePageMeta).
> - Step 3: Anonymous Inline Middleware (defined directly inside definePageMeta({ middleware: [] })).
> ```
>
> #### Technical Explanation
>
> 1. Global middleware runs first for all application routes.
> 2. Named and inline page middleware execute sequentially afterwards.
> 3. Deterministic middleware precedence model.
> 
---


## 6. Related Terms
- [`pages/` Directory](../level_02/pages_directory.md) — The macro used to attach Named Middleware to a specific page.
- [Route Middleware](route_middleware.md) — Related concept: Route Middleware.

---

## 7. Key Takeaways
- Named middleware (e.g., `auth.ts`) must be explicitly applied to pages.
- Global middleware (e.g., `auth.global.ts`) automatically applies to all pages.
- When redirecting inside Global middleware, always check `to.path` to prevent infinite loops.
