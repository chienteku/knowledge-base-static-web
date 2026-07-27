# `page.tsx`

> **Level 2 — App Router UI Elements**
> The core special file in the App Router that makes a route publicly accessible. It defines the unique UI for a specific URL path.

---

## 1. Prerequisites
- [App Router vs Pages Router](../level_01/app_router_vs_pages.md) — The routing architecture.
- [React Server Components (RSC)](../level_01/rsc.md) — What a `page.tsx` is by default.

---

## 2. Term Category
- **Routing / UI Architecture**

---

## 3. Environment Context
- **Server Component (Default) or Client Component**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard React, if you want a URL like `/about` to show an About page, you have to download a third-party library like React Router, set up a massive `<Routes>` configuration file, and map the string `"/about"` to an `<About />` component.
Next.js uses **File-System Routing**. The folder structure *is* the router. 
However, if every single file became a route, you couldn't put helper files (like `button.tsx` or `api.ts`) inside your route folders!
Therefore, Next.js requires a specific filename: **`page.tsx`**. A folder only becomes a publicly accessible URL if it contains a `page.tsx` file.

### (2) How it works
You create folders inside the `app/` directory to define your URL paths. You put a `page.tsx` inside the folder to define the UI.

```text
app/
  page.tsx          -> Maps to URL: /
  about/
    page.tsx        -> Maps to URL: /about
    helper.ts       -> NOT a route! Just a co-located file.
```

```tsx
// app/about/page.tsx
export default function AboutPage() {
  return <h1>About Our Company</h1>;
}
```

### (3) Page Props
Every `page.tsx` receives two specific props from Next.js: `params` (for dynamic routes like `/blog/[id]`) and `searchParams` (for query strings like `?sort=asc`).

```tsx
// app/search/page.tsx
// URL: /search?query=shoes
export default function SearchPage({
  searchParams,
}: {
  searchParams: { query: string };
}) {
  return <h1>Search Results for: {searchParams.query}</h1>;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `default` export

**The mistake:** A developer writes a page component but uses a named export.
```tsx
// app/dashboard/page.tsx
export function Dashboard() {
  return <div>Dashboard</div>;
}
// ❌ ERROR: The default export is not a React Component.
```

**Why it's wrong:** Next.js explicitly looks for the `default` export in special files like `page.tsx` and `layout.tsx` to know which component to render. If it doesn't find a default export, the route breaks.
**Golden Rule:** Always use `export default function` for Next.js special UI files.

---

### Mistake 2: Exporting Page Components as Non-Default Exports

**The mistake:** Writing `export function Page()` instead of `export default function Page()` in `page.tsx`.

**Why it's wrong:** Next.js routing conventions require route `page.tsx` files to export the page React component as the **default export** (`export default`).

*Incorrect:*
```typescript
// app/dashboard/page.tsx
export function DashboardPage() { ... } // ❌ Missing default export error!
```

*Fix:*
```typescript
// app/dashboard/page.tsx
export default function DashboardPage() { ... } // Correct default export
```

---

### Mistake 3: Mutating `searchParams` Props Directly inside Page Components

**The mistake:** Attempting to assign `searchParams.page = '2'` inside `page.tsx`.

**Why it's wrong:** `searchParams` and `params` props passed to `page.tsx` are read-only objects. Use `useRouter()` or `<Link>` to trigger query parameter changes.

*Incorrect:*
```typescript
export default function Page({ searchParams }) {
  searchParams.page = '2'; // ❌ Read-only prop mutation error!
}
```

*Fix:*
```typescript
export default async function Page({
  searchParams
}: {
  searchParams: { page?: string }
}) {
  const currentPage = searchParams.page ?? '1';
}
```


---

## 6. Practice Exercises

### Exercise 1: Co-location

**Problem:** You have a `app/dashboard/page.tsx` file. You want to extract the complicated header into a separate component. Where is the best place to put `DashboardHeader.tsx`?

**Expected output:**
```text
Right next to it! `app/dashboard/DashboardHeader.tsx`.
Because only `page.tsx` files are publicly routable, you can safely co-locate your components, styles, and tests directly inside the route folders without worrying about them becoming public URLs.
```

> [!check]- Answer
> - Think about what makes a folder publicly accessible.

---

### Exercise 2: Page Props Typing Pattern

**Problem:** Write TypeScript interface for `PageProps` matching dynamic route `params: { slug: string }` and optional `searchParams: { query?: string }`.

**Expected output:**
```tsx
interface PageProps { params: { slug: string }; searchParams: { query?: string }; } export default async function Page({ params, searchParams }: PageProps) { return <div>{params.slug}</div>; }
```

> [!check]- Answer
> - `params` contains dynamic URL route segments.
> - `searchParams` contains URL query string key-values.
> 
> ```tsx
> interface PageProps {
>   params: { slug: string };
>   searchParams: { query?: string };
> }
> 
> export default async function Page({ params, searchParams }: PageProps) {
>   return <div>Slug: {params.slug}, Query: {searchParams.query}</div>;
> }
> ```

---

### Exercise 3: searchParams Dynamic Opt-In

**Problem:** Why does accessing the `searchParams` prop in an App Router `page.tsx` automatically opt that page into dynamic SSR rendering?

**Expected output:**
```text
URL query search parameters change on every HTTP request and cannot be known at static build time.
```

> [!check]- Answer
> - Query parameters are request-time dynamic data.
> 
> ```text
> Accessing searchParams = Request-time dynamic rendering.
> ```


---

## 7. Related Terms
- [`layout.tsx`](../level_02/layout.md) — The UI wrapper that wraps around `page.tsx`.
- [Dynamic Routes](../level_03/dynamic_routes.md) — How the `params` prop gets populated.

---

## 8. Key Takeaways
- **`page.tsx`** is the unique file that defines the UI for a route and makes that route publicly accessible.
- Without a `page.tsx`, a folder is just a normal folder, not a URL path.
- Pages are React Server Components by default, but can be Client Components if you add `"use client"`.
- Pages receive `params` and `searchParams` as props automatically.
- The component MUST be a `default` export.
