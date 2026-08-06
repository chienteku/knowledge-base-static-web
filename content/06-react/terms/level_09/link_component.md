# `<Link>` Component

> **Level 9 — Routing & Ecosystem**
> Primary declarative React navigation element that intercepts link clicks to navigate client-side without full-page reloads.

---

## 1. Prerequisites

- [React Router](react_router.md) — The router library that exports the `<Link>` component.
- [Client-Side Routing](client_side_routing.md) — The underlying navigation mechanic preventing browser page reloads.

---

## 2. Term Category

**Component Pattern (hoc abstraction)**: Declarative React navigation component provided by React Router (`<Link to="/path">`) that renders an underlying HTML `<a>` element in the DOM while overriding default click events. `<Link>` intercepts navigation clicks, prevents full browser document reloads, and invokes `window.history.pushState` to swap active component views in memory, unlike standard HTML anchor tags.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In Single Page Applications (SPAs), using traditional HTML anchor tags (`<a href="/dashboard">`) causes the browser to issue an HTTP GET request to the server, wiping out all React state memory, unmounting the application, and triggering a full page refresh.

To enable smooth, instant view changes, React Router provides the **`<Link>` Component**:
1. **Event Interception**: `<Link>` attaches an internal `onClick` handler that calls `e.preventDefault()`, stopping the browser from initiating a full-page document fetch.
2. **DOM Accessibility & SEO**: Under the hood, `<Link>` renders a standard `<a href="/path">` DOM tag. This guarantees full keyboard accessibility (`Tab` + `Enter`), right-click "Open in new tab" behavior, and search engine crawler indexing.
3. **History API Updates**: Invokes `history.pushState` programmatically, updating the browser URL bar while React Router swaps Virtual DOM components in memory.
4. **`NavLink` Variant**: React Router also provides `<NavLink to="/path">`, an extended version of `<Link>` that automatically applies active CSS classes or inline styles when the link's `to` target matches the current URL.

---

### (2) Reality Metaphor
Imagine an executive in a high-rise office building moving between departments.
- **HTML `<a href>` Tag (Leaving the Building)**: To visit an office on the floor directly above, the executive exits the building, walks out onto the city street, re-enters through security at the main lobby, and takes the elevator back up (**slow, full page document reload**).
- **React `<Link>` Component (Internal Skybridge)**: The executive steps through an internal glass skybridge directly into the adjacent room (**instantaneous client-side view transition without leaving the building shell**).

---

### (3) React Code Examples

#### Short Snippet
```jsx
import React from 'react';
import { Link } from 'react-router-dom';

export function NavigationBar() {
  return (
    <nav className="nav-bar">
      {/* Declarative link navigating client-side to /dashboard */}
      <Link to="/dashboard" className="nav-link">
        Dashboard
      </Link>
    </nav>
  );
}
```

#### Fuller Example
```jsx
import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';

function HomeView() {
  return <h3>Home Dashboard</h3>;
}

function ReportsView() {
  const location = useLocation();
  // Read state object passed via <Link to="..." state={{ ... }} />
  const referrer = location.state?.from || 'Direct';

  return (
    <div>
      <h3>System Reports</h3>
      <p>Navigation Source: {referrer}</p>
    </div>
  );
}

export function AccessibleAppNavigation() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="main-header">
          <h2>Storefront Admin</h2>
          <nav className="main-nav">
            {/* NavLink automatically injects active class when path matches */}
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              Overview
            </NavLink>

            {/* Link passing location state object */}
            <Link
              to="/reports"
              state={{ from: 'Header Navigation Menu' }}
              className="nav-item"
            >
              View Reports
            </Link>
          </nav>
        </header>

        <main className="content-body">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/reports" element={<ReportsView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Standard HTML `<a href="/path">` Tags for Internal SPA Navigation

**The mistake:** Writing `<a href="/profile">Profile</a>` for navigation inside a React Router application.

**Why it's wrong:** Standard `<a>` tags execute a hard browser page reload, destroying all active React component state, clearing Context stores, and dropping performance.

*Incorrect:*
```jsx
// BAD: Hard reloads browser and wipes React state!
<a href="/profile">User Profile</a>
```

*Fix:*
```jsx
// GOOD: Intercepts click for client-side routing
<Link to="/profile">User Profile</Link>
```

---

### Mistake 2: Using the `href` Attribute on `<Link>` Components Instead of `to`

**The mistake:** Writing `<Link href="/dashboard">Dashboard</Link>`.

**Why it's wrong:** React Router's `<Link>` component expects the target path string in the **`to`** prop. Passing `href` fails to pass target route metadata, breaking navigation.

*Incorrect:*
```jsx
// BAD: React Router ignores `href` prop on <Link>
<Link href="/dashboard">Dashboard</Link>
```

*Fix:*
```jsx
// GOOD: Use the `to` prop to specify target route path
<Link to="/dashboard">Dashboard</Link>
```

---

### Mistake 3: Rendering `<Link>` Outside a `<BrowserRouter>` Provider Hierarchy

**The mistake:** Placing `<Link to="/path">` in a component that is rendered outside of `<BrowserRouter>`.

**Why it's wrong:** `<Link>` depends on React Context provided by `<BrowserRouter>`. Rendering `<Link>` outside a router provider throws error `useHref() may be used only in the context of a Router component`.

*Incorrect:*
```jsx
// BAD: Rendered outside Router provider context
function Root() {
  return (
    <div>
      <Link to="/home">Home</Link> {/* Throws Context Error! */}
      <BrowserRouter><App /></BrowserRouter>
    </div>
  );
}
```

*Fix:*
```jsx
// GOOD: Wrap application in BrowserRouter first
function Root() {
  return (
    <BrowserRouter>
      <Link to="/home">Home</Link>
      <App />
    </BrowserRouter>
  );
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Station Link Menu

**Scenario:** An industrial IoT monitoring dashboard provides links to `/telemetry` and `/diagnostics`. You need to build a navigation bar using `<Link>` components that preserves active socket state.

**Requirements:**
1. Render nav menu using `<Link>` components with `to` props.
2. Configure targets `/telemetry` and `/diagnostics`.
3. Validate component structure.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
> 
> export function IoTLiveNavigation() {
>   return (
>     <BrowserRouter>
>       <div className="iot-nav-shell">
>         <nav className="iot-menu">
>           <Link to="/telemetry" className="menu-btn">
>             Live Telemetry
>           </Link>
>           <Link to="/diagnostics" className="menu-btn">
>             System Diagnostics
>           </Link>
>         </nav>
>         <Routes>
>           <Route path="/telemetry" element={<div><h3>Live Readings</h3></div>} />
>           <Route path="/diagnostics" element={<div><h3>Diagnostic Log</h3></div>} />
>         </Routes>
>       </div>
>     </BrowserRouter>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof IoTLiveNavigation === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Client Interception**: `<Link>` intercepts navigation clicks, preventing document reloads.
> 2. **`to` Target Property**: Directs React Router to match designated route paths.
> 3. **DOM Accessibility**: Renders native `<a>` elements for accessibility.
> 4. **History Stack**: Pushes new entries into browser `window.history` stack.
> 
---

### Exercise 2: Financial Trading Active NavLink Highlights

**Scenario:** A trading terminal uses `<NavLink>` components to highlight active trading routes (`/orderbook` vs `/trades`) with custom active CSS styling.

**Requirements:**
1. Implement navigation menu using `<NavLink>`.
2. Apply active class conditionally based on `isActive` parameter.
3. Validate active styling logic.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
> 
> export function TradingNavMenu() {
>   return (
>     <BrowserRouter>
>       <div className="trading-nav-shell">
>         <nav className="ticker-nav">
>           <NavLink
>             to="/orderbook"
>             className={({ isActive }) => (isActive ? 'tab active-tab' : 'tab')}
>           >
>             Order Book
>           </NavLink>
>           <NavLink
>             to="/trades"
>             className={({ isActive }) => (isActive ? 'tab active-tab' : 'tab')}
>           >
>             Recent Trades
>           </NavLink>
>         </nav>
>         <Routes>
>           <Route path="/orderbook" element={<div><h3>Order Depth</h3></div>} />
>           <Route path="/trades" element={<div><h3>Execution Logs</h3></div>} />
>         </Routes>
>       </div>
>     </BrowserRouter>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof TradingNavMenu === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Active Class Injection**: `<NavLink>` inspects current location, calling function prop with `{ isActive }`.
> 2. **Visual Feedback**: Applies `.active-tab` CSS class when active URL matches `to` target.
> 3. **Client-Side Routing**: Retains all trader session state in memory.
> 4. **Declarative Matching**: Eliminates manual `window.location.pathname` comparisons.
> 
---

### Exercise 3: E-Commerce Storefront Link State Transfer

**Scenario:** An online store catalog passes product metadata via location state using `<Link to="..." state={{ itemData }}>` when clicking to view product details.

**Requirements:**
1. Pass state object via `<Link to="..." state={...}>`.
2. Extract location state inside target component using `useLocation()`.
3. Provide mock assertion.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
> 
> function ProductDetailView() {
>   const location = useLocation();
>   const item = location.state?.item || { name: 'Generic Product', price: 0 };
> 
>   return (
>     <div className="detail-view">
>       <h3>Item: {item.name}</h3>
>       <p>Price: ${item.price}</p>
>     </div>
>   );
> }
> 
> export function StoreCatalogLinks() {
>   const product = { id: 42, name: 'Noise-Canceling Headphones', price: 199 };
> 
>   return (
>     <BrowserRouter>
>       <div className="catalog-links">
>         <Link to="/product/42" state={{ item: product }}>
>           View {product.name}
>         </Link>
>         <Routes>
>           <Route path="/product/:id" element={<ProductDetailView />} />
>         </Routes>
>       </div>
>     </BrowserRouter>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof StoreCatalogLinks === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Location State Passing**: `state={{ item: product }}` attaches ephemeral data to the History state object.
> 2. **`useLocation()` Extraction**: Target component reads passed state metadata without global state stores.
> 3. **Fallback Handling**: Optional chaining (`location.state?.item`) prevents runtime errors if accessed via direct URL bookmarking.
> 4. **DOM Rendering**: Renders semantic HTML `<a>` tag for accessibility.
> 
---

## 6. Related Terms

- [React Router](react_router.md) — Routing framework providing `<Link>` and `<NavLink>`.
- [`useNavigate` Hook](use_navigate.md) — Imperative counterpart for programmatic navigation.
- [Client-Side Routing](client_side_routing.md) — Client-side navigation engine.

---

## 7. Key Takeaways

- `<Link to="/path">` is the primary declarative component for client-side navigation in React Router.
- It renders a semantic HTML `<a>` tag while overriding default click events to prevent full browser reloads.
- Use the **`to`** prop to specify target route paths (do not use `href`).
- Use `<NavLink>` when you need to apply active CSS classes or styles based on the current URL match.
- Ephemeral metadata can be passed during navigation using the `state` prop (`<Link to="..." state={{ data }}>`).
