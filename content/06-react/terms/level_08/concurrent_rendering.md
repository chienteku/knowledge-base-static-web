# Concurrent Rendering

> **Level 8 — Performance Optimization**
> React 18's internal task-prioritization loop allowing rendering tasks to be paused, resumed, or discarded.

---

## 1. Prerequisites
- [The Fiber Architecture](../level_01/fiber_architecture.md) — The cooperative scheduling engine enabling chunking.
- [Render Purity](../level_01/render_purity.md) — Crucial because paused rendering cycles can be run multiple times before committing.

---

## 2. Term Category
- **Rendering Mechanic**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In React 17 and earlier, the rendering process was a single, uninterrupted synchronous transaction. Once React started rendering a component tree, it would lock up the browser's main thread until it completed.

If the component tree was large (for example, rendering a list of 5,000 product rows), this blocking behavior would freeze the webpage. Users could not type into search boxes, click buttons, or see hover states until React finished rendering. This resulted in laggy input loops and stuttering frame rates.

To resolve this, React 18 introduced **Concurrent Rendering**:
-   **Interruptible Rendering:** React can pause, resume, discard, or schedule rendering jobs mid-execution.
-   **Cooperative Scheduling:** Instead of rendering the entire tree in a single, blocking CPU call, React splits the rendering work into small chunks.
-   After processing each chunk, React yields control back to the browser's main thread. If a user triggers a high-priority action (such as typing in an input field), React pauses the low-priority background render, processes the keystroke, updates the input on screen, and then returns to the background rendering task. If the background render is no longer needed (e.g. the query has changed), React discards the task and starts a new one.

---

### (2) Reality Metaphor
Imagine a fast-food kitchen.
- **Blocking Rendering (Single-Minded Clerk):** A customer orders a massive 50-course catering feast. The clerk refuses to serve anyone else until they have prepared and packed all 50 meals. Meanwhile, a line of 50 customers forms behind them, waiting just to purchase a single soda.
- **Concurrent Rendering (Agile Chef):** The chef starts preparing the 50-course feast. After slicing a tomato (**one rendering chunk**), the chef checks the queue. A customer walks up wanting only a soda (**high-priority user input**). The chef pauses slicing, hands the customer their soda, and then returns to preparing the large feast.

---

### (3) Unlocking Concurrent Rendering in React
Concurrent rendering is an internal engine optimization. You activate it in your application by wrapping state updates in specific hooks:

1.  **`useTransition`:** Marks state updates as non-blocking transitions.
2.  **`useDeferredValue`:** Defers updating a slow part of the component tree.

```jsx
import React, { useState, useTransition } from 'react';

function SearchApp() {
  const [query, setQuery] = useState('');
  const [list, setList] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    // 1. High Priority: Update input box immediately
    setQuery(e.target.value);

    // 2. Low Priority: Mark list sorting render as a pauseable transition
    startTransition(() => {
      const filteredList = generateLargeList(e.target.value);
      setList(filteredList);
    });
  };

  return (
    <div>
      <input type="text" value={query} onChange={handleChange} />
      {isPending && <p>Loading matching items...</p>}
      <ProductList items={list} />
    </div>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting Concurrent Rendering to speed up slow JavaScript execution

**The mistake:** Assuming that concurrent rendering acts like multi-threading and makes slow, unoptimized functions run faster:

```javascript
// BAD: A slow calculation will still take time and freeze chunks!
const sorted = list.sort((a, b) => expensiveCompare(a, b));
```

**Why it's wrong:** JavaScript is single-threaded. Concurrent rendering does not execute code faster; it changes *when* code is executed by chunking renders. If a single component's render function takes 500ms to calculate internally, it will still freeze the thread because React cannot interrupt a single component mid-execution.

*Fix:* Keep your component render functions fast and pure. Use `useMemo` to cache expensive calculations, and use concurrent hooks only to schedule *when* those rendering updates are committed to the screen.

---



### Mistake 2: Writing Impure Side-Effects in Render Phase during Concurrent Rendering

**The mistake:** Mutating global variables or firing network calls during render when Concurrent Rendering is enabled.

**Why it's wrong:** Under Concurrent Rendering, React can yield control to browser animation frames, pause rendering, and restart or discard render attempts multiple times. Impure side-effects in render will execute multiple times unexpectedly. Keep render functions pure.

*Incorrect:*
```javascript
// Mutating external global array inside concurrent render phase
```

*Fix:*
```javascript
Execute side-effects inside useEffect() or event handlers
```

### Mistake 3: Using Sync State Updates for Heavy Search Inputs Without Transition Priorities

**The mistake:** Updating a 10,000-item filter list synchronously inside input `onChange` without `startTransition`.

**Why it's wrong:** Synchronous state updates block user input typing performance. Wrap heavy non-urgent list filtering updates in `startTransition()` to keep typing responsive.

*Incorrect:*
```javascript
onChange={e => setFilterQuery(e.target.value)} // ❌ Stutters typing performance on heavy lists!
```

*Fix:*
```javascript
onChange={e => {
  setInputValue(e.target.value); // Urgent typing update
  startTransition(() => setFilterQuery(e.target.value)); // Non-urgent transition update
}}
```

## 6. Practice Exercises

### Exercise 1: Identifying Blocking UI Behaviors

**Problem:** A user types into a search input. The characters they type do not appear on screen for 1 second, and the typing input feels sluggish. Is this behavior a sign of a blocking render or concurrent rendering? How would you fix it?

> [!check]- Answer
> - This is a classic sign of a **blocking render**. The heavy search list updates are running synchronously on the same render loop as the input text update, blocking the browser's paint cycle.
> - To fix this:
> - 1.  Verify the input state update (the search query) is processed immediately.
> - 2.  Wrap the state setter for the search results in a `useTransition` callback so React can pause the list rendering to process input events.


---



### Exercise 2: Concurrent React Features List

**Problem:** List 3 Concurrent Rendering features in React 18+ (`useTransition`, `useDeferredValue`, `<Suspense>`).

**Expected output:**
> [!check]- Answer
> ```text
> useTransition, useDeferredValue, Suspense
> ```
> ```text
> useTransition, useDeferredValue, Suspense
> ```
>
> **Explanation:** Concurrent features allow React to interrupt low-priority renders for urgent user input events.

---

### Exercise 3: Urgent vs Non-Urgent Update Priority

**Problem:** Categorize update priority: 1. Text input typing (Urgent); 2. Filtering 5,000 data rows (Non-Urgent Transition); 3. Clicking tabs (Urgent UI feedback).

**Expected output:**
> [!check]- Answer
> ```text
> 1. Urgent, 2. Non-Urgent Transition, 3. Urgent
> ```
> ```text
> 1. Urgent, 2. Non-Urgent Transition, 3. Urgent
> ```
>
> **Explanation:** Interruptible transitions keep urgent interaction events smooth.

## 7. Related Terms
- [The Fiber Architecture](../level_01/fiber_architecture.md) — The virtual stack frame structure that allows React to pause rendering.
- [`useTransition` Hook](../level_08/use_transition.md) — The hook used to mark state updates as interruptible transitions.

---

## 8. Key Takeaways
- Concurrent rendering allows React to pause, resume, or discard rendering work.
- It prevents slow, complex renders from blocking the browser's main thread.
- User inputs (like typing or clicks) are prioritized over background list updates.
- React splits rendering work into small chunks, yielding to the browser event loop between chunks.
- Concurrent rendering requires pure render functions, as paused renders may run multiple times.
- Unlock concurrent features using the `useTransition` or `useDeferredValue` hooks.
