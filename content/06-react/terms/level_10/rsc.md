# React Server Components (RSC)

> **Level 10 — Modern React & Architectures**
> An architectural paradigm that enables components to execute exclusively on the server, streaming serializable node trees without sending component JavaScript to the browser.

---

## 1. Prerequisites

- [Server-Side Rendering (SSR)](ssr.md) — SSR renders initial HTML on the server; RSC allows components to run exclusively on the server permanently.
- [Hydration](hydration.md) — React Server Components completely bypass the client hydration process.

---

## 2. Term Category

**Rendering Mechanic (server component engine)**: React Server Components (RSC) represent a fundamental shift in React's component execution model. Unlike traditional React components—which run on both server and client to facilitate DOM hydration—Server Components execute strictly during server render time. They return a serialized virtual DOM format (JSON-like RSC payload) that streams directly to the browser to construct UI nodes.

Because Server Component code never leaves the server, heavy npm dependencies, file-system drivers, and database ORM libraries imported inside RSC files add zero bytes to the client JavaScript bundle. Server Components can seamlessly interweave interactive Client Components (`"use client"`) into their render tree via prop composition.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional single-page application (SPA) architectures and standard Server-Side Rendering (SSR), every component rendered on the screen must eventually download its matching JavaScript file to the user's browser. If a blog application imports a 2MB Markdown parsing library or a complex data visualization package to render static articles on the server, that entire 2MB library must still be shipped to the client browser so React can hydrate the page.

React Server Components solve this bundle bloat problem. RSCs execute purely on Node.js/Edge server environments, transform data into UI node trees, and then terminate. The executable JavaScript code for the Server Component and its server-only imports is never transmitted across the network.

Furthermore, RSCs solve the "waterfall fetch" problem. Instead of forcing client components to render, trigger `useEffect`, and execute sequential `fetch` requests over latency-heavy mobile networks, Server Components perform asynchronous `async/await` database queries directly co-located within the component body on high-bandwidth datacenter networks.

### (2) Reality Metaphor

Imagine a legal print shop.

- **Client Components (Self-Assembly Kits):** A customer asks for a bound legal contract booklet. The shop mails a package containing blank paper, leather cover sheets, heavy binding glue, hole punchers, and an instruction manual (**downloading JS bundles**). The customer must assemble the booklet themselves at home (**hydration**).
- **Server Components (Finished Bound Books):** The shop uses industrial binding machinery and heavy commercial presses in their warehouse (**server ORM & libraries**). They print, bind, and trim the document inside the warehouse, sending only the completed bound book (**lightweight RSC JSON/HTML stream**) to the customer. The customer receives a finished product without ever needing heavy bookbinding tools at home.

### (3) React Code Examples

#### Short Snippet

```jsx
// ServerUserCard.jsx (React Server Component - Default)
import db from '@/lib/db'; // Server-only database client

export default async function ServerUserCard({ userId }) {
  // Direct async/await database query co-located inside component
  const user = await db.users.findUnique({ where: { id: userId } });

  return (
    <article className="user-card">
      <h3>{user.name}</h3>
      <p>Role: {user.role}</p>
    </article>
  );
}
```

#### Fuller Example

```jsx
// ArticleReader.jsx (Server Component)
import { parseMarkdown } from 'heavy-markdown-library'; // 500KB library - 0 bytes sent to client!
import { BookmarkButton } from './BookmarkButton'; // Interactive Client Component

async function getArticle(slug) {
  const article = await db.articles.findFirst({ where: { slug } });
  return article;
}

export default async function ArticleReader({ slug }) {
  const article = await getArticle(slug);
  // Transform raw markdown into HTML string on the server
  const htmlContent = parseMarkdown(article.rawBody);

  return (
    <main className="article-container">
      <header className="article-header">
        <h1>{article.title}</h1>
        <p className="byline">Published by {article.author}</p>
        
        {/* Pass primitive serializable props to Client Component */}
        <BookmarkButton articleId={article.id} initialBookmarked={false} />
      </header>

      <section 
        className="article-body"
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />
    </main>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to call state or lifecycle hooks (`useState`, `useEffect`) inside RSCs

**The mistake:** Calling `useState` or `useEffect` inside an async Server Component function body.

**Why it's wrong:** Server Components run once on the server to produce serializable UI output and do not persist in browser memory. Browser concept abstractions like component state, effect lifecycles, and event listeners do not exist in RSCs.

*Incorrect:*
```jsx
// ServerFeed.jsx
export default async function ServerFeed() {
  const [likes, setLikes] = useState(0); // ❌ Error: Hooks not supported in Server Components!
  const posts = await db.getPosts();
  return <div>Posts ({likes})</div>;
}
```

*Fix:*
```jsx
// Separate state into a dedicated Client Component
// LikeButton.jsx ('use client')
'use client';
export function LikeButton() {
  const [likes, setLikes] = useState(0);
  return <button onClick={() => setLikes(prev => prev + 1)}>Likes: {likes}</button>;
}
```

### Mistake 2: Importing server-only secrets into Client Components

**The mistake:** Importing a database client module containing secret credentials into a file marked with `"use client"`.

**Why it's wrong:** Files marked with `"use client"` are bundled into public JavaScript files sent to the browser. Any secret API keys or database connection strings imported into Client Components will be publicly visible to users inspecting browser source code.

*Incorrect:*
```jsx
// ClientWidget.jsx
'use client';

import { DB_SECRET_KEY } from '@/lib/db'; // ❌ Secret exposed in browser bundle!

export function ClientWidget() {
  return <div>Key: {DB_SECRET_KEY}</div>;
}
```

*Fix:*
```jsx
// Guard server modules using 'server-only' package
// lib/db.js
import 'server-only'; // Triggers build error if imported in Client Component
export const DB_SECRET_KEY = process.env.DB_SECRET_KEY;
```

### Mistake 3: Passing non-serializable objects (e.g. Promises or Functions) as props to Client Components

**The mistake:** Passing a callback function prop `<ClientWidget onSelect={() => alert('hi')} />` from a Server Component.

**Why it's wrong:** Server Components serialize props sent to Client Components using the RSC binary/JSON wire format. JavaScript functions and complex class instances cannot be serialized across network/runtime boundaries.

*Incorrect:*
```jsx
// ServerPage.jsx
import { ClientButton } from './ClientButton';

export default function ServerPage() {
  return <ClientButton onClick={() => console.log('Click')} />; // ❌ Function prop cannot be serialized!
}
```

*Fix:*
```jsx
// Keep callback logic inside Client Component
// ClientButton.jsx ('use client')
'use client';

export function ClientButton() {
  return <button onClick={() => console.log('Click')}>Click Me</button>;
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Industrial Telemetry Reader

**Scenario:** Develop an IoT telemetry view where sensor readings are queried directly from an influx database inside a Server Component, while emergency shutdown controls operate inside a Client Component.

**Requirements:**
1. Implement async Server Component `SensorTelemetryPage`.
2. Query sensor metrics directly using `async/await`.
3. Pass primitive sensor status and threshold numbers to interactive client component `ShutdownControl`.
4. Ensure zero database client code is shipped to the browser.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // ShutdownControl.jsx
> 'use client';
>
> import { useState } from 'react';
>
> export function ShutdownControl({ sensorId, maxTemp }) {
>   const [isShutdown, setIsShutdown] = useState(false);
> 
>   return (
>     <div className="control-panel">
>       <p>Max Operating Threshold: {maxTemp}°C</p>
>       <button 
>         className={isShutdown ? 'btn-red' : 'btn-gray'}
>         onClick={() => setIsShutdown(prev => !prev)}
>       >
>         {isShutdown ? 'SYSTEM HALTED' : `Emergency Stop #${sensorId}`}
>       </button>
>     </div>
>   );
> }
>
> // SensorTelemetryPage.jsx (Server Component)
> async function getSensorData(id) {
>   // Simulated direct DB query
>   return { id, location: 'Turbine-7', temp: 84.2, maxTemp: 95.0 };
> }
>
> export default async function SensorTelemetryPage({ sensorId = 't7' }) {
>   const sensor = await getSensorData(sensorId);
> 
>   return (
>     <section className="telemetry-screen">
>       <h2>Industrial Telemetry - {sensor.location}</h2>
>       <p>Current Temperature: {sensor.temp}°C</p>
>       <ShutdownControl sensorId={sensor.id} maxTemp={sensor.maxTemp} />
>     </section>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Direct DB Fetch**: `SensorTelemetryPage` queries database records directly on the server without custom REST endpoints.
> 2. **RSC Boundary**: `ShutdownControl` receives primitive serializable numbers (`sensorId`, `maxTemp`), maintaining clean prop boundary isolation.
> 3. **Bundle Reduction**: Influx DB drivers and query parsing libraries remain exclusively on the server.
> 4. **State Updater Integrity**: Toggle state inside `ShutdownControl` updates safely using `setIsShutdown(prev => !prev)`.
> 
### Exercise 2: Financial Stock Screener Data Pipeline

**Scenario:** Construct a Financial Stock Screener page where market equity data is parsed asynchronously on the server using a heavy financial math library, and filtered server-rendered rows are passed down to an interactive client pagination wrapper.

**Requirements:**
1. Create `FinancialScreener` as an async Server Component.
2. Use heavy server-side calculation functions to format market data.
3. Wrap rendered equity cards inside `PaginationWrapper` (`"use client"`) using the `children` composition pattern.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // PaginationWrapper.jsx
> 'use client';
>
> import { useState } from 'react';
>
> export function PaginationWrapper({ children }) {
>   const [page, setPage] = useState(1);
> 
>   return (
>     <div className="pagination-container">
>       <div className="page-controls">
>         <button onClick={() => setPage(prev => Math.max(1, prev - 1))}>Prev</button>
>         <span>Page {page}</span>
>         <button onClick={() => setPage(prev => prev + 1)}>Next</button>
>       </div>
>       <div className="content-slot">{children}</div>
>     </div>
>   );
> }
>
> // FinancialScreener.jsx (Server Component)
> async function getEquities() {
>   return [
>     { ticker: 'NVDA', peRatio: 42.1, marketCap: '2.8T' },
>     { ticker: 'AAPL', peRatio: 28.4, marketCap: '3.1T' }
>   ];
> }
>
> export default async function FinancialScreener() {
>   const equities = await getEquities();
> 
>   return (
>     <main className="screener">
>       <h2>Global Equity Screener</h2>
>       <PaginationWrapper>
>         {equities.map(eq => (
>           <div key={eq.ticker} className="equity-row">
>             <strong>{eq.ticker}</strong> | P/E: {eq.peRatio} | Cap: {eq.marketCap}
>           </div>
>         ))}
>       </PaginationWrapper>
>     </main>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Children Composition Slot**: Server-rendered equity rows are evaluated on the server and passed as `{children}` to `PaginationWrapper`.
> 2. **Zero-JS Financial Engines**: Financial math libraries run on the server without swelling client bundle payload.
> 3. **Encapsulated Client State**: Pagination control logic remains isolated within `"use client"` container.
> 4. **No Re-serialization**: Children node trees passed to client wrappers do not require secondary server network requests.
> 
### Exercise 3: E-Commerce Inventory Security Guard

**Scenario:** Implement a server component guard using the `server-only` package to prevent internal inventory pricing calculation algorithms from leaking into client-side bundles.

**Requirements:**
1. Import `server-only` inside `lib/pricing.js`.
2. Implement pricing function `calculateWholesalePrice(costPrice)`.
3. Call `calculateWholesalePrice` inside server component `WholesaleProductCard`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // lib/pricing.js
> import 'server-only'; // Enforces build error if accidentally imported in Client Component
>
> export function calculateWholesalePrice(costPrice) {
>   // Confidential pricing margin algorithm
>   const margin = 1.35;
>   return (costPrice * margin).toFixed(2);
> }
>
> // WholesaleProductCard.jsx (Server Component)
> import { calculateWholesalePrice } from '@/lib/pricing';
>
> export default async function WholesaleProductCard({ item }) {
>   const wholesale = calculateWholesalePrice(item.costPrice);
> 
>   return (
>     <div className="wholesale-card">
>       <h4>{item.name}</h4>
>       <p>MSRP: ${item.msrp}</p>
>       <p className="confidential">Wholesale Cost: ${wholesale}</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Build Guard Security**: `import 'server-only'` throws a compilation error if `pricing.js` is imported into a `"use client"` module.
> 2. **IP Protection**: Secret margin math algorithm stays 100% on the server.
> 3. **RSC Primitive Output**: Server component outputs pure rendered HTML text containing only final calculated numbers.
> 4. **Zero Overhead**: No pricing calculation logic or algorithm utilities are bundled into client JS assets.
> 
---

## 6. Related Terms

- [Server-Side Rendering (SSR)](ssr.md) — The baseline server rendering strategy.
- [Hydration](hydration.md) — The client process that RSCs bypass.
- [Client vs Server Components & `"use client"`](client_server_components.md) — The component boundary system separating RSCs from interactive components.
- [Server Actions & `"use server"`](server_actions.md) — Server-side mutation handlers invoked from client components.

---

## 7. Key Takeaways

- React Server Components execute exclusively on the server and send 0 bytes of component JS to the browser.
- Heavy npm packages and database drivers imported inside RSC files do not bloat client bundles.
- RSCs support co-located `async/await` data fetching directly inside component bodies.
- RSCs cannot use state hooks (`useState`), lifecycles (`useEffect`), or DOM event handlers (`onClick`).
- All props passed from RSCs to Client Components must be serializable.
- Protect server-only modules from leaking into client bundles using `import 'server-only'`.
