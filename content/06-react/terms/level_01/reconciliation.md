# Reconciliation

> **Level 1 — Core Concepts**
> The diffing algorithm that compares old vs new Virtual DOM trees and computes the minimal real-DOM update.

---

## 1. Prerequisites
- [Virtual DOM](../level_01/virtual_dom.md) — The in-memory tree structures compared by this algorithm.

---

## 2. Term Category
- **Rendering Mechanic**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When a component's state or props change, React needs to update the UI. To do this, it constructs a new Virtual DOM tree representing the updated state. 

In computer science, finding the minimum number of modifications to transition one tree of size $N$ into another is an $O(N^3)$ operation. If React used standard tree diffing, rendering a page with 1,000 elements would require billions of comparison steps, causing the browser to freeze.

To achieve fast updates, React implements a heuristic $O(N)$ diffing algorithm known as **Reconciliation**. This algorithm operates in linear time based on two assumptions:

#### 1. Elements of Different Types Produce Different Trees
If two elements have different tags or component names (e.g. replacing a `<div>` with a `<span>`, or a `<Header>` with a `<Footer>`), React will not attempt to compare them. It instantly unmounts the old element and all of its children, destroying their state, and builds the new subtree from scratch.
```jsx
// Before:
<div><Counter /></div>

// After (type changed from div to span -> Counter is destroyed and remounted):
<span><Counter /></span>
```

#### 2. Keys Identify Stable Elements Across Renders
When rendering lists of sibling components, developers provide a unique `key` prop. React uses these keys to match children in the old tree with children in the new tree. This allows React to detect if items were simply reordered, inserted, or deleted, moving the corresponding DOM nodes instead of destroying and recreating them.

---

### (2) Reality Metaphor
Imagine a home renovation blueprint comparison app.
- **$O(N^3)$ (Manual Re-measurement):** To compare two versions of a house plan, you measure every single brick, window pane, and plumbing pipe from scratch. It takes weeks of work to update a kitchen cabinet color.
- **Reconciliation (Spotting the Difference):** You overlay the new blueprint directly on top of the old one. You assume that if a room is labeled "Kitchen" in both plans (**same element type**), you only need to update the changes (e.g. repainting the cabinets from brown to white). If the room label changes to "Bathroom" (**different type**), you tear down the room and build a new bathroom.

---

### (3) Process Mechanics

When comparing the old and new trees, React applies different updates based on the node types:

#### 1. DOM Elements of the Same Type
If the elements are of the same type, React compares the attributes, updates only the changed attributes on the real DOM node, and continues matching children recursively.
```html
<!-- Before -->
<div class="active" title="User Menu"></div>

<!-- After (React updates class to "inactive" and keeps title unchanged) -->
<div class="inactive" title="User Menu"></div>
```

#### 2. Component Elements of the Same Type
When a component updates, the instance remains the same, preserving state across renders. React updates the component's props to match the new element and calls the render method to reconcile the children.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using array indexes as list keys

**The mistake:** Using the index parameter of a `.map()` loop as the `key` attribute for a list of items:
```jsx
// BAD: Using array index as key!
{items.map((item, index) => (
  <TodoItem key={index} text={item.text} />
))}
```

**Why it's wrong:** Array indexes are not stable identifiers. If you insert an item at the beginning of the list, sort the list, or delete an item, the index positions shift. React will map the keys to the wrong DOM nodes, which can cause inputs, selections, or animations to remain attached to the incorrect elements.

*Fix:* Always use stable, unique IDs (such as database primary keys or unique strings) as keys:
```jsx
// GOOD: Stable unique ID is preserved across list mutations!
{items.map(item => (
  <TodoItem key={item.id} text={item.text} />
))}
```

---



### Mistake 2: Using Array Indices as Component `key` Props for Dynamic Mapped Lists

**The mistake:** Writing `items.map((item, index) => <Item key={index} data={item} />)` for re-orderable lists.

**Why it's wrong:** Using array index as key breaks reconciliation when items are inserted, deleted, or re-ordered. React matches component state by key, leading to state corruption and input field value misplacement. Use unique item IDs (`key={item.id}`).

*Incorrect:*
```javascript
items.map((item, index) => <ListItem key={index} item={item} />); // ❌ State corruption on re-order!
```

*Fix:*
```javascript
items.map(item => <ListItem key={item.id} item={item} />); // Stable item ID key
```

### Mistake 3: Changing Component Element Types at the Same Tree Position

**The mistake:** Swapping root element `<div className="a">` with `<section className="a">`.

**Why it's wrong:** When element types change, React tears down the old component tree completely, unmounting child DOM nodes and discarding component state. Keep root element types consistent across renders.

*Incorrect:*
```javascript
return isSec ? <section><Child /></section> : <div><Child /></div>; // ❌ Unmounts Child completely!
```

*Fix:*
```javascript
return <div className={isSec ? 'sec' : 'main'}><Child /></div>; // Retains tree state
```



### Mistake 4: Using Array Indices as Component `key` Props for Dynamic Mapped Lists

**The mistake:** Writing `items.map((item, index) => <Item key={index} data={item} />)` for re-orderable lists.

**Why it's wrong:** Using array index as key breaks reconciliation when items are inserted, deleted, or re-ordered. React matches component state by key, leading to state corruption and input field value misplacement. Use unique item IDs (`key={item.id}`).

*Incorrect:*
```javascript
items.map((item, index) => <ListItem key={index} item={item} />); // ❌ State corruption on re-order!
```

*Fix:*
```javascript
items.map(item => <ListItem key={item.id} item={item} />); // Stable item ID key
```

### Mistake 5: Changing Component Element Types at the Same Tree Position

**The mistake:** Swapping root element `<div className="a">` with `<section className="a">`.

**Why it's wrong:** When element types change, React tears down the old component tree completely, unmounting child DOM nodes and discarding component state. Keep root element types consistent across renders.

*Incorrect:*
```javascript
return isSec ? <section><Child /></section> : <div><Child /></div>; // ❌ Unmounts Child completely!
```

*Fix:*
```javascript
return <div className={isSec ? 'sec' : 'main'}><Child /></div>; // Retains tree state
```

## 6. Practice Exercises

### Exercise 1: State Loss Debugging

**Problem:** Explain why typing in the input field below causes the input to lose focus on every keystroke:

```jsx
import React, { useState } from 'react';

function FormApp() {
  const [value, setValue] = useState('');

  // Nesting the definition of a component inside another component:
  function InputField() {
    return <input value={value} onChange={e => setValue(e.target.value)} />;
  }

  return (
    <div>
      <h2>User Profile</h2>
      <InputField />
    </div>
  );
}
```

**Expected output:**
> [!check]- Answer
> - Because `InputField` is defined *inside* `FormApp`, a new `InputField` function reference is created on every render. When the state changes, React compares the old `<InputField />` to the new `<InputField />`. Because the function references differ, React treats them as different types, unmounting the old input (destroying focus) and mounting a new one from scratch.
> - *Fix:* Move the `InputField` component definition outside the `FormApp` parent component, passing `value` and `setValue` as props.

---

### Exercise 2: Reconciliation Diffing Rules

**Problem:** List 2 core rules of React Reconciliation algorithm (1. Different element types trigger full tree unmounting/re-building; 2. Keys identify persistent list items across re-orders).

**Expected output:**
> [!check]- Answer
> ```text
> 1. Different element types trigger full tree unmounting; 2. Keys identify persistent list items
> ```
>
> **Explanation:** The diffing algorithm optimizes DOM mutations by comparing node types and keys.

---

### Exercise 3: Resetting State via Key Prop Mutation

**Problem:** How can you force a React component to completely unmount and reset state when `userId` changes? (Pass `key={userId}` to the component).

**Expected output:**
> [!check]- Answer
> ```javascript
> <UserProfile key={userId} userId={userId} />
> ```
>
> **Explanation:** Changing a component's `key` forces React reconciliation to discard the old instance and mount a fresh component state.

## 7. Related Terms
- [The Fiber Architecture](./fiber_architecture.md) — The engine executing the reconciliation queue.
- [Re-rendering](../../level_02/re_rendering.md) — The process that generates the Virtual DOM tree for diffing.
- [Lists & Keys](../../level_05/lists_and_keys.md) — The developer control hook for reconciliation.

---

## 8. Key Takeaways
- Reconciliation is React's $O(N)$ linear-time heuristic diffing algorithm.
- Elements of different types tear down the subtree and remount from scratch.
- Same-type DOM elements only update their modified attributes in the real DOM.
- Same-type components preserve state and undergo a props update cycle.
- Unique, stable keys are required to identify element identities in lists.
- Never use array indexes as keys in dynamic or reorderable lists.
