# File-System Routing

> **Level 1 — Core Concepts & Architecture**
> The design paradigm where the folder hierarchy of your project defines the URL routes of your web application.

---

## 1. Prerequisites
- [Next.js Overview](nextjs.md) — The framework that uses this routing architecture.

---

## 2. Term Category

**Routing & Layouts** (Directory-Based Route Resolution): File-system routing automatically maps directory paths in `app/` to publicly accessible URL routes.



---

## 3. Explanation

### Environment Context
- **Build-Time** (The routing tree is determined by the project structure when Next.js builds the app).

### (1) Design Motivation — "Why did we design this?"
In traditional single-page apps (like standard React with React Router), developers must write a central, JavaScript routing configuration file. This requires manually importing every page component, mapping them to paths, and nesting them inside layout wrappers:

```typescript
// Traditional configuration-based router
<Route path="dashboard" element={<DashboardLayout />}>
  <Route index element={<DashboardPage />} />
  <Route path="settings" element={<SettingsPage />} />
</Route>
```

As the application grows, this routing file becomes a massive bottleneck and leads to merge conflicts. **File-System Routing** was designed to solve this by removing routing configuration completely. The layout structure of your folders *is* the router.

---

### (2) Core Concept — Folders and Special Files
In the Next.js App Router, routes are defined by standard directories nested inside the `app/` folder.
-   **Folders** define the URL paths (e.g., `app/about/` maps to `/about`).
-   **Special Files** define the user interface rendering behavior (e.g., `page.tsx` defines the main view, `layout.tsx` defines shared frames).

```
app/
├── layout.tsx         (Root Layout)
├── page.tsx           (Home Page - "/")
├── about/
│   └── page.tsx       (About Page - "/about")
└── dashboard/
    ├── layout.tsx     (Dashboard Layout)
    ├── page.tsx       (Dashboard Home - "/dashboard")
    └── settings/
        └── page.tsx   (Settings Page - "/dashboard/settings")
```

---

### (3) Nested Routes and UI Composition
Next.js automatically matches nested routes. When a user visits `/dashboard/settings`:
1.  Next.js identifies the folder path `app/dashboard/settings/`.
2.  It loads the leaf `page.tsx` file inside `settings/`.
3.  It wraps this page with the nearest parent layouts: first `app/dashboard/layout.tsx`, and finally the root `app/layout.tsx`.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Naming a route file arbitrarily instead of using `page.tsx`

**The mistake:** Creating a folder for a route and naming the file after the route instead of `page.tsx`:

```
app/
└── blog/
    └── blog.tsx  ❌ (ERROR: Will result in a 404 Not Found error!)
```

**Why it's wrong:** Next.js uses strict filename conventions. Only the presence of a file named exactly `page.tsx` (or `page.js` / `page.jsx`) registers a path in the application router. Any other files (like `blog.tsx` or `index.tsx`) are ignored by the router, although they can be imported as helper components.

**Golden Rule:** Always name the primary UI view file for a path exactly `page.tsx`.

---

### Mistake 2: Creating Folders in `app/` Without a `page.tsx` File and Expecting Route Resolution

**The mistake:** Creating folder `app/dashboard/` containing `layout.tsx` but no `page.tsx` file.

**Why it's wrong:** In Next.js App Router, a folder path creates a publicly accessible URL route ONLY when it contains a `page.tsx` file. Without `page.tsx`, visiting `/dashboard` returns a 404.

*Incorrect:*
```tsx
// app/dashboard/layout.tsx exists, but NO page.tsx exists ❌ /dashboard returns 404!
```

*Fix:*
```typescript
// Add app/dashboard/page.tsx to expose the /dashboard route URL
```

---

### Mistake 3: Using Invalid Special File Names in App Router Folders

**The mistake:** Naming custom layout file `my-layout.tsx` or page `main-page.tsx` inside an `app/` route folder.

**Why it's wrong:** Next.js recognizes ONLY special reserved file names (`page`, `layout`, `loading`, `error`, `not-found`, `template`, `route`). Arbitrary names are ignored by the file-system router.

*Incorrect:*
```tsx
// app/blog/my-page.tsx ❌ Ignored by Next.js router!
```

*Fix:*
```typescript
// app/blog/page.tsx // Standard reserved filename
```


---

## 5. Practice Exercises

### Exercise 1: Structuring App Router Directories

**Scenario:**
Structure an App Router route for a user dashboard `/dashboard/analytics` with nested layouts and pages.

**Requirements:**
1. Define folder hierarchy under `app/`.
2. Place `layout.tsx` and `page.tsx` in correct paths.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Directory Structure:
> - app/
>   - layout.tsx (Root Layout)
>   - page.tsx (Homepage /)
>   - dashboard/
>     - layout.tsx (Dashboard Layout)
>     - analytics/
>       - page.tsx (URL: /dashboard/analytics)
> ```

> #### Technical Explanation
>
> 1. App Router maps directory hierarchies directly to URL route segments.
> 2. `page.tsx` makes a route segment publicly accessible in the browser.
> 3. `layout.tsx` wraps child route segments in nested persistent UI shells.

---

### Exercise 2: Implementing Nested App Router Layouts

**Scenario:**
Create `app/dashboard/layout.tsx` wrapping dashboard pages with a sidebar navigation shell.

**Requirements:**
1. Export default React Server Component accepting `{ children }: { children: React.ReactNode }`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/dashboard/layout.tsx
> export default function DashboardLayout({
>   children
> }: {
>   children: React.ReactNode;
> }) {
>   return (
>     <div className="flex h-screen">
>       <aside className="w-64 bg-slate-900 text-white p-4">
>         <nav>
>           <a href="/dashboard">Overview</a>
>           <a href="/dashboard/analytics">Analytics</a>
>         </nav>
>       </aside>
>       <main className="flex-1 p-6">{children}</main>
>     </div>
>   );
> }
> ```

> #### Technical Explanation
>
> 1. Dashboard layout wraps all sub-routes (`/dashboard`, `/dashboard/analytics`) automatically.
> 2. Layouts preserve component state and avoid re-rendering common UI elements during sub-route navigation.
> 3. React Server Component layout structure.

---

### Exercise 3: Defining Dynamic Route Segments in App Router

**Scenario:**
Create a dynamic route segment `app/products/[id]/page.tsx` and render route parameters.

**Requirements:**
1. Access `params.id` in Server Component props.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/products/[id]/page.tsx
> export default async function ProductPage({
>   params
> }: {
>   params: Promise<{ id: string }>;
> }) {
>   const { id } = await params;
>   return (
>     <main className="p-8">
>       <h1 className="text-2xl font-bold">Product Details: {id}</h1>
>     </main>
>   );
> }
> ```

> #### Technical Explanation
>
> 1. Bracket folder naming `[id]` creates a dynamic URL parameter segment.
> 2. In Next.js 15 App Router, `params` is a Promise that resolves dynamic route parameters.
> 3. Server Component fetches data directly on the server.

---




---

## 6. Related Terms
- [App Router vs Pages Router](app_router_vs_pages.md) — The shift from page-based routing to folder-based routing.
- [Next.js Overview](nextjs.md) — The parent framework.

---

## 7. Key Takeaways
- Next.js uses folders inside the `app/` directory to define URL routes.
- Special files inside folders define layout, pages, errors, and loading status.
- Naming a file `page.tsx` registers that path as a public route.
- Layout files nest automatically to wrap child page components.
- Folders without `page.tsx` files are used for configuration or components and are not accessible routes.
