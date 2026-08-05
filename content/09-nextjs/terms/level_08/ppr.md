# Partial Prerendering (PPR)

> **Level 8 — Rendering Strategies & Cache**
> An experimental Next.js 15 feature that combines SSG (Static) and SSR (Dynamic) on the *same page*, wrapping dynamic components in Suspense while serving a static HTML shell instantly.

---

## 1. Prerequisites
- [Static Site Generation (SSG)](ssg.md) — The static shell.
- [Dynamic Rendering (SSR)](ssr.md) — The dynamic holes.
- [Streaming with `<Suspense>`](../level_05/streaming.md) — The mechanism that glues them together.
---

## 2. Term Category
- **Rendering Strategy / Bleeding Edge**

---

## 3. Environment Context
- **Server (Build-Time & Request-Time)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Historically, a Next.js page was either entirely Static (SSG) or entirely Dynamic (SSR). 
If you had an e-commerce product page, 95% of it was static (title, description, images). But if you added a dynamic "Add to Cart" button that checked the user's session cookie, the *entire page* was forced into SSR. The user had to wait for the server to render the 95% static content every single time just to get the 5% dynamic content.
**Partial Prerendering (PPR)** solves this by allowing a page to be both static AND dynamic simultaneously.

### (2) How PPR works
With PPR enabled, you build your page normally, but you wrap your dynamic components (components that read cookies or use `no-store` fetches) inside a React `<Suspense>` boundary.

```tsx
import { Suspense } from 'react';
import StaticProductDetails from './StaticProductDetails';
import DynamicCartButton from './DynamicCartButton'; // Reads cookies!

export default function ProductPage() {
  return (
    <main>
      {/* 1. This is perfectly static. */}
      <StaticProductDetails /> 

      {/* 2. We wrap the dynamic component in Suspense! */}
      <Suspense fallback={<button disabled>Loading Cart...</button>}>
        <DynamicCartButton />
      </Suspense>
    </main>
  );
}
```

**The PPR Flow:**
1. **Build Time:** Next.js renders the `StaticProductDetails` into HTML. When it hits the `<Suspense>` boundary, it stops, and instead renders the `fallback` UI (the loading button) into the HTML. It saves this as a static "shell".
2. **Request Time:** A user visits. Next.js instantly sends the static shell from the CDN. The user immediately sees the product details and a "Loading Cart..." button.
3. **Simultaneously:** Next.js spins up the Node server to dynamically render the `DynamicCartButton`. A split second later, it streams the finished dynamic HTML into the browser, replacing the fallback.

### (3) The Result
You get the instant First Contentful Paint (FCP) of a static site, but the personalized data capabilities of a dynamic site. It is the holy grail of web rendering.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Calling dynamic functions outside of Suspense

**The mistake:** A developer enables PPR, wraps their cart component in Suspense, but accidentally reads `cookies().get('theme')` at the very top of `page.tsx`.

**Why it's wrong:** If a dynamic function like `cookies()` is called in the main page component *outside* of a Suspense boundary, Next.js has no choice but to opt the *entire page* back into standard SSR. The static shell cannot be generated.
**Golden Rule:** To utilize PPR, you must strictly isolate all dynamic functions (`cookies`, `headers`, `no-store` fetches) inside child components, and wrap those specific children in `<Suspense>`.

---

### Mistake 2: Assuming Partial Prerendering (PPR) Requires Complete Architectural Rewrites

**The mistake:** Rewriting static pages into client components to prepare for Partial Prerendering.

**Why it's wrong:** PPR leverages existing React Suspense boundaries automatically. Static HTML layout shells render instantly while dynamic Suspense boundaries stream in concurrently.

*Incorrect:*
```tsx
/* Rewriting static layout components into client components for PPR */
```

*Fix:*
```tsx
/* Wrap dynamic server components in <Suspense> boundaries; PPR handles the hybrid shell automatically */
```

---

### Mistake 3: Using PPR in Production Without Enabling Experimental Config Flags

**The mistake:** Expecting PPR to function without enabling `experimental.ppr` in `next.config.js`.

**Why it's wrong:** Partial Prerendering (PPR) is an experimental feature in Next.js 14/15 requiring explicit opt-in configuration.

*Incorrect:*
```tsx
/* Expecting PPR hybrid rendering without experimental next.config.js flag */
```

*Fix:*
```javascript
// next.config.js
module.exports = {
  experimental: { ppr: 'incremental' }
};
```


---

### Mistake 4: Assuming Partial Prerendering (PPR) Requires Complete Architectural Rewrites

**The mistake:** Rewriting static pages into client components to prepare for Partial Prerendering.

**Why it's wrong:** PPR leverages existing React Suspense boundaries automatically. Static HTML layout shells render instantly while dynamic Suspense boundaries stream in concurrently.

*Incorrect:*
```tsx
/* Rewriting static layout components into client components for PPR */
```

*Fix:*
```tsx
/* Wrap dynamic server components in <Suspense> boundaries; PPR handles the hybrid shell automatically */
```

---

### Mistake 5: Using PPR in Production Without Enabling Experimental Config Flags

**The mistake:** Expecting PPR to function without enabling `experimental.ppr` in `next.config.js`.

**Why it's wrong:** Partial Prerendering (PPR) is an experimental feature in Next.js 14/15 requiring explicit opt-in configuration.

*Incorrect:*
```tsx
/* Expecting PPR hybrid rendering without experimental next.config.js flag */
```

*Fix:*
```javascript
// next.config.js
module.exports = {
  experimental: { ppr: 'incremental' }
};
```


---

### Mistake 6: Assuming Partial Prerendering (PPR) Requires Complete Architectural Rewrites

**The mistake:** Rewriting static pages into client components to prepare for Partial Prerendering.

**Why it's wrong:** PPR leverages existing React Suspense boundaries automatically. Static HTML layout shells render instantly while dynamic Suspense boundaries stream in concurrently.

*Incorrect:*
```tsx
/* Rewriting static layout components into client components for PPR */
```

*Fix:*
```tsx
/* Wrap dynamic server components in <Suspense> boundaries; PPR handles the hybrid shell automatically */
```

---

### Mistake 7: Using PPR in Production Without Enabling Experimental Config Flags

**The mistake:** Expecting PPR to function without enabling `experimental.ppr` in `next.config.js`.

**Why it's wrong:** Partial Prerendering (PPR) is an experimental feature in Next.js 14/15 requiring explicit opt-in configuration.

*Incorrect:*
```tsx
/* Expecting PPR hybrid rendering without experimental next.config.js flag */
```

*Fix:*
```javascript
// next.config.js
module.exports = {
  experimental: { ppr: 'incremental' }
};
```


---

## 6. Practice Exercises

### Exercise 1: PPR vs Streaming

**Problem:** What is the difference between standard Streaming (Level 5) and PPR? They both use `<Suspense>`.

**Expected output:**
> [!check]- Answer
> ```text
> Standard Streaming (SSR): The server still receives the request, waits for the Node process to boot, renders the static parts dynamically, and sends them. It just doesn't wait for the slow data.
> PPR: The static parts are pre-rendered at BUILD TIME into an actual HTML file stored on a CDN. The CDN instantly serves the shell without the Node server doing any work. The Node server ONLY boots up to fill in the Suspense holes.
> ```
> - Think about where the initial HTML comes from (CDN vs Node.js).

---

### Exercise 2: PPR Hybrid Architecture Flow

**Problem:** Describe how Partial Prerendering (PPR) combines SSG and SSR into a single page HTTP response.

**Expected output:**
> [!check]- Answer
> ```text
> PPR pre-renders the static HTML shell at build time (SSG), serving it instantly, while streaming dynamic Suspense holes from the server in parallel (SSR).
> ```
> - PPR combines instant static HTML shell + dynamic Suspense streaming.
> 
> ```text
> Instant Static Shell (SSG) + Streamed Dynamic Holes (SSR)
> ```

---

### Exercise 3: PPR Experimental Config Syntax

**Problem:** Write `next.config.js` snippet enabling incremental PPR support.

**Expected output:**
> [!check]- Answer
> ```javascript
> module.exports = { experimental: { ppr: 'incremental' } };
> ```
> - `experimental.ppr = 'incremental'` enables route-level PPR opt-in.
> 
> ```javascript
> module.exports = {
>   experimental: {
>     ppr: 'incremental'
>   }
> };
> ```


---

## 7. Related Terms
- [Streaming with `<Suspense>`](../level_05/streaming.md) — The React primitive that enables PPR.
- [Static Site Generation (SSG)](ssg.md) — The strategy used for the "shell."
- [React Server Components (RSC)](../level_01/rsc.md) — React Server Components.
- [React Suspense](../level_02/react_suspense.md) — Partial Prerendering suspense boundaries.
---

## 8. Key Takeaways
- **Partial Prerendering (PPR)** is an advanced rendering strategy that combines SSG and SSR on the same page.
- At build time, Next.js generates a static HTML shell containing all static content and the Suspense `fallback` UIs.
- At request time, the static shell is served instantly, while the dynamic components inside the Suspense boundaries are rendered on the server and streamed in.
- All dynamic functions (cookies, headers) MUST be pushed down into child components wrapped in `<Suspense>` for PPR to work.
