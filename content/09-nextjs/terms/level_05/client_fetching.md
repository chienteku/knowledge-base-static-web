# Client-side Fetching (SWR / React Query)

> **Level 5 — Data Fetching**
> The process of fetching data dynamically in the browser using Client Components, typically reserved for highly interactive, user-specific data that doesn't need SEO.

---

## 1. Prerequisites
- [Client Components (`"use client"`)](../level_01/client_components.md) — The environment where this takes place.
- [Server-side Fetching (Extended `fetch`)](../level_05/fetch.md) — The default fetching method you are opting out of.

---

## 2. Term Category
- **Data Fetching**

---

## 3. Environment Context
- **Client Only**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Combining Server and Client Fetching

**Problem:** How do you build an Infinite Scroll feed where the first 10 posts are great for SEO, but the rest load dynamically?

**Expected output:**
> [!check]- Answer
> ```text
> 1. Use a Server Component (`page.tsx`) to fetch the first 10 posts using `await fetch()`.
> 2. Pass those 10 posts as an `initialData` prop down to a Client Component (`<Feed initialData={posts} />`).
> 3. Inside the Client Component, use SWR/React Query initialized with that `initialData`.
> 4. As the user scrolls, the Client Component fetches posts 11-20 dynamically.
> ```
> - You can pass data from Server Components to Client Components as props!

---

### Exercise 2: SWR Client Data Fetching Pattern

**Problem:** Write Client Component using `useSWR('/api/user', fetcher)` displaying loading state, error, and user data.

**Expected output:**
> [!check]- Answer
> ```tsx
> 'use client'; import useSWR from 'swr'; const fetcher = (url: string) => fetch(url).then(r => r.json()); export function UserProfile() { const { data, error, isLoading } = useSWR('/api/user', fetcher); if (isLoading) return <div>Loading...</div>; if (error) return <div>Error</div>; return <div>{data.name}</div>; }
> ```
> - SWR provides stale-while-revalidate client fetching, caching, and loading states.
> 
> ```tsx
> 'use client';
> import useSWR from 'swr';
> 
> const fetcher = (url: string) => fetch(url).then(res => res.json());
> 
> export function UserProfile() {
>   const { data, error, isLoading } = useSWR('/api/user', fetcher);
>   
>   if (isLoading) return <div>Loading user...</div>;
>   if (error) return <div>Failed to load</div>;
>   return <div>Hello, {data.name}</div>;
> }
> ```

---

### Exercise 3: Server Component Data Fetching vs Client SWR

**Problem:** When should you prefer SWR / React Query client fetching over Server Component `fetch()`?

**Expected output:**
> [!check]- Answer
> ```text
> When component data requires frequent real-time client polling, optimistic UI updates, or user-triggered refetching without full page reloads.
> ```
> - Client fetching (SWR) is ideal for polling and optimistic UI mutations.
> 
> ```text
> SWR = Real-time client polling & optimistic updates;
> RSC = Initial page load SEO & server rendering.
> ```


---

## 7. Related Terms
- [Server-side Fetching](../level_05/fetch.md) — The default and preferred fetching method.
- [Route Handlers](../level_07/route_handlers.md) — The Next.js API endpoints that client-side `fetch` usually calls.

---

## 8. Key Takeaways
- **Client-side Fetching** is done inside `"use client"` components after the initial page load.
- It is ideal for private, highly dynamic, or user-interactive data (like infinite scroll or polling).
- It is terrible for SEO because search bots usually don't wait for client-side network requests to resolve.
- Never use plain `useEffect` for data fetching. Always use a library like **SWR** or **React Query** to handle caching, loading states, and deduplication.
