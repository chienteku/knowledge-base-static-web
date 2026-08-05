# Route Groups (`(group)`)

> **Level 3 — Navigation & Routing Fundamentals**
> A folder naming convention using parentheses that allows you to organize your files or apply specific Layouts *without* changing the public URL path.

---

## 1. Prerequisites
- [App Router vs Pages Router](../level_01/app_router_vs_pages.md) — Understanding how folders equal routes.
- [`layout.tsx`](../level_02/layout.md) — The primary reason Route Groups exist.
---

## 2. Term Category
- **Routing / Organization**

---

## 3. Environment Context
- **Build-Time (Routing)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In the App Router, every folder you create becomes a URL path. 
Imagine you are building a massive application. You want to organize your code into "Marketing" pages (Home, About, Pricing) and "App" pages (Dashboard, Settings, Profile).
If you create folders named `marketing/` and `app/`, the URLs become `/marketing/about` and `/app/dashboard`. That looks terrible! You want the URLs to just be `/about` and `/dashboard`.
But if you don't use folders, how can you give all the Marketing pages a different `layout.tsx` (a public navbar) than the App pages (a private sidebar)?
**Route Groups** solve this. They are "invisible folders".

### (2) The Parentheses Syntax `(folderName)`
If you wrap a folder name in parentheses, Next.js completely ignores that folder when calculating the URL path. It only uses the folder for file organization and Layout boundary mapping.

```text
app/
  (marketing)/
    layout.tsx      -> Applies a public Navbar!
    about/page.tsx  -> URL is simply: /about
    pricing/page.tsx-> URL is simply: /pricing

  (app)/
    layout.tsx      -> Applies a private Sidebar!
    dashboard/page.tsx -> URL is simply: /dashboard
```
In the example above, the `(marketing)` and `(app)` folders do not exist in the URL. They allow us to apply two completely different Layouts to routes that share the exact same root URL level!

### (3) Opting out of the Root Layout
You can even use Route Groups to completely bypass the root layout. If you delete `app/layout.tsx`, and place it inside `app/(marketing)/layout.tsx` and `app/(app)/layout.tsx`, you effectively have two completely independent Root Layouts (useful if your marketing site needs a fundamentally different `<body>` structure than your web app).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: URL Collisions

**The mistake:** A developer creates two different route groups and puts a folder with the same name in both.
```text
app/
  (marketing)/
    about/page.tsx
  (app)/
    about/page.tsx
```

**Why it's wrong:** Because Route Groups are invisible to the URL, both of these folders resolve to the exact same URL: `/about`. Next.js does not know which one you want the user to see, and will throw a hard build error.
**Golden Rule:** Remember that Route Groups are structurally invisible. Ensure that the folders *inside* them do not create duplicate URL paths across your application.

---

### Mistake 2: Including Route Group Parentheses in Browser URL Paths

**The mistake:** Expecting URL path to include route group name `/ (marketing) / about`.

**Why it's wrong:** Route Groups enclosed in parentheses `(groupName)` are **omitted** from the public URL path. Folder `app/(marketing)/about/page.tsx` resolves to URL `/about`, NOT `/(marketing)/about`.

*Incorrect:*
```tsx
/* Expecting URL path to be /(marketing)/about */
```

*Fix:*
```tsx
/* Route groups organize code without altering URL paths: app/(marketing)/about -> /about */
```

---

### Mistake 3: Creating Route Name Collisions Across Different Route Groups

**The mistake:** Creating both `app/(marketing)/about/page.tsx` and `app/(shop)/about/page.tsx`.

**Why it's wrong:** Because route group names are omitted from URL paths, both files attempt to claim the exact same URL path `/about`, causing a build route collision.

*Incorrect:*
```tsx
// app/(marketing)/about/page.tsx AND app/(shop)/about/page.tsx ❌ Duplicate route /about!
```

*Fix:*
```typescript
// Ensure URL paths remain unique across all route groups
```


---

## 6. Practice Exercises

### Exercise 1: Clean Architecture

**Problem:** You have an authentication flow: `login`, `register`, and `forgot-password`. You want them to share a specific "Split Screen" layout. How do you organize this without making the URLs `/auth/login`?

**Expected output:**
> [!check]- Answer
> ```text
> Create a Route Group named `(auth)`.
> Inside `(auth)`, create a `layout.tsx` returning your split-screen design.
> Place the `login`, `register`, and `forgot-password` folders inside `(auth)`.
> The URLs remain `/login` and `/register`, but they now share the isolated layout!
> ```
> - Wrap the grouping word in parentheses.

---

### Exercise 2: Multiple Root Layout Pattern via Route Groups

**Problem:** Describe how Route Groups allow creating 2 completely distinct root layouts (`(marketing)` vs `(dashboard)`) in the same App Router app.

**Expected output:**
> [!check]- Answer
> ```text
> By removing the top-level app/layout.tsx and creating distinct app/(marketing)/layout.tsx and app/(dashboard)/layout.tsx each with their own <html> and <body> tags.
> ```
> - Route groups allow splitting applications into isolated root layout sub-trees.
> 
> ```text
> app/(marketing)/layout.tsx -> Marketing root layout (with header/footer)
> app/(dashboard)/layout.tsx -> Dashboard root layout (with sidebar)
> ```

---

### Exercise 3: Route Group Syntax

**Problem:** Which character convention defines a Route Group folder name in Next.js App Router?

**Expected output:**
> [!check]- Answer
> ```text
> Parentheses (e.g. (groupName))
> ```
> - Parentheses `(folder)` omit the folder from URL paths.
> 
> ```text
> app/(auth)/login/page.tsx -> /login
> ```


---

## 7. Related Terms
- [`layout.tsx`](../level_02/layout.md) — The file that leverages Route Groups the most.
- [Parallel Routes (`@folder`)](../level_04/parallel_routes.md) — Another special folder convention that does not affect the URL string.
- [Catch-all Segments (`[...slug]`)](catch_all_segments.md) — Related concept: Catch-all Segments (`[...slug]`).
---

## 8. Key Takeaways
- **Route Groups (`(groupName)`)** are folders wrapped in parentheses.
- They are completely ignored by the Next.js router when building the URL path.
- Their primary purpose is to apply a specific `layout.tsx` to a subset of routes without changing their public URL.
- They are also used to cleanly organize massive codebases into logical sections (e.g., `(admin)`, `(public)`, `(auth)`).
