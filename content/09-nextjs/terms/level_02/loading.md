# `loading.tsx`

> **Level 2 — App Router UI Elements**
> A special file that automatically displays a fallback UI (like a spinner or skeleton) while the `page.tsx` in the same folder is busy fetching data on the server.

---

## 1. Prerequisites
- [React Suspense](react_suspense.md) — The core React feature that powers this file under the hood.
- [React Server Components (RSC)](../level_01/rsc.md) — The components doing the `async` data fetching.
---

## 2. Term Category
- **Routing / UI Architecture**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern Next.js, your `page.tsx` is usually an `async` Server Component. 
```tsx
export default async function Dashboard() {
  const data = await fetchDatabase(); // Takes 2 seconds
  return <div>{data}</div>;
}
```
If a user clicks a link to go to `/dashboard`, the server starts fetching the data. For 2 seconds, the user sees absolutely nothing happen. The browser just hangs.
**`loading.tsx`** solves this instantly. Next.js will instantly display the UI defined in `loading.tsx` while the `page.tsx` finishes its `await` promises.

### (2) The Syntax
It's just a standard React component.

```tsx
// app/dashboard/loading.tsx
export default function DashboardLoading() {
  // You can return a spinner, text, or a complex Skeleton layout!
  return <div className="spinner">Loading your dashboard...</div>;
}
```

### (3) How it works under the hood
Next.js takes your `loading.tsx` and automatically wraps your `page.tsx` inside a React `<Suspense>` boundary.
```tsx
// What Next.js does automatically:
<Suspense fallback={<DashboardLoading />}>
  <DashboardPage />
</Suspense>
```
Because of this, the Layout (`layout.tsx`) remains fully interactive while the `page.tsx` inside it is loading! The user can click the Navbar, then immediately click another link on the Navbar before the page even finishes loading.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Putting the `await` in the Layout instead of the Page

**The mistake:** A developer writes an `async` Layout that takes 3 seconds to fetch user data, and expects `loading.tsx` to show up.

**Why it's wrong:** `loading.tsx` only wraps the `page.tsx` (and its children) inside the same folder. It does **not** wrap the `layout.tsx`! If your layout blocks rendering with an `await`, the `loading.tsx` will not trigger, and the user will stare at a dead screen.
**Golden Rule:** Keep your layouts as fast and static as possible. Do your heavy `async` data fetching inside `page.tsx` so the `loading.tsx` skeleton can display properly.

---

### Mistake 2: Confusing `loading.tsx` with Client-Side `useState(true)` Loading Spinners

**The mistake:** Writing manual `if (loading) return <Spinner />` in page components instead of creating `loading.tsx`.

**Why it's wrong:** `loading.tsx` automatically creates a React Suspense boundary on the server, streaming immediate fallback UI to the browser while the page RSC resolves.

*Incorrect:*
```typescript
// app/page.tsx
if (isLoading) return <Spinner />; // ❌ Manual client loading state!
```

*Fix:*
```typescript
// app/loading.tsx
export default function Loading() {
  return <SkeletonLoader />; // Automatic Suspense fallback streaming
}
```

---

### Mistake 3: Creating Heavy Heavy-Weight Loading Skeletons That Cause Visual Jitter

**The mistake:** Creating `loading.tsx` skeletons with structural dimensions that differ drastically from the final rendered page.

**Why it's wrong:** Mismatched loading skeleton dimensions cause noticeable Cumulative Layout Shift (CLS) when real data loads. Match skeleton layout dimensions closely to final page layouts.

*Incorrect:*
```tsx
/* Loading skeleton height 100px vs final page height 600px -> Layout shift! */
```

*Fix:*
```tsx
/* Align skeleton heights and grids with final page layout structure */
```


---

## 6. Practice Exercises

### Exercise 1: Nested Loading States

**Problem:** You have `app/loading.tsx` (a generic spinner) and `app/dashboard/loading.tsx` (a dashboard skeleton). If the user navigates to `/dashboard`, which loading state is shown?

**Expected output:**
> [!check]- Answer
> ```text
> The `app/dashboard/loading.tsx` is shown.
> Next.js always uses the closest, most specific `loading.tsx` file to the page being rendered. This allows you to have highly specific loading skeletons for different parts of your app.
> ```
> - React Suspense boundaries catch the closest thrown promise.

---

### Exercise 2: loading.tsx Skeleton Pattern

**Problem:** Write an App Router `loading.tsx` component rendering a pulse skeleton placeholder grid.

**Expected output:**
> [!check]- Answer
> ```tsx
> export default function Loading() { return ( <div className="animate-pulse grid grid-cols-3 gap-4"> <div className="h-32 bg-gray-200 rounded" /> </div> ); }
> ```
> - `loading.tsx` renders fallback UI during route segment transitions.
> 
> ```tsx
> export default function Loading() {
>   return (
>     <div className="animate-pulse space-y-4">
>       <div className="h-8 bg-gray-200 rounded w-1/4" />
>       <div className="h-64 bg-gray-200 rounded" />
>     </div>
>   );
> }
> ```

---

### Exercise 3: Suspense Streaming Mechanism

**Problem:** Does `loading.tsx` block initial server response headers from reaching the client browser?

**Expected output:**
> [!check]- Answer
> ```text
> No. Next.js streams the loading.tsx fallback HTML immediately to the browser in the first HTTP chunk.
> ```
> - `loading.tsx` streams initial fallback HTML instantly.
> 
> ```text
> Instant Fallback HTML Stream -> RSC Payload Stream -> Hydrated Component
> ```


---

## 7. Related Terms
- suspense — The underlying React technology.
- [`error.tsx` & `global-error.tsx`](error.md) — The sister file that handles when the `await` fails instead of succeeds.
- [React Suspense](react_suspense.md) — Related concept: React Suspense.
- [Streaming with `<Suspense>`](../level_05/streaming.md) — Related concept: Streaming with `<Suspense>`.
- [`page.tsx`](page.md) — Page component.
---

## 8. Key Takeaways
- **`loading.tsx`** defines the fallback UI shown while the route's Server Components are resolving their `async` operations.
- It provides instant feedback to the user during navigation, preventing the app from feeling "frozen".
- It automatically wraps the `page.tsx` in a `<Suspense>` boundary.
- The `layout.tsx` remains fully visible and interactive while the `loading.tsx` is displayed inside it.
