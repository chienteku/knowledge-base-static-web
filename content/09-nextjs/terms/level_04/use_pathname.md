# `usePathname` & `useSearchParams`

> **Level 4 — Advanced Routing**
> Client hooks used to read the current URL string and the query string parameters, essential for building active navigation links and client-side filtering.

---

## 1. Prerequisites
- [Dynamic Routes (`[slug]`)](../level_03/dynamic_routes.md) — How the server reads URL parameters.
- [Client Components (`"use client"`)](../level_01/client_components.md) — Required to use these hooks.

---

## 2. Term Category
- **Routing Hooks**

---

## 3. Environment Context
- **Client Component ONLY**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Updating the Query String

**Problem:** `useSearchParams` is read-only. If you have a button that changes the sort order to "desc", how do you actually update the URL in the browser to `?sort=desc`?

**Expected output:**
> [!check]- Answer
> ```tsx
> import { useRouter, usePathname, useSearchParams } from 'next/navigation';
> 
> export default function SortButton() {
>   const router = useRouter();
>   const pathname = usePathname();
>   const searchParams = useSearchParams();
> 
>   const handleSort = () => {
>     // 1. Create a fresh URLSearchParams object using the current ones
>     const params = new URLSearchParams(searchParams);
>     // 2. Mutate it
>     params.set('sort', 'desc');
>     // 3. Push the new URL!
>     router.push(`${pathname}?${params.toString()}`);
>   }
> 
>   return <button onClick={handleSort}>Sort Descending</button>;
> }
> ```
> - You need the `useRouter` hook from Level 3 to push the new URL!

---

### Exercise 2: Navigation Active Link Pattern with usePathname

**Problem:** Write `NavLink` Client Component using `usePathname()` to append class `'active'` when `pathname === href`.

**Expected output:**
> [!check]- Answer
> ```tsx
> 'use client'; import { usePathname } from 'next/navigation'; import Link from 'next/link'; export function NavLink({ href, children }: { href: string; children: React.ReactNode }) { const pathname = usePathname(); const isActive = pathname === href; return <Link href={href} className={isActive ? 'active' : ''}>{children}</Link>; }
> ```
> - `usePathname()` enables active navigation styling in Client Components.
> 
> ```tsx
> 'use client';
> import { usePathname } from 'next/navigation';
> import Link from 'next/link';
> 
> export function NavLink({
>   href,
>   children
> }: {
>   href: string;
>   children: React.ReactNode;
> }) {
>   const pathname = usePathname();
>   const isActive = pathname === href;
>   
>   return (
>     <Link href={href} className={isActive ? 'font-bold text-blue-600' : 'text-gray-600'}>
>       {children}
>     </Link>
>   );
> }
> ```

---

### Exercise 3: usePathname Dynamic Route Parameter Masking

**Problem:** If URL is `/users/123`, does `usePathname()` return `/users/123` or `/users/[id]`?

**Expected output:**
> [!check]- Answer
> ```text
> It returns the actual resolved URL path: /users/123.
> ```
> - `usePathname()` returns the current browser URL pathname.
> 
> ```text
> /users/123
> ```


---

## 7. Related Terms
- [`useRouter` Hook](../level_03/use_router.md) — Used in conjunction with these hooks to update the URL.
- [`page.tsx`](../level_02/page.md) — The server-side equivalent that receives `searchParams` as a prop.

---

## 8. Key Takeaways
- **`usePathname()`** returns the current URL path string (e.g., `/dashboard`). It is perfect for styling active navigation links.
- **`useSearchParams()`** returns a read-only Web API `URLSearchParams` object to read query strings (e.g., `?q=hello`).
- Both hooks MUST be used inside a Client Component (`"use client"`).
- To update a query string, you must combine `useSearchParams`, `usePathname`, and `useRouter.push()`.
