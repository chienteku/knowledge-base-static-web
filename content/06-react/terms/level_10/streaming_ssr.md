# Streaming SSR

> **Level 10 — Modern React & Architectures**
> Sending HTML to the browser in progressive chunks as it renders on the server, leveraging React Suspense boundaries.

---

## 1. Prerequisites

- [Server-Side Rendering (SSR)](ssr.md) — The baseline server HTML rendering model that streaming enhances.
- [Suspense](../level_08/suspense.md) — The component boundary mechanism that isolates slow async components during streaming.

---

## 2. Term Category

**Rendering Mechanic (progressive HTML streaming)**: Streaming SSR is a modern rendering engine capability introduced in React 18 (`renderToPipeableStream` and `renderToReadableStream`) that breaks monolithic server HTML generation into progressive stream chunks. Utilizing standard HTTP 1.1 Chunked Transfer Encoding, the server immediately flushes the shell HTML structure (headers, sidebars, navigation) to the browser without waiting for slow asynchronous server data dependencies to resolve.

Slow or async components are wrapped inside `<Suspense>` boundaries. While the server awaits slow data, it renders fallback placeholder HTML in the initial stream. Once the async component finishes rendering on the server, React pipes the resolved component HTML chunk down the *same* HTTP connection, accompanied by inline JavaScript script tags that seamlessly swap out the placeholder DOM nodes in real time.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional Server-Side Rendering (SSR), server rendering is all-or-nothing. The Node.js server must complete every database query, microservice call, and component render across the entire page tree before sending a single byte of HTML to the client browser.

If a page contains an instant static Header component alongside a slow 4-second Product Recommendation widget, the entire server response is blocked. The user sits staring at a blank browser tab for 4 seconds, resulting in high **Time to First Byte (TTFB)**. Once the monolithic HTML finally arrives, the browser must download all component JavaScript and perform full hydration before any part of the page becomes interactive.

Streaming SSR (combined with React 18 **Selective Hydration**) eliminates this bottleneck:
- **Instant Shell Delivery:** The server streams the immediate page layout (shell) instantly, dropping TTFB to milliseconds.
- **Progressive Chunking:** Slow components stream in as they finish resolving on the server.
- **Selective Hydration:** React begins hydrating interactive components that have already arrived in the browser without waiting for slow suspended components to finish downloading.

### (2) Reality Metaphor

Imagine dining at a multi-course restaurant.

- **Monolithic Traditional SSR (Single Buffet Delivery):** The chef refuses to send any dishes out to your table until all 8 courses—including a 45-minute slow-roasted duck—are fully cooked. You sit staring at an empty table starving for 45 minutes (**high TTFB / blank tab**).
- **Streaming SSR (Course-by-Course Delivery):** As soon as the soup and warm bread are ready, the waiter brings them to your table immediately (**initial shell HTML painted**). You eat your soup (**interactive layout**) while the chef continues roasting the duck in the kitchen. As each dish finishes, the waiter carries it out to your table one by one (**streaming HTML chunks**).

### (3) React Code Examples

#### Short Snippet

```jsx
// app/dashboard/page.jsx (Next.js Streaming SSR with Suspense)
import { Suspense } from 'react';

async function SlowAnalyticsWidget() {
  // Simulated 3-second database delay
  await new Promise(res => setTimeout(res, 3000));
  return <div className="widget">Analytics Data: 100,000 Impressions</div>;
}

export default function DashboardPage() {
  return (
    <main className="dashboard-shell">
      <h1>Executive Dashboard</h1> {/* Sent instantly in initial HTML shell */}
      
      <Suspense fallback={<div className="skeleton">Loading analytics...</div>}>
        <SlowAnalyticsWidget /> {/* Streamed over HTTP connection when ready */}
      </Suspense>
    </main>
  );
}
```

#### Fuller Example

```jsx
// Node.js Express Server with renderToPipeableStream
import { renderToPipeableStream } from 'react-dom/server';
import ExpressApp from 'express';
import App from './src/App';

const app = ExpressApp();

app.get('/', (req, res) => {
  let didError = false;

  const stream = renderToPipeableStream(<App />, {
    bootstrapScripts: ['/client-bundle.js'], // Client hydration bundle
    onShellReady() {
      // The initial shell layout has finished rendering on the server
      res.statusCode = didError ? 500 : 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      // Pipe initial HTML shell stream directly to response
      stream.pipe(res);
    },
    onShellError(err) {
      // Fallback if the root shell itself fails
      res.statusCode = 500;
      res.send('<!text/html><p>Server Error</p>');
    },
    onError(err) {
      didError = true;
      console.error('Streaming SSR Error:', err);
    }
  });
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using synchronous `renderToString` instead of stream APIs

**The mistake:** Calling legacy `renderToString(<App />)` on the server while expecting progressive HTML streaming to occur.

**Why it's wrong:** `renderToString` is a synchronous operation that blocks execution and returns a single monolithic HTML string. It cannot pipe HTML chunks or support React Suspense boundaries on the server.

*Incorrect:*
```javascript
// ❌ renderToString cannot stream HTML chunks; blocks TTFB!
const html = renderToString(<App />);
res.send(html);
```

*Fix:*
```javascript
// Use renderToPipeableStream (Node.js) or renderToReadableStream (Edge)
const stream = renderToPipeableStream(<App />, {
  onShellReady() { stream.pipe(res); }
});
```

### Mistake 2: Awaiting slow data requests above `<Suspense>` boundaries

**The mistake:** Placing `await fetchSlowData()` inside a top-level parent component outside `<Suspense>`.

**Why it's wrong:** If an `await` statement executes in a parent component outside `<Suspense>`, the server cannot generate the initial HTML shell until that promise resolves, defeating the purpose of streaming SSR.

*Incorrect:*
```jsx
// app/page.jsx
export default async function Page() {
  // ❌ Blocks initial HTML shell delivery for 4 seconds!
  const slowData = await fetchSlowData(); 

  return (
    <div>
      <Header />
      <Suspense fallback={<Skeleton />}>
        <Widget data={slowData} />
      </Suspense>
    </div>
  );
}
```

*Fix:*
```jsx
// app/page.jsx
export default function Page() {
  return (
    <div>
      <Header /> {/* Shell sent immediately */}
      <Suspense fallback={<Skeleton />}>
        <AsyncWidget /> {/* Async fetch co-located inside AsyncWidget */}
      </Suspense>
    </div>
  );
}

async function AsyncWidget() {
  const slowData = await fetchSlowData(); // Awaited inside Suspense boundary
  return <div>{slowData.val}</div>;
}
```

### Mistake 3: Assuming Streaming SSR requires WebSockets or HTTP/2 Server Push

**The mistake:** Configuring WebSocket connections or push servers under the assumption that streaming HTML requires WebSockets.

**Why it's wrong:** Streaming SSR operates over standard **HTTP 1.1 Chunked Transfer Encoding** using standard HTTP GET requests. No WebSockets or specialized protocols are required.

*Incorrect:*
```javascript
// Assuming WebSockets are required to stream React HTML components
```

*Fix:*
```javascript
// Standard HTTP responses support chunked transfer encoding automatically
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Real-Time Streaming Shell

**Scenario:** Develop an IoT Monitoring page where header controls render immediately, while slow sensor telemetry queries stream into their respective `<Suspense>` boundaries as data arrives from edge nodes.

**Requirements:**
1. Implement `InstantHeader` returning static markup.
2. Implement async `SlowTurbineMetrics` with simulated 2s delay.
3. Wrap `SlowTurbineMetrics` inside `<Suspense>` with skeleton fallback.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import { Suspense } from 'react';
>
> function InstantHeader() {
>   return (
>     <header className="telemetry-header">
>       <h2>IoT Plant Command Center</h2>
>       <span className="status-online">System Active</span>
>     </header>
>   );
> }
>
> async function SlowTurbineMetrics() {
>   // Simulate edge sensor network delay
>   await new Promise(res => setTimeout(res, 2000));
>   
>   return (
>     <div className="metrics-box">
>       <h3>Turbine #4 Telemetry</h3>
>       <p>RPM: 3,450 | Temp: 71.8°C | Output: 14.2 MW</p>
>     </div>
>   );
> }
>
> export default function TelemetryDashboard() {
>   return (
>     <main className="dashboard-container">
>       <InstantHeader />
>       
>       <section className="stream-section">
>         <Suspense fallback={<div className="skeleton-box">Fetching turbine telemetry...</div>}>
>           <SlowTurbineMetrics />
>         </Suspense>
>       </section>
>     </main>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Instant Shell Delivery**: `InstantHeader` is flushed immediately in initial HTTP response stream.
> 2. **Boundary Isolation**: `<Suspense>` boundary isolates the 2-second delay of `SlowTurbineMetrics`.
> 3. **Chunk Inlining**: Server pipes resolved `SlowTurbineMetrics` HTML down the connection once promise resolves.
> 4. **Selective Hydration**: Browser hydrates header elements before turbine metrics chunk arrives.
> 
### Exercise 2: Financial Market Depth Streaming Deck

**Scenario:** Build a Financial Trading deck where market navigation bars render instantly, while slow order book depth calculations stream in progressively.

**Requirements:**
1. Render instant market navigation header.
2. Wrap async `SlowOrderBookDepth` in `<Suspense>`.
3. Provide realistic skeleton loader markup.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import { Suspense } from 'react';
>
> function MarketHeader({ ticker }) {
>   return (
>     <div className="market-bar">
>       <h1>Symbol: {ticker}</h1>
>       <span className="live-pill">LIVE TRADING</span>
>     </div>
>   );
> }
>
> async function SlowOrderBookDepth({ ticker }) {
>   // Simulate complex market depth calculation
>   await new Promise(res => setTimeout(res, 1500));
>   
>   return (
>     <div className="depth-table">
>       <h4>Order Book Depth ({ticker})</h4>
>       <p>Top Bid: $184.50 (Qty: 1,200) | Top Ask: $184.55 (Qty: 800)</p>
>     </div>
>   );
> }
>
> export default async function TradingDeck({ params }) {
>   const { ticker = 'AAPL' } = await params;
>
>   return (
>     <div className="trading-deck">
>       <MarketHeader ticker={ticker} />
>       
>       <Suspense fallback={<div className="depth-skeleton">Calculating order depth...</div>}>
>         <SlowOrderBookDepth ticker={ticker} />
>       </Suspense>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **TTFB Optimization**: Shell HTML containing market ticker displays in sub-50ms.
> 2. **Non-Blocking Compute**: Heavy market depth calculation does not delay page header delivery.
> 3. **In-Place Replacement**: React replaces fallback skeleton with order depth HTML automatically.
> 4. **HTTP Stream Pipe**: Data streams over standard HTTP connection using transfer chunking.
> 
### Exercise 3: E-Commerce Product Page Streaming Matrix

**Scenario:** Construct an e-commerce product page streaming layout where core product images and titles load instantly, while customer reviews stream in asynchronously.

**Requirements:**
1. Render static product image and title shell.
2. Co-locate async fetch inside `SlowCustomerReviews`.
3. Wrap reviews in `<Suspense>` boundary.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import { Suspense } from 'react';
>
> function ProductShell({ product }) {
>   return (
>     <div className="product-hero">
>       <img src={product.image} alt={product.title} />
>       <h2>{product.title}</h2>
>       <p className="price">${product.price}</p>
>     </div>
>   );
> }
>
> async function SlowCustomerReviews({ productId }) {
>   // Simulated slow database review query
>   await new Promise(res => setTimeout(res, 2500));
> 
>   return (
>     <div className="reviews-list">
>       <h3>Customer Reviews (4.8 ★)</h3>
>       <div className="review-item">
>         <p>"Outstanding build quality!" - Alex R.</p>
>       </div>
>     </div>
>   );
> }
>
> export default function ProductPage() {
>   const sampleProduct = { id: 'p101', title: 'Wireless Headphones', price: 199.99, image: '/headset.jpg' };
> 
>   return (
>     <main className="product-page">
>       <ProductShell product={sampleProduct} />
>       
>       <Suspense fallback={<div className="reviews-skeleton">Loading customer reviews...</div>}>
>         <SlowCustomerReviews productId={sampleProduct.id} />
>       </Suspense>
>     </main>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Immediate Commerce UI**: Product images and prices display immediately for fast user purchasing intent.
> 2. **Asynchronous Review Fetching**: Slow review database queries are deferred behind `<Suspense>`.
> 3. **Progressive Hydration**: Users can interact with cart buttons while reviews are still streaming.
> 4. **Seamless Replacement**: Streamed HTML chunks inject inline scripts that replace skeleton placeholders smoothly.
> 
---

## 6. Related Terms

- [Server-Side Rendering (SSR)](ssr.md) — The baseline server rendering model enhanced by streaming.
- [Suspense](../level_08/suspense.md) — The component boundary mechanism catching async promises.
- [Concurrent Rendering](../level_08/concurrent_rendering.md) — The engine prioritizing component hydration.
- [React Server Components (RSC)](rsc.md) — Server architecture leveraging streaming payloads.

---

## 7. Key Takeaways

- Streaming SSR delivers HTML to the browser in progressive chunks as it generates on the server.
- Reduces Time to First Byte (TTFB) and eliminates blank screen loading stutters.
- Use `<Suspense>` boundaries to isolate slow async components during server rendering.
- Modern server stream APIs (`renderToPipeableStream`) pipe HTML over standard HTTP chunked connections.
- Selective Hydration allows the browser to hydrate available components before slow chunks finish downloading.
