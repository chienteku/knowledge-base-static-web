# `generateStaticParams` Function

> **Level 8 — Rendering Strategies & Cache**
> A build-time Server function used to define the list of dynamic route parameters that should be pre-rendered as static pages (SSG) during compilation.

---

## 1. Prerequisites
- [Dynamic Routes (`[slug]`)](../level_03/dynamic_routes.md) — Dynamic route segments [id] in App Router.

---

## 2. Term Category

**Rendering Strategy** (Build-Time Route Prerendering): `generateStaticParams()` replaces `getStaticPaths` to pre-generate dynamic route segment parameters at build time.



---

## 3. Explanation

### Environment Context
- **Build-Time** (Executes on the server once during compilation to compile static file outputs).

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

## 4. Common Mistakes & Pitfalls

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


## 5. Practice Exercises

### Exercise 1: Prerendering Dynamic Parameter Routes

**Scenario:**
Prerender popular blog post slugs (`/blog/nextjs-15`, `/blog/react-19`) at build time using `generateStaticParams()`.

**Requirements:**
1. Export `generateStaticParams()` returning array of `{ slug: string }` objects.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/blog/[slug]/page.tsx
> export async function generateStaticParams() {
>   return [
>     { slug: "nextjs-15" },
>     { slug: "react-19" }
>   ];
> }
> 
> export default async function BlogPost({
>   params
> }: {
>   params: Promise<{ slug: string }>;
> }) {
>   const { slug } = await params;
>   return <h1>Post: {slug}</h1>;
> }
> ```
> 
> #### Technical Explanation
>
> 1. `generateStaticParams()` informs Next.js which dynamic parameter values to prerender at build time.
> 2. Generates static HTML files for matched routes during `next build`.
> 3. Speeds up initial page loads by serving pre-rendered HTML from CDN edge nodes.
> 
---

### Exercise 2: Handling Non-Prerendered Parameter Fallbacks

**Scenario:**
Configure `dynamicParams = true` to render un-prerendered slugs dynamically on demand.

**Requirements:**
1. Export `export const dynamicParams = true`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> export const dynamicParams = true; // Default behavior
> 
> export async function generateStaticParams() {
>   return [{ slug: "featured-1" }];
> }
> ```
> 
> #### Technical Explanation
>
> 1. `dynamicParams = true` allows dynamic slugs not returned by `generateStaticParams()` to be rendered on demand via SSR.
> 2. Setting `dynamicParams = false` returns a 404 page for any un-prerendered slug.
> 3. Flexible static site generation fallback control.
> 
---

### Exercise 3: Prerendering Nested Parent-Child Parameters

**Scenario:**
Prerender nested category and item routes (`app/[category]/[item]/page.tsx`).

**Requirements:**
1. Return array of `{ category: string, item: string }` objects.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/[category]/[item]/page.tsx
> export async function generateStaticParams() {
>   return [
>     { category: "electronics", item: "laptop" },
>     { category: "clothing", item: "jacket" }
>   ];
> }
> ```
> 
> #### Technical Explanation
>
> 1. For nested dynamic routes, `generateStaticParams()` returns objects containing all parent and child parameter keys.
> 2. Pre-computes full nested route paths during build time compilation.
> 3. Idiomatic multi-level SSG pattern.
> 
---


## 6. Related Terms
- [Static Site Generation (SSG)](ssg.md) — The output target.
- [Incremental Static Regeneration (ISR)](isr.md) — Related concept: Incremental Static Regeneration (ISR).

---

## 7. Key Takeaways
- `generateStaticParams` informs the compiler which dynamic parameters to pre-build statically.
- The function must return an array of objects matching the segment variables.
- Use `export const dynamicParams = false` to reject visiting ungenerated paths.
- Data fetching inside `generateStaticParams` is automatically memoized and deduplicated.
- Keep the function restricted to Server Components; it cannot execute on the client.
