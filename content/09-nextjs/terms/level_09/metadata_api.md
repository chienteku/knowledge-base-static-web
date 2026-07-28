# Metadata API (`metadata`)

> **Level 9 — Optimization**
> The App Router's built-in system for defining HTML `<head>` elements—like `<title>`, `<meta name="description">`, and Open Graph tags—directly within your layout and page files.

---

## 1. Prerequisites
- [HTML `<head>` Elements](../../../01-html/terms/level_01/head.md) — The tags being generated.
- [React Server Components (RSC)](../level_01/rsc.md) — The environment required to export this Metadata.

---

## 2. Term Category
- **SEO / Head Management**

---

## 3. Environment Context
- **Server Component ONLY**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard React (CSR), managing SEO is difficult. If you try to change the `<title>` using `document.title = "My Page"`, the change happens *after* the page loads. When a Twitter bot scrapes your site, it sees a blank title.
In the legacy Next.js Pages router, you had to use a special `<Head>` component and physically put `<title>` tags inside your JSX.
In the App Router, Next.js abstracted this completely. You no longer write `<title>` or `<meta>` tags. Instead, you just export a static `metadata` object from your `page.tsx` or `layout.tsx`, and Next.js automatically injects the perfect HTML into the `<head>` on the server before the page is sent to the browser.

### (2) The Static `metadata` Object
You export a constant named `metadata` of type `Metadata` from `next`.

```tsx
// app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | MyCompany',
  description: 'Learn about our mission and our team.',
  openGraph: {
    title: 'About Us',
    images: ['/og-about.jpg'],
  },
};

export default function AboutPage() {
  return <h1>About MyCompany</h1>;
}
```

### (3) Metadata Merging (Layouts to Pages)
Metadata is hierarchical. If you define a base `metadata` object in your root `app/layout.tsx`, and a specific one in `app/about/page.tsx`, Next.js intelligently merges them!

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'MyCompany',
    template: '%s | MyCompany', // This acts as a template for child pages!
  },
  description: 'The best software in the world.',
};

// app/pricing/page.tsx
export const metadata: Metadata = {
  title: 'Pricing', // Output becomes: "Pricing | MyCompany"
  // description is inherited from the layout!
};
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Exporting Metadata from a Client Component

**The mistake:** A developer writes `"use client"` at the top of a page, and then exports the `metadata` object.

**Why it's wrong:** Next.js explicitly forbids this. Metadata must be injected into the initial HTML document on the Server so search engines can read it. Client Components execute too late in the lifecycle. Next.js will throw a build error.
**Golden Rule:** You can ONLY export `metadata` from Server Components (`page.tsx` or `layout.tsx` without `"use client"`). If your page must be a Client Component, you should extract the client logic into a child component, and keep the `page.tsx` as a Server Component just to handle the Metadata.

---

### Mistake 2: Mutating Metadata Objects Dynamically inside Client Components

**The mistake:** Attempting to export `metadata` from a Client Component file (`'use client'`).

**Why it's wrong:** The Metadata API is supported ONLY in Server Components (`app/page.tsx` or `app/layout.tsx`). Exporting `metadata` from Client Components throws a compile error.

*Incorrect:*
```typescript
'use client';
export const metadata = { title: 'Client' }; // ❌ Error: Metadata cannot be exported from Client Components!
```

*Fix:*
```typescript
// Export metadata from Server Components (page.tsx or layout.tsx) only
```

---

### Mistake 3: Forgetting `title.template` in Root Layout Metadata

**The mistake:** Setting fixed static `title: 'My App'` in root layout without configuring title templates.

**Why it's wrong:** Configuring `title: { default: 'My App', template: '%s | My App' }` in root layout allows child pages to specify clean title strings (`title: 'Dashboard'`) that format automatically as `'Dashboard | My App'`. 

*Incorrect:*
```typescript
// app/layout.tsx
export const metadata = { title: 'My App' }; // Child pages override title completely without branding!
```

*Fix:*
```typescript
// app/layout.tsx
export const metadata = {
  title: {
    default: 'My App',
    template: '%s | My App'
  }
};
```


---

## 6. Practice Exercises

### Exercise 1: Overriding Metadata

**Problem:** You set `robots: { index: true }` in your root `layout.tsx`. In your `app/secret/page.tsx`, you want to prevent search engines from indexing the page. How do you override it?

**Expected output:**
> [!check]- Answer
> ```tsx
> // app/secret/page.tsx
> export const metadata = {
>   // Just define it in the page! Page metadata always overwrites Layout metadata.
>   robots: {
>     index: false,
>     follow: false,
>   }
> };
> ```
> - Child pages always have priority in the merge hierarchy.

---

### Exercise 2: Root Metadata Template Configuration

**Problem:** Write root layout `metadata` object with `title.default = 'Store'`, `title.template = '%s | Store'`, and `metadataBase` set to `https://example.com`.

**Expected output:**
> [!check]- Answer
> ```typescript
> export const metadata: Metadata = { metadataBase: new URL('https://example.com'), title: { default: 'Store', template: '%s | Store' } };
> ```
> - `metadataBase` resolves relative OpenGraph image URLs.
> 
> ```typescript
> import type { Metadata } from 'next';
> 
> export const metadata: Metadata = {
>   metadataBase: new URL('https://example.com'),
>   title: {
>     default: 'My E-Commerce Store',
>     template: '%s | Store'
>   },
>   description: 'Official store website'
> };
> ```

---

### Exercise 3: Metadata Inheritance Resolution

**Problem:** How does Next.js resolve metadata defined in both `app/layout.tsx` and nested `app/blog/page.tsx`?

**Expected output:**
> [!check]- Answer
> ```text
> Next.js merges metadata shallowly, overriding parent properties with child page properties while inheriting un-specified parent tags.
> ```
> - Child metadata overrides parent metadata tags shallowly.
> 
> ```text
> Root Layout Metadata + Child Page Metadata = Merged Final <head>
> ```


---

## 7. Related Terms
- [`generateMetadata`](../level_09/generate_metadata.md) — The dynamic version of the Metadata API.
- [`layout.tsx`](../level_02/layout.md) — The best place to establish your base metadata templates.

---

## 8. Key Takeaways
- The **Metadata API** allows you to manage `<title>`, `<meta>`, and Open Graph tags by exporting a static `metadata` object.
- Metadata is automatically merged. Root layouts provide defaults, and specific pages override them.
- You can use the `title.template` string in your root layout to automatically append your brand name to all child page titles.
- The `metadata` object can ONLY be exported from **Server Components**.
