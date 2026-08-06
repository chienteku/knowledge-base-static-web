# Streaming with `<Suspense>`

> **Level 5 — Data Fetching**
> A rendering technique that allows Next.js to progressively send chunks of HTML to the browser as soon as they are ready, rather than waiting for all data fetching to finish.

---

## 1. Prerequisites
- [Server-side Fetching (Extended `fetch`)](fetch.md) — The slow async operations that cause the need for streaming.
- [`loading.tsx`](../level_02/loading.md) — The file-system implementation of Suspense.

---

## 2. Term Category

**Rendering Strategy** (HTML & Component Streaming): Streaming UI delivers server-rendered HTML chunks progressively over an open HTTP connection using React `<Suspense>` boundaries.



---

## 3. Explanation

### Environment Context
- **Server & Client**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Streaming Route Pages with `loading.tsx`

**Scenario:**
Enable full route segment streaming for `/dashboard` by creating `app/dashboard/loading.tsx`.

**Requirements:**
1. Create `loading.tsx` skeleton UI.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/dashboard/loading.tsx
> export default function Loading() {
>   return (
>     <div className="p-6 animate-pulse space-y-4">
>       <div className="h-8 bg-gray-200 rounded w-1/3" />
>       <div className="h-64 bg-gray-200 rounded" />
>     </div>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. Next.js automatically wraps `page.tsx` in a React `<Suspense>` boundary when `loading.tsx` exists.
> 2. Streams the initial HTML layout and loading skeleton instantly over HTTP.
> 3. Once Server Component data resolves, Next.js streams inline script tags to swap the skeleton with final content.
> 
---

### Exercise 2: Selective Component Streaming with `<Suspense>`

**Scenario:**
Stream a slow comments widget (`<Comments />`) without blocking the primary article text rendering.

**Requirements:**
1. Wrap slow component in `<Suspense fallback={...}>`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import { Suspense } from "react";
> 
> async function Comments() {
>   const comments = await fetch("https://api.example.com/comments", { cache: "no-store" }).then(r => r.json());
>   return <ul>{comments.map((c: any) => <li key={c.id}>{c.text}</li>)}</ul>;
> }
> 
> export default function ArticlePage() {
>   return (
>     <article className="p-6">
>       <h1>Main Article Title</h1>
>       <p>Fast server-rendered article content body...</p>
>       
>       <Suspense fallback={<div>Loading Comments...</div>}>
>         <Comments />
>       </Suspense>
>     </article>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. Fast content (article title & body) renders and streams immediately to the browser.
> 2. Slow content (`<Comments />`) streams progressively as it resolves on the server.
> 3. Dramatically improves First Contentful Paint (FCP) and Time To First Byte (TTFB).
> 
---

### Exercise 3: Auditing HTTP Response Headers for Streaming

**Scenario:**
Verify that HTTP streaming is active by checking `Transfer-Encoding: chunked` headers.

**Requirements:**
1. Inspect HTTP response headers for streaming indicators.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Streaming HTTP Header Audit:
> - Response Header: Transfer-Encoding: chunked
> - Response Header: Content-Type: text/html; charset=utf-8
> ```
> 
> #### Technical Explanation
>
> 1. `Transfer-Encoding: chunked` indicates the HTTP server is streaming data in progressive chunks without specifying `Content-Length`.
> 2. Enables browsers to parse and render HTML chunks as they arrive over the wire.
> 3. Empirical verification of server HTML streaming architecture.
> 
---


## 6. Related Terms
- [`loading.tsx`](../level_02/loading.md) — The automatic page-level implementation of Streaming.
- [React Suspense](../level_02/react_suspense.md) — The React core primitive that powers this Next.js feature.
- [Partial Prerendering (PPR)](../level_08/ppr.md) — Related concept: Partial Prerendering (PPR).

---

## 7. Key Takeaways
- **Streaming** allows the server to send HTML to the browser in chunks, rather than waiting for the entire page to finish rendering.
- It prevents slow database queries from blocking the entire UI.
- You implement granular streaming by wrapping slow Server Components inside React's **`<Suspense>`** boundary.
- To make Streaming work, the data fetching (`await`) MUST happen inside the child component, not the parent component.
