# Derived State

> **Level 2 — State & Reactivity**
> Computing values on-the-fly during render execution instead of storing redundant state in `useState`.

---

## 1. Prerequisites
- [State](../level_02/state.md) — The source variables from which data is derived.
- [Re-rendering](../level_02/re_rendering.md) — The render execution loop that recalculates variables.

---

## 2. Term Category
- **Rendering Mechanic**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In React applications, components often need to display calculations based on existing state or props. For example, if you display a list of items, you might want to show:
-   The total number of items.
-   A subset of items filtered by a search query.
-   Whether the list is empty.

A common beginner mistake is to store these calculated values in their own independent `useState` variables, and use `useEffect` hooks to synchronize them:
```javascript
// ANTI-PATTERN: Redundant state and extra sync effects!
const [items, setItems] = useState([]);
const [itemCount, setItemCount] = useState(0);

useEffect(() => {
  setItemCount(items.length);
}, [items]);
```

This is a major anti-pattern because it:
1.  **Causes Redundancy:** You are storing the same data twice in state (`items` and `itemCount`).
2.  **Triggers Double Renders:** Updating `items` triggers Render #1, which fires the `useEffect`, calling `setItemCount`, which triggers Render #2.
3.  **Introduces Sync Bugs:** If a developer updates `items` but forgets to run the sync function, the UI state becomes inconsistent.

The solution is to use **Derived State**:
-   **Derived State:** Any value that can be computed directly from existing state or props during the render pass.
-   Because React executes the component function on every render, standard JavaScript variables defined inside the component automatically recalculate on every update. No `useState` or `useEffect` is needed.
-   If the derivation calculation is CPU-heavy (like sorting 5,000 items), you can wrap it in `useMemo` to cache the output unless its dependencies change.

---

### (2) Reality Metaphor
Imagine tracking your age on a card.
- **Redundant State (Manual Sync):** You write your birthday and your "Current Age" on a sticky note. Every year on your birthday, you must remember to cross out the age and write the new number. If you forget, your written age becomes out of sync with your actual age.
- **Derived State (On-the-fly math):** You write down only your "Birth Date" on the card. Whenever anyone asks: *"How old are you?"*, you check the current year, subtract your birth year, and state the answer. It is mathematically impossible for your age to get out of sync with your birth date because you calculate it dynamically when requested.

---

### (3) React Code Examples

#### 1. The Redundant State Anti-Pattern (Slow and Verbose)
```jsx
import React, { useState, useEffect } from 'react';

function BadCart({ items }) {
  const [totalPrice, setTotalPrice] = useState(0);

  // Triggering extra renders and sync loops!
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.price, 0);
    setTotalPrice(total);
  }, [items]);

  return <div>Total Price: ${totalPrice}</div>;
}
```

#### 2. The Clean Derived State Pattern (Recommended)
```jsx
import React from 'react';

function GoodCart({ items }) {
  // Calculated on the fly during render execution. Zero hooks required!
  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

  return <div>Total Price: ${totalPrice}</div>;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Copying props into state snapshots

**The mistake:** Storing an incoming prop inside a local state variable to display or use it:
```jsx
// BAD: Name snapshot will not update if parent passes a new user object!
function Profile({ user }) {
  const [userName, setUserName] = useState(user.name);
  
  return <h1>Profile: {userName}</h1>;
}
```

**Why it's wrong:** The `useState(user.name)` initializer only runs once when the component is mounted. If the parent component updates and passes a new `user` prop, the local `userName` state remains unchanged, leaving the component displays outdated data.

*Fix:* Use the prop values directly in your JSX, or derive local variables from them:
```jsx
// GOOD: Always displays the latest prop values dynamically
function Profile({ user }) {
  return <h1>Profile: {user.name}</h1>;
}
```

---



### Mistake 2: Duplicating Calculated Values into Separate `useState` Hooks (Derived State Anti-Pattern)

**The mistake:** Storing `firstName`, `lastName`, AND `fullName` in 3 separate state variables, manually updating `fullName` via `useEffect`.

**Why it's wrong:** Duplicating derived state leads to out-of-sync state bugs and triggers unnecessary extra re-renders. Calculate derived values on-the-fly during render: `const fullName = `${firstName} ${lastName}`;`.

*Incorrect:*
```javascript
const [firstName, setFirstName] = useState('');
const [fullName, setFullName] = useState('');
useEffect(() => { setFullName(firstName + ' ' + lastName); }, [firstName, lastName]); // ❌ Extra re-render!
```

*Fix:*
```javascript
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const fullName = `${firstName} ${lastName}`; // Calculated during render!
```

### Mistake 3: Using `useState` to Copy Props into State Without Resetting on Prop Changes

**The mistake:** Initializing `const [email, setEmail] = useState(user.email);` and expecting `email` state to update automatically when parent passes a new `user` prop.

**Why it's wrong:** `useState(initialValue)` evaluates initial state ONLY on initial component mount! When parent `user` prop changes, local state remains stuck on old initial values. Reset via key prop (`key={user.id}`) or compute during render.

*Incorrect:*
```javascript
function Form({ user }) {
  const [email, setEmail] = useState(user.email); // ❌ Stale when user prop changes!
}
```

*Fix:*
```javascript
// Pass key={user.id} from parent to reset component state on user prop changes
<Form key={user.id} user={user} />
```

## 6. Practice Exercises

### Exercise 1: Eliminating Synchronization Effects

**Problem:** Refactor the search filter component below to eliminate all redundant state and `useEffect` updates using derived state:

```jsx
// Before (Redundant & Buggy):
import React, { useState, useEffect } from 'react';

function SearchList({ users }) {
  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    const filtered = users.filter(user => user.name.includes(search));
    setFilteredUsers(filtered);
  }, [search, users]);

  return (
    <div>
      <input value={search} onChange={e => setSearch(e.target.value)} />
      <ul>
        {filteredUsers.map(u => <li key={u.id}>{u.name}</li>)}
      </ul>
    </div>
  );
}

// After (Refactored Solution):
import React, { useState } from 'react';

function SearchList({ users }) {
  const [search, setSearch] = useState('');

  // Solution: Derive the filtered list directly during render!
  const filteredUsers = users.filter(user => user.name.includes(search));

  return (
    <div>
      <input value={search} onChange={e => setSearch(e.target.value)} />
      <ul>
        {filteredUsers.map(u => <li key={u.id}>{u.name}</li>)}
      </ul>
    </div>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Calculating Filtered Items as Derived State

**Problem:** Calculate `filteredItems` on-the-fly during render using `items.filter()` without storing in `useState`.

**Expected output:**
> [!check]- Answer
> ```text
> function ItemList({ items, query }) { const filteredItems = items.filter(item => item.name.includes(query)); return <ul>{filteredItems.map(i => <li key={i.id}>{i.name}</li>)}</ul>; }
> ```
> ```javascript
> function ItemList({ items, query }) {
>   const filteredItems = items.filter(item => item.name.includes(query));
>   return (
>     <ul>
>       {filteredItems.map(i => <li key={i.id}>{i.name}</li>)}
>     </ul>
>   );
> }
> ```
>
> **Explanation:** Computing values directly during render eliminates redundant state and extra render cycles.

---

### Exercise 3: When to Memoize Derived State

**Problem:** When should derived calculations during render be wrapped in `useMemo`? (Only when calculations are expensive like filtering 10,000 items).

**Expected output:**
> [!check]- Answer
> ```text
> Only when calculations are computationally expensive (e.g. filtering thousands of items)
> ```
> ```text
> Only when calculations are computationally expensive (e.g. filtering thousands of items)
> ```
>
> **Explanation:** Simple derived state calculations (string concatenations, array maps of small lists) require zero memoization overhead.

## 7. Related Terms
- [`useMemo` Hook](../level_04/use_memo.md) — Optimization hook used to cache heavy derived state calculations.
- [Render Purity](../level_01/render_purity.md) — The rule that calculations during render must remain self-contained.

---

## 8. Key Takeaways
- Derived state is computed dynamically from state or props during rendering.
- Storing derived data in state creates redundancy and synchronization bugs.
- Do not use `useEffect` hooks to synchronize secondary state variables.
- Recalculating variables on render is fast and prevents double-render cycles.
- Do not initialize state snapshots using props that need to stay in sync.
- Use `useMemo` to optimize expensive derived state calculations.
