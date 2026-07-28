# `React.cache()` Function

> **Level 5 — Data Fetching**
> A React server utility that memoizes the return value of custom functions (like database queries or file reads) for the duration of a single page request.

---

## 1. Prerequisites
- [Server-side Fetching (Extended `fetch`)](../level_05/fetch.md) — The request memoization behavior this function mimics for non-HTTP calls.
- [ORM (Object-Relational Mapping) & Prisma](../level_05/orm_prisma.md) — The database clients that require memoization.

---

## 2. Term Category
- **Data Fetching**

---

## 3. Environment Context
- **Server Only** (Memoization occurs within the server request rendering pipeline).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Next.js extends the standard web `fetch()` API with automatic **Request Memoization**. If you request the same API endpoint (`fetch('/api/user')`) in three different components during the same rendering pass, Next.js only executes the network request once. 

However, if you fetch data using a database ORM (like Prisma), a third-party SDK (like Firebase or Stripe), or raw file system calls (`fs.readFile`), Next.js cannot intercept the query because it is not an HTTP `fetch` call. If multiple nested components query the same user database record, the app executes duplicate database calls, wasting database resources.

**`React.cache()`** was designed to solve this. It provides a manual caching wrapper for non-fetch functions, enabling identical deduplication behavior.

---

### (2) Core Concept — Wrapping Custom Queries
You import `cache` from `react` (note: this is a server-only React API) and wrap your async function in it. **Always declare the wrapper at the module level (outside components):**

```typescript
// lib/queries.ts
import { cache } from 'react';
import { prisma } from './db';

// Wrap the database query function in cache()
export const getCachedUser = cache(async (id: string) => {
  console.log(`Executing Prisma query for user: ${id}`); // Only logs ONCE per request!
  return prisma.user.findUnique({
    where: { id },
  });
});
```

Now, multiple components can import and call `getCachedUser` without duplicate database query costs:

```typescript
// app/dashboard/layout.tsx
import { getCachedUser } from '@/lib/queries';

export default async function DashboardLayout({ children }) {
  const user = await getCachedUser('123'); // Query executes
  return <div>Header: {user.name} {children}</div>;
}
```

```typescript
// app/dashboard/page.tsx
import { getCachedUser } from '@/lib/queries';

export default async function DashboardPage() {
  const user = await getCachedUser('123'); // Returns cached result from memory instantly
  return <div>Main Content: {user.name}</div>;
}
```

---

### (3) Request Scope
`React.cache()` has a **Per-Request Lifecycle**. Unlike the Next.js Data Cache (which persists across requests and users), the memoization cache is instantiated when a request arrives and is completely destroyed after Next.js finishes rendering that specific page response. There is zero risk of User A seeing cached data belonging to User B.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Initializing the `cache` wrapper inside the component render body

**The mistake:** Wrapping a function in `cache()` inside a React component:

```typescript
// app/dashboard/page.tsx
import { cache } from 'react';

export default async function Page() {
  // BAD: Creates a new cache instance on every render pass!
  const getDbUser = cache(async () => { ... }); 
  const user = await getDbUser();
  return <div>{user.name}</div>;
}
```

**Why it's wrong:** The `cache` wrapper works by retaining a reference to the function instance. If you create the wrapper inside the component body, React instantiates a *new* wrapped function container every time the component renders, rendering the memoization useless.

**Golden Rule:** Always declare your `cache()` wrapped queries at the file scope level, outside your component definitions.

---

### Mistake 2: Attempting to Use `React.cache()` in Client Components

**The mistake:** Using `React.cache()` inside a file marked with `'use client'`.

**Why it's wrong:** `React.cache()` is a server-side request memoization utility designed for React Server Components. It is NOT available or supported in browser client components.

*Incorrect:*
```typescript
'use client';
import { cache } from 'react';
const getData = cache(async () => {}); // ❌ Client Component error!
```

*Fix:*
```typescript
// Use React.cache() in Server Components or server helper functions only
```

---

### Mistake 3: Passing Non-Primitive Object Literals to `React.cache()` Functions

**The mistake:** Calling a `React.cache()` memoized function with newly created object literals `{ id: 5 }` on every render.

**Why it's wrong:** `React.cache()` uses shallow reference equality (`Object.is`) to match arguments. Passing newly instantiated object literals creates different object references, bypassing cache memoization.

*Incorrect:*
```typescript
const getCachedUser = cache(async (options: { id: number }) => ...);
getCachedUser({ id: 5 }); // ❌ New object reference on every call bypasses cache!
```

*Fix:*
```typescript
// Pass primitive arguments (string, number) to memoized cache functions:
const getCachedUser = cache(async (id: number) => ...);
getCachedUser(5); // Primitive argument matches reference correctly
```


---

## 6. Practice Exercises

### Exercise 1: Wrap Database Call

**Problem:** Complete the file below to export a memoized database query that fetches user articles by category:

```typescript
// lib/db-queries.ts
import { cache } from 'react';
import { prisma } from './db';

// Solution:
export const getCachedArticles = cache(async (category: string) => {
  return prisma.article.findMany({
    where: { category }
  });
});
```

> [!check]- Answer
> - Wrap the database-fetching function in `cache` from the `'react'` package.

---

### Exercise 2: React.cache Function Memoization Pattern

**Problem:** Write `React.cache()` wrapper around async function `getUser(id: string)` deduplicating requests within a server render pass.

**Expected output:**
> [!check]- Answer
> ```typescript
> import { cache } from 'react'; export const getCachedUser = cache(async (id: string) => { return await db.user.findUnique({ where: { id } }); });
> ```
> - `cache()` from `react` memoizes async functions per request.
> 
> ```typescript
> import { cache } from 'react';
> 
> export const getCachedUser = cache(async (id: string) => {
>   console.log('Fetching user from DB:', id);
>   return await db.user.findUnique({ where: { id } });
> });
> ```

---

### Exercise 3: React.cache Lifespan Scope

**Problem:** What is the exact lifespan of data cached by `React.cache()`?

**Expected output:**
> [!check]- Answer
> ```text
> The duration of a single server HTTP request render pass (wiped when server render completes).
> ```
> - `React.cache()` scope is limited to a single server render request.
> 
> ```text
> Single HTTP Request Scope (Memoized per-render pass)
> ```


---

## 7. Related Terms
- [Server-side Fetching (Extended `fetch`)](../level_05/fetch.md) — The automatic request deduplication model.
- [ORM (Object-Relational Mapping) & Prisma](../level_05/orm_prisma.md) — The queries commonly optimized by `React.cache()`.

---

## 8. Key Takeaways
- `React.cache()` provides manual request memoization for non-fetch functions on the server.
- It prevents duplicate database, file-system, or SDK queries during a single render pass.
- Declare the cached function at the file level outside components.
- The memoization cache is short-lived: it is created on request start and destroyed when rendering completes.
- It does not persist across different user requests or browser refreshes.
