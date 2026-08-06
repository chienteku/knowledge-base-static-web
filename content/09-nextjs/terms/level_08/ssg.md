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

**Rendering Strategy** (Static Site Generation Prerendering): Static Site Generation (SSG) compiles route HTML pages and assets into static files during build execution for CDN edge delivery.



---

## 3. Explanation

### Environment Context
- **Build-Time (Server)**

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

## 4. Common Mistakes & Pitfalls

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




---

## 5. Practice Exercises

### Exercise 1: Building Static Web Applications with `next build`

**Scenario:**
Configure static site generation (SSG) and inspect `next build` output logs.

**Requirements:**
1. Run `next build` and analyze output symbols.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> npm run build
> 
> # Build Output Log:
> # Route (app)                              Size     First Load JS
> # ┌ ○ /                                    1.2 kB         85 kB
> # ├ ○ /about                               1.5 kB         86 kB
> # └ ● /blog/[slug]                         2.1 kB         87 kB
> # ○  (Static)   prerendered as static content
> # ●  (SSG)      prerendered using generateStaticParams
> ```

> #### Technical Explanation
>
> 1. Static Site Generation (SSG) pre-computes HTML and asset files during build time.
> 2. Route symbol `○` indicates static pages; `●` indicates SSG pages generated with `generateStaticParams()`.
> 3. Pre-rendered HTML files are uploaded to global CDN edge networks.

---

### Exercise 2: Exporting Static Builds with `output: 'export'`

**Scenario:**
Configure `next.config.js` for static HTML export (`output: 'export'`) for S3/GitHub Pages hosting.

**Requirements:**
1. Set `output: "export"` in `next.config.js`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // next.config.js
> module.exports = {
>   output: "export"
> };
> ```

> #### Technical Explanation
>
> 1. `output: 'export'` compiles the application into an `out/` folder containing static HTML, CSS, and JS assets.
> 2. Eliminates the requirement for a running Node.js server.
> 3. Disables server-only features like Server Actions, Headers, and dynamic middleware.

---

### Exercise 3: Trade-Off Analysis: SSG vs Dynamic SSR

**Scenario:**
Formulate an architectural selection decision matrix comparing SSG against Dynamic SSR.

**Requirements:**
1. Contrast build time duration, CDN caching, data freshness, and server cost.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> SSG vs SSR Selection Matrix:
> - SSG (Static Site Generation): Build-time rendering. Zero Node.js server cost, fastest CDN TTFB, build times scale with page count. Use for blogs, docs, marketing sites.
> - SSR (Server-Side Rendering): Request-time rendering. Requires Node.js server, fresh data on every hit, higher server RAM/CPU cost. Use for dashboards, personalized feeds.
> ```

> #### Technical Explanation
>
> 1. SSG is ideal for content that changes infrequently and requires maximum speed.
> 2. SSR is required for dynamic, real-time user-specific applications.
> 3. Core architectural decision framework.

---




---

## 6. Related Terms
- [Dynamic Rendering (SSR)](ssr.md) — The dynamic alternative.
- [Incremental Static Regeneration (ISR)](isr.md) — The solution to updating SSG pages without rebuilding the whole app.
- [Data Caching (`force-cache`, `no-store`)](../level_05/data_caching.md) — Related concept: Data Caching (`force-cache`, `no-store`).
- [`generateStaticParams` Function](generate_static_params.md) — Related concept: `generateStaticParams` Function.
- [The Next.js Cache (The Four Caches)](next_cache.md) — Related concept: The Next.js Cache (The Four Caches).
- [Partial Prerendering (PPR)](ppr.md) — Related concept: Partial Prerendering (PPR).
- [Draft Mode](../level_10/draft_mode.md) — Related concept: Draft Mode.

---

## 7. Key Takeaways
- **Static Site Generation (SSG)** pre-renders React components into HTML at Build Time.
- In the App Router, it is officially known as **Static Rendering**.
- It is the default behavior for all Next.js pages unless dynamic functions are used.
- SSG pages are incredibly fast and cheap to host because they are just static files.
- To use SSG with dynamic routes (like `[slug]`), you must export the `generateStaticParams` function to tell Next.js which URLs to build.
