# Vue Router

> **Level 6 — Routing (Vue Router)**
> The official routing library for Vue.js, used to build Single-Page Applications (SPAs) by mapping different URLs (like `/about`) to different Vue components without reloading the browser page.

---

## 1. Prerequisites
- [Components](../level_04/components.md) — What the Router is swapping in and out.
- [Vue Instance](../level_01/vue_instance.md) — Where the Router is registered as a plugin.

---

## 2. Term Category
- **Vue Ecosystem / Routing**

---

## 3. Environment Context
- **Client-Side (Browser History API)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a traditional website, clicking an `<a href="/about">` tag makes the browser delete the current HTML, send an HTTP request to the server, wait for the server to generate a new HTML page, and then paint that new page. This is slow and causes a visible white flash.
Vue apps are Single-Page Applications (SPAs). There is only one actual HTML file (`index.html`). 
**Vue Router** intercepts your clicks. Instead of fetching a new HTML page from the server, it instantly unmounts the `<Home>` component and mounts the `<About>` component. It updates the URL in the address bar using the browser's History API, so the user *feels* like they navigated to a new page, but it all happens instantly in JavaScript.

### (2) The Configuration
You define an array of "Routes". Each route is a mapping between a string (the URL path) and a Component.

```javascript
// router.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from './Home.vue'
import About from './About.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About }
]

const router = createRouter({
  history: createWebHistory(), // Uses the HTML5 History API
  routes
})

export default router
```

### (3) Registering the Plugin
Vue Router is a "Plugin". You must attach it to the Vue application instance before mounting.
```javascript
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router) // Attach the router!
app.mount('#app')
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting Server Fallback Configuration

**The mistake:** A developer builds a beautiful SPA, deploys it to a standard Nginx or Apache server, and goes to `mysite.com/about`. The server returns a 404 Error!

**Why it's wrong:** The server receives a request for `/about/index.html`. That file literally does not exist (remember, it's a Single-Page App; there is only `/index.html`). 
**Golden Rule:** When using Vue Router with `createWebHistory()`, you MUST configure your production web server to redirect all 404 requests back to `index.html`. Vue Router will then take over and load the correct component.

---

### Mistake 2: Using `createWebHistory()` in Production Without Configuring Server Fallback Rewrites (404 Error)

**The mistake:** Deploying a Vue app using `createWebHistory()` to Nginx/Apache without configuring fallback rewrites to `index.html`.

**Why it's wrong:** HTML5 history mode relies on client-side routing. Direct page refreshes to `/users/5` cause server 404 errors unless Nginx is configured to rewrite all un-matched URLs to `index.html`.

*Incorrect:*
```vue
/* Deploying createWebHistory() app to static server without rewrite rule -> Direct URL refresh causes 404! */
```

*Fix:*
```vue
/* Nginx configuration fallback rewrite rule: try_files $uri $uri/ /index.html; */
```

---

### Mistake 3: Confusing `createWebHistory()` with `createWebHashHistory()`

**The mistake:** Using `createWebHashHistory()` for public consumer SEO-sensitive web applications.

**Why it's wrong:** Hash history mode includes `#` in URLs (`example.com/#/about`). Hash URLs look un-professional and harm SEO indexing. Use `createWebHistory()` for clean SEO URLs.

*Incorrect:*
```vue
const router = createRouter({
  history: createWebHashHistory(), // ❌ Produces URLs with hash symbols (/#/about)!
  routes
});
```

*Fix:*
```vue
const router = createRouter({
  history: createWebHistory(), // Clean HTML5 URLs (/about)
  routes
});
```


---

## 6. Practice Exercises

### Exercise 1: Web History vs Hash History

**Problem:** You see older Vue code that uses `createWebHashHistory()`. The URLs look like this: `mysite.com/#/about`. Why did they use the `#` symbol?

**Expected output:**
> [!check]- Answer
> ```text
> The `#` (Hash) symbol is a trick. Everything after the `#` in a URL is never sent to the server. It is purely handled by the browser. 
> Using Hash History meant developers didn't have to configure their web servers to handle 404 fallbacks.
> However, Hash URLs are terrible for SEO. Today, `createWebHistory()` is the strict standard.
> ```
> - Think about how servers interpret the `#` symbol in URLs.

---

### Exercise 2: Vue Router Instance Setup Pattern

**Problem:** Write JS snippet creating a Vue Router 4 instance with `createWebHistory()`, 2 routes (`/` -> `Home`, `/about` -> `About`), exported for app plugin installation.

**Expected output:**
> [!check]- Answer
> ```javascript
> import { createRouter, createWebHistory } from 'vue-router'; const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: Home }, { path: '/about', component: About }] }); export default router;
> ```
> - `createRouter()` configures routing instance.
> - `createWebHistory()` enables HTML5 history mode.
> 
> ```javascript
> import { createRouter, createWebHistory } from 'vue-router';
> import Home from './Home.vue';
> import About from './About.vue';
> 
> const router = createRouter({
>   history: createWebHistory(),
>   routes: [
>     { path: '/', component: Home },
>     { path: '/about', component: About }
>   ]
> });
> 
> export default router;
> ```

---

### Exercise 3: Lazy-Loading Route Components

**Problem:** Write dynamic `import()` route component loading definition for path `/dashboard`.

**Expected output:**
> [!check]- Answer
> ```text
> { path: '/dashboard', component: () => import('./Dashboard.vue') }
> ```
> - Dynamic `import()` splits route code into separate async JS chunks.
> 
> ```javascript
> { path: '/dashboard', component: () => import('./Dashboard.vue') }
> ```


---

## 7. Related Terms
- [Router View / Router Link](../level_06/router_view_link.md) — The HTML tags used to interact with the Router.
- [Dynamic Routing](../level_06/dynamic_routing.md) — Passing variables in the URL.
- [Programmatic Navigation (`useRouter` / `useRoute`)](../level_06/programmatic_navigation.md) — Navigating inside component scripts.

---

## 8. Key Takeaways
- **Vue Router** is the official tool for building Single-Page Applications in Vue.
- It maps URL paths (like `/contact`) to Vue Components.
- It intercepts navigation, swapping components instantly without a full page reload.
- You must configure your production web server to route all traffic to `index.html` to prevent 404 errors when a user refreshes the page on a deep URL.
