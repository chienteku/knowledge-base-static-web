# React Router

> **Level 9 — Routing & Ecosystem**
> Standard routing framework for React, providing declarative components and hooks for client-side navigation.

---

## 1. Prerequisites

- [Client-Side Routing](client_side_routing.md) — The core web concept implemented by React Router.
- [Components](../level_01/components.md) — React Router uses components (`<BrowserRouter>`, `<Routes>`, `<Route>`) to construct the routing hierarchy.

---

## 2. Term Category

**Ecosystem (routing framework)**: Standard client-side routing library for React applications. React Router synchronizes browser URL location state with Virtual DOM component trees. It exposes a component-driven architecture (`<BrowserRouter>`, `<Routes>`, `<Route>`, `<Outlet>`) and a suite of hooks (`useNavigate`, `useParams`, `useLocation`) to declare route structures, handle nested layouts, and manage dynamic navigation, unlike custom manual state routers.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
React is a component-driven library for rendering user interfaces, but core React does not ship with built-in URL routing. Without a routing framework, developers building Single Page Applications (SPAs) would have to manually parse `window.location.pathname`, write custom `switch` statements to conditionally render components, and handle browser back/forward history events using low-level DOM listeners.

**React Router** provides a standardized, component-centric routing engine:
1. **Declarative Routing Structure**: Developers declare application route hierarchies using JSX elements (`<Routes>` and `<Route path="..." element={<Comp />} />`).
2. **Nested Routes & Layouts**: Parent layout components specify `<Outlet />` placeholders, allowing nested child routes to render inside persistent shell layouts without re-rendering headers or sidebars.
3. **Reactive Hooks**: Provides custom hooks (`useNavigate` for programmatic navigation, `useParams` for URL variables, `useLocation` for active URL metadata) that keep component states synchronized with browser history.
4. **404 Catch-All Routing**: Supports wildcard paths (`path="*"`) to gracefully handle invalid URL requests without server-side error crashes.

---

### (2) Reality Metaphor
Imagine an international airport flight control tower.
- **Manual Routing (No Controller)**: Aircraft pilots arrive in local airspace and must guess which runway is open. Passengers walk onto random tarmacs, open doors manually, and search for their connecting flights without guidance (**unstructured, manual conditional rendering**).
- **React Router (Automated Dispatch Control Tower)**: The flight control tower continuously tracks flight ticket numbers (**browser URL paths**). As aircraft land, the automated system routes Flight #404 to Terminal B, Gate 12 (**`<Route path="/flight/404" element={<TerminalB />} />`**). Passengers step seamlessly through connecting skybridges (**`<Outlet />`**) to their designated destinations.

---

### (3) React Code Examples

#### Short Snippet
```jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export function BasicAppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h2>Home Page</h2>} />
        <Route path="/about" element={<h2>About Us</h2>} />
        {/* Wildcard 404 catch-all route */}
        <Route path="*" element={<h2>404 Page Not Found</h2>} />
      </Routes>
    </BrowserRouter>
  );
}
```

#### Fuller Example
```jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';

// Shared Parent Shell Layout with Outlet placeholder
function DashboardLayout() {
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <h3>Admin Console</h3>
        <nav>
          <Link to="/dashboard/metrics">Metrics</Link>
          <Link to="/dashboard/users">Users</Link>
        </nav>
      </aside>
      <main className="main-content">
        {/* Outlet renders active nested child route component */}
        <Outlet />
      </main>
    </div>
  );
}

function MetricsView() {
  return <h4>System Metrics & Logs</h4>;
}

function UsersView() {
  return <h4>User Account Management</h4>;
}

export function NestedRouterApp() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Parent layout route */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Nested child routes rendered inside Outlet */}
          <Route path="metrics" element={<MetricsView />} />
          <Route path="users" element={<UsersView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Placing Sibling `<Route>` Elements Outside of `<Routes>` Container in React Router v6

**The mistake:** Defining `<Route>` tags directly inside `<BrowserRouter>` without wrapping them in `<Routes>`.

**Why it's wrong:** In React Router v6+, every `<Route>` component MUST be an immediate child of a `<Routes>` container. Placing `<Route>` outside `<Routes>` throws runtime exception `[Route] is not a <Route> component. All component children of <Routes> must be a <Route>`.

*Incorrect:*
```jsx
// BAD: Missing <Routes> parent wrapper!
<BrowserRouter>
  <Route path="/" element={<Home />} />
</BrowserRouter>
```

*Fix:*
```jsx
// GOOD: Always wrap <Route> components inside <Routes>
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
  </Routes>
</BrowserRouter>
```

---

### Mistake 2: Mixing Legacy React Router v5 Syntax with Modern v6 APIs

**The mistake:** Using legacy React Router v5 components (`<Switch>` or `component={Home}`) in React Router v6 projects.

**Why it's wrong:** React Router v6 replaced `<Switch>` with `<Routes>`, and replaced the `component` or `render` props with the `element={<Home />}` prop.

*Incorrect:*
```jsx
// BAD: Legacy v5 syntax in v6 project
<Switch>
  <Route path="/" component={Home} />
</Switch>
```

*Fix:*
```jsx
// GOOD: Modern v6 syntax using <Routes> and element prop
<Routes>
  <Route path="/" element={<Home />} />
</Routes>
```

---

### Mistake 3: Omitting `<Outlet />` in Parent Layout Components

**The mistake:** Defining nested route structures in JSX but forgetting to place an `<Outlet />` inside the parent layout component.

**Why it's wrong:** The parent component renders its own JSX, but child route components have no container designated to mount into, leaving child views invisible.

*Incorrect:*
```jsx
function Layout() {
  // BAD: Missing <Outlet /> placeholder for child routes!
  return <div><h1>Header</h1></div>;
}
```

*Fix:*
```jsx
function Layout() {
  // GOOD: <Outlet /> renders active child route component
  return <div><h1>Header</h1><Outlet /></div>;
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Station Nested Router Layout

**Scenario:** An industrial IoT monitoring dashboard requires a persistent navigation shell with nested child routes for `/sensor/live` and `/sensor/logs`. You must implement nested routing using `<Outlet />`.

**Requirements:**
1. Define parent layout component containing persistent header and `<Outlet />`.
2. Configure nested routes under `/sensor`.
3. Provide mock assertion.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
> 
> function SensorShell() {
>   return (
>     <div className="sensor-shell">
>       <h2>IoT Station Shell</h2>
>       <nav>
>         <Link to="/sensor/live">Live Stream</Link> |{' '}
>         <Link to="/sensor/logs">Log History</Link>
>       </nav>
>       <hr />
>       <Outlet />
>     </div>
>   );
> }
> 
> export function IoTRouterApp() {
>   return (
>     <BrowserRouter>
>       <Routes>
>         <Route path="/sensor" element={<SensorShell />}>
>           <Route path="live" element={<div><h3>Live Telemetry Stream</h3></div>} />
>           <Route path="logs" element={<div><h3>Historical Log Archives</h3></div>} />
>         </Route>
>       </Routes>
>     </BrowserRouter>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof SensorShell === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Parent Layout Route**: `Route path="/sensor"` mounts `SensorShell`.
> 2. **`<Outlet />` Rendering**: Nested path `"live"` renders inside the `<Outlet />` slot within `SensorShell`.
> 3. **Persistent Shell**: Header and navigation menu remain mounted during child view changes.
> 4. **Route Hierarchy**: Keeps component trees modular and clean.
> 
---

### Exercise 2: Crypto Trading Desk Wildcard 404 Handler

**Scenario:** A financial trading terminal requires a catch-all 404 route (`path="*"`) to display a fallback error view when traders enter non-existent URLs.

**Requirements:**
1. Configure primary routes `/trading` and `/portfolio`.
2. Add wildcard `path="*"` 404 fallback route.
3. Validate routing setup.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
> 
> function NotFoundView() {
>   return (
>     <div className="not-found">
>       <h3>404 — Invalid Trading Path</h3>
>       <Link to="/trading">Return to Trading Desk</Link>
>     </div>
>   );
> }
> 
> export function CryptoDeskRouter() {
>   return (
>     <BrowserRouter>
>       <Routes>
>         <Route path="/trading" element={<div><h3>Trading Desk</h3></div>} />
>         <Route path="/portfolio" element={<div><h3>Portfolio</h3></div>} />
>         <Route path="*" element={<NotFoundView />} />
>       </Routes>
>     </BrowserRouter>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof NotFoundView === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Wildcard Route Matching**: `path="*"` matches any incoming URL string not matched by previous `<Route>` definitions.
> 2. **Client-Side Graceful Recovery**: Prevents white screen crashes or raw browser error pages.
> 3. **Navigation Recovery**: Provides direct links back to valid application routes.
> 4. **Declarative Ordering**: React Router evaluates wildcard routes after explicit path matches.
> 
---

### Exercise 3: E-Commerce Storefront Layout Architecture

**Scenario:** An online store catalog uses a persistent header layout across `/catalog` and `/checkout` routes.

**Requirements:**
1. Create storefront shell layout with persistent cart counter.
2. Render `<Outlet />` for child route view components.
3. Validate component structure.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
> 
> function StoreLayout() {
>   return (
>     <div className="store-layout">
>       <header className="store-header">
>         <h2>Retail Storefront</h2>
>         <nav>
>           <Link to="/catalog">Catalog</Link> | <Link to="/checkout">Checkout</Link>
>         </nav>
>       </header>
>       <main className="store-body">
>         <Outlet />
>       </main>
>     </div>
>   );
> }
> 
> export function StorefrontRouterApp() {
>   return (
>     <BrowserRouter>
>       <Routes>
>         <Route path="/" element={<StoreLayout />}>
>           <Route path="catalog" element={<div><h3>Product Grid</h3></div>} />
>           <Route path="checkout" element={<div><h3>Payment Form</h3></div>} />
>         </Route>
>       </Routes>
>     </BrowserRouter>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof StoreLayout === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Top-Level Layout**: `StoreLayout` renders header and navigation controls.
> 2. **`<Outlet />` Mounting**: Renders child components (`Product Grid`, `Payment Form`) dynamically.
> 3. **Single Page Performance**: Eliminates full-page HTML fetches between catalog browsing and checkout.
> 4. **Component Modularization**: Decouples persistent navigation frame from page-specific body content.
> 
---

## 6. Related Terms

- [`<Link>` Component](link_component.md) — Declarative navigation link component.
- [Dynamic Segments](dynamic_segments.md) — URL parameter matching in React Router.
- [`useNavigate` Hook](use_navigate.md) — Programmatic navigation hook.

---

## 7. Key Takeaways

- React Router is the standard declarative client-side routing library for React applications.
- In v6+, all `<Route>` components must be wrapped inside a `<Routes>` container and use the `element={<Comp />}` prop syntax.
- Use nested routes paired with `<Outlet />` inside parent layout components to build persistent UI shells.
- Include a wildcard catch-all route (`<Route path="*" element={<NotFound />} />`) to handle invalid URL requests.
- React Router provides custom hooks (`useNavigate`, `useParams`, `useLocation`) to synchronize components with browser history.
