# Global vs Named Middleware

> **Level 8 — Middleware & Plugins**
> The two distinct types of Route Middleware in Nuxt: one that runs automatically on every single page transition, and one that must be explicitly opted into on a per-page basis.

---

## 1. Prerequisites
- [Route Middleware](../level_08/route_middleware.md) — The overarching concept of intercepting Vue routing.
- [Dynamic Routing (Pages)](../level_02/dynamic_routes.md) — Understanding route paths and structure.

---

## 2. Term Category
- **Routing**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: File Naming Convention

**Problem:** You want to create a middleware that checks if the application is currently in "Maintenance Mode." If it is, you want every single URL to redirect to `/maintenance`. What should you name the file in the `middleware/` directory?

**Expected output:**
> [!check]- Answer
> ```text
> maintenance.global.ts
> ```
> - Suffixing a middleware file name with `.global` marks it for universal execution across all route transitions.

---

### Exercise 2: Global vs Named Middleware Structure Pattern

**Problem:** Contrast file naming conventions for Global vs Named route middleware in the `middleware/` directory.

**Expected output:**
> [!check]- Answer
> ```text
> Global Middleware: middleware/log.global.ts (.global.ts suffix);
> Named Middleware: middleware/auth.ts (no global suffix).
> ```
> - Global -> `middleware/analytics.global.ts` (Executes automatically everywhere).
> - Named -> `middleware/auth.ts` (Registered per page).
> 
> ```text
> *.global.ts = Runs Everywhere; *.ts = Registered via definePageMeta
> ```

---

### Exercise 3: Middleware Execution Order

**Problem:** In what sequence do Global vs Named middleware execute during a page transition?

**Expected output:**
> [!check]- Answer
> ```text
> 1. Global Middleware (ordered alphabetically by filename or numerical prefix 01.log.global.ts)
> 2. Named Middleware (in order defined in definePageMeta array)
> ```
> - Global middleware runs first, followed by page named middleware.
> 
> ```text
> 1. Global Middleware (*.global.ts) -> 2. Page Named Middleware
> ```


---

## 7. Related Terms
- [`definePageMeta`](../level_02/pages_directory.md) — The macro used to attach Named Middleware to a specific page.

---

## 8. Key Takeaways
- Named middleware (e.g., `auth.ts`) must be explicitly applied to pages.
- Global middleware (e.g., `auth.global.ts`) automatically applies to all pages.
- When redirecting inside Global middleware, always check `to.path` to prevent infinite loops.
