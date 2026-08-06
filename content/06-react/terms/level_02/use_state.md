# `useState` Hook

> **Level 2 — State & Reactivity**
> The foundational React Hook that allows functional components to declare local state memory variables and trigger UI re-renders upon updates.

---

## 1. Prerequisites

- [State](state.md) — The fundamental memory concept implemented by the `useState` hook.

---

## 2. Term Category

**Core Hook (state management primitive)**: `useState` is the fundamental state management React Hook. Introduced in React 16.8, `useState` allows functional components to attach state memory directly to React's internal Fiber node engine.

When invoked, `useState` returns a tuple containing the current state value snapshot and a state setter function. Calling the setter function queues an asynchronous state update, notifying React's reconciliation engine to trigger a component re-render with the updated value snapshot.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Before React 16.8 (released in 2019), functional components were "stateless" functions. They could only receive props and return JSX. If a component needed local memory (such as tracking form inputs or modal toggles), developers were forced to convert the component into a verbose ES6 Class component:

```javascript
// Legacy Class Component (Pre-Hooks)
class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
    this.handleClick = this.handleClick.bind(this);
  }
  // ...
}
```

Class components required managing `this` binding, constructor boilerplate, and complex lifecycle methods.

React introduced **Hooks**—and specifically `useState`—to allow functional components to hook directly into React's state engine. `useState` replaced Class state with clean, destructured function signatures while enabling functional components to retain state memory across re-renders.

### (2) Reality Metaphor
Imagine a personal digital notepad attached to a workbench desk.

- **Without `useState` (Regular Local Variable):** Every morning, a cleaner comes in and sweeps off the workbench completely (**component re-render**). If you write a tally mark on a piece of scrap paper (`let count = 0; count++`), the cleaner throws it in the trash at the end of the shift. You lose your tally memory every time.
- **With `useState` (Digital Storage Device):** You plug a permanent USB flash drive (`useState`) into a dedicated port on the workbench frame. Every time you push a button to update a tally, the device increments the tally count safely in solid-state memory. When the cleaner sweeps the desk surface, your flash drive remains plugged into the frame, preserving your exact count snapshot across shifts.

### (3) React Code Examples

#### Short Snippet
```jsx
import { useState } from 'react';

function SimpleCounter() {
  // Destructuring array tuple: [currentValue, setterFunction]
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(prev => prev + 1)}>
      Clicked {count} times
    </button>
  );
}
```

#### Fuller Example
```jsx
import React, { useState } from 'react';

export default function UserRegistrationForm() {
  // 1. Primitive state declarations
  const [username, setUsername] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // 2. Lazy initial state initialization for heavy data reads
  const [savedPreference, setSavedPreference] = useState(() => {
    const cached = localStorage.getItem('user_pref');
    return cached ? JSON.parse(cached) : { theme: 'dark' };
  });

  // 3. Object state management using functional updater
  const [formData, setFormData] = useState({ email: '', role: 'User' });

  const handleEmailChange = (e) => {
    const value = e.target.value;
    // Functional updater pattern ensures fresh state snapshot
    setFormData(prev => ({ ...prev, email: value }));
  };

  return (
    <div className="registration-card">
      <h3>User Registration</h3>

      <label>
        Username:
        <input value={username} onChange={e => setUsername(e.target.value)} />
      </label>

      <label>
        Email:
        <input value={formData.email} onChange={handleEmailChange} />
      </label>

      <label>
        <input 
          type="checkbox" 
          checked={agreeTerms} 
          onChange={e => setAgreeTerms(e.target.checked)} 
        />
        I agree to Terms & Conditions
      </label>

      <div className="summary">
        <p>Registering as: {username || 'Anonymous'} ({formData.email})</p>
      </div>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Treating `setState` Updates as Synchronous Execution

**The mistake:** Calling `setScore(100)` and trying to `console.log(score)` on the very next line expecting `100`.

**Why it's wrong:** State updates in React are **Asynchronous / Batched**. Calling `setScore(100)` queues an update for the *next* render cycle. The local variable `score` remains a constant snapshot representing the *current* render. The `console.log` will print the old score.

*Incorrect:*
```jsx
const [score, setScore] = useState(0);

const handleWin = () => {
  setScore(100);
  // ❌ Logs 0, NOT 100!
  console.log(score); 
};
```

*Fix:*
```jsx
const [score, setScore] = useState(0);

const handleWin = () => {
  const nextScore = 100;
  setScore(nextScore);
  // ✅ Log local variable for immediate logic
  console.log(nextScore); 
};
```

### Mistake 2: Invoking Setters Rapidly Without Functional Updaters

**The mistake:** Calling `setCount(count + 1); setCount(count + 1); setCount(count + 1);` expecting `count` to increment by 3.

**Why it's wrong:** `count` is a constant snapshot within the current render frame. All three calls evaluate to `setCount(0 + 1)`, incrementing count by ONLY 1. Use functional updaters (`setCount(prev => prev + 1)`).

*Incorrect:*
```jsx
const handleTripleIncrement = () => {
  // ❌ All 3 evaluate to setCount(0 + 1)! Total increment is only 1!
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
};
```

*Fix:*
```jsx
const handleTripleIncrement = () => {
  // ✅ Functional updaters queue sequential updates against latest queued state
  setCount(prev => prev + 1);
  setCount(prev => prev + 1);
  setCount(prev => prev + 1);
};
```

### Mistake 3: Executing Heavy Calculations Directly in `useState(heavyCalculation())`

**The mistake:** Writing `const [data, setData] = useState(parseHeavyJSON())`.

**Why it's wrong:** Passing a function call directly into `useState(...)` executes the heavy calculation function on EVERY single component re-render, even though React uses the initial value only on mount. Pass a function reference (`useState(() => parseHeavyJSON())`) for lazy initialization.

*Incorrect:*
```jsx
// ❌ Executes parseHeavyJSON() on EVERY component re-render!
const [data, setData] = useState(parseHeavyJSON());
```

*Fix:*
```jsx
// ✅ Lazy initial state: Function executes ONLY on initial component mount
const [data, setData] = useState(() => parseHeavyJSON());
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Sampler with Lazy State (IoT Telemetry)

**Scenario:** An IoT telemetry reader initializes configuration state lazily from `localStorage` and updates reading counts using functional updaters.

**Requirements:**
1. Initialize `config` state lazily reading `localStorage.getItem('sensor_cfg')`.
2. Manage `sampleCount` state using functional updaters.
3. Provide increment button simulating sensor ticks.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function SensorSampler() {
>   // Lazy initial state: localStorage read occurs ONLY on mount
>   const [config, setConfig] = useState(() => {
>     const saved = localStorage.getItem('sensor_cfg');
>     return saved ? JSON.parse(saved) : { intervalMs: 1000, active: true };
>   });
> 
>   const [sampleCount, setSampleCount] = useState(0);
> 
>   const handleMultiTick = () => {
>     // Functional updaters ensure sequential update queuing
>     setSampleCount(prev => prev + 1);
>     setSampleCount(prev => prev + 1);
>   };
> 
>   return (
>     <div className="sampler-box">
>       <h4>Telemetry Sampler ({config.active ? 'Active' : 'Inactive'})</h4>
>       <p>Interval: {config.intervalMs}ms | Samples Captured: {sampleCount}</p>
>       <button onClick={handleMultiTick}>Simulate Double Tick (+2)</button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Lazy Initialization**: `useState(() => ...)` executes initial `localStorage` parsing only once on initial mount.
> 2. **Functional Updaters**: `setSampleCount(prev => prev + 1)` safely queues sequential increments without snapshot race conditions.
> 3. **Encapsulated Memory**: `sampleCount` persists across component re-renders.
> 4. **State Isolation**: Memory storage attaches directly to the component's Fiber node instance.
> 
---

### Exercise 2: Financial Order Ticket Object Update (Financial Trading)

**Scenario:** A trading ticket component manages an object state `{ symbol, price, quantity, side }` immutably using functional updaters.

**Requirements:**
1. Create `TradingTicket` managing object state.
2. Update `quantity` immutably using spread syntax inside functional updaters.
3. Toggle `side` between 'BUY' and 'SELL'.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function TradingTicket() {
>   const [ticket, setTicket] = useState({
>     symbol: 'AAPL',
>     price: 150.00,
>     quantity: 100,
>     side: 'BUY'
>   });
> 
>   const updateQuantity = (delta) => {
>     setTicket(prev => ({
>       ...prev,
>       quantity: Math.max(1, prev.quantity + delta)
>     }));
>   };
> 
>   const toggleSide = () => {
>     setTicket(prev => ({
>       ...prev,
>       side: prev.side === 'BUY' ? 'SELL' : 'BUY'
>     }));
>   };
> 
>   return (
>     <div className="ticket-card">
>       <h4>Order: {ticket.side} {ticket.quantity} {ticket.symbol} @ ${ticket.price}</h4>
>       <button onClick={() => updateQuantity(10)}>+10 Qty</button>
>       <button onClick={() => updateQuantity(-10)}>-10 Qty</button>
>       <button onClick={toggleSide}>Switch to {ticket.side === 'BUY' ? 'SELL' : 'BUY'}</button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Object State Management**: State holds a multi-property object representing ticket state.
> 2. **Immutable Spread**: `({ ...prev, quantity: ... })` produces a new object reference to trigger re-renders.
> 3. **Functional Updater Protection**: Prevents race conditions during rapid user button clicks.
> 4. **Derived Text Evaluation**: View text formats directly from updated `ticket` state snapshot properties.
> 
---

### Exercise 3: E-Commerce Toggle & Multi-Item Cart (E-Commerce)

**Scenario:** An e-commerce product card tracks coupon code input and item list additions using `useState`.

**Requirements:**
1. Manage `coupon` string state and `cart` array state using `useState`.
2. Append new item objects immutably `setCart(prev => [...prev, newItem])`.
3. Clear coupon text on submission.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function ECommerceCart() {
>   const [coupon, setCoupon] = useState('');
>   const [appliedCoupon, setAppliedCoupon] = useState(null);
>   const [items, setItems] = useState([
>     { id: 1, name: 'Wireless Headphones', price: 99 }
>   ]);
> 
>   const handleApplyCoupon = (e) => {
>     e.preventDefault();
>     if (coupon.trim()) {
>       setAppliedCoupon(coupon.toUpperCase());
>       setCoupon('');
>     }
>   };
> 
>   const handleAddAccessory = () => {
>     const newItem = { id: Date.now(), name: 'Carrying Case', price: 15 };
>     setItems(prev => [...prev, newItem]);
>   };
> 
>   return (
>     <div className="cart-card">
>       <h4>Your Cart ({items.length} items)</h4>
>       <ul>
>         {items.map(item => (
>           <li key={item.id}>{item.name} - ${item.price}</li>
>         ))}
>       </ul>
> 
>       <button onClick={handleAddAccessory}>Add Protective Case (+$15)</button>
> 
>       <form onSubmit={handleApplyCoupon} className="coupon-form">
>         <input 
>           value={coupon} 
>           onChange={e => setCoupon(e.target.value)} 
>           placeholder="Enter promo code..." 
>         />
>         <button type="submit">Apply Coupon</button>
>       </form>
> 
>       {appliedCoupon && <p className="success">Applied Code: {appliedCoupon}</p>}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Multiple Hook Instances**: Demonstrates using multiple independent `useState` hooks (`coupon`, `appliedCoupon`, `items`).
> 2. **Immutable Array Appends**: `setItems(prev => [...prev, newItem])` constructs new array instances cleanly.
> 3. **Form Controlled Inputs**: `value={coupon}` and `onChange` provide single-source-of-truth input control.
> 4. **State Cleanup**: `setCoupon('')` clears text input fields upon successful form submission.
> 
---

## 6. Related Terms

- [State](state.md) — The fundamental memory concept implemented by `useState`.
- [Re-rendering](re_rendering.md) — The component execution phase triggered when state setters execute.
- [Automatic Batching](automatic_batching.md) — Performance mechanic grouping multiple state setter calls into a single re-render pass.
- [Immutability](immutability.md) — The architectural rule requiring new object references when calling `useState` setters.

---

## 7. Key Takeaways

- **`useState`** is the fundamental React Hook giving functional components memory across re-renders.
- It returns a 2-element tuple: `const [value, setValue] = useState(initialValue)`.
- Calling the setter function queues an asynchronous state update and notifies React to re-render.
- Always use the functional updater pattern (`setValue(prev => prev + 1)`) when deriving new state from previous state.
- Use lazy initial state (`useState(() => heavyCalc())`) to avoid executing expensive functions on every re-render.
- Setters do NOT update local variables synchronously; new values are available on the next render frame.
