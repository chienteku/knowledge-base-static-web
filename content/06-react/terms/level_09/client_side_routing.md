# Client-Side Routing

> **Level 9 — Routing & Ecosystem**
> The technique of navigating between different views within the browser without triggering full server HTML page reloads.

---

## 1. Prerequisites

- [Single Page Applications (SPA)](spa.md) — The Single Page Application architecture enabled by client-side routing.
- [Virtual DOM](../level_01/virtual_dom.md) — The in-memory tree mechanism React uses to swap route views dynamically.

---

## 2. Term Category

**Ecosystem (routing abstraction)**: Web application navigation mechanism that intercepts URL changes in the browser using the HTML5 History API (`pushState`, `replaceState`, `popstate` events). Instead of requesting new HTML documents from a web server on link clicks, Client-Side Routing updates the browser address bar and conditionally swaps active React component trees in DOM memory, unlike traditional multi-page server refreshes.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional Multi-Page Applications (MPAs), clicking a navigation link (e.g., from `/` to `/dashboard`) sends an HTTP GET request to the web server. The browser destroys the current document state, waits for the server to render and return a new `dashboard.html` file, and re-parses all JavaScript and CSS assets from scratch. This process produces a noticeable white "flash" on screen and resets all client-side state.

In Single Page Applications (SPAs), there is only **one primary HTML document** (`index.html`). To deliver seamless desktop-app-like user experiences, React uses **Client-Side Routing**:
1. **Event Interception**: Navigation clicks are intercepted via JavaScript event listeners before the browser initiates a network GET request for HTML.
2. **HTML5 History API**: The URL bar is updated programmatically using `window.history.pushState(state, '', url)` or `window.history.replaceState()`.
3. **Dynamic View Swapping**: React Router evaluates the updated URL path against configured route rules, unmounts the previous view component, and mounts the new view component in Virtual DOM memory.
4. **State Preservation**: Because the browser document is never destroyed, background state (such as an audio player, WebSocket connections, or draft form inputs) remains active across route transitions.

---

### (2) Reality Metaphor
Imagine a museum exhibit room.
- **Traditional Server Routing (Rebuilding the Building)**: Every time a visitor wants to view a different painting, construction crews demolish the entire museum building, clear the lot, lay a new foundation, rebuild the walls, repaint them, and hang the single new painting (**slow, full-page server document reload**).
- **Client-Side Routing (Rotating Exhibit Wall)**: The museum building remains intact. When a visitor requests a new artwork, a motorized wall rotates, smoothly replacing Painting A with Painting B while visitors remain standing comfortably in the climate-controlled gallery (**instantaneous view swapping in memory**).

---

### (3) React Code Examples

#### Short Snippet
```jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

export function ClientRoutingApp() {
  return (
    <BrowserRouter>
      {/* Link intercepts clicks and uses pushState without full page reload */}
      <nav>
        <Link to="/">Home</Link> | <Link to="/analytics">Analytics</Link>
      </nav>
      <Routes>
        <Route path="/" element={<h2>Home Dashboard</h2>} />
        <Route path="/analytics" element={<h2>System Analytics</h2>} />
      </Routes>
    </BrowserRouter>
  );
}
```

#### Fuller Example
```jsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';

function HomeView() {
  return (
    <div className="view-card">
      <h3>Home Overview</h3>
      <p>Welcome to the client-side routed portal.</p>
    </div>
  );
}

function SettingsView() {
  const navigate = useNavigate();
  return (
    <div className="view-card">
      <h3>User Settings</h3>
      <button onClick={() => navigate('/')}>Save & Return Home</button>
    </div>
  );
}

export function ShellLayout() {
  const [persistentCounter, setPersistentCounter] = useState(0);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="shell-header">
          <h1>SPA Navigation Shell</h1>
          {/* State persists across client route changes! */}
          <button onClick={() => setPersistentCounter((prev) => prev + 1)}>
            Persistent Counter: {persistentCounter}
          </button>
        </header>

        <nav className="shell-nav">
          <Link to="/">Overview</Link> | <Link to="/settings">Settings</Link>
        </nav>

        <main className="shell-content">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Standard HTML `<a href="/path">` Tags for Internal Navigation

**The mistake:** Using `<a href="/dashboard">` tags for navigation inside a React Single Page Application.

**Why it's wrong:** Standard `<a href>` links bypass client-side routing libraries, triggering a full browser document reload that destroys all active React state, resets Context stores, and causes white screen flashes.

*Incorrect:*
```jsx
// BAD: Causes full page refresh and wipes out React memory state!
<a href="/dashboard">Go to Dashboard</a>
```

*Fix:*
```jsx
// GOOD: Intercepts navigation for client-side view swapping
<Link to="/dashboard">Go to Dashboard</Link>
```

---

### Mistake 2: Omitting Server Rewrite Rules for SPA Deep Paths on Production Deployment

**The mistake:** Deploying an SPA to Nginx, Apache, or AWS S3 and getting HTTP `404 Not Found` when users refresh deep URLs like `https://example.com/users/42`.

**Why it's wrong:** Static file servers look for physical files matching the URL path (`/users/42/index.html`). Since SPAs only have a single root `index.html`, the server fails to find the physical file.

*Incorrect:*
```text
# Nginx returning 404 on deep page refreshes
```

*Fix:*
```text
# Configure server fallback to rewrite all non-file requests back to /index.html
# Nginx config: try_files $uri $uri/ /index.html;
```

---

### Mistake 3: Storing Location State Exclusively in React Component State

**The mistake:** Managing tab view transitions purely in local state (`const [activeTab, setActiveTab] = useState('profile')`) without updating URL query params or paths.

**Why it's wrong:** Users cannot bookmark specific tabs, share direct links with colleagues, or use browser Back/Forward navigation buttons when location state is hidden from the URL bar.

*Incorrect:*
```jsx
// BAD: Cannot be bookmarked or shared via URL
const [view, setView] = useState('details');
```

*Fix:*
```jsx
// GOOD: Reflect view state in URL path or query params via Client Router
<Route path="/details" element={<DetailsView />} />
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Station Route Navigation

**Scenario:** An industrial IoT monitoring dashboard features two primary views: Live Telemetry and Alert Logs. An active WebSocket background stream maintains sensor status. You must implement client-side routing so operators can switch views without disconnecting the WebSocket stream.

**Requirements:**
1. Setup `BrowserRouter` with routes `/telemetry` and `/alerts`.
2. Use `<Link>` components for view navigation.
3. Validate that top-level state persists across route changes.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
> 
> function TelemetryView() {
>   return <div><h3>Live Telemetry Stream</h3><p>Sensors: 100% Operational</p></div>;
> }
> 
> function AlertLogsView() {
>   return <div><h3>System Alert Logs</h3><p>Zero active warnings.</p></div>;
> }
> 
> export function IoTRoutingConsole() {
>   const [socketStatus] = useState('CONNECTED');
> 
>   return (
>     <BrowserRouter>
>       <div className="iot-console">
>         <header>
>           <h2>IoT Monitor [Status: {socketStatus}]</h2>
>           <nav>
>             <Link to="/telemetry">Telemetry</Link> | <Link to="/alerts">Alert Logs</Link>
>           </nav>
>         </header>
>         <main>
>           <Routes>
>             <Route path="/telemetry" element={<TelemetryView />} />
>             <Route path="/alerts" element={<AlertLogsView />} />
>           </Routes>
>         </main>
>       </div>
>     </BrowserRouter>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof IoTRoutingConsole === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Zero Refresh Interception**: `<Link>` components override default link behavior, updating URL path via HTML5 History API.
> 2. **WebSocket Persistence**: `socketStatus` state remains active in memory during route changes because `BrowserRouter` prevents document unmounting.
> 3. **Declarative Matching**: `<Routes>` matches current path to render corresponding view.
> 4. **Browser History**: Pressing browser Back button triggers `popstate` events handled seamlessly by React Router.
> 
---

### Exercise 2: Financial Trading Desk Navigation

**Scenario:** A crypto trading desk application allows traders to toggle between Order Book and Trade History views. You need to implement client-side routing using `<Link>` components and verify zero full-page browser reloads occur.

**Requirements:**
1. Configure routes for `/orderbook` and `/history`.
2. Use `<Link>` for navigation.
3. Maintain active wallet balance state across routes.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
> 
> export function CryptoTradingApp() {
>   const [walletBalance] = useState(25000.50);
> 
>   return (
>     <BrowserRouter>
>       <div className="trading-app">
>         <header>
>           <h2>Trading Desk | Wallet: ${walletBalance}</h2>
>           <nav>
>             <Link to="/orderbook">Order Book</Link> | <Link to="/history">Trade History</Link>
>           </nav>
>         </header>
>         <Routes>
>           <Route path="/orderbook" element={<div><h3>Live Depth</h3></div>} />
>           <Route path="/history" element={<div><h3>Past Executions</h3></div>} />
>         </Routes>
>       </div>
>     </BrowserRouter>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof CryptoTradingApp === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Client-Side History**: `BrowserRouter` wraps history listener context.
> 2. **State Continuity**: `walletBalance` is preserved when switching views.
> 3. **Instant View Swap**: Component mounting occurs in Virtual DOM without network latency.
> 4. **Production Routing**: Solves traditional multi-page load delays.
> 
---

### Exercise 3: E-Commerce Storefront Catalog Router

**Scenario:** An online retail storefront provides routes for `/products` and `/cart`. You must configure client-side navigation link controls.

**Requirements:**
1. Setup router with `/products` and `/cart` paths.
2. Render active cart item count in header navigation.
3. Provide mock assertion verifying router setup.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
> 
> export function StorefrontApp() {
>   const [cartCount, setCartCount] = useState(3);
> 
>   return (
>     <BrowserRouter>
>       <div className="store-app">
>         <nav>
>           <Link to="/products">Catalog</Link> |{' '}
>           <Link to="/cart">Cart ({cartCount})</Link>
>         </nav>
>         <Routes>
>           <Route
>             path="/products"
>             element={
>               <div>
>                 <h3>Catalog Items</h3>
>                 <button onClick={() => setCartCount((prev) => prev + 1)}>
>                   Add Item to Cart
>                 </button>
>               </div>
>             }
>           />
>           <Route path="/cart" element={<div><h3>Shopping Cart Summary</h3></div>} />
>         </Routes>
>       </div>
>     </BrowserRouter>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof StorefrontApp === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Reactive Cart Counter**: Incrementing `cartCount` updates navigation bar while staying on product route.
> 2. **Navigation Link Handling**: Navigating to `/cart` keeps `cartCount` state intact.
> 3. **Virtual DOM Diffing**: React Router swaps out route components without refreshing full HTML pages.
> 4. **SEO Compatibility**: Can be combined with SSR or SSG meta-frameworks for crawler visibility.
> 
---

## 6. Related Terms

- [React Router](react_router.md) — Popular library for implementing Client-Side Routing in React.
- [`<Link>` Component](link_component.md) — Declarative component for client-side navigation.
- [Single Page Applications (SPA)](spa.md) — Parent architecture powered by client-side routing.

---

## 7. Key Takeaways

- Client-side routing swaps React components in memory without requesting new HTML documents from web servers.
- It relies on HTML5 History API methods (`pushState`, `replaceState`) to change browser URLs without page reloads.
- Never use native `<a href>` tags for internal SPA links; use declarative `<Link>` components to preserve React state.
- Web servers hosting SPAs must be configured with fallback rewrite rules pointing all non-asset requests to `/index.html`.
- Client-side routing delivers native-app-like navigation speeds and preserves background memory state across views.
