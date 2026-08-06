# Unidirectional Data Flow

> **Level 2 — State & Reactivity**
> The strict architectural principle that data in a React application flows in a single direction: top-down from parent to child components via props.

---

## 1. Prerequisites

- [Props (Properties)](../level_01/props.md) — The vehicle that carries data downwards through component trees.
- [State](state.md) — The source of dynamic data that flows top-down.

---

## 2. Term Category

**Component Pattern (data flow architecture)**: Unidirectional Data Flow (one-way data binding) is a foundational architectural design pattern in React. Data in a React application strictly moves downwards from parent components to child components via props.

Child components cannot directly mutate parent data or pass props "sideways" to sibling components. To request state updates, child components execute callback functions passed down from parent components, maintaining a clear, single source of truth and predictable state debugging.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In earlier web frameworks (such as AngularJS 1.x), "Two-Way Data Binding" was popular. If a child input changed a variable, it automatically mutated the parent state in-place, and if a parent changed a variable, it mutated the child.

While convenient for simple forms, Two-Way Data Binding created a chaotic web of updates in large applications. If a state variable changed unexpectedly, tracking down which component in a complex hierarchy triggered the mutation became nearly impossible, causing difficult-to-reproduce state synchronization bugs.

React introduced **Unidirectional Data Flow** to solve this:
- Data flows like a waterfall: strictly top-down from parent to child via props.
- State is owned by a single component at any given time (single source of truth).
- If a child needs to update parent data, it uses **Inverse Data Flow**: the parent passes down an event callback function prop (e.g., `onChange`), and the child invokes that callback to request a state update in the parent.

```text
               ┌────────────────────────┐
               │    Parent Component    │  <── State Source
               └────────────────────────┘
                 │                      ▲
       (Data Flows DOWN)       (Events Flow UP)
                 │                      │
                 ▼                      │
               ┌────────────────────────┐
               │    Child Component     │  <── Invokes Callback
               └────────────────────────┘
```

### (2) Reality Metaphor
Imagine a corporate reporting hierarchy inside a company.

- **Two-Way Binding (Chaos):** An intern can walk into the CEO's office, rewrite the company budget ledger directly on the CEO's desk without approval, and walk out. When financial audits occur, nobody can trace who altered the balance figures or why.
- **Unidirectional Flow (Structured Chain of Command):** The CEO (**parent component**) holds the financial ledger (**state**). The CEO issues budget summaries down to department managers (**props flowing down**). If an intern (**child component**) needs extra funds for software, they submit a purchase request ticket (**invoking callback event**). The CEO reviews the ticket, updates the ledger, and issues updated budget numbers down the chain (**predictable update flow**).

### (3) React Code Examples

#### Short Snippet
```jsx
// Unidirectional flow: Data flows DOWN (props); Events flow UP (callbacks)
function Parent() {
  const [text, setText] = useState('Initial');

  return (
    <div>
      {/* Passes data down (value) and callback function up (onChange) */}
      <ChildInput value={text} onChange={setText} />
    </div>
  );
}

function ChildInput({ value, onChange }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}
```

#### Fuller Example
```jsx
import React, { useState } from 'react';

// Reader Child Component: receives data read-only via props
function UserDisplay({ user }) {
  return (
    <div className="user-card">
      <h4>User: {user.name}</h4>
      <p>Status: {user.status}</p>
    </div>
  );
}

// Writer Child Component: receives value and fires event callback up
function UserEditor({ currentStatus, onStatusChange }) {
  return (
    <div className="editor-controls">
      <label>Update Status:</label>
      <select 
        value={currentStatus} 
        onChange={e => onStatusChange(e.target.value)}
      >
        <option value="Active">Active</option>
        <option value="Away">Away</option>
        <option value="Offline">Offline</option>
      </select>
    </div>
  );
}

// Single Source of Truth Parent
export default function UnidirectionalDemo() {
  const [user, setUser] = useState({ name: 'Alice', status: 'Active' });

  const handleStatusChange = (newStatus) => {
    // Parent updates state; data flows down automatically on re-render
    setUser(prev => ({ ...prev, status: newStatus }));
  };

  return (
    <div className="parent-container">
      <h3>Unidirectional Data Flow Demo</h3>
      <UserDisplay user={user} />
      <UserEditor 
        currentStatus={user.status} 
        onStatusChange={handleStatusChange} 
      />
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Mutate Parent Props Directly Inside Child Components

**The mistake:** Writing `props.user.status = 'Offline'` inside a child component function.

**Why it's wrong:** React props are read-only. Mutating props directly breaks unidirectional data flow, bypasses parent state tracking, and creates out-of-sync bugs across other components reading the same object.

*Incorrect:*
```jsx
function StatusToggle(props) {
  const handleToggle = () => {
    // ❌ Error: Direct prop mutation breaks unidirectional flow!
    props.user.status = 'Offline'; 
  };
  return <button onClick={handleToggle}>Set Offline</button>;
}
```

*Fix:*
```jsx
function StatusToggle({ status, onToggleStatus }) {
  // ✅ Invoke parent callback to request state change
  return <button onClick={() => onToggleStatus('Offline')}>Set Offline</button>;
}
```

### Mistake 2: Copying Props into Local Child State (Anti-Pattern)

**The mistake:** Receiving a prop and immediately copying it into local state: `const [status, setStatus] = useState(props.status)`.

**Why it's wrong:** Copying props into local state creates two competing sources of truth. When the parent component updates `props.status`, the child component's `useState` ignores the update, causing UI desynchronization.

*Incorrect:*
```jsx
function ChildBadge({ status }) {
  // ❌ Duplicate state ignores parent status prop updates!
  const [localStatus, setLocalStatus] = useState(status);
  return <span className="badge">{localStatus}</span>;
}
```

*Fix:*
```jsx
function ChildBadge({ status }) {
  // ✅ Read prop directly without local state duplication
  return <span className="badge">{status}</span>;
}
```

### Mistake 3: Creating Circular State Update Loops Between Sibling Components

**The mistake:** Child A updates Parent state in `useEffect`, which updates Child B props, which triggers Child B `useEffect` to update Child A.

**Why it's wrong:** Circular state update chains trigger infinite re-render loops (`Maximum update depth exceeded`). Always manage state updates through explicit user event handlers or consolidate logic into a single parent component.

*Incorrect:*
```jsx
// ❌ Circular state update chains inside useEffect across sibling components
```

*Fix:*
```jsx
// Consolidate state update logic inside explicit parent event handlers
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Calibration Control (IoT Telemetry)

**Scenario:** An industrial IoT monitoring app displays sensor metrics and allows operators to send calibration offset updates using unidirectional flow.

**Requirements:**
1. Create `SensorDisplay` reading `offset` prop.
2. Create `CalibrationControl` writer firing `onCalibrate` callback up.
3. Create `TelemetryNode` parent holding `offset` state.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function SensorDisplay({ sensorId, reading, offset }) {
>   const calibratedValue = (reading + offset).toFixed(2);
>   return (
>     <div className="display-card">
>       <h5>Sensor ID: {sensorId}</h5>
>       <p>Calibrated Reading: {calibratedValue} PSI (Offset: {offset})</p>
>     </div>
>   );
> }
> 
> function CalibrationControl({ currentOffset, onCalibrate }) {
>   return (
>     <div className="control-card">
>       <button onClick={() => onCalibrate(currentOffset + 0.5)}>+0.5 Offset</button>
>       <button onClick={() => onCalibrate(currentOffset - 0.5)}>-0.5 Offset</button>
>       <button onClick={() => onCalibrate(0)}>Zero Calibration</button>
>     </div>
>   );
> }
> 
> export function TelemetryNode() {
>   const [offset, setOffset] = useState(0.0);
> 
>   return (
>     <div className="telemetry-node">
>       <h4>Telemetry Calibration Station</h4>
>       <SensorDisplay sensorId="S-900" reading={101.3} offset={offset} />
>       <CalibrationControl currentOffset={offset} onCalibrate={setOffset} />
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Data Flows Down**: `offset` state travels down to `SensorDisplay` and `CalibrationControl` via props.
> 2. **Events Flow Up**: Button clicks invoke `onCalibrate` callbacks, passing numeric deltas up to `setOffset`.
> 3. **Single Source of Truth**: `TelemetryNode` holds the single authoritative `offset` state.
> 4. **Predictable Debugging**: State transitions can be tracked linearly from parent handlers down.
> 
---

### Exercise 2: Financial Order Ticket Execution Flow (Financial Trading)

**Scenario:** A trading ticket allows selecting buy/sell sides. The ticket controls side selection and passes data down to execution preview panels.

**Requirements:**
1. Create `SideSelector` writer component.
2. Create `ExecutionPreview` reader component.
3. Create `OrderTicket` parent managing `side` ('BUY' | 'SELL') state.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function SideSelector({ side, onSelectSide }) {
>   return (
>     <div className="side-toggle">
>       <button 
>         className={side === 'BUY' ? 'active-buy' : ''} 
>         onClick={() => onSelectSide('BUY')}
>       >
>         BUY
>       </button>
>       <button 
>         className={side === 'SELL' ? 'active-sell' : ''} 
>         onClick={() => onSelectSide('SELL')}
>       >
>         SELL
>       </button>
>     </div>
>   );
> }
> 
> function ExecutionPreview({ side, price, qty }) {
>   return (
>     <div className={`preview-card ${side.toLowerCase()}`}>
>       <h5>Order Summary</h5>
>       <p>Action: {side} {qty} shares @ ${price}</p>
>     </div>
>   );
> }
> 
> export function OrderTicket() {
>   const [side, setSide] = useState('BUY');
> 
>   return (
>     <div className="ticket-box">
>       <h4>Trade Ticket</h4>
>       <SideSelector side={side} onSelectSide={setSide} />
>       <ExecutionPreview side={side} price={150.25} qty={100} />
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Top-Down Prop Flow**: `side` state is passed down to both children via props.
> 2. **Inverse Event Dispatch**: `SideSelector` triggers `onSelectSide` callbacks on button clicks.
> 3. **Synchronized Subtrees**: Updating `side` in parent re-renders `ExecutionPreview` instantly.
> 4. **No Direct Sibling Coupling**: Sibling components do not interact directly with each other.
> 
---

### Exercise 3: E-Commerce Filter Bar & List Unidirectional Flow (E-Commerce)

**Scenario:** An e-commerce product page features a category filter bar and product grid using unidirectional flow.

**Requirements:**
1. Create `CategoryFilter` writer component.
2. Create `ProductGrid` reader component.
3. Create `StorePage` parent managing `selectedCategory` state.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function CategoryFilter({ categories, selected, onSelectCategory }) {
>   return (
>     <div className="filter-bar">
>       {categories.map(cat => (
>         <button 
>           key={cat} 
>           className={selected === cat ? 'selected' : ''}
>           onClick={() => onSelectCategory(cat)}
>         >
>           {cat}
>         </button>
>       ))}
>     </div>
>   );
> }
> 
> function ProductGrid({ products, category }) {
>   const filtered = category === 'All' 
>     ? products 
>     : products.filter(p => p.category === category);
> 
>   return (
>     <div className="product-grid">
>       {filtered.map(p => (
>         <div key={p.id} className="item-card">{p.name} ({p.category})</div>
>       ))}
>     </div>
>   );
> }
> 
> export function StorePage({ products }) {
>   const [category, setCategory] = useState('All');
>   const categories = ['All', 'Electronics', 'Apparel', 'Books'];
> 
>   return (
>     <div className="store-layout">
>       <CategoryFilter 
>         categories={categories} 
>         selected={category} 
>         onSelectCategory={setCategory} 
>       />
>       <ProductGrid products={products} category={category} />
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Single State Source**: `category` state lives in `StorePage`.
> 2. **Unidirectional Props**: Data flows down to `CategoryFilter` and `ProductGrid`.
> 3. **Event Notification**: `onSelectCategory` passes chosen strings up to the parent setter.
> 4. **Deterministic Rendering**: Eliminates data racing and desynchronized view filters.
> 
---

## 6. Related Terms

- [Props (Properties)](../level_01/props.md) — The vehicle carrying data down through unidirectional component trees.
- [State](state.md) — The source data managed by parent components.
- [Lifting State Up](lifting_state_up.md) — The pattern used to position state in the closest common parent for unidirectional flow.
- [Controlled Components](../level_05/controlled_components.md) — Form inputs governed by unidirectional state and callback props.

---

## 7. Key Takeaways

- **Unidirectional Data Flow** dictates that data strictly flows top-down from parent to child via props.
- Data flows DOWN via props; Events flow UP via callback functions.
- Child components must never mutate incoming props directly.
- Sibling components cannot share data directly; state must be lifted to their common parent.
- Never copy props into local child state (`useState(props.val)`), as it creates competing sources of truth.
