# `usePathname` & `useSearchParams`

> **Level 4 — Advanced Routing**
> Client hooks used to read the current URL string and the query string parameters, essential for building active navigation links and client-side filtering.

---

## 1. Prerequisites
- [Client Components (`"use client"`)](../level_01/client_components.md) — Required to use these hooks.
- [File-System Routing](../level_01/file_system_routing.md) — Reading current URL pathname in App Router.

---

## 2. Term Category

**Routing & Layouts** (Client Pathname Hook): `usePathname()` reads the current URL's pathname string inside Client Components.



---

## 3. Explanation

### Environment Context
- **Client Component ONLY**

### (1) Design Motivation — "Why did we design this?"
Inside a Server Component (`page.tsx`), you can easily read the URL query string because it is passed directly as the `searchParams` prop.
However, if you are deep inside a Client Component (like a Navbar or a Search Filter dropdown), you don't have access to that prop. 
Next.js provides **`usePathname`** and **`useSearchParams`** so Client Components can reactively read and update based on the current URL.

### (2) `usePathname` (Active Links)
`usePathname` returns the current URL string (e.g., `/dashboard/settings`). It is most commonly used to highlight the "Active" link in a Navigation bar.

```tsx
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname(); // e.g., "/about"

  return (
    <nav>
      <Link href="/about" className={pathname === '/about' ? 'text-blue-500 font-bold' : ''}>
        About Us
      </Link>
    </nav>
  );
}
```

### (3) `useSearchParams` (Query Strings)
`useSearchParams` returns a read-only `URLSearchParams` object containing the query string (e.g., `?sort=asc&page=2`).

```tsx
"use client";
import { useSearchParams } from 'next/navigation';

export default function SearchResults() {
  const searchParams = useSearchParams();
  
  // Extracts "shoes" from URL: /search?query=shoes
  const query = searchParams.get('query'); 

  return <div>Showing results for {query}</div>;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to read `searchParams` in a Server `layout.tsx`

**The mistake:** A developer needs to know the query string to render a sidebar, so they try to read the `searchParams` prop in a `layout.tsx` file.

**Why it's wrong:** As discussed in Level 2, Layouts DO NOT receive the `searchParams` prop because layouts do not re-render on navigation, and query strings change frequently.
**Golden Rule:** If a Layout needs to know about the URL query string, you must extract that UI into a Client Component and use the `useSearchParams()` hook!

---

### Mistake 2: Attempting to Call `usePathname()` inside a Server Component

**The mistake:** Calling `const pathname = usePathname()` in a component without `'use client'`.

**Why it's wrong:** `usePathname()` is a Client Component hook. Calling it inside Server Components throws a runtime error. Use `'use client'`.

*Incorrect:*
```typescript
// Server Component (default)
import { usePathname } from 'next/navigation';
export default function Header() {
  const pathname = usePathname(); // ❌ Error: Hooks only work in Client Components!
}
```

*Fix:*
```typescript
'use client';
import { usePathname } from 'next/navigation';
export default function Header() {
  const pathname = usePathname();
}
```

---

### Mistake 3: Expecting `usePathname()` to Return Query Search Parameters

**The mistake:** Expecting `usePathname()` to return `/search?q=nextjs`.

**Why it's wrong:** `usePathname()` returns ONLY the path section (`/search`), stripping query parameters and hash strings. Use `useSearchParams()` to read query parameters.

*Incorrect:*
```tsx
const pathname = usePathname(); // Returns '/search', NOT '/search?q=nextjs'!
```

*Fix:*
```tsx
import { usePathname, useSearchParams } from 'next/navigation';
const pathname = usePathname(); // '/search'
const searchParams = useSearchParams(); // searchParams.get('q')
```


---

## 5. Practice Exercises

### Exercise 1: Highlighting Active Navigation Links with `usePathname()`

**Scenario:**
Create an active navigation link component that highlights when its `href` matches `usePathname()`.

**Requirements:**
1. Import `usePathname` from `next/navigation` in `"use client"` component.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";
> 
> import Link from "next/link";
> import { usePathname } from "next/navigation";
> 
> export default function NavLink({ href, label }: { href: string; label: string }) {
>   const pathname = usePathname();
>   const isActive = pathname === href;
> 
>   return (
>     <Link
>       href={href}
>       className={`px-3 py-2 rounded ${
>         isActive ? "bg-blue-600 text-white font-bold" : "text-gray-700 hover:bg-gray-100"
>       }`}
    >
>       {label}
>     </Link>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `usePathname()` returns the current URL pathname string (e.g. `/dashboard`).
> 2. Automatically re-evaluates when client-side route transitions occur.
> 3. Must be used inside Client Components marked with `"use client"`.
> 
---

### Exercise 2: Sub-Route Prefix Active State Detection

**Scenario:**
Check if the current pathname starts with a parent route prefix (`pathname.startsWith('/docs')`).

**Requirements:**
1. Use `pathname.startsWith(prefix)` logic.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";
> 
> import { usePathname } from "next/navigation";
> 
> export default function DocsSidebarSection() {
>   const pathname = usePathname();
>   const isDocsActive = pathname.startsWith("/docs");
> 
>   return (
>     <div className={isDocsActive ? "border-l-4 border-blue-500 pl-4" : "pl-4"}>
>       <h3>Docs Section</h3>
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `pathname.startsWith()` allows highlighting parent navigation items when viewing child sub-routes (`/docs/v2/installation`).
> 2. Maintains hierarchical visual indicators in sidebar navigation menus.
> 3. Standard navigation UI pattern.
> 
---

### Exercise 3: Auditing Client Re-Render Bounds with `usePathname()`

**Scenario:**
Isolate `usePathname()` to atomic link items to prevent re-rendering full layout trees on navigation.

**Requirements:**
1. Isolate `"use client"` hook to leaf components.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // ❌ INCORRECT (Marks whole header layout as Client Component):
> // "use client";
> // export default function Header() { const pathname = usePathname(); ... }
> 
> // ✅ CORRECT (Isolate hook to child NavItem component):
> // Header.tsx remains a Server Component; NavItem.tsx consumes usePathname().
> ```
> 
> #### Technical Explanation
>
> 1. Consuming `usePathname()` forces the component to be marked as `"use client"`.
> 2. Moving the hook down to atomic leaf components leaves header containers as zero-bundle-size Server Components.
> 3. Optimizes client bundle size and rendering performance.
> 
---


## 6. Related Terms
- [`useRouter` Hook](../level_03/use_router.md) — Used in conjunction with these hooks to update the URL.
- [`page.tsx`](../level_02/page.md) — The server-side equivalent that receives `searchParams` as a prop.

---

## 7. Key Takeaways
- **`usePathname()`** returns the current URL path string (e.g., `/dashboard`). It is perfect for styling active navigation links.
- **`useSearchParams()`** returns a read-only Web API `URLSearchParams` object to read query strings (e.g., `?q=hello`).
- Both hooks MUST be used inside a Client Component (`"use client"`).
- To update a query string, you must combine `useSearchParams`, `usePathname`, and `useRouter.push()`.
