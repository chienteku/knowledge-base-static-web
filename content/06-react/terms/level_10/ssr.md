# Server-Side Rendering (SSR)

> **Level 10 — Modern React & Architectures**
> The process of executing React components on a server during incoming HTTP requests to generate a fully populated HTML document for instant initial browser rendering.

---

## 1. Prerequisites

- [Single Page Applications (SPA)](../level_09/spa.md) — The client-side rendering model that SSR improves upon.
- [Next.js](nextjs.md) — The production meta-framework that automates server-side rendering in React.

---

## 2. Term Category

**Rendering Mechanic (server html rendering)**: Server-Side Rendering (SSR) is an application architecture and rendering pipeline where React component hierarchies execute on a Node.js or Edge server runtime upon receiving a client HTTP request. The server evaluates component render logic, fetches co-located data dependencies, constructs a virtual DOM tree, and serializes the tree into a complete HTML string.

This complete HTML document is transmitted to the client browser, allowing the browser to paint visible UI content immediately upon receiving the initial response byte stream. Once the HTML is painted, the browser downloads the component JavaScript bundles to perform [Hydration](hydration.md), attaching event listeners to transform static HTML into an interactive Single Page Application.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In standard Client-Side Rendered (CSR) React applications, the server sends an empty HTML placeholder file containing a single root node (`<div id="root"></div>`) alongside script tags referencing component bundles. The browser user sees a blank white screen while downloading, parsing, and executing multi-megabyte JavaScript files before making secondary REST/GraphQL API requests to fetch data.

This client-centric approach creates two major production problems:
1. **Poor Initial Load Performance:** Users on mobile devices or low-bandwidth networks experience long Time to Interactive (TTI) and delayed First Contentful Paint (FCP).
2. **Search Engine Optimization (SEO) Penalties:** Search engine web crawlers and social media link preview bots often parse initial raw HTML markup. Empty `<div id="root"></div>` placeholders result in poor indexation and broken social link previews.

Server-Side Rendering (SSR) solves both problems. By moving database fetching and component HTML rendering to the server, SSR returns 100% complete HTML markup on the initial HTTP response. Web crawlers receive rich, searchable content immediately, and users view fully styled content on first paint.

### (2) Reality Metaphor

Imagine dining at a full-service restaurant.

- **Client-Side Rendering (Raw Ingredients Delivery):** You sit at a table (**the browser**). The waiter brings out raw flour, unpeeled potatoes, uncooked meat, and a portable stove (**downloading JS bundles**). You must chop the vegetables, cook the steak, and assemble the meal yourself at the table before eating (**client rendering & data fetching**).
- **Server-Side Rendering (Hot Plated Meal):** You order your meal. The chef prepares, cooks, and plates the hot steak and sides inside the kitchen (**server component rendering & DB queries**). The waiter carries out a fully cooked, beautifully plated meal directly to your table (**fully rendered HTML string**). You begin eating immediately (**instant initial paint**), while the waiter places napkins and silverware on the table (**hydration**).

### (3) React Code Examples

#### Short Snippet

```jsx
// app/feed/page.jsx (Next.js SSR - On-Demand Dynamic Rendering)
export default async function NewsFeedPage() {
  // cache: 'no-store' forces per-request dynamic Server-Side Rendering (SSR)
  const res = await fetch('https://api.example.com/feed', {
    cache: 'no-store'
  });
  const posts = await res.json();

  return (
    <main className="feed-container">
      <h1>Live Industry Feed</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.headline}</li>
        ))}
      </ul>
    </main>
  );
}
```

#### Fuller Example

```jsx
// app/account/dashboard/page.jsx
import { headers, cookies } from 'next/headers';
import { UserGreeting } from './UserGreeting';

async function fetchAuthenticatedAccount() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  // Perform per-request server fetch using user cookies
  const res = await fetch('https://api.example.com/user/account', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store' // SSR: Never static cache user session data
  });
  
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

export default async function AccountDashboardPage() {
  const account = await fetchAuthenticatedAccount();

  return (
    <section className="account-dashboard">
      <header className="dashboard-header">
        <h2>Account Overview</h2>
        <UserGreeting name={account.name} role={account.role} />
      </header>

      <div className="metrics-grid">
        <div className="card">
          <h4>Active Subscriptions</h4>
          <p>{account.subscriptionCount}</p>
        </div>
        <div className="card">
          <h4>Current Balance</h4>
          <p>${account.balance.toFixed(2)}</p>
        </div>
      </div>
    </section>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Accessing browser global objects (`window`, `document`, `localStorage`) during initial SSR render

**The mistake:** Reading `window.innerWidth` or `localStorage.getItem('token')` in the main body of an SSR component.

**Why it's wrong:** SSR components execute on a Node.js server environment where browser objects like `window` and `localStorage` do not exist. Accessing them during render causes immediate `ReferenceError: window is not defined` server crashes.

*Incorrect:*
```jsx
// app/dashboard/page.jsx
export default function Dashboard() {
  // ❌ Crash: window is undefined on Node.js server!
  const theme = localStorage.getItem('theme');
  return <div className={theme}>Dashboard</div>;
}
```

*Fix:*
```jsx
// app/dashboard/page.jsx
'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Access browser localStorage safely inside useEffect after hydration
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);

  return <div className={theme}>Dashboard</div>;
}
```

### Mistake 2: Executing heavy un-cached database queries on every SSR request

**The mistake:** Running expensive 5-second un-indexed database queries directly inside per-request SSR render functions without caching.

**Why it's wrong:** SSR renders HTML on every single incoming HTTP request. If database queries take 5 seconds, the server delays sending response bytes, causing high Time to First Byte (TTFB) and leaving users staring at a blank tab.

*Incorrect:*
```jsx
// ❌ Delays HTTP response by 5 seconds for every request!
export default async function SlowPage() {
  const data = await db.rawQuery('SELECT * FROM massive_table_unindexed');
  return <div>Data count: {data.length}</div>;
}
```

*Fix:*
```jsx
// Wrap heavy data fetching in React cache() or use Streaming SSR (<Suspense>)
import { cache } from 'react';

const getCachedData = cache(async () => {
  return db.rawQuery('SELECT * FROM massive_table_indexed');
});

export default async function FastPage() {
  const data = await getCachedData();
  return <div>Data count: {data.length}</div>;
}
```

### Mistake 3: Importing server-only secrets into Client Components during SSR setup

**The mistake:** Importing a database password or private API key into a component marked with `"use client"`.

**Why it's wrong:** Client Components execute on both server (for initial SSR HTML) AND browser (for hydration). Secrets imported into Client Components get bundled into public JavaScript files sent to the browser.

*Incorrect:*
```jsx
// ClientCard.jsx
'use client';
import { DB_PASSWORD } from '@/lib/db'; // ❌ Leaked in public browser JS!
```

*Fix:*
```jsx
// Keep secrets inside server components or server-only modules
import 'server-only';
```

---

## 5. Practice Exercises

### Exercise 1: IoT Live Fleet Tracker (SSR Request Authorization)

**Scenario:** Develop an IoT Fleet Management page that checks session bearer tokens from request headers on every request via SSR, fetching live vehicle positions on demand.

**Requirements:**
1. Read dynamic `auth_token` header asynchronously.
2. Perform per-request server fetch with `cache: 'no-store'`.
3. Render live vehicle telemetry cards in server HTML.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // app/fleet/page.jsx
> import { headers } from 'next/headers';
> import { redirect } from 'next/navigation';
>
> async function fetchFleetPositions() {
>   const headerList = await headers();
>   const token = headerList.get('authorization');
>
>   if (!token) return null;
>
>   const res = await fetch('https://api.iot.example.com/fleet/positions', {
>     headers: { Authorization: token },
>     cache: 'no-store' // Per-request SSR
>   });
>
>   if (!res.ok) return null;
>   return res.json();
> }
>
> export default async function FleetTrackerPage() {
>   const vehicles = await fetchFleetPositions();
> 
>   if (!vehicles) {
>     redirect('/login');
>   }
> 
>   return (
>     <main className="fleet-page">
>       <h2>Active Vehicle Telemetry ({vehicles.length} Units)</h2>
>       <div className="vehicle-grid">
>         {vehicles.map(v => (
>           <article key={v.vin} className="vehicle-card">
>             <h3>Truck #{v.unitNumber}</h3>
>             <p>Lat: {v.latitude}, Lng: {v.longitude}</p>
>             <p>Speed: {v.speedMph} MPH</p>
>           </article>
>         ))}
>       </div>
>     </main>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Per-Request Headers**: `headers()` inspects incoming HTTP request headers on the server runtime.
> 2. **Dynamic SSR Fetching**: `cache: 'no-store'` guarantees fresh vehicle position data is fetched on every page load.
> 3. **Server Navigation**: `redirect('/login')` executes server-side header redirects before sending HTML bytes to unauthenticated clients.
> 4. **SEO & Security**: Vehicle coordinates are rendered securely into initial server HTML without exposing auth credentials in client bundles.
> 
### Exercise 2: Financial Order Book SSR Renderer

**Scenario:** Construct a Financial Order Book page that renders real-time bid/ask order tables on the server per request, providing instant initial HTML load for trading terminals.

**Requirements:**
1. Query order book depth from server API using `cache: 'no-store'`.
2. Format currency strings on the server.
3. Render bid and ask tables side-by-side.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // app/orderbook/[pair]/page.jsx
> async function getOrderBook(pair) {
>   const res = await fetch(`https://api.exchange.example.com/depth/${pair}`, {
>     cache: 'no-store'
>   });
>   return res.json();
> }
>
> export default async function OrderBookPage({ params }) {
>   const { pair } = await params;
>   const book = await getOrderBook(pair);
> 
>   return (
>     <div className="orderbook-container">
>       <h2>Order Depth: {pair.toUpperCase()}</h2>
>       <div className="tables-row">
>         <div className="bids-column">
>           <h3>Bids (Buy)</h3>
>           {book.bids.map(([price, qty], i) => (
>             <div key={i} className="row bid">
>               <span>${Number(price).toFixed(2)}</span>
>               <span>{qty}</span>
>             </div>
>           ))}
>         </div>
>         <div className="asks-column">
>           <h3>Asks (Sell)</h3>
>           {book.asks.map(([price, qty], i) => (
>             <div key={i} className="row ask">
>               <span>${Number(price).toFixed(2)}</span>
>               <span>{qty}</span>
>             </div>
>           ))}
>         </div>
>       </div>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Dynamic Path SSR**: Dynamic route param `pair` triggers server-side order book fetching per request.
> 2. **Instant Terminal Paint**: Traders receive fully rendered order book HTML tables on first paint.
> 3. **No-Store Directive**: `cache: 'no-store'` prevents stale order book data from caching on CDNs.
> 4. **Server Numeric Formatting**: Number precision formatting executes on Node.js runtime before sending HTML markup.
> 
### Exercise 3: E-Commerce Dynamic Cart SSR View

**Scenario:** Develop an e-commerce shopping cart summary page rendered on the server using session cookies to compute cart subtotal prices securely.

**Requirements:**
1. Read cart session cookie on server runtime.
2. Fetch live item prices and calculate total subtotal on server.
3. Render shopping cart HTML table.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> // app/cart/page.jsx
> import { cookies } from 'next/headers';
>
> async function getCartData() {
>   const cookieStore = await cookies();
>   const cartId = cookieStore.get('cart_id')?.value;
>
>   if (!cartId) return { items: [], total: 0 };
>
>   const res = await fetch(`https://api.store.example.com/carts/${cartId}`, {
>     cache: 'no-store'
>   });
>   return res.json();
> }
>
> export default async function CartPage() {
>   const cart = await getCartData();
> 
>   return (
>     <main className="cart-page">
>       <h2>Your Shopping Cart</h2>
>       {cart.items.length === 0 ? (
>         <p>Your cart is empty.</p>
>       ) : (
>         <div className="cart-content">
>           <ul>
>             {cart.items.map(item => (
>               <li key={item.id}>
>                 <span>{item.name} (x{item.quantity})</span>
>                 <span>${(item.price * item.quantity).toFixed(2)}</span>
>               </li>
>             ))}
>           </ul>
>           <div className="summary">
>             <strong>Subtotal: ${cart.total.toFixed(2)}</strong>
>           </div>
>         </div>
>       )}
>     </main>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Cookie-Based SSR**: Server reads user session `cart_id` directly from incoming request cookies.
> 2. **Secure Computation**: Subtotal calculations run securely on server runtime without client tampering.
> 3. **Instant First Paint**: Fully computed cart table is rendered into initial HTML document.
> 4. **Dynamic Data Gate**: `cache: 'no-store'` guarantees updated item quantities appear on every page refresh.
> 
---

## 6. Related Terms

- [Hydration](hydration.md) — The process that links event handlers to server-rendered HTML.
- [Static Site Generation (SSG)](ssg.md) — Build-time pre-rendering alternative to SSR.
- [Streaming SSR](streaming_ssr.md) — Progressive server HTML chunk streaming.
- [Next.js](nextjs.md) — The framework providing automated SSR infrastructure.

---

## 7. Key Takeaways

- Server-Side Rendering (SSR) generates complete HTML on the server during incoming HTTP requests.
- Solves blank white screen delays and poor SEO issues associated with Client-Side Rendering (CSR).
- Never access browser-only globals (`window`, `localStorage`) directly inside initial component render.
- Use `cache: 'no-store'` in modern Next.js to enforce dynamic per-request SSR execution.
- Hydration attaches event listeners to server-rendered HTML once JavaScript bundles download in the browser.
