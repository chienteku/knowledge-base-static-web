# `page.tsx`

> **Level 2 — App Router UI Elements**
> The core special file in the App Router that makes a route publicly accessible. It defines the unique UI for a specific URL path.

---

## 1. Prerequisites
- [App Router vs Pages Router](../level_01/app_router_vs_pages.md) — The routing architecture.
- [React Server Components (RSC)](../level_01/rsc.md) — What a `page.tsx` is by default.

---

## 2. Term Category

**Routing & Layouts** (Unique Route UI Component): `page.tsx` defines the UI unique to a URL route segment in the App Router directory structure.



---

## 3. Explanation

### Environment Context
- **Server Component (Default) or Client Component**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Authoring App Router Page Components

**Scenario:**
Create `app/dashboard/page.tsx` rendering a user dashboard overview.

**Requirements:**
1. Export default React Server Component in `app/dashboard/page.tsx`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/dashboard/page.tsx
> export default function DashboardPage() {
>   return (
>     <main className="p-6">
>       <h1 className="text-3xl font-bold">Dashboard Overview</h1>
>       <p>Welcome back to your account.</p>
>     </main>
>   );
> }
> ```

> #### Technical Explanation
>
> 1. `page.tsx` makes a folder segment in `app/` publicly accessible as a URL route (`/dashboard`).
> 2. Must export a default React component.
> 3. Executed as a React Server Component by default.

---

### Exercise 2: Async Data Fetching inside `page.tsx`

**Scenario:**
Fetch data directly inside an async `page.tsx` Server Component.

**Requirements:**
1. Declare `export default async function Page()`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/users/page.tsx
> async function getUsers() {
>   const res = await fetch("https://api.example.com/users");
>   return res.json();
> }

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Users List</h1>
      <ul>
        {users.map((u: any) => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>
    </main>
  );
}
```

> #### Technical Explanation
>
> 1. Server Component pages can be declared as `async` functions.
> 2. Allows using `await` directly in component body to fetch data before rendering.
> 3. Zero client JavaScript bundle overhead.

---

### Exercise 3: Accessing URL Query Parameters in `page.tsx`

**Scenario:**
Read search query parameter `?q=searchterm` in `app/search/page.tsx`.

**Requirements:**
1. Access `searchParams` prop in `page.tsx`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/search/page.tsx
> export default async function SearchPage({
>   searchParams
> }: {
>   searchParams: Promise<{ q?: string }>;
> }) {
>   const { q } = await searchParams;

  return (
    <main className="p-6">
      <h1>Search Results for: {q ?? "All"}</h1>
    </main>
  );
}
```

> #### Technical Explanation
>
> 1. Next.js passes `searchParams` as a Promise prop to `page.tsx` components.
> 2. Accesses query string parameters directly on the server.
> 3. Enables server-rendered search and pagination workflows.

---




---

## 6. Related Terms
- [`layout.tsx`](layout.md) — The UI wrapper that wraps around `page.tsx`.
- [App Router vs Pages Router](../level_01/app_router_vs_pages.md) — Related concept: App Router vs Pages Router.
- [`template.tsx`](template.md) — Related concept: `template.tsx`.
- [`<Link>` Component](../level_03/link.md) — Related concept: `<Link>` Component.
- [`usePathname` & `useSearchParams`](../level_04/use_pathname.md) — Related concept: `usePathname` & `useSearchParams`.
- [`loading.tsx`](loading.md) — Loading UI.
- [`error.tsx` & `global-error.tsx`](error.md) — Related concept: `error.tsx` & `global-error.tsx`.

---

## 7. Key Takeaways
- **`page.tsx`** is the unique file that defines the UI for a route and makes that route publicly accessible.
- Without a `page.tsx`, a folder is just a normal folder, not a URL path.
- Pages are React Server Components by default, but can be Client Components if you add `"use client"`.
- Pages receive `params` and `searchParams` as props automatically.
- The component MUST be a `default` export.
