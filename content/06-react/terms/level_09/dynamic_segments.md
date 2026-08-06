# Dynamic Segments

> **Level 9 — Routing & Ecosystem**
> Route path placeholders (e.g. `/users/:id`) that match variable URL parameters and expose them to React components via hooks.

---

## 1. Prerequisites

- [React Router](react_router.md) — The routing framework where dynamic segments are declared.
- [`<Link>` Component](link_component.md) — How users navigate to URLs containing dynamic parameter values.

---

## 2. Term Category

**Ecosystem (routing parameterization)**: Route definition pattern in React Router that uses colon prefixes (`:paramName`) to declare variable path segments in URL patterns. Instead of hardcoding static routes for thousands of items, dynamic segments match URL paths containing variable parameters (such as database IDs or product slugs) and expose parsed parameter strings via the `useParams()` hook, unlike static literal route paths.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine building an e-commerce platform with 5,000,000 products or a social network with 10,000,000 user profiles. Defining static route declarations for every individual URL path is impossible:
```jsx
// Legacy Impossible Static Approach
<Route path="/product/1" element={<Product1 />} />
<Route path="/product/2" element={<Product2 />} />
// ... 4,999,998 more static routes!
```

To make routing scalable, React Router introduced **Dynamic Segments (URL Parameters)**:
1. **Colon Syntax (`:paramName`)**: Placing a colon in front of a route path segment informs the routing engine that the segment represents a variable placeholder rather than a literal string match.
2. **`useParams()` Hook**: Descendant components extract active parameter key-value pairs directly from current browser URL location history using `useParams()`.
3. **Multi-Segment Routing**: Routes support multiple dynamic placeholders within a single path string (e.g., `/blog/:year/:month/:slug`).
4. **String Type Conversion**: Parameters extracted from URLs are ALWAYS JavaScript String primitives. If a component expects numerical IDs, parameter strings must be parsed using `Number(id)` or `parseInt(id, 10)`.

---

### (2) Reality Metaphor
Imagine a postal service mailroom.
- **Static Routes (Dedicated Mail Boxes)**: The post office builds a custom physical building for every resident in the city. If a city has 100,000 residents, the post office must build 100,000 separate brick buildings (**unscalable static route declarations**).
- **Dynamic Segments (Numbered Mail Slots)**: The post office constructs a single central building containing rows of modular mail slots labeled `:boxNumber`. When a letter arrives addressed to Box #4829, the clerk opens slot #4829, extracts the mail, and handles the request (**single component handling dynamic parameter URLs**).

---

### (3) React Code Examples

#### Short Snippet
```jsx
import React from 'react';
import { useParams } from 'react-router-dom';

export function UserProfileCard() {
  // Extract `:userId` variable defined in <Route path="/users/:userId" />
  const { userId } = useParams();

  return <div className="profile-card">Viewing Profile for User #{userId}</div>;
}
```

#### Fuller Example
```jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';

function DeviceDetailView() {
  const { deviceId } = useParams();
  const [deviceData, setDeviceData] = useState(null);

  useEffect(() => {
    // Simulated API data fetch using extracted route parameter
    setDeviceData({
      id: deviceId,
      status: 'OPERATIONAL',
      temp: (20 + Number(deviceId) * 1.5).toFixed(1)
    });
  }, [deviceId]);

  if (!deviceData) return <div>Loading device telemetry...</div>;

  return (
    <div className="device-detail">
      <h3>Device Inspection: #{deviceData.id}</h3>
      <p>Status: {deviceData.status}</p>
      <p>Temperature: {deviceData.temp}°C</p>
      <Link to="/devices">← Back to Device List</Link>
    </div>
  );
}

export function DeviceApp() {
  return (
    <BrowserRouter>
      <div className="device-app">
        <nav>
          <Link to="/devices/101">Device #101</Link> |{' '}
          <Link to="/devices/202">Device #202</Link> |{' '}
          <Link to="/devices/303">Device #303</Link>
        </nav>
        <Routes>
          {/* `:deviceId` is the dynamic segment placeholder */}
          <Route path="/devices/:deviceId" element={<DeviceDetailView />} />
          <Route path="/devices" element={<p>Select a device above.</p>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mismatching Parameter Key Names Between Route Definition and `useParams()`

**The mistake:** Defining route path `<Route path="/users/:userId" />` but destructuring `const { id } = useParams()` inside component.

**Why it's wrong:** `useParams()` returns an object whose keys match the exact string after the colon in the Route path. Destructuring `id` instead of `userId` evaluates to `undefined`.

*Incorrect:*
```jsx
// Route: path="/users/:userId"
function Profile() {
  const { id } = useParams(); // BAD: `id` is undefined because route key is `userId`
  return <div>User: {id}</div>;
}
```

*Fix:*
```jsx
// Route: path="/users/:userId"
function Profile() {
  const { userId } = useParams(); // GOOD: Key matches route definition exactly
  return <div>User: {userId}</div>;
}
```

---

### Mistake 2: Comparing String Parameters with Number Primitives Without Type Casting

**The mistake:** Comparing `params.id === 42` using strict equality checks.

**Why it's wrong:** `useParams()` always returns string primitives (e.g., `'42'`). Comparing string `'42'` with number `42` using strict equality (`===`) evaluates to `false`.

*Incorrect:*
```jsx
const { id } = useParams();
// BAD: '42' === 42 evaluates to false!
if (id === 42) {
  fetchItem(id);
}
```

*Fix:*
```jsx
const { id } = useParams();
// GOOD: Cast string parameter to Number before comparison
if (Number(id) === 42) {
  fetchItem(Number(id));
}
```

---

### Mistake 3: Omitting Colon Prefixes in Route Path Definitions

**The mistake:** Defining route path `<Route path="/users/userId" element={<Profile />} />`.

**Why it's wrong:** Omitting the colon `:` configures the router to match the literal path string `"/users/userId"`, rather than matching dynamic variable parameters like `"/users/42"`.

*Incorrect:*
```jsx
// BAD: Matches literal URL /users/userId only
<Route path="/users/userId" element={<Profile />} />
```

*Fix:*
```jsx
// GOOD: Colon designates userId as dynamic parameter variable
<Route path="/users/:userId" element={<Profile />} />
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Device Inspector Route

**Scenario:** An industrial IoT application routes operators to `/sensors/:sensorId` to inspect sensor telemetry. You need to extract `:sensorId` using `useParams()` and display sensor status.

**Requirements:**
1. Configure route path `/sensors/:sensorId`.
2. Extract parameter using `useParams()`.
3. Provide mock assertion verifying parameter extraction.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';
> 
> function SensorInspector() {
>   const { sensorId } = useParams();
> 
>   return (
>     <div className="sensor-card">
>       <h4>Inspecting Sensor: {sensorId}</h4>
>       <p>Telemetry Status: NORMAL</p>
>     </div>
>   );
> }
> 
> export function IoTSensorApp() {
>   return (
>     <BrowserRouter>
>       <nav>
>         <Link to="/sensors/pressure-01">Pressure Sensor</Link> |{' '}
>         <Link to="/sensors/temp-99">Temp Sensor</Link>
>       </nav>
>       <Routes>
>         <Route path="/sensors/:sensorId" element={<SensorInspector />} />
>       </Routes>
>     </BrowserRouter>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof SensorInspector === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Colon Placeholder**: `:sensorId` matches dynamic URL segments (`pressure-01`, `temp-99`).
> 2. **`useParams` Extraction**: Retrieves active route parameters as string keys on object.
> 3. **Dynamic View Rendering**: Single component renders distinct telemetry views based on URL path.
> 4. **Deep Linking**: Allows operators to bookmark specific sensor URLs directly.
> 
---

### Exercise 2: Crypto Asset Ticker Route

**Scenario:** A trading workspace routes traders to `/portfolio/:ticker`. You must extract the `:ticker` string parameter and render corresponding market data.

**Requirements:**
1. Define route path `/portfolio/:ticker`.
2. Extract `:ticker` with `useParams()`.
3. Parse and capitalize ticker string.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';
> 
> function AssetDetail() {
>   const { ticker } = useParams();
>   const upperTicker = ticker ? ticker.toUpperCase() : '';
> 
>   return (
>     <div className="asset-detail">
>       <h3>Trading Asset: {upperTicker}</h3>
>       <p>Live Depth Stream Active</p>
>     </div>
>   );
> }
> 
> export function CryptoPortfolioApp() {
>   return (
>     <BrowserRouter>
>       <nav>
>         <Link to="/portfolio/btc">BTC</Link> | <Link to="/portfolio/eth">ETH</Link>
>       </nav>
>       <Routes>
>         <Route path="/portfolio/:ticker" element={<AssetDetail />} />
>       </Routes>
>     </BrowserRouter>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof AssetDetail === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Parameter Parsing**: `useParams()` destructures `ticker` parameter.
> 2. **String Utility Methods**: `upperTicker` applies `.toUpperCase()` safely to parameter string.
> 3. **URL-Driven Architecture**: Route changes trigger component re-render with updated parameter props.
> 4. **Declarative Route Specification**: Eliminates manual Regex URL parsing.
> 
---

### Exercise 3: E-Commerce Multi-Segment Catalog Route

**Scenario:** An online store routes customers to `/catalog/:category/:productId`. You need to extract both parameter values in a single component.

**Requirements:**
1. Define route path `/catalog/:category/:productId`.
2. Destructure `category` and `productId` from `useParams()`.
3. Cast `productId` string to Number.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';
> 
> function ProductPage() {
>   const { category, productId } = useParams();
>   const numericId = Number(productId);
> 
>   return (
>     <div className="product-page">
>       <h3>Category: {category}</h3>
>       <p>Product Numeric ID: {numericId}</p>
>     </div>
>   );
> }
> 
> export function ECommerceApp() {
>   return (
>     <BrowserRouter>
>       <nav>
>         <Link to="/catalog/electronics/404">Headphones (#404)</Link>
>       </nav>
>       <Routes>
>         <Route path="/catalog/:category/:productId" element={<ProductPage />} />
>       </Routes>
>     </BrowserRouter>
>   );
> }
> 
> if (typeof window !== 'undefined') {
>   console.assert(typeof ProductPage === 'function', 'Valid component');
> }
> ```
>
> #### Technical Explanation
> 1. **Multi-Segment Extraction**: `useParams()` returns `{ category: "electronics", productId: "404" }`.
> 2. **Type Casting**: `Number(productId)` converts string `'404'` to numerical primitive `404`.
> 3. **Hierarchical Matching**: Matches complex nested URL structures cleanly.
> 4. **Component Reuse**: Single `ProductPage` component serves millions of product category combinations.
> 
---

## 6. Related Terms

- [React Router](react_router.md) — The primary routing engine supporting dynamic segment matching.
- [`useNavigate` Hook](use_navigate.md) — Imperative navigation hook used to navigate to dynamic paths programmatically.
- [`useEffect` Hook](../level_03/use_effect.md) — Hook commonly used to trigger data fetches when parameter values change.

---

## 7. Key Takeaways

- Dynamic Segments use a colon prefix (`:paramName`) in route paths to declare variable URL placeholders.
- They allow a single React component to handle millions of variable URLs (e.g. `/users/1`, `/users/2`).
- Extract dynamic route parameters inside components using the **`useParams()`** hook.
- Destructured parameter keys must match the exact string name defined after the colon in the Route path.
- Values returned by `useParams()` are ALWAYS String primitives; parse strings to Numbers before numeric comparisons.
