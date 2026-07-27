# Dependency Array

> **Level 3 — Component Lifecycle & Effects**
> The second argument passed to `useEffect` (and other hooks) that acts as a "watch list". It tells React exactly when the effect should be allowed to run.

---

## 1. Prerequisites
- [`useEffect` Hook](../level_03/use_effect.md) — Where the Dependency Array is used.
- [Component Lifecycle](../level_03/component_lifecycle.md) — The array directly controls the Mounting and Updating phases.

---

## 2. Term Category
- **React Mechanic / Hook Configuration**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If an effect runs after every single render, it ruins performance. 
We need a way to tell React: *"Please only run this effect if the `userId` changes. If the user just types in a search bar, don't run the `userId` effect!"*
React uses the **Dependency Array** for this. You give React an array of variables. React watches those variables. If any of them change between renders, the effect runs. If they stay the same, the effect is skipped.

### (2) The Three Configurations
The behavior of `useEffect` completely changes based on what you put in the array:

**1. No Array (The Danger Zone)**
Runs on Mount + After EVERY Update. (Rarely used, prone to infinite loops).
```javascript
useEffect(() => { ... }); 
```

**2. The Empty Array `[]` (The Mount-Only)**
Runs ONLY on Mount (Birth). It never runs again, no matter what changes. Perfect for initial API fetches.
```javascript
useEffect(() => { ... }, []); 
```

**3. The Populated Array `[varA, varB]` (The Watcher)**
Runs on Mount + ONLY when `varA` or `varB` changes.
```javascript
useEffect(() => { ... }, [userId, category]); 
```

### (3) The Linter Rule
The React team created a strict ESLint rule called `eslint-plugin-react-hooks`. It enforces that **any variable used inside the effect MUST be included in the dependency array**. If you use `userId` inside the effect, but don't put `userId` in the array, your app will have severe "stale data" bugs.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Objects and Arrays in the Dependency Array

**The mistake:** A developer puts an object into the dependency array: `useEffect(() => {...}, [userObject])`.

**Why it's wrong:** React compares dependencies using `Object.is()` (reference equality). If the parent component re-renders, it might create a *new* object in memory that looks identical `{ name: "Bob" }`. React compares the memory addresses, sees they are different, and unnecessarily runs the effect! 
**Golden Rule:** Avoid putting Objects or Arrays in the dependency array. Instead, destructure the primitive values you actually need: `useEffect(() => {...}, [userObject.id])`.

---



### Mistake 2: Lying to the Dependency Array by Omitting Used Reactive Values

**The mistake:** Using `count` inside `useEffect` while supplying an empty dependency array `[]` to force run-once.

**Why it's wrong:** Omitting reactive state or prop variables creates **stale closures**. The effect callback captures the initial state value (`0`) forever and never reads updated state values. Include all reactive values or use functional state updaters.

*Incorrect:*
```javascript
useEffect(() => {
  const id = setInterval(() => { setCount(count + 1); }, 1000); // ❌ count is stale!
  return () => clearInterval(id);
}, []); // Lying to dependency array!
```

*Fix:*
```javascript
useEffect(() => {
  const id = setInterval(() => { setCount(c => c + 1); }, 1000); // Functional update
  return () => clearInterval(id);
}, []); // Safe empty dependency array
```

### Mistake 3: Passing Newly Created Objects or Arrays directly into Dependency Arrays (Infinite Re-Render Loop)

**The mistake:** Writing `useEffect(() => { ... }, [{ id: 1 }])` or referencing an un-memoized object prop.

**Why it's wrong:** React uses `Object.is` to compare dependencies across renders. Passing an un-memoized object literal `{}` creates a new object reference on EVERY render, causing `useEffect` to fire infinitely!

*Incorrect:*
```javascript
const options = { theme: 'dark' };
useEffect(() => { ... }, [options]); // ❌ Infinite effect loop!
```

*Fix:*
```javascript
const options = useMemo(() => ({ theme: 'dark' }), []);
useEffect(() => { ... }, [options]);
```

## 6. Practice Exercises

### Exercise 1: The Search Bar

**Problem:** You have a component with a `searchQuery` state and a `theme` state (dark/light). You have a `useEffect` that fetches search results from an API. How do you configure the dependency array so it fetches when they type, but DOES NOT fetch when they toggle the dark mode theme?

**Expected output:**
```text
You use a populated array: `[searchQuery]`
When `theme` changes, React will see `searchQuery` hasn't changed, and will skip the fetch effect!
```

> [!check]- Answer
> - Only put the variables the effect *actually cares about* in the array.

---



### Exercise 2: Dependency Array Behavior Types

**Problem:** Match behaviors: 1. No dependency array (`useEffect(fn)` -> Runs after every render); 2. Empty array `[]` (`useEffect(fn, [])` -> Runs once on mount); 3. `[val]` (`useEffect(fn, [val])` -> Runs on mount and when `val` changes).

**Expected output:**
```text
1. Runs after every render, 2. Runs once on mount, 3. Runs when val changes
```

> [!check]- Answer
> ```text
> 1. Runs after every render, 2. Runs once on mount, 3. Runs when val changes
> ```
>
> **Explanation:** The dependency array controls effect execution frequency.

### Exercise 3: Primitive vs Object Dependencies

**Problem:** Why is `[options.id]` safer in dependency arrays than `[options]`? (`options.id` is a primitive scalar compared by value rather than object reference).

**Expected output:**
```text
options.id is a primitive scalar compared by value rather than object reference
```

> [!check]- Answer
> ```text
> options.id is a primitive scalar compared by value rather than object reference
> ```
>
> **Explanation:** Primitive dependencies avoid false positive effect triggers caused by new object references.

## 7. Related Terms
- [`useCallback` Hook](../level_04/use_callback.md) — Another hook that relies heavily on the Dependency Array.
- [Immutability](../level_02/immutability.md) — Why React uses memory addresses to compare items in the dependency array.

---

## 8. Key Takeaways
- The **Dependency Array** controls when an effect runs.
- **No Array:** Runs after every render.
- **`[]` (Empty):** Runs exactly once, on Mount.
- **`[data]`:** Runs on Mount, and whenever `data` changes.
- Never lie to React: if a variable is used inside the effect, it MUST be listed in the array.
- Pass primitive values (strings, numbers, booleans) into the array whenever possible, not Objects/Arrays.
