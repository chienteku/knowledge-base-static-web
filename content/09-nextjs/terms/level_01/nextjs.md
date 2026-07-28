# Next.js Overview

> **Level 1 — Core Concepts & Architecture**
> The industry standard React framework created by Vercel that transforms React from a simple UI library into a powerful, full-stack, edge-native web platform.

---

## 1. Prerequisites
- React — The UI library that Next.js is built on top of.
- [Node.js Runtime](../level_01/nodejs_runtime.md) — The runtime environment that powers the backend of Next.js.

---

## 2. Term Category
- **Architecture / Framework**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Framework vs Library

**Problem:** Why is React called a "Library", but Next.js is called a "Framework"?

**Expected output:**
> [!check]- Answer
> ```text
> A Library is a tool you call to perform a specific task (React just handles UI rendering).
> A Framework provides an architecture. It calls *your* code. Next.js dictates where you put your files (Routing), how you fetch data, and how your code is bundled and deployed. It provides the entire house; React is just the bricks.
> ```
> - Who is in control of the file structure?

---

### Exercise 2: Next.js Full-Stack Architecture

**Problem:** List 3 core production capabilities provided out-of-the-box by Next.js over vanilla React.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Hybrid Server Rendering (RSC, SSR, SSG, ISR)
> 2. File-system based Routing
> 3. Built-in performance optimizations (Image, Font, Script)
> ```
> - Hybrid Rendering: RSC, SSR, SSG, ISR.
> - File-system routing: App Router & Pages Router.
> - Automatic performance optimization: `next/image`, `next/font`.
> 
> ```text
> Full-stack React framework with server rendering and optimization.
> ```

---

### Exercise 3: Vercel Platform Integration

**Problem:** Why does Next.js deploy seamlessly to Vercel's Edge Network?

**Expected output:**
> [!check]- Answer
> ```text
> Next.js is maintained by Vercel; its build output compiles directly into serverless and edge functions optimized for Vercel CDN infrastructure.
> ```
> - Build outputs compile to serverless and edge function primitives.
> 
> ```text
> Next.js build targets native Vercel Edge/Serverless primitives.
> ```


---

## 7. Related Terms
- [Server-Side Rendering (SSR)](../level_01/ssr.md) — The core performance feature of Next.js.
- [App Router vs Pages Router](../level_01/app_router_vs_pages.md) — The two different architectures of Next.js.

---

## 8. Key Takeaways
- **Next.js** is a full-stack framework built on top of React.
- It solves React's biggest weaknesses: SEO, slow initial load times, and lack of built-in backend features.
- It achieves this primarily through Server-Side Rendering (SSR) and React Server Components.
- Modern Next.js applications are built using the `app/` directory (The App Router).
