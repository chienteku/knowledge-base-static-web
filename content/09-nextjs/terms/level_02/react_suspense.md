# React Suspense

> **Level 2 — App Router UI Elements**
> A built-in React component that intercepts pending promises thrown by child components during rendering, displaying a fallback UI until the data resolves.

---

## 1. Prerequisites
- [React Components](../level_01/react_components.md) — The visual units wrapped inside the boundary.
- [React Server Components (RSC)](../level_01/rsc.md) — The asynchronous server components caught by Suspense.
---

## 2. Term Category
- **React Component Pattern**

---

## 3. Environment Context
- **Universal** (Runs on the server to structure HTML streaming, and operates on the client to manage dynamic views).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional React applications, loading states are managed imperatively. Developers have to declare a boolean flag `const [isLoading, setIsLoading] = useState(true)` in every stateful component, fetch the data, update the flag, and render conditionally:

```typescript
if (isLoading) return <LoadingSpinner />;
return <DataList data={data} />;
```

When multiple sibling components fetch data independently, this leads to a "loading screen puzzle," where different parts of the page pop into view at random times, causing layout shift. 

**React Suspense** solves this by providing a declarative way to handle loading states. Instead of checking flags inside components, components fetch data asynchronously, and a parent `<Suspense>` boundary catches the pending fetch Promise, showing a unified fallback UI until all children are ready.

---

### (2) Core Concept — Declarative Loading Boundaries
To use Suspense, wrap your asynchronous or lazy-loaded components inside the `<Suspense>` wrapper and provide a `fallback` component:

```typescript
// app/dashboard/page.tsx
import React, { Suspense } from 'react';
import UserProfile from '@/components/UserProfile'; // Asynchronous Server Component
import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>
      
      {/* 
        Next.js will render LoadingSkeleton immediately on the server.
        When UserProfile resolves its data, Next.js replaces the skeleton with the layout.
      */}
      <Suspense fallback={<LoadingSkeleton />}>
        <UserProfile />
      </Suspense>
    </main>
  );
}
```

---

### (3) Under the Hood: Streaming HTML
In Next.js, Suspense boundaries determine where the page layout can be split. The server renders everything outside the `<Suspense>` boundary immediately and streams it to the browser. While the user views the header and layout outlines, the server continues fetching the suspended data. Once the data resolves, the server streams the remaining HTML chunk down the same HTTP connection, swapping the placeholder in-place.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Wrapping the entire page in a single, top-level Suspense boundary

**The mistake:** Putting a single `<Suspense>` tag around your entire application content:

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* BAD: One slow query anywhere in the app blocks the entire page outline! */}
        <Suspense fallback={<p>Loading site...</p>}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
```

**Why it's wrong:** Wrapping everything in a single boundary turns your page loading experience into a monolithic block. If one small component (like a sidebar footer) is slow, the entire page remains hidden under the global loading fallback, defeating the purpose of layout streaming.

**Golden Rule:** Place Suspense boundaries close to the specific data-fetching leaf nodes to load layouts independently.

---

### Mistake 2: Placing `<Suspense>` Boundaries Below Async Data Fetching Components

**The mistake:** Wrapping `<Suspense>` INSIDE an async server component body.

**Why it's wrong:** A `<Suspense>` boundary MUST be placed **above** the async component tree in the JSX hierarchy. Placing it below or inside the async component prevents fallback rendering.

*Incorrect:*
```typescript
export default async function Page() {
  const data = await fetch(); // ❌ Await executes before Suspense boundary renders!
  return <Suspense fallback={<Spin />}>{data}</Suspense>;
}
```

*Fix:*
```typescript
export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <AsyncDataComponent /> {/* Suspense boundary wraps async component */}
    </Suspense>
  );
}
```

---

### Mistake 3: Forgetting `key` Props on Suspense Boundaries for Route Parameter Changes

**The mistake:** Using `<Suspense fallback={<Spin />}>` over an async component whose props change without updating the Suspense key.

**Why it's wrong:** If props change on an async component wrapped in Suspense, React does not show the fallback unless the `<Suspense key={params.id}>` prop changes.

*Incorrect:*
```tsx
<Suspense fallback={<Spinner />}>
  <AsyncProfile id={userId} /> <!-- ❌ Fallback doesn't show when userId changes! -->
</Suspense>
```

*Fix:*
```tsx
<Suspense key={userId} fallback={<Spinner />}>
  <AsyncProfile id={userId} /> <!-- Key forces Suspense fallback on ID change -->
</Suspense>
```


---

## 6. Practice Exercises

### Exercise 1: Nesting Suspense Blocks

**Problem:** You have a dashboard displaying a `<QuickStats />` list (fast query) and a `<RecentOrders />` table (slow query). Structure the page using Suspense so that stats render immediately while the orders table displays a spinner:

```typescript
// app/dashboard/page.tsx
import React, { Suspense } from 'react';
import QuickStats from '@/components/QuickStats';
import RecentOrders from '@/components/RecentOrders';

// Solution:
export default function Page() {
  return (
    <div>
      <QuickStats />
      
      <Suspense fallback={<p>Fetching orders...</p>}>
        <RecentOrders />
      </Suspense>
    </div>
  );
}
```

> [!check]- Answer
> - Only wrap the component that triggers the slow database fetch in `<Suspense>`.

---

### Exercise 2: Parallel Suspense Streaming Pattern

**Problem:** Write JSX layout streaming 2 independent async server components (`HeaderData` and `FeedData`) in parallel using 2 separate `<Suspense>` boundaries.

**Expected output:**
> [!check]- Answer
> ```tsx
> <div> <Suspense fallback={<HeaderSkeleton />}><HeaderData /></Suspense> <Suspense fallback={<FeedSkeleton />}><FeedData /></Suspense> </div>
> ```
> - Multiple `<Suspense>` boundaries stream independently in parallel.
> 
> ```tsx
> export default function Page() {
>   return (
>     <div className="space-y-6">
>       <Suspense fallback={<HeaderSkeleton />}>
>         <HeaderData />
>       </Suspense>
>       <Suspense fallback={<FeedSkeleton />}>
>         <FeedData />
>       </Suspense>
>     </div>
>   );
> }
> ```

---

### Exercise 3: Suspense vs loading.tsx

**Problem:** How does Next.js `loading.tsx` relate to React Suspense?

**Expected output:**
> [!check]- Answer
> ```text
> Next.js automatically wraps the page.tsx component tree in a React Suspense boundary using loading.tsx as the fallback prop.
> ```
> - `loading.tsx` is an automated file-convention wrapper for `<Suspense>`.
> 
> ```text
> <Suspense fallback={<Loading />}>
>   <Page />
> </Suspense>
> ```


---

## 7. Related Terms
- [`loading.tsx`](loading.md) — The special Next.js file that wraps routes in Suspense boundaries automatically.
- [React Server Components (RSC)](../level_01/rsc.md) — The async components caught by Suspense.
- [Streaming with `<Suspense>`](../level_05/streaming.md) — Related concept: Streaming with `<Suspense>`.
- [Partial Prerendering (PPR)](../level_08/ppr.md) — Related concept: Partial Prerendering (PPR).
---

## 8. Key Takeaways
- React Suspense provides a declarative fallback mechanism for pending asynchronous operations.
- It catches pending Promises thrown by child components during render.
- Next.js uses Suspense to stream HTML fragments to the client as they finish rendering.
- Keep Suspense boundaries fine-grained around slow components rather than wrapping entire layouts.
