# `not-found.tsx` & `notFound()`

> **Level 4 — Advanced Routing**
> A specialized error boundary file and a server-side function used specifically to handle 404 (Not Found) errors when data doesn't exist or a route is invalid.

---

## 1. Prerequisites
- [`error.tsx` & `global-error.tsx`](../level_02/error.md) — The general error boundary. `not-found` is a specific version of this.
- [React Server Components (RSC)](../level_01/rsc.md) — The environment where the `notFound()` function is executed.

---

## 2. Term Category

**Routing & Layouts** (Segment Not Found UI Component): `not-found.tsx` renders custom 404 UI when `notFound()` is invoked inside a route segment.



---

## 3. Explanation

### Environment Context
- **Server Only (`notFound()`) / Server or Client (`not-found.tsx`)**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Customizing 404 UI with `not-found.tsx`

**Scenario:**
Create `app/not-found.tsx` to display a custom styled 404 page for missing URL routes.

**Requirements:**
1. Export default React component in `app/not-found.tsx`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/not-found.tsx
> import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-4xl font-bold text-red-600">404 - Page Not Found</h1>
      <p className="mt-2 text-gray-600">The requested resource could not be found.</p>
      <Link href="/" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
        Return Home
      </Link>
    </main>
  );
}
```

> #### Technical Explanation
>
> 1. `not-found.tsx` automatically renders when an un-matched URL path is requested or `notFound()` is invoked.
> 2. Replaces browser default 404 text pages with styled React UI components.
> 3. Server-rendered for optimal search engine indexing.

---

### Exercise 2: Programmatically Triggering 404 with `notFound()`

**Scenario:**
Invoke `notFound()` inside a dynamic product page when database lookup fails.

**Requirements:**
1. Import `notFound` from `next/navigation`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/products/[id]/page.tsx
> import { notFound } from "next/navigation";

async function getProduct(id: string) {
  const res = await fetch(`https://api.example.com/products/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export default async function ProductPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound(); // Immediately halts execution and renders not-found.tsx
  }

  return <h1>Product: {product.title}</h1>;
}
```

> #### Technical Explanation
>
> 1. `notFound()` throws a specialized error that Next.js catches to render `not-found.tsx`.
> 2. Returns an HTTP 404 status code header to the browser and web crawlers.
> 3. Standard data fetching guard pattern.

---

### Exercise 3: Scoping Segment-Specific `not-found.tsx`

**Scenario:**
Create a segment-specific `app/docs/not-found.tsx` for documentation 404 errors.

**Requirements:**
1. Place `not-found.tsx` in `app/docs/` directory.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/docs/not-found.tsx
> export default function DocsNotFound() {
>   return (
>     <div className="p-6 bg-slate-100 rounded">
>       <h2>Documentation Article Not Found</h2>
>       <p>Please check the doc URL path or search our index.</p>
>     </div>
>   );
> }
> ```

> #### Technical Explanation
>
> 1. `not-found.tsx` can be nested inside sub-folders (`app/docs/`) to render context-aware 404 UI.
> 2. Preserves the outer `app/docs/layout.tsx` shell while displaying the 404 notice.
> 3. Contextual error handling design.

---




---

## 6. Related Terms
- [`error.tsx` & `global-error.tsx`](../level_02/error.md) — Used for unexpected runtime crashes, not missing data.
- [`redirect()` & `permanentRedirect()`](redirect.md) — Another server-side function that stops execution and manipulates routing.

---

## 7. Key Takeaways
- **`notFound()`** is a server-side function you call when a database query or API request returns nothing.
- Calling it immediately halts execution and throws a specific Next.js error.
- **`not-found.tsx`** catches that error and displays a custom UI, while returning an HTTP 404 status code to the browser.
- The root `app/not-found.tsx` automatically catches any invalid URLs that users type in.
