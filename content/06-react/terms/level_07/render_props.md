# Render Props

> **Level 7 — Component Patterns**
> A technique for sharing code between React components using a prop whose value is a function that returns JSX.

---

## 1. Prerequisites
- [Props (Properties)](../level_01/props.md) — The mechanism being used.
- [Higher-Order Components (HOC)](hoc.md) — The alternative pattern that Render Props competed against before Hooks.

---

## 2. Term Category
React Architecture Pattern

---

## 3. Core Definition
The term "Render Prop" refers to a specific pattern where a component doesn't render its own UI. Instead, it handles all the complex state and logic, and then calls a function passed to it as a prop (often called `render`) to determine what to draw on the screen.

It passes the internal state *into* that function, allowing the parent to decide exactly how the UI should look based on the data.

---

## 4. Key Characteristics / Rules
- **Not strictly named `render`:** While commonly called the `render` prop, you can name the prop anything, or even use the `children` prop as a function.
- **Inversion of Control:** The logic-heavy component controls *when* to render and *what data* to provide, but the parent component controls *how* it looks.

---

## 5. Typical Usage / Common Patterns

### Tracking Mouse Position
```jsx
// The logic component
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  function handleMouseMove(e) {
    setPosition({ x: e.clientX, y: e.clientY });
  }

  return (
    <div style={{ height: '100vh' }} onMouseMove={handleMouseMove}>
      {/* Call the render prop and pass the internal state! */}
      {render(position)}
    </div>
  );
}

// The parent deciding how the UI looks
function App() {
  return (
    <MouseTracker 
      render={(pos) => (
        <h1>The mouse is at: {pos.x}, {pos.y}</h1>
      )} 
    />
  );
}
```

---

## 6. Common Pitfalls
- **Performance Issues:** Because the render prop is often an inline anonymous function, it is recreated on every render of the parent, which can occasionally cause unnecessary re-renders in child components.

---

## 5. Common Mistakes & Pitfalls



### Mistake 1: Creating Inline Render Prop Functions Causing Un-Necessary Child Re-Renders

**The mistake:** Passing `<Mouse render={pos => <Point pos={pos} />} />` without memoization.

**Why it's wrong:** Inline render prop functions `pos => ...` create a new function reference on every render, invalidating child memoization. Wrap render prop functions or use custom hooks.

*Incorrect:*
```javascript
<Mouse render={pos => <Point pos={pos} />} /> // Creates new function reference every render
```

*Fix:*
```javascript
Use Custom Hooks (e.g. useMousePosition()) for cleaner logic sharing
```

### Mistake 2: Confusing Render Props Pattern with `children` Function Props

**The mistake:** Failing to realize `<Mouse>{pos => <Point pos={pos} />}</Mouse>` is an instance of the Render Props pattern.

**Why it's wrong:** Passing a function as the `children` prop (`props.children(data)`) is a valid and common variation of the Render Props pattern.

*Incorrect:*
```javascript
// Thinking render prop requires explicit prop named render
```

*Fix:*
```javascript
Passing a function as children prop is a standard Render Prop implementation
```



### Mistake 3: Nesting Multiple Render Prop Components Causing Callback Pyramid of Doom

**The mistake:** Nesting `<User>{user => <Theme>{theme => <Language>{lang => ...}</Language>}</Theme>}</User>`.

**Why it's wrong:** Nesting multiple render prop components creates deep callback indentation ('Pyramid of Doom'). Use Custom Hooks (`useUser()`, `useTheme()`, `useLanguage()`).

*Incorrect:*
```javascript
// 4-level deep nested render prop callbacks
```

*Fix:*
```javascript
Use custom hooks to unwrap state values sequentially without nesting
```

## 6. Practice Exercises



### Exercise 1: Mouse Tracker Render Prop Component

**Problem:** Create `MouseTracker` component passing `{ x, y }` coordinates to a `render` function prop.

**Expected output:**
> [!check]- Answer
> ```text
> function MouseTracker({ render }) { const [pos, setPos] = useState({ x: 0, y: 0 }); const handleMouseMove = e => setPos({ x: e.clientX, y: e.clientY }); return <div onMouseMove={handleMouseMove}>{render(pos)}</div>; }
> ```
> ```javascript
> function MouseTracker({ render }) {
>   const [pos, setPos] = useState({ x: 0, y: 0 });
>   const handleMouseMove = e => setPos({ x: e.clientX, y: e.clientY });
>   return (
>     <div onMouseMove={handleMouseMove}>
>       {render(pos)}
>     </div>
>   );
> }
> ```
>
> **Explanation:** The Render Props pattern delegates UI rendering to a callback function passed as a prop.

---

### Exercise 2: Render Props vs Custom Hooks Transition

**Problem:** Why have Custom Hooks largely superseded Render Props in modern React? (Custom Hooks share stateful logic without adding nested function callback wrappers).

**Expected output:**
> [!check]- Answer
> ```text
> Custom Hooks share stateful logic without adding nested function callback wrappers
> ```
> ```text
> Custom Hooks share stateful logic without adding nested function callback wrappers
> ```
>
> **Explanation:** Custom Hooks simplify component trees by returning values directly.

---

### Exercise 3: Toggle Component with Render Prop

**Problem:** Build `Toggle` component maintaining `on` boolean state and exposing `{ on, toggle }` via render prop.

**Expected output:**
> [!check]- Answer
> ```text
> function Toggle({ children }) { const [on, setOn] = useState(false); const toggle = () => setOn(!on); return children({ on, toggle }); }
> ```
> ```javascript
> function Toggle({ children }) {
>   const [on, setOn] = useState(false);
>   const toggle = () => setOn(!on);
>   return children({ on, toggle });
> }
> ```
>
> **Explanation:** Passing state and control functions to `children` functions implements the Render Prop pattern.

## 7. Related Terms
- [Custom Hooks](../level_04/custom_hooks.md) — Just like HOCs, the Render Props pattern was largely replaced by Custom Hooks, which achieve the same logic-sharing much cleaner.

---

