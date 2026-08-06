# Components

> **Level 1 — Core Concepts**
> Independent, reusable blocks of code that represent a piece of the user interface, serving as the fundamental building blocks of any React application.

---

## 1. Prerequisites

- [JSX (JavaScript XML)](jsx.md) — What components return to define UI structure.

---

## 2. Term Category

**Component Pattern (ui composition primitive)**: Components are independent, reusable, and self-contained units of user interface logic and view rendering. Unlike traditional monolithic HTML pages or jQuery scripts that mutate DOM elements imperatively, React components encapsulate both visuals and local logic into modular JavaScript functions.

By abstracting complex interfaces into a tree of nested components, React allows developers to build scalable UI systems where each element maintains its own state, receives configuration via props, and renders predictable JSX output upon re-evaluation.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional multi-page web applications, UI code was organized by file technology rather than functional concern: separate HTML files for layout, CSS files for styling, and JavaScript scripts for interactivity. This separation forced developers to copy-paste identical HTML structures across multiple pages and write fragile document selectors (`document.querySelector`) to attach behavior.

React introduced **Components** to organize applications by visual and logical concern rather than file extension. A component encapsulates layout, interactive logic, and styling dependencies into a single composable function. If a navigation bar or button design changes, modifying the single component updates every instance across the entire application instantly.

### (2) Reality Metaphor
Imagine a set of interlocking Lego bricks. 

Instead of molding an entire toy castle out of a single monolithic piece of plastic, toy manufacturers create standardized, modular bricks—2x4 blocks, window frames, door panels, and roof tiles. You assemble these individual bricks together to construct a wall, snap walls together to build towers, and connect towers to produce the complete castle. 

If a window frame breaks or needs recoloring, you replace that single block without melting down the entire castle. In React, components are these Lego bricks: small, isolated functions combined to build complex UI trees.

### (3) React Code Examples

#### Short Snippet
```jsx
// A minimal functional component returning JSX
function ProfileCard({ username, role }) {
  return (
    <div className="profile-card">
      <h3>{username}</h3>
      <p>Role: {role}</p>
    </div>
  );
}
```

#### Fuller Example
```jsx
import React from 'react';

// Modular child component
function StatusBadge({ status }) {
  const isOnline = status === 'active';
  return (
    <span className={`badge ${isOnline ? 'badge-success' : 'badge-neutral'}`}>
      {isOnline ? 'Active Now' : 'Offline'}
    </span>
  );
}

// Parent component composing child components
export default function UserListItem({ user }) {
  return (
    <div className="user-item">
      <img src={user.avatarUrl} alt={user.name} className="avatar" />
      <div className="user-details">
        <h4>{user.name}</h4>
        <p>{user.email}</p>
      </div>
      <StatusBadge status={user.status} />
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Lowercase Component Naming

**The mistake:** Naming a component function with a lowercase first letter, such as `function userCard()`, and attempting to render it as `<userCard />`.

**Why it's wrong:** React uses capitalization to differentiate custom React components from native HTML elements during JSX compilation. Lowercase tags like `<userCard>` are treated as standard DOM elements, resulting in missing renders or browser warnings.

*Incorrect:*
```jsx
// Lowercase component name treats tag as raw HTML <usercard>
function userCard({ name }) {
  return <div>{name}</div>;
}

function App() {
  return <userCard name="Alice" />;
}
```

*Fix:*
```jsx
// PascalCase component name identifies custom component function
function UserCard({ name }) {
  return <div>{name}</div>;
}

function App() {
  return <UserCard name="Alice" />;
}
```

### Mistake 2: Nesting Component Definitions Inside Parent Component Bodies

**The mistake:** Defining a component function inside the body of another component function.

**Why it's wrong:** Re-defining a component inside another component re-creates the child component function reference on EVERY single parent render. React treats the newly created function as a brand new component type, causing complete DOM unmounting, loss of child state, and UI input flicker.

*Incorrect:*
```jsx
function Parent() {
  // Re-created every render frame! Unmounts child state.
  function Child() {
    return <div>Child Content</div>;
  }
  return <Child />;
}
```

*Fix:*
```jsx
// Defined at top-level module scope
function Child() {
  return <div>Child Content</div>;
}

function Parent() {
  return <Child />;
}
```

### Mistake 3: Performing Impure Side Effects Directly inside Render

**The mistake:** Mutating external global variables or sending network HTTP requests directly inside the component body before returning JSX.

**Why it's wrong:** React render functions must remain pure calculations. Impure side effects executed during render execute unpredictably—especially under Concurrent Rendering or Strict Mode—causing memory leaks, duplicated network requests, and visual bugs.

*Incorrect:*
```jsx
let requestCounter = 0;

function MetricCard() {
  // Side-effect directly in render body!
  requestCounter += 1;
  fetch('/api/metrics');
  
  return <div>Requests: {requestCounter}</div>;
}
```

*Fix:*
```jsx
import { useEffect } from 'react';

function MetricCard({ metrics }) {
  // Side-effects safely encapsulated in useEffect
  useEffect(() => {
    fetch('/api/metrics');
  }, []);

  return <div>Metric: {metrics.count}</div>;
}
```

---

## 5. Practice Exercises

### Exercise 1: Telemetry Sensor Monitor (IoT Telemetry)

**Scenario:** You are building an industrial IoT monitoring dashboard. You need a reusable `SensorNode` component that renders telemetry data including sensor ID, current temperature reading, and status indicators.

**Requirements:**
1. Create a `SensorNode` functional component accepting `id`, `temperature`, and `threshold` props via destructuring.
2. Render a warning badge if `temperature` exceeds `threshold`.
3. Render sensor information inside semantic HTML markup with modern `className` attributes.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function SensorNode({ id, temperature, threshold }) {
>   const isExceeded = temperature > threshold;
> 
>   return (
>     <div className="sensor-card">
>       <h4>Sensor ID: {id}</h4>
>       <p>Reading: {temperature}°C</p>
>       {isExceeded ? (
>         <span className="alert-badge warning">CRITICAL OVERHEAT</span>
>       ) : (
>         <span className="alert-badge normal">OPERATIONAL</span>
>       )}
>     </div>
>   );
> }
> 
> export function TelemetryDashboard() {
>   const sensors = [
>     { id: 'SENS-101', temperature: 42.5, threshold: 50.0 },
>     { id: 'SENS-102', temperature: 68.1, threshold: 60.0 }
>   ];
> 
>   return (
>     <div className="dashboard-grid">
>       {sensors.map(s => (
>         <SensorNode key={s.id} {...s} />
>       ))}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Component Modularity**: `SensorNode` acts as a pure visual function mapping input telemetry props to JSX UI elements.
> 2. **Prop Destructuring**: Clean parameter signatures (`{ id, temperature, threshold }`) avoid verbose `props.` references.
> 3. **Conditional Rendering**: Inline ternaries calculate visual status without side effects during render.
> 4. **PascalCase Naming**: Using `SensorNode` ensures React compiles JSX as a custom function component rather than an HTML element.
> 
---

### Exercise 2: Order Book Entry Row (Financial Trading)

**Scenario:** A high-frequency trading platform requires an `OrderRow` component to display real-time bid/ask entries with price, size, and side type (BUY/SELL).

**Requirements:**
1. Define an `OrderRow` functional component taking `price`, `volume`, and `side` ('BUY' or 'SELL').
2. Apply conditional CSS classes based on the `side` prop ('bid-row' vs 'ask-row').
3. Format volume to 4 decimal places inside the template.
4. Ensure components are declared at top-level module scope.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function OrderRow({ price, volume, side }) {
>   const sideClass = side === 'BUY' ? 'bid-row' : 'ask-row';
>   const formattedVolume = Number(volume).toFixed(4);
> 
>   return (
>     <div className={`order-row ${sideClass}`}>
>       <span className="price">${price.toFixed(2)}</span>
>       <span className="volume">{formattedVolume}</span>
>       <span className="side">{side}</span>
>     </div>
>   );
> }
> 
> export function OrderBook() {
>   return (
>     <div className="order-book-table">
>       <OrderRow price={150.25} volume={12.5} side="BUY" />
>       <OrderRow price={150.30} volume={5.1234} side="SELL" />
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Dynamic Styling**: Dynamic string template interpolation generates CSS class names based on component input data.
> 2. **Render Purity**: `toFixed()` conversions calculate clean UI text during render without mutating inputs.
> 3. **Component Reusability**: The single `OrderRow` component renders both bid and ask data cleanly.
> 4. **Top-Level Scope**: Defining `OrderRow` outside `OrderBook` prevents re-creating component definitions on render.
> 
---

### Exercise 3: Shopping Cart Line Item (E-Commerce)

**Scenario:** Build a modular `CartItem` component for an e-commerce checkout page that receives item details and parent action callbacks.

**Requirements:**
1. Create `CartItem` taking `item` object (`id`, `title`, `price`, `quantity`) and `onQuantityChange` callback.
2. Calculate total item subtotal (`price * quantity`) inside the component body.
3. Render buttons calling `onQuantityChange(item.id, newQuantity)` when clicked.
4. Ensure callback invocations do not mutate the incoming `item` prop object.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function CartItem({ item, onQuantityChange }) {
>   const subtotal = (item.price * item.quantity).toFixed(2);
> 
>   return (
>     <div className="cart-item-row">
>       <div className="item-info">
>         <h5>{item.title}</h5>
>         <p>${item.price.toFixed(2)} each</p>
>       </div>
>       <div className="quantity-controls">
>         <button onClick={() => onQuantityChange(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
>           -
>         </button>
>         <span>{item.quantity}</span>
>         <button onClick={() => onQuantityChange(item.id, item.quantity + 1)}>
>           +
>         </button>
>       </div>
>       <div className="subtotal">${subtotal}</div>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Derived Calculation**: Subtotal is computed on-the-fly during render without extra state variables.
> 2. **Callback Invocations**: Events notify parents of requested state changes without mutating `item` props.
> 3. **Immutable Handlers**: Arrow functions pass updated primitive numbers (`quantity - 1`) safely.
> 4. **Encapsulation**: Component isolates layout and formatting logic away from top-level page containers.
> 
---

## 6. Related Terms

- [Render Purity](render_purity.md) — The fundamental rule that components must be pure functions of their props and state.
- [Fragments](fragments.md) — Tool for grouping sibling elements inside a component without adding wrapper DOM nodes.
- [Props (Properties)](props.md) — How configuration data and callbacks are passed into components.
- [JSX (JavaScript XML)](jsx.md) — The syntax extension components return to define UI structure.
- [Custom Hooks](../level_04/custom_hooks.md) — Reusable stateful logic extracted from functional components.

---

## 7. Key Takeaways

- **Components** are independent, reusable building blocks that combine view markup and logic.
- Modern React components are pure JavaScript functions that return JSX elements.
- Component function names **MUST** start with a Capital letter (PascalCase).
- Never define component functions inside other component functions to avoid unmounting bugs.
- Keep component body rendering pure; place side effects inside `useEffect` or event handlers.
