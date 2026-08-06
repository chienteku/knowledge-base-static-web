# Open Graph & Twitter Cards (`generateMetadata`)

> **Level 9 — Optimization**
> An asynchronous function that allows you to dynamically generate SEO metadata based on route parameters (like a product ID) or database queries, essential for e-commerce and blogs.

---

## 1. Prerequisites
- [Metadata API (`metadata`)](metadata_api.md) — The static version of this feature.
- [Server-side Fetching (Extended `fetch`)](../level_05/fetch.md) — How we fetch the data for the metadata.

---

## 2. Term Category

**SEO & Metadata** (Dynamic Route Metadata Generation): `generateMetadata()` generates dynamic SEO page titles, meta descriptions, and OpenGraph images based on route parameters and API data.



---

## 3. Explanation

### Environment Context
- **Server Component ONLY**

### (1) Design Motivation — "Why did we design this?"
Exporting `const metadata = { title: 'About' }` is fine for static pages like `/about` or `/pricing`.
But what about `app/product/[id]/page.tsx`? If a user links a product on Twitter, you want the Twitter card (Open Graph) to show the specific Product Name and Product Image. You can't hardcode that in a static object because the ID changes!
Next.js provides **`generateMetadata`**, an `async` function you can export instead of the static object. It receives the same `params` as your page component, allowing you to fetch the database and return custom metadata.

### (2) The Syntax
You export an `async function generateMetadata()` that returns a Metadata object.

```tsx
// app/product/[id]/page.tsx
import { Metadata } from 'next';
import db from '@/lib/db';

type Props = {
  params: { id: string }
};

// 1. Next.js calls this function FIRST, before rendering the page!
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Fetch the product from the database
  const product = await db.product.findUnique({ where: { id: params.id } });

  // Return the dynamic metadata
  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: {
      images: [product.imageUrl],
    },
  };
}

// 2. Next.js calls the page component SECOND.
export default async function ProductPage({ params }: Props) {
  // Wait, aren't we querying the database twice?
  const product = await db.product.findUnique({ where: { id: params.id } });
  
  return <h1>{product.name}</h1>;
}
```

### (3) Request Deduplication saves the day
In the code above, we called `db.product.findUnique` in `generateMetadata` AND in `ProductPage`. Isn't that bad for performance?
**No!** Thanks to Next.js **Request Memoization** (covered in Level 5), if you use standard `fetch`, Next.js will deduplicate the request automatically. It only hits the database once. (Note: if using an ORM like Prisma, you may need to wrap the database call in React's `cache()` function to achieve the same deduplication).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on data fetched inside the page component

**The mistake:** A developer fetches a product inside the `ProductPage` component, and then wonders how to pass that product variable "up" into the `metadata` object.

**Why it's wrong:** Data flows strictly downward in React. You cannot pass data from the component body up to the metadata. The Metadata MUST be resolved *before* the page component is allowed to render, because the `<head>` is sent to the browser before the `<body>`.
**Golden Rule:** You must perform the data fetch *inside* `generateMetadata`. Do not try to share variables between the two functions; rely on Request Memoization/caching to deduplicate the fetches.

---

### Mistake 2: Attempting to Export Both Static `metadata` and Dynamic `generateMetadata()` in the Same File

**The mistake:** Exporting both `export const metadata = {...}` and `export async function generateMetadata() {...}` in `page.tsx`.

**Why it's wrong:** Next.js throws a compile error when both static `metadata` and dynamic `generateMetadata()` are exported from the same route segment file.

*Incorrect:*
```typescript
// app/page.tsx
export const metadata = { title: 'Static' };
export async function generateMetadata() { return { title: 'Dynamic' }; } // ❌ Compile error!
```

*Fix:*
```typescript
// Use ONLY generateMetadata() for dynamic metadata generation:
export async function generateMetadata({ params }) {
  return { title: `Product ${params.id}` };
}
```

---

### Mistake 3: Fetching Data Separately in Page Component and `generateMetadata()` (Duplicate Fetches)

**The mistake:** Writing un-memoized custom data fetches in both `generateMetadata()` and `Page()`.

**Why it's wrong:** Un-memoized fetches execute twice on the server. Wrap database calls in `React.cache()` or use native `fetch()` so Next.js automatically deduplicates identical calls.

*Incorrect:*
```tsx
// Duplicate database queries in generateMetadata and Page without memoization
```

*Fix:*
```tsx
// Use React.cache() to deduplicate database queries across generateMetadata and Page:
const getItem = cache(async (id: string) => db.item.findUnique({ where: { id } }));
```


---

## 5. Practice Exercises

### Exercise 1: Generating Dynamic SEO Titles from Database APIs

**Scenario:**
Fetch product details inside `generateMetadata({ params })` to render dynamic document titles and OpenGraph cards.

**Requirements:**
1. Export `generateMetadata({ params }): Promise<Metadata>`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/products/[id]/page.tsx
> import type { Metadata } from "next";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const res = await fetch(`https://api.example.com/products/${id}`);
  const product = await res.json();

  return {
    title: `${product.name} | My Store`,
    description: product.description,
    openGraph: {
      title: product.name,
      images: [product.imageUrl]
    }
  };
}
```

> #### Technical Explanation
>
> 1. `generateMetadata()` resolves dynamic route parameters and constructs dynamic page metadata on the server.
> 2. `fetch()` calls inside `generateMetadata()` are automatically memoized when shared with the page component.
> 3. Renders server-side `<head>` meta tags for search engine crawlers.

---

### Exercise 2: Defining Parent Metadata Inheritance with `parent`

**Scenario:**
Inherit parent layout OpenGraph image arrays and append route-specific images in `generateMetadata()`.

**Requirements:**
1. Accept `parent: ResolvingMetadata` parameter.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import type { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata(
  props: any,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const parentOgImages = (await parent).openGraph?.images || [];

  return {
    openGraph: {
      images: ["/page-specific-og.jpg", ...parentOgImages]
    }
  };
}
```

> #### Technical Explanation
>
> 1. `ResolvingMetadata` resolves metadata exported by parent layout segments.
> 2. `await parent` grants access to inherited parent metadata properties.
> 3. Allows cascading and extending SEO metadata cleanly across nested routes.

---

### Exercise 3: Auditing Request Memoization in Metadata Generation

**Scenario:**
Verify that calling `fetch('/api/item/1')` in both `generateMetadata()` and `Page()` executes only 1 network call.

**Requirements:**
1. Detail request memoization behavior.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Metadata Request Memoization Audit:
> 1. Next.js server executes generateMetadata() -> fetch('/api/item/1') [Network Call 1 executed].
> 2. Next.js server executes Page() -> fetch('/api/item/1') [Request Memoized - 0 Network Calls].
> Total Network Roundtrips: EXACTLY 1.
> ```

> #### Technical Explanation
>
> 1. Next.js automatically memoizes identical `fetch()` requests across `generateMetadata()` and component rendering passes.
> 2. Eliminates duplicate data fetching overhead.
> 3. Essential performance feature for dynamic SEO pages.

---




---

## 6. Related Terms
- [Metadata API (`metadata`)](metadata_api.md) — The static equivalent.
- [Server-side Fetching (Extended `fetch`)](../level_05/fetch.md) — The mechanism used to deduplicate the API calls made in this function.

---

## 7. Key Takeaways
- **`generateMetadata`** is an async function used to create dynamic SEO tags based on route parameters.
- It is crucial for dynamic routes like blog posts and product pages to ensure correct Open Graph sharing on social media.
- It receives the `params` (and `searchParams`) exactly like the page component does.
- You will often fetch the exact same data in `generateMetadata` and your page component. Rely on Next.js/React caching mechanisms to prevent double-querying the database.
