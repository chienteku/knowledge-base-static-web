# Cleanup Functions

> **Level 3 — Component Lifecycle & Effects**
> A function returned by a `useEffect` that React executes right before the component is destroyed (Unmounting), preventing memory leaks.

---

## 1. Prerequisites
- [`useEffect` Hook](use_effect.md) — You return the cleanup function from inside `useEffect`.
- [Component Lifecycle](component_lifecycle.md) — Cleanup happens during the "Unmounting" phase.
---

## 2. Term Category
- **React Mechanic / Hook Configuration**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine a `ChatRoom` component. When it Mounts, it opens a WebSocket connection to the server. 
The user clicks "Home", and the `ChatRoom` component is destroyed (Unmounted). 
However, **the WebSocket connection is still open in the background!** If the user navigates back to the Chat Room, a *second* connection opens. Eventually, the browser has 50 hidden connections open and crashes.
React needs a way to let you clean up your mess before the component dies.

### (2) How to write a Cleanup Function
To create a cleanup function, you simply `return` a function from inside your `useEffect`.
```javascript
useEffect(() => {
  // 1. MOUNTING: Open the connection
  const connection = chatAPI.subscribe(roomId);

  // 2. UNMOUNTING: The function we return here is the Cleanup!
  return () => {
    connection.unsubscribe(); // Closes the connection safely.
  };
}, [roomId]);
```
React will automatically execute that returned function the exact millisecond before the component is removed from the screen.

### (3) The "Before Next Render" Rule
Cleanup functions don't just run on Unmount (Death). They also run right before the *next* effect executes! 
If `roomId` changes from "General" to "Gaming", React will:
1. Run the cleanup for "General" (unsubscribe).
2. Run the effect for "Gaming" (subscribe).
This prevents you from being subscribed to two rooms at the same time.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Returning a Promise instead of a Cleanup Function

**The mistake:** A developer makes their `useEffect` an `async` function so they can use `await fetch()`.
```javascript
// FATAL ERROR!
useEffect(async () => {
  const data = await fetch('/api');
}, []);
```

**Why it's wrong:** An `async` function implicitly returns a **Promise**. But React strictly expects `useEffect` to return either `undefined` OR a **Cleanup Function**. If it receives a Promise, React panics and throws an error!
**Golden Rule:** NEVER make `useEffect` an async function. If you need to use `await`, create an async function *inside* the effect, and call it normally.

---



### Mistake 2: Omitting Cleanup Functions in `useEffect` for Event Listeners or Subscriptions

**The mistake:** Attaching `window.addEventListener('resize', handleResize)` in `useEffect` without returning a cleanup function to remove the listener.

**Why it's wrong:** Every time the component mounts or dependencies update, a new window event listener is registered. Failing to remove old event listeners causes memory leaks and duplicate handler executions.

*Incorrect:*
```javascript
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // ❌ Missing cleanup function!
}, []);
```

*Fix:*
```javascript
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### Mistake 3: Confusing Cleanup Function Execution Timing with Unmounting Only

**The mistake:** Assuming cleanup functions execute ONLY when the component unmounts from the DOM.

**Why it's wrong:** Cleanup functions execute BEFORE EVERY re-run of the effect (when dependencies change) AND when the component unmounts.

*Incorrect:*
```javascript
// Assuming cleanup function runs only once on unmount
```

*Fix:*
```javascript
Ensure cleanup logic safely handles frequent re-executions when dependencies update
```

## 6. Practice Exercises

### Exercise 1: The Rogue Timer

**Problem:** You have a component with `useEffect(() => { setInterval(console.log, 1000) }, [])`. The user navigates away from the component, but the console keeps printing! Write the correct cleanup function to fix this.

**Expected output:**
> [!check]- Answer
> ```javascript
> useEffect(() => {
>   const timerId = setInterval(console.log, 1000);
>   
>   // Cleanup function
>   return () => {
>     clearInterval(timerId);
>   };
> }, []);
> ```
> - Store the ID of the interval, and use `clearInterval()`.

---



### Exercise 2: Interval Timer Cleanup in useEffect

**Problem:** Setup `setInterval` timer in `useEffect` and return cleanup function calling `clearInterval`.

**Expected output:**
> [!check]- Answer
> ```text
> useEffect(() => { const id = setInterval(() => { setSeconds(s => s + 1); }, 1000); return () => clearInterval(id); }, []);
> ```
> ```javascript
> useEffect(() => {
>   const id = setInterval(() => {
>     setSeconds(s => s + 1);
>   }, 1000);
>   return () => clearInterval(id);
> }, []);
> ```
>
> **Explanation:** Returning a cleanup function `() => clearInterval(id)` prevents interval timer memory leaks.

---

### Exercise 3: AbortController Cleanup for Fetch

**Problem:** Cancel active `fetch` request on unmount using `AbortController` in `useEffect` cleanup.

**Expected output:**
> [!check]- Answer
> ```text
> useEffect(() => { const controller = new AbortController(); fetch(url, { signal: controller.signal }); return () => controller.abort(); }, [url]);
> ```
> ```javascript
> useEffect(() => {
>   const controller = new AbortController();
>   fetch(url, { signal: controller.signal })
>     .then(res => res.json())
>     .then(setData)
>     .catch(err => {
>       if (err.name !== 'AbortError') setError(err);
>     });
>   return () => controller.abort();
> }, [url]);
> ```
>
> **Explanation:** Calling `controller.abort()` in cleanup cancels pending network requests if dependencies change.

## 7. Related Terms
- [`useEffect` Hook](use_effect.md) — The parent of the cleanup function.
- [Component Lifecycle](component_lifecycle.md) — The Unmounting phase.
- [Data Fetching & Race Conditions](data_fetching_race_conditions.md) — Related concept: Data Fetching & Race Conditions.
- [Side Effects](side_effects.md) — Related concept: Side Effects.
- [Strict Mode](../level_08/strict_mode.md) — Related concept: Strict Mode.
---

## 8. Key Takeaways
- **Cleanup Functions** are returned from inside a `useEffect`.
- They are used to close network connections, clear timers (`clearInterval`), and remove manual DOM event listeners.
- They run right before the component Unmounts, AND right before the effect runs again due to a dependency change.
- Never make `useEffect` an `async` function, because that forces it to return a Promise instead of a proper cleanup function.
