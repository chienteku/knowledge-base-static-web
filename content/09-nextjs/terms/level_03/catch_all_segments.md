# Catch-all Segments (`[...slug]`)

> **Level 3 — Navigation & Routing Fundamentals**
> An advanced routing feature that allows a single dynamic folder to catch an infinite number of nested URL paths (slashes) into an array.

---

## 1. Prerequisites
- [Dynamic Routes (`[slug]`)](../level_03/dynamic_routes.md) — The standard dynamic route syntax.
- [JavaScript Rest Parameters (`...`)](../level_03/rest_parameters.md) — The JS syntax that inspired this folder naming convention.

---

## 2. Term Category
- **Routing**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Handling the array

**Problem:** You have a route `app/store/[...filters]/page.tsx`. A user visits `/store/shoes/nike/red`. How would you extract "shoes" as the category, and the rest of the array elements as tags, using JavaScript destructuring?

**Expected output:**
```tsx
export default function Store({ params }: { params: { filters: string[] } }) {
  // Using array destructuring and the REST operator!
  const [category, ...tags] = params.filters;
  
  console.log(category); // "shoes"
  console.log(tags);     // ["nike", "red"]
}
```

> [!check]- Answer
> - Combine your knowledge of Next.js routing with your JS Level 4 knowledge!

---

### Exercise 2: Catch-All Parameter Array Resolution

**Problem:** Given route `app/shop/[[...slug]]/page.tsx`, resolve `params.slug` value for:
1. `/shop` 
2. `/shop/clothing` 
3. `/shop/clothing/tops/shirts` 

**Expected output:**
```text
1. undefined (or empty array)
2. ['clothing']
3. ['clothing', 'tops', 'shirts']
```

> [!check]- Answer
> - Optional catch-all `[[...slug]]` resolves root as `undefined`.
> 
> ```text
> 1. /shop -> undefined
> 2. /shop/clothing -> ['clothing']
> 3. /shop/clothing/tops/shirts -> ['clothing', 'tops', 'shirts']
> ```

---

### Exercise 3: Catch-All Route Definition

**Problem:** Write `PageProps` TypeScript type for optional catch-all segment `[[...slug]]`.

**Expected output:**
```text
interface PageProps { params: { slug?: string[] }; }
```

> [!check]- Answer
> - Optional catch-all `slug` parameter is typed as `string[] | undefined`.
> 
> ```typescript
> interface PageProps {
>   params: { slug?: string[] };
> }
> ```


---

## 7. Related Terms
- [Dynamic Routes (`[slug]`)](../level_03/dynamic_routes.md) — The basic version of this feature.
- [Route Groups (`(group)`)](../level_03/route_groups.md) — Another special folder naming convention that modifies routing behavior.

---

## 8. Key Takeaways
- **Catch-all Segments (`[...slug]`)** allow a single folder to match URLs with infinite nested slashes (e.g., `/a/b/c/d`).
- The `params` prop receives an **Array of strings**, split by the slashes.
- To make the route also match the root path without any parameters (e.g., `/a`), use the **Optional Catch-all** syntax: `[[...slug]]`.
