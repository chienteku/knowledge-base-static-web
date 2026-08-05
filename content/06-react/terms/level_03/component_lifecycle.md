# Component Lifecycle

> **Level 3 — Component Lifecycle & Effects**
> The three distinct phases of a React component's existence on the screen: Birth (Mounting), Life (Updating), and Death (Unmounting).

---

## 1. Prerequisites
- [Components](../level_01/components.md) — What the lifecycle applies to.
- [Re-rendering](../level_02/re_rendering.md) — The "Updating" phase of the lifecycle.

---

## 2. Term Category
- **React Architecture / Mechanics**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
A component does not just exist statically. It has a life of its own. Developers need to run specific code at specific times during that life. 
- "I need to fetch data the exact moment this component appears."
- "I need to save progress every time this component updates."
- "I need to close the database connection right before this component is destroyed."
Understanding the **Lifecycle** allows you to hook into these specific moments in time.

### (2) The Three Phases
1. **Mounting (Birth):** The component is created and inserted into the real DOM for the very first time. This happens exactly *once*.
2. **Updating (Life):** The component's State or Props change. React generates a new Virtual DOM and updates the real DOM. This can happen *thousands of times*.
3. **Unmounting (Death):** The component is removed from the real DOM (e.g., the user navigated to a different page, or a boolean hid the component). This happens exactly *once*.

### (3) The Class vs Function Shift
In older React (Class Components), there were literal methods named `componentDidMount`, `componentDidUpdate`, and `componentWillUnmount`.
In modern React (Functional Components), these distinct methods were removed. Instead, the `useEffect` hook handles *all three phases* simultaneously based on how you configure it!

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing Mounting with Updating

**The mistake:** A developer wants to fetch a user's profile from an API. They don't configure their `useEffect` properly, causing it to run on the Updating phase instead of the Mounting phase.

**Why it's wrong:** The fetch triggers a state update. The state update triggers the Updating phase. The Updating phase triggers the fetch again. Infinite loop!
**Golden Rule:** Initial data fetching should almost always happen strictly on the **Mounting** phase.

---



### Mistake 2: Attempting to Use Legacy Class Lifecycle Methods (`componentDidMount`) in Function Components

**The mistake:** Adding `componentDidMount()` inside a functional React component.

**Why it's wrong:** Function components use React Hooks (`useEffect`, `useLayoutEffect`) to handle component lifecycle events instead of class method lifecycle hooks.

*Incorrect:*
```javascript
function App() {
  componentDidMount() { ... } // ❌ Syntax error in function component!
}
```

*Fix:*
```javascript
function App() {
  useEffect(() => { ... }, []); // Equivalent to mount lifecycle
}
```

### Mistake 3: Mapping Mental Model to Class Lifecycle Methods Instead of Dependency Synchronization

**The mistake:** Thinking of `useEffect` strictly as `componentDidMount` + `componentDidUpdate`.

**Why it's wrong:** `useEffect` is designed for **synchronizing component state with external systems** based on dependency array changes, not matching arbitrary class lifecycle events.

*Incorrect:*
```javascript
// Using useEffect as a imperative lifecycle step manager
```

*Fix:*
```javascript
Model useEffect as state synchronization with external systems (DOM, WebSocket, API)
```

## 6. Practice Exercises

### Exercise 1: Name that Phase

**Problem:** You build a Modal component. The user clicks "Open Modal". The user types into an input field inside the modal. The user clicks "Close Modal". Identify the lifecycle phases of the Modal component.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Clicking "Open": The Modal is inserted into the DOM (Mounting).
> 2. Typing in the input: The Modal's state changes repeatedly (Updating).
> 3. Clicking "Close": The Modal is removed from the DOM (Unmounting).
> ```
> - Birth, Life, Death.

---



### Exercise 2: Class Lifecycle vs Hooks Mapping

**Problem:** Match lifecycle: 1. `componentDidMount` (`useEffect(..., [])`); 2. `componentDidUpdate` (`useEffect(..., [dep])`); 3. `componentWillUnmount` (`useEffect(() => () => cleanup, [])`).

**Expected output:**
> [!check]- Answer
> ```text
> 1. useEffect(..., []), 2. useEffect(..., [dep]), 3. useEffect(() => () => cleanup, [])
> ```
> ```text
> 1. useEffect(..., []), 2. useEffect(..., [dep]), 3. useEffect(() => () => cleanup, [])
> ```
>
> **Explanation:** Function components declare lifecycle behavior through `useEffect` dependency configurations.

---

### Exercise 3: Execution Order of Render vs Mount

**Problem:** Order steps: 1. Component Render Function -> 2. Real DOM Mutations -> 3. Browser Paint -> 4. `useEffect` Execution.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Render Function -> 2. Real DOM Mutations -> 3. Browser Paint -> 4. useEffect Execution
> ```
> ```text
> 1. Render Function -> 2. Real DOM Mutations -> 3. Browser Paint -> 4. useEffect Execution
> ```
>
> **Explanation:** `useEffect` runs asynchronously AFTER the browser paints the screen.

## 7. Related Terms
- [`useEffect` Hook](use_effect.md) — The tool used to execute code during these specific phases.
- [Cleanup Functions](cleanup_functions.md) — Code that specifically runs during the Unmounting phase.
- [Error Boundaries](../level_07/error_boundaries.md) — Related concept: Error Boundaries.

---

## 8. Key Takeaways
- The **Component Lifecycle** consists of Mounting, Updating, and Unmounting.
- **Mounting:** Inserted into the DOM (Runs once).
- **Updating:** State/Props change causing a re-render (Runs many times).
- **Unmounting:** Removed from the DOM (Runs once).
- Modern React manages all these phases using a single hook: `useEffect`.
