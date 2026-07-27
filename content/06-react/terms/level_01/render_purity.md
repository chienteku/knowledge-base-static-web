# Render Purity

> **Level 1 — Core Concepts**
> The rule that a component must be a pure function of its props and state, returning the same JSX without modifying external state during render.

---

## 1. Prerequisites
- [Components](../level_01/components.md) — The functional units that must remain pure.
- [Props](../level_01/props.md) — The read-only inputs passed to components.

---

## 2. Term Category
- **Rendering Mechanic**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
To optimize application rendering speeds, React makes several assumptions about component execution. It may execute components in parallel, pre-render components in the background, or skip rendering a component entirely if its props and state have not changed since the last render.

If a component performs a side effect during its execution cycle (such as modifying a global variable, writing to a file, or fetching network data directly in the function body), it is **impure**.

Impure components can cause unpredictable bugs:
-   **Visual Glitches:** UI elements showing different values across renders.
-   **Memory Leaks:** Subscriptions or event listeners being created repeatedly.
-   **Broken Optimizations:** React skipping a render and leaving the UI out of sync.

To prevent these issues, React requires **Render Purity** (functional components must act as pure functions):
1.  **Same Input, Same Output:** Given the same props and state, a component must return the exact same JSX tree.
2.  **No Side Effects:** The component must not mutate any variables or objects that existed before the component was rendered. It must be read-only with respect to its surroundings.

---

### (2) Reality Metaphor
Imagine baking a cake using a recipe card.
- **Impure Recipe (Writing on walls):** The recipe says: *"To bake this cake, check the number written on the kitchen wall, add 1 to it, and write it back on the wall."* If two chefs try to bake cakes simultaneously, they will overwrite each other's numbers, resulting in burnt cakes and ruined calculations.
- **Pure Recipe (Self-contained):** The recipe says: *"Mix 2 cups of flour, 3 eggs, and 1 cup of sugar to yield a cake."* The recipe does not depend on or modify anything outside the mixing bowl. You can bake 10 cakes in parallel or skip steps if you already have the ingredients prepared; the result is consistent.

---

### (3) Code Examples

#### 1. The Impure Mutation Leak (Vulnerable Code)
```javascript
// BAD: Mutates a global variable during render execution!
let guestCount = 0;

function Cup() {
  guestCount = guestCount + 1; // Side Effect!
  return <h2>Cup for guest #{guestCount}</h2>;
}

function Table() {
  return (
    <>
      <Cup /> {/* Renders: Cup for guest #1 */}
      <Cup /> {/* Renders: Cup for guest #2 */}
      <Cup /> {/* Renders: Cup for guest #3 */}
    </>
  );
}
```
*Why this fails:* If the browser window resizing triggers a re-render of `Table`, `guestCount` will keep incrementing (showing 4, 5, 6), creating unpredictable values.

#### 2. The Pure Refactored Solution
```javascript
// GOOD: Passes variables as props; component maintains zero external state
function Cup({ guestNumber }) {
  return <h2>Cup for guest #{guestNumber}</h2>;
}

function Table() {
  return (
    <>
      <Cup guestNumber={1} />
      <Cup guestNumber={2} />
      <Cup guestNumber={3} />
    </>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Mutating incoming props directly

**The mistake:** Modifying properties of an object passed as a prop inside the component body:

```javascript
// BAD: Mutating props directly!
function ProfileCard({ user }) {
  user.lastActive = new Date(); // Side effect! Modifies parent state object.
  
  return <div>{user.name}</div>;
}
```

**Why it's wrong:** Props are read-only snapshot objects. Mutating a property of an incoming object bypassed React's state management, meaning React will not detect the change and will skip necessary re-renders. It also modifies the data source for other components that share the same user object.

*Fix:* Treat all props as immutable. If you need to log or modify data, do it inside an event handler or `useEffect`:

```javascript
// GOOD: Modifying state using event handlers
function ProfileCard({ user, onUpdateStatus }) {
  const handleVerify = () => {
    onUpdateStatus(user.id, new Date());
  };
  return <button onClick={handleVerify}>Verify</button>;
}
```

---



### Mistake 2: Mutating Existing Objects or Arrays Passed as Props or State during Render

**The mistake:** Calling `props.items.push(newItem)` or `user.score += 1` inside a render function.

**Why it's wrong:** Mutating render input objects causes side-effects that break Pure Component memoization and Concurrent rendering. Always create copy mutations (`[...items, newItem]`).

*Incorrect:*
```javascript
function List({ items }) {
  items.push('new'); // ❌ Mutating input prop array directly!
  return <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>;
}
```

*Fix:*
```javascript
function List({ items }) {
  const formatted = [...items, 'new']; // Pure copy calculation
  return <ul>{formatted.map(i => <li key={i}>{i}</li>)}</ul>;
}
```

### Mistake 3: Calling `Math.random()` or `Date.now()` Directly inside Render Functions

**The mistake:** Generating component element IDs using `id={Math.random()}` during render.

**Why it's wrong:** Pure functions MUST return identical outputs for identical inputs. Calling `Math.random()` produces different outputs on every render, breaking SSR hydration and DOM matching. Use `useId()` or generate IDs in event handlers.

*Incorrect:*
```javascript
function Field() {
  const id = Math.random(); // ❌ Impure non-deterministic calculation!
  return <input id={id} />;
}
```

*Fix:*
```javascript
function Field() {
  const id = useId(); // Deterministic React hook ID
  return <input id={id} />;
}
```



### Mistake 4: Mutating Existing Objects or Arrays Passed as Props or State during Render

**The mistake:** Calling `props.items.push(newItem)` or `user.score += 1` inside a render function.

**Why it's wrong:** Mutating render input objects causes side-effects that break Pure Component memoization and Concurrent rendering. Always create copy mutations (`[...items, newItem]`).

*Incorrect:*
```javascript
function List({ items }) {
  items.push('new'); // ❌ Mutating input prop array directly!
  return <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>;
}
```

*Fix:*
```javascript
function List({ items }) {
  const formatted = [...items, 'new']; // Pure copy calculation
  return <ul>{formatted.map(i => <li key={i}>{i}</li>)}</ul>;
}
```

### Mistake 5: Calling `Math.random()` or `Date.now()` Directly inside Render Functions

**The mistake:** Generating component element IDs using `id={Math.random()}` during render.

**Why it's wrong:** Pure functions MUST return identical outputs for identical inputs. Calling `Math.random()` produces different outputs on every render, breaking SSR hydration and DOM matching. Use `useId()` or generate IDs in event handlers.

*Incorrect:*
```javascript
function Field() {
  const id = Math.random(); // ❌ Impure non-deterministic calculation!
  return <input id={id} />;
}
```

*Fix:*
```javascript
function Field() {
  const id = useId(); // Deterministic React hook ID
  return <input id={id} />;
}
```

## 6. Practice Exercises

### Exercise 1: Render Purity Refactoring

**Problem:** The component below is impure because it mutates an array in-place during render. Refactor it to be pure:

```javascript
// Before (Impure - mutates incoming array):
function SortedList({ numbers }) {
  const sorted = numbers.sort(); // Mutates the array in-place!
  return (
    <ul>
      {sorted.map(num => <li key={num}>{num}</li>)}
    </ul>
  );
}

// After (Pure - creates a copy before sorting):
function SortedList({ numbers }) {
  // Solution: create a shallow copy first using spread operator
  const sorted = [...numbers].sort(); 
  return (
    <ul>
      {sorted.map(num => <li key={num}>{num}</li>)}
    </ul>
  );
}
```

**Expected output:**
> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Refactoring Impure Component to Pure Component

**Problem:** Refactor impure component `function Clock() { const time = new Date().toLocaleTimeString(); return <div>{time}</div>; }` to receive `time` as a prop.

**Expected output:**
> [!check]- Answer
> ```javascript
> function Clock({ time }) {
>   return <div>{time}</div>;
> }
> ```
>
> **Explanation:** Pure components derive UI strictly from input props without reading dynamic external state.

### Exercise 3: Strict Mode Double Rendering

**Problem:** Why does React `StrictMode` intentionally execute component render functions twice in development? (To detect and surface impure render side-effects early).

**Expected output:**
> [!check]- Answer
> ```text
> To detect and surface impure render side-effects early
> ```
>
> **Explanation:** Double rendering in development exposes mutations and side-effects executed during render.

## 7. Related Terms
- [Side Effects](../../level_03/side_effects.md) — The operations that must be isolated from render execution.
- [Strict Mode](../../level_08/strict_mode.md) — A React utility that runs components twice in development to catch purity bugs.
- [useEffect](../../level_03/use_effect.md) — The React hook used to execute side effects safely.

---

## 8. Key Takeaways
- Components must be pure functions of props and state.
- Render functions should behave like a formula: same inputs must yield the same output.
- Rendering must not modify any global or outer-scope variables.
- Treat props as read-onlySnapshots; never mutate props directly.
- Use `Strict Mode` during development to identify render purity issues early.
- Keep side effects (like data fetches, timeouts, and state updates) out of the render body.
