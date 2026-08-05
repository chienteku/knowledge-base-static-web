# App Router vs Pages Router

> **Level 1 — Core Concepts & Architecture**
> The two distinct architectures available in Next.js. The Pages Router is the legacy system, while the App Router is the modern, Server Component-driven future.

---

## 1. Prerequisites
- [Next.js Overview](nextjs.md) — The framework itself.
- [React Server Components (RSC)](rsc.md) — The technology that necessitated the App Router.
---

## 2. Term Category
- **Architecture**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
From version 1 to 12, Next.js used the **Pages Router** (the `pages/` directory). In this architecture, routing was simple (every file in `pages/` became a route), but data fetching was clunky. You had to use special, isolated functions like `getServerSideProps` at the page level, and you couldn't easily fetch data deep inside nested components. All components were essentially Client Components.
When React introduced Server Components, Next.js realized they needed a completely new architecture to support them. Thus, the **App Router** (the `app/` directory) was born in Next.js 13.

### (2) The Legacy Pages Router (`pages/`)
- **Routing:** Based on file names (e.g., `pages/about.js` -> `/about`).
- **Components:** All components are bundled and sent to the client.
- **Data Fetching:** Must be done at the very top of the page using `getServerSideProps` or `getStaticProps`, then passed down as props.
- **Layouts:** Cumbersome to implement and maintain state across navigation.

### (3) The Modern App Router (`app/`)
- **Routing:** Based on folders. The folder name is the route, and the UI is defined in a special `page.tsx` file inside it (e.g., `app/about/page.tsx` -> `/about`).
- **Components:** Everything is a **React Server Component** by default. Zero JS is sent to the client unless you use `"use client"`.
- **Data Fetching:** You can fetch data anywhere! You can use `async/await` directly inside *any* Server Component, completely removing the need for `getServerSideProps`.
- **Layouts:** Native, deeply nested layouts (`layout.tsx`) that do not re-render on navigation.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Mixing paradigms

**The mistake:** A developer migrating to the App Router tries to export `getServerSideProps` inside `app/dashboard/page.tsx`.

**Why it's wrong:** `getServerSideProps` physically does not exist in the App Router! It is completely deleted from the API. Because Server Components can just use `async/await` natively, the old data fetching functions are obsolete.
**Golden Rule:** When working in the `app/` directory, forget everything you know about `getServerSideProps`. Just make the component `async` and use `await fetch()` or `await db.query()`.

---

### Mistake 2: Mixing `pages/` and `app/` Directory Routing Conventions (Route Collisions)

**The mistake:** Creating both `pages/about.tsx` and `app/about/page.tsx` for the same URL path `/about`.

**Why it's wrong:** Next.js will throw a build error or prioritize one directory unpredictably when duplicate routes exist across `pages/` and `app/`.

*Incorrect:*
```tsx
// pages/about.tsx AND app/about/page.tsx existing simultaneously for route /about ❌ Build Conflict!
```

*Fix:*
```typescript
// Migrate /about completely to app/about/page.tsx and delete pages/about.tsx
```

---

### Mistake 3: Importing `next/router` (`useRouter`) inside the App Router

**The mistake:** Writing `import { useRouter } from 'next/router'` inside an `app/` directory component.

**Why it's wrong:** In the App Router (`app/`), `next/router` is deprecated and throws a runtime error: `NextRouter was not mounted`. Import `useRouter` from `next/navigation` instead.

*Incorrect:*
```typescript
import { useRouter } from 'next/router'; // ❌ Throws runtime error in App Router!
```

*Fix:*
```typescript
import { useRouter } from 'next/navigation'; // Correct App Router import
```


---

## 6. Practice Exercises

### Exercise 1: File Structure Translation

**Problem:** How would you translate the following Pages Router structure into the new App Router structure?
`pages/index.tsx`
`pages/blog.tsx`

**Expected output:**
> [!check]- Answer
> ```text
> app/
>   page.tsx        -> (translates to /)
>   blog/
>     page.tsx      -> (translates to /blog)
> ```
> - In the App Router, folders define routes, files define UI.

---

### Exercise 2: Router Migration Comparison

**Problem:** Contrast Pages Router `getServerSideProps` with App Router React Server Components (RSC) data fetching.

**Expected output:**
> [!check]- Answer
> ```text
> Pages Router fetches data in a top-level exported function `getServerSideProps`; App Router components are async functions that fetch data directly inside the component body.
> ```
> - Pages Router: `export async function getServerSideProps() {}`
> - App Router: `export default async function Page() { const data = await fetch(...); }`
> 
> ```tsx
> // App Router Async RSC Data Fetching
> export default async function Page() {
>   const res = await fetch('https://api.example.com/data');
>   const data = await res.json();
>   return <div>{data.title}</div>;
> }
> ```

---

### Exercise 3: Directory Default Component Architecture

**Problem:** Which file in an `app/` directory route folder is responsible for rendering the unique UI for a route?

**Expected output:**
> [!check]- Answer
> ```text
> page.tsx (or page.jsx / page.js)
> ```
> - `page.tsx` defines the publicly accessible UI for a route segment.
> 
> ```text
> app/dashboard/page.tsx -> Renders /dashboard UI
> ```


---

## 7. Related Terms
- [React Server Components (RSC)](rsc.md) — The technology that powers the App Router.
- [`page.tsx`](../level_02/page.md) — The file that defines UI in the App Router.
- [Client Components (`"use client"`)](client_components.md) — Related concept: Client Components (`"use client"`).
- [File-System Routing](file_system_routing.md) — Related concept: File-System Routing.
- [Next.js Overview](nextjs.md) — Related concept: Next.js Overview.
---

## 8. Key Takeaways
- The **Pages Router** (`pages/`) is the legacy Next.js architecture. It relies on `getServerSideProps`.
- The **App Router** (`app/`) is the modern architecture. It is powered by React Server Components.
- In the App Router, routing is defined by folders, and UI is defined by specific files like `page.tsx` and `layout.tsx`.
- The App Router completely eliminates the need for `getServerSideProps`, allowing you to fetch data directly inside any Server Component using `async/await`.
