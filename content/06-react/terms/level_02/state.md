# State

> **Level 2 — State & Reactivity**
> A component's personal, internal memory. It is the dynamic data that determines what the component currently looks like and how it behaves.

---

## 1. Prerequisites
- [Components](../level_01/components.md) — State lives inside components.
- [Props (Properties)](../level_01/props.md) — The read-only counterpart to State.

---

## 2. Term Category
- **React Core Concept**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If a component only used Props, it would be a static, unchanging template. But modern UIs are highly interactive: you click a button to open a modal, you type into an input field, you hover over a menu.
A component needs a way to "remember" these interactions. Did the user click the "Open" button? Is the modal currently open or closed?
React uses **State** to store this memory. State is a JavaScript variable that belongs exclusively to that specific component.

### (2) The Difference Between State and Props
This is the most asked React interview question of all time.
- **Props are External.** They are passed down from a parent. They are **Read-Only**. The child cannot change its own props.
- **State is Internal.** It is created and managed directly inside the component. It is **Mutable** (you can change it). When a component changes its own state, it triggers a Re-render to update the UI.

### (3) The Snapshot Metaphor
Think of State as a photograph of your component at a specific point in time. 
- Time 0: `isOpen = false` (Snapshot: The modal is hidden).
- Time 1: User clicks the button. `isOpen` changes to `true`. 
- Time 2: React takes a new Snapshot. (The modal is visible).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using regular JavaScript variables for State

**The mistake:** A developer wants to track a counter. They write `let count = 0;` inside their component, and `count++` when a button is clicked.

**Why it's wrong:** The variable *will* increment in the background, but the UI will never change! React does not watch regular JavaScript variables. React only knows to update the screen if you use official React State (via the `useState` hook).
**Golden Rule:** If a variable changes, and you want that change to be visible on the screen, it MUST be React State.

---



### Mistake 2: Mutating Regular JavaScript Variables Expecting React UI Updates

**The mistake:** Updating local variable `let count = 0; count += 1;` expecting the component to re-render.

**Why it's wrong:** React tracks component data changes ONLY through React `state` (`useState` / `useReducer`). Mutating local variables does not notify React to queue a re-render.

*Incorrect:*
```javascript
function Counter() {
  let count = 0;
  const inc = () => { count += 1; }; // ❌ No UI re-render triggered!
  return <button onClick={inc}>{count}</button>;
}
```

*Fix:*
```javascript
function Counter() {
  const [count, setCount] = useState(0);
  const inc = () => setCount(count + 1); // Triggers React re-render
  return <button onClick={inc}>{count}</button>;
}
```

### Mistake 3: Storing Server Cache Data in Local Component State Without Expiry or Sync

**The mistake:** Storing global API fetch responses in local component state across multiple views.

**Why it's wrong:** Local component state is unmounted when the view closes, requiring re-fetching and causing out-of-sync server cache states. Use dedicated data fetching libraries like React Query (`@tanstack/react-query`).

*Incorrect:*
```javascript
// Fetching and storing user list in local state across 5 screens
```

*Fix:*
```javascript
Use React Query (useQuery) for server cache state management
```

## 6. Practice Exercises

### Exercise 1: State vs Props

**Problem:** You are building a Twitter Clone. You have a `<Tweet />` component. Which of the following pieces of data should be Props, and which should be State?
1. The text of the tweet ("Hello world!").
2. The boolean `isLiked` indicating if the current user clicked the Heart button.
3. The username of the person who posted it.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Props (The text is passed down from the database/parent, the user reading it can't change it).
> 2. State (The user reading the tweet clicks the heart, changing it from empty to full. It changes based on user interaction).
> 3. Props (Passed down from the parent, read-only).
> ```
> - Does the user interacting with the component change the value? If yes, it's State.

---



### Exercise 2: Selecting State vs Regular Variables

**Problem:** Determine if item should be State or Regular Variable: 1. Input form value (State); 2. Intermediate calculation during render (Variable); 3. Modal open status (State).

**Expected output:**
> [!check]- Answer
> ```text
> 1. State, 2. Variable, 3. State
> ```
> ```text
> 1. State, 2. Variable, 3. State
> ```
>
> **Explanation:** Data that must persist across renders and trigger UI updates MUST be stored in React State.

---

### Exercise 3: State Snapshot Behavior

**Problem:** Inside event handler `const add = () => { setCount(count + 1); setCount(count + 1); }`, what is the net increment count? (Increments by 1 because `count` is a constant snapshot).

**Expected output:**
> [!check]- Answer
> ```text
> Increments by 1 because count is a constant snapshot within the event handler
> ```
> ```text
> Increments by 1 because count is a constant snapshot within the event handler
> ```
>
> **Explanation:** State values act as snapshots within event handlers; use updater functions `setCount(c => c + 1)` for sequential updates.

## 7. Related Terms
- [`useState` Hook](use_state.md) — How you actually create State in modern React.
- [Re-rendering](re_rendering.md) — What happens immediately after State changes.
- [Declarative Programming](../level_01/declarative_programming.md) — Related concept: Declarative Programming.
- [Props (Properties)](../level_01/props.md) — Related concept: Props (Properties).
- [Derived State](derived_state.md) — Derived state.
- [Unidirectional Data Flow](unidirectional_flow.md) — Unidirectional data flow.

---

## 8. Key Takeaways
- **State** is a component's internal memory.
- Unlike Props (which are read-only and passed from above), State is controlled by the component itself and can be changed.
- If data changes and those changes need to be reflected on the screen, it MUST be stored in State, not a regular variable.
