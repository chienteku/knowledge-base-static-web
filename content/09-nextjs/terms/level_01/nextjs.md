# Next.js Overview

> **Level 1 — Core Concepts & Architecture**
> The industry standard React framework created by Vercel that transforms React from a simple UI library into a powerful, full-stack, edge-native web platform.

---

## 1. Prerequisites
- [Node.js Runtime](nodejs_runtime.md) — The runtime environment that powers the backend of Next.js.

---

## 2. Term Category

**Framework Architecture** (Next.js Platform Overview): Next.js is a full-stack React framework providing hybrid rendering, file-based routing, server components, and edge deployment capabilities.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
React is brilliant at rendering UI, but out of the box, it is just a Client-Side Rendering (CSR) library. When you build a pure React app (like with Create React App or Vite), the server sends an empty HTML file to the browser, and the browser must download massive JS files to construct the page. This is terrible for SEO, initial load times, and low-end devices.
Furthermore, React does not have a built-in router, backend API system, or image optimizer. 
**Next.js** was designed to solve all of this. It wraps React with a full-stack architecture, enabling Server-Side Rendering (SSR), Static Site Generation (SSG), file-system routing, and seamless backend API integration out of the box.

### (2) The Full-Stack React Framework
When you use Next.js, you are writing code that runs in two completely different environments seamlessly:
1. **The Server (Node.js/Edge):** Next.js runs your React components on the server *first*, sending fully formed HTML to the browser. It also allows you to securely access databases directly within your React components!
2. **The Client (Browser):** Once the HTML is loaded, standard React takes over the page (a process called Hydration) to make it interactive.

### (3) The Modern App Router Era
In version 13, Next.js completely rewrote its architecture, introducing the **App Router** (`app/` directory). This shift fully embraced React Server Components (RSC), allowing developers to build massive applications with significantly less client-side JavaScript. This curriculum focuses entirely on this modern architecture.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Treating Next.js like a traditional SPA

**The mistake:** A developer builds a Next.js app but puts everything in one massive component, relies heavily on `useEffect` for data fetching, and treats the server solely as a static file host.

**Why it's wrong:** You are paying the mental overhead of Next.js without reaping any of the benefits! Next.js is designed to fetch data on the *server*, not the client. If you rely entirely on `useEffect` to fetch data after the page loads, you are just building a slow Single Page Application (SPA).
**Golden Rule:** In modern Next.js, always attempt to fetch your data on the Server first.

---

### Mistake 2: Building Custom Express/Node Backends When Next.js Built-In App Router Is Available

**The mistake:** Setting up a separate Express.js server for simple API endpoints in a Next.js application.

**Why it's wrong:** Next.js provides built-in Route Handlers (`app/api/.../route.ts`), Server Components, and Server Actions out of the box, eliminating the need for a separate backend server.

*Incorrect:*
```tsx
/* Setting up an external Express server for basic CRUD endpoints */
```

*Fix:*
```tsx
/* Use Next.js Route Handlers (route.ts) and Server Actions directly in the app directory */
```

---

### Mistake 3: Disabling Image Optimization by Using Plain `<img>` Tags

**The mistake:** Using `<img src="/hero.png">` for large hero images across a Next.js app.

**Why it's wrong:** Plain `<img>` tags load un-optimized, full-size images without WebP conversion or layout shift protection. Always use Next.js `<Image />` (`next/image`).

*Incorrect:*
```tsx
<img src="/large-hero.jpg"> <!-- ❌ Un-optimized image, causes layout shift! -->
```

*Fix:*
```tsx
import Image from 'next/image';
<Image src="/large-hero.jpg" alt="Hero" width={800} height={600} priority />
```


---

## 5. Practice Exercises

### Exercise 1: Configuring Master Next.js Options in `next.config.js`

**Scenario:**
Configure strict React mode, custom redirects, and experimental options in `next.config.js`.

**Requirements:**
1. Export configuration object in `next.config.js`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> /** @type {import('next').NextConfig} */
> const nextConfig = {
>   reactStrictMode: true,
>   async redirects() {
>     return [
>       {
>         source: "/old-blog/:slug",
>         destination: "/blog/:slug",
>         permanent: true
>       }
>     ];
>   }
> };

module.exports = nextConfig;
```

> #### Technical Explanation
>
> 1. `next.config.js` is the master configuration file for Next.js build and runtime behavior.
> 2. `redirects()` executes server-side 301/302 redirects before routing logic.
> 3. Central entry point for framework customization.

---

### Exercise 2: Building Production Output with `next build`

**Scenario:**
Execute the Next.js production build process and analyze output compilation logs.

**Requirements:**
1. Explain `next build` outputs.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> # Production Build Command
> npm run build
> 
> # Output Symbols:
> # ○  (Static)   prerendered as static content
> # ƒ  (Dynamic)  server-rendered on demand using Node.js
> ```

> #### Technical Explanation
>
> 1. `next build` compiles TypeScript, bundles Server/Client components, and pre-renders static routes.
> 2. Generates optimized build output inside `.next/` directory.
> 3. Distinguishes static routes (`○`) from dynamic SSR routes (`ƒ`).

---

### Exercise 3: Inspecting `.next` Build Artifacts

**Scenario:**
Explain the purpose of `.next/server` and `.next/static` build directories.

**Requirements:**
1. Contrast server bundle directory vs static assets directory.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> .next Directory Inspection:
> - .next/server/: Compiled React Server Components and server API routes.
> - .next/static/: Client JavaScript bundles, CSS stylesheets, and pre-rendered HTML.
> ```

> #### Technical Explanation
>
> 1. `.next/server/` contains Node.js server code executed at runtime.
> 2. `.next/static/` contains public assets uploaded to CDN edge nodes.
> 3. Standard Next.js compilation artifact structure.

---




---

## 6. Related Terms
- [Dynamic Rendering (SSR)](../level_08/ssr.md) — The core performance feature of Next.js.
- [App Router vs Pages Router](app_router_vs_pages.md) — The two different architectures of Next.js.
- [Client-Side Rendering (CSR) / SPA](csr_spa.md) — Related concept: Client-Side Rendering (CSR) / SPA.
- [File-System Routing](file_system_routing.md) — Related concept: File-System Routing.
- [Node.js Runtime](nodejs_runtime.md) — Related concept: Node.js Runtime.
- [SEO (Search Engine Optimization)](seo.md) — Related concept: SEO (Search Engine Optimization).
- [`next.config.mjs`](../level_02/next_config.md) — Related concept: `next.config.mjs`.
- [React Server Components (RSC)](rsc.md) — React Server Components architecture.

---

## 7. Key Takeaways
- **Next.js** is a full-stack framework built on top of React.
- It solves React's biggest weaknesses: SEO, slow initial load times, and lack of built-in backend features.
- It achieves this primarily through Server-Side Rendering (SSR) and React Server Components.
- Modern Next.js applications are built using the `app/` directory (The App Router).
