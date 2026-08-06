# Route Groups (`(group)`)

> **Level 3 — Navigation & Routing Fundamentals**
> A folder naming convention using parentheses that allows you to organize your files or apply specific Layouts *without* changing the public URL path.

---

## 1. Prerequisites
- [App Router vs Pages Router](../level_01/app_router_vs_pages.md) — Understanding how folders equal routes.
- [`layout.tsx`](../level_02/layout.md) — The primary reason Route Groups exist.

---

## 2. Term Category

**Routing & Layouts** (Route Organization & Grouping): Route Groups (`(groupName)`) organize routes into logical directories without affecting URL path structures.



---

## 3. Explanation

### Environment Context
- **Build-Time (Routing)**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Organizing Routes with Route Groups `(group)`

**Scenario:**
Organize authentication routes `login` and `register` inside a `(auth)` route group without adding `/auth` to the URL.

**Requirements:**
1. Use parenthesized folder syntax `(auth)`.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Directory Structure:
> - app/
>   - (auth)/
>     - login/
>       - page.tsx (URL: /login)
>     - register/
>       - page.tsx (URL: /register)
> ```

> #### Technical Explanation
>
> 1. Parenthesized folders `(groupName)` create Route Groups that are omitted from URL path resolution.
> 2. `app/(auth)/login/page.tsx` maps directly to URL `/login`, NOT `/auth/login`.
> 3. Allows grouping related code logically without mutating public URL structures.

---

### Exercise 2: Applying Multiple Root Layouts using Route Groups

**Scenario:**
Apply a dark theme layout to `(marketing)` routes and a sidebar layout to `(dashboard)` routes.

**Requirements:**
1. Create separate `layout.tsx` files inside `(marketing)` and `(dashboard)`.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Multiple Root Layouts:
> - app/
>   - (marketing)/
>     - layout.tsx (Marketing Layout)
>     - page.tsx (URL: /)
>   - (dashboard)/
>     - layout.tsx (Dashboard Layout)
>     - dashboard/
>       - page.tsx (URL: /dashboard)
> ```

> #### Technical Explanation
>
> 1. Route Groups allow creating completely different root layouts for different sections of an application.
> 2. Omitting top-level `app/layout.tsx` and adding `layout.tsx` to route groups creates distinct root document shells.
> 3. Essential for multi-tenant or marketing vs application UI design.

---

### Exercise 3: Resolving Route Group Naming Conflicts

**Scenario:**
Explain why creating `app/(groupA)/about/page.tsx` and `app/(groupB)/about/page.tsx` causes a build error.

**Requirements:**
1. Detail URL path collision rule.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> ❌ BUILD ERROR (Route Conflict):
> - app/(marketing)/about/page.tsx  -> Resolves to URL: /about
> - app/(company)/about/page.tsx    -> Resolves to URL: /about
> Result: Next.js build fails due to conflicting URL routes targeting the same path!
> ```

> #### Technical Explanation
>
> 1. Because route group folder names are omitted from URL paths, both files resolve to `/about`.
> 2. Next.js enforces strict unique URL path mapping across all route groups.
> 3. Always ensure page paths remain unique across all route groups.

---




---

## 6. Related Terms
- [`layout.tsx`](../level_02/layout.md) — The file that leverages Route Groups the most.
- [Parallel Routes (`@folder`)](../level_04/parallel_routes.md) — Another special folder convention that does not affect the URL string.

---

## 7. Key Takeaways
- **Route Groups (`(groupName)`)** are folders wrapped in parentheses.
- They are completely ignored by the Next.js router when building the URL path.
- Their primary purpose is to apply a specific `layout.tsx` to a subset of routes without changing their public URL.
- They are also used to cleanly organize massive codebases into logical sections (e.g., `(admin)`, `(public)`, `(auth)`).
