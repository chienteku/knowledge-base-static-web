# Next.js

> **Level 10 — Modern React & Architectures**
> An industry-standard full-stack meta-framework built on React that provides routing, rendering strategies, and backend capabilities.

---

## 1. Prerequisites

- [Declarative Programming](../level_01/declarative_programming.md) — Next.js builds directly on React's declarative component architecture.
- [Client-Side Routing](../level_09/client_side_routing.md) — Next.js provides file-system routing as an alternative to external routers.

---

## 2. Term Category

**Ecosystem (full-stack meta-framework)**: Next.js is an opinionated production meta-framework designed around React core rendering capabilities. While standalone React is a UI library focused strictly on rendering view hierarchies, Next.js provides complete application infrastructure, including file-system routing, Server-Side Rendering (SSR), Static Site Generation (SSG), Incremental Static Regeneration (ISR), asset optimization, and integrated server endpoints.

By integrating Webpack, Turbopack, and Node.js server runtimes with React Server Components (RSC), Next.js manages code-splitting, bundle optimization, and server-client execution boundaries out of the box. It serves as the primary production framework recommended by the React core team.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional Client-Side Rendered (CSR) React applications, developers had to integrate and configure dozens of separate libraries to create a production app: React Router for navigation, Webpack/Babel for compilation, Express.js for backend APIs, and complex custom infrastructure for Server-Side Rendering. This fragmenting led to inconsistent configurations, large client bundle sizes, and poor Search Engine Optimization (SEO).

Next.js was created to provide a unified, full-stack architecture for React applications. It introduces **File-Based Routing** (where directory structures map directly to application URLs) and unifies server and client rendering into a single developer experience.

In the modern Next.js App Router (introduced in Next.js 13+), components render on the server as React Server Components (RSC) by default. Next.js extends native JavaScript `fetch` with granular caching options (`force-cache` for SSG, `no-store` for SSR, `revalidate` for ISR), allowing developers to configure server data fetching strategy directly within individual components.

### (2) Reality Metaphor

Imagine a commercial construction general contractor.

- **Vanilla React (Buying Raw Materials):** You buy lumber, bricks, plumbing pipes, and electrical wire separately from different hardware stores. You must manually construct the foundation, frame the house, install the electrical grid, and pass inspections yourself.
- **Next.js (Move-In Ready Modular Home Framework):** Next.js delivers a engineered house complete with pre-routed plumbing (file-based routing), installed electrical grids (built-in data fetching & server rendering), and insulated walls (built-in bundler & code splitting). You customize the interior design (write React components), while the framework handles structural integrity and municipal code compliance automatically.

### (3) React Code Examples

#### Short Snippet

```jsx
// app/posts/[id]/page.jsx (Next.js App Router Dynamic Page)
export default async function PostPage({ params }) {
  const { id } = await params;
  
  // Server-side fetch with caching (SSG-equivalent)
  const res = await fetch(`https://api.example.com/posts/${id}`, {
    cache: 'force-cache'
  });
  const post = await res.json();

  return (
    <article className="post-container">
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  );
}
```

#### Fuller Example

```jsx
// app/dashboard/analytics/page.jsx
import { Suspense } from 'react';
import { InteractiveFilter } from './InteractiveFilter';

async function fetchRealtimeMetrics() {
  // On-demand server fetch (SSR-equivalent: no-store)
  const res = await fetch('https://api.example.com/metrics', {
    cache: 'no-store'
  });
  return res.json();
}

async function MetricsList() {
  const metrics = await fetchRealtimeMetrics();

  return (
    <ul className="metrics-grid">
      {metrics.map(m => (
        <li key={m.id} className="metric-card">
          <span>{m.label}</span>
          <strong>{m.value}</strong>
        </li>
      ))}
    </ul>
  );
}

export default function AnalyticsDashboard() {
  return (
    <main className="dashboard-page">
      <header className="page-header">
        <h2>Executive Telemetry Dashboard</h2>
        <InteractiveFilter />
      </header>

      <section className="metrics-section">
        <Suspense fallback={<div className="skeleton">Loading live metrics...</div>}>
          <MetricsList />
        </Suspense>
      </section>
    </main>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using legacy Pages Router data methods (`getStaticProps`) inside Next.js App Router (`app/`)

**The mistake:** Exporting `getStaticProps` or `getServerSideProps` inside an App Router directory file (`app/page.jsx`).

**Why it's wrong:** The Next.js App Router completely replaced legacy data fetching methods with async React Server Components and extended `fetch()` options. Exporting `getStaticProps` in the `app/` directory is ignored or causes build errors.

*Incorrect:*
```jsx
// app/page.jsx
export async function getStaticProps() {
  // ❌ Legacy Pages Router method ignored in App Router!
  const data = await getData();
  return { props: { data } };
}
```

*Fix:*
```jsx
// app/page.jsx
export default async function Page() {
  // Directly await data fetching inside async Server Component
  const data = await getData();
  return <main>{data.title}</main>;
}
```

### Mistake 2: Accessing browser globals (`window` or `localStorage`) in top-level App Router components

**The mistake:** Reading `window.location.href` directly inside an App Router component without declaring `"use client"`.

**Why it's wrong:** Next.js App Router components execute on the Node.js server by default during render. `window` is undefined in server runtimes, throwing `ReferenceError: window is not defined`.

*Incorrect:*
```jsx
// app/profile/page.jsx
export default function ProfilePage() {
  const path = window.location.pathname; // ❌ ReferenceError on server!
  return <div>Path: {path}</div>;
}
```

*Fix:*
```jsx
// app/profile/page.jsx
'use client';

import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [path, setPath] = useState('');

  useEffect(() => {
    setPath(window.location.pathname);
  }, []);

  return <div>Path: {path}</div>;
}
```

### Mistake 3: Overusing `"use client"` at directory layout levels

**The mistake:** Placing `"use client"` at line 1 of `app/layout.jsx` to enable client state or hooks in navigation bars.

**Why it's wrong:** Adding `"use client"` to a top-level layout converts the layout and every child route imported beneath it into Client Components, losing Server Component bundle optimization across the application.

*Incorrect:*
```jsx
// app/layout.jsx
'use client'; // ❌ Turns entire application tree into client bundle!

export default function RootLayout({ children }) {
  return <html><body>{children}</body></html>;
}
```

*Fix:*
```jsx
// app/layout.jsx (Server Component)
import { ClientNav } from './ClientNav'; // 'use client' inside ClientNav only

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ClientNav />
        {children}
      </body>
    </html>
  );
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Device Tracking Route Setup

**Scenario:** Configure a Next.js App Router file structure and page component for tracking IoT devices dynamically by ID (`/devices/[deviceId]`). The device status must revalidate from the server every 30 seconds.

**Requirements:**
1. Specify correct App Router file path location.
2. Read dynamic `deviceId` param asynchronously.
3. Perform server fetch with `{ next: { revalidate: 30 } }`.
4. Render device telemetry fields in semantic HTML.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // File Location: app/devices/[deviceId]/page.jsx
>
> async function getDeviceTelemetry(deviceId) {
>   const res = await fetch(`https://api.iot.example.com/devices/${deviceId}`, {
>     next: { revalidate: 30 } // ISR revalidation every 30s
>   });
>   if (!res.ok) throw new Error('Failed to fetch device telemetry');
>   return res.json();
> }
>
> export default async function DeviceDetailPage({ params }) {
>   const { deviceId } = await params;
>   const device = await getDeviceTelemetry(deviceId);
>
>   return (
>     <main className="device-page">
>       <h2>IoT Node #{device.id}</h2>
>       <div className="status-badge">{device.status}</div>
>       <p>Battery: {device.batteryLevel}%</p>
>       <p>Last Sync: {device.lastSeen}</p>
>     </main>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **File System Route**: Folder structure `app/devices/[deviceId]/page.jsx` maps automatically to `/devices/:deviceId`.
> 2. **Async Route Params**: Route params are accessed asynchronously via `await params` in modern Next.js.
> 3. **ISR Cache Strategy**: `{ next: { revalidate: 30 } }` configures Incremental Static Regeneration, caching data for 30s across requests.
> 4. **Zero Client JS**: Component executes purely on the server, outputting static HTML without sending fetch logic to the browser.
> 
### Exercise 2: Financial Trading Portal Layout Composition

**Scenario:** Design a Next.js App Router root layout for a financial trading portal. The root layout must remain a Server Component, but nest an interactive client header containing market ticker search input.

**Requirements:**
1. Create `MarketSearchHeader` with `"use client"` and state control.
2. Create `RootLayout` as a Server Component importing `MarketSearchHeader`.
3. Accept and render `{children}` prop inside `<body>`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // app/components/MarketSearchHeader.jsx
> 'use client';
>
> import { useState } from 'react';
>
> export function MarketSearchHeader() {
>   const [query, setQuery] = useState('');
> 
>   return (
>     <header className="ticker-header">
>       <h1>TradeDesk Pro</h1>
>       <input 
>         type="text" 
>         placeholder="Search symbol (e.g. AAPL)..."
>         value={query}
>         onChange={(e) => setQuery(e.target.value)}
>       />
>     </header>
>   );
> }
>
> // app/layout.jsx (Server Component)
> import { MarketSearchHeader } from './components/MarketSearchHeader';
>
> export default function RootLayout({ children }) {
>   return (
>     <html lang="en">
>       <body>
>         <MarketSearchHeader />
>         <div className="main-content">{children}</div>
>       </body>
>     </html>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Isolated Client Boundary**: `"use client"` is isolated inside `MarketSearchHeader.jsx`, keeping `RootLayout` as a server component.
> 2. **Layout Preservation**: `RootLayout` remains a Server Component, preserving zero-JS server rendering for route children.
> 3. **Input State Handling**: Local search input state is encapsulated inside the client widget.
> 4. **Composition Shell**: Layout wraps nested page children cleanly inside server HTML shell.
> 
### Exercise 3: E-Commerce Catalog Dynamic Caching Switch

**Scenario:** Create a product catalog fetch helper that dynamically switches fetch options between `'force-cache'` (SSG for standard products) and `'no-store'` (SSR for flash-sale products).

**Requirements:**
1. Implement `fetchCatalog(isFlashSale)` helper.
2. Use conditional object configuration for `fetch`.
3. Render product list inside an async Server Component page.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // app/catalog/page.jsx
> async function fetchCatalog(isFlashSale) {
>   const cacheStrategy = isFlashSale ? 'no-store' : 'force-cache';
>   const res = await fetch('https://api.store.example.com/products', {
>     cache: cacheStrategy
>   });
>   return res.json();
> }
>
> export default async function CatalogPage({ searchParams }) {
>   const sParams = await searchParams;
>   const isFlash = sParams.flash === 'true';
>   const products = await fetchCatalog(isFlash);
>
>   return (
>     <section className="catalog-section">
>       <h2>{isFlash ? '⚡ Flash Sale Live Catalog' : 'Standard Product Catalog'}</h2>
>       <div className="grid">
>         {products.map(p => (
>           <article key={p.id} className="product-card">
>             <h3>{p.name}</h3>
>             <p>${p.price}</p>
>           </article>
>         ))}
>       </div>
>     </section>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Dynamic Cache Control**: `cache: 'no-store'` forces per-request SSR, while `cache: 'force-cache'` enforces static SSG caching.
> 2. **Search Params Resolution**: `searchParams` prop is resolved asynchronously in App Router server pages.
> 3. **Conditional Rendering**: Server page switches titles and rendering behavior seamlessly based on query parameters.
> 4. **Optimized Server Execution**: Data fetching logic executes entirely on the server without client bundle overhead.
> 
---

## 6. Related Terms

- [Server-Side Rendering (SSR)](ssr.md) — The dynamic server HTML rendering strategy provided by Next.js.
- [Static Site Generation (SSG)](ssg.md) — Build-time static HTML generation in Next.js.
- [React Server Components (RSC)](rsc.md) — The default component model used in Next.js App Router.
- [Client vs Server Components & `"use client"`](client_server_components.md) — The module boundary system used by Next.js.

---

## 7. Key Takeaways

- Next.js is a full-stack Meta-Framework built on React providing routing, SSR, SSG, and backend capabilities.
- The App Router uses file-system routing where directory structures define application URLs.
- App Router components render as React Server Components (RSC) on the server by default.
- Modern Next.js extends native `fetch()` options (`force-cache`, `no-store`, `revalidate`) for server data fetching.
- Use `"use client"` sparingly on interactive leaf components to avoid inflating client bundle sizes.
