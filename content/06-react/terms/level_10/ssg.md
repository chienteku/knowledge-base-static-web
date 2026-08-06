# Static Site Generation (SSG)

> **Level 10 — Modern React & Architectures**
> A rendering strategy where React components are executed and pre-rendered into HTML files at build time rather than on every user request.

---

## 1. Prerequisites

- [Server-Side Rendering (SSR)](ssr.md) — SSG executes server rendering ahead of time during application build compilation.
- [Next.js](nextjs.md) — The primary production framework implementing SSG and Incremental Static Regeneration (ISR).

---

## 2. Term Category

**Rendering Mechanic (build-time static generation)**: Static Site Generation (SSG) is a pre-rendering strategy where React component trees are evaluated and compiled into static HTML, CSS, and payload files during the application's build phase (`npm run build`). The resulting static HTML documents are uploaded directly to Content Delivery Network (CDN) edge locations globally.

When a user requests an SSG page, the CDN serves the pre-rendered static HTML file instantly without triggering Node.js server execution or database queries. This delivers sub-millisecond Time to First Byte (TTFB), minimal hosting costs, and resilience against traffic spikes.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Traditional Server-Side Rendering (SSR) generates HTML on demand for every incoming HTTP request. While SSR ensures data is completely up to date, it introduces two major challenges for high-traffic public sites:
1. **Server Compute Bottlenecks:** If 100,000 users visit a marketing page or documentation site simultaneously, the Node.js server must execute React component trees and database queries 100,000 times, risking server crashes and slow Time to First Byte (TTFB).
2. **High Infrastructure Overhead:** Operating continuous Node.js server instances around the clock for static content consumes significant compute resources.

Static Site Generation (SSG) resolves these challenges for content that does not change on a per-user or per-second basis (such as blogs, documentation, product marketing pages, and e-commerce catalogs). By executing React components once during build time, Next.js saves the output as static HTML files on a CDN.

To prevent SSG pages from becoming permanently stale, modern frameworks introduce **Incremental Static Regeneration (ISR)**. ISR allows developers to revalidate specific static HTML pages in the background after a designated time interval (e.g. `revalidate: 60` seconds) or on-demand via webhooks without rebuilding the entire application.

### (2) Reality Metaphor

Imagine a print publisher publishing a magazine.

- **Server-Side Rendering (On-Demand Calligrapher):** Every time a reader wants to view an article, a calligrapher manually writes out the entire 10-page article on parchment paper from scratch (**rendering on demand for every request**). Readers wait in a long line while the calligrapher writes (**server latency**).
- **Static Site Generation (Printing Press):** Before the magazine issue goes on sale, the publisher uses a commercial printing press to print 50,000 identical copies at the factory (**build-time static generation**). Copies are distributed to newsstands worldwide (**CDN edge caching**). When a reader buys a copy, the newsstand hands them a pre-printed issue instantly without making them wait for a calligrapher.

### (3) React Code Examples

#### Short Snippet

```jsx
// app/blog/[slug]/page.jsx (Next.js Static Site Generation)
export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  
  // 'force-cache' instructs Next.js to pre-render and cache at build time (SSG)
  const res = await fetch(`https://api.example.com/posts/${slug}`, {
    cache: 'force-cache'
  });
  const post = await res.json();

  return (
    <article className="blog-post">
      <h1>{post.title}</h1>
      <div className="body">{post.content}</div>
    </article>
  );
}
```

#### Fuller Example

```jsx
// app/products/[id]/page.jsx
import { notFound } from 'next/navigation';

// generateStaticParams pre-defines static paths for build-time generation
export async function generateStaticParams() {
  const res = await fetch('https://api.example.com/top-products');
  const products = await res.json();
  
  return products.map(p => ({ id: p.id.toString() }));
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;

  // Revalidate static HTML every 60 seconds (Incremental Static Regeneration - ISR)
  const res = await fetch(`https://api.example.com/products/${id}`, {
    next: { revalidate: 60 }
  });

  if (!res.ok) notFound();
  const product = await res.json();

  return (
    <main className="product-page">
      <div className="gallery">
        <img src={product.imageUrl} alt={product.name} />
      </div>
      <div className="details">
        <h2>{product.name}</h2>
        <p className="price">${product.price.toFixed(2)}</p>
        <p className="description">{product.description}</p>
        <span className="stock-badge">In Stock: {product.stockCount}</span>
      </div>
    </main>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using SSG for personalized, user-specific data (e.g. user dashboards or shopping carts)

**The mistake:** Pre-rendering a user `/profile` or `/cart` page using Static Site Generation.

**Why it's wrong:** SSG runs at Build Time on CI/CD servers. At build time, individual user sessions, auth cookies, and personal shopping cart states do not exist. Pre-rendering authenticated pages via SSG will either throw errors or bake one user's private data into a public static HTML file for all visitors.

*Incorrect:*
```jsx
// app/profile/page.jsx
export default async function UserProfile() {
  // ❌ Fatal Error: Build-time SSG cannot read dynamic user session cookies!
  const session = await getSessionFromCookies();
  return <div>User: {session.userName}</div>;
}
```

*Fix:*
```jsx
// app/profile/page.jsx
export default async function UserProfile() {
  // Force dynamic server-side rendering (SSR) for user-specific session pages
  const res = await fetch('https://api.example.com/user/me', { cache: 'no-store' });
  const user = await res.json();
  return <div>User: {user.name}</div>;
}
```

### Mistake 2: Setting `dynamicParams = false` when generating a subset of dynamic routes

**The mistake:** Exporting `export const dynamicParams = false` in a dynamic route file when only top 10 items are pre-rendered at build time.

**Why it's wrong:** Setting `dynamicParams = false` causes Next.js to throw 404 Not Found errors for any URL parameter not explicitly listed in `generateStaticParams()`. Use `dynamicParams = true` (default) to generate missing pages on demand.

*Incorrect:*
```jsx
// app/products/[id]/page.jsx
export const dynamicParams = false; // ❌ Returns 404 for un-generated product #11!

export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }]; // Pre-renders only top 2
}
```

*Fix:*
```jsx
// app/products/[id]/page.jsx
export const dynamicParams = true; // Generates missing products on-demand when requested
```

### Mistake 3: Relying on SSG without configuring revalidation intervals for active pricing or stock data

**The mistake:** Pre-rendering product pricing or live stock counts via pure SSG (`force-cache`) without setting ISR revalidation time or webhook invalidation.

**Why it's wrong:** Without ISR (`revalidate`) or manual tag invalidation (`revalidateTag`), pre-rendered static HTML pages remain cached on CDNs indefinitely, displaying outdated pricing or out-of-stock items to users.

*Incorrect:*
```jsx
// ❌ Static HTML cached forever; price changes will not update until next full build deployment!
fetch('https://api.example.com/prices', { cache: 'force-cache' });
```

*Fix:*
```jsx
// Use ISR revalidation interval to update price cache in background
fetch('https://api.example.com/prices', { next: { revalidate: 300 } });
```

---

## 5. Practice Exercises

### Exercise 1: IoT Documentation Hub SSG Route Setup

**Scenario:** Build a documentation site for an IoT firmware SDK where documentation pages are statically generated at build time. Pre-generate static paths for core SDK guides using `generateStaticParams()`.

**Requirements:**
1. Implement `generateStaticParams()` returning array of core doc slugs.
2. Implement async `DocPage` Server Component using `cache: 'force-cache'`.
3. Handle missing doc slugs using `notFound()`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // app/docs/[slug]/page.jsx
> import { notFound } from 'next/navigation';
>
> export async function generateStaticParams() {
>   return [
>     { slug: 'quickstart' },
>     { slug: 'telemetry-api' },
>     { slug: 'firmware-flashing' }
>   ];
> }
>
> async function getDocContent(slug) {
>   const res = await fetch(`https://api.sdk.example.com/docs/${slug}`, {
>     cache: 'force-cache'
>   });
>   if (!res.ok) return null;
>   return res.json();
> }
>
> export default async function DocPage({ params }) {
>   const { slug } = await params;
>   const doc = await getDocContent(slug);
>
>   if (!doc) notFound();
>
>   return (
>     <article className="sdk-doc">
>       <header>
>         <h1>{doc.title}</h1>
>         <span className="version-tag">SDK v4.2</span>
>       </header>
>       <section className="markdown-content">{doc.body}</section>
>     </article>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Build-Time Generation**: `generateStaticParams()` pre-defines doc slugs rendered into static HTML files during build.
> 2. **Forced Caching**: `cache: 'force-cache'` signals Next.js to store static response files on CDN edges.
> 3. **Instant Delivery**: Users receive pre-compiled HTML documentation with zero server fetch latency.
> 4. **Graceful Fallback**: `notFound()` handles invalid slug requests safely.
> 
### Exercise 2: Financial Market Symbol Reference (ISR Integration)

**Scenario:** Construct a Financial Trading symbol directory where stock ticker definitions are pre-rendered at build time, but background revalidated every 300 seconds using Incremental Static Regeneration (ISR).

**Requirements:**
1. Implement `generateStaticParams()` for top market indices.
2. Configure fetch with `{ next: { revalidate: 300 } }`.
3. Render symbol metadata in static HTML markup.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // app/symbols/[ticker]/page.jsx
> export async function generateStaticParams() {
>   return [
>     { ticker: 'SPY' },
>     { ticker: 'QQQ' },
>     { ticker: 'DIA' }
>   ];
> }
>
> async function getSymbolInfo(ticker) {
>   const res = await fetch(`https://api.market.example.com/symbols/${ticker}`, {
>     next: { revalidate: 300 } // Revalidate static cache every 5 minutes
>   });
>   return res.json();
> }
>
> export default async function SymbolPage({ params }) {
>   const { ticker } = await params;
>   const info = await getSymbolInfo(ticker);
>
>   return (
>     <main className="symbol-page">
>       <h2>{info.symbol} - {info.name}</h2>
>       <p>Exchange: {info.exchange}</p>
>       <p>Asset Class: {info.assetClass}</p>
>       <small>Static ISR Snapshot (Revalidated 5m)</small>
>     </main>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **ISR Pre-Rendering**: Pages are pre-built at deployment, serving instant CDN HTML responses to traders.
> 2. **Background Revalidation**: `{ next: { revalidate: 300 } }` updates static CDN HTML files in the background every 5 minutes when requests arrive.
> 3. **CDN Efficiency**: Server load is reduced by 99% compared to traditional per-request SSR.
> 4. **High Availability**: Pages remain available from CDN cache even if upstream database APIs experience transient downtime.
> 
### Exercise 3: E-Commerce Static Landing Page Matrix

**Scenario:** Evaluate rendering strategies for an e-commerce platform and implement a static promotional landing page using SSG.

**Requirements:**
1. Implement `PromoLandingPage` pre-rendering hero deals.
2. Use static fetch options for deal banners.
3. Contrast SSG usage criteria against SSR.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // app/promotions/black-friday/page.jsx
> async function getPromoDeals() {
>   const res = await fetch('https://api.store.example.com/deals/black-friday', {
>     cache: 'force-cache'
>   });
>   return res.json();
> }
>
> export default async function PromoLandingPage() {
>   const deals = await getPromoDeals();
> 
>   return (
>     <section className="promo-landing">
>       <header className="hero-banner">
>         <h1>Black Friday Mega Deals</h1>
>         <p>Pre-rendered for global instant load</p>
>       </header>
> 
>       <div className="deals-grid">
>         {deals.map(deal => (
>           <div key={deal.id} className="deal-card">
>             <h3>{deal.title}</h3>
>             <p>Discount: {deal.discountPercentage}% OFF</p>
>           </div>
>         ))}
>       </div>
>     </section>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Massive Scalability**: Static HTML files withstand millions of concurrent Black Friday visitors without server failure.
> 2. **Optimal SEO**: Search engine crawlers receive 100% pre-populated HTML markup immediately.
> 3. **Zero Database Load**: Database queries run once during build deployment, zero queries per user request.
> 4. **Clear Decision Rule**: Content identical for all users is ideal for SSG, while cart/auth data requires SSR.
> 
---

## 6. Related Terms

- [Server-Side Rendering (SSR)](ssr.md) — On-demand server rendering per request.
- [Next.js](nextjs.md) — The production meta-framework implementing SSG and ISR.
- [Hydration](hydration.md) — The client process attaching event handlers to SSG static HTML.
- [React Server Components (RSC)](rsc.md) — Component architecture powering Next.js static pre-rendering.

---

## 7. Key Takeaways

- Static Site Generation (SSG) evaluates React components at build time to generate static HTML files.
- Static HTML files are served from global CDN edge caches, providing fast TTFB and high scalability.
- Perfect for public content that is identical for all visitors (blogs, documentation, marketing pages).
- Do not use SSG for user-authenticated or personalized data (dashboards, shopping carts).
- Use Incremental Static Regeneration (ISR) with `revalidate` to update static CDN pages automatically.
