# Single Page Application (SPA) Mode

> **Level 9 — Advanced Rendering & Architecture**
> A rendering architecture where the server sends an empty HTML file to the browser, and the browser uses JavaScript to download, render, and manage the entire application interface.

---

## 1. Prerequisites
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The default rendering mode in Nuxt, which is the exact opposite of an SPA.
- [Hydration](../level_01/hydration.md) — The client-side bootstrapping process.

---

## 2. Term Category

**Rendering Strategy** (Single Page Application Rendering): SPA mode (`ssr: false`) disables server-side HTML generation, executing full view rendering and navigation inside the client browser.



---

## 3. Explanation

### Environment Context
- **Client Only**

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

## 4. Common Mistakes & Pitfalls

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


## 5. Practice Exercises

### Exercise 1: Disabling SSR Globally for Single Page Applications

**Scenario:**
Configure `nuxt.config.ts` to run the entire Nuxt 3 application as a pure SPA (`ssr: false`).

**Requirements:**
1. Set `ssr: false` in `nuxt.config.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   ssr: false // Disables Server-Side Rendering globally
> });
> ```
> 
> #### Technical Explanation
>
> 1. `ssr: false` disables server HTML rendering completely across all routes.
> 2. Server sends a minimal HTML wrapper file (`<div id="__nuxt"></div>`) containing script tags.
> 3. Vue application initializes, fetches data, and builds the DOM entirely in the user's browser client.
> 
---

### Exercise 2: Managing Client-Side Loading Skeletons in SPA Mode

**Scenario:**
Configure a custom SPA loading indicator in `nuxt.config.ts` displayed while JavaScript bundles download.

**Requirements:**
1. Set `spaLoadingTemplate` or custom SPA loader.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   ssr: false,
>   spaLoadingTemplate: "spa-loading-template.html"
> });
> ```
> 
> #### Technical Explanation
>
> 1. In SPA mode, users see a blank screen while initial JavaScript bundles download and execute.
> 2. `spaLoadingTemplate` renders an HTML/CSS loading spinner directly inside the initial HTML file.
> 3. Improves perceived loading speed for SPA mode applications.
> 
---

### Exercise 3: Trade-Off Analysis: SPA vs Universal SSR

**Scenario:**
Formulate an architectural decision matrix comparing SPA mode against Universal SSR.

**Requirements:**
1. Contrast SEO, server CPU cost, initial load speed, and browser requirements.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> SPA vs SSR Architecture Comparison:
> - SPA Mode (ssr: false): Zero server Node.js CPU rendering overhead, cheap static file hosting, poor SEO, slower initial content paint.
> - Universal SSR (ssr: true): Excellent SEO, fast initial content paint, higher server Node.js CPU & RAM costs.
> Recommendation: Use SPA mode for internal enterprise back-office tools; use SSR for public web applications.
> ```
> 
> #### Technical Explanation
>
> 1. SPA mode eliminates Node.js server rendering costs, allowing static CDN hosting.
> 2. Universal SSR is required for search engines and social media crawler indexing.
> 3. Core architectural selection choice.
> 
---


## 6. Related Terms
- [Route Rules Configuration](../level_08/route_rules.md) — How to enable SPA mode for only *specific* URLs instead of the whole app.
- [Static Site Generation (SSG)](ssg.md) — Another non-Node.js deployment strategy, but with perfect SEO.
- [Hybrid Rendering](hybrid_rendering.md) — Related concept: Hybrid Rendering.

---

## 7. Key Takeaways
- SPA mode disables Server-Side Rendering (`ssr: false`).
- The browser downloads an empty HTML file and renders the UI via JavaScript.
- SPA mode is incredibly cheap to host and requires no Node.js server.
- It is perfect for private dashboards and secure admin panels.
- It is terrible for SEO and social media sharing.
