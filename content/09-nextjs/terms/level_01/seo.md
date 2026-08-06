# SEO (Search Engine Optimization)

> **Level 1 — Core Concepts & Architecture**
> The practice of structuring website content and metadata so that search engine crawler bots can easily discover, read, and index your pages.

---

## 1. Prerequisites
- [Next.js Overview](nextjs.md) — The framework designed to optimize SEO for React apps.

---

## 2. Term Category

**SEO & Metadata** (Search Engine Optimization): SEO in Next.js App Router combines server-rendered semantic HTML with metadata objects (`generateMetadata`) for search indexing.



---

## 3. Explanation

### Environment Context
- **Universal** (HTML is generated on the server for crawler bots, and consumed by browsers/crawlers).

### (1) Design Motivation — "Why did we design this?"
For a website to rank on search engine results pages (like Google or Bing), search engine automated bots (crawlers) must read the page contents. Crawlers send HTTP GET requests to your site, download the HTML response, parse the textual structure, and extract links to discover new pages.

If you build a website using a standard Client-Side Rendered (CSR) framework (like Vite + React), the server returns an empty HTML file. The crawler receives this blank template. While search giants like Googlebot *can* execute client-side JavaScript, they use a **two-pass indexing model**:
1.  **First Pass (Instant):** The crawler indexes the static HTML immediately.
2.  **Second Pass (Delayed):** The page is added to a processing queue where a virtual browser compiles and runs the client-side JavaScript days or weeks later to index the dynamic content.

This delayed rendering severely hurts SEO performance, dynamic content ranking, and social media sharing previews (Open Graph preview tags require instant HTML). Next.js resolves this by rendering React code on the server, generating fully completed HTML on the first request pass.

---

### (2) Core Concept — Server-Assembly for Crawlers
By performing Server-Side Rendering (SSR) or Static Site Generation (SSG), Next.js returns a completed HTML structure on the very first hit:

```html
<!-- HTML returned by Next.js Server immediately -->
<!DOCTYPE html>
<html>
  <head>
    <title>Buy Premium Coffees | Espresso Shop</title>
    <meta name="description" content="Shop the finest organic espresso beans..." />
    <meta property="og:image" content="https://espresso.com/og-banner.png" />
  </head>
  <body>
    <h1>Fresh Espresso Beans</h1>
    <p>Discover our single-origin collections...</p>
  </body>
</html>
```

The SEO crawler downloads this document and instantly parses the title, descriptive metadata, headers, and body content without needing to execute a single line of JavaScript.

---

### (3) Structuring Content for SEO
-   **Semantic HTML:** Use proper HTML tags (`<h1>` for the main title, `<nav>` for menus, `<main>` for content) instead of wrapping everything inside unstructured `<div>` blocks.
-   **Metadata:** Supply descriptive pages titles and meta tags. Next.js provides a built-in Metadata API to inject these parameters into the `<head>` of your page automatically.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on client-side state or hooks to populate SEO metadata

**The mistake:** Trying to set pages metadata or headers dynamically using `useEffect` or client-side variables:

```typescript
// app/blog/page.tsx
'use client';

import React, { useEffect } from 'react';

export default function BlogList() {
  useEffect(() => {
    // BAD: Crawlers executing the first pass do not run useEffect!
    document.title = "Latest Blog Posts";
  }, []);

  return <h1>Our Blog</h1>;
}
```

**Why it's wrong:** Because `useEffect` runs only inside the browser after hydration, crawler bots executing the first pass will read the default, fallback page title (often just "Next.js App"). 

**Golden Rule:** Always declare page metadata server-side using the static or dynamic `metadata` exports provided by Next.js.

---

### Mistake 2: Hardcoding Static `<head>` Tags Instead of Using Next.js Metadata API

**The mistake:** Writing `<head><title>My Site</title></head>` manually in Next.js 13+ App Router pages.

**Why it's wrong:** The App Router uses the official `Metadata API` (`export const metadata = { ... }` or `generateMetadata()`). Manual `<head>` tags conflict with Next.js automated meta injection.

*Incorrect:*
```typescript
// app/page.tsx
export default function Page() {
  return <head><title>Page</title></head>; // ❌ Manual head tag conflict!
}
```

*Fix:*
```typescript
// app/page.tsx
export const metadata = {
  title: 'My Site',
  description: 'SEO optimized description'
};
```

---

### Mistake 3: Forgetting OpenGraph Images and Canonical URLs for Social Sharing

**The mistake:** Omitting `openGraph` and `alternates.canonical` properties in `metadata` objects.

**Why it's wrong:** Social media platforms (Twitter, LinkedIn, Facebook) require OpenGraph metadata (`og:image`, `og:title`) to generate rich preview cards when links are shared.

*Incorrect:*
```typescript
export const metadata = { title: 'Blog' }; // Missing OpenGraph image & canonical URL!
```

*Fix:*
```typescript
export const metadata = {
  title: 'Blog',
  openGraph: { images: ['/og-image.png'] },
  alternates: { canonical: 'https://example.com/blog' }
};
```


---

## 5. Practice Exercises

### Exercise 1: Configuring Page Title and Meta Tags with Static `metadata`

**Scenario:**
Configure page title, meta description, and canonical link tags using static `metadata` export.

**Requirements:**
1. Export `const metadata: Metadata` in `page.tsx` or `layout.tsx`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import type { Metadata } from "next";
> 
> export const metadata: Metadata = {
>   title: "Next.js SEO Masterclass",
>   description: "Learn how to optimize Next.js App Router applications for search engines.",
>   openGraph: {
>     title: "Next.js SEO Masterclass",
>     description: "Learn how to optimize Next.js App Router applications for search engines.",
>     images: ["/og-image.jpg"]
>   }
> };
> 
> export default function Page() {
>   return <h1>SEO Optimized Page</h1>;
> }
> ```
> 
> #### Technical Explanation
>
> 1. Exporting `const metadata: Metadata` in App Router components injects static meta tags into server-rendered HTML.
> 2. `openGraph` properties configure social share card previews (Facebook, Twitter, LinkedIn).
> 3. Executed on the server for maximum search crawler visibility.
> 
---

### Exercise 2: Generating Dynamic Meta Data with `generateMetadata()`

**Scenario:**
Generate dynamic SEO meta tags based on fetched product database parameters.

**Requirements:**
1. Export `generateMetadata({ params }): Promise<Metadata>`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import type { Metadata } from "next";
> 
> export async function generateMetadata({
>   params
> }: {
>   params: Promise<{ id: string }>;
> }): Promise<Metadata> {
>   const { id } = await params;
>   const res = await fetch(`https://api.example.com/products/${id}`);
>   const product = await res.json();
> 
>   return {
>     title: `${product.title} | Store`,
>     description: product.description
>   };
> }
> ```
> 
> #### Technical Explanation
>
> 1. `generateMetadata()` resolves dynamic route parameters and fetches remote API data to construct page metadata.
> 2. Automatically deduplicates data requests shared with the page component via fetch request memoization.
> 3. Crucial for e-commerce and CMS dynamic SEO pages.
> 
---

### Exercise 3: Generating Dynamic `sitemap.ts` and `robots.ts`

**Scenario:**
Create dynamic `app/sitemap.ts` and `app/robots.ts` files for search crawler indexing.

**Requirements:**
1. Create `app/sitemap.ts` exporting default function returning array of route objects.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/sitemap.ts
> import type { MetadataRoute } from "next";
> 
> export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
>   return [
>     {
>       url: "https://example.com",
>       lastModified: new Date(),
>       changeFrequency: "yearly",
>       priority: 1
>     },
>     {
>       url: "https://example.com/about",
>       lastModified: new Date(),
>       changeFrequency: "monthly",
>       priority: 0.8
>     }
>   ];
> }
> ```
> 
> #### Technical Explanation
>
> 1. `app/sitemap.ts` automatically generates a valid `/sitemap.xml` HTTP endpoint.
> 2. Dynamic sitemaps inform search crawlers of newly added database items.
> 3. Standard technical SEO infrastructure feature.
> 
---


## 6. Related Terms
- [Next.js Overview](nextjs.md) — The parent framework.
- [Dynamic Rendering (SSR)](../level_08/ssr.md) — The server-rendering strategy that makes SEO possible.
- [Metadata API (`metadata`)](../level_09/metadata_api.md) — Related concept: Metadata API (`metadata`).

---

## 7. Key Takeaways
- SEO crawler bots parse HTML structures to read, index, and rank web pages.
- Client-Side Rendered (CSR) apps send empty HTML, resulting in delayed or missing indexing.
- Next.js pre-compiles components on the server to send fully formed HTML.
- Instant server-rendered HTML enables search indexing and social media Open Graph cards.
- Never write client-side script hacks (like `document.title = ...`) to define SEO metadata; use Next.js's Metadata API instead.
