# Declarative Programming

> **Level 1 — Core Concepts**
> A programming paradigm where you describe what the UI should look like for a given state, rather than writing step-by-step DOM manipulation instructions.

---

## 1. Prerequisites

- None!

---

## 2. Term Category

**Rendering Mechanic (paradigm abstraction)**: Declarative programming is an architectural paradigm where developers state the desired end-state of a system ($UI = f(State)$) while abstracting away intermediate execution steps. In contrast to imperative DOM scripting—which directly calls low-level browser APIs (`appendChild`, `setAttribute`, `removeChild`)—React takes declarative component declarations and manages the underlying DOM operations behind its reconciliation engine.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In early web application development using vanilla JavaScript or jQuery, developers wrote imperative code. To update a button after a network request, a developer manually queried the DOM element, modified CSS classes, appended spinner nodes, and updated text nodes line-by-line.

As applications scaled to hundreds of dynamic UI elements, keeping track of every manual DOM mutation state became unmaintainable. An unexpected user action or asynchronous network response could leave the DOM in an inconsistent state, leading to hard-to-reproduce visual bugs.

React adopted **Declarative Programming** so developers only need to define a component's visual representation for any state snapshot. When data changes, React calculates the delta and updates the real DOM automatically.

### (2) Reality Metaphor
Imagine ordering food at a restaurant versus cooking inside the kitchen.

- **Imperative (Kitchen Commands):** You step into the kitchen, ignite the gas burner, select a pan, measure oil, crack eggs, control flame heat, flip the omelet, and transfer it to a plate. You manage every step of execution.
- **Declarative (Menu Order):** You sit at the dining table and tell the waiter: *"I would like a cheese omelet."* You declare *what* you want. The kitchen handles the step-by-step execution to deliver your requested meal.

### (3) React Code Examples

#### Short Snippet
```jsx
// Declarative UI: The button appearance is a function of `isLoading` state
function SubmitButton({ isLoading }) {
  return (
    <button disabled={isLoading} className={isLoading ? 'btn-busy' : 'btn-ready'}>
      {isLoading ? 'Processing...' : 'Submit Order'}
    </button>
  );
}
```

#### Fuller Example
```jsx
import React, { useState } from 'react';

export default function OrderWorkflow() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success'

  const handleSubmit = () => {
    setStatus('submitting');
    setTimeout(() => {
      setStatus('success');
    }, 1500);
  };

  // Declarative UI branches based on status state
  return (
    <div className="workflow-card">
      <h3>Order Checkout</h3>

      {status === 'idle' && (
        <button onClick={handleSubmit} className="btn-primary">
          Place Order
        </button>
      )}

      {status === 'submitting' && (
        <div className="spinner-box">
          <span className="spinner" /> Processing transaction...
        </div>
      )}

      {status === 'success' && (
        <div className="alert-success">
          Order placed successfully!
        </div>
      )}
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mixing Imperative DOM Manipulations Inside React Components

**The mistake:** Calling `document.getElementById('target').style.display = 'none'` inside a React click handler or hook to hide an element.

**Why it's wrong:** Direct DOM mutations bypass React's Virtual DOM and internal state tracking. The next time React re-renders the component, it will overwrite or conflict with your manual DOM mutations, restoring the previous DOM tree.

*Incorrect:*
```jsx
function Banner() {
  const hideBanner = () => {
    // Direct DOM manipulation bypasses React state!
    document.getElementById('banner-node').style.display = 'none';
  };

  return <div id="banner-node"><button onClick={hideBanner}>Close</button></div>;
}
```

*Fix:*
```jsx
function Banner() {
  const [visible, setVisible] = useState(true);

  // Declaratively update state and let React handle DOM updates
  if (!visible) return null;
  return <div><button onClick={() => setVisible(false)}>Close</button></div>;
}
```

### Mistake 2: Expecting UI Updates Without Triggering State Transitions

**The mistake:** Mutating local variables in an event handler and expecting the declarative JSX template to re-evaluate automatically.

**Why it's wrong:** React calculates declarative UI updates ($UI = f(State)$) only when official React state changes occur. Mutating standard local variables does not notify React's reconciliation engine.

*Incorrect:*
```jsx
function Counter() {
  let count = 0;
  // Local variable mutation does not trigger render evaluation
  return <button onClick={() => { count += 1; }}>Count: {count}</button>;
}
```

*Fix:*
```jsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(prev => prev + 1)}>Count: {count}</button>;
}
```

### Mistake 3: Re-implementing Framework Reconciliation Imperatively

**The mistake:** Manually removing, replacing, or re-ordering list items in DOM element children arrays inside a `useEffect`.

**Why it's wrong:** React's reconciliation engine already handles list diffing declaratively via `key` props. Manually manipulating element children array structures leads to corrupted Fiber node references.

*Incorrect:*
```jsx
useEffect(() => {
  const list = document.getElementById('item-list');
  list.removeChild(list.firstChild); // Bypasses React Fiber tree!
}, [items]);
```

*Fix:*
```jsx
// Render array declaratively using JSX map
return (
  <ul id="item-list">
    {items.map(item => <li key={item.id}>{item.name}</li>)}
  </ul>
);
```

---

## 5. Practice Exercises

### Exercise 1: Patient Vital Monitoring Display (Healthcare)

**Scenario:** An intensive care unit telemetry view displays patient heart rate metrics. The UI must declaratively present normal, warning, or critical status alerts depending on heart rate thresholds.

**Requirements:**
1. Create a `VitalMonitor` component accepting `bpm` (beats per minute) as a prop.
2. Declaratively map `bpm` ranges (< 60: 'Bradycardia', 60-100: 'Normal', > 100: 'Tachycardia').
3. Render styled indicator badges matching each condition without manual DOM manipulation.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function VitalMonitor({ bpm }) {
>   const getStatus = (rate) => {
>     if (rate < 60) return { label: 'Bradycardia Warning', level: 'warning' };
>     if (rate > 100) return { label: 'Tachycardia Alert', level: 'critical' };
>     return { label: 'Normal Rhythm', level: 'normal' };
>   };
> 
>   const status = getStatus(bpm);
> 
>   return (
>     <div className="vital-card">
>       <h3>Heart Rate: {bpm} BPM</h3>
>       <span className={`status-badge status-${status.level}`}>
>         {status.label}
>       </span>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Declarative Mapping**: The helper function maps raw input primitives (`bpm`) directly to a UI representation object.
> 2. **Pure Projection**: Rendering logic expresses visual elements as a direct function of props without imperative branch scripts.
> 3. **Encapsulated Class Logic**: Class string construction computes style targets without querying or editing DOM nodes.
> 4. **Self-Updating**: Changing `bpm` props automatically updates badge labels and styling via React's engine.
> 
---

### Exercise 2: Network Bandwidth Meter (Networking)

**Scenario:** A network telemetry app monitors router port throughput. Build a `BandwidthMeter` displaying throughput usage percentage and visual progress bar declaratively.

**Requirements:**
1. Create `BandwidthMeter` accepting `currentMbps` and `maxMbps` props.
2. Compute dynamic usage percentage bounded between 0% and 100%.
3. Declaratively set progress bar width style `{ width: `${percentage}%` }`.
4. Render capacity alert when usage exceeds 90%.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function BandwidthMeter({ currentMbps, maxMbps }) {
>   const percentage = Math.min(100, Math.max(0, (currentMbps / maxMbps) * 100));
>   const isSaturated = percentage >= 90;
> 
>   return (
>     <div className="bandwidth-meter">
>       <div className="meter-header">
>         <span>Usage: {currentMbps} / {maxMbps} Mbps</span>
>         {isSaturated && <strong className="alert">Link Saturated!</strong>}
>       </div>
>       <div className="track">
>         <div 
>           className={`fill ${isSaturated ? 'fill-danger' : 'fill-normal'}`}
>           style={{ width: `${percentage}%` }}
>         />
>       </div>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Inline Declarative Styles**: Visual progress bar width is declared via JavaScript object property bindings (`width`).
> 2. **Boundary Calculations**: Pure math operations bound percentage calculations before JSX evaluation.
> 3. **Conditional Alert**: Saturation warning elements are rendered conditionally without toggle element display styles.
> 4. **No Direct DOM Manipulation**: Style changes bypass `element.style.width` mutations entirely.
> 
---

### Exercise 3: Vector Graphics Renderer (Graphics)

**Scenario:** A 2D canvas preview tool renders geometric shapes based on user-configured properties. Build a declarative SVG `CircleShape` component.

**Requirements:**
1. Create `CircleShape` accepting `cx`, `cy`, `radius`, and `color` props.
2. Declaratively return an SVG `<svg>` containing a `<circle>` node mapped to those properties.
3. Add interactive hover state using React `useState` to scale radius declaratively.
4. Ensure vector updates occur seamlessly without manual SVG element recreation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function CircleShape({ cx, cy, radius, color }) {
>   const [hovered, setHovered] = useState(false);
>   const activeRadius = hovered ? radius * 1.2 : radius;
> 
>   return (
>     <svg width="200" height="200" className="canvas-preview">
>       <circle
>         cx={cx}
>         cy={cy}
>         r={activeRadius}
>         fill={color}
>         onMouseEnter={() => setHovered(true)}
>         onMouseLeave={() => setHovered(false)}
>         style={{ transition: 'r 0.2s ease' }}
>       />
>     </svg>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **SVG Declarative Integration**: React handles SVG tags seamlessly, treating attributes like `cx`, `cy`, and `r` declaratively.
> 2. **Interactive Hover State**: `onMouseEnter`/`onMouseLeave` handlers update state to trigger declarative recalculations of radius.
> 3. **Derived Attribute Value**: `activeRadius` computes the visual dimension cleanly during render based on `hovered`.
> 4. **State-Driven Animation**: Smooth attribute transitions execute while maintaining declarative state control.
> 
---

## 6. Related Terms

- [State](../level_02/state.md) — The dynamic data powering declarative UI transformations.
- [Virtual DOM](virtual_dom.md) — The abstraction React uses to convert declarative JSX into real DOM commands.
- [`useRef` Hook](../level_04/use_ref.md) — Escape hatch hook used when imperative DOM access is strictly necessary.
- [Reconciliation](reconciliation.md) — The diffing process that computes minimal real DOM updates from declarative trees.

---

## 7. Key Takeaways

- **Declarative Programming** focuses on defining *what* the UI should look like for a given state.
- In React, UI is expressed as a pure mathematical projection of data: $UI = f(State)$.
- Never write imperative DOM mutation code (`document.getElementById`) inside React components.
- Declarative components eliminate manual DOM state synchronization bugs.
