# Static Site Generation (SSG)

> **Level 10 — Modern React & Architectures**
> A rendering strategy where React components are executed and converted into HTML files **at Build Time** (when the developer deploys the app), rather than on every user request.

---

## 1. Prerequisites
- [Server-Side Rendering (SSR)](../level_10/ssr.md) — SSG is essentially SSR, but done ahead of time.
- [Next.js](../level_10/nextjs.md) — The framework that popularized SSG.

---

## 2. Term Category
- **Web Architecture / Rendering Strategy**

---

## 3. Environment Context
- **Build-Time (CI/CD Pipeline)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
SSR is great, but it has a flaw: if 100,000 users visit your blog at the exact same time, your Node.js server has to run the React components and fetch the database 100,000 times! The server will crash.
But wait... a blog post doesn't change! Why are we regenerating the same "Top 10 React Hooks" HTML file for every single user?
**Static Site Generation (SSG)** fixes this. When the developer runs `npm run build`, Next.js fetches all the blog posts from the database, runs the React components, and saves the output as static `.html` files. 

### (2) The Ultimate Performance
When a user visits the site, the server doesn't run any React code. It doesn't query the database. It simply serves the pre-built `blog.html` file instantly from a CDN (Content Delivery Network).
This makes SSG the absolute fastest, cheapest, and most scalable way to serve web pages on the internet.

### (3) When to use SSG vs SSR
- **Use SSG (Pre-building):** For Marketing pages, Blogs, Documentation, E-commerce Product Pages. (Data that is the same for every user and changes rarely).
- **Use SSR (On-Demand):** For User Dashboards, Live Sports Scores, Shopping Carts. (Data that is unique to the user or changes every second).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use SSG for user-specific data

**The mistake:** A developer uses SSG to build a `/profile` page, but tries to display the `user.name` from the database.

**Why it's wrong:** SSG runs at Build Time (on your laptop or GitHub Actions). At Build Time, there is no "logged-in user"! The HTML file generated will either be broken or show the same user for everyone. 
**Golden Rule:** You cannot use SSG for pages that require an active user session or cookies.

---



### Mistake 2: Using Static Site Generation (SSG) for Real-Time Dynamic User Dashboards

**The mistake:** Building a live stock trading dashboard using Static Site Generation.

**Why it's wrong:** SSG pre-renders HTML pages AT BUILD TIME! Pages pre-rendered via SSG will show static stale data unless rebuilt or revalidated. Use Server-Side Rendering (SSR) or Incremental Static Regeneration (ISR).

*Incorrect:*
```javascript
// Pre-rendering live stock ticker at build time via SSG
```

*Fix:*
```javascript
Use SSR or ISR (revalidate interval) for frequently updating dynamic data
```

### Mistake 3: Failing to Handle `fallback` Pages in Incremental Static Generation (`getStaticPaths`)

**The mistake:** Setting `fallback: false` when 100,000 product pages exist, pre-rendering only 10 at build time.

**Why it's wrong:** Setting `fallback: false` returns a 404 error for any product URL not pre-rendered during build! Use `fallback: 'blocking'` to render new paths dynamically on demand.

*Incorrect:*
```javascript
export async function getStaticPaths() {
  return { paths: [...top10], fallback: false }; // ❌ Returns 404 for product 11!
}
```

*Fix:*
```javascript
return { paths: [...top10], fallback: 'blocking' }; // Generates missing pages on-demand
```

## 6. Practice Exercises

### Exercise 1: Pick the Strategy

**Problem:** You are building an E-commerce store. You have two pages:
1. `ShoppingCart` (Shows what the current user has in their cart).
2. `TermsOfService` (A massive wall of legal text).
Which rendering strategy (SSR or SSG) should you use for each?

**Expected output:**
> [!check]- Answer
> ```text
> 1. ShoppingCart: Must use SSR (or Client-Side Rendering). It depends on the current user's session cookies.
> 2. TermsOfService: Must use SSG. The text is the same for every human on Earth, so build it into a static HTML file once to save server costs!
> ```
> - If it's the same for everyone, pre-build it.

---



### Exercise 2: SSG Concept Definition

**Problem:** Define Static Site Generation (SSG) (Pre-rendering HTML pages at build time to serve static HTML from CDN edge caches).

**Expected output:**
> [!check]- Answer
> ```text
> Pre-rendering HTML pages at build time to serve static HTML from CDN edge caches
> ```
> ```text
> Pre-rendering HTML pages at build time to serve static HTML from CDN edge caches
> ```
>
> **Explanation:** SSG delivers maximum page load performance by serving pre-built HTML from CDN edges.

---

### Exercise 3: ISR Revalidation Option

**Problem:** How do you enable Incremental Static Regeneration (ISR) to re-build static pages in background every 60 seconds? (Specify `next: { revalidate: 60 }` in fetch or `export const revalidate = 60`).

**Expected output:**
> [!check]- Answer
> ```text
> Specify revalidate: 60 (revalidate interval in seconds)
> ```
> ```javascript
> export const revalidate = 60; // Revalidate page every 60s
> ```
>
> **Explanation:** ISR updates static CDN pages in the background at specified time intervals.

## 7. Related Terms
- [Server-Side Rendering (SSR)](../level_10/ssr.md) — Rendering on-demand per request.
- [Next.js](../level_10/nextjs.md) — Next.js allows you to mix SSG and SSR in the exact same application on a per-page basis!

---

## 8. Key Takeaways
- **Static Site Generation (SSG)** executes React components at Build Time (`npm run build`) and saves them as static HTML files.
- It is the fastest, cheapest, and most scalable rendering strategy.
- It is perfect for content that is the same for all users (Blogs, Docs, Marketing).
- It cannot be used for highly dynamic, user-specific data (like a private dashboard).
