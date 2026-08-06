# Code Splitting & Lazy Loading

> **Level 8 — Performance Optimization**
> The architectural technique of partitioning application bundles into smaller, on-demand JavaScript chunks.

---

## 1. Prerequisites

- [Client-Side Routing](../level_09/client_side_routing.md) — Code splitting is most frequently applied at route boundaries.
- [Suspense](suspense.md) — The component boundary used to display fallback UI while lazy modules download.

---

## 2. Term Category

**Rendering Mechanic (bundle partitioning)**: Browser performance strategy that defers downloading non-critical component modules until runtime execution requires them. Combined with dynamic `import()` and `React.lazy()`, code splitting prevents monolithic script downloads on initial page load, optimizing First Contentful Paint (FCP) and Time to Interactive (TTI), unlike static synchronous component imports.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When building Single Page Applications (SPAs), bundlers process all component files, utility modules, and dependencies into a single output bundle (e.g., `bundle.js`). As application functionality expands—adding admin panels, heavy chart libraries, or rich text editors—the bundle size grows exponentially.

If an application bundle reaches 4MB, mobile users visiting only the landing page are forced to download, parse, and execute the entire 4MB file before seeing any content. This causes long blank screens and low performance scores.

**Code Splitting** addresses this by leveraging dynamic ECMAScript imports (`import('./Component')`):
1. **Dynamic Chunks**: The bundler identifies dynamic import statements and splits the code into separate chunk files (`admin-[hash].js`, `chart-[hash].js`).
2. **On-Demand Loading**: JavaScript for specific routes or heavy features is downloaded over the network only when the user navigates to that route or opens that component.
3. **`React.lazy()` Integration**: React provides `lazy()` to wrap dynamic imports, transforming asynchronous module promises into standard React components that suspend until the code payload arrives.

---

### (2) Reality Metaphor
Imagine visiting a self-service buffet restaurant.
- **Monolithic Bundle (All Food at Once)**: Upon entering the door, the host forces you to balance a 100-pound tray containing every dish, dessert, and beverage prepared in the kitchen before allowing you to take a seat—even if you only intended to eat a small salad.
- **Code Splitting (On-Demand Courses)**: You take a seat instantly with a light glass of water. When you decide to order a soup, the waiter fetches just the soup from the kitchen. If you never order dessert, the dessert never leaves the kitchen, saving time, table space, and effort.

---

### (3) React Code Examples

#### Short Snippet
```jsx
import React, { lazy, Suspense } from 'react';

// Lazy load heavy component at top-level module scope
const HeavyChart = lazy(() => import('./HeavyChart'));

export function AnalyticsWidget({ showChart }) {
  return (
    <div className="widget">
      <h3>System Metrics</h3>
      {showChart && (
        <Suspense fallback={<div className="spinner">Loading chart...</div>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

#### Fuller Example
```jsx
import React, { useState, lazy, Suspense } from 'react';

// Route-level dynamic lazy imports
const UserProfile = lazy(() => import('./pages/UserProfile'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminConsole = lazy(() => import('./pages/AdminConsole'));

export function AppRouter() {
  const [activeTab, setActiveTab] = useState('profile');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'profile':
        return <UserProfile />;
      case 'settings':
        return <SettingsPage />;
      case 'admin':
        return <AdminConsole />;
      default:
        return <UserProfile />;
    }
  };

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <button onClick={() => setActiveTab('profile')}>Profile</button>
        <button onClick={() => setActiveTab('settings')}>Settings</button>
        <button onClick={() => setActiveTab('admin')}>Admin</button>
      </nav>

      <main className="main-content">
        {/* Suspense boundary catches promise suspension while lazy JS downloads */}
        <Suspense fallback={<div className="page-loader">Downloading page bundle...</div>}>
          {renderActivePage()}
        </Suspense>
      </main>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Declaring `React.lazy()` Inside Render Functions

**The mistake:** Defining `const LazyComp = React.lazy(() => import('./Comp'))` inside a component render body.

**Why it's wrong:** On every render cycle, `React.lazy()` creates a brand-new component reference. This forces React to re-mount the component, discard internal state, and trigger repeated network downloads on every state change.

*Incorrect:*
```jsx
function Dashboard() {
  // BAD: Creates new lazy component reference on EVERY render!
  const LazyWidget = React.lazy(() => import('./Widget'));
  return <Suspense fallback={<Spinner />}><LazyWidget /></Suspense>;
}
```

*Fix:*
```jsx
// GOOD: Declare React.lazy once at module scope
const LazyWidget = React.lazy(() => import('./Widget'));

function Dashboard() {
  return <Suspense fallback={<Spinner />}><LazyWidget /></Suspense>;
}
```

---

### Mistake 2: Omitting the `<Suspense>` Boundary Around Lazy Components

**The mistake:** Rendering a `React.lazy()` component without wrapping it in a `<Suspense>` boundary.

**Why it's wrong:** While the browser fetches the lazy chunk, the component suspends. Without a parent `<Suspense>` boundary to capture the pending Promise, React throws an unhandled error and breaks the component tree.

*Incorrect:*
```jsx
// BAD: Missing Suspense fallback container
function App() {
  return <LazyDashboard />;
}
```

*Fix:*
```jsx
// GOOD: Suspense provides fallback UI during network load
function App() {
  return (
    <Suspense fallback={<div className="loader">Loading...</div>}>
      <LazyDashboard />
    </Suspense>
  );
}
```

---

### Mistake 3: Over-Splitting Micro Components

**The mistake:** Creating separate `React.lazy()` wrappers for dozens of small 1KB icon or button components.

**Why it's wrong:** Each split chunk generates a separate HTTP request. For micro components, network request latency and browser HTTP header overhead far outweigh any bandwidth savings. Limit code splitting to routes, major dialogs, or heavy third-party libraries.

*Incorrect:*
```jsx
// BAD: Splitting a trivial 5-line button component
const PrimaryButton = lazy(() => import('./PrimaryButton'));
```

*Fix:*
```jsx
// GOOD: Direct static import for lightweight UI primitives
import { PrimaryButton } from './PrimaryButton';
```

---

## 5. Practice Exercises

### Exercise 1: Healthcare DICOM Image Viewer

**Scenario:** A hospital medical records web application displays patient charts. Most visits involve viewing basic text records, but clinicians occasionally open a heavy 3D DICOM image rendering engine. You need to lazy load the DICOM viewer so general medical charts load instantaneously.

**Requirements:**
1. Dynamically import `DicomViewer` component using `React.lazy()`.
2. Toggle viewer visibility via state button.
3. Wrap lazy viewer with `<Suspense>` fallback showing a loading spinner.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, lazy, Suspense } from 'react';
> 
> // Lazy load heavy medical image engine component
> const DicomViewer = lazy(() => import('./components/DicomViewer'));
> 
> export function PatientMedicalRecord({ patientId }) {
>   const [showDicom, setShowDicom] = useState(false);
> 
>   return (
>     <div className="patient-chart">
>       <h2>Patient Record ID: {patientId}</h2>
>       <p>Vitals: Normal | BP: 120/80 | HR: 72 bpm</p>
>       
>       <button onClick={() => setShowDicom((prev) => !prev)}>
>         {showDicom ? 'Close Imaging' : 'Open 3D DICOM Imaging'}
>       </button>
> 
>       {showDicom && (
>         <Suspense fallback={<div className="dicom-spinner">Loading 3D Imaging Engine...</div>}>
>           <DicomViewer patientId={patientId} />
>         </Suspense>
>       )}
>     </div>
>   );
> }
> 
> // Mock assertion for testing environment
> if (typeof window !== 'undefined') {
>   console.assert(typeof DicomViewer === 'object', 'DicomViewer should be lazy component object');
> }
> ```
>
> #### Technical Explanation
> 1. **Top-Level `React.lazy`**: Placing `lazy()` outside component scope ensures the dynamic import Promise factory is instantiated only once per module load.
> 2. **Network Isolation**: The DICOM rendering library bundle is downloaded over HTTP only when `showDicom` evaluates to true.
> 3. **Suspense Catching**: React catches the promise thrown by `lazy()` and mounts `<div className="dicom-spinner">` until resolution.
> 4. **State Persistence**: Patient vital text rendering remains completely uninterrupted during image chunk acquisition.
> 
---

### Exercise 2: Financial Trading Candlestick Chart

**Scenario:** A financial analytics portal provides quick portfolio summaries. Clicking on a stock ticker expands a detailed candlestick chart powered by a heavy charting library. You need to code-split the chart component.

**Requirements:**
1. Lazy-load `StockCandlestickChart` module.
2. Maintain active ticker selection in state.
3. Display custom fallback skeleton screen during asset fetching.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, lazy, Suspense } from 'react';
> 
> const StockCandlestickChart = lazy(() => import('./charts/StockCandlestickChart'));
> 
> export function TradingPortfolio() {
>   const [selectedTicker, setSelectedTicker] = useState(null);
> 
>   return (
>     <div className="trading-container">
>       <h2>Portfolio Holdings</h2>
>       <div className="ticker-buttons">
>         <button onClick={() => setSelectedTicker('AAPL')}>AAPL ($185.20)</button>
>         <button onClick={() => setSelectedTicker('NVDA')}>NVDA ($120.50)</button>
>         <button onClick={() => setSelectedTicker('MSFT')}>MSFT ($415.00)</button>
>       </div>
> 
>       {selectedTicker && (
>         <div className="chart-panel">
>           <h3>Detailed Analytics: {selectedTicker}</h3>
>           <Suspense fallback={<div className="skeleton-chart">Fetching chart module...</div>}>
>             <StockCandlestickChart symbol={selectedTicker} />
>           </Suspense>
>         </div>
>       )}
>     </div>
>   );
> }
> 
> // Runtime assertion
> if (typeof window !== 'undefined') {
>   console.assert(typeof StockCandlestickChart === 'object', 'Lazy component must be object');
> }
> ```
>
> #### Technical Explanation
> 1. **Dynamic Import Splitting**: Bundlers extract `StockCandlestickChart` into an independent asset chunk during build.
> 2. **Execution Timing**: Initial page load omits heavy canvas/WebGL charting binaries.
> 3. **Props Forwarding**: Once resolved, `StockCandlestickChart` receives updated `symbol` props without needing re-downloads.
> 4. **UI Skeleton**: Suspense fallback replaces blank spaces, preventing layout instability while downloading scripts.
> 
---

### Exercise 3: E-Commerce Storefront Checkout Modal

**Scenario:** An online retail application loads products quickly. When users click "Proceed to Checkout", a complex modal with payment gateway SDKs and address validation forms opens. You must lazy load the checkout modal.

**Requirements:**
1. Define lazy `CheckoutModal` component at module scope.
2. Manage modal open state via state updater pattern.
3. Provide smooth fallback UI within `<Suspense>`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, lazy, Suspense } from 'react';
> 
> const CheckoutModal = lazy(() => import('./modals/CheckoutModal'));
> 
> export function ShoppingCartSummary({ cartItems }) {
>   const [isOpen, setIsOpen] = useState(false);
> 
>   const handleOpenCheckout = () => {
>     setIsOpen(true);
>   };
> 
>   const handleCloseCheckout = () => {
>     setIsOpen(false);
>   };
> 
>   return (
>     <div className="cart-summary">
>       <h2>Shopping Cart ({cartItems.length} items)</h2>
>       <button onClick={handleOpenCheckout} disabled={cartItems.length === 0}>
>         Proceed to Checkout
>       </button>
> 
>       {isOpen && (
>         <Suspense fallback={<div className="modal-backdrop">Preparing Secure Checkout...</div>}>
>           <CheckoutModal items={cartItems} onClose={handleCloseCheckout} />
>         </Suspense>
>       )}
>     </div>
>   );
> }
> 
> // Mock assertion
> if (typeof window !== 'undefined') {
>   console.assert(typeof CheckoutModal === 'object', 'CheckoutModal is valid lazy component');
> }
> ```
>
> #### Technical Explanation
> 1. **SDK Isolation**: Payment processing SDKs are loaded only when users initiate checkout, keeping catalog browsing ultra-fast.
> 2. **Modal Backdrop Fallback**: Displaying backdrop loading states maintains user context while JavaScript streams in background.
> 3. **Clean Unmounting**: Closing modal sets `isOpen` to false, returning component tree to lean idle state.
> 4. **Browser Caching**: Once fetched, browser caches chunk binary; subsequent opens instantiate modal instantaneously.
> 
---

## 6. Related Terms

- [Suspense](suspense.md) — The UI boundary handling loading fallback states for lazy components.
- [React Router](../level_09/react_router.md) — Routing framework where route-level code splitting is implemented.
- [Bundler & Tree-Shaking](bundler_tree_shaking.md) — Build-time bundle creation and dead-code elimination.

---

## 7. Key Takeaways

- Code splitting divides monolithic application bundles into smaller, on-demand JavaScript chunks.
- Use `React.lazy(() => import('./Component'))` at module scope to declare lazy component imports.
- Always wrap `React.lazy()` components inside a `<Suspense fallback={...}>` boundary.
- Route-based code splitting is the most effective pattern for optimizing application load performance.
- Avoid over-splitting micro-components to prevent excessive HTTP request overhead.
