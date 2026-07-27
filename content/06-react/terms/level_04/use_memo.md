# `useMemo` Hook

> **Level 4 — Advanced Hooks**
> A performance optimization hook that "memorizes" the result of a slow, expensive calculation so it doesn't have to be recalculated on every single render.

---

## 1. Prerequisites
- [Re-rendering](../level_02/re_rendering.md) — You must understand that component functions run repeatedly.
- [Dependency Array](../level_03/dependency_array.md) — `useMemo` uses this exact same array to know when to recalculate.

---

## 2. Term Category
- **React Hook / Performance Optimization**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Every time a component Re-renders, its entire JavaScript function runs from top to bottom. 
Usually, this is fine. But what if you have a line of code that sorts an array of 50,000 items? That sorting math takes 500 milliseconds. 
If the user types into an unrelated Search Bar, the component re-renders, and the app freezes for 500ms because it executes that massive sorting math again!
React provides **`useMemo`** (Memoization) to solve this. It remembers the answer to the math problem so it doesn't have to do the math again.

### (2) How it works
You wrap your expensive calculation in `useMemo`, and provide a Dependency Array. 
```javascript
import { useState, useMemo } from 'react';

function Dashboard({ users }) {
  const [searchTerm, setSearchTerm] = useState("");

  // This will ONLY re-run if the `users` prop actually changes.
  // If `searchTerm` changes, it just returns the remembered answer!
  const sortedUsers = useMemo(() => {
    console.log("Running expensive sort...");
    return users.sort((a, b) => a.score - b.score);
  }, [users]); 

  return (
    <div>
      <input onChange={e => setSearchTerm(e.target.value)} />
      <List items={sortedUsers} />
    </div>
  );
}
```

### (3) Referential Equality (The Hidden Use Case)
In JavaScript, `{ id: 1 } === { id: 1 }` is **FALSE** because they are two different objects in memory.
If you create an object inside a component, a brand new memory address is generated on every re-render. This can cause child components to unnecessary re-render!
`useMemo` can memorize an object, ensuring its memory address stays exactly the same across renders.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Premature Optimization (Memoizing Everything)

**The mistake:** A developer discovers `useMemo` and decides to wrap every single variable, string, and math addition in their app with it.

**Why it's wrong:** `useMemo` is not free! It costs memory to store the old values, and it takes CPU cycles to check the dependency array. If you wrap simple math like `a + b` in `useMemo`, you are actually making your app *slower* because the overhead of `useMemo` is heavier than the math itself!
**Golden Rule:** Only use `useMemo` for genuinely expensive operations (massive array sorting, heavy filtering, or preserving object memory addresses for `React.memo`).

---



### Mistake 2: Using `useMemo` for Cheap Primitive String or Math Operations

**The mistake:** Writing `const double = useMemo(() => count * 2, [count]);`.

**Why it's wrong:** Basic math operations take sub-nanoseconds. The overhead of calling `useMemo` and comparing dependencies is MORE expensive than `count * 2`. Use `useMemo` ONLY for expensive calculations.

*Incorrect:*
```javascript
const sum = useMemo(() => a + b, [a, b]); // ❌ Over-memoization overhead!
```

*Fix:*
```javascript
const sum = a + b; // Simple calculation directly during render
```

### Mistake 3: Mutating Memoized Cached Values Directly inside Render Code

**The mistake:** Writing `const list = useMemo(() => items, [items]); list.push('new');`.

**Why it's wrong:** Mutating memoized cached return values directly mutates the cached reference, corrupting subsequent renders. Treat `useMemo` return values as read-only.

*Incorrect:*
```javascript
const sorted = useMemo(() => items.sort(), [items]); // ❌ In-place sort mutates items array!
```

*Fix:*
```javascript
const sorted = useMemo(() => [...items].sort(), [items]); // Pure sorted copy
```

## 6. Practice Exercises

### Exercise 1: The Dependency Array

**Problem:** You have an expensive calculation: `const total = useMemo(() => price * quantity, [])`. The user clicks a button that increments `quantity`. What happens to `total`?

**Expected output:**
```text
The `total` will NEVER update! It will be stuck on the initial value forever.
Because the dependency array is empty `[]`, `useMemo` assumes the calculation never needs to be re-run.
You must put `[price, quantity]` in the array so it recalculates when they change.
```

> [!check]- Answer
> - `useMemo` uses the exact same array rules as `useEffect`.

---



### Exercise 2: Memoizing Expensive Filter Calculation

**Problem:** Memoize filtering 50,000 products based on `category` and `searchQuery` using `useMemo`.

**Expected output:**
```text
const filteredProducts = useMemo(() => { return products.filter(p => p.category === category && p.name.includes(searchQuery)); }, [products, category, searchQuery]);
```

> [!check]- Answer
> ```javascript
> const filteredProducts = useMemo(() => {
>   return products.filter(p =>
>     p.category === category && p.name.includes(searchQuery)
>   );
> }, [products, category, searchQuery]);
> ```
>
> **Explanation:** `useMemo` caches computed calculation outputs until dependencies change.

### Exercise 3: Semantic Guarantee of useMemo

**Problem:** Does React guarantee `useMemo` will NEVER clear its cache? (No, `useMemo` is for performance optimization; React may clear memory cache under high memory pressure).

**Expected output:**
```text
No, React may clear cached values under memory pressure
```

> [!check]- Answer
> ```text
> No, React may clear cached values under memory pressure
> ```
>
> **Explanation:** Code must remain correct even if `useMemo` recalculates cached values.

## 7. Related Terms
- [`useCallback` Hook](../level_04/use_callback.md) — The exact same concept, but specifically for memorizing Functions instead of Values.
- [React.memo](../level_08/react_memo.md) — A tool that memorizes an entire Component, which heavily relies on `useMemo` to work properly.

---

## 8. Key Takeaways
- **`useMemo`** caches the result of an expensive calculation so it isn't repeated on every render.
- It requires a Dependency Array. The calculation only re-runs if a dependency changes.
- It is also used to preserve the memory address of Objects and Arrays across renders (Referential Equality).
- Do NOT use it for cheap, fast operations. The overhead will make your app slower.
