# `not-found.tsx` & `notFound()`

> **Level 4 — Advanced Routing**
> A specialized error boundary file and a server-side function used specifically to handle 404 (Not Found) errors when data doesn't exist or a route is invalid.

---

## 1. Prerequisites
- [`error.tsx` & `global-error.tsx`](../level_02/error.md) — The general error boundary. `not-found` is a specific version of this.
- [React Server Components (RSC)](../level_01/rsc.md) — The environment where the `notFound()` function is executed.

---

## 2. Term Category
- **Routing / Error Handling**

---

## 3. Environment Context
- **Server Only (`notFound()`) / Server or Client (`not-found.tsx`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If a user goes to `/blog/nextjs-tips`, and you query your database for that post, what happens if the post was deleted? 
You shouldn't throw a generic Error (which triggers `error.tsx` and says "Something went wrong"). You want to specifically tell the user and the search engines: "This specific resource does not exist (404)".
Next.js provides a specialized function `notFound()` to throw this exact error, and a specialized file `not-found.tsx` to catch it and display a friendly UI.

### (2) The `not-found.tsx` File
You place this file in a route segment to provide a custom 404 UI for that specific section of your app.

```tsx
// app/blog/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div>
      <h2>Blog Post Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/blog">Return to Blog Home</Link>
    </div>
  );
}
```

### (3) The `notFound()` Function
This is a Server-Side function. You call it inside your `page.tsx` when a database query comes up empty.

```tsx
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import db from '@/lib/db';

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await db.post.findUnique({ where: { slug: params.slug } });

  if (!post) {
    // 🚨 This stops execution immediately and triggers the closest not-found.tsx!
    notFound(); 
  }

  return <h1>{post.title}</h1>;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying on `error.tsx` for 404s

**The mistake:** A developer writes: `if (!post) throw new Error("404 Not Found")`.

**Why it's wrong:** Throwing a standard Error triggers `error.tsx`. It will return an HTTP 500 (Internal Server Error) to the browser instead of an HTTP 404. Search engines will think your server is broken, rather than understanding that the specific page is gone.
**Golden Rule:** Always use `notFound()` when a resource is missing so Next.js can send the correct HTTP 404 status code.

---

### Mistake 2: Attempting to Call `notFound()` inside Event Handlers or Client Callbacks

**The mistake:** Writing `async function handleClick() { if (error) notFound(); }`.

**Why it's wrong:** `notFound()` works by throwing a special Next.js internal exception caught during RENDERING. Calling `notFound()` inside event handlers does not trigger the 404 view.

*Incorrect:*
```typescript
function handleClick() {
  if (!item) notFound(); // ❌ Does not trigger not-found UI from event handler!
}
```

*Fix:*
```typescript
// Call notFound() during Server Component rendering:
export default async function Page({ params }) {
  const item = await getItem(params.id);
  if (!item) notFound(); // Triggers not-found.tsx UI
}
```

---

### Mistake 3: Adding `'use client'` Directive to `not-found.tsx` Components unnecessarily

**The mistake:** Adding `'use client'` to a static `not-found.tsx` 404 page.

**Why it's wrong:** `not-found.tsx` can be a Server Component by default, reducing client JS bundle size. Add `'use client'` ONLY if interactive client hooks are required.

*Incorrect:*
```typescript
// app/not-found.tsx
'use client'; // ❌ Unnecessary Client Component directive for static 404 page!
```

*Fix:*
```typescript
// app/not-found.tsx (Server Component by default)
export default function NotFound() {
  return <div><h2>404 - Page Not Found</h2></div>;
}
```


---

## 6. Practice Exercises

### Exercise 1: Unmatched URLs

**Problem:** You have a `app/not-found.tsx` file at the root. A user types a completely random URL into their browser: `yoursite.com/asdf123`. You don't have a folder for `asdf123`. What happens?

**Expected output:**
> [!check]- Answer
> ```text
> Next.js automatically renders `app/not-found.tsx`!
> The `not-found.tsx` file serves two purposes:
> 1. It catches programmatic `notFound()` function calls.
> 2. It automatically acts as the fallback UI for any URLs that do not match your folder structure.
> ```
> - Think about what happens when the router can't find a matching folder.

---

### Exercise 2: notFound Function Trigger Pattern

**Problem:** Write async Server Component `app/posts/[id]/page.tsx` fetching post and calling `notFound()` if post is null.

**Expected output:**
> [!check]- Answer
> ```tsx
> import { notFound } from 'next/navigation'; export default async function Page({ params }: { params: { id: string } }) { const post = await getPost(params.id); if (!post) notFound(); return <h1>{post.title}</h1>; }
> ```
> - `notFound()` throws a 404 rendering exception.
> 
> ```tsx
> import { notFound } from 'next/navigation';
> 
> export default async function Page({
>   params
> }: {
>   params: { id: string }
> }) {
>   const post = await getPost(params.id);
>   if (!post) notFound();
>   
>   return <h1>{post.title}</h1>;
> }
> ```

---

### Exercise 3: Root vs Local not-found.tsx Scope

**Problem:** How does Next.js handle 404 UI when a sub-folder lacks a local `not-found.tsx` file?

**Expected output:**
> [!check]- Answer
> ```text
> Next.js bubbles up the directory tree until it finds the nearest parent not-found.tsx boundary (or root app/not-found.tsx).
> ```
> - 404 exceptions bubble up to the nearest parent `not-found.tsx` boundary.
> 
> ```text
> Sub-route 404 -> Local not-found.tsx -> Root app/not-found.tsx
> ```


---

## 7. Related Terms
- [`error.tsx` & `global-error.tsx`](../level_02/error.md) — Used for unexpected runtime crashes, not missing data.
- [`redirect()` & `permanentRedirect()`](redirect.md) — Another server-side function that stops execution and manipulates routing.

---

## 8. Key Takeaways
- **`notFound()`** is a server-side function you call when a database query or API request returns nothing.
- Calling it immediately halts execution and throws a specific Next.js error.
- **`not-found.tsx`** catches that error and displays a custom UI, while returning an HTTP 404 status code to the browser.
- The root `app/not-found.tsx` automatically catches any invalid URLs that users type in.
