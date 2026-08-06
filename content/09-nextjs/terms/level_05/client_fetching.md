# Client-side Fetching (SWR / React Query)

> **Level 5 — Data Fetching**
> The process of fetching data dynamically in the browser using Client Components, typically reserved for highly interactive, user-specific data that doesn't need SEO.

---

## 1. Prerequisites
- [Client Components (`"use client"`)](../level_01/client_components.md) — The environment where this takes place.
- [Server-side Fetching (Extended `fetch`)](fetch.md) — The default fetching method you are opting out of.

---

## 2. Term Category

**Data Fetching & Caching** (Client-Side Data Fetching Hooks): Client-side data fetching uses SWR, React Query, or `useEffect` to fetch data inside Client Components after initial page hydration.



---

## 3. Explanation

### Environment Context
- **Client Only**

### (1) Design Motivation — "Why did we design this?"
Next.js aggressively pushes you to fetch data on the Server using Server Components. It's faster, more secure, and better for SEO.
However, sometimes you *must* fetch data on the client. 
For example: An infinite-scrolling social media feed. The server can render the first 10 posts, but as the user scrolls down, the browser needs to fetch posts 11-20 dynamically without reloading the page. 
Or, a stock trading dashboard that needs to poll a live API every 2 seconds.
For these interactive scenarios, **Client-side Fetching** is required.

### (2) Why `useEffect` is frowned upon
In traditional React, you would use `useEffect` and `fetch` to get data.
In modern Next.js, doing this manually is considered an anti-pattern because it lacks caching, retry logic, and deduplication.
Instead, Vercel (the creators of Next.js) heavily recommend using a data-fetching library like **SWR** or **React Query**.

### (3) Fetching with SWR (stale-while-revalidate)
SWR is a lightweight React hook library for data fetching. It handles loading states, error states, and automatic caching in the browser.

```tsx
"use client"; // Must be a Client Component!

import useSWR from 'swr';

// A standard fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UserProfile() {
  // SWR automatically handles the fetching, caching, and revalidation!
  const { data, error, isLoading } = useSWR('/api/user/profile', fetcher);

  if (error) return <div>Failed to load</div>;
  if (isLoading) return <div>Loading...</div>;

  return <div>Welcome back, {data.name}!</div>;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Fetching SEO-critical data on the client

**The mistake:** A developer builds a public Blog platform. They use `useSWR` in a Client Component to fetch the blog post content.

**Why it's wrong:** Client-side fetching happens *after* the initial HTML is loaded. When a search engine bot scrapes the page, it sees `<div>Loading...</div>` instead of the blog content. Your site will have terrible SEO.
**Golden Rule:** If the data needs to be indexed by Google (blogs, products, marketing pages), ALWAYS fetch it on the Server. If the data is private, user-specific, or highly interactive (dashboards, infinite scroll, user settings), Client-side fetching is acceptable.

---

### Mistake 2: Using `useEffect` Data Fetching Without Handling Race Conditions or Unmounting

**The mistake:** Fetching data inside `useEffect` without cancellation logic when search query props change rapidly.

**Why it's wrong:** Rapid query parameter changes create race conditions where slow responses from previous queries overwrite newer response state. Use SWR, React Query, or `AbortController`.

*Incorrect:*
```typescript
useEffect(() => {
  fetch(`/api/search?q=${query}`).then(r => r.json()).then(setData); // ❌ Race condition vulnerability!
}, [query]);
```

*Fix:*
```typescript
import useSWR from 'swr';
// SWR handles caching, deduplication, and race conditions automatically:
const { data, error } = useSWR(`/api/search?q=${query}`, fetcher);
```

---

### Mistake 3: Performing Sensitive Un-Authenticated Data Fetches in Client Components

**The mistake:** Fetching private user data directly from client components using exposed database tokens.

**Why it's wrong:** Client-side fetch requests expose API endpoints and headers in the browser Network tab. Fetch sensitive data inside Server Components or Route Handlers.

*Incorrect:*
```tsx
/* Client Component fetching private DB data directly with client API token */
```

*Fix:*
```tsx
/* Fetch private data inside Server Components where tokens remain hidden on the server */
```


---

## 5. Practice Exercises

### Exercise 1: Client-Side Data Fetching with SWR

**Scenario:**
Fetch real-time user profile data in a Client Component using `useSWR()`.

**Requirements:**
1. Import `useSWR` inside `"use client"` component.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UserProfile() {
  const { data, error, isLoading } = useSWR("/api/user", fetcher);

  if (isLoading) return <div>Loading Profile...</div>;
  if (error) return <div>Failed to load profile.</div>;

  return <div>Welcome, {data.name}</div>;
}
```

> #### Technical Explanation
>
> 1. `useSWR()` manages client-side caching, revalidation, focus tracking, and optimistic UI updates.
> 2. `fetcher` function handles the underlying HTTP network request execution.
> 3. Reduces boilerplate code compared to raw `useEffect` + `useState` fetching.

---

### Exercise 2: Implementing Optimistic UI Updates in Client Components

**Scenario:**
Use React `useOptimistic()` to instantly update UI state before a server mutation resolves.

**Requirements:**
1. Use `useOptimistic(state, updateFn)` hook.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> "use client";

import { useOptimistic } from "react";

export default function CommentList({ comments }: { comments: string[] }) {
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment: string) => [...state, newComment]
  );

  async function handleSubmit(formData: FormData) {
    const text = formData.get("text") as string;
    addOptimisticComment(text); // Instant UI update!
    // Execute Server Action...
  }

  return (
    <div>
      <form action={handleSubmit}>
        <input name="text" required />
        <button type="submit">Post Comment</button>
      </form>
      <ul>
        {optimisticComments.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </div>
  );
}
```

> #### Technical Explanation
>
> 1. `useOptimistic()` displays immediate speculative state changes while background server requests resolve.
> 2. Automatically rolls back state if the server request fails.
> 3. Delivers zero-latency user experience for interactive forms.

---

### Exercise 3: Architectural Decision Matrix: RSC vs Client Fetching

**Scenario:**
Formulate a selection decision matrix comparing Server Component data fetching against Client-side fetching.

**Requirements:**
1. Contrast bundle size, initial paint, SEO, and interactive frequency.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Data Fetching Selection Matrix:
> - Server Component (RSC): Zero client bundle weight, direct DB access, fast initial HTML paint, excellent SEO. Use for initial page loads & static feeds.
> - Client Component (SWR/React Query): Adds client JS dependencies, post-mount polling, instant cached updates. Use for real-time notifications & highly interactive forms.
> ```

> #### Technical Explanation
>
> 1. Prefer Server Component fetching by default for performance and security.
> 2. Reserve client-side fetching for post-mount user polling or real-time web sockets.
> 3. Primary Next.js data architecture rule.

---




---

## 6. Related Terms
- [Server-side Fetching (Extended `fetch`)](fetch.md) — The default and preferred fetching method.
- [Route Handlers (`route.ts`)](../level_07/route_handlers.md) — The Next.js API endpoints that client-side `fetch` usually calls.

---

## 7. Key Takeaways
- **Client-side Fetching** is done inside `"use client"` components after the initial page load.
- It is ideal for private, highly dynamic, or user-interactive data (like infinite scroll or polling).
- It is terrible for SEO because search bots usually don't wait for client-side network requests to resolve.
- Never use plain `useEffect` for data fetching. Always use a library like **SWR** or **React Query** to handle caching, loading states, and deduplication.
