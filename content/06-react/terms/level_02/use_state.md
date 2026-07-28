# `useState` Hook

> **Level 2 — State & Reactivity**
> The most fundamental React Hook. It is the official function provided by React that allows a Functional Component to have state (memory) and trigger re-renders.

---

## 1. Prerequisites
- [State](../level_02/state.md) — You must understand what State is before you use this hook to create it.
- Array Destructuring (ES6 JavaScript)

---

## 2. Term Category
- **Core React Hook**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before 2018, Functional Components were "dumb". They could only receive props and return UI. If you wanted a component to have State, you were forced to write a massive, complex ES6 `class`, dealing with the `this` keyword and constructors.
React 16.8 introduced **Hooks**, which "hook into" React's internal engine. `useState` was the revolutionary hook that allowed simple JavaScript functions to finally have memory!

### (2) How it works
You call `useState()` and pass it the initial starting value. 
It returns an array containing exactly two things:
1. The current value of the state.
2. A specialized function used to update that value.

We use ES6 Array Destructuring to grab both immediately:
```javascript
import { useState } from 'react';

function Counter() {
  // We start the count at 0
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count is: {count}
    </button>
  );
}
```
When the user clicks the button, `setCount(1)` is called. React receives this message, updates the memory to 1, and triggers a **Re-render**. The `Counter` function runs again, but this time `count` equals `1`!

### (3) The Updater Function Pattern
If you are updating state based on the *previous* state (e.g., adding 1 to the current count), it is safer to pass a callback function to the setter instead of a raw value.
**Good:** `setCount(count + 1)`
**Perfect:** `setCount(prevCount => prevCount + 1)`
This guarantees React uses the absolute latest value, even if multiple updates happen rapidly.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Treating `setCount` as Synchronous

**The mistake:** A developer writes code to update the state, and then immediately tries to `console.log` the new value on the very next line:
```javascript
const [score, setScore] = useState(0);

function handleWin() {
  setScore(100);
  console.log(score); // Developer expects to see 100
}
```

**Why it's wrong:** React state updates are **Asynchronous / Batched**! When you call `setScore(100)`, you are just putting an order in React's queue. The `score` variable doesn't actually change until the component Re-renders. The `console.log` will print `0`.
**Golden Rule:** Never expect a state variable to change immediately after calling its setter function. The new value is only available on the *next* render.

---



### Mistake 2: Calling State Setter Multiple Times In Succession Without Functional Updaters

**The mistake:** Calling `setCount(count + 1); setCount(count + 1); setCount(count + 1);` expecting `count` to increase by 3.

**Why it's wrong:** `count` is a constant snapshot within the current render frame! All 3 calls evaluate to `setCount(0 + 1)`, incrementing count by ONLY 1. Use functional updaters `setCount(prev => prev + 1)`.

*Incorrect:*
```javascript
const handleClick = () => {
  setCount(count + 1);
  setCount(count + 1); // ❌ Evaluates to same count snapshot!
};
```

*Fix:*
```javascript
const handleClick = () => {
  setCount(prev => prev + 1);
  setCount(prev => prev + 1); // Functional updaters queue sequential updates
};
```

### Mistake 3: Passing Expensive Function Executions Directly into `useState(expensiveCalculation())`

**The mistake:** Writing `const [data, setData] = useState(parseHeavyJSONFile());`.

**Why it's wrong:** Calling `expensiveCalculation()` directly inside `useState(...)` executes the heavy calculation on EVERY single re-render, even though React uses the result only on initial mount! Pass a initializer function `useState(() => parseHeavyJSONFile())`.

*Incorrect:*
```javascript
const [data, setData] = useState(parseHeavyData()); // ❌ Executes on EVERY render!
```

*Fix:*
```javascript
const [data, setData] = useState(() => parseHeavyData()); // Lazy initial state
```

## 6. Practice Exercises

### Exercise 1: The Toggle

**Problem:** Write a component called `LightSwitch`. It should have a boolean state called `isOn`, starting as `false`. It should return a button. When clicked, it toggles the state. Use the "Updater Function Pattern" (`prev => ...`).

**Expected output:**
> [!check]- Answer
> ```javascript
> import { useState } from 'react';
> 
> function LightSwitch() {
>   const [isOn, setIsOn] = useState(false);
> 
>   return (
>     <button onClick={() => setIsOn(prevIsOn => !prevIsOn)}>
>       {isOn ? 'Turn Off' : 'Turn On'}
>     </button>
>   );
> }
> ```
> - `!prevIsOn` flips `true` to `false` and vice versa.

---



### Exercise 2: Lazy Initial State Initialization

**Problem:** Initialize `items` state lazily reading from `localStorage.getItem('saved_items')`.

**Expected output:**
> [!check]- Answer
> ```text
> const [items, setItems] = useState(() => { const saved = localStorage.getItem('saved_items'); return saved ? JSON.parse(saved) : []; });
> ```
> ```javascript
> const [items, setItems] = useState(() => {
>   const saved = localStorage.getItem('saved_items');
>   return saved ? JSON.parse(saved) : [];
> });
> ```
>
> **Explanation:** Passing a function `() => initialValue` to `useState` executes initialization code ONLY on initial mount.

---

### Exercise 3: Updating Object State with Functional Updaters

**Problem:** Increment `user.score` immutably using functional updater `setUser(prev => ...)`.

**Expected output:**
> [!check]- Answer
> ```text
> setUser(prev => ({ ...prev, score: prev.score + 1 }));
> ```
> ```javascript
> setUser(prev => ({ ...prev, score: prev.score + 1 }));
> ```
>
> **Explanation:** Functional updaters receive the latest state snapshot (`prev`), guaranteeing safe concurrent state mutations.

## 7. Related Terms
- [State](../level_02/state.md) — The concept that `useState` implements.
- [Rules of Hooks](../level_04/rules_of_hooks.md) — Strict rules on where you are allowed to type `useState()`.

---

## 8. Key Takeaways
- **`useState`** gives functional components memory.
- It returns an array with the current value and a setter function: `const [value, setValue] = useState(initial)`.
- Calling the setter function is the primary way to trigger a Re-render in React.
- State updates are asynchronous; the variable does not update immediately on the next line of code.
- Use the updater function pattern (`prev => prev + 1`) when calculating the new state based on the old state.
