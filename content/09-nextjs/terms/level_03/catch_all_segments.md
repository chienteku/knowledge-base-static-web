# Catch-all Segments (`[...slug]`)

> **Level 3 — Navigation & Routing Fundamentals**
> An advanced routing feature that allows a single dynamic folder to catch an infinite number of nested URL paths (slashes) into an array.

---

## 1. Prerequisites
- [JavaScript Rest Parameters (`...`)](rest_parameters.md) — The JS syntax that inspired this folder naming convention.

---

## 2. Term Category

**Routing & Layouts** (Catch-All Dynamic Route Resolution): Catch-all segments (`[...slug]`) match multiple nested URL path segments into an array of parameter strings.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
A standard Dynamic Route like `app/docs/[slug]/page.tsx` matches exactly one URL segment. It will match `/docs/intro`. But it will **fail** to match `/docs/intro/advanced/setup`.
What if you are building an Amazon-style category filter, or a documentation site with deeply nested hierarchies? You don't know if the URL will have 1 slash or 5 slashes! You want ONE route to handle all of them.
**Catch-all Segments** solve this. By adding three dots `...` inside the brackets, the folder acts like a vacuum, sucking up all subsequent URL segments and grouping them into an array.

### (2) The Syntax `[...folderName]`
```text
app/
  docs/
    [...slug]/
      page.tsx
```

If a user visits `/docs/a/b/c`, Next.js routes them to this page.
The `params.slug` will no longer be a string; it will be an **Array of strings**: `["a", "b", "c"]`.

```tsx
// app/docs/[...slug]/page.tsx
export default function DocsPage({ params }: { params: { slug: string[] } }) {
  // Let's say URL is: /docs/javascript/functions/arrow
  
  console.log(params.slug); 
  // Outputs: ["javascript", "functions", "arrow"]

  return <h1>Viewing section: {params.slug.join(' > ')}</h1>;
}
```

### (3) Optional Catch-all `[[...folderName]]`
There is one edge case. A standard `[...slug]` requires at least one parameter. It will match `/docs/a`, but it will **404 error** on the root `/docs` route!
If you want the route to catch the root `/docs` path AS WELL as the nested paths, you wrap the folder in double brackets: `[[...slug]]`. This is called an **Optional Catch-all**. If the user hits the root, `params.slug` will just be `undefined`.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Typing `params.slug` as a string

**The mistake:** A developer changes `[slug]` to `[...slug]`, but forgets to update their TypeScript interface.
```tsx
export default function Page({ params }: { params: { slug: string } }) { // ❌ Error waiting to happen
```

**Why it's wrong:** Because a catch-all route splits the URL by slashes, `params.slug` is inherently an Array (`string[]`). If you treat it like a string, your code will compile but behave bizarrely or crash at runtime when you try to use string methods on an Array.
**Golden Rule:** Always type catch-all parameters as `string[]`.

---

### Mistake 2: Confusing Catch-All `[...slug]` with Optional Catch-All `[[...slug]]` (404 Trap)

**The mistake:** Using `app/docs/[...slug]/page.tsx` and expecting it to match the root URL `/docs`.

**Why it's wrong:** Standard catch-all `[...slug]` requires at least ONE path segment (`/docs/a`). Visiting `/docs` returns 404. Use optional catch-all `[[...slug]]` to match root `/docs`.

*Incorrect:*
```tsx
// app/docs/[...slug]/page.tsx ❌ Visiting /docs returns 404!
```

*Fix:*
```typescript
// app/docs/[[...slug]]/page.tsx Matches /docs AND /docs/a/b/c
```

---

### Mistake 3: Expecting `params.slug` in Catch-All Routes to Be a String Instead of an Array

**The mistake:** Writing `params.slug.toLowerCase()` inside a catch-all route component.

**Why it's wrong:** In catch-all routes (`[...slug]`), `params.slug` is a **String Array** (e.g. `['a', 'b', 'c']`). Calling string methods directly throws a TypeError.

*Incorrect:*
```typescript
export default function Page({ params }: { params: { slug: string[] } }) {
  return <div>{params.slug.toLowerCase()}</div>; // ❌ TypeError: slug.toLowerCase is not a function!
}
```

*Fix:*
```typescript
export default function Page({ params }: { params: { slug?: string[] } }) {
  const path = params.slug?.join('/') ?? 'home'; // Join array elements into string path
  return <div>Path: {path}</div>;
}
```


---

## 5. Practice Exercises

### Exercise 1: Handling Multi-Segment Docs Paths with `[...slug]`

**Scenario:**
Create `app/docs/[...slug]/page.tsx` parsing multi-segment documentation paths (`/docs/v2/getting-started/installation`).

**Requirements:**
1. Access `params.slug` array prop in async Server Component.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/docs/[...slug]/page.tsx
> export default async function DocsPage({
>   params
> }: {
>   params: Promise<{ slug: string[] }>;
> }) {
>   const { slug } = await params;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Documentation Path</h1>
      <p>Segments: {slug.join(" / ")}</p>
    </main>
  );
}
```

> #### Technical Explanation
>
> 1. Catch-all folder syntax `[...slug]` matches all subsequent nested path segments into an array of strings.
> 2. Accessing `/docs/a/b/c` resolves `params.slug` as `['a', 'b', 'c']`.
> 3. Standard directory structure for CMS documentation systems.

---

### Exercise 2: Generating Static Parameters for Catch-All Routes

**Scenario:**
Prerender nested documentation paths at build time using `generateStaticParams()`.

**Requirements:**
1. Return array of `{ slug: string[] }` objects.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> export async function generateStaticParams() {
>   return [
>     { slug: ["v1", "overview"] },
>     { slug: ["v2", "installation"] },
>     { slug: ["v2", "config", "advanced"] }
>   ];
> }
> ```

> #### Technical Explanation
>
> 1. For catch-all routes, `generateStaticParams()` returns arrays of string segments for each `slug`.
> 2. Next.js prerenders static HTML for each nested route path during build compilation.
> 3. Enables static site generation (SSG) performance for multi-tiered docs.

---

### Exercise 3: Fallback Breadcrumb Generation

**Scenario:**
Generate breadcrumb navigation links dynamically from `params.slug` segments.

**Requirements:**
1. Map over `slug` array to construct href strings.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import Link from "next/link";

export default async function BreadcrumbDocs({
  params
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  let currentPath = "/docs";

  return (
    <nav className="flex gap-2 text-sm text-gray-600">
      <Link href="/docs">Docs</Link>
      {slug.map((segment) => {
        currentPath += `/${segment}`;
        return (
          <span key={currentPath}>
            / <Link href={currentPath}>{segment}</Link>
          </span>
        );
      })}
    </nav>
  );
}
```

> #### Technical Explanation
>
> 1. Iterating over `params.slug` allows programmatically reconstructing nested URL paths.
> 2. Generates server-rendered breadcrumb links without client-side DOM parsing.
> 3. Idiomatic catch-all route component implementation.

---




---

## 6. Related Terms
- [Route Groups (`(group)`)](route_groups.md) — Another special folder naming convention that modifies routing behavior.
- [JavaScript Rest Parameters (`...`)](rest_parameters.md) — Related concept: JavaScript Rest Parameters (`...`).

---

## 7. Key Takeaways
- **Catch-all Segments (`[...slug]`)** allow a single folder to match URLs with infinite nested slashes (e.g., `/a/b/c/d`).
- The `params` prop receives an **Array of strings**, split by the slashes.
- To make the route also match the root path without any parameters (e.g., `/a`), use the **Optional Catch-all** syntax: `[[...slug]]`.
