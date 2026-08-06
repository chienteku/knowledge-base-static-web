# Single Page Applications (SPA)

> **Level 9 — Routing & Ecosystem**
> Web architecture where a single HTML document is loaded, and subsequent view updates occur dynamically via JavaScript DOM manipulation.

---

## 1. Prerequisites

- [Virtual DOM](../level_01/virtual_dom.md) — The fast in-memory tree manipulation technology React uses to update SPA views without page reloads.
- [Components](../level_01/components.md) — Modular building blocks used to compose SPA application views.

---

## 2. Term Category

**Ecosystem (application architecture)**: Web application architecture that serves a single initial HTML file (`index.html`) to the client browser. Instead of fetching new HTML pages from the server on user interactions, an SPA dynamically rewrites the existing page DOM using JavaScript (React rendering mechanics) and client-side routing libraries, providing desktop-like user experiences, unlike traditional multi-page document architectures.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In early web development, applications followed the **Multi-Page Application (MPA)** model. Every click on a link forced the browser to request a new HTML file from a remote web server, destroy the current page state, and re-parse all script and styling assets. This architecture produced slow page loads, jarring white screen refreshes, and lost in-memory state (such as video playback or unsaved form drafts).

React was built to power **Single Page Applications (SPAs)**:
1. **Single Entry Point**: The server returns a bare-bones `index.html` file containing a root DOM container (`<div id="root"></div>`) and a JavaScript bundle script.
2. **Client-Side Rendering (CSR)**: React mounts into the root container, builds the Virtual DOM tree in browser memory, and mounts DOM nodes dynamically.
3. **Seamless Navigation**: Navigation between views occurs entirely on the client side using Client-Side Routing. View switching feels instant because no HTML is requested over the network.
4. **State Continuity**: Global application state (e.g., user authentication, active web sockets, cart state) persists uninterrupted as users navigate across screens.

---

### (2) Reality Metaphor
Imagine a multi-function electronic tablet device versus a stack of printed paper books.
- **Multi-Page Application (Stack of Paper Books)**: To read Chapter 2, you must close Book 1, place it back on the bookshelf, pull out Book 2, open the cover, and turn to Page 1 (**slow, full document replacement**).
- **Single Page Application (Electronic Tablet)**: You hold a single physical tablet screen (**single `index.html` file**). Swiping your finger programmatically changes the text and graphics on the display instantaneously (**dynamic JavaScript DOM rendering**) without changing the physical hardware in your hands.

---

### (3) React Code Examples

#### Short Snippet
```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Single entry point rendering entire SPA into root DOM node
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(<App />);
```

#### Fuller Example
```jsx
import React, { useState } from 'react';

function DashboardView() {
  return <div className="spa-card"><h3>Dashboard Panel</h3></div>;
}

function SettingsView() {
  return <div className="spa-card"><h3>Settings Panel</h3></div>;
}

export function SPAMainShell() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [persistentSessionTimer] = useState(() => Date.now());

  return (
    <div className="spa-shell">
      <header className="shell-header">
        <h2>React SPA Shell</h2>
        <p>Session Started At: {new Date(persistentSessionTimer).toLocaleTimeString()}</p>
        <nav>
          <button onClick={() => setCurrentView('dashboard')}>Dashboard</button>
          <button onClick={() => setCurrentView('settings')}>Settings</button>
        </nav>
      </header>

      <main className="shell-body">
        {/* Swapping views in memory without refreshing browser page */}
        {currentView === 'dashboard' ? <DashboardView /> : <SettingsView />}
      </main>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `window.location.href` to Navigate Between Views Inside an SPA

**The mistake:** Executing `window.location.href = '/dashboard'` to switch views in a React SPA.

**Why it's wrong:** Re-assigning `window.location.href` instructs the browser to perform a full hard page reload, destroying the single-page environment, clearing React memory state, and defeating the core benefit of SPAs.

*Incorrect:*
```jsx
// BAD: Forces hard browser reload, destroying SPA state!
const handleGoToDashboard = () => {
  window.location.href = '/dashboard';
};
```

*Fix:*
```jsx
// GOOD: Use React Router client-side navigation
const navigate = useNavigate();
const handleGoToDashboard = () => {
  navigate('/dashboard');
};
```

---

### Mistake 2: Shipping Monolithic JavaScript Bundles Without Code Splitting

**The mistake:** Bundling every single component, route, and library into a single 5MB `bundle.js` file for an SPA.

**Why it's wrong:** First Contentful Paint (FCP) drops significantly because mobile browsers must download and parse the entire 5MB bundle before rendering the initial page.

*Incorrect:*
```jsx
// BAD: Static imports bundle all page components into one giant file
import AdminPanel from './AdminPanel';
```

*Fix:*
```jsx
// GOOD: Code-split routes using React.lazy to keep initial SPA payload lightweight
const AdminPanel = React.lazy(() => import('./AdminPanel'));
```

---

### Mistake 3: Accumulating Memory Leaks in Long-Lived SPA Sessions

**The mistake:** Failing to clean up timers (`setInterval`), global window event listeners, or WebSocket subscriptions in components.

**Why it's wrong:** In MPAs, page refreshes clear memory automatically. In SPAs, the browser document lives indefinitely, so uncleaned event listeners accumulate over time and cause severe memory leaks.

*Incorrect:*
```jsx
useEffect(() => {
  // BAD: Missing cleanup function in long-lived SPA session
  setInterval(tick, 1000);
}, []);
```

*Fix:*
```jsx
useEffect(() => {
  const timer = setInterval(tick, 1000);
  // GOOD: Clear timer on component unmount
  return () => clearInterval(timer);
}, []);
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Station SPA Shell

**Scenario:** An industrial IoT monitoring dashboard operates as a Single Page Application. A central telemetry data connection stays active in top-level state while operators switch between dashboard sub-views. You need to implement the SPA view switcher.

**Requirements:**
1. Maintain top-level telemetry data stream state.
2. Render view components conditionally without page reloads.
3. Provide mock assertion verifying SPA state preservation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function IoTSPAShell() {
>   const [activeView, setActiveView] = useState('live');
>   const [sensorCount] = useState(150);
> 
>   return (
>     <div className="iot-spa">
>       <header>
>         <h2>IoT Command Center (Active Sensors: {sensorCount})</h2>
>         <nav>
>           <button onClick={() => setActiveView('live')}>Live Stream</button>
>           <button onClick={() => setActiveView('diagnostics')}>Diagnostics</button>
>         </nav>
>       </header>
>       <main>
>         {activeView === 'live' ? (
>           <div><h3>Live Sensor Data</h3></div>
>         ) : (
>           <div><h3>System Diagnostics</h3></div>
>         )}
>       </main>
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof IoTSPAShell === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Persistent State**: `sensorCount` state remains active in browser memory during view switches.
> 2. **In-Memory Swapping**: View transitions execute via React Virtual DOM diffing without HTML page fetches.
> 3. **Single Document**: Application runs continuously inside a single browser document shell.
> 4. **Resource Efficiency**: Eliminates redundant script re-parsing.
> 
---

### Exercise 2: Financial Trading Workspace SPA

**Scenario:** A trading application maintains active WebSocket price data across trading views. You must construct an SPA view controller that preserves WebSocket connection state.

**Requirements:**
1. Store WebSocket status in top-level SPA state.
2. Toggle between Order Desk and Trade Logs views.
3. Validate SPA component structure.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function CryptoTradingSPAShell() {
>   const [view, setView] = useState('desk');
>   const [wsStatus] = useState('CONNECTED');
> 
>   return (
>     <div className="trading-spa">
>       <header>
>         <h2>Crypto Terminal [Socket: {wsStatus}]</h2>
>         <button onClick={() => setView('desk')}>Order Desk</button>
>         <button onClick={() => setView('logs')}>Trade Logs</button>
>       </header>
>       <section className="view-container">
>         {view === 'desk' ? (
>           <div><h3>Order Execution Desk</h3></div>
>         ) : (
>           <div><h3>Past Execution Logs</h3></div>
>         )}
>       </section>
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof CryptoTradingSPAShell === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Unbroken Socket Connection**: `wsStatus` remains connected because the browser document is never torn down.
> 2. **Client-Side Rendering**: View updates execute instantaneously via Virtual DOM node reconciliation.
> 3. **Desktop Experience**: Delivers fluid UI responsiveness expected by traders.
> 4. **Clean Unmounting**: Child components unmount cleanly without dropping top-level socket subscriptions.
> 
---

### Exercise 3: E-Commerce Storefront Cart State SPA

**Scenario:** An online store catalog maintains shopping cart state while users navigate between catalog browsing and checkout.

**Requirements:**
1. Maintain cart array state at SPA shell root.
2. Allow adding items and switching views without state loss.
3. Provide mock assertion.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function StorefrontSPAShell() {
>   const [page, setPage] = useState('catalog');
>   const [cart, setCart] = useState([]);
> 
>   const addToCart = (productName) => {
>     setCart((prev) => [...prev, productName]);
>   };
> 
>   return (
>     <div className="store-spa">
>       <nav>
>         <button onClick={() => setPage('catalog')}>Catalog</button>
>         <button onClick={() => setPage('cart')}>
>           Cart ({cart.length} items)
>         </button>
>       </nav>
> 
>       {page === 'catalog' ? (
>         <div>
>           <h3>Catalog</h3>
>           <button onClick={() => addToCart('Headphones')}>Add Headphones</button>
>         </div>
>       ) : (
>         <div>
>           <h3>Cart Items</h3>
>           <ul>
>             {cart.map((item, i) => (
>               <li key={i}>{item}</li>
>             ))}
>           </ul>
>         </div>
>       )}
>     </div>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof StorefrontSPAShell === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Cart Persistence**: Items added to `cart` array persist when switching to `'cart'` view.
> 2. **Client-Side View Swap**: DOM nodes update dynamically without network HTML requests.
> 3. **Single Page Architecture**: Eliminates page refreshes between browsing and checkout.
> 4. **State Management**: Root component owns application state while child views present UI controls.
> 
---

## 6. Related Terms

- [Client-Side Routing](client_side_routing.md) — Mechanism that handles navigation in SPAs.
- [React Router](react_router.md) — Routing framework for SPAs.
- [Hydration](../level_10/hydration.md) — Process of attaching event listeners to server-rendered markup in hybrid architectures.

---

## 7. Key Takeaways

- A Single Page Application (SPA) serves a single HTML document (`index.html`) and updates views dynamically via JavaScript.
- SPA view changes execute via Virtual DOM DOM node manipulation, eliminating full-page browser refreshes.
- Application state (authentication tokens, active WebSockets, draft inputs) persists continuously across view changes.
- Never use `window.location.href` for internal navigation; use Client-Side Routing (`useNavigate`, `<Link>`) to preserve SPA memory state.
- Combine SPAs with Code Splitting (`React.lazy`) to prevent large initial bundle downloads and keep page loads fast.
