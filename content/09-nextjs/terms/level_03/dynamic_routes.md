# Dynamic Routes (`[slug]`)

> **Level 3 — Navigation & Routing Fundamentals**
> A way to create URL paths based on dynamic data (like IDs or usernames) rather than hardcoding exact folder names.

---

## 1. Prerequisites
- [`page.tsx`](../level_02/page.md) — The file that receives the dynamic parameter.
- [App Router vs Pages Router](../level_01/app_router_vs_pages.md) — Understanding folder-based routing.

---

## 2. Term Category
- **Routing**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you are building a blog, you want URLs like `/blog/hello-world` and `/blog/nextjs-tips`.
You obviously cannot create a new physical folder in your code editor for every single blog post your users publish!
You need a "wildcard" folder. A folder that says: *"No matter what the user types after `/blog/`, capture that string and pass it to my `page.tsx` so I can look it up in the database."*
**Dynamic Routes** solve this using a special bracket syntax.

### (2) The Bracket Syntax `[folderName]`
If you wrap a folder name in square brackets, Next.js treats it as a dynamic parameter.

```text
app/
  blog/
    [slug]/
      page.tsx
```
If a user visits `/blog/hello-world`, Next.js routes them to this `page.tsx`.
The string `"hello-world"` is packaged into an object and passed to the component as a prop named `params.slug`.

### (3) Using the `params` Prop
In the App Router, `params` is passed directly to your `page.tsx`, `layout.tsx`, and `route.ts` files.

```tsx
// app/blog/[slug]/page.tsx
export default async function BlogPost({ 
  params 
}: { 
  params: { slug: string } 
}) {
  // We extract the dynamic string from the URL!
  const postTitle = params.slug; 
  
  // Now we can use it to fetch the specific post from our database
  const post = await fetchPostFromDB(postTitle);

  return <h1>{post.title}</h1>;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Prop drilling `params` instead of using `useParams` in Client Components

**The mistake:** A developer needs the `slug` inside a deeply nested interactive Client Component. They receive `params` in `page.tsx` and manually pass it down through 5 layers of components.

**Why it's inefficient:** While prop drilling works, Next.js provides a built-in Client Hook specifically to read the URL parameters from anywhere in the component tree without prop drilling.
**Golden Rule:** Inside Server Components, read the `params` prop directly. Inside deeply nested Client Components, use the `useParams()` hook imported from `next/navigation` to instantly grab the dynamic segment!

---

### Mistake 2: Forgetting Square Brackets `[param]` for Dynamic Route Folder Names

**The mistake:** Naming dynamic route folder `app/blog/id/page.tsx` instead of `app/blog/[id]/page.tsx`.

**Why it's wrong:** Without square brackets `[id]`, Next.js treats `id` as a literal static URL path `/blog/id` rather than a dynamic parameter segment `/blog/123`.

*Incorrect:*
```tsx
// app/blog/id/page.tsx ❌ Matches ONLY literal URL /blog/id!
```

*Fix:*
```typescript
// app/blog/[id]/page.tsx Matches /blog/123, /blog/abc, etc.
```

---

### Mistake 3: Accessing Un-Awaited `params` in Next.js 15 Async Components

**The mistake:** Reading `params.id` synchronously without awaiting `params` in Next.js 15.

**Why it's wrong:** In Next.js 15+, `params` and `searchParams` are Promises that MUST be awaited in Server Components (`const { id } = await params`).

*Incorrect:*
```typescript
// Next.js 15 synchronous access
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>; // ❌ Sync access warning in Next.js 15!
}
```

*Fix:*
```typescript
// Next.js 15 async params resolution:
export default async function Page({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params; // Await params Promise
  return <div>{id}</div>;
}
```


---

## 6. Practice Exercises

### Exercise 1: Nested Dynamic Routes

**Problem:** You have a file structure: `app/shop/[category]/[productId]/page.tsx`. If a user visits `/shop/shoes/nike-air-123`, what does the `params` object look like when it reaches `page.tsx`?

**Expected output:**
> [!check]- Answer
> ```json
> {
>   "category": "shoes",
>   "productId": "nike-air-123"
> }
> ```
> - The folder names dictate the keys in the object!

---

### Exercise 2: Dynamic Parameter Destructuring Pattern

**Problem:** Write dynamic route component `app/users/[userId]/posts/[postId]/page.tsx` destructuring both parameter IDs.

**Expected output:**
> [!check]- Answer
> ```tsx
> export default async function Page({ params }: { params: { userId: string; postId: string } }) { return <div>User: {params.userId}, Post: {params.postId}</div>; }
> ```
> - Multiple dynamic folders populate `params` object properties.
> 
> ```tsx
> interface PageProps {
>   params: { userId: string; postId: string };
> }
> 
> export default async function Page({ params }: PageProps) {
>   return (
>     <div>
>       User ID: {params.userId} | Post ID: {params.postId}
>     </div>
>   );
> }
> ```

---

### Exercise 3: generateStaticParams for Dynamic Routes

**Problem:** Which exported function pre-renders dynamic routes (e.g. `/posts/[id]`) statically at build time?

**Expected output:**
> [!check]- Answer
> ```text
> export async function generateStaticParams() { return [{ id: '1' }, { id: '2' }]; }
> ```
> - `generateStaticParams()` returns array of parameter objects for SSG.
> 
> ```typescript
> export async function generateStaticParams() {
>   return [{ id: '1' }, { id: '2' }];
> }
> ```


---

## 7. Related Terms
- [`page.tsx`](../level_02/page.md) — The file that receives the `params`.
- [`generateStaticParams` Function](../level_08/generate_static_params.md) — generateStaticParams for SSG.
- [JavaScript Rest Parameters (`...`)](rest_parameters.md) — Related concept: JavaScript Rest Parameters (`...`).
- [Intercepting Routes (`(..)folder`)](../level_04/intercepting_routes.md) — Related concept: Intercepting Routes (`(..)folder`).

---

## 8. Key Takeaways
- **Dynamic Routes** allow you to match variable URL segments using square brackets in the folder name (e.g., `[id]`).
- Next.js extracts the matched string from the URL and passes it to your `page.tsx` via the `params` prop.
- You can nest multiple dynamic routes (e.g., `[category]/[id]`).
- Client components can read these parameters anywhere using the `useParams()` hook.
