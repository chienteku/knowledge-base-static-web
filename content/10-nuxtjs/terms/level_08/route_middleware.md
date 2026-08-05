# Route Middleware

> **Level 8 — Middleware & Plugins**
> A system that allows you to run custom code *before* navigating to a specific Vue route. It is primarily used for frontend authentication, redirecting users, or validating route parameters.

---

## 1. Prerequisites
- [Server Middleware](../level_07/server_middleware.md) — It is critical to understand that Route Middleware is fundamentally different from Server Middleware.
- [`pages/` Directory](../level_02/pages_directory.md) — The destinations that Route Middleware protects.
---

## 2. Term Category
- **Routing**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you build a Dashboard page, you don't want unauthenticated users to see it. If you put the auth-checking logic directly inside the `dashboard.vue` component's `onMounted` hook, the page will briefly render, the user will see a flash of the dashboard, and *then* they will be redirected to the login page. This is insecure and looks terrible.

**Route Middleware** runs *before* the route change actually occurs. If the middleware detects the user isn't logged in, it cancels the navigation to the dashboard entirely and redirects them to `/login` before the dashboard ever renders.

### (2) Server Middleware vs Route Middleware
This is the most confusing topic for Nuxt beginners.
- **Server Middleware (`server/middleware/`)**: Runs strictly on the Nitro Node.js backend. It intercepts HTTP requests (like fetching an image or hitting an API). It knows nothing about Vue.
- **Route Middleware (`middleware/`)**: Runs inside the Vue application. It intercepts Vue Router navigation. When the user clicks a `<NuxtLink>`, Route Middleware runs in the browser. (During initial SSR, it runs on the server before Vue renders the HTML).

### (3) Creating Route Middleware
You define Route Middleware inside the `middleware/` directory using `defineNuxtRouteMiddleware`.

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  // `to` is the route the user is trying to visit
  // `from` is the route they are coming from
  
  const user = useCookie('auth_token');

  // If there's no token, redirect to login
  if (!user.value) {
    return navigateTo('/login');
  }
});
```

To apply it to a page, use `definePageMeta`:

```vue
<!-- pages/dashboard.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: 'auth' // Refers to middleware/auth.ts
});
</script>

<template>
  <h1>Secret Dashboard</h1>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `useRouter().push()` inside Middleware
**The mistake:** Trying to redirect the user by calling the standard Vue router push method inside a middleware function.

**Why it's wrong:** Nuxt's Route Middleware is designed to work seamlessly across both the Node.js Server (during SSR) and the Browser. `useRouter().push()` only works in the browser. If the middleware triggers on the server, your app will crash.
**Golden Rule:** ALWAYS use `return navigateTo('/path')` inside middleware. It safely handles redirects on both the server (sending a 302 HTTP status) and the client (triggering vue-router).

*Incorrect:*
```typescript
export default defineNuxtRouteMiddleware((to, from) => {
  const router = useRouter();
  router.push('/login');
});
```

*Fix:*
```typescript
export default defineNuxtRouteMiddleware((to, from) => {
  return navigateTo('/login');
});
```

---

### Mistake 2: Calling Asynchronous Fetching Composables in Middleware Without Proper `await`

**The mistake:** Calling `$fetch('/api/check')` inside `defineNuxtRouteMiddleware` without `await`.

**Why it's wrong:** If asynchronous checks are not awaited inside route middleware, the router will complete the page transition before authentication status is verified.

*Incorrect:*
```typescript
export default defineNuxtRouteMiddleware((to) => {
  $fetch('/api/check').then(res => { if (!res) navigateTo('/login'); }); // ❌ Un-awaited promise!
});
```

*Fix:*
```vue
export default defineNuxtRouteMiddleware(async (to) => {
  const res = await $fetch('/api/check'); // Await async checks
  if (!res) return navigateTo('/login');
});
```

---

### Mistake 3: Creating Infinite Redirect Loops in Route Middleware

**The mistake:** Writing `export default defineNuxtRouteMiddleware((to) => { if (!isAuth) return navigateTo('/login'); })` without checking `if (to.path === '/login')`.

**Why it's wrong:** If unauthenticated user visits `/login`, the middleware redirects them to `/login` again, creating an infinite redirect loop. Always guard target path.

*Incorrect:*
```typescript
export default defineNuxtRouteMiddleware((to) => {
  if (!isAuth) return navigateTo('/login'); // ❌ Infinite loop when to.path is already /login!
});
```

*Fix:*
```vue
export default defineNuxtRouteMiddleware((to) => {
  if (!isAuth && to.path !== '/login') return navigateTo('/login'); // Path guard check
});
```


---

## 6. Practice Exercises

### Exercise 1: Aborting Navigation

**Problem:** Write a Route Middleware named `admin.ts` that checks if `useUser().isAdmin` is true. If they are an admin, let them pass. If they are not an admin, immediately cancel the navigation and throw a 403 Forbidden error using `abortNavigation()`.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineNuxtRouteMiddleware((to, from) => {
>   const { isAdmin } = useUser();
>   
>   if (!isAdmin) {
>     return abortNavigation(createError({ statusCode: 403, message: 'Forbidden' }));
>   }
> });
> ```
> - Combine `abortNavigation` with `createError({ statusCode: 403 })` to interrupt the transition.

---

### Exercise 2: Inline Page Route Middleware Pattern

**Problem:** Write `definePageMeta()` block defining inline route middleware function checking `auth` state.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup>
> definePageMeta({
>   middleware: [
>     function (to, from) {
>       const auth = useAuth();
>       if (!auth.value.isLoggedIn) return navigateTo('/login');
>     }
>   ]
> });
> </script>
> ```
> - Inline middleware functions are declared directly inside `definePageMeta`.
> 
> ```vue
> <script setup>
> definePageMeta({
>   middleware: [
>     (to, from) => {
>       const user = useUser();
>       if (!user.value && to.path !== '/login') {
>         return navigateTo('/login');
>       }
>     }
>   ]
> });
> </script>
> ```

---

### Exercise 3: Route Middleware Arguments

**Problem:** What 2 arguments are passed to `defineNuxtRouteMiddleware((to, from) => {})`?

**Expected output:**
> [!check]- Answer
> ```text
> 1. to (Target route location object)
> 2. from (Previous route location object)
> ```
> - `to` -> Target destination route object.
> - `from` -> Originating route object.
> 
> ```typescript
> defineNuxtRouteMiddleware((to, from) => {
>   console.log(`Navigating from ${from.path} to ${to.path}`);
> });
> ```


---

## 7. Related Terms
- [Global vs Named Middleware](global_vs_named_middleware.md) — The two ways to apply these functions.
- [`pages/` Directory](../level_02/pages_directory.md) — Where middleware is applied via `definePageMeta`.
- [`definePageMeta` Compiler Macro](../level_02/define_page_meta.md) — Related concept: `definePageMeta` Compiler Macro.
- [`useRoute` & `useRouter` Hooks](../level_02/use_route_router.md) — Related concept: `useRoute` & `useRouter` Hooks.
- [Server Middleware](../level_07/server_middleware.md) — Related concept: Server Middleware.
- [`abortNavigation` Utility](abort_navigation.md) — Related concept: `abortNavigation` Utility.
---

## 8. Key Takeaways
- Route Middleware intercepts Vue Router navigation *before* the page renders.
- It is located in the `middleware/` directory (NOT `server/middleware/`).
- Use `return navigateTo()` to safely redirect users.
- Use `return abortNavigation()` to block navigation completely.
