# File-System Routing

> **Level 1 — Core Concepts & Architecture**
> The design paradigm where the folder hierarchy of your project defines the URL routes of your web application.

---

## 1. Prerequisites
- [Next.js Overview](../level_01/nextjs.md) — The framework that uses this routing architecture.

---

## 2. Term Category
- **Routing**

---

## 3. Environment Context
- **Build-Time** (The routing tree is determined by the project structure when Next.js builds the app).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Map Route Paths

**Problem:** You need to build a website that maps routes for the homepage (`/`), the blog list (`/blog`), and a specific blog archive page (`/blog/archive`). Map out the directory and file tree using the Next.js App Router layout:

```text
// Solution:
app/
├── page.tsx           (Maps to /)
└── blog/
    ├── page.tsx       (Maps to /blog)
    └── archive/
        └── page.tsx   (Maps to /blog/archive)
```

> [!check]- Answer
> - Create nested directories for subpaths and make sure each directory contains a `page.tsx` file.

---

### Exercise 2: Reserved File Names Mapping

**Problem:** Match the Next.js App Router special file name to its purpose:
1. `layout.tsx` 
2. `loading.tsx` 
3. `error.tsx` 
4. `route.ts` 

**Expected output:**
```text
1. Shared persistent UI layout shell across sub-routes
2. Instant loading fallback UI powered by React Suspense
3. Error boundary catch component for sub-tree runtime exceptions
4. Server-side API endpoint handler (GET, POST, etc.)
```

> [!check]- Answer
> - `layout.tsx` -> Persistent wrapper layout
> - `loading.tsx` -> Suspense fallback skeleton
> - `error.tsx` -> Error boundary component
> - `route.ts` -> Backend API Route Handler
> 
> ```text
> Reserved filenames build the App Router convention architecture.
> ```

---

### Exercise 3: Private Folder Naming Convention

**Problem:** How do you create a private utility folder inside `app/` that is excluded from public URL routing?

**Expected output:**
```text
By prefixing the folder name with an underscore (e.g. `app/_components/` or `app/_lib/`).
```

> [!check]- Answer
> - Underscore prefix `_folder` creates private non-routable code folders.
> 
> ```text
> app/_components/Button.tsx -> Not accessible at /_components/Button
> ```


---

## 7. Related Terms
- [App Router vs Pages Router](../level_01/app_router_vs_pages.md) — The shift from page-based routing to folder-based routing.
- [nextjs.md](../level_01/nextjs.md) — The parent framework.

---

## 8. Key Takeaways
- Next.js uses folders inside the `app/` directory to define URL routes.
- Special files inside folders define layout, pages, errors, and loading status.
- Naming a file `page.tsx` registers that path as a public route.
- Layout files nest automatically to wrap child page components.
- Folders without `page.tsx` files are used for configuration or components and are not accessible routes.
