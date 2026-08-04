# `generateStaticParams` Function

> **Level 8 — Rendering Strategies & Cache**
> A build-time Server function used to define the list of dynamic route parameters that should be pre-rendered as static pages (SSG) during compilation.

---

## 1. Prerequisites
- [Dynamic Routes (`[slug]`)](../level_03/dynamic_routes.md) — The dynamic parameters we are defining.

---

## 2. Term Category
- **Data Fetching**

---

## 3. Environment Context
- **Build-Time** (Executes on the server once during compilation to compile static file outputs).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Static rendering (SSG) is the gold standard for web performance. If a page is static, Next.js saves it as raw HTML and JSON files on disk. When a user requests that URL, the hosting provider serves it instantly from a Content Delivery Network (CDN) edge cache.

However, if your layout has dynamic segments (such as `/blog/[slug]`), Next.js has no way of knowing at compile-time which article slugs exist in your database. By default, Next.js is forced to render these pages dynamically at request-time.

The **`generateStaticParams`** function was designed to resolve this. It allows you to query your data source and return a list of active parameters, instructing Next.js to pre-compile them into static HTML assets.

---

### (2) Core Concept — Exporting Parameter Lists
Inside a dynamic `page.tsx` or `layout.tsx` file, export a named async function that returns an array of objects matching the dynamic route params:

```typescript
// app/posts/[id]/page.tsx
import React from 'react';
import { prisma } from '@/lib/db';

interface PageProps {
  params: { id: string };
}

// 1. Tell Next.js which IDs to pre-render at build-time
export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    select: { id: true },
  });

  // Returns: [{ id: '1' }, { id: '2' }, ...]
  return posts.map((post) => ({
    id: String(post.id),
  }));
}

// 2. The page component will render statically for each ID generated above
export default async function PostPage({ params }: PageProps) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
  });

  if (!post) return <h1>Not Found</h1>;

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

---

### (3) Controlling Ungenerated Routes: `dynamicParams`
What if a new post is added to the database *after* the build completes? You control Next.js's behavior using the `dynamicParams` route segment configuration:

-   `export const dynamicParams = true` (Default): If a user visits an ungenerated ID, Next.js generates it dynamically, caches it, and serves it.
-   `export const dynamicParams = false`: Next.js immediately throws a 404 error if the parameter was not returned by `generateStaticParams` at build-time.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Returning raw values instead of objects mapping to parameters

**The mistake:** Returning a flat array of strings inside `generateStaticParams`:

```typescript
// app/blog/[slug]/page.tsx
// BAD: Returns strings instead of param-mapping objects!
export async function generateStaticParams() {
  return ['first-post', 'second-post']; 
}
```

**Why it's wrong:** Next.js expects an array of objects where each object key matches the folder segment name exactly (e.g. `{ slug: 'first-post' }`). Returning raw strings will cause compile-time build failures.

**Golden Rule:** Always return an array of objects: `[{ myParamName: 'value' }]`.

---

### Mistake 2: Returning Plain String Arrays Instead of Parameter Objects in `generateStaticParams()`

**The mistake:** Returning `return ['1', '2', '3']` inside `generateStaticParams()`.

**Why it's wrong:** `generateStaticParams()` MUST return an array of objects matching parameter key names (e.g. `[{ id: '1' }, { id: '2' }]`). Returning raw strings causes build errors.

*Incorrect:*
```typescript
export async function generateStaticParams() {
  return ['1', '2', '3']; // ❌ Must return array of parameter objects!
}
```

*Fix:*
```typescript
export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }]; // Array of parameter objects
}
```

---

### Mistake 3: Configuring `export const dynamicParams = false` When New Un-Rendered Slugs Must Load at Runtime

**The mistake:** Setting `export const dynamicParams = false` on dynamic product pages when new products are added daily.

**Why it's wrong:** Setting `dynamicParams = false` causes Next.js to return a 404 for ANY parameter slug not pre-generated at build time. Use `dynamicParams = true` (default) for runtime fallback.

*Incorrect:*
```tsx
export const dynamicParams = false; // ❌ Un-rendered new products return 404!
```

*Fix:*
```tsx
export const dynamicParams = true; // Fallback renders new product pages at runtime on demand
```


---

### Mistake 4: Returning Plain String Arrays Instead of Parameter Objects in `generateStaticParams()`

**The mistake:** Returning `return ['1', '2', '3']` inside `generateStaticParams()`.

**Why it's wrong:** `generateStaticParams()` MUST return an array of objects matching parameter key names (e.g. `[{ id: '1' }, { id: '2' }]`). Returning raw strings causes build errors.

*Incorrect:*
```typescript
export async function generateStaticParams() {
  return ['1', '2', '3']; // ❌ Must return array of parameter objects!
}
```

*Fix:*
```typescript
export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }]; // Array of parameter objects
}
```

---

### Mistake 5: Configuring `export const dynamicParams = false` When New Un-Rendered Slugs Must Load at Runtime

**The mistake:** Setting `export const dynamicParams = false` on dynamic product pages when new products are added daily.

**Why it's wrong:** Setting `dynamicParams = false` causes Next.js to return a 404 for ANY parameter slug not pre-generated at build time. Use `dynamicParams = true` (default) for runtime fallback.

*Incorrect:*
```tsx
export const dynamicParams = false; // ❌ Un-rendered new products return 404!
```

*Fix:*
```tsx
export const dynamicParams = true; // Fallback renders new product pages at runtime on demand
```


---

### Mistake 6: Returning Plain String Arrays Instead of Parameter Objects in `generateStaticParams()`

**The mistake:** Returning `return ['1', '2', '3']` inside `generateStaticParams()`.

**Why it's wrong:** `generateStaticParams()` MUST return an array of objects matching parameter key names (e.g. `[{ id: '1' }, { id: '2' }]`). Returning raw strings causes build errors.

*Incorrect:*
```typescript
export async function generateStaticParams() {
  return ['1', '2', '3']; // ❌ Must return array of parameter objects!
}
```

*Fix:*
```typescript
export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }]; // Array of parameter objects
}
```

---

### Mistake 7: Configuring `export const dynamicParams = false` When New Un-Rendered Slugs Must Load at Runtime

**The mistake:** Setting `export const dynamicParams = false` on dynamic product pages when new products are added daily.

**Why it's wrong:** Setting `dynamicParams = false` causes Next.js to return a 404 for ANY parameter slug not pre-generated at build time. Use `dynamicParams = true` (default) for runtime fallback.

*Incorrect:*
```tsx
export const dynamicParams = false; // ❌ Un-rendered new products return 404!
```

*Fix:*
```tsx
export const dynamicParams = true; // Fallback renders new product pages at runtime on demand
```


---

## 6. Practice Exercises

### Exercise 1: Multi-parameter Routes

**Problem:** You have a nested dynamic route `app/shop/[category]/[productId]/page.tsx`. Write a `generateStaticParams` function that statically pre-renders two items:
- Category: `'shoes'`, Product ID: `'101'`
- Category: `'hats'`, Product ID: `'202'`

```typescript
// app/shop/[category]/[productId]/page.tsx
// Solution:
export async function generateStaticParams() {
  return [
    { category: 'shoes', productId: '101' },
    { category: 'hats', productId: '202' }
  ];
}
```

> [!check]- Answer
> - The objects in the returned array must contain keys for both `category` and `productId`.

---

### Exercise 2: generateStaticParams Setup Pattern

**Problem:** Write `generateStaticParams()` fetching top 100 post IDs from database for pre-rendering `app/posts/[id]/page.tsx`.

**Expected output:**
> [!check]- Answer
> ```typescript
> export async function generateStaticParams() { const posts = await db.post.findMany({ select: { id: true }, take: 100 }); return posts.map(post => ({ id: post.id })); }
> ```
> - `generateStaticParams()` map objects to route parameters.
> 
> ```typescript
> export async function generateStaticParams() {
>   const posts = await db.post.findMany({
>     select: { id: true },
>     take: 100
>   });
>   
>   return posts.map((post) => ({
>     id: post.id.toString()
>   }));
> }
> ```

---

### Exercise 3: Nested generateStaticParams Execution

**Problem:** How does `generateStaticParams()` behave when nested inside parent and child route segments (`/category/[cat]/[id]`)?

**Expected output:**
> [!check]- Answer
> ```text
> Next.js executes generateStaticParams() top-down from parent to child, generating all combinations of parent and child static routes.
> ```
> - Executes top-down, combining parent and child parameter combinations.
> 
> ```text
> Parent generateStaticParams() x Child generateStaticParams()
> ```


---

## 7. Related Terms
- [Static Rendering (SSG)](../level_08/ssg.md) — The output target.
- [Dynamic Routes (`[slug]`)](../level_03/dynamic_routes.md) — The syntax being structured.

---

## 8. Key Takeaways
- `generateStaticParams` informs the compiler which dynamic parameters to pre-build statically.
- The function must return an array of objects matching the segment variables.
- Use `export const dynamicParams = false` to reject visiting ungenerated paths.
- Data fetching inside `generateStaticParams` is automatically memoized and deduplicated.
- Keep the function restricted to Server Components; it cannot execute on the client.
