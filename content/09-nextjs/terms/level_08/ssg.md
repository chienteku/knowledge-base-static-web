# Static Site Generation (SSG)

> **Level 8 — Rendering Strategies**
> The process of generating HTML on the server exactly once at Build-Time. The resulting files are served instantly to all users via a CDN, providing the absolute fastest possible page loads.

---

## 1. Prerequisites
- [Dynamic Rendering (SSR)](ssr.md) — The dynamic alternative to SSG.
- [React Server Components (RSC)](../level_01/rsc.md) — The components being rendered statically.
- [`generateStaticParams` Function](generate_static_params.md) — How dynamic paths are pre-compiled statically.
---

## 2. Term Category
- **Rendering Strategy / Optimization**

---

## 3. Environment Context
- **Build-Time (Server)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you build a blog, the contents of a blog post rarely change. If 10,000 users visit the post, running the React rendering engine on the server 10,000 times (SSR) is a massive waste of CPU.
Instead, when you run `npm run build`, Next.js can fetch the database, render the React components into an HTML string, and save that HTML file to disk. 
When 10,000 users visit the page, the server just hands them the pre-made HTML file instantly. This is **Static Site Generation (SSG)**.

### (2) SSG in the App Router (Static Rendering)
In the Pages router, this was an opt-in function called `getStaticProps`.
In the App Router, **SSG is simply called "Static Rendering," and it is the DEFAULT behavior!** 
If Next.js does not detect any dynamic functions (`cookies()`, `no-store` fetches), it automatically pre-builds the page statically during `npm run build`.

```tsx
// app/about/page.tsx
import db from '@/lib/db';

export default async function AboutPage() {
  // 1. Next.js runs this query ONCE during `npm run build`.
  // 2. It generates the HTML and saves it.
  // 3. When users visit /about, the database is NEVER queried. 
  //    They just get the saved HTML!
  const companyInfo = await db.company.findFirst();

  return (
    <div>
      <h1>About Us</h1>
      <p>{companyInfo.mission}</p>
    </div>
  );
}
```

### (3) `generateStaticParams` (Dynamic SSG)
What if you have `app/blog/[slug]/page.tsx`? Next.js doesn't know what slugs exist at build time, so it defaults to SSR.
You can force it to use SSG by exporting a `generateStaticParams` function. This tells Next.js all the possible URLs to pre-build!

```tsx
// app/blog/[slug]/page.tsx

// 1. Tell Next.js which URLs to pre-build!
export async function generateStaticParams() {
  const posts = await db.post.findMany({ select: { slug: true } });
  
  // Returns: [{ slug: 'react-tips' }, { slug: 'nextjs-guide' }]
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// 2. This will run at build time for every slug returned above!
export default async function BlogPost({ params }) {
  const post = await db.post.findUnique({ where: { slug: params.slug } });
  return <h1>{post.title}</h1>;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting a static page to update in Production

**The mistake:** A developer builds an SSG page that fetches a list of products. They add a new product to their database via their admin panel. They refresh the public site, but the new product isn't there.

**Why it's wrong:** SSG means the page was generated at *Build Time*. The HTML file is literally frozen in time from the moment you typed `npm run build`. Changing the database later does nothing to the frozen HTML file!
**Golden Rule:** If the underlying data changes, an SSG page must either be completely rebuilt and redeployed, OR you must use Incremental Static Regeneration (ISR) or On-Demand Revalidation.

---

### Mistake 2: Using Dynamic Request Functions (`cookies()`, `headers()`) in SSG Pages

**The mistake:** Calling `cookies()` or `headers()` inside a static blog page intended for SSG.

**Why it's wrong:** Calling request-time dynamic functions (`cookies()`, `headers()`, `searchParams`) automatically forces Next.js to opt out of Static Site Generation (SSG) and switch to dynamic SSR.

*Incorrect:*
```typescript
// Intended as static SSG page
import { cookies } from 'next/headers';
export default async function Page() {
  const token = cookies().get('token'); // ❌ Forces page into dynamic request-time SSR!
}
```

*Fix:*
```typescript
// Keep SSG pages pure; read user cookies in Client Components or Server Actions
```

---

### Mistake 3: Over-Using `force-dynamic` on Pure Static Pages

**The mistake:** Adding `export const dynamic = 'force-dynamic'` to static Terms of Service or Privacy Policy pages.

**Why it's wrong:** Forcing dynamic rendering on purely static pages wastes server CPU and increases latency. Leave static pages to SSG pre-rendering default.

*Incorrect:*
```tsx
export const dynamic = 'force-dynamic'; // ❌ Wastes CPU on static Privacy Policy page!
```

*Fix:*
```tsx
export const dynamic = 'force-static'; // Ensure static pre-rendering
```


---

### Mistake 4: Using Dynamic Request Functions (`cookies()`, `headers()`) in SSG Pages

**The mistake:** Calling `cookies()` or `headers()` inside a static blog page intended for SSG.

**Why it's wrong:** Calling request-time dynamic functions (`cookies()`, `headers()`, `searchParams`) automatically forces Next.js to opt out of Static Site Generation (SSG) and switch to dynamic SSR.

*Incorrect:*
```typescript
// Intended as static SSG page
import { cookies } from 'next/headers';
export default async function Page() {
  const token = cookies().get('token'); // ❌ Forces page into dynamic request-time SSR!
}
```

*Fix:*
```typescript
// Keep SSG pages pure; read user cookies in Client Components or Server Actions
```

---

### Mistake 5: Over-Using `force-dynamic` on Pure Static Pages

**The mistake:** Adding `export const dynamic = 'force-dynamic'` to static Terms of Service or Privacy Policy pages.

**Why it's wrong:** Forcing dynamic rendering on purely static pages wastes server CPU and increases latency. Leave static pages to SSG pre-rendering default.

*Incorrect:*
```tsx
export const dynamic = 'force-dynamic'; // ❌ Wastes CPU on static Privacy Policy page!
```

*Fix:*
```tsx
export const dynamic = 'force-static'; // Ensure static pre-rendering
```


---

### Mistake 6: Using Dynamic Request Functions (`cookies()`, `headers()`) in SSG Pages

**The mistake:** Calling `cookies()` or `headers()` inside a static blog page intended for SSG.

**Why it's wrong:** Calling request-time dynamic functions (`cookies()`, `headers()`, `searchParams`) automatically forces Next.js to opt out of Static Site Generation (SSG) and switch to dynamic SSR.

*Incorrect:*
```typescript
// Intended as static SSG page
import { cookies } from 'next/headers';
export default async function Page() {
  const token = cookies().get('token'); // ❌ Forces page into dynamic request-time SSR!
}
```

*Fix:*
```typescript
// Keep SSG pages pure; read user cookies in Client Components or Server Actions
```

---

### Mistake 7: Over-Using `force-dynamic` on Pure Static Pages

**The mistake:** Adding `export const dynamic = 'force-dynamic'` to static Terms of Service or Privacy Policy pages.

**Why it's wrong:** Forcing dynamic rendering on purely static pages wastes server CPU and increases latency. Leave static pages to SSG pre-rendering default.

*Incorrect:*
```tsx
export const dynamic = 'force-dynamic'; // ❌ Wastes CPU on static Privacy Policy page!
```

*Fix:*
```tsx
export const dynamic = 'force-static'; // Ensure static pre-rendering
```


---

## 6. Practice Exercises

### Exercise 1: Identifying the Build Step

**Problem:** You have a `console.log("Fetching users")` inside an SSG `page.tsx` component. You deploy the app. 1,000 users visit the page. How many times will that log appear in your production server logs?

**Expected output:**
> [!check]- Answer
> ```text
> Zero!
> The component executed, and the `console.log` fired exactly ONCE during the build process (`npm run build`) on your CI/CD pipeline. 
> When the 1,000 users visit, they are just receiving static HTML. The React component itself does not execute on the production server.
> ```
> - Think about when and where the HTML is generated.

---

### Exercise 2: Static Build Output Inspection

**Problem:** Which build output symbol in `npm run build` console logs indicates that a route segment was compiled as a static SSG route?

**Expected output:**
> [!check]- Answer
> ```text
> ○ (Static) or ● (SSG / Prerendered)
> ```
> - `○ (Static)` indicates static SSG pre-rendered HTML.
> - `ƒ (Dynamic)` indicates dynamic request-time SSR.
> 
> ```text
> ○ /about                             1.2 kB
> ```

---

### Exercise 3: SSG Deployment Advantage

**Problem:** State 2 major technical advantages of Static Site Generation (SSG).

**Expected output:**
> [!check]- Answer
> ```text
> 1. Ultrafast global CDN caching and response speeds (TTFB)
> 2. High server cost efficiency (Zero Node.js server computation per request)
> ```
> - Instant global CDN delivery.
> - Zero server compute cost per request.
> 
> ```text
> Ultra-low latency TTFB + Low CDN hosting costs.
> ```


---

## 7. Related Terms
- [Dynamic Rendering (SSR)](ssr.md) — The dynamic alternative.
- [Incremental Static Regeneration (ISR)](isr.md) — The solution to updating SSG pages without rebuilding the whole app.
- [Data Caching (`force-cache`, `no-store`)](../level_05/data_caching.md) — Related concept: Data Caching (`force-cache`, `no-store`).
- [`generateStaticParams` Function](generate_static_params.md) — Related concept: `generateStaticParams` Function.
- [The Next.js Cache (The Four Caches)](next_cache.md) — Related concept: The Next.js Cache (The Four Caches).
- [Partial Prerendering (PPR)](ppr.md) — Related concept: Partial Prerendering (PPR).
- [Draft Mode](../level_10/draft_mode.md) — Related concept: Draft Mode.
---

## 8. Key Takeaways
- **Static Site Generation (SSG)** pre-renders React components into HTML at Build Time.
- In the App Router, it is officially known as **Static Rendering**.
- It is the default behavior for all Next.js pages unless dynamic functions are used.
- SSG pages are incredibly fast and cheap to host because they are just static files.
- To use SSG with dynamic routes (like `[slug]`), you must export the `generateStaticParams` function to tell Next.js which URLs to build.
