# `useRef` Hook

> **Level 4 — Advanced Hooks**
> A hook that allows a component to "remember" a piece of data without triggering a Re-render when that data changes.

---

## 1. Prerequisites
- [`useState` Hook](../level_02/use_state.md) — `useRef` is the "silent" cousin of `useState`.
- [Re-rendering](../level_02/re_rendering.md) — What `useRef` intentionally avoids.

---

## 2. Term Category
- **Core React Hook**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes you need a component to remember something, but changing that memory shouldn't force the screen to update. 
For example, you want to track how many times a user clicks a button, but you *don't* want to display that number on the screen. If you use `useState`, every click triggers a Re-render, wasting performance.
React gives us **`useRef`**. It is an "escape hatch" that holds mutable data silently.

### (2) The `.current` Property
When you call `useRef(initialValue)`, it returns an object with a single property: `{ current: initialValue }`.
```javascript
import { useRef } from 'react';

function Timer() {
  const clickCount = useRef(0);

  function handleClick() {
    // We mutate the .current property directly!
    clickCount.current = clickCount.current + 1; 
    console.log(`Clicked ${clickCount.current} times`);
  }

  return <button onClick={handleClick}>Click Me (Silently)</button>;
}
```
Notice we mutate `.current` directly! `useRef` ignores the rule of Immutability because it does not trigger re-renders.

### (3) The Second Superpower: DOM Access
`useRef` has a secondary, highly common use case: grabbing a direct reference to a real HTML element.
If you need to automatically focus an input field when a page loads, you cannot use Declarative state. You need the Imperative DOM method `.focus()`.
```javascript
function Search() {
  const inputRef = useRef(null);

  useEffect(() => {
    // 2. We can now imperatively command the real DOM node!
    inputRef.current.focus();
  }, []);

  // 1. We attach the ref to the JSX element
  return <input ref={inputRef} type="text" />;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to render a Ref on the screen

**The mistake:** A developer uses a ref to track a score, and tries to display it: `<div>Score: {scoreRef.current}</div>`.

**Why it's wrong:** `useRef` does NOT trigger a re-render! If the score goes from 0 to 1, the UI will still say 0, because React was never told to update the screen. 
**Golden Rule:** If a piece of data is rendered visually in the JSX, it MUST be `useState`. Only use `useRef` for background data or direct DOM manipulation.

---



### Mistake 2: Reading or Writing `ref.current` Directly inside Component Render Functions

**The mistake:** Writing `ref.current = count + 1` or reading `ref.current` directly in the component render body.

**Why it's wrong:** Reading or writing `ref.current` during render makes rendering impure and breaks Concurrent rendering! Read or write `ref.current` ONLY inside `useEffect` or event handlers.

*Incorrect:*
```javascript
function App() {
  const renderCount = useRef(0);
  renderCount.current += 1; // ❌ Impure mutation during render!
  return <div>Renders: {renderCount.current}</div>;
}
```

*Fix:*
```javascript
function App() {
  const renderCount = useRef(0);
  useEffect(() => { renderCount.current += 1; }); // Safe mutation inside useEffect
  return <div>Count</div>;
}
```

### Mistake 3: Expecting `ref.current` Mutations to Trigger Component Re-Renders

**The mistake:** Writing `ref.current = 'new value';` expecting the UI to update on screen.

**Why it's wrong:** Mutating `ref.current` is a plain JavaScript object property assignment! It DOES NOT notify React to queue a re-render. Use `useState` if UI must update on state change.

*Incorrect:*
```javascript
const textRef = useRef('Initial');
const handleClick = () => { textRef.current = 'Updated'; }; // ❌ No UI update!
```

*Fix:*
```javascript
const [text, setText] = useState('Initial');
const handleClick = () => { setText('Updated'); };
```

## 6. Practice Exercises

### Exercise 1: State vs Ref

**Problem:** You are building a Stopwatch component. You have two variables: 
1. `timeElapsed`: The number of seconds passed (displayed on the screen as `00:15`).
2. `intervalId`: The background ID of the `setInterval` timer, needed so you can clear the timer later.
Which one should use `useState`, and which should use `useRef`?

**Expected output:**
> [!check]- Answer
> ```text
> `timeElapsed` MUST be `useState`, because it is displayed on the screen and requires re-renders.
> `intervalId` MUST be `useRef`, because it is a background variable. If you used state, setting the ID would cause an unnecessary, invisible re-render!
> ```
> - Is the data visible to the user?

---



### Exercise 2: Focusing Input with useRef

**Problem:** Create component with `<input>` and button focusing input on click using `useRef`.

**Expected output:**
> [!check]- Answer
> ```text
> function FocusInput() { const inputRef = useRef(null); const handleClick = () => inputRef.current.focus(); return <> <input ref={inputRef} /> <button onClick={handleClick}>Focus</button> <>; }
> ```
> ```javascript
> function FocusInput() {
>   const inputRef = useRef(null);
>   const handleClick = () => inputRef.current.focus();
>   return (
>     <>
>       <input ref={inputRef} />
>       <button onClick={handleClick}>Focus</button>
>     </>
>   );
> }
> ```
>
> **Explanation:** `useRef` holds direct references to browser DOM elements.

---

### Exercise 3: useRef vs useState Comparison

**Problem:** Compare: `useState` (Triggers re-render on state change); `useRef` (Persists mutable data across renders WITHOUT triggering re-renders).

**Expected output:**
> [!check]- Answer
> ```text
> useState: triggers re-render on change; useRef: persists mutable value without re-rendering
> ```
> ```text
> useState: triggers re-render on change; useRef: persists mutable value without re-rendering
> ```
>
> **Explanation:** `useRef` acts as a hidden box holding mutable JavaScript values across renders.

## 7. Related Terms
- [`useState` Hook](../level_02/use_state.md) — The loud, re-rendering alternative to `useRef`.
- [Declarative Programming](../level_01/declarative_programming.md) — `useRef` is your escape hatch when you actually *need* to do something Imperative to the DOM.
- [`useLayoutEffect` Hook](../level_03/use_layout_effect.md) — Related concept: `useLayoutEffect` Hook.
- [`forwardRef` & `useImperativeHandle`](forward_ref.md) — Related concept: `forwardRef` & `useImperativeHandle`.
- [Uncontrolled Components](../level_05/uncontrolled_components.md) — Related concept: Uncontrolled Components.

---

## 8. Key Takeaways
- **`useRef`** holds mutable data that persists across renders, but changing it does NOT trigger a re-render.
- The data is always stored inside the `.current` property of the returned object.
- You are allowed to mutate `.current` directly.
- It is heavily used for two things: Storing background variables (like timer IDs), and gaining direct imperative access to real DOM nodes (like focusing an input).
