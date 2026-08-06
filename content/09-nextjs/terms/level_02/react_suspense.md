# React Suspense

> **Level 2 — App Router UI Elements**
> A built-in React component that intercepts pending promises thrown by child components during rendering, displaying a fallback UI until the data resolves.

---

## 1. Prerequisites
- [React Components](../level_01/react_components.md) — The visual units wrapped inside the boundary.
- [React Server Components (RSC)](../level_01/rsc.md) — The asynchronous server components caught by Suspense.

---

## 2. Term Category

**Framework Architecture** (Asynchronous UI Streaming Boundary): React `<Suspense>` manages async component data loading states, enabling HTML streaming over open HTTP connections.



---

## 3. Explanation

### Environment Context
- **Universal** (Runs on the server to structure HTML streaming, and operates on the client to manage dynamic views).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Managing Async Component Boundaries with `<Suspense>`

**Scenario:**
Wrap an async data-fetching component inside React `<Suspense>` with a fallback loading card.

**Requirements:**
1. Use `<Suspense fallback={<Fallback />}>`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import { Suspense } from "react";
> import SlowProfileWidget from "./SlowProfileWidget";

export default function ProfilePage() {
  return (
    <main className="p-6">
      <h1>User Profile</h1>
      <Suspense fallback={<div>Loading Profile Widget...</div>}>
        <SlowProfileWidget />
      </Suspense>
    </main>
  );
}
```

> #### Technical Explanation
>
> 1. React `<Suspense>` intercepts asynchronous Promises thrown during component rendering.
> 2. Displays fallback UI until child async components resolve.
> 3. Enables HTML streaming over HTTP connections in Next.js App Router.

---

### Exercise 2: Nesting Parallel Suspense Boundaries

**Scenario:**
Render two slow widgets (`<WeatherWidget />` and `<NewsWidget />`) inside parallel independent `<Suspense>` boundaries.

**Requirements:**
1. Wrap widgets in separate `<Suspense>` blocks.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import { Suspense } from "react";

export default function Portal() {
  return (
    <div className="grid grid-cols-2 gap-4 p-6">
      <Suspense fallback={<p>Loading Weather...</p>}>
        <WeatherWidget />
      </Suspense>
      <Suspense fallback={<p>Loading News...</p>}>
        <NewsWidget />
      </Suspense>
    </div>
  );
}
```

> #### Technical Explanation
>
> 1. Parallel `<Suspense>` boundaries resolve independently as data becomes available.
> 2. Fast widgets render immediately without waiting for slower sibling widgets to finish.
> 3. Maximizes UI responsiveness and visual streaming.

---

### Exercise 3: Handling Errors inside Suspended Async Trees

**Scenario:**
Combine `<Suspense>` with `error.tsx` or `<ErrorBoundary>` to catch async component rendering failures.

**Requirements:**
1. Wrap `<Suspense>` inside Error Boundary.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import { Suspense } from "react";
> import { CustomErrorBoundary } from "./CustomErrorBoundary";

export default function SafeView() {
  return (
    <CustomErrorBoundary>
      <Suspense fallback={<div>Loading Async Feed...</div>}>
        <AsyncFeed />
      </Suspense>
    </CustomErrorBoundary>
  );
}
```

> #### Technical Explanation
>
> 1. If an async component inside `<Suspense>` throws an unhandled rejection, it bubbles to the nearest Error Boundary.
> 2. Combining Error Boundaries and `<Suspense>` handles both loading states and error states cleanly.
> 3. Standard pattern for resilient async UI components.

---




---

## 6. Related Terms
- [`loading.tsx`](loading.md) — The special Next.js file that wraps routes in Suspense boundaries automatically.
- [React Server Components (RSC)](../level_01/rsc.md) — The async components caught by Suspense.
- [Streaming with `<Suspense>`](../level_05/streaming.md) — Related concept: Streaming with `<Suspense>`.
- [Partial Prerendering (PPR)](../level_08/ppr.md) — Related concept: Partial Prerendering (PPR).

---

## 7. Key Takeaways
- React Suspense provides a declarative fallback mechanism for pending asynchronous operations.
- It catches pending Promises thrown by child components during render.
- Next.js uses Suspense to stream HTML fragments to the client as they finish rendering.
- Keep Suspense boundaries fine-grained around slow components rather than wrapping entire layouts.
