# Navigation Guards

> **Level 6 — Routing (Vue Router)**
> Hooks provided by Vue Router to guard navigations either by redirecting them or canceling them before the target component is mounted.

---

## 1. Prerequisites

- [Vue Router](vue_router.md) — The library that provides these guards.

---

## 2. Term Category

**Vue Ecosystem (Routing Middleware / Access Control Pattern)**: Navigation Guards are lifecycle middleware hooks provided by Vue Router that intercept URL navigation transitions before, during, or after route resolution. They allow developers to enforce authentication, verify authorization permissions, pre-fetch critical data dependencies, or cancel illegal page transitions before target route components are mounted.

Unlike standard component lifecycle hooks (such as `onMounted`), navigation guards execute prior to component creation. In backend Node.js frameworks like Express, this architectural role is fulfilled by HTTP middleware (`app.use(authMiddleware)`). In React Router v6+, guard logic is typically placed inside route `loader` functions or custom wrapper components (`<ProtectedRoute>`). Vue Router supports three distinct guard tiers: Global guards (`router.beforeEach`), Per-Route guards (`beforeEnter`), and In-Component guards (`onBeforeRouteLeave`, `onBeforeRouteUpdate`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In Single-Page Applications, UI components are swapped in memory without full browser page reloads. If a user manually types a protected URL (like `/admin/billing`) into the address bar, the application must verify if the user is authenticated and authorized *before* downloading data or rendering administrative controls.

Without centralized navigation guards, every individual component would need to duplicate authentication checks in its setup script, leading to security vulnerabilities if a developer forgot to guard a newly added view. Navigation guards solve this by providing centralized middleware pipeline hooks that intercept all incoming route navigation attempts before component setup logic executes.

### (2) Reality Metaphor
Think of Navigation Guards like an Airport International Border Control Checkpoint. When a traveler (a navigation request) attempts to board a flight to a destination gate (target route), they must pass through border control *before* entering the boarding concourse (mounting the component). The border control officer inspects the passenger's passport and visa (route `meta.requiresAuth`). If valid, the officer stamps the passport and allows entry (`return true`). If the visa is missing or expired, the officer redirects the passenger to the immigration desk (`return '/login'`) or denies access entirely (`return false`).

### (3) Vue Code Examples

#### Short Snippet
```javascript
// router.js - Global beforeEach authentication guard
router.beforeEach((to, from) => {
  const isAuthenticated = Boolean(localStorage.getItem('authToken'))
  
  // Guard protected routes using route meta fields
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Redirect unauthenticated users to login page
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})
```

#### Fuller Example
```javascript
// router.js - Multi-Tiered Access Control System
import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './views/Dashboard.vue'
import AdminConsole from './views/AdminConsole.vue'
import Login from './views/Login.vue'
import Forbidden from './views/Forbidden.vue'

const routes = [
  { path: '/login', component: Login },
  { path: '/403', component: Forbidden },
  { 
    path: '/dashboard', 
    component: Dashboard,
    meta: { requiresAuth: true } 
  },
  { 
    path: '/admin', 
    component: AdminConsole,
    meta: { requiresAuth: true, requiredRole: 'ADMIN' },
    // Per-Route Guard: Executes specifically for /admin route
    beforeEnter: (to, from) => {
      console.log('Executing per-route guard for /admin')
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Global Navigation Guard
router.beforeEach(async (to, from) => {
  const userToken = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole') // e.g. 'USER' | 'ADMIN'

  // 1. Check if destination route requires authentication
  if (to.meta.requiresAuth && !userToken) {
    // Cancel navigation and redirect to login
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // 2. Check role authorization
  if (to.meta.requiredRole && userRole !== to.meta.requiredRole) {
    // Redirect to 403 Forbidden page
    return '/403'
  }

  // Return true or undefined to proceed with navigation
  return true
})

export default router
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Infinite Redirect Loops in `beforeEach` Guards

**The mistake:** Redirecting unauthenticated users to `/login` without excluding the `/login` route itself from the redirect condition.

**Why it's wrong:** If a user navigates to `/login`, the guard executes, sees that the user is unauthenticated, and returns `return '/login'`. This triggers a *new* navigation to `/login`, re-executing the guard infinitely until the browser throws a maximum call stack error.

*Incorrect:*
```javascript
router.beforeEach((to, from) => {
  if (!isAuthenticated) {
    return '/login'; // ❌ Infinite redirect loop when already on /login!
  }
});
```

*Fix:* Check if `to.path !== '/login'` before performing redirects:
```javascript
router.beforeEach((to, from) => {
  if (to.meta.requiresAuth && !isAuthenticated && to.path !== '/login') {
    return '/login';
  }
});
```

---

### Mistake 2: Mixing Vue Router 4 Return Values with Legacy Vue Router 3 `next()` Callbacks

**The mistake:** Calling legacy `next('/login')` alongside Vue Router 4 return statements (`return '/login'`).

**Why it's wrong:** In Vue Router 4, guards should use standard JavaScript `return` statements (`return false`, `return '/login'`). Calling `next()` multiple times or mixing returns with `next()` causes duplicate navigation warnings and unexpected routing behavior.

*Incorrect:*
```javascript
// ❌ Dual invocation anti-pattern in Vue Router 4:
router.beforeEach((to, from, next) => {
  if (!auth) {
    next('/login');
    return '/login';
  }
  next();
});
```

*Fix:* Omit `next` parameter and rely entirely on `return` values:
```javascript
router.beforeEach((to, from) => {
  if (!auth) {
    return '/login'; // Return route path or descriptor directly
  }
  return true;
});
```

---

### Mistake 3: Unhandled Async Exceptions inside Navigation Guards

**The mistake:** Performing async token validation API calls inside `router.beforeEach` without wrapping promises in `try/catch` blocks.

**Why it's wrong:** If an async API call inside a guard throws a network error or rejects, Vue Router aborts navigation silently without rendering error states.

*Incorrect:*
```javascript
router.beforeEach(async (to) => {
  const user = await api.validateToken(); // ❌ Rejection breaks navigation silently!
  if (!user) return '/login';
});
```

*Fix:* Wrap async operations in `try/catch` blocks:
```javascript
router.beforeEach(async (to) => {
  try {
    const user = await api.validateToken();
    if (!user) return '/login';
  } catch (err) {
    console.error('Auth verification failed:', err);
    return '/login';
  }
});
```

---

## 5. Practice Exercises

### Exercise 1: Commercial Banking Fraud Protection Guard

**Scenario:** A commercial banking application guards financial transfer routes (`/transfer`). If the transaction amount exceeds $10,000, the user must have completed 2FA verification stored in session state.

**Requirements:**
1. Global `beforeEach` inspects `to.meta.requires2FA`.
2. Check `sessionStorage.getItem('is2FAVerified') === 'true'`.
3. Redirect unverified users to `/verify-2fa` with return query parameters.
4. Include test assertions validating redirect paths.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { createRouter, createWebHistory } from 'vue-router';
> 
> export const router = createRouter({
>   history: createWebHistory(),
>   routes: [
>     { path: '/login', component: { template: '<div>Login</div>' } },
>     { path: '/verify-2fa', component: { template: '<div>2FA</div>' } },
>     { 
>       path: '/transfer', 
>       component: { template: '<div>Transfer</div>' },
>       meta: { requiresAuth: true, requires2FA: true } 
>     }
>   ]
> });
> 
> router.beforeEach((to, from) => {
>   const isAuth = sessionStorage.getItem('isAuth') === 'true';
>   const is2FA = sessionStorage.getItem('is2FAVerified') === 'true';
> 
>   if (to.meta.requiresAuth && !isAuth) {
>     return { path: '/login', query: { redirect: to.fullPath } };
>   }
> 
>   if (to.meta.requires2FA && !is2FA) {
>     return { path: '/verify-2fa', query: { redirect: to.fullPath } };
>   }
> 
>   return true;
> });
> 
> // Test Verification
> sessionStorage.setItem('isAuth', 'true');
> sessionStorage.setItem('is2FAVerified', 'false');
> const guardResult = router.beforeEach;
> console.assert(typeof guardResult === 'function', 'Guard is registered');
> ```
>
> #### Technical Explanation
> 1. **Route Meta Inspection**: `to.meta.requires2FA` dynamically flags routes requiring multi-factor authentication.
> 2. **Session Verification**: Inspects `sessionStorage` keys before permitting navigation to `/transfer`.
> 3. **Query Preservation**: Passes `query: { redirect: to.fullPath }` so users return to their original target page after completing 2FA.
> 4. **Early Termination**: Returning path descriptors short-circuits route execution cleanly.
> 
---

### Exercise 2: Healthcare EHR In-Component Unsaved Form Guard

**Scenario:** An Electronic Health Record system uses in-component guard `onBeforeRouteLeave` inside `<script setup>` to prevent nurses from accidentally navigating away from unsaved patient charts.

**Requirements:**
1. Maintain reactive boolean `isDirty`.
2. Register `onBeforeRouteLeave((to, from) => ...)` hook.
3. Prompt `window.confirm()` if `isDirty` is true.
4. Return `false` to block navigation when user cancels.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- PatientChart.vue -->
> <script setup>
> import { ref } from 'vue';
> import { onBeforeRouteLeave } from 'vue-router';
> 
> const chartData = ref('');
> const isDirty = ref(false);
> 
> function handleInput() {
>   isDirty.value = true;
> }
> 
> function saveChart() {
>   isDirty.value = false;
>   alert('Chart saved successfully!');
> }
> 
> onBeforeRouteLeave((to, from) => {
>   if (isDirty.value) {
>     const confirmLeave = window.confirm('Unsaved patient medical chart data will be lost. Leave anyway?');
>     if (!confirmLeave) {
>       return false; // Cancel navigation transition
>     }
>   }
>   return true; // Allow navigation transition
> });
> </script>
> 
> <template>
>   <div class="chart-editor">
>     <h2>Patient Medical Chart</h2>
>     <textarea v-model="chartData" @input="handleInput" placeholder="Record symptoms..."></textarea>
>     <button @click="saveChart">Save Chart</button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **In-Component Navigation Hook**: `onBeforeRouteLeave` executes specifically when navigating away from `PatientChart.vue`.
> 2. **Navigation Blocking**: Returning `false` prevents Vue Router from modifying the browser history URL.
> 3. **Form Safety**: Protects medical personnel against accidental data loss.
> 4. **Composition API Setup**: `onBeforeRouteLeave` registers directly within `<script setup>`.
> 
---

### Exercise 3: E-Commerce Administrative Role-Based Per-Route Guard

**Scenario:** An e-commerce platform protects `/admin/inventory` using a per-route `beforeEnter` guard defined directly inside the route record configuration.

**Requirements:**
1. Route record includes `beforeEnter: (to, from) => ...`.
2. Read user role from Pinia auth store or `localStorage`.
3. Redirect unauthorized non-admin users to `/unauthorized`.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { createRouter, createWebHistory } from 'vue-router';
> 
> function getActiveRole() {
>   return localStorage.getItem('userRole') || 'GUEST';
> }
> 
> const routes = [
>   { path: '/unauthorized', component: { template: '<div>403 Unauthorized</div>' } },
>   {
>     path: '/admin/inventory',
>     component: { template: '<div>Inventory Management</div>' },
>     // Per-route guard attached directly to route definition:
>     beforeEnter: (to, from) => {
>       const role = getActiveRole();
>       if (role !== 'ADMIN') {
>         return '/unauthorized'; // Redirect unauthorized users
>       }
>       return true;
>     }
>   }
> ];
> 
> export const router = createRouter({
>   history: createWebHistory(),
>   routes
> });
> ```
>
> #### Technical Explanation
> 1. **Per-Route Encapsulation**: `beforeEnter` isolates role validation logic directly onto the `/admin/inventory` route definition.
> 2. **Selective Execution**: Runs only when entering `/admin/inventory`, avoiding unnecessary execution during general site navigation.
> 3. **Role Inspection**: Evaluates active user roles prior to loading administrative asset bundles.
> 4. **Clean Redirection**: Returns target route path string `/unauthorized` to redirect cleanly.
> 
---

## 6. Related Terms

- [Vue Router](vue_router.md) — The parent library.
- [Component Lifecycle](../level_04/component_lifecycle.md) — Navigation Guards happen *before* the component lifecycle even begins.
- [Route Params, Query & Meta](route_params_query_meta.md) — Custom properties read by guards to manage access levels.
- [Programmatic Navigation (`useRouter` / `useRoute`)](programmatic_navigation.md) — Related concept: Programmatic Navigation (`useRouter` / `useRoute`).

---

## 7. Key Takeaways

- **Navigation Guards** are middleware hooks that intercept, validate, redirect, or cancel URL route transitions.
- Evaluated **before** target route components are instantiated or mounted into the Virtual DOM.
- Three primary guard types: **Global** (`router.beforeEach`), **Per-Route** (`beforeEnter`), and **In-Component** (`onBeforeRouteLeave`).
- Return **`false`** to cancel navigation, or a **route path string** (`return '/login'`) to redirect cleanly.
- In Vue Router 4, rely on **`return`** values and avoid mixing legacy `next()` callbacks.
