# App Router vs Pages Router

> **Level 1 — Core Concepts & Architecture**
> The two distinct architectures available in Next.js. The Pages Router is the legacy system, while the App Router is the modern, Server Component-driven future.

---

## 1. Prerequisites
- [Next.js Overview](nextjs.md) — The framework itself.
- [React Server Components (RSC)](rsc.md) — The technology that necessitated the App Router.

---

## 2. Term Category

**Framework Architecture** (App Router vs Pages Router Architecture): App Router vs Pages Router compares legacy `pages/` routing against modern `app/` directory React Server Component nested layouts.



---

## 3. Explanation

### Environment Context
- **Server & Client**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Mapping Architectural Differences (Pages vs App Router)

**Scenario:**
Formulate an architectural comparison matrix contrasting Pages Router against App Router.

**Requirements:**
1. Contrast routing directories, component models, and layout patterns.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Router Architecture Comparison:
> - Pages Router (pages/): Client-heavy by default, getServerSideProps/getStaticProps for data fetching, custom _app.js for global layouts.
> - App Router (app/): React Server Components by default, async/await data fetching inside components, nested layout.tsx files.
> ```

> #### Technical Explanation
>
> 1. Pages Router relies on top-level data fetching methods (`getServerSideProps`).
> 2. App Router brings data fetching directly into individual Server Components.
> 3. App Router provides superior component-level streaming and smaller client JS bundles.

---

### Exercise 2: Migrating Pages Router `_app.js` to App Router Root Layout

**Scenario:**
Migrate global providers and CSS imports from `pages/_app.js` to `app/layout.tsx`.

**Requirements:**
1. Move global CSS and providers into `app/layout.tsx`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/layout.tsx
> import "@/app/globals.css";

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

> #### Technical Explanation
>
> 1. `app/layout.tsx` replaces `pages/_app.js` and `pages/_document.js`.
> 2. Must include `<html>` and `<body>` tags.
> 3. Enforces standard root document shell for all pages.

---

### Exercise 3: Incremental Adoption Strategy (Co-existing Routers)

**Scenario:**
Explain how Next.js supports co-existing `pages/` and `app/` directories during incremental migrations.

**Requirements:**
1. Detail route precedence when paths conflict between routers.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Co-existence & Precedence Rule:
> - Next.js allows pages/ and app/ to exist in the same codebase for incremental migration.
> - CRITICAL: An App Router route (app/about/page.tsx) takes precedence over a Pages Router route (pages/about.tsx) if paths conflict!
> ```

> #### Technical Explanation
>
> 1. App Router routes automatically override Pages Router routes sharing the same URL path.
> 2. Allows migrating application routes incrementally one page at a time.
> 3. Zero-downtime migration strategy.

---




---

## 6. Related Terms
- [React Server Components (RSC)](rsc.md) — The technology that powers the App Router.
- [`page.tsx`](../level_02/page.md) — The file that defines UI in the App Router.
- [Client Components (`"use client"`)](client_components.md) — Related concept: Client Components (`"use client"`).
- [File-System Routing](file_system_routing.md) — Related concept: File-System Routing.
- [Next.js Overview](nextjs.md) — Related concept: Next.js Overview.

---

## 7. Key Takeaways
- The **Pages Router** (`pages/`) is the legacy Next.js architecture. It relies on `getServerSideProps`.
- The **App Router** (`app/`) is the modern architecture. It is powered by React Server Components.
- In the App Router, routing is defined by folders, and UI is defined by specific files like `page.tsx` and `layout.tsx`.
- The App Router completely eliminates the need for `getServerSideProps`, allowing you to fetch data directly inside any Server Component using `async/await`.
