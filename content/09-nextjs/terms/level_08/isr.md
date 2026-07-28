# Incremental Static Regeneration (ISR)

> **Level 8 — Rendering Strategies & Cache**
> A hybrid rendering strategy that gives you the speed of SSG (Static HTML) with the flexibility to update that HTML periodically in the background without needing to rebuild the entire application.

---

## 1. Prerequisites
- [Static Site Generation (SSG)](../level_08/ssg.md) — The foundation of ISR.
- [Time-based Revalidation](../level_05/revalidation.md) — The data-fetching concept that powers ISR.

---

## 2. Term Category
- **Rendering Strategy / Optimization**

---

## 3. Environment Context
- **Server (Build-Time & Request-Time)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
SSG is incredibly fast, but if your site has 100,000 product pages, running `npm run build` to generate all 100,000 HTML files might take 2 hours. If a price changes on one product, you have to wait 2 hours to deploy the fix.
**Incremental Static Regeneration (ISR)** solves this by allowing you to create or update static pages *after* the build has finished, on a page-by-page basis.

### (2) How it works (The Stale-While-Revalidate Pattern)
In the App Router, ISR is implemented by combining Static Rendering with the `next.revalidate` fetch option (or exporting `const revalidate = 60`).

```tsx
// app/products/page.tsx
export const revalidate = 60; // Enable ISR with a 60-second timer!

export default async function ProductsPage() {
  const products = await db.product.findMany();
  return <ul>{products.map(p => <li>{p.name} - ${p.price}</li>)}</ul>;
}
```

**The Flow:**
1. **Build Time:** Next.js generates the static HTML for `/products` and deploys it.
2. **0s - 60s:** 1,000 users visit. They get the lightning-fast static HTML.
3. **61s:** The cache expires. User #1,001 visits. **They still get the old static HTML!** But Next.js instantly triggers a background process to re-run the React component and generate a *new* HTML file.
4. **65s:** The new HTML file replaces the old one. User #1,002 gets the fresh data.

### (3) Generating pages on-the-fly
ISR isn't just about updating existing pages; it can generate *new* pages!
If you have a dynamic route `app/post/[slug]/page.tsx`, and a user visits `/post/brand-new-post` (which wasn't generated at build time), Next.js will generate the HTML on-the-fly for that first user, save it to disk, and serve it statically to every user after them!

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting ISR to update instantly

**The mistake:** A marketing manager updates a typo on the homepage. They refresh the page and don't see the fix. They complain the site is broken.

**Why it's wrong:** ISR uses the "Stale-While-Revalidate" pattern. The very first visitor after the timer expires *always* receives the old, stale HTML. Their visit is simply the trigger that tells the server to build the new version in the background. You have to refresh a second time to see the new content.
**Golden Rule:** If instant updates are absolutely critical (like publishing a breaking news story), do not rely on time-based ISR. Use **On-Demand Revalidation** (`revalidatePath`) to instantly purge the cache.

---

### Mistake 2: Confusing Incremental Static Regeneration (ISR) with Traditional Static Site Generation (SSG)

**The mistake:** Expecting ISR pages to require a full CI/CD deployment build to update content.

**Why it's wrong:** ISR allows updating static pre-rendered HTML pages **in the background** after deployment without triggering a full site re-build.

*Incorrect:*
```tsx
/* Triggering full 20-minute CI/CD site rebuild to update 1 product price */
```

*Fix:*
```tsx
/* Use ISR (revalidate: 60) or on-demand revalidateTag('products') for background updates */
```

---

### Mistake 3: Setting Extremely Short ISR Revalidate Timers (`revalidate: 1`) for High-Traffic Sites

**The mistake:** Setting `export const revalidate = 1` on pages receiving 10,000 requests per second.

**Why it's wrong:** Extremely short timers force Next.js to trigger background revalidation builds continuously, negating static caching benefits and increasing server load. Balance timers or use event-based tags.

*Incorrect:*
```tsx
export const revalidate = 1; // ❌ Revalidates every second, inflating server load!
```

*Fix:*
```tsx
export const revalidate = 300; // 5-minute timer + revalidateTag() for instant updates
```


---

### Mistake 4: Confusing Incremental Static Regeneration (ISR) with Traditional Static Site Generation (SSG)

**The mistake:** Expecting ISR pages to require a full CI/CD deployment build to update content.

**Why it's wrong:** ISR allows updating static pre-rendered HTML pages **in the background** after deployment without triggering a full site re-build.

*Incorrect:*
```tsx
/* Triggering full 20-minute CI/CD site rebuild to update 1 product price */
```

*Fix:*
```tsx
/* Use ISR (revalidate: 60) or on-demand revalidateTag('products') for background updates */
```

---

### Mistake 5: Setting Extremely Short ISR Revalidate Timers (`revalidate: 1`) for High-Traffic Sites

**The mistake:** Setting `export const revalidate = 1` on pages receiving 10,000 requests per second.

**Why it's wrong:** Extremely short timers force Next.js to trigger background revalidation builds continuously, negating static caching benefits and increasing server load. Balance timers or use event-based tags.

*Incorrect:*
```tsx
export const revalidate = 1; // ❌ Revalidates every second, inflating server load!
```

*Fix:*
```tsx
export const revalidate = 300; // 5-minute timer + revalidateTag() for instant updates
```


---

### Mistake 6: Confusing Incremental Static Regeneration (ISR) with Traditional Static Site Generation (SSG)

**The mistake:** Expecting ISR pages to require a full CI/CD deployment build to update content.

**Why it's wrong:** ISR allows updating static pre-rendered HTML pages **in the background** after deployment without triggering a full site re-build.

*Incorrect:*
```tsx
/* Triggering full 20-minute CI/CD site rebuild to update 1 product price */
```

*Fix:*
```tsx
/* Use ISR (revalidate: 60) or on-demand revalidateTag('products') for background updates */
```

---

### Mistake 7: Setting Extremely Short ISR Revalidate Timers (`revalidate: 1`) for High-Traffic Sites

**The mistake:** Setting `export const revalidate = 1` on pages receiving 10,000 requests per second.

**Why it's wrong:** Extremely short timers force Next.js to trigger background revalidation builds continuously, negating static caching benefits and increasing server load. Balance timers or use event-based tags.

*Incorrect:*
```tsx
export const revalidate = 1; // ❌ Revalidates every second, inflating server load!
```

*Fix:*
```tsx
export const revalidate = 300; // 5-minute timer + revalidateTag() for instant updates
```


---

## 6. Practice Exercises

### Exercise 1: ISR vs SSR

**Problem:** An e-commerce checkout page requires reading the user's specific `session` cookie. Can you use ISR to make the checkout page faster?

**Expected output:**
> [!check]- Answer
> ```text
> No!
> ISR is still a form of Static Generation. A static HTML file is identical for every single user who visits it. 
> Because the checkout page relies on reading a user-specific cookie to show their specific cart, it MUST use Server-Side Rendering (Dynamic Rendering). You cannot serve User A's cached checkout HTML to User B!
> ```
> - Think about what static means: "The same for everyone."

---

### Exercise 2: Stale-While-Revalidate Flow

**Problem:** Trace the step-by-step ISR request flow when a user requests a page whose revalidate timer has expired.

**Expected output:**
> [!check]- Answer
> ```text
> 1. User requests page -> Next.js immediately serves cached stale HTML page
> 2. Next.js triggers background re-render of page on server
> 3. Subsequent user request receives newly generated HTML page
> ```
> - ISR uses stale-while-revalidate caching logic.
> 
> ```text
> 1. Serve Stale Page -> 2. Re-render Background -> 3. Serve Fresh Page
> ```

---

### Exercise 3: ISR Segment Config Syntax

**Problem:** Write App Router segment config exporting a 10-minute (600 seconds) ISR revalidate interval.

**Expected output:**
> [!check]- Answer
> ```typescript
> export const revalidate = 600;
> ```
> - `export const revalidate = N` defines ISR timer in seconds.
> 
> ```typescript
> export const revalidate = 600; // Revalidate every 10 minutes
> ```


---

## 7. Related Terms
- [Time-based Revalidation](../level_05/revalidation.md) — The exact same concept, applied to data fetching. ISR is what happens when that concept is applied to the page rendering level.
- [On-Demand Revalidation](../level_06/on_demand_revalidation.md) — The alternative to time-based ISR for instant updates.

---

## 8. Key Takeaways
- **ISR** allows you to update static pages in the background without rebuilding the entire app.
- It uses the **Stale-While-Revalidate** pattern: the first user after the cache expires gets old data, but triggers a background rebuild for future users.
- It can also be used to generate completely new pages on-the-fly that weren't known at build time.
- In the App Router, ISR is activated by setting a `revalidate` timer on data fetches or exporting the `revalidate` route segment config.
