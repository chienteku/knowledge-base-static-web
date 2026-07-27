# Streaming SSR

> **Level 10 — Modern React & Architectures**
> Sending HTML to the browser in chunks as it renders, instead of waiting for the full tree.

---

## 1. Prerequisites
- [Server-Side Rendering (SSR)](../level_10/ssr.md) — The static rendering foundation that streaming improves.
- [Lazy Loading & Suspense](../../level_08/suspense.md) — The boundary markers used to divide layout sections.

---

## 2. Term Category
- **Rendering Mechanic**

---

## 3. Environment Context
- **Server-Side ONLY / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional Server-Side Rendering (SSR), the server must render the *entire* HTML page before sending any data to the browser. If a single component in the page tree is slow (for example, fetching data from a slow external product database API), the server is blocked. The user is left staring at a blank screen, increasing the **Time to First Byte (TTFB)**.

Once the HTML finally arrives in the browser, the page is monolithic: the browser must download all JavaScript files and hydrate the entire page before the user can interact with any elements.

To resolve these delays, React 18 introduced **Streaming SSR** (powered by HTML5 chunked transfer encoding and `<Suspense>`):
-   **Chunked Delivery:** The server renders and sends HTML to the browser in chunks as soon as they are ready.
-   **Placeholder Swapping:** Slow components are wrapped in a `<Suspense>` boundary. The server renders the rest of the page immediately, leaving a placeholder (fallback) for the slow component, and sends this initial HTML stream to the browser.
-   **In-Place Update:** The server continues fetching data for the slow component. When the data resolves and the component renders, the server sends the updated HTML for that component down the *same* open HTTP connection, along with an inline JavaScript tag that replaces the placeholder in the DOM.
-   **Selective Hydration:** React hydrates parts of the page that have already loaded without waiting for slow suspended components to arrive.

---

### (2) Reality Metaphor
Imagine dining at a restaurant.
- **Traditional SSR (Single Buffet Delivery):** The chef refuses to bring any food to your table until all 10 courses of your meal are fully cooked. You sit staring at an empty table starving for 45 minutes (**high TTFB / blank screen**).
- **Streaming SSR (Course-by-Course Delivery):** As soon as the soup is ready, the waiter brings it to your table (**initial shell painted**). While you eat the soup, the chef continues cooking the steak. Plates are delivered one by one as they are finished (**streaming components**).

---

### (3) Code Example: Server Streaming Configuration

#### 1. The Component Tree (with Suspense boundaries)
```jsx
// App.js
import React, { Suspense } from 'react';

function App() {
  return (
    <div className="page">
      <header>My Tech Blog</header>
      
      {/* Exposes immediate header shell while articles stream */}
      <Suspense fallback={<div className="spinner">Loading articles...</div>}>
        <SlowArticlesList />
      </Suspense>
    </div>
  );
}
```

#### 2. The Server Express Route (Piping the Stream)
Instead of using `renderToString`, you use `renderToPipeableStream` to stream the rendered HTML to the Node.js response object:
```javascript
// server.js
import { renderToPipeableStream } from 'react-dom/server';
import express from 'express';
import App from './App';

const app = express();

app.get('/', (req, res) => {
  // Initialize pipeable stream from React DOM
  const stream = renderToPipeableStream(<App />, {
    bootstrapScripts: ['/client-bundle.js'], // Client JS for hydration
    onShellReady() {
      // The shell (everything outside Suspense) has rendered
      res.statusCode = 200;
      res.setHeader('Content-type', 'text/html');
      stream.pipe(res); // Start streaming HTML chunks to the response
    },
    onError(error) {
      console.error(error);
    }
  });
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `renderToString` and expecting HTML streaming to occur

**The mistake:** Calling the traditional `renderToString` function on the server, expecting the browser to receive chunked updates:

```javascript
// BAD: renderToString is synchronous and cannot stream chunks!
const html = renderToString(<App />);
res.send(html);
```

**Why it's wrong:** `renderToString` is a synchronous function that returns a single, complete string. The server cannot send any data to the browser until the entire HTML tree is rendered.

*Fix:* Use `renderToPipeableStream` (for Node.js environments) or `renderToReadableStream` (for Edge environments like Cloudflare Workers).

---



### Mistake 2: Blocking Initial HTML Delivery for Fast Content While Waiting for Slow Data

**The mistake:** Awaiting a slow 3-second API recommendation engine before sending initial page HTML header.

**Why it's wrong:** Without Streaming SSR, the server waits for ALL data to resolve before sending a single byte of HTML. Use Streaming SSR (`<Suspense>`) to stream the fast Header immediately, streaming slow recommendations when ready.

*Incorrect:*
```javascript
// Awaiting slow recommendations before sending any HTML to client
```

*Fix:*
```javascript
<Header /> {/* Sent instantly */}
<Suspense fallback={<Skeleton />}><SlowRecommendations /></Suspense> {/* Streamed when ready */}
```

### Mistake 3: Confusing Streaming SSR HTTP Response with WebSockets

**The mistake:** Thinking Streaming SSR requires WebSockets or HTTP/2 Server Push.

**Why it's wrong:** Streaming SSR uses standard **HTTP 1.1 Chunked Transfer Encoding** (`renderToReadableStream` / `renderToPipeableStream`) over standard HTTP GET connections.

*Incorrect:*
```javascript
// Assuming Streaming SSR requires WebSocket connection servers
```

*Fix:*
```javascript
Streaming SSR uses standard HTTP Chunked Transfer Encoding
```

## 6. Practice Exercises

### Exercise 1: Structural Setup

**Problem:** You are building a landing page containing a hero banner, a slow product recommendations slider, and a static footer. Structure the component layout to ensure the header and footer render instantly while the slider streams in:

```jsx
import React, { Suspense } from 'react';
import HeroBanner from './HeroBanner';
import Footer from './Footer';
import SlowRecommendations from './SlowRecommendations';

// Solution:
export default function LandingPage() {
  return (
    <div>
      <HeroBanner />
      
      {/* Wrap only the slow component in Suspense */}
      <Suspense fallback={<p>Loading recommended items...</p>}>
        <SlowRecommendations />
      </Suspense>
      
      <Footer />
    </div>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

### Exercise 2: Streaming SSR Architecture Pattern

**Problem:** Write Next.js App Router page combining instant static header with streamed async `<Comments />` component via `<Suspense>`.

**Expected output:**
```text
export default function PostPage() { return <main><h1>Post Title</h1><Suspense fallback={<CommentsSkeleton />}><Comments /></Suspense></main>; }
```

> [!check]- Answer
> ```javascript
> export default function PostPage() {
>   return (
>     <main>
>       <h1>Post Title</h1>
>       <Suspense fallback={<CommentsSkeleton />}>
>         <Comments />
>       </Suspense>
>     </main>
>   );
> }
> ```
>
> **Explanation:** Streaming SSR delivers initial page HTML immediately, streaming suspended async chunks over HTTP.

### Exercise 3: React 18 Server Stream APIs

**Problem:** List 2 React 18 server streaming APIs (`renderToPipeableStream` for Node.js; `renderToReadableStream` for Edge runtimes).

**Expected output:**
```text
renderToPipeableStream (Node.js), renderToReadableStream (Edge runtimes)
```

> [!check]- Answer
> ```text
> renderToPipeableStream (Node.js), renderToReadableStream (Edge runtimes)
> ```
>
> **Explanation:** Server stream APIs stream HTML progressive chunks directly to client HTTP response streams.

## 7. Related Terms
- [Server-Side Rendering (SSR)](../level_10/ssr.md) — The baseline server rendering pattern.
- [Hydration](../level_10/hydration.md) — The process that links event handlers to static HTML.
- [Concurrent Rendering](../../level_08/concurrent_rendering.md) — The prioritizing engine supporting Selective Hydration.

---

## 8. Key Takeaways
- Streaming SSR delivers HTML to the browser in chunks as it is generated.
- It reduces Time to First Byte (TTFB) and prevents blank page loading stutters.
- Wrap slow components in `<Suspense>` to define streaming boundaries.
- The server sends the initial shell first, followed by resolved component HTML down the same connection.
- Use `renderToPipeableStream` or `renderToReadableStream` instead of `renderToString`.
- Selective Hydration allows the browser to hydrate loaded elements before slow components arrive.
