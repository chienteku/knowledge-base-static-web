# Streaming with `<Suspense>`

> **Level 5 — Data Fetching**
> A rendering technique that allows Next.js to progressively send chunks of HTML to the browser as soon as they are ready, rather than waiting for all data fetching to finish.

---

## 1. Prerequisites
- [Server-side Fetching (Extended `fetch`)](../level_05/fetch.md) — The slow async operations that cause the need for streaming.
- [`loading.tsx`](../level_02/loading.md) — The file-system implementation of Suspense.

---

## 2. Term Category
- **Rendering Strategy / UX**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine a complex `Dashboard` Server Component. It fetches `User Profile` (takes 100ms) and `Revenue Analytics` (takes 3000ms).
Because `await` blocks execution, the server waits a full 3 seconds before generating *any* HTML. The user stares at a blank white screen for 3 seconds.
**Streaming** solves this. With streaming, the server instantly sends the static HTML (like the Navbar and Sidebar). It then sends the `User Profile` HTML a split second later. While the 3-second `Revenue Analytics` is still fetching, it sends a loading spinner to the browser. When the 3 seconds are up, it streams the final piece of HTML to the browser and swaps out the spinner.

### (2) How to implement Streaming
You use the native React `<Suspense>` boundary. You wrap the slow component in `<Suspense>`, and give it a `fallback` UI (like a spinner).

```tsx
import { Suspense } from 'react';
import RevenueAnalytics from './RevenueAnalytics'; // Slow component
import UserProfile from './UserProfile';           // Fast component

export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>
      
      {/* This renders almost instantly! */}
      <UserProfile /> 
      
      {/* This renders a spinner instantly, then swaps to the real data 3 seconds later! */}
      <Suspense fallback={<div>Loading analytics...</div>}>
        <RevenueAnalytics />
      </Suspense>
    </main>
  );
}
```

### (3) `loading.tsx` is just Suspense!
Remember `loading.tsx` from Level 2? Under the hood, Next.js simply wraps your entire `page.tsx` in a `<Suspense>` boundary, using `loading.tsx` as the fallback! 
Using `<Suspense>` manually allows for **granular streaming**—loading different parts of the same page at different times.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Awaiting data at the page level instead of the component level

**The mistake:** A developer fetches the 3-second analytics data at the top of `page.tsx`, then passes it down as a prop to `<RevenueAnalytics data={data} />` wrapped in Suspense.

**Why it's wrong:** `<Suspense>` only catches Promises thrown by its *children*. If you `await` the data in the parent `page.tsx`, you block the entire page from rendering for 3 seconds. The Suspense boundary never triggers.
**Golden Rule:** To utilize Streaming, push the data fetching *down* into the specific child component being wrapped by `<Suspense>`. Let the child do the `await fetch()`.

---

### Mistake 2: Blocking Page Rendering by Awaiting Slow Independent Fetches at Page Root

**The mistake:** Awaiting a 5-second analytics fetch at top-level `page.tsx` before returning any JSX.

**Why it's wrong:** Top-level `await` blocks the server from sending ANY HTML to the browser until the promise resolves. Wrap slow async sub-components in `<Suspense>` boundaries to stream HTML.

*Incorrect:*
```typescript
export default async function Page() {
  const slowData = await fetchSlowAnalytics(); // ❌ Blocks entire page render for 5 seconds!
  return <div>{slowData}</div>;
}
```

*Fix:*
```typescript
export default function Page() {
  return (
    <div>
      <h1>Instant Layout</h1>
      <Suspense fallback={<AnalyticsSkeleton />}>
        <SlowAnalyticsComponent /> {/* Streams in when ready */}
      </Suspense>
    </div>
  );
}
```

---

### Mistake 3: Using `loading.tsx` When Granular Suspense Component Boundaries Are Needed

**The mistake:** Relying solely on route-level `loading.tsx` when only a small sidebar widget is slow.

**Why it's wrong:** Route-level `loading.tsx` replaces the entire page area with a loading skeleton. Use inline `<Suspense>` boundaries around specific slow components to keep main content interactive.

*Incorrect:*
```tsx
/* Replacing whole page UI with loading.tsx skeleton when only 1 widget is slow */
```

*Fix:*
```tsx
/* Use localized inline <Suspense> boundaries around specific slow widgets */
```


---

## 6. Practice Exercises

### Exercise 1: Sequential vs Parallel Fetching

**Problem:** If you have `<FastComponent />` and `<SlowComponent />` rendered next to each other, and neither is wrapped in Suspense, what happens?

**Expected output:**
> [!check]- Answer
> ```text
> The entire page is blocked.
> Next.js Server Components render sequentially by default. The server will not send any HTML to the client until both the fast and slow components have finished fetching their data. This is why wrapping slow components in `<Suspense>` is critical for UX!
> ```
> - A chain is only as fast as its slowest link.

---

### Exercise 2: Granular Streaming Layout Setup

**Problem:** Write Page component rendering instant header text, wrapping slow `<Recommendations />` component in `<Suspense fallback={<Skeleton />}>`.

**Expected output:**
> [!check]- Answer
> ```tsx
> export default function Page() { return ( <div> <h1>Dashboard</h1> <Suspense fallback={<Skeleton />}><Recommendations /></Suspense> </div> ); }
> ```
> - Inline `<Suspense>` streams slow components without delaying instant layout text.
> 
> ```tsx
> import { Suspense } from 'react';
> import { Recommendations, Skeleton } from './components';
> 
> export default function Page() {
>   return (
>     <main>
>       <h1>Product Catalog</h1>
>       <Suspense fallback={<Skeleton />}>
>         <Recommendations />
>       </Suspense>
>     </main>
>   );
> }
> ```

---

### Exercise 3: HTTP 1.1 Chunked Transfer Encoding

**Problem:** Which network feature allows Next.js servers to stream HTML chunks progressively over a single HTTP connection?

**Expected output:**
> [!check]- Answer
> ```text
> HTTP/1.1 Chunked Transfer Encoding (Transfer-Encoding: chunked)
> ```
> - Transfer-Encoding: chunked streams partial HTML response chunks.
> 
> ```text
> Transfer-Encoding: chunked
> ```


---

## 7. Related Terms
- [`loading.tsx`](../level_02/loading.md) — The automatic page-level implementation of Streaming.
- [React Suspense](../level_02/react_suspense.md) — The React core primitive that powers this Next.js feature.

---

## 8. Key Takeaways
- **Streaming** allows the server to send HTML to the browser in chunks, rather than waiting for the entire page to finish rendering.
- It prevents slow database queries from blocking the entire UI.
- You implement granular streaming by wrapping slow Server Components inside React's **`<Suspense>`** boundary.
- To make Streaming work, the data fetching (`await`) MUST happen inside the child component, not the parent component.
