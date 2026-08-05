# Server-Side Rendering (SSR)

> **Level 9 — Server-Side Rendering (SSR) & Nuxt**
> An architecture where Vue components are compiled into raw HTML strings on the backend Node.js server *before* being sent to the browser, ensuring the user downloads a fully formed, readable webpage immediately.

---

## 1. Prerequisites
- [Vue Instance](../level_01/vue_instance.md) — What is usually running in the browser, but is now running on the server.
- [Client-Side Rendering (CSR)](csr.md) — The default behavior that SSR is trying to fix.
---

## 2. Term Category
- **Architecture / Rendering Strategy**

---

## 3. Environment Context
- **Server-Side (Node.js)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a standard Vue Single-Page Application (SPA), the server sends a completely blank HTML file (`<div id="app"></div>`) and a massive JavaScript file. The user stares at a blank white screen until the JavaScript finishes downloading, parses, and Vue boots up to render the UI. 
This has two massive problems:
1. **Terrible SEO:** Search Engine bots (like Google) often don't execute JavaScript. They see a blank page and rank your site poorly.
2. **Slow Initial Load (LCP):** Users on slow 3G connections stare at a blank screen for 5 seconds waiting for the JS.

**Server-Side Rendering (SSR)** solves this. Instead of a blank file, a Node.js server runs your Vue app in memory, generates the final HTML (with all the text, images, and data already inside it), and sends *that* to the browser. 

### (2) How it works
1. **User Request:** The browser asks the server for `mysite.com/about`.
2. **Server Execution:** A Node.js server intercepts the request. It boots up the Vue app, navigates to the `/about` route, fetches data from the database, and renders the Vue components into a giant raw HTML string.
3. **Response:** The server sends this fully-formed HTML string to the browser.
4. **Instant View:** The browser paints the HTML instantly. The user sees the full page immediately. (The page is not interactive yet, but they can read it).
5. **[Hydration](../level_09/hydration.md):** The Vue JavaScript downloads in the background, attaches itself to the HTML, and makes the buttons clickable.

### (3) The Trade-offs
SSR is not magic. It requires a Node.js server to be running 24/7 (unlike an SPA which can be hosted for free on a static CDN). It also increases server CPU costs, as the server is doing the heavy lifting of rendering HTML for every single request.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `window` or `document` in `setup()`

**The mistake:** A developer writes `const width = window.innerWidth` directly inside their `<script setup>`. The code works fine locally. They deploy the SSR app, and the server instantly crashes with: `ReferenceError: window is not defined`.

**Why it's wrong:** In an SSR app, the `<script setup>` block runs *twice*. Once on the Server (Node.js) and once on the Client (Browser). Node.js does not have a screen, it does not have a DOM, and it does not have a `window` object!
**Golden Rule:** If you need to access Browser-only APIs (`window`, `document`, `localStorage`), you MUST place them inside the `onMounted` lifecycle hook. `onMounted` *only* runs in the browser, never on the server.

---

### Mistake 2: Creating Shared State Memory Leaks Across Concurrent User Requests in SSR

**The mistake:** Declaring global reactive state outside component setup functions in Node.js SSR server files.

**Why it's wrong:** In Node.js SSR, a single server process handles requests for thousands of users. Global state declared outside setup is SHARED across all user requests, leaking data across users.

*Incorrect:*
```javascript
// Global module scope in SSR Node.js server file
const globalUser = ref(null); // ❌ Shared state leak across user SSR requests!
```

*Fix:*
```javascript
// Always declare reactive state inside component setup or Pinia factory stores:
export function useUser() {
  return ref(null); // Fresh state created per SSR request
}
```

---

### Mistake 3: Accessing Browser Globals (`window`, `document`, `navigator`) in SSR Server Code

**The mistake:** Writing `const width = window.innerWidth` in top-level setup code of an SSR component.

**Why it's wrong:** Node.js server environments do NOT have `window`, `document`, or `navigator` global objects. Calling them at setup time throws a server crash: `ReferenceError: window is not defined`.

*Incorrect:*
```vue
<script setup>
const lang = navigator.language; // ❌ ReferenceError on Node.js SSR server!
</script>
```

*Fix:*
```vue
<script setup>
const lang = ref('en');
onMounted(() => {
  lang.value = navigator.language; // Access browser globals safely in onMounted
});
</script>
```


---

## 6. Practice Exercises

### Exercise 1: SPA vs SSR

**Problem:** You are building an internal admin dashboard for your company's employees. It requires a login to see anything. Do you need SSR?

**Expected output:**
> [!check]- Answer
> ```text
> Absolutely not. 
> SSR is primarily used for SEO (which an internal tool doesn't need) and Initial Load Speed (which employees on office Wi-Fi don't care about). 
> An internal dashboard should be a standard SPA. SSR would just add unnecessary complexity and server costs.
> ```
> - Does Google need to index an internal company dashboard?

---

### Exercise 2: Vue SSR Render Method

**Problem:** Which official package function converts a Vue application instance into an HTML string on a Node.js SSR server?

**Expected output:**
> [!check]- Answer
> ```javascript
> import { renderToString } from 'vue/server-renderer'; await renderToString(app);
> ```
> - `renderToString(app)` converts Vue components into HTML strings.
> 
> ```javascript
> import { renderToString } from 'vue/server-renderer';
> const html = await renderToString(app);
> ```

---

### Exercise 3: SSR Performance Metric (TTFB)

**Problem:** How does SSR improve TTFB (Time To First Byte) and FCP (First Contentful Paint) compared to CSR?

**Expected output:**
> [!check]- Answer
> ```text
> SSR returns pre-rendered HTML content directly in the initial HTTP response, allowing browsers to paint text/images immediately without waiting for JS bundle downloads.
> ```
> - Pre-rendered server HTML displays content immediately.
> 
> ```text
> Fast FCP because browser renders server HTML before JS bundle executes.
> ```


---

## 7. Related Terms
- [Client-Side Rendering (CSR)](csr.md) — The opposite rendering strategy.
- [Hydration (Vue)](hydration.md) — Step 5 of the SSR process.
- [Nuxt.js](nuxt.md) — The framework used to easily build SSR Vue apps.
- [Static Site Generation (SSG)](ssg.md) — Pre-rendering pages to static HTML at build time.
- [Universal Code (Isomorphic)](universal_code.md) — Related concept: Universal Code (Isomorphic).
---

## 8. Key Takeaways
- **SSR** renders Vue components into raw HTML strings on a Node.js server before sending them to the browser.
- It provides perfect SEO and incredibly fast perceived initial load times.
- It requires an active Node.js server, increasing hosting complexity and costs.
- Code that runs on the server cannot access Browser-specific APIs (like `window` or `localStorage`) during the initial setup phase.
