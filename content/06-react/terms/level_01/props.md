# Props (Properties)

> **Level 1 — Core Concepts**
> The input configuration mechanism for passing read-only data and event callbacks from parent components down to child components.

---

## 1. Prerequisites

- [Components](components.md) — The visual functional units that receive props as function arguments.

---

## 2. Term Category

**Component Pattern (data contract)**: Props (short for properties) represent the external input parameters passed into a React component. They serve as a component's public data contract, allowing parent components to pass state data, configuration settings, primitive values, objects, elements, and callback functions down to child components.

In React's unidirectional data flow model, props are strictly **immutable (read-only)** snapshots; a child component can read its incoming props but is forbidden from mutating them directly.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If a component like `<UserProfile />` had hardcoded user details ("Alice", "25", "Developer") inside its body, rendering it five times would display five identical copies. The component would be reusable, but entirely static.

React introduced **Props** to transform static component templates into dynamic, customizable functions. Props act exactly like arguments passed into a standard JavaScript function:

```javascript
// Plain JavaScript Function
function add(a, b) { return a + b; }

// React Component Function receiving Props object
function AddDisplay({ a, b }) { return <div>Result: {a + b}</div>; }
```

By passing different prop values (`<Profile name="Alice" />`, `<Profile name="Bob" />`), parent components customize the visual appearance and behavior of child components while sharing a single underlying template implementation.

### (2) Reality Metaphor
Imagine a custom T-shirt printing factory.

- **Static Template (Component Body):** The factory owns a high-tech printing machine (`<TShirt />`) configured with a specific cotton shirt design and seam stitching.
- **Custom Order Sheet (Props):** Each customer submits a custom order sheet (`size="L"`, `color="navy"`, `graphic="logo.png"`). The machine reads the custom order sheet and prints a customized shirt. The machine never modifies the original order sheet submitted by the customer; it simply reads the specifications and delivers the requested shirt.

### (3) React Code Examples

#### Short Snippet
```jsx
// Destructuring props directly in the parameter signature
function ActionButton({ label, variant = 'primary', onClick }) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
}
```

#### Fuller Example
```jsx
import React from 'react';

// Child component receiving destructured primitive props, object props, and callbacks
function MetricCard({ title, data, onRefresh }) {
  return (
    <div className="metric-card">
      <div className="card-header">
        <h4>{title}</h4>
        <button onClick={onRefresh} className="btn-icon">↻</button>
      </div>
      <div className="card-body">
        <span className="value">{data.current} {data.unit}</span>
        <span className={data.delta >= 0 ? 'positive' : 'negative'}>
          {data.delta >= 0 ? '+' : ''}{data.delta}% vs last week
        </span>
      </div>
    </div>
  );
}

// Parent component passing props down
export default function DashboardGrid() {
  const cpuMetric = { current: 48, unit: '%', delta: -3.2 };

  const handleCpuRefresh = () => {
    console.log("Refreshing CPU telemetry...");
  };

  return (
    <div className="grid">
      <MetricCard 
        title="CPU Utilization" 
        data={cpuMetric} 
        onRefresh={handleCpuRefresh} 
      />
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Mutate Props Directly Inside Child Components

**The mistake:** Writing `props.count = props.count + 1` or `user.name = 'Bob'` inside a child component body.

**Why it's wrong:** Props are **Strictly Read-Only**. Mutating a prop directly breaks React's unidirectional data flow, bypasses state change tracking, and mutates object references shared across other components. If a child needs to modify data, the parent must pass a callback function prop that updates parent state.

*Incorrect:*
```jsx
function Counter(props) {
  const handleIncrement = () => {
    // ❌ Error: Props are read-only! Cannot mutate props directly.
    props.count = props.count + 1;
  };

  return <button onClick={handleIncrement}>Count: {props.count}</button>;
}
```

*Fix:*
```jsx
// ✅ Child invokes parent callback prop to request state changes
function Counter({ count, onIncrement }) {
  return <button onClick={onIncrement}>Count: {count}</button>;
}
```

### Mistake 2: Passing String Numbers or Booleans Without Curly Braces `{}`

**The mistake:** Writing `<Rating score="5" isVerified="true" />` expecting numeric and boolean primitives.

**Why it's wrong:** Quoted strings pass literal string primitives (`'5'` and `'true'`). Passing numeric values as strings leads to mathematical concatenation bugs (`'5' + 1 = '51'`). Wrap numbers and booleans inside curly braces `<Rating score={5} isVerified={true} />`.

*Incorrect:*
```jsx
// ❌ Passes string '5' instead of number 5
<ProductCard price="29.99" discount="5" />
```

*Fix:*
```jsx
// ✅ Passes numbers using expression curly braces {}
<ProductCard price={29.99} discount={5} />
```

### Mistake 3: Forgetting Destructuring Fallback Default Prop Values

**The mistake:** Reading nested prop properties like `user.profile.avatar` without checking if `user` or `profile` props are undefined.

**Why it's wrong:** If a parent component passes `null` or `undefined` for a prop, accessing properties on it throws a runtime `TypeError: Cannot read properties of undefined`. Provide default parameters directly in parameter destructuring signatures.

*Incorrect:*
```jsx
// ❌ Throws TypeError if settings prop is omitted!
function UserAvatar({ user }) {
  return <img src={user.profile.avatar} alt="User" />;
}
```

*Fix:*
```jsx
// ✅ Clean default parameters and optional chaining prevent crashes
function UserAvatar({ user = { profile: { avatar: '/default.png' } } }) {
  return <img src={user.profile?.avatar ?? '/default.png'} alt="User" />;
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Gauge Component (IoT Telemetry)

**Scenario:** Create a reusable `SensorGauge` component for an industrial monitoring platform that receives telemetry parameters and threshold alert callbacks.

**Requirements:**
1. Create `SensorGauge` accepting `label`, `reading`, `min`, `max`, and `onAlert` props.
2. Calculate percentage fill `((reading - min) / (max - min)) * 100`.
3. If `reading > max`, invoke `onAlert(label, reading)` during user button clicks.
4. Use parameter destructuring with fallback default values.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function SensorGauge({ 
>   label = 'Unknown Sensor', 
>   reading = 0, 
>   min = 0, 
>   max = 100, 
>   onAlert 
> }) {
>   const percentage = Math.min(100, Math.max(0, ((reading - min) / (max - min)) * 100));
>   const isOverLimit = reading > max;
> 
>   return (
>     <div className="gauge-box">
>       <h5>{label}</h5>
>       <div className="reading-display">{reading}</div>
>       <div className="meter-track">
>         <div className="meter-bar" style={{ width: `${percentage}%` }} />
>       </div>
>       {isOverLimit && (
>         <button className="btn-alert" onClick={() => onAlert?.(label, reading)}>
>           Trigger Over-Limit Log
>         </button>
>       )}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Default Parameters**: Default values in destructuring signatures (`min = 0`, `max = 100`) protect against missing props.
> 2. **Read-Only Props**: Input props remain strictly read-only; calculations create derived local constants (`percentage`).
> 3. **Callback Invocations**: Optional chaining (`onAlert?.()`) safely fires parent callbacks without direct state mutation.
> 4. **Dynamic Style Binding**: Inline width percentages map cleanly from calculated prop ratios.
> 
---

### Exercise 2: Financial Order Form Input Field (Financial Trading)

**Scenario:** Build a reusable `OrderInputField` component for an algorithmic trading desk that accepts input configuration parameters and value change callbacks.

**Requirements:**
1. Create `OrderInputField` taking `label`, `value`, `type` ('number' | 'text'), `step`, and `onChange`.
2. Format label to uppercase inside template markup.
3. Render styled numeric step controls calling `onChange`.
4. Ensure components do not mutate input `value` props directly.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function OrderInputField({ 
>   label, 
>   value, 
>   type = 'number', 
>   step = '0.01', 
>   onChange 
> }) {
>   return (
>     <div className="order-input-group">
>       <label>{label.toUpperCase()}</label>
>       <input 
>         type={type} 
>         step={step} 
>         value={value} 
>         onChange={e => onChange(e.target.value)} 
>       />
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Controlled Inputs**: Component receives current value via `value` prop and notifies parent of user typing via `onChange`.
> 2. **Derived Text Transformations**: `label.toUpperCase()` formats prop text during render without mutating input props.
> 3. **Configurable Defaults**: Default `type = 'number'` parameter allows clean consumption for numeric financial fields.
> 4. **Unidirectional Event Flow**: User keystrokes pass value strings upward to parent state setters cleanly.
> 
---

### Exercise 3: E-Commerce Product Badge Bar (E-Commerce)

**Scenario:** Build a `ProductBadgeBar` component displaying product status tags (`isNew`, `onSale`, `discountPercent`).

**Requirements:**
1. Create `ProductBadgeBar` taking `badges` object prop (`isNew`, `onSale`, `discountPercent`).
2. Render badges conditionally based on boolean properties inside `badges`.
3. Format discount text (`-${discountPercent}% OFF`).
4. Destructure nested properties safely inside parameter signature.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function ProductBadgeBar({ badges = {} }) {
>   const { isNew = false, onSale = false, discountPercent = 0 } = badges;
> 
>   return (
>     <div className="badge-bar">
>       {isNew && <span className="badge badge-new">NEW ARRIVAL</span>}
>       {onSale && (
>         <span className="badge badge-sale">
>           SALE -{discountPercent}% OFF
>         </span>
>       )}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Nested Destructuring**: Destructuring nested properties with defaults (`const { isNew = false } = badges`) provides safe prop parsing.
> 2. **Conditional Tag Rendering**: Logical AND operators (`{isNew && ...}`) render badge nodes conditionally based on prop flags.
> 3. **Prop Snapshot Purity**: Props act as immutable inputs; no global objects are modified.
> 4. **Modular Customization**: Allows parent components to configure badges via simple object prop pass-throughs.
> 
---

## 6. Related Terms

- [Render Purity](render_purity.md) — The rule explaining why props must remain read-only snapshots during render.
- [State](../level_02/state.md) — Unlike Props (passed down read-only), State is internal component data that mutates to trigger renders.
- [Unidirectional Data Flow](../level_02/unidirectional_flow.md) — The architectural rule specifying that props only flow top-down.
- [Components](components.md) — Reusable functional units receiving props.

---

## 7. Key Takeaways

- **Props** are read-only input parameters passed from parent components to child components.
- Component functions receive props as a single JavaScript object parameter; modern developers destructure props in parameters.
- Props are **Strictly Read-Only**; child components must never mutate incoming props directly.
- Pass numbers, booleans, and JavaScript expressions wrapped inside curly braces (`count={5}`).
- To update parent data from a child, pass callback functions as props (`onUpdate={handleUpdate}`).
