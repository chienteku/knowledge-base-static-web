# Single Page Application (SPA) Mode

> **Level 9 — Advanced Rendering & Architecture**
> A rendering architecture where the server sends an empty HTML file to the browser, and the browser uses JavaScript to download, render, and manage the entire application interface.

---

## 1. Prerequisites
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The default rendering mode in Nuxt, which is the exact opposite of an SPA.
- [Hydration](../level_01/hydration.md) — The client-side bootstrapping process.

---

## 2. Term Category
- **Rendering Strategies**

---

## 3. Environment Context
- **Client Only**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Nuxt uses Universal Rendering (SSR) by default because it is excellent for SEO and initial page load speed. However, SSR is expensive. The server must compute the Vue components for every single incoming request. 

If you are building an internal company dashboard behind a login screen, SEO does not matter at all. The content is private. In this scenario, running an expensive Node.js server to SSR the page is a waste of money and compute power.

Nuxt allows you to turn off SSR and revert entirely to a **Single Page Application (SPA)**. 

### (2) How it Works
In SPA mode, Nuxt builds your application into a completely static set of files: `index.html`, `app.js`, and `app.css`.

The `index.html` file contains almost nothing:
```html
<body>
  <div id="__nuxt"></div>
  <script src="/_nuxt/app.js"></script>
</body>
```

When the browser loads this file, the JavaScript executes, Vue initializes, fetches data from the API, and manually injects the UI into the `<div id="__nuxt">`. All navigation thereafter happens instantly in the browser without requesting new HTML files from the server.

### (3) Enabling SPA Mode
You can disable SSR globally in your `nuxt.config.ts`.
Once disabled, your app requires zero Node.js server power. You can host it for free on an AWS S3 Bucket, GitHub Pages, or any static file host.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false // Welcome to SPA mode!
})
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting good SEO in an SPA
**The mistake:** Disabling SSR because "it makes deployment easier", and then wondering why Google isn't indexing your blog posts.

**Why it's wrong:** Google's web crawlers strongly prefer fully-formed HTML. While Googlebot *can* execute some JavaScript to render an SPA, it is heavily delayed and unreliable. Other crawlers (like Twitter or Facebook link previews) absolutely will not execute your JavaScript.
**Golden Rule:** If the page must be discoverable on Google or shared nicely on social media, you MUST NOT use SPA mode. Use SSR or SSG instead.

---

### Mistake 2: Expecting SPA Mode (`ssr: false`) Pages to Render HTML for Search Engine Crawlers

**The mistake:** Configuring `ssr: false` on public marketing landing pages.

**Why it's wrong:** SPA mode serves an empty `<div id="__nuxt"></div>` HTML shell initially. Search engine crawlers receive empty HTML, severely damaging SEO rankings.

*Incorrect:*
```vue
export default defineNuxtConfig({ ssr: false }); // ❌ Empty initial HTML shell for all pages!
```

*Fix:*
```vue
export default defineNuxtConfig({ ssr: true }); // Universal SSR for public pages
```

---

### Mistake 3: Calling Node.js Core Modules in Client SPA Mode

**The mistake:** Importing `fs` or `net` in a SPA mode application.

**Why it's wrong:** SPA mode executes ENTIRELY inside the browser client environment. Node.js server modules do NOT exist in the browser runtime.

*Incorrect:*
```vue
/* Importing Node.js fs module in SPA mode application */
```

*Fix:*
```vue
/* Use Web standard APIs or fetch data from backend Nitro API routes */
```


---

### Mistake 4: Expecting SPA Mode (`ssr: false`) Pages to Render HTML for Search Engine Crawlers

**The mistake:** Configuring `ssr: false` on public marketing landing pages.

**Why it's wrong:** SPA mode serves an empty `<div id="__nuxt"></div>` HTML shell initially. Search engine crawlers receive empty HTML, severely damaging SEO rankings.

*Incorrect:*
```vue
export default defineNuxtConfig({ ssr: false }); // ❌ Empty initial HTML shell for all pages!
```

*Fix:*
```vue
export default defineNuxtConfig({ ssr: true }); // Universal SSR for public pages
```

---

### Mistake 5: Calling Node.js Core Modules in Client SPA Mode

**The mistake:** Importing `fs` or `net` in a SPA mode application.

**Why it's wrong:** SPA mode executes ENTIRELY inside the browser client environment. Node.js server modules do NOT exist in the browser runtime.

*Incorrect:*
```vue
/* Importing Node.js fs module in SPA mode application */
```

*Fix:*
```vue
/* Use Web standard APIs or fetch data from backend Nitro API routes */
```


---

### Mistake 6: Expecting SPA Mode (`ssr: false`) Pages to Render HTML for Search Engine Crawlers

**The mistake:** Configuring `ssr: false` on public marketing landing pages.

**Why it's wrong:** SPA mode serves an empty `<div id="__nuxt"></div>` HTML shell initially. Search engine crawlers receive empty HTML, severely damaging SEO rankings.

*Incorrect:*
```vue
export default defineNuxtConfig({ ssr: false }); // ❌ Empty initial HTML shell for all pages!
```

*Fix:*
```vue
export default defineNuxtConfig({ ssr: true }); // Universal SSR for public pages
```

---

### Mistake 7: Calling Node.js Core Modules in Client SPA Mode

**The mistake:** Importing `fs` or `net` in a SPA mode application.

**Why it's wrong:** SPA mode executes ENTIRELY inside the browser client environment. Node.js server modules do NOT exist in the browser runtime.

*Incorrect:*
```vue
/* Importing Node.js fs module in SPA mode application */
```

*Fix:*
```vue
/* Use Web standard APIs or fetch data from backend Nitro API routes */
```


---

## 6. Practice Exercises

### Exercise 1: Identifying the Use Case

**Problem:** You are building a secure web application for a bank. Users must log in before seeing any content. The UI is highly interactive and relies heavily on browser APIs like `window.localStorage` and WebCrypto. Does this app benefit from SSR, or should you configure `{ ssr: false }`?

**Expected output:**
> [!check]- Answer
> ```text
> Configure { ssr: false } (SPA mode).
> Because the content is behind a login, SEO is irrelevant. Because it heavily relies on browser-only APIs, SSR will cause hydration errors. SPA is the perfect choice here.
> ```
> - Secure dashboards behind a login wall do not require search crawler discoverability but do require browser-only storage access.

---

### Exercise 2: SPA Mode Route Rule Configuration

**Problem:** Write `nuxt.config.ts` `routeRules` disabling SSR for `/admin/**` routes while keeping public pages SSR.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineNuxtConfig({
>   routeRules: {
>     '/admin/**': { ssr: false }
>   }
> });
> ```
> - Setting `ssr: false` in `routeRules` applies SPA mode to targeted sub-routes.
> 
> ```typescript
> export default defineNuxtConfig({
>   routeRules: {
>     '/admin/**': { ssr: false }
>   }
> });
> ```

---

### Exercise 3: SPA Fallback HTML File

**Problem:** Which static HTML fallback file is generated when building a Nuxt SPA application?

**Expected output:**
> [!check]- Answer
> ```text
> 200.html (or 404.html)
> ```
> - `200.html` serves as the entry point for SPA static hosts.
> 
> ```text
> dist/200.html
> ```


---

## 7. Related Terms
- [Route Rules Configuration](../level_08/route_rules.md) — How to enable SPA mode for only *specific* URLs instead of the whole app.
- [Static Site Generation (SSG)](ssg.md) — Another non-Node.js deployment strategy, but with perfect SEO.
- [Hybrid Rendering](hybrid_rendering.md) — Related concept: Hybrid Rendering.

---

## 8. Key Takeaways
- SPA mode disables Server-Side Rendering (`ssr: false`).
- The browser downloads an empty HTML file and renders the UI via JavaScript.
- SPA mode is incredibly cheap to host and requires no Node.js server.
- It is perfect for private dashboards and secure admin panels.
- It is terrible for SEO and social media sharing.
