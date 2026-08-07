# Vue Router

> **Level 6 — Routing (Vue Router)**
> The official routing library for Vue.js, used to build Single-Page Applications (SPAs) by mapping different URLs to different Vue components without reloading the browser page.

---

## 1. Prerequisites

- [Components](../level_04/components.md) — What the Router is swapping in and out.
- [Vue Instance](../level_01/vue_instance.md) — Where the Router is registered as a plugin.

---

## 2. Term Category

**Vue Ecosystem (Official Core Library / SPA Router)**: Vue Router is the official routing framework for Vue.js, designed specifically for building Single-Page Applications (SPAs). It synchronizes browser address bar URLs with active Vue component viewports, parsing path parameters, managing browser history modes (`HTML5 History` vs `Hash`), and orchestrating navigation middleware guards.

Unlike meta-frameworks (such as Nuxt) that use automatic file-system routing, standalone Vue Router is registered as a plugin on the primary Vue application instance (`app.use(router)`). While React relies on community packages like React Router, Vue Router is maintained directly by the core Vue team, ensuring 100% API alignment with Vue 3 Composition API composables (`useRouter`, `useRoute`), `<script setup>`, and Vite build tools.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional multi-page web applications, every URL change requires the browser to issue an HTTP GET request to a remote server. The server compiles an entire HTML document and sends it back across the wire, causing visible page flashes, lost form inputs, and heavy server rendering loads.

Single-Page Applications eliminate page reloads by downloading a single JavaScript bundle and rendering views dynamically on the client. However, without a dedicated routing library, SPAs lose fundamental web capabilities: bookmarkable URLs, browser Back/Forward button navigation, and deep linking. Vue Router solves this by acting as a client-side URL controller, mapping URL patterns to component trees while updating browser history using the HTML5 History API (`window.history.pushState`).

### (2) Reality Metaphor
Think of Vue Router like a Central Rail Switchyard Operator. In a traditional train network (multi-page app), every time a passenger wants to travel to a new city (a new URL), they must return to the central station, dismantle their train carriage, buy a new ticket, and board an entirely new locomotive from scratch. With Vue Router (client-side SPA router), the train locomotive (the running Vue app) remains active continuously. As the train moves, the switchyard operator flips track switches in real time, guiding the train onto different platform tracks (swapping view components in `<RouterView>`) without ever stopping the engine or asking passengers to disembark.

### (3) Vue Code Examples

#### Short Snippet
```javascript
// router/index.js - Standard Vue Router 4 initialization
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/about', name: 'about', component: () => import('../views/AboutView.vue') }
  ]
})

export default router
```

```javascript
// main.js - Registering Vue Router plugin on App instance
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router) // Install Vue Router plugin globally
app.mount('#app')
```

#### Fuller Example
```javascript
// router/index.js - Production Vue Router configuration with scrollBehavior and Guards
import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'

const router = createRouter({
  // Use HTML5 History mode for clean URLs (/dashboard instead of /#/dashboard)
  history: createWebHistory(),
  
  // Custom scroll restoration behavior on navigation
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition // Restore scroll position on Back/Forward button clicks
    } else if (to.hash) {
      return { el: to.hash, behavior: 'smooth' } // Smooth scroll to anchor links
    } else {
      return { top: 0 } // Scroll to top of page on new route transitions
    }
  },

  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/analytics',
      name: 'analytics',
      // Lazy-loaded route chunk for code-splitting performance
      component: () => import('../views/AnalyticsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFound.vue')
    }
  ]
})

// Global authentication navigation guard
router.beforeEach((to, from) => {
  const isAuthenticated = Boolean(localStorage.getItem('token'))
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }
})

export default router
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Missing Production Web Server Fallback Rewrite for HTML5 History Mode

**The mistake:** Deploying an app using `createWebHistory()` to production web servers (Nginx, Apache, S3) without configuring a fallback rewrite rule to `index.html`.

**Why it's wrong:** When users navigate directly to `/analytics` or refresh their browser, the web server looks for a physical file named `/analytics/index.html` on the server disk. Because SPAs contain only one physical `index.html` file at the root, the server returns a 404 Not Found error.

*Incorrect:*
```nginx
# ❌ Server looks for physical /analytics file on disk; returns 404 on refresh!
location / {
  root /var/www/html;
}
```

*Fix:* Configure production server fallback rewrites to `index.html`:
```nginx
# Nginx rewrite configuration for HTML5 History mode:
location / {
  try_files $uri $uri/ /index.html;
}
```

---

### Mistake 2: Using Legacy Hash History Mode in Production Web Applications

**The mistake:** Using `createWebHashHistory()` (`http://example.com/#/about`) for modern web applications.

**Why it's wrong:** Hash URLs (`/#/about`) look un-professional, break SEO crawling in legacy indexing tools, and cause issues when integrating third-party OAuth redirect callbacks.

*Incorrect:*
```javascript
// ❌ Produces hash URLs like example.com/#/about
const router = createRouter({
  history: createWebHashHistory()
});
```

*Fix:* Use `createWebHistory()` for clean HTML5 URLs:
```javascript
const router = createRouter({
  history: createWebHistory() // Produces clean URLs like example.com/about
});
```

---

### Mistake 3: Instantiating `createRouter()` inside Component Setup Functions

**The mistake:** Calling `createRouter()` inside component setup scripts or action methods instead of initializing a single global router instance in `main.js`.

**Why it's wrong:** `createRouter()` initializes global routing state and history event listeners. Calling it inside components creates multiple competing router instances, leading to memory leaks and broken navigation.

*Incorrect:*
```vue
<script setup>
// ❌ Creating multiple router instances inside component!
const router = createRouter({ history: createWebHistory(), routes: [] });
</script>
```

*Fix:* Export a single router instance from `router/index.js` and register it globally in `main.js` via `app.use(router)`.

---

## 5. Practice Exercises

### Exercise 1: Financial Banking Router Initialization

**Scenario:** Initialize a Vue Router 4 instance for a commercial banking SPA. Configure routes `/` (Dashboard), `/transfers` (Transfers), and `/statements` (Statements) with HTML5 history mode and global plugin registration.

**Requirements:**
1. Export router instance created via `createRouter()`.
2. Use `createWebHistory()`.
3. Register router with `app.use(router)`.
4. Include test assertions for route registration.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> // router.js
> import { createRouter, createWebHistory } from 'vue-router';
> 
> const routes = [
>   { path: '/', name: 'dashboard', component: { template: '<div>Dashboard View</div>' } },
>   { path: '/transfers', name: 'transfers', component: { template: '<div>Transfers View</div>' } },
>   { path: '/statements', name: 'statements', component: { template: '<div>Statements View</div>' } }
> ];
> 
> export const router = createRouter({
>   history: createWebHistory(),
>   routes
> });
> 
> // main.js simulation
> import { createApp } from 'vue';
> const app = createApp({ template: '<div id="app"><RouterView /></div>' });
> app.use(router);
> 
> console.assert(router.hasRoute('dashboard'), 'Dashboard route is registered');
> console.assert(router.hasRoute('transfers'), 'Transfers route is registered');
> ```
>
> #### Technical Explanation
> 1. **`createRouter()` Factory**: Factory function instantiates Vue Router 4 engine instances.
> 2. **`createWebHistory()`**: Enables clean, modern HTML5 History API URL path resolution without hash tags.
> 3. **`app.use(router)`**: Installs global `$router`, `$route`, `<RouterView>`, and `<RouterLink>` components onto the Vue app.
> 4. **Route Inspection**: `router.hasRoute()` verifies route registration in the internal route matcher dictionary.
> 
---

### Exercise 2: E-Commerce Code-Splitting & Scroll Behavior Config

**Scenario:** An e-commerce platform configures Vue Router with route code-splitting (lazy imports) and scroll behavior that restores scroll positions on Back button navigation while scrolling to top on new page links.

**Requirements:**
1. Use lazy imports `component: () => import('./View.vue')`.
2. Implement `scrollBehavior(to, from, savedPosition)` handling `savedPosition`.
3. Validate scroll restoration logic.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { createRouter, createWebHistory } from 'vue-router';
> 
> export const router = createRouter({
>   history: createWebHistory(),
>   scrollBehavior(to, from, savedPosition) {
>     if (savedPosition) {
>       return savedPosition; // Restores exact scroll coordinates when clicking Back
>     } else {
>       return { top: 0, left: 0 }; // Scrolls to top for new route transitions
>     }
>   },
>   routes: [
>     {
>       path: '/catalog',
>       name: 'catalog',
>       component: () => import('./views/CatalogView.vue') // Code-split route chunk
>     },
>     {
>       path: '/cart',
>       name: 'cart',
>       component: () => import('./views/CartView.vue') // Code-split route chunk
>     }
>   ]
> });
> ```
>
> #### Technical Explanation
> 1. **Lazy Loading Route Chunks**: Dynamic `import()` statements instruct Vite/Rollup to split views into separate JavaScript bundles.
> 2. **`scrollBehavior` Hook**: Manages window scroll coordinates during client-side route transitions.
> 3. **History Position Restoration**: `savedPosition` returns previous `{ top, left }` scroll offsets on browser Back/Forward navigation.
> 4. **Optimized Bundle Size**: Reduces initial JS payload by deferring secondary view downloads until requested.
> 
---

### Exercise 3: Healthcare Telehealth Router Catch-All 404 Route

**Scenario:** A telehealth application requires a catch-all 404 route matching invalid URLs (`/invalid-path`) using regex path matching.

**Requirements:**
1. Add catch-all route `{ path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView }`.
2. Demonstrate matching behavior for unregistered URLs.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { createRouter, createWebHistory } from 'vue-router';
> 
> const NotFoundView = { template: '<div>404: Page Not Found</div>' };
> 
> export const router = createRouter({
>   history: createWebHistory(),
>   routes: [
>     { path: '/', component: { template: '<div>Home</div>' } },
>     { path: '/patient', component: { template: '<div>Patient Portal</div>' } },
>     // Catch-all route using regex wildcard matching
>     { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView }
>   ]
> });
> ```
>
> #### Technical Explanation
> 1. **Regex Wildcard Matching**: `/:pathMatch(.*)*` matches any URL path that fails to match prior route definitions.
> 2. **Custom Parameter Capture**: `pathMatch` array captures split path segments for diagnostic reporting.
> 3. **Fallback View Rendering**: Safely renders user-friendly 404 templates without throwing unhandled routing exceptions.
> 4. **Catch-All Placement**: Wildcard routes should be evaluated alongside defined routes in the route matching dictionary.
> 
---

## 6. Related Terms

- [Router View / Router Link](router_view_link.md) — The HTML tags used to interact with the Router.
- [Dynamic Routing](dynamic_routing.md) — Passing variables in the URL.
- [Programmatic Navigation (`useRouter` / `useRoute`)](programmatic_navigation.md) — Navigating inside component scripts.
- [Navigation Guards](navigation_guards.md) — Related concept: Navigation Guards.
- [Nested Routes](nested_routes.md) — Related concept: Nested Routes.

---

## 7. Key Takeaways

- **Vue Router** is the official routing library for Vue.js, used to build Single-Page Applications (SPAs).
- Synchronizes browser URLs with active Vue components without triggering full page reloads.
- Registered as a plugin on the Vue application instance via **`app.use(router)`**.
- Use **`createWebHistory()`** for clean HTML5 URLs, ensuring production web servers configure fallback rewrites to `index.html`.
- Maintained directly by the core Vue team, offering seamless alignment with `<script setup>`, composables (`useRouter`), and Vite.
