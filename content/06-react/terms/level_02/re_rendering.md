# Re-rendering

> **Level 2 — State & Reactivity**
> The process where React executes a component's function again to generate a brand new Virtual DOM snapshot because its underlying data has changed.

---

## 1. Prerequisites
- [Virtual DOM](../level_01/virtual_dom.md) — Re-rendering is the process of generating a new Virtual DOM.
- [State](../level_02/state.md) — Changing state is the primary trigger for a re-render.

---

## 2. Term Category
- **Rendering Mechanic / Core Architecture**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
React operates on the principle that `UI = f(state)`. The UI is a projection of the state.
If the state changes, the UI on the screen is suddenly out of sync with the data. React must immediately fix this. 
To do so, React **Re-renders** the component. It literally calls the JavaScript function that defines your component a second time. The function runs from top to bottom, but this time, the state variables have new values, resulting in a different UI being returned.

### (2) The Three Triggers
A component will *only* re-render if one of these three things happens:
1. **Its internal State changes** (e.g., calling `setCount(1)`).
2. **Its Props change** (The parent passed down new data).
3. **Its Parent component re-renders** (By default, if a parent re-renders, it mercilessly forces every single one of its children to re-render, too!).

### (3) The Waterfall Effect
Because a parent re-rendering forces its children to re-render, React updates flow downwards like a waterfall. 
If the top-level `<App />` component updates its state, React will re-render `<App />`, which forces `<Navbar />` and `<Main />` to re-render, which forces all their children to re-render. 
*(Note: React is so fast that re-rendering 1,000 components usually takes less than 2 milliseconds, but optimizing this is a major part of advanced React).*

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: The Infinite Loop

**The mistake:** A developer wants to fetch data from an API and save it in state. They write this:
```javascript
function App() {
  const [data, setData] = useState(null);
  
  // They call fetch directly inside the component body
  fetch('/api/data').then(res => setData(res)); 
  
  return <div>{data}</div>;
}
```

**Why it's wrong:**
1. The component renders.
2. It hits the `fetch` and calls `setData()`.
3. `setData` changes the state.
4. Changing state triggers a **Re-render**!
5. The component renders again. It hits the `fetch` again. It calls `setData` again. Re-render again. 
This is an infinite loop that will crash the browser in 2 seconds.
**Golden Rule:** NEVER update state directly in the main body of a component. State updates must be placed inside Event Handlers (like `onClick`) or inside `useEffect`.

---



### Mistake 2: Assuming Child Components Only Re-Render When Their Props Change

**The mistake:** Expecting child `<Child />` to skip re-rendering when parent `<Parent />` updates internal state.

**Why it's wrong:** By default in React, when a parent component re-renders, ALL of its child components re-render recursively regardless of whether their props changed! Use `React.memo` to skip un-necessary child re-renders.

*Incorrect:*
```javascript
// Expecting <Child /> to skip rendering when Parent state updates
```

*Fix:*
```javascript
const Child = React.memo(function Child() { ... }); // Memoize child component
```

### Mistake 3: Passing Inline Object Literals or Inline Arrow Functions as Props to Memoized Children

**The mistake:** Passing `<MemoizedChild style={{ color: 'red' }} onClick={() => doSomething()} />`.

**Why it's wrong:** Inline object literals `{}` and arrow functions `() => {}` create NEW memory references on every parent render! `React.memo` detects changed prop references and re-renders the child anyway. Use `useMemo` and `useCallback`.

*Incorrect:*
```javascript
<MemoChild options={{ theme: 'dark' }} /> // ❌ Creates new object reference every render!
```

*Fix:*
```javascript
const options = useMemo(() => ({ theme: 'dark' }), []);
<MemoChild options={options} />
```

## 6. Practice Exercises

### Exercise 1: The Invisible Update

**Problem:** A component has a prop `name="Alice"`. The parent changes the prop to `name="Alice"`. Does the child component re-render?

**Expected output:**
```text
Yes! Even though the value didn't visually change, if the Parent component re-rendered to send that prop, the Child is forced to re-render. (Unless you wrap the child in `React.memo`!).
```

> [!check]- Answer
> - Remember the third trigger of a re-render.

---



### Exercise 2: 3 Triggers of Component Re-Renders

**Problem:** List 3 events that trigger a React component re-render (1. State update via `setState`; 2. Parent component re-renders; 3. Custom Hook state changes).

**Expected output:**
```text
1. State update via setState; 2. Parent component re-renders; 3. Hook state changes
```

> [!check]- Answer
> ```text
> 1. State update via setState; 2. Parent component re-renders; 3. Hook state changes
> ```
>
> **Explanation:** Component re-renders execute when local state mutates or parent trees re-render.

### Exercise 3: Preventing Un-Necessary Re-Renders via Component Composition

**Problem:** How can passing heavy child trees as `children` prop prevent parent re-render cascades? (Children passed as props are evaluated in parent scope and don't re-render when wrapper state changes).

**Expected output:**
```text
Children passed as props don't re-render when wrapper component state changes
```

> [!check]- Answer
> ```javascript
> function ScrollWrapper({ children }) {
>   const [pos, setPos] = useState(0);
>   return <div onScroll={e => setPos(e.target.scrollTop)}>{children}</div>;
> }
> ```
>
> **Explanation:** Moving state down or lifting static UI content to `children` props isolates re-render boundaries.

## 7. Related Terms
- [React.memo](../level_08/react_memo.md) — How you stop the waterfall effect and prevent unnecessary re-renders.
- [Virtual DOM](../level_01/virtual_dom.md) — What React actually generates during a re-render.

---

## 8. Key Takeaways
- **Re-rendering** is React calling your component function again to get an updated UI snapshot.
- It is triggered by 3 things: State changes, Prop changes, or a Parent re-rendering.
- Updating state in the main body of a component causes an Infinite Loop of re-renders.
