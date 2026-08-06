# State

> **Level 2 — State & Reactivity**
> A component's internal memory container holding dynamic data that determines what the component looks like and how it behaves over time.

---

## 1. Prerequisites

- [Components](../level_01/components.md) — The visual functional units that hold internal state memory.
- [Props (Properties)](../level_01/props.md) — The external read-only counterpart to internal state.

---

## 2. Term Category

**Core Hook (state container)**: State is a core React architectural concept representing a component's internal, encapsulated memory. Unlike props—which are passed into a component from its parent and are strictly read-only—state is declared, owned, and managed directly within the component function using hooks (`useState` or `useReducer`).

When a component mutates its state via official React setter functions, React schedules a component re-render, evaluating the component with the new state snapshot values and surgically updating the browser DOM.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If components could only receive props, web pages would be completely static templates. However, modern web applications are highly interactive: modals open and close, search inputs filter list rows, shopping carts accumulate items, and forms track user validation states.

Components need a way to "remember" interactive user actions across time.

React introduced **State** to serve as this local memory:
- **Props are External (Read-Only):** Passed down from parent to child. The child component cannot modify its own incoming props.
- **State is Internal (Mutable via Setters):** Managed inside the component. When state updates via setter functions (`setCount`), React triggers a re-render to synchronize the UI with the updated data.

#### State vs Props Comparison
Understanding the distinction between State and Props is essential in React:

| Property | Props | State |
| :--- | :--- | :--- |
| **Origin** | Passed from parent component | Created inside component (`useState`) |
| **Ownership** | Owned by parent | Owned exclusively by current component |
| **Mutability** | Strictly Read-Only (Immutable) | Mutable via setter function (`setState`) |
| **Purpose** | Configure child component visual/behavior | Track interactive user data & internal memory |

### (2) Reality Metaphor
Imagine a bank account checking card.

- **Props (Customer Account Number & Printed Name):** Printed on the plastic card when issued by the bank (**parent**). You cannot scratch off your name or change your account number on the physical card (**read-only props**).
- **State (Current Checking Balance):** Stored inside the bank's internal ledger system (**component local memory**). When you deposit or withdraw cash (**triggering state setter**), your checking balance value changes, and the digital ATM screen displays an updated balance snapshot on your next transaction receipt (**re-render UI**).

### (3) React Code Examples

#### Short Snippet
```jsx
// Declaring component state using the useState hook
import { useState } from 'react';

function Counter() {
  // count is current state snapshot; setCount is state setter function
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(prev => prev + 1)}>
      Count is: {count}
    </button>
  );
}
```

#### Fuller Example
```jsx
import React, { useState } from 'react';

export default function InteractiveForm() {
  // Multiple independent state variables managing component memory
  const [email, setEmail] = useState('');
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'submitted'

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('submitting');
    
    // Simulated async submission
    setTimeout(() => {
      setStatus('submitted');
    }, 1000);
  };

  if (status === 'submitted') {
    return (
      <div className="alert-success">
        Thank you! Confirmation sent to <strong>{email}</strong>.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h3>Newsletter Signup</h3>
      
      <label>
        Email Address:
        <input 
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          disabled={status === 'submitting'}
          required 
        />
      </label>

      <label>
        <input 
          type="checkbox" 
          checked={subscribeNewsletter} 
          onChange={e => setSubscribeNewsletter(e.target.checked)}
          disabled={status === 'submitting'}
        />
        Subscribe to weekly product updates
      </label>

      <button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Signing Up...' : 'Submit'}
      </button>
    </form>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Regular JavaScript Local Variables for Interactive State

**The mistake:** Declaring `let count = 0` inside a component function and writing `count += 1` inside a click event handler.

**Why it's wrong:** Regular JavaScript local variables are discarded and re-initialized every time a component function executes. Furthermore, mutating local variables does NOT notify React to queue a re-render cycle. The variable value increments in memory, but the browser screen remains frozen.

*Incorrect:*
```jsx
function BadCounter() {
  let count = 0; // ❌ Regular local variable!
  const increment = () => {
    count += 1; // Mutates variable, but React does NOT re-render!
  };
  return <button onClick={increment}>Count: {count}</button>;
}
```

*Fix:*
```jsx
function GoodCounter() {
  const [count, setCount] = useState(0); // ✅ React state memory
  const increment = () => {
    setCount(prev => prev + 1); // Triggers React re-render
  };
  return <button onClick={increment}>Count: {count}</button>;
}
```

### Mistake 2: Mutating State Objects Directly Without Setters

**The mistake:** Writing `user.name = 'Bob'` or `items.push(newItem)` directly on state variables.

**Why it's wrong:** Mutating state objects directly modifies the existing memory reference in-place without triggering React's setter update queue. Because the memory reference remains identical, React skips re-rendering, leaving the UI out of sync.

*Incorrect:*
```jsx
const [user, setUser] = useState({ name: 'Alice', age: 25 });

const handleBirthday = () => {
  // ❌ Direct mutation bypasses React's change detection!
  user.age = 26; 
  setUser(user); 
};
```

*Fix:*
```jsx
const [user, setUser] = useState({ name: 'Alice', age: 25 });

const handleBirthday = () => {
  // ✅ Pass a new object reference to the setter function
  setUser(prev => ({ ...prev, age: prev.age + 1 }));
};
```

### Mistake 3: Storing Server Cache Data in Local Component State Across Pages

**The mistake:** Fetching global user profile data in local component state across 5 separate page views.

**Why it's wrong:** Local component state unmounts when the user navigates away from the view, destroying the cached state and requiring duplicate network fetches. For global server cache management, use dedicated caching libraries like React Query (`@tanstack/react-query`) or global state stores (Zustand).

*Incorrect:*
```jsx
// Storing global user profile data in local state on every individual page
```

*Fix:*
```jsx
// Use React Query (useQuery) or Context for global server cache data
```

---

## 5. Practice Exercises

### Exercise 1: Telemetry Emergency Stop Switch (IoT Telemetry)

**Scenario:** Create a industrial telemetry `EmergencyStop` component that uses local state to manage machine power states (`isEmergencyStopped`, `resetCode`).

**Requirements:**
1. Declare `isStopped` boolean state and `resetPin` input state using `useState`.
2. Render a red STOP button that sets `isStopped = true`.
3. Require entering PIN `'1234'` to reset state back to operational.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function EmergencyStop() {
>   const [isStopped, setIsStopped] = useState(false);
>   const [pin, setPin] = useState('');
>   const [error, setError] = useState('');
> 
>   const handleTriggerStop = () => {
>     setIsStopped(true);
>     setError('');
>   };
> 
>   const handleReset = (e) => {
>     e.preventDefault();
>     if (pin === '1234') {
>       setIsStopped(false);
>       setPin('');
>       setError('');
>     } else {
>       setError('Invalid PIN code!');
>     }
>   };
> 
>   return (
>     <div className={`control-panel ${isStopped ? 'emergency-active' : ''}`}>
>       <h4>Machinery Control Unit</h4>
>       
>       {!isStopped ? (
>         <button className="btn-danger-lg" onClick={handleTriggerStop}>
>           EMERGENCY STOP
>         </button>
>       ) : (
>         <form onSubmit={handleReset} className="reset-box">
>           <p className="alert-text">MACHINE HALTED — ENTER PIN TO RESET</p>
>           <input 
>             type="password" 
>             value={pin} 
>             onChange={e => setPin(e.target.value)} 
>             placeholder="Enter PIN..." 
>           />
>           <button type="submit">Reset System</button>
>           {error && <span className="error">{error}</span>}
>         </form>
>       )}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Component Local Memory**: `isStopped`, `pin`, and `error` represent state owned exclusively by `EmergencyStop`.
> 2. **State-Driven UI**: View markup branches declaratively based on `isStopped` state snapshot values.
> 3. **Controlled Inputs**: The PIN text field binds `value={pin}` and dispatches `setPin` on user input events.
> 4. **Encapsulation**: Machinery state changes remain encapsulated inside the component without mutating global variables.
> 
---

### Exercise 2: Financial Order Ticket Type Selector (Financial Trading)

**Scenario:** A trading ticket allows selecting order type ('MARKET', 'LIMIT', 'STOP') and updating limit price conditionally using React state.

**Requirements:**
1. Create `OrderTypeTicket` component managing `orderType` and `limitPrice` state.
2. Conditionally display limit price input fields ONLY when `orderType === 'LIMIT'`.
3. Provide state setter event handlers.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function OrderTypeTicket() {
>   const [orderType, setOrderType] = useState('MARKET');
>   const [limitPrice, setLimitPrice] = useState(150.00);
> 
>   return (
>     <div className="ticket-card">
>       <h4>Trade Order Settings</h4>
>       
>       <div className="type-buttons">
>         {['MARKET', 'LIMIT', 'STOP'].map(type => (
>           <button 
>             key={type}
>             className={orderType === type ? 'active' : ''} 
>             onClick={() => setOrderType(type)}
>           >
>             {type}
>           </button>
>         ))}
>       </div>
> 
>       {orderType === 'LIMIT' && (
>         <div className="price-input-group">
>           <label>Limit Price ($):</label>
>           <input 
>             type="number" 
>             value={limitPrice} 
>             onChange={e => setLimitPrice(Number(e.target.value))} 
>             step="0.01" 
>           />
>         </div>
>       )}
> 
>       <p>Selected Order: <strong>{orderType}</strong> {orderType === 'LIMIT' ? `@ $${limitPrice}` : ''}</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **State Selection**: `setOrderType(type)` updates state memory, re-rendering active button highlights.
> 2. **Conditional Field Render**: `{orderType === 'LIMIT' && ...}` renders price fields dynamically based on state snapshot values.
> 3. **Numeric Type Conversion**: Input change handlers convert string input values to numbers (`Number(e.target.value)`) before setting state.
> 4. **Render Reactivity**: State updates trigger surgical Virtual DOM diffing to update ticket view elements.
> 
---

### Exercise 3: E-Commerce Product Quantity & Wishlist Toggle (E-Commerce)

**Scenario:** An e-commerce product card tracks quantity selection and wishlist toggle state locally.

**Requirements:**
1. Create `ProductCardActions` managing `quantity` (number) and `isWishlisted` (boolean) state.
2. Implement increment and decrement handlers ensuring quantity does not drop below 1.
3. Toggle wishlist state on heart button clicks.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> export function ProductCardActions({ productId }) {
>   const [quantity, setQuantity] = useState(1);
>   const [isWishlisted, setIsWishlisted] = useState(false);
> 
>   const handleDecrement = () => {
>     setQuantity(prev => Math.max(1, prev - 1));
>   };
> 
>   const handleIncrement = () => {
>     setQuantity(prev => prev + 1);
>   };
> 
>   return (
>     <div className="product-actions">
>       <div className="qty-picker">
>         <button onClick={handleDecrement} disabled={quantity <= 1}>-</button>
>         <span>{quantity}</span>
>         <button onClick={handleIncrement}>+</button>
>       </div>
> 
>       <button 
>         className={`btn-wishlist ${isWishlisted ? 'active' : ''}`}
>         onClick={() => setIsWishlisted(prev => !prev)}
>       >
>         {isWishlisted ? '♥ Saved' : '♡ Add to Wishlist'}
>       </button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Updater Pattern**: `setQuantity(prev => Math.max(1, prev - 1))` uses functional updaters to enforce minimum quantity bounds safely.
> 2. **Boolean State Toggling**: `setIsWishlisted(prev => !prev)` flips boolean state memory seamlessly.
> 3. **Isolated Component Memory**: Multiple `<ProductCardActions />` on a page maintain independent quantity and wishlist states.
> 4. **Declarative View Binding**: Button styles and text representations derive directly from local state snapshots.
> 
---

## 6. Related Terms

- [`useState` Hook](use_state.md) — The official React hook used to declare and update state memory.
- [Props (Properties)](../level_01/props.md) — Read-only counterpart to internal state memory.
- [Re-rendering](re_rendering.md) — The component execution phase triggered when state updates.
- [Derived State](derived_state.md) — Values calculated dynamically on-the-fly from state memory.

---

## 7. Key Takeaways

- **State** is a component's internal memory container holding dynamic data across re-renders.
- Unlike Props (passed read-only from parents), State is created and managed directly by the component.
- Updating state via setter functions (`setCount`) notifies React to queue a component re-render.
- Never use regular JavaScript local variables for data that needs to update the screen.
- Never mutate state objects directly; pass new object references using setter functions (`setScore(prev => prev + 1)`).
