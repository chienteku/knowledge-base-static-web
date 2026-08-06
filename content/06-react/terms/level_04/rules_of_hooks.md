# Rules of Hooks

> **Level 4 — Advanced Hooks**
> The two fundamental architectural laws enforced by React to guarantee hook state allocation order across render passes.

---

## 1. Prerequisites

- [Components](../level_01/components.md) — Functional components where hooks are declared.
- [`useState` Hook](../level_02/use_state.md) — Core hook governed by these rules.

---

## 2. Term Category

**Rendering Mechanic (hook call stack validator)**: React Hooks rely on internal array call stacks bound to Fiber nodes. Because hooks do not receive explicit unique key arguments (like `useState('myKey')`), React maps state variables to hook calls purely by their **call execution order**.

The **Rules of Hooks** are two mandatory architectural rules. Violating them alters hook execution order between renders, causing React to assign state values to wrong hook variables or throw runtime crash exceptions.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

How does React know which state belongs to which `useState` call without using explicit string IDs?

React maintains an internal linked list of hook cells for each component instance.
- Render 1: Call 1 (`useState`) -> Cell 1. Call 2 (`useEffect`) -> Cell 2. Call 3 (`useState`) -> Cell 3.
- Render 2: React resets its internal pointer to Cell 1 and expects hooks to execute in the exact same sequence!

If Hook #2 is wrapped inside an `if (isLoggedIn)` block that evaluates to `false` on Render 2:
- Call 1 (`useState`) reads Cell 1.
- Call 2 (`useState` previously Call 3) reads Cell 2 (which contains `useEffect` state!).

React gets completely confused, assigns incorrect data types to variables, and crashes the app. To prevent state corruption, React enforces the Rules of Hooks.

#### The Two Mandatory Rules

1. **Only Call Hooks at the Top Level:** Never call hooks inside loops (`for`), conditional statements (`if`), or nested callback functions. Declare all hooks unconditionally at the very top of your functional component.
2. **Only Call Hooks from React Functions:** Call hooks exclusively from React functional components or Custom Hooks (functions starting with `use`). Do not call hooks from standard vanilla JavaScript utility functions.

### (2) Reality Metaphor

Imagine passengers boarding an airplane by assigned seat sequence.

- **Compliant Execution (Fixed Boarding Sequence):** Passenger 1 enters Seat 1A, Passenger 2 enters Seat 1B, Passenger 3 enters Seat 1C. Flight attendants check tickets in exact sequential order: `[1A, 1B, 1C]`.
- **Rule Violation (Conditional Boarding Jump):** Passenger 2 (Seat 1B) skips boarding because they were getting coffee. Flight attendant checks ticket for the second person in line (Passenger 3) and forces them into Seat 1B. Passenger 3 ends up in the wrong seat, passenger tickets mismatch seat assignments, and airplane seating falls into chaos (**state corruption crash**).

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useState, useEffect } from 'react';

function CompliantComponent({ userId }) {
  // ✅ Rule 1: Declared unconditionally at the top level
  const [user, setUser] = useState(null);

  useEffect(() => {
    // ✅ Rule 1: Condition placed INSIDE effect, not around hook
    if (userId) {
      fetch(`/api/users/${userId}`).then(res => res.json()).then(setUser);
    }
  }, [userId]);

  return <div>User: {user ? user.name : 'No ID'}</div>;
}
```

#### Fuller Example

```jsx
import React, { useState, useEffect } from 'react';

// Custom Hook complying with Rule 2 (Starts with 'use')
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

function ResponsiveDashboard({ isLoggedIn }) {
  // ✅ Rule 1: Unconditional top-level declarations
  const [metrics, setMetrics] = useState([]);
  const width = useWindowWidth();

  useEffect(() => {
    // ✅ Conditions belong inside effects, keeping hook call count identical on every render
    if (!isLoggedIn) return;

    fetch('/api/metrics')
      .then(res => res.json())
      .then(setMetrics);
  }, [isLoggedIn]);

  return (
    <div>
      <h4>Screen Width: {width}px</h4>
      {isLoggedIn ? <p>Metrics count: {metrics.length}</p> : <p>Please log in.</p>}
    </div>
  );
}

export default ResponsiveDashboard;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Calling Hooks Inside Conditional `if` Statements

**The mistake:** Wrapping `useState` or `useEffect` inside an `if` block to save memory or conditionally fetch data.

**Why it's wrong:** Changing the condition shifts hook call positions between renders, causing fatal React runtime error `Rendered fewer hooks than expected`.

*Incorrect:*
```jsx
function Profile({ id }) {
  if (id) {
    useEffect(() => { fetchUser(id); }, [id]); // ❌ Fatal: Conditional hook call!
  }
}
```

*Fix:*
```jsx
function Profile({ id }) {
  useEffect(() => {
    if (!id) return; // ✅ Condition placed INSIDE effect callback
    fetchUser(id);
  }, [id]);
}
```

### Mistake 2: Calling Hooks Inside Loops (`map`, `for`)

**The mistake:** Calling `useId()` or `useState()` inside an array mapping callback to generate item keys.

**Why it's wrong:** If array length changes between renders, the total number of hook calls changes, corrupting Fiber's hook list.

*Incorrect:*
```jsx
items.map(item => {
  const id = useId(); // ❌ Fatal: Hook call inside loop!
  return <li key={id}>{item.name}</li>;
});
```

*Fix:*
```jsx
// Pass item.id directly from data payload
items.map(item => <li key={item.id}>{item.name}</li>);
```

### Mistake 3: Calling Hooks Inside Standard Utility Functions

**The mistake:** Calling `useState` inside a helper utility function named `function calculateTax()`.

**Why it's wrong:** Hooks require React Fiber component context. Calling hooks in standard non-component functions throws runtime exceptions.

*Incorrect:*
```jsx
function calculateTax() {
  const [rate] = useState(0.15); // ❌ Hook outside component or custom hook!
  return rate * 100;
}
```

*Fix:*
```jsx
function useTaxCalculator() { // ✅ Custom hook with 'use' prefix
  const [rate] = useState(0.15);
  return rate * 100;
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Dashboard Conditional Refactor

**Scenario:** An IoT console contains a bug where `useSensorData` is called conditionally when `isOnline` is true. Refactor to comply with Rules of Hooks.

**Requirements:**
1. Move hook calls to the top level unconditionally.
2. Handle offline condition inside render or effect logic.
3. Maintain zero runtime hook order warnings.
4. Render sensor readings safely.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function IoTDashboard({ isOnline, sensorId }) {
>   // ✅ Unconditional top-level hook declaration
>   const [reading, setReading] = useState(null);
> 
>   useEffect(() => {
>     // Condition handled inside effect
>     if (!isOnline || !sensorId) return;
> 
>     const interval = setInterval(() => {
>       setReading(+(Math.random() * 50).toFixed(1));
>     }, 1000);
> 
>     return () => clearInterval(interval);
>   }, [isOnline, sensorId]);
> 
>   if (!isOnline) return <div>Device Offline</div>;
> 
>   return <div>Sensor {sensorId} Reading: {reading ?? 'Connecting...'}</div>;
> }
> ```
>
> #### Technical Explanation
> 1. **Top-Level Guarantee**: Hook calls execute unconditionally on every render pass.
> 2. **Internal Guard**: `if (!isOnline)` early exit keeps hook counts stable.
> 3. **Call Order Preservation**: Preserves Fiber's internal hook index array.
> 4. **Safe Render Handling**: JSX conditional branches handle UI presentation cleanly.
> 
### Exercise 2: Financial Order Pad Array Mapping Refactor

**Scenario:** A stock order entry pad attempts to call `useRef` inside a `.map()` loop to reference row inputs. Refactor code to store refs in a single array ref at the top level.

**Requirements:**
1. Remove `useRef` calls from array `.map()` loop callbacks.
2. Declare a single `useRef([])` container at top level.
3. Bind item index refs dynamically in JSX `ref` callbacks.
4. Render input grid cleanly.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useRef } from 'react';
> 
> export function StockOrderGrid({ stocks }) {
>   // ✅ Single top-level ref container for array items
>   const inputRefs = useRef([]);
> 
>   const handleFocusRow = (index) => {
>     inputRefs.current[index]?.focus();
>   };
> 
>   return (
>     <div>
>       {stocks.map((stock, idx) => (
>         <div key={stock.symbol}>
>           <span>{stock.symbol}: </span>
>           <input
>             ref={el => inputRefs.current[idx] = el}
>             placeholder="Quantity"
>           />
>           <button onClick={() => handleFocusRow(idx)}>Focus</button>
>         </div>
>       ))}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Loop Elimination**: Eliminates hook invocations from callback loops completely.
> 2. **Ref Array Mapping**: `ref={el => ...}` callback pattern populates array elements safely.
> 3. **Compliance Assurance**: Hook count stays fixed regardless of array length changes.
> 4. **Imperative Focus Access**: Preserves direct DOM node access functionality.
> 
### Exercise 3: E-Commerce Custom Hook Prefix Refactor

**Scenario:** An e-commerce cart utility function `function syncCart()` contains `useState` and `useEffect` calls without the `use` prefix. Refactor into a compliant Custom Hook.

**Requirements:**
1. Rename function to `useCartSync`.
2. Keep `useState` and `useEffect` hook calls.
3. Return cart state and synchronization status.
4. Verify ESLint plugin compliance.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import { useState, useEffect } from 'react';
> 
> // ✅ Renamed to useCartSync complying with Rule 2
> export function useCartSync(cartItems) {
>   const [syncStatus, setSyncStatus] = useState('Synced');
> 
>   useEffect(() => {
>     setSyncStatus('Syncing...');
>     const timer = setTimeout(() => {
>       localStorage.setItem('ecommerce_cart', JSON.stringify(cartItems));
>       setSyncStatus('Synced');
>     }, 500);
> 
>     return () => clearTimeout(timer);
>   }, [cartItems]);
> 
>   return syncStatus;
> }
> ```
>
> #### Technical Explanation
> 1. **Naming Convention Compliance**: `use` prefix signals React linter tools to enforce rules.
> 2. **Fiber Integration**: Connects function directly into component hook lifecycle contexts.
> 3. **Encapsulated Sync**: Manages local state and side effects cleanly.
> 4. **Reusability**: Hook can be consumed across any UI component.
> 
---

## 6. Related Terms

- [Custom Hooks](custom_hooks.md) — Custom functions governed by the Rules of Hooks.
- [Components](../level_01/components.md) — Functional components where hooks belong.
- [`useState` Hook](../level_02/use_state.md) — Core hook relying on call order mapping.
- [`useId` Hook](use_id.md) — Hook governed by top-level execution rules.

---

## 7. Key Takeaways

- **Rule 1:** Only call Hooks at the Top Level (never inside loops, conditions, or nested callbacks).
- **Rule 2:** Only call Hooks from React Functional Components or Custom Hooks (`use` prefix).
- React tracks hook state by strict **call execution order** between render passes.
- Violating rules alters hook call sequences, causing state corruption runtime crashes.
- Use `eslint-plugin-react-hooks` to automatically catch rule violations during development.
```
