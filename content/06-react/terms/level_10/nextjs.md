# Next.js

> **Level 10 — Modern React & Architectures**
> A powerful, industry-standard "Meta-Framework" built on top of React that provides routing, server-side rendering, and backend API capabilities out of the box.

---

## 1. Prerequisites
- [Declarative Programming](../level_01/declarative_programming.md) — Next.js is just a framework *for* React.
- [Client-Side Routing](../level_09/client_side_routing.md) — Next.js provides its own alternative to React Router.
---

## 2. Term Category
- **React Ecosystem / Meta-Framework**

---

## 3. Environment Context
- **Full-Stack (Node.js Server + Browser Client)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
React is just a UI library. If you want to build a real production app, you have to stitch together 20 different tools: React Router for URLs, Webpack for bundling, Babel for compiling, Express for a backend, and a custom setup for Server-Side Rendering.
**Next.js** solves this by providing a complete, opinionated Framework. It makes all the architectural decisions for you, allowing you to just write React code and get a lightning-fast, production-ready full-stack application.

### (2) Key Features
1. **File-Based Routing:** Instead of using `<Route path="/about">`, you simply create a file called `app/about/page.js`. Next.js automatically makes that file the `/about` URL!
2. **Server-Side Rendering (SSR):** It can generate HTML on the server before sending it to the user, massively improving SEO and initial load speed.
3. **API Routes:** You don't need a separate Express.js backend. You can write your database logic directly inside Next.js.
4. **Image Optimization:** The built-in `<Image>` component automatically resizes and compresses images.

### (3) The "Meta-Framework" Trend
Next.js is so powerful that the official React Documentation no longer recommends creating plain React apps (like `create-react-app`). They officially recommend using a Meta-Framework like Next.js or Remix for all new projects.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Treating it strictly as a Client-Side app

**The mistake:** A developer migrating from vanilla React tries to use `window.localStorage` at the very top of their Next.js component.

**Why it's wrong:** Next.js renders components on the Node.js server first! Node.js does not have a `window` or a `document`. The server will crash instantly with "window is not defined."
**Golden Rule:** In Next.js, any code that relies on browser-only APIs (like `window` or `localStorage`) must be placed inside a `useEffect` hook, which only runs *after* the code reaches the browser!

---



### Mistake 2: Using Legacy Pages Router Concepts (`getStaticProps`) inside Next.js App Router (`app/`)

**The mistake:** Exporting `async function getStaticProps()` inside Next.js App Router `app/page.tsx`.

**Why it's wrong:** Next.js App Router replaced legacy data fetching methods (`getStaticProps`, `getServerSideProps`) with async Server Components (`async function Page()`) and native `fetch()` options.

*Incorrect:*
```javascript
// Inside app/page.tsx:
export async function getStaticProps() { ... } // ❌ Ignored in App Router!
```

*Fix:*
```javascript
// Inside app/page.tsx:
export default async function Page() { const data = await getData(); return <main>...</main>; }
```

### Mistake 3: Using `window` or `document` Directly in Top-Level App Router Server Components

**The mistake:** Accessing `window.innerWidth` directly in App Router Server Component render.

**Why it's wrong:** App Router components are Server Components by default! `window` is undefined on Node.js server environments, throwing `ReferenceError: window is not defined`. Add `'use client'`.

*Incorrect:*
```javascript
export default function Page() {
  const w = window.innerWidth; // ❌ ReferenceError on server!
}
```

*Fix:*
```javascript
'use client';
export default function Page() {
  const [w, setW] = useState(0);
  useEffect(() => setW(window.innerWidth), []);
}
```

## 6. Practice Exercises

### Exercise 1: The File Router

**Problem:** You are building a Next.js (App Router) application. You need a URL for `/dashboard/settings`. Where exactly do you create the React component file in your folder structure?

**Expected output:**
> [!check]- Answer
> ```text
> `app/dashboard/settings/page.js`
> In Next.js, folders define the URL path, and the special filename `page.js` defines the actual UI for that path.
> ```
> - No `react-router-dom` needed!

---



### Exercise 2: Next.js App Router File Conventions

**Problem:** List Next.js App Router special file names for: 1. Main Page (`page.tsx`); 2. Layout Wrapper (`layout.tsx`); 3. Loading Boundary (`loading.tsx`); 4. Error Boundary (`error.tsx`).

**Expected output:**
> [!check]- Answer
> ```text
> 1. page.tsx, 2. layout.tsx, 3. loading.tsx, 4. error.tsx
> ```
> ```text
> 1. page.tsx, 2. layout.tsx, 3. loading.tsx, 4. error.tsx
> ```
>
> **Explanation:** Next.js App Router uses file system conventions to define routes and UI boundaries.

---

### Exercise 3: Data Caching Options in Next.js fetch

**Problem:** Replicate SSG behavior in Next.js `fetch()` using cache option (`fetch(url, { cache: 'force-cache' })`). Replicate SSR behavior (`fetch(url, { cache: 'no-store' })`).

**Expected output:**
> [!check]- Answer
> ```text
> SSG: cache: 'force-cache'; SSR: cache: 'no-store'
> ```
> ```javascript
> // SSG (static cached):
> fetch(url, { cache: 'force-cache' });
>
> // SSR (dynamic per-request):
> fetch(url, { cache: 'no-store' });
> ```
>
> **Explanation:** Extended `fetch()` options configure static vs dynamic data caching in Next.js.

## 7. Related Terms
- [Server-Side Rendering (SSR)](ssr.md) — The flagship feature of Next.js.
- [React Server Components (RSC)](rsc.md) — The cutting-edge React architecture that Next.js 13+ is built around.
- [Bundler & Tree-Shaking](../level_08/bundler_tree_shaking.md) — Related concept: Bundler & Tree-Shaking.
- [Static Site Generation (SSG)](ssg.md) — Related concept: Static Site Generation (SSG).
---

## 8. Key Takeaways
- **Next.js** is a full-stack Meta-Framework built on top of React.
- It is the officially recommended way to build modern React applications.
- It uses File-Based Routing (folders = URLs).
- It runs on both a Node.js server and the browser, allowing for Server-Side Rendering.
- Because code runs on the server, you cannot use browser APIs (like `window`) outside of `useEffect`.
