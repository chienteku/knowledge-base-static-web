# Stale Closures

> **Level 3 — Component Lifecycle & Effects**
> A bug where an asynchronous callback or effect captures outdated variable snapshots from an earlier render scope.

---

## 1. Prerequisites

- [`useEffect` Hook](use_effect.md) — The hook where stale closure bugs frequently manifest.
- [Dependency Array](dependency_array.md) — The watchlist mechanism used to refresh captured closure scopes.

---

## 2. Term Category

**Rendering Mechanic (closure scope engine)**: In JavaScript, a closure is a function that retains access to variables declared in its outer scope frame. Because React functional components re-execute on every render pass, state and prop variables are recreated as immutable snapshots specific to that render frame.

A **Stale Closure** occurs when a long-lived function (such as a `setTimeout`, `setInterval`, or `useEffect` callback) captures variable references from an earlier render frame and fails to update its reference scope when newer renders occur. Architecturally, resolving stale closures requires updating dependency arrays, employing state updater functions, or utilizing mutable `useRef` containers.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Functional components execute top-to-bottom on every render.
- Render 1: `count` is `0`. `useEffect` callback closes over `count = 0`.
- Render 2: User increments `count` to `1`. Component re-executes; new `count` snapshot is `1`.

If an effect callback registered on Render 1 is **not refreshed** (for instance, because its dependency array was left empty `[]`), the effect callback continues to execute with the `count = 0` variable snapshot trapped in its closure.

```jsx
// STALE CLOSURE BUG
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1); // Reads trapped count (0) on every interval tick!
  }, 1000);
  return () => clearInterval(timer);
}, []); // Empty array prevents closure refresh!
```
Every second, the interval evaluates `setCount(0 + 1)`. The counter gets stuck at `1` permanently.

To solve this, React developers use two techniques:
1. **Functional State Updaters (`setCount(prev => prev + 1)`):** Bypasses outer closure scopes by receiving the current value directly from React's state queue.
2. **Dependency Refreshing (`[count]`):** Re-instantiates the effect and callback closure on every value update.

### (2) Reality Metaphor

Imagine taking a photograph of a kitchen whiteboard.

- **Current State (The Whiteboard):** You write your shopping list on the whiteboard. You update items daily.
- **Closure Scope (A Printed Photo):** On Monday, you take a photo of the whiteboard showing: *"Buy 1 Gallon of Milk"*.
- **Stale Closure Bug:** On Wednesday, you edit the whiteboard to read: *"Buy 5 Apples"*. On Thursday, you go grocery shopping. Instead of looking at the active whiteboard, you consult Monday's printed photo. You buy milk instead of apples. The photo captured a fixed snapshot of past reality.

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useState, useEffect } from 'react';

function StaleTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // ✅ Functional updater bypasses stale closure scopes
    const id = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []); // Safe empty dependency array

  return <h4>Seconds Elapsed: {seconds}</h4>;
}
```

#### Fuller Example

```jsx
import React, { useState, useEffect, useRef } from 'react';

function ChatNotifier({ activeRoom }) {
  const [messages, setMessages] = useState([]);
  // Ref container holds mutable current reference without triggering re-renders
  const roomRef = useRef(activeRoom);

  // Keep ref synchronized with current prop frame
  useEffect(() => {
    roomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    const socket = fakeChatSystem.connect();

    socket.on('message', (msg) => {
      // ✅ Reading from ref avoids stale room closures in long-lived socket handlers
      console.log(`Received message for room: ${roomRef.current}`);
      setMessages(prev => [...prev, `${roomRef.current}: ${msg}`]);
    });

    return () => {
      socket.disconnect();
    };
  }, []); // Long-lived socket connection initialized once

  return (
    <div>
      <h4>Active Room: {activeRoom}</h4>
      <ul>
        {messages.map((m, i) => <li key={i}>{m}</li>)}
      </ul>
    </div>
  );
}

const fakeChatSystem = {
  connect() {
    return {
      on(event, cb) { setInterval(() => cb('Hello World'), 3000); },
      disconnect() {}
    };
  }
};

export default ChatNotifier;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omitting Referenced Variables from `useCallback` Dependencies

**The mistake:** Creating `const logUser = useCallback(() => console.log(user.name), []);` with an empty dependency array.

**Why it's wrong:** Omitting `user` traps the initial `user` snapshot inside the callback closure. Future invocations print outdated user information.

*Incorrect:*
```jsx
const logUser = useCallback(() => {
  console.log(user.name); // ❌ Trapped stale user snapshot!
}, []);
```

*Fix:*
```jsx
const logUser = useCallback(() => {
  console.log(user.name); // ✅ Refreshes closure when user changes
}, [user]);
```

### Mistake 2: Reading State in `setInterval` Without Functional Updaters

**The mistake:** Writing `setInterval(() => setCount(count + 1), 1000)` inside an effect with `[]` dependencies.

**Why it's wrong:** `count` evaluates to `0` forever inside the interval scope, locking state updates to `0 + 1 = 1`.

*Incorrect:*
```jsx
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000); // ❌ Stale count
  return () => clearInterval(id);
}, []);
```

*Fix:*
```jsx
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000); // ✅ Functional updater
  return () => clearInterval(id);
}, []);
```

### Mistake 3: Stale State References in Event Listeners

**The mistake:** Attaching a window click listener in `useEffect` with `[]` dependencies that reads active `theme` state.

**Why it's wrong:** The window event listener callback captures the initial `theme` value (`'light'`) on mount and never sees subsequent theme toggles.

*Incorrect:*
```jsx
useEffect(() => {
  const handler = () => console.log('Current theme:', theme); // ❌ Trapped theme
  window.addEventListener('click', handler);
  return () => window.removeEventListener('click', handler);
}, []);
```

*Fix:*
```jsx
useEffect(() => {
  const handler = () => console.log('Current theme:', theme);
  window.addEventListener('click', handler);
  return () => window.removeEventListener('click', handler);
}, [theme]); // ✅ Re-binds listener on theme change
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Interval Ingestion Fix

**Scenario:** An IoT sensor dashboard polls battery telemetry every second. The code below gets stuck reporting battery level 99%. Refactor using functional state updaters to eliminate the stale closure.

**Requirements:**
1. Maintain `battery` state starting at 100.
2. Decrement battery by 1 every second using `setInterval`.
3. Use functional update syntax (`setBattery(prev => ...)`).
4. Provide safe interval teardown.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function BatteryTracker() {
>   const [battery, setBattery] = useState(100);
> 
>   useEffect(() => {
>     const id = setInterval(() => {
>       setBattery(prev => (prev > 0 ? prev - 1 : 0));
>     }, 1000);
> 
>     return () => clearInterval(id);
>   }, []);
> 
>   return <div>Battery Level: {battery}%</div>;
> }
> ```
>
> #### Technical Explanation
> 1. **Closure Bypass**: `prev => ...` receives current state directly from React's update queue.
> 2. **Dependency Independence**: The effect does not depend on `battery`, permitting `[]` dependencies.
> 3. **No Re-subscription**: The interval timer persists without tearing down on every tick.
> 4. **Accurate Ingestion**: Decrements reliably down to zero.
> 
### Exercise 2: Financial Trading Alert Threshold Sync

**Scenario:** A stock price alert system triggers notifications when `currentPrice` crosses `targetPrice`. Fix the delayed alert handler so it reads current price data using `useRef`.

**Requirements:**
1. Store `currentPrice` in a `useRef` container.
2. Synchronize ref in a secondary effect.
3. Read `ref.current` inside long-lived alert timers.
4. Eliminate stale price notifications.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect, useRef } from 'react';
> 
> export function StockAlert({ currentPrice, targetPrice }) {
>   const priceRef = useRef(currentPrice);
> 
>   useEffect(() => {
>     priceRef.current = currentPrice;
>   }, [currentPrice]);
> 
>   const handleDelayedCheck = () => {
>     setTimeout(() => {
>       if (priceRef.current >= targetPrice) {
>         alert(`Target reached! Latest price: $${priceRef.current}`);
>       }
>     }, 3000);
>   };
> 
>   return (
>     <div>
>       <p>Current: ${currentPrice} | Target: ${targetPrice}</p>
>       <button onClick={handleDelayedCheck}>Check in 3s</button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Mutable Ref Instance**: `useRef` holds a persistent mutable object across render passes.
> 2. **Ref Syncing**: Updating `priceRef.current` ensures async timers access latest metrics.
> 3. **Closure Safety**: Reading `.current` dynamically avoids capturing stale render frame scalars.
> 4. **No Extra Re-renders**: Mutating refs does not trigger redundant component renders.
> 
### Exercise 3: E-Commerce Auto-Save Shopping Cart Draft

**Scenario:** An e-commerce cart auto-saves item drafts after 5 seconds of inactivity. Fix the auto-save callback so it reads the latest cart items without dropping additions.

**Requirements:**
1. Auto-save cart items to `localStorage`.
2. Ensure timer reads latest `cart` items array.
3. Refresh timeout on `cart` array updates.
4. Clean up pending auto-save timers on component changes.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useEffect } from 'react';
> 
> export function AutoSaveCart() {
>   const [cart, setCart] = useState([]);
> 
>   const addItem = (name) => {
>     setCart(prev => [...prev, { id: Date.now(), name }]);
>   };
> 
>   useEffect(() => {
>     if (cart.length === 0) return;
> 
>     const timer = setTimeout(() => {
>       localStorage.setItem('cart_draft', JSON.stringify(cart));
>       console.log('Saved cart draft:', cart);
>     }, 5000);
> 
>     return () => clearTimeout(timer);
>   }, [cart]);
> 
>   return (
>     <div>
>       <button onClick={() => addItem('Item')}>Add Item</button>
>       <p>Items in cart: {cart.length}</p>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Dependency Refresh**: Including `[cart]` forces the effect to recreate timers with fresh cart snapshots.
> 2. **Debounce Teardown**: `clearTimeout` cancels older pending timers when new items are added.
> 3. **Snapshot Accuracy**: Guarantees `localStorage` receives complete item arrays.
> 4. **Render Alignment**: Synchronizes side effects with reactive state updates.
> 
---

## 6. Related Terms

- [Dependency Array](dependency_array.md) — The watchlist mechanism used to refresh captured closure scopes.
- [`useEffect` Hook](use_effect.md) — The hook where stale closure bugs commonly manifest.
- [`useRef` Hook](../level_04/use_ref.md) — The mutable container hook used to bypass stale closures.
- [`useCallback` Hook](../level_04/use_callback.md) — Performance hook vulnerable to stale closures when dependencies are omitted.

---

## 7. Key Takeaways

- A stale closure occurs when a function scope traps outdated variable snapshots from an earlier render.
- Render variables in React are immutable snapshots unique to each render frame.
- Long-lived callbacks (`setInterval`, `setTimeout`, event listeners) capture the render frame in which they were created.
- Resolve stale closures by adding all referenced reactive variables to dependency arrays.
- Use functional state updaters (`setCount(prev => prev + 1)`) to update state without reading closure variables.
- Use `useRef` containers to store mutable values accessible across long-lived callbacks.
```

---

## File 7: `knowledge-base/06-react/terms/level_03/use_effect.md`

```markdown
