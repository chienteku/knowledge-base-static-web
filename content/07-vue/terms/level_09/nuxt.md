# Nuxt.js

> **Level 9 — Server-Side Rendering (SSR) & Nuxt**
> A powerful, higher-level meta-framework built on top of Vue.js. It provides an out-of-the-box, production-ready architecture for building Server-Side Rendered (SSR) or Static Site Generated (SSG) Vue applications.

---

## 1. Prerequisites
- [Server-Side Rendering](../level_09/ssr.md) — The primary architecture Nuxt simplifies.
- [Vue Router](../level_06/vue_router.md) — Nuxt completely automates this.

---

## 2. Term Category
- **Vue Ecosystem / Meta-Framework**

---

## 3. Environment Context
- **Universal (Node.js Server + Browser)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Setting up Server-Side Rendering manually with Vue is incredibly difficult. You have to configure a Node/Express server, write complex Webpack/Vite configurations to bundle the app twice (once for the server, once for the client), and carefully handle state hydration.
**Nuxt.js** (similar to Next.js in the React ecosystem) solves this. It is a framework *for* the Vue framework. You run `npx nuxi init`, and you instantly have a fully configured SSR application. Nuxt handles the server, the hydration, the routing, and the build process automatically.

### (2) Auto-Imports & File-Based Routing
Nuxt enforces a highly opinionated folder structure that eliminates boilerplate code:
- **File-Based Routing:** You don't write a `router.js` file anymore. If you create a file at `pages/about.vue`, Nuxt automatically generates a `/about` route for you!
- **Auto-Imports:** You don't need to `import { ref, computed } from 'vue'` anymore. Nuxt automatically imports all Vue APIs, your internal components, and your Composables globally!

### (3) Rendering Modes
Nuxt allows you to choose how your app is delivered:
- **SSR (Server-Side Rendering):** The Node server generates HTML on the fly for every single request. Great for dynamic data.
- **SSG (Static Site Generation):** Nuxt generates all the HTML files *once* at build time. You deploy these static HTML files to a cheap CDN. Perfect for Blogs and Documentation sites where the data rarely changes.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Ignoring the `useFetch` composable

**The mistake:** A developer is building a Nuxt SSR app. They use standard `fetch()` or `axios` inside a component's `<script setup>` to get data from an API.

**Why it's wrong:** The component runs on the Server. It fetches the data. Then the component hydrates on the Client. It fetches the data *again*! The user sees the UI flash, and you hit your API twice per page load.
**Golden Rule:** In Nuxt, you MUST use Nuxt's built-in `useFetch` or `useAsyncData` composables. These special functions fetch the data on the Server, and then cleverly bundle the JSON data into the HTML payload so the Client doesn't have to fetch it a second time during hydration!

---

### Mistake 2: Using Standard `fetch()` Instead of Nuxt `useFetch()` or `useAsyncData()` in SSR Pages

**The mistake:** Calling `onMounted(async () => { data.value = await fetch('/api/user'); })` inside a Nuxt page component.

**Why it's wrong:** Using standard `fetch()` inside `onMounted` fetches data ONLY on the client after hydration, forfeiting SSR SEO benefits and causing layout shift. Use Nuxt's SSR-aware `useFetch()`.

*Incorrect:*
```javascript
// Nuxt page component
onMounted(async () => {
  data.value = await fetch('/api/items'); // ❌ Misses server-side data fetching!
});
```

*Fix:*
```javascript
// Nuxt SSR-aware data fetching composable:
const { data, error } = await useFetch('/api/items');
```

---

### Mistake 3: Manually Importing Auto-Imported Nuxt Composables (`useRoute`, `ref`, `useFetch`)

**The mistake:** Writing `import { ref } from 'vue'` or `import { useRoute } from 'vue-router'` inside Nuxt 3 SFCs.

**Why it's wrong:** Nuxt 3 automatically imports Vue APIs, Vue Router composables, and Nuxt helper functions. Manual imports add redundant boilerplate.

*Incorrect:*
```vue
<script setup>
import { ref } from 'vue'; // ❌ Redundant manual import in Nuxt 3!
import { useRoute } from 'vue-router';
</script>
```

*Fix:*
```vue
<script setup>
// Nuxt 3 auto-imports ref, useRoute, useFetch, and composables automatically!
const route = useRoute();
const count = ref(0);
</script>
```


---

## 6. Practice Exercises

### Exercise 1: SEO Benefits

**Problem:** You are building an e-commerce website for shoes. Why is Nuxt better than a standard `create-vue` Vite application for this specific project?

**Expected output:**
> [!check]- Answer
> ```text
> Because an e-commerce site relies entirely on SEO (Search Engine Optimization). 
> A standard Vue app (CSR) sends a blank HTML file, meaning Google bots might not index your shoes. 
> Nuxt provides SSR out of the box, meaning the server sends fully populated HTML files with shoe names, prices, and images baked in. Google easily indexes this, driving traffic to the store.
> ```
> - Review the benefits of SSR vs CSR.

---

### Exercise 2: Nuxt File-Based Routing Structure

**Problem:** Map Nuxt 3 file path in `pages/` directory to its corresponding URL route:
1. `pages/index.vue` 
2. `pages/about.vue` 
3. `pages/users/[id].vue` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. /
> 2. /about
> 3. /users/:id
> ```
> - `pages/index.vue` -> `/`
> - `pages/about.vue` -> `/about`
> - `pages/users/[id].vue` -> `/users/:id`
> 
> ```text
> Nuxt converts directory structure into Vue Router configuration.
> ```

---

### Exercise 3: useSeoMeta Composable

**Problem:** Write Nuxt 3 `useSeoMeta()` snippet configuring page `title` ('Dashboard') and `description` ('User analytics').

**Expected output:**
> [!check]- Answer
> ```javascript
> useSeoMeta({ title: 'Dashboard', description: 'User analytics' });
> ```
> - `useSeoMeta()` manages page meta tags in Nuxt 3.
> 
> ```javascript
> useSeoMeta({
>   title: 'Dashboard',
>   description: 'User analytics'
> });
> ```


---

## 7. Related Terms
- [Server-Side Rendering](../level_09/ssr.md) — What Nuxt provides out of the box.
- [Hydration](../level_09/hydration.md) — The process Nuxt manages between the server and client.
- [Static Site Generation (SSG)](../level_09/ssg.md) — The static build target option for Nuxt sites.

---

## 8. Key Takeaways
- **Nuxt.js** is a meta-framework built on top of Vue, equivalent to React's Next.js.
- It is the industry standard way to build SSR (Server-Side Rendered) or SSG (Static Site Generated) Vue applications.
- It provides amazing developer experience features like **File-Based Routing** and **Auto-Imports**.
- Use Nuxt when building public-facing, content-heavy websites that require perfect SEO and fast initial load times (e-commerce, blogs, landing pages).
- You must use Nuxt's special data-fetching composables (`useFetch`) to prevent double-fetching data on both the server and the client.
