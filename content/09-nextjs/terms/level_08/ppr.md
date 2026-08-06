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

**Rendering Strategy** (Partial Prerendering Architecture): Partial Prerendering (PPR) combines static shell HTML prerendering with dynamic `<Suspense>` streaming in a single HTTP request.



---

## 3. Explanation

### Environment Context
- **Server (Build-Time & Request-Time)**

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

## 4. Common Mistakes & Pitfalls

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




---

## 5. Practice Exercises

### Exercise 1: Enabling Partial Prerendering in `next.config.js`

**Scenario:**
Enable experimental Partial Prerendering (PPR) support in `next.config.js`.

**Requirements:**
1. Set `experimental.ppr: "incremental"` in `next.config.js`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // next.config.js
> module.exports = {
>   experimental: {
>     ppr: "incremental"
>   }
> };
> ```

> #### Technical Explanation
>
> 1. Partial Prerendering (PPR) combines static shell HTML build-time prerendering with dynamic `<Suspense>` streaming.
> 2. `experimental.ppr = 'incremental'` enables opting individual route pages into PPR using `export const experimental_ppr = true`.
> 3. Next-generation rendering architecture in Next.js.

---

### Exercise 2: Structuring Pages for Partial Prerendering

**Scenario:**
Structure a product page where static product details are prerendered and dynamic user recommendations are wrapped in `<Suspense>`.

**Requirements:**
1. Export `experimental_ppr = true`.
2. Wrap dynamic component in `<Suspense>`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // app/products/[id]/page.tsx
> import { Suspense } from "react";
> import DynamicRecommendations from "./DynamicRecommendations";

export const experimental_ppr = true;

export default async function ProductPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="p-6">
      {/* Static Shell (Prerendered at build time) */}
      <h1 className="text-3xl font-bold">Product #{id}</h1>
      <p>Static product description and specifications...</p>

      {/* Dynamic Hole (Streamed at request time) */}
      <Suspense fallback={<div>Loading Personalized Recommendations...</div>}>
        <DynamicRecommendations productId={id} />
      </Suspense>
    </main>
  );
}
```

> #### Technical Explanation
>
> 1. In PPR, static HTML content outside `<Suspense>` boundaries is pre-built into static CDN files.
> 2. Dynamic components inside `<Suspense>` are left as "holes" that stream in parallel over open HTTP connections.
> 3. Delivers instant static TTFB while preserving dynamic personalization.

---

### Exercise 3: Auditing PPR Execution Model

**Scenario:**
Explain why PPR eliminates the traditional choice between SSG vs SSR for an entire page.

**Requirements:**
1. Contrast full page SSG/SSR vs PPR hybrid execution.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> PPR Architecture Benefits:
> - Traditional SSG: Entire page must be static. Dynamic user data breaks static build optimization.
> - Traditional SSR: Entire page is rendered dynamically on Node.js. Server must wait for all DB calls before returning HTML.
> - PPR (Partial Prerendering): Static shell is served from CDN instantly; dynamic holes stream in parallel on demand!
> ```

> #### Technical Explanation
>
> 1. PPR eliminates the trade-off between static CDN performance and dynamic user personalization.
> 2. Unifies static pre-rendering and dynamic streaming within a single route file.
> 3. Cutting-edge Web Core Vitals optimization model.

---




---

## 6. Related Terms
- [Streaming with `<Suspense>`](../level_05/streaming.md) — The React primitive that enables PPR.
- [Static Site Generation (SSG)](ssg.md) — The strategy used for the "shell."
- [React Server Components (RSC)](../level_01/rsc.md) — React Server Components.
- [React Suspense](../level_02/react_suspense.md) — Partial Prerendering suspense boundaries.

---

## 7. Key Takeaways
- **Partial Prerendering (PPR)** is an advanced rendering strategy that combines SSG and SSR on the same page.
- At build time, Next.js generates a static HTML shell containing all static content and the Suspense `fallback` UIs.
- At request time, the static shell is served instantly, while the dynamic components inside the Suspense boundaries are rendered on the server and streamed in.
- All dynamic functions (cookies, headers) MUST be pushed down into child components wrapped in `<Suspense>` for PPR to work.
