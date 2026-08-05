# Rules of Hooks

> **Level 4 — Advanced Hooks**
> The two strict, unbreakable architectural laws that govern how and where you are allowed to use React Hooks.

---

## 1. Prerequisites
- [Components](../level_01/components.md) — Hooks must be used inside them.
- [`useState` Hook](../level_02/use_state.md) — The most common hook that follows these rules.
---

## 2. Term Category
- **React Core Rule**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
React Hooks (like `useState` and `useEffect`) look like normal JavaScript functions, but they possess "magic" powers. They can somehow remember state between renders without using the `this` keyword. 
How does React know *which* state belongs to *which* `useState` call?
**React relies strictly on the Call Order.**
If you call `useState` three times in a component, React remembers them as: Hook #1, Hook #2, Hook #3. If you change the order of the hooks, or skip one, React gets completely confused and assigns the wrong data to the wrong variables. To prevent this, React enforces the **Rules of Hooks**.

### (2) Rule 1: Only call Hooks at the Top Level
You must never call a hook inside a loop, inside a condition (`if` statement), or inside a nested function.
They must be declared at the absolute top level of your component function.
**Why?** This guarantees that Hooks are called in the exact same order every single time a component renders. 

### (3) Rule 2: Only call Hooks from React Functions
You cannot call `useState` inside a regular vanilla JavaScript function (e.g., a helper function that formats a date). 
You can only call hooks from:
1. A React Functional Component.
2. A Custom Hook (which we will learn later).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: The Conditional Hook

**The mistake:** A developer wants to save memory. They say, "If the user is logged in, I will create a `useState` for their profile data. If not, I'll skip it."
```javascript
function App({ isLoggedIn }) {
  if (isLoggedIn) {
    const [profile, setProfile] = useState(null); // CRITICAL ERROR!
  }
}
```

**Why it's wrong:** You just broke Rule 1. If `isLoggedIn` changes from `true` to `false`, the hook is suddenly skipped. React loses its place in the Hook Order index. The entire app will crash with a fatal "React Hook Order changed" error.
**Golden Rule:** Always declare the hook unconditionally at the top. If you need conditional logic, put the `if` statement *inside* a `useEffect`, not around it.

---



### Mistake 2: Calling React Hooks Inside Conditional `if` Statements or Loops

**The mistake:** Writing `if (isLoggedIn) { useEffect(...); }` or calling `useState` inside a `for` loop.

**Why it's wrong:** React relies on the **EXACT SAME call order of Hooks** on every single render to map state slots! Calling hooks inside conditions or loops changes hook call order, causing state corruption crashes.

*Incorrect:*
```javascript
function Profile({ user }) {
  if (user) {
    useEffect(() => { ... }); // ❌ Rule violation: Hook called conditionally!
  }
}
```

*Fix:*
```javascript
function Profile({ user }) {
  useEffect(() => {
    if (!user) return; // Condition INSIDE the effect
    // ...
  }, [user]);
}
```

### Mistake 3: Calling Hooks Inside Standard Non-Component JavaScript Functions

**The mistake:** Calling `useState` inside a helper utility function `function calculateTax()`.

**Why it's wrong:** Hooks can ONLY be called from React Function Components or Custom Hooks (`use` prefix). Calling hooks inside regular utility functions throws runtime errors.

*Incorrect:*
```javascript
function calculateTax() {
  const [rate] = useState(0.1); // ❌ Error: Hook called outside React component!
}
```

*Fix:*
```javascript
function useTaxCalculator() { const [rate] = useState(0.1); return rate; }
```

## 6. Practice Exercises

### Exercise 1: Spot the Violations

**Problem:** Find the two violations of the Rules of Hooks in this code:
```javascript
function calculateTaxes() {
  const [rate, setRate] = useState(0.2);
  return 100 * rate;
}

function Checkout() {
  for (let i = 0; i < 3; i++) {
    useEffect(() => { console.log(i) }, []);
  }
  return <div>Checkout</div>;
}
```

**Expected output:**
> [!check]- Answer
> ```text
> 1. `calculateTaxes` is a regular JS function, not a Component. You cannot use `useState` inside it.
> 2. `Checkout` uses `useEffect` inside a `for` loop. Hooks must be at the top level, never nested in loops.
> ```
> - Check the two main rules: Top Level only, and React Functions only.

---



### Exercise 2: 2 Core Rules of Hooks List

**Problem:** State 2 core Rules of Hooks (1. Only call Hooks at the top level — never inside loops, conditions, or nested functions; 2. Only call Hooks from React Function Components or Custom Hooks).

**Expected output:**
> [!check]- Answer
> ```text
> 1. Call Hooks at top level only; 2. Call Hooks from React Function Components or Custom Hooks only
> ```
> ```text
> 1. Call Hooks at top level only; 2. Call Hooks from React Function Components or Custom Hooks only
> ```
>
> **Explanation:** Rules of Hooks guarantee consistent hook execution order across renders.

---

### Exercise 3: Refactoring Conditional Hook Call

**Problem:** Refactor `if (id) { const [data] = useState(); }` to comply with Rules of Hooks.

**Expected output:**
> [!check]- Answer
> ```text
> Call useState at top level unconditionally; handle condition in render or effect logic
> ```
> ```javascript
> const [data, setData] = useState();
> useEffect(() => {
>   if (id) fetch(id).then(setData);
> }, [id]);
> ```
>
> **Explanation:** Hooks must be invoked unconditionally at the component top level.

## 7. Related Terms
- [Custom Hooks](custom_hooks.md) — The only other place (besides components) where you are allowed to call a hook.
- [Components](../level_01/components.md) — Where hooks belong.
- [`useState` Hook](../level_02/use_state.md) — Related concept: `useState` Hook.
- [Stale Closures](../level_03/stale_closures.md) — Related concept: Stale Closures.
- [`useId` Hook](use_id.md) — Related concept: `useId` Hook.
---

## 8. Key Takeaways
- **Rule 1:** Only call Hooks at the Top Level. Never inside loops, conditions, or nested functions.
- **Rule 2:** Only call Hooks from React Functional Components or Custom Hooks.
- React tracks hooks purely by their Call Order. Breaking these rules changes the order and instantly crashes the application.
