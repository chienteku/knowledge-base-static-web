# Side Effects

> **Level 3 — Component Lifecycle & Effects**
> Anything a component does that reaches outside of itself and interacts with the outside world (e.g., fetching data from a server, manually changing the DOM, or setting a timer).

---

## 1. Prerequisites
- [State](../level_02/state.md) — The internal data that should NOT be modified by a side effect directly during a render.
- [Declarative Programming](../level_01/declarative_programming.md) — Side effects are the imperative actions that must be carefully managed.

---

## 2. Term Category
- **React Concept / Functional Programming**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In functional programming, a "Pure Function" is a function that always returns the exact same output for the exact same input, and it does absolutely nothing else. 
React components are supposed to be Pure Functions! If you pass `name="Alice"`, it should return `<div>Alice</div>`. 
However, real web apps need to do "impure" things: they need to talk to databases, set `setTimeout`, and subscribe to WebSockets. Because these actions "affect the outside world," they are called **Side Effects**.

### (2) Why Side Effects are Dangerous
If you put a Side Effect directly in the main body of a component, you will break your app. 
React can re-render a component 10 times in one second. If you have `fetch('/api')` sitting in the middle of your component, React will blast the server with 10 API requests in one second. 
You must separate the "Pure Render" from the "Impure Side Effect".

### (3) The Two Types of Effects
1. **Effects without Cleanup:** Sending an analytics event, making a one-time API call, or changing the `document.title`. Once it runs, it's done.
2. **Effects with Cleanup:** Opening a WebSocket connection, or setting a `setInterval`. If the component disappears from the screen, you MUST close the connection, otherwise it will run forever in the background and cause a memory leak.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Executing Side Effects during Rendering

**The mistake:** A developer wants to change the title of the browser tab. They write `document.title = "Hello"` right above the `return` statement in their component.

**Why it's wrong:** While this *might* work, it violates React's core rule: Rendering must be pure. Changing the document title is reaching outside the component (an effect). If React decides to pause or cancel that render (which happens in advanced React features like Concurrent Mode), your title will be corrupted.
**Golden Rule:** Side effects MUST be placed inside the `useEffect` hook or inside an Event Handler (like `onClick`).

---



### Mistake 2: Placing Side-Effects (e.g. `localStorage.setItem` or HTTP requests) inside Component Render Bodies

**The mistake:** Writing `localStorage.setItem('theme', theme)` directly inside component render code.

**Why it's wrong:** Component render code MUST be pure. Executing side-effects during render causes unexpected duplicate executions under StrictMode or Concurrent rendering. Move side-effects to `useEffect` or event handlers.

*Incorrect:*
```javascript
function App({ theme }) {
  localStorage.setItem('theme', theme); // ❌ Impure side-effect during render!
  return <div>App</div>;
}
```

*Fix:*
```javascript
function App({ theme }) {
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]); // Safe side-effect in useEffect
  return <div>App</div>;
}
```

### Mistake 3: Using `useEffect` for User Event Responses That Belong in Event Handlers

**The mistake:** Setting state `setIsSubmitted(true)` in button `onClick`, then triggering form POST request inside `useEffect` watching `isSubmitted`.

**Why it's wrong:** Effects are for **synchronization with external systems**, NOT user intent event handling! Trigger form submit API requests directly inside the button `onSubmit` / `onClick` event handler.

*Incorrect:*
```javascript
// Triggering API call in useEffect watching isSubmitted boolean
```

*Fix:*
```javascript
const handleSubmit = async () => { await postFormData(); }; // Trigger in event handler
```

## 6. Practice Exercises

### Exercise 1: Pure vs Impure

**Problem:** Which of the following operations are considered "Side Effects" in React?
1. Formatting a user's name to uppercase.
2. Saving data to `localStorage`.
3. Calculating `2 + 2`.
4. Subscribing to a chat room WebSocket.

**Expected output:**
> [!check]- Answer
> ```text
> 2 and 4 are Side Effects. They reach outside the component (talking to the browser's storage and talking to a network server).
> 1 and 3 are Pure operations. They only rely on local data and math.
> ```
> - If it touches the network, the DOM, or the Browser APIs, it's a side effect.
> 
---



### Exercise 2: Categorizing Code: Render vs Side-Effect

**Problem:** Categorize as Render or Side-Effect: 1. `document.title = 'New'` (Side-Effect); 2. `const double = count * 2` (Render); 3. `fetch('/api/data')` (Side-Effect).

**Expected output:**
> [!check]- Answer
> ```text
> 1. Side-Effect, 2. Render, 3. Side-Effect
> ```
> ```text
> 1. Side-Effect, 2. Render, 3. Side-Effect
> ```
>
> **Explanation:** Side-effects touch systems outside React (DOM, storage, network).
> 
---

### Exercise 3: Event Handler vs Effect Placement Rule

**Problem:** Should user-triggered actions (like clicking a Buy button) be handled in event handlers or `useEffect`? (Event handlers).

**Expected output:**
> [!check]- Answer
> ```text
> Event handlers
> ```
> ```text
> Event handlers
> ```
>
> **Explanation:** User event intentions should trigger imperative side-effects directly inside event handlers.
> 
## 7. Related Terms
- [`useEffect` Hook](use_effect.md) — The official tool React gives you to safely execute Side Effects.
- [Cleanup Functions](cleanup_functions.md) — How you manage Side Effects that need to be turned off.
- [Render Purity](../level_01/render_purity.md) — Related concept: Render Purity.
- [Strict Mode](../level_08/strict_mode.md) — Related concept: Strict Mode.
- [`useNavigate` Hook](../level_09/use_navigate.md) — Related concept: `useNavigate` Hook.

---

## 8. Key Takeaways
- A **Side Effect** is any operation that interacts with the outside world (Network, DOM, Timers, Subscriptions).
- React components must be pure during the rendering phase.
- You can NEVER place a side effect directly in the main body of a component.
- Side effects must be relegated to Event Handlers or the `useEffect` hook.
