# `error.tsx` & `global-error.tsx`

> **Level 2 — App Router UI Elements**
> Special files that automatically catch unexpected runtime errors in your Server or Client components, displaying a fallback UI instead of crashing the entire application.

---

## 1. Prerequisites
- [React Error Boundaries](error_boundaries.md) — The underlying React feature that Next.js uses to catch errors in the UI.
- [`loading.tsx`](loading.md) — The sister file that handles pending promises instead of rejected ones.

---

## 2. Term Category

**Routing & Layouts** (Route Segment Error Boundary Component): `error.tsx` isolates runtime crashes within specific route segments by creating a React Error Boundary UI wrapper.



---

## 3. Explanation

### Environment Context
- **Client Component ONLY** (Must use `"use client"`)

### (1) Design Motivation — "Why did we design this?"
If a database query inside `page.tsx` fails and throws an error, standard React behavior is to unmount the entire component tree, resulting in a blank white screen (a fatal crash).
**`error.tsx`** prevents this. It acts as a safety net. If any component in the route throws an error, Next.js catches it and displays the UI inside `error.tsx`. Crucially, the rest of the application (like the `layout.tsx` navbar) stays completely functional!

### (2) The Syntax
**Important:** An `error.tsx` file MUST be a Client Component (`"use client"`). This is because errors can happen on the server OR the client during hydration, so the Error Boundary must be able to execute in the browser to catch client-side clicks/events that throw errors.

It receives two props: the `error` object, and a `reset` function to try reloading the page.

```tsx
// app/dashboard/error.tsx
"use client"; // REQUIRED!

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="bg-red-100 p-4 rounded">
      <h2>Something went wrong in the dashboard!</h2>
      <p>{error.message}</p>
      {/* The reset function attempts to re-render the segment */}
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### (3) `global-error.tsx`
Just like `loading.tsx`, `error.tsx` only catches errors in `page.tsx` and nested components. It does **not** catch errors thrown inside the `layout.tsx` of the same folder!
If an error is thrown in the Root Layout (`app/layout.tsx`), the entire app dies. To catch errors in the Root Layout, you must use a special file called **`app/global-error.tsx`**. It replaces the root HTML document entirely when a catastrophic failure occurs.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `"use client"`

**The mistake:** A developer writes an `error.tsx` file but forgets to put `"use client"` at the top.

**Why it's wrong:** Next.js will throw a massive build error. React Error Boundaries are a client-side React feature (they rely on lifecycle methods under the hood). Server Components cannot act as Error Boundaries.
**Golden Rule:** Always start `error.tsx` and `global-error.tsx` with `"use client"`.

---

### Mistake 2: Omitting `'use client'` from `error.tsx` Files

**The mistake:** Creating `error.tsx` without the `'use client'` directive.

**Why it's wrong:** Next.js error boundaries MUST be Client Components because they encapsulate React error state and provide recovery retry handlers (`reset()`).

*Incorrect:*
```typescript
// app/error.tsx
export default function Error({ error, reset }) { ... } // ❌ Build error: error.tsx must be a Client Component!
```

*Fix:*
```typescript
// app/error.tsx
'use client'; // Required for error boundary components
export default function Error({ error, reset }: { error: Error; reset: () => void }) { ... }
```

---

### Mistake 3: Expecting `error.tsx` to Catch Errors Originating from its Same-Level `layout.tsx`

**The mistake:** Adding `app/dashboard/error.tsx` expecting it to catch runtime errors thrown inside `app/dashboard/layout.tsx`.

**Why it's wrong:** An `error.tsx` boundary catches errors ONLY for its child sub-segments. Errors inside a layout component MUST be caught by an `error.tsx` in a parent directory.

*Incorrect:*
```tsx
/* Expecting error.tsx to catch errors inside same-folder layout.tsx */
```

*Fix:*
```tsx
/* Move error.tsx to parent folder or use global-error.tsx for root layout errors */
```


---

## 5. Practice Exercises

### Exercise 1: Isolating Route Failures with `error.tsx`

**Scenario:**
Create `app/dashboard/error.tsx` to handle failures inside the `/dashboard` route segment.

**Requirements:**
1. Mark file with `"use client"`.
2. Export component accepting `{ error, reset }`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/dashboard/error.tsx
> "use client";
> 
> export default function DashboardError({
>   error,
>   reset
> }: {
>   error: Error & { digest?: string };
>   reset: () => void;
> }) {
>   return (
>     <div className="p-6 bg-amber-50 text-amber-900 rounded-lg">
>       <h2 className="text-xl font-bold">Failed to load Dashboard data</h2>
>       <p className="mt-2 text-sm">{error.message}</p>
>       <button
>         onClick={() => reset()}
>         className="mt-4 px-4 py-2 bg-amber-700 text-white rounded"
      >
>         Reload Dashboard Segment
>       </button>
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `error.tsx` automatically wraps sibling `page.tsx` and child segments in a React Error Boundary.
> 2. `error.tsx` MUST be declared as a Client Component using `"use client"`.
> 3. Prevents dashboard errors from crashing the outer root layout.
> 
---

### Exercise 2: Recovering Route State with `reset()` and `router.refresh()`

**Scenario:**
Combine `reset()` with `router.refresh()` to fetch fresh server data when retrying a failed route.

**Requirements:**
1. Execute `startTransition(() => { router.refresh(); reset(); })`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";
> 
> import { useRouter } from "next/navigation";
> import { startTransition } from "react";
> 
> export default function RouteError({
>   error,
>   reset
> }: {
>   error: Error;
>   reset: () => void;
> }) {
>   const router = useRouter();
> 
>   function handleRetry() {
>     startTransition(() => {
>       router.refresh();
>       reset();
>     });
>   }
> 
>   return (
>     <div>
>       <p>Error: {error.message}</p>
>       <button onClick={handleRetry}>Refresh Data & Retry</button>
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `reset()` re-renders the failed client component tree but does NOT re-execute Server Component data fetches alone.
> 2. `router.refresh()` re-fetches Server Components from the server.
> 3. Wrapping both in `startTransition` performs a complete, synchronized retry.
> 
---

### Exercise 3: Handling Global Root Layout Errors with `global-error.tsx`

**Scenario:**
Create `app/global-error.tsx` to handle errors originating inside `app/layout.tsx`.

**Requirements:**
1. Define `<html>` and `<body>` tags in `global-error.tsx`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/global-error.tsx
> "use client";
> 
> export default function GlobalError({
>   error,
>   reset
> }: {
>   error: Error & { digest?: string };
>   reset: () => void;
> }) {
>   return (
>     <html lang="en">
>       <body className="p-8 bg-slate-900 text-white">
>         <h1 className="text-2xl font-bold">Critical Application Error</h1>
>         <p className="mt-2">{error.message}</p>
>         <button onClick={() => reset()} className="mt-4 px-4 py-2 bg-blue-600 rounded">
>           Hard Reset
>         </button>
>       </body>
>     </html>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `error.tsx` does NOT catch errors thrown inside the same folder's `layout.tsx`.
> 2. `global-error.tsx` handles errors occurring in the root `app/layout.tsx` file.
> 3. Must include its own `<html>` and `<body>` tags because the root layout was unmounted.
> 
---


## 6. Related Terms
- [React Error Boundaries](error_boundaries.md) — The native React feature that Next.js wraps to create this file.
- [`not-found.tsx` & `notFound()`](../level_04/not_found.md) — A specific type of error file for 404s.
- [`loading.tsx`](loading.md) — Related concept: `loading.tsx`.
- [`page.tsx`](page.md) — Page component.

---

## 7. Key Takeaways
- **`error.tsx`** catches unexpected errors in your route and displays a fallback UI, preventing the whole app from crashing.
- It MUST be a Client Component (`"use client"`).
- It receives an `error` object and a `reset()` function to allow the user to retry the action.
- It does not catch errors in the `layout.tsx` of the same folder (they bubble up to the parent folder's error boundary).
- **`global-error.tsx`** is used specifically to catch errors in the Root Layout.
