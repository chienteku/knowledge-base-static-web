# Navigation Guards

> **Level 6 — Routing (Vue Router)**
> Functions that act as security checkpoints in Vue Router. They intercept route navigations before they happen, allowing you to redirect or cancel the navigation based on logic (like checking if a user is logged in).

---

## 1. Prerequisites
- [Vue Router](../level_06/vue_router.md) — The library that provides these guards.

---

## 2. Term Category
- **Vue Ecosystem / Routing Security**

---

## 3. Environment Context
- **Client-Side**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you have an `/admin-dashboard` route, you don't want unauthorized users to see it. 
You *could* mount the Admin component, run an API check in the `onMounted` hook, and then kick the user out if they fail. But that means the component physically renders for a split second, potentially flashing sensitive UI.
**Navigation Guards** act as bouncers at the door. They intercept the user *before* the URL changes and *before* the component mounts. If the user isn't authenticated, the guard rejects the transition and redirects them to the login page.

### (2) Global Before Guards (`beforeEach`)
The most common guard is `router.beforeEach`. It runs every single time a navigation is triggered, anywhere in the app.

```javascript
// router.js
import router from './router'
import { isUserLoggedIn } from './auth'

// This intercepts ALL navigation!
router.beforeEach((to, from) => {
  // `to` is the route they are trying to go to.
  
  if (to.path === '/admin' && !isUserLoggedIn()) {
    // Return a new path to REDIRECT them
    return '/login'
  }
  
  // Return true (or undefined) to ALLOW them to proceed
  return true
})
```

### (3) Route Meta Fields
Checking `to.path === '/admin'` is fragile. What if you have 20 protected routes?
Instead, you can attach custom `meta` data to your route configurations, and the guard checks that data.

```javascript
// 1. Define the meta requirement
const routes = [
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } }
]

// 2. The guard checks for the meta flag
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isUserLoggedIn()) {
    return '/login'
  }
})
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: The Infinite Redirect Loop

**The mistake:** A developer writes:
`router.beforeEach((to) => { if (!isLoggedIn) return '/login'; })`

**Why it's wrong:** The user tries to go to `/home`. They aren't logged in, so the guard returns `/login`. This triggers a *new* navigation to `/login`. The guard intercepts it again! It checks `!isLoggedIn`, which is true, so it returns `/login`. It triggers a new navigation. Infinite loop! The browser crashes.
**Golden Rule:** Always ensure your guard allows the user to access the redirection target!
```javascript
if (to.path !== '/login' && !isLoggedIn) { return '/login'; }
```

---

### Mistake 2: Calling Both `next()` and Returning Values inside Global Navigation Guards

**The mistake:** Writing `if (!isAuth) { next('/login'); return false; }` in Vue Router 4 `beforeEach` guards.

**Why it's wrong:** In Vue Router 4, combining the legacy `next()` callback with return values causes unexpected double navigation bugs. Prefer return values (`return '/login'` or `return true/false`).

*Incorrect:*
```javascript
router.beforeEach((to, from, next) => {
  if (!isAuth) { next('/login'); return false; } // ❌ Mixed next() and return value!
});
```

*Fix:*
```javascript
router.beforeEach((to, from) => {
  if (!isAuth) return '/login'; // Return route location directly in Vue Router 4
});
```

---

### Mistake 3: Creating Infinite Redirect Loops inside Global `beforeEach` Guards

**The mistake:** Writing `router.beforeEach((to) => { if (!isAuth) return '/login'; })` without checking `to.path !== '/login'`.

**Why it's wrong:** Redirecting to `/login` triggers `beforeEach` again. If `/login` is un-guarded, `beforeEach` continuously redirects to `/login` in an infinite loop.

*Incorrect:*
```javascript
router.beforeEach((to) => {
  if (!isAuth) return '/login'; // ❌ Infinite redirect loop on /login route itself!
});
```

*Fix:*
```javascript
router.beforeEach((to) => {
  if (!isAuth && to.path !== '/login') return '/login'; // Exclude login route from redirect
});
```


---

## 6. Practice Exercises

### Exercise 1: Preventing Unsaved Changes Loss

**Problem:** A user is filling out a massive form on `/create-post`. They accidentally click a link to go to `/home`. You want to show a warning: "You have unsaved changes. Leave?" before the router navigates away. What kind of guard do you use?

**Expected output:**
```text
You use an "In-Component Guard" called `onBeforeRouteLeave`.
This guard runs inside the component itself right before the router attempts to navigate away from it.
`onBeforeRouteLeave(() => { return window.confirm("You have unsaved changes. Leave?") })`
```

> [!check]- Answer
> - Global guards check where you are going. In-component guards check where you are leaving.

---

### Exercise 2: Route Meta Field Authentication Guard

**Problem:** Write `router.beforeEach()` checking if target route requires authentication via `to.meta.requiresAuth` and redirecting to `/login` if `!isAuthenticated`.

**Expected output:**
```javascript
router.beforeEach((to) => { if (to.meta.requiresAuth && !isAuthenticated.value) return '/login'; });
```

> [!check]- Answer
> - Check `to.meta` properties inside navigation guards.
> 
> ```javascript
> router.beforeEach((to) => {
>   if (to.meta.requiresAuth && !isAuthenticated.value) {
>     return { path: '/login', query: { redirect: to.fullPath } };
>   }
> });
> ```

---

### Exercise 3: Navigation Guard Types Matrix

**Problem:** Identify the 3 levels where Vue Router navigation guards can be registered.

**Expected output:**
```text
1. Global guards (router.beforeEach)
2. Per-route guards (beforeEnter inside route object)
3. In-component guards (onBeforeRouteLeave / onBeforeRouteUpdate)
```

> [!check]- Answer
> - Global: `router.beforeEach` / `router.afterEach`
> - Per-route: `beforeEnter` inside route definition
> - Component: `onBeforeRouteLeave` / `onBeforeRouteUpdate`
> 
> ```javascript
> import { onBeforeRouteLeave } from 'vue-router';
> ```


---

## 7. Related Terms
- [Vue Router](../level_06/vue_router.md) — The parent library.
- [Component Lifecycle](../level_04/component_lifecycle.md) — Navigation Guards happen *before* the component lifecycle even begins.
- [Route Params, Query & Meta](../level_06/route_params_query_meta.md) — Custom properties read by guards to manage access levels.

---

## 8. Key Takeaways
- **Navigation Guards** intercept route transitions before they occur.
- **`router.beforeEach`** is a Global Guard used primarily for checking Authentication and Authorization.
- To block a navigation, return `false`. To redirect, return a new path string (like `'/login'`).
- Use **Route Meta fields** (`meta: { requiresAuth: true }`) to cleanly flag which routes need protection.
- Be extremely careful to avoid Infinite Redirect Loops by allowing access to the login/redirect page.
