# The Fiber Architecture

> **Level 1 — Core Concepts**
> React's internal unit-of-work engine that lets rendering pause, resume, and prioritize tasks.

---

## 1. Prerequisites
- [Virtual DOM](../level_01/virtual_dom.md) — The visual tree structure represented by Fiber nodes.
- [Reconciliation](./reconciliation.md) — The diffing process scheduled by the Fiber engine.

---

## 2. Term Category
- **Rendering Mechanic**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before React 16 (the "Stack Reconciler"), React processed updates using recursive function execution. Once rendering began, React walked down the entire component tree, computed changes, and updated the real DOM in a single synchronous call stack block.

If the component tree was large, this synchronous render cycle could take 100ms or longer to complete. Because the browser's main thread runs single-threaded, it was completely blocked during this period. The browser could not respond to user interactions (clicks, keyboard inputs, typing) or render animations, resulting in stuttering and lag.

To solve this, React was rewritten with a new core engine called **Fiber**:
-   **The Fiber Object:** A Fiber is a plain JavaScript object representing a "unit of work" (a component, its state, and its child/sibling relations). It acts as a node in a virtual linked list tree.
-   **Interruptible Rendering:** The Fiber engine breaks the component tree rendering process down into small units of work. It processes a few fibers, checks if there are higher-priority tasks (like user clicks or animations), pauses the render work if needed to yield control to the browser, and then resumes where it left off.
-   **Execution Phases:**
    1.  **Render/Reconciliation Phase:** Asynchronous and interruptible. React walks the Fiber tree, calculates the diffs (the "work"), and creates a list of updates. No changes are written to the actual DOM.
    2.  **Commit Phase:** Synchronous and fast. React writes the changes to the real DOM in one continuous block, ensuring the UI updates consistently.

---

### (2) Fiber Node Relationships (Linked List Structure)
Unlike the classic Virtual DOM which uses parent-child array relationships, Fiber maps trees using a linked list structure:

```text
       ┌──────────────┐
       │ Parent Fiber │
       └──────────────┘
               │ (child)
               ▼
       ┌──────────────┐  (sibling)  ┌───────────────┐
       │ Child Fiber  │ ──────────> │ Sibling Fiber │
       └──────────────┘             └───────────────┘
```
This linked-list traversal allows React to pause rendering at any node and resume later by retaining a reference to the active Fiber pointer.

---

### (3) Reality Metaphor
Imagine a restaurant kitchen preparing a large banquet.
- **The Stack Reconciler (Legacy Chef):** The chef starts cooking all 10 courses sequentially. If a customer runs up to report a fire or request a glass of water, the chef ignores them because they cannot pause cooking mid-dish. The restaurant burns down (**browser freezes**).
- **The Fiber Engine (Modern Chef):** The chef breaks cooking down into small steps: prep one vegetable, sear one steak. Between each step, the chef pauses and looks up to check for urgent requests. If a customer needs water, the chef pours it immediately (**UI stays responsive**), then returns to the grill and resumes prep.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Executing side effects directly inside the component render function body

**The mistake:** Writing API requests, DOM mutations, or state modifications directly inside a component's render body, instead of using `useEffect`:

```javascript
function UserProfile({ userId }) {
  // BAD: Side effect executed during the render phase!
  fetch(`/api/user/${userId}`).then(res => console.log(res)); 
  
  return <div>Profile</div>;
}
```

**Why it's wrong:** The Render phase is asynchronous and interruptible under the Fiber architecture. V8 might execute your component function multiple times, discard the result, or pause it mid-execution. Executing side effects in the render body will trigger duplicate API calls, cause memory leaks, or degrade performance.

*Fix:* Keep component render functions pure. Always encapsulate side effects inside `useEffect` or event handlers.

---



### Mistake 2: Assuming Fiber Renders Entire Trees Synchronously Without Interruption

**The mistake:** Assuming React 16+ Fiber reconciliation blocks the browser main thread like legacy Stack reconciler.

**Why it's wrong:** React Fiber breaks reconciliation work into incremental units of work (Fiber nodes) that can be paused, aborted, or prioritized based on browser animation frames.

*Incorrect:*
```javascript
// Expecting long render tasks to freeze browser main thread completely
```

*Fix:*
```javascript
Leverage Concurrent features (useTransition, useDeferredValue) for non-blocking rendering
```

### Mistake 3: Relying on Multiple Execution of Render Phase Code in Fiber

**The mistake:** Writing side-effects in render functions assuming render phase executes exactly once per update.

**Why it's wrong:** Under Fiber's concurrent engine, the render phase can be discarded or re-evaluated multiple times before committing changes to the real DOM.

*Incorrect:*
```javascript
function App() {
  sendAnalyticsPing(); // ❌ May execute multiple times in Fiber render phase!
  return <div>App</div>;
}
```

*Fix:*
```javascript
Move side-effects to useEffect() or event handlers executing during the commit phase
```



### Mistake 4: Assuming Fiber Renders Entire Trees Synchronously Without Interruption

**The mistake:** Assuming React 16+ Fiber reconciliation blocks the browser main thread like legacy Stack reconciler.

**Why it's wrong:** React Fiber breaks reconciliation work into incremental units of work (Fiber nodes) that can be paused, aborted, or prioritized based on browser animation frames.

*Incorrect:*
```javascript
// Expecting long render tasks to freeze browser main thread completely
```

*Fix:*
```javascript
Leverage Concurrent features (useTransition, useDeferredValue) for non-blocking rendering
```

### Mistake 5: Relying on Multiple Execution of Render Phase Code in Fiber

**The mistake:** Writing side-effects in render functions assuming render phase executes exactly once per update.

**Why it's wrong:** Under Fiber's concurrent engine, the render phase can be discarded or re-evaluated multiple times before committing changes to the real DOM.

*Incorrect:*
```javascript
function App() {
  sendAnalyticsPing(); // ❌ May execute multiple times in Fiber render phase!
  return <div>App</div>;
}
```

*Fix:*
```javascript
Move side-effects to useEffect() or event handlers executing during the commit phase
```

## 6. Practice Exercises

### Exercise 1: Identifying Rendering Lifecycle Boundaries

**Problem:** Review this component and label which line runs in the asynchronous **Render Phase** (which can be paused/discarded) and which line runs in the synchronous **Commit Phase**:

```jsx
import React, { useEffect, useState } from 'react';

function Timer() {
  const [time, setTime] = useState(0);

  // Line A:
  const doubleTime = time * 2;

  // Line B:
  useEffect(() => {
    document.title = `Time: ${time}`;
  }, [time]);

  return <h1>Time: {doubleTime}</h1>;
}

// Answer:
// - Line A runs during the Render Phase (runs on every component function call).
// - Line B (inside useEffect) runs during the Commit Phase (after changes are written to the DOM).
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

### Exercise 2: Fiber Work Phases

**Problem:** List 2 primary phases of React Fiber architecture (1. Render/Reconciliation Phase: interruptible work; 2. Commit Phase: synchronous DOM updates).

**Expected output:**
```text
1. Render/Reconciliation Phase (interruptible); 2. Commit Phase (synchronous DOM mutations)
```

> [!check]- Answer
> ```text
> 1. Render/Reconciliation Phase (interruptible); 2. Commit Phase (synchronous DOM mutations)
> ```
>
> **Explanation:** Fiber splits work into an interruptible calculation phase and a synchronous DOM commit phase.

### Exercise 3: Fiber Tree Double-Buffering

**Problem:** What is Double-Buffering in React Fiber? (React maintains `current` tree visible on screen and `workInProgress` tree built in memory).

**Expected output:**
```text
React maintains current tree visible on screen and workInProgress tree built in memory
```

> [!check]- Answer
> ```text
> React maintains current tree visible on screen and workInProgress tree built in memory
> ```
>
> **Explanation:** Double-buffering prevents incomplete or flickering UI frames from being displayed to users.



### Exercise 4: Fiber Work Phases

**Problem:** List 2 primary phases of React Fiber architecture (1. Render/Reconciliation Phase: interruptible work; 2. Commit Phase: synchronous DOM updates).

**Expected output:**
```text
1. Render/Reconciliation Phase (interruptible); 2. Commit Phase (synchronous DOM mutations)
```

> [!check]- Answer
> ```text
> 1. Render/Reconciliation Phase (interruptible); 2. Commit Phase (synchronous DOM mutations)
> ```
>
> **Explanation:** Fiber splits work into an interruptible calculation phase and a synchronous DOM commit phase.

### Exercise 5: Fiber Tree Double-Buffering

**Problem:** What is Double-Buffering in React Fiber? (React maintains `current` tree visible on screen and `workInProgress` tree built in memory).

**Expected output:**
```text
React maintains current tree visible on screen and workInProgress tree built in memory
```

> [!check]- Answer
> ```text
> React maintains current tree visible on screen and workInProgress tree built in memory
> ```
>
> **Explanation:** Double-buffering prevents incomplete or flickering UI frames from being displayed to users.

## 7. Related Terms
- [Reconciliation](./reconciliation.md) — The diffing process executed by Fiber nodes.
- [Concurrent Rendering](../../level_08/concurrent_rendering.md) — The feature set made possible by Fiber's interruptible pipeline.
- [Suspense](../../level_08/suspense.md) — Pausing component tree rendering while waiting for data.

---

## 8. Key Takeaways
- Fiber is the internal engine that powers React 16+ rendering and updates.
- It breaks rendering down into small, interruptible units of work.
- It maps the component tree using a linked list structure (child, sibling, return).
- Rendering is split into an interruptible Render Phase and a synchronous Commit Phase.
- Keeping render functions pure is essential because Fiber can pause or discard renders.
- Fiber enables Concurrent features, Suspense, and smooth UI transitions.
