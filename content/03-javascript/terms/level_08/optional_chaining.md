# Optional Chaining (?.)

> **Level 8 — Modern JavaScript (ES6+)**
> Safely accesses deeply nested object properties without manually checking if each reference is valid.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The structure being accessed.
- [Undefined](../level_01/undefined.md) / [Null](../level_01/null.md) — The values this operator protects against.

---

## 2. Term Category
- **Syntax Feature** *(Introduced in ES11 / 2020)*

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, trying to read a property on `undefined` or `null` instantly crashes your entire application with a fatal `TypeError: Cannot read property of undefined`. 
When working with complex, deeply nested data (like JSON from an API), it's common for intermediate properties to be missing. Before 2020, developers had to write ugly, defensive "short-circuit" code to protect against crashes: `if (user && user.address && user.address.street) { ... }`.

To fix this, the TC39 committee introduced **Optional Chaining (`?.`)**. When you place `?.` before a property access, you are telling the engine: "Check if the thing on the left exists. If it's `null` or `undefined`, STOP immediately and just return `undefined`. Do not crash."

### (2) Reality Metaphor
Imagine trying to deliver a package to "Room 304 in Building B".
Without optional chaining, you walk to where Building B should be. If Building B was demolished, you panic, explode, and the entire city stops functioning (Fatal Error).
With optional chaining, you walk to where Building B should be. You notice it's missing. You shrug, say "I guess it doesn't exist" (Undefined), and peacefully go home.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const user = {
  name: "Alice",
  // Notice there is no 'address' object!
};

// The Old Way (Crash!)
// console.log(user.address.street); // TypeError: Cannot read properties of undefined

// The New Way (Safe!)
console.log(user.address?.street); // Evaluates to undefined safely. No crash!
```

#### Fuller Example: APIs and Functions
```javascript
// Imagine this data came from a database, and some fields are missing.
const company = {
  name: "Tech Corp",
  getCEO() {
    return { name: "Bob" };
  }
};

// 1. Safe Property Access
console.log(company.location?.city); // undefined

// 2. Safe Array Access
// If 'employees' doesn't exist, it stops before trying to grab index [0].
console.log(company.employees?.[0]?.name); // undefined

// 3. Safe Function Calls
// If the function 'getCTO' doesn't exist, it safely returns undefined!
console.log(company.getCTO?.()); // undefined
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Optional Chaining Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Optional Chaining blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "optional_chaining";
```

*Fix:*
```javascript
let value = "optional_chaining";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Optional Chaining Callbacks

**The mistake:** Passing methods from Optional Chaining instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "optional_chaining",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "optional_chaining",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Optional Chaining Operations

**The mistake:** Executing asynchronous operations within Optional Chaining without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/optional_chaining"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/optional_chaining");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in optional_chaining: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The Short Circuit

**Problem:** In the following code, does the `expensiveFunction()` ever run?
```javascript
const user = null;
const result = user?.profile?.score + expensiveFunction();
```

**Expected output:**
> [!check]- Answer
> ```text
> No! 
> When `user?.` evaluates to `undefined`, the entire chain "short-circuits" and stops evaluating immediately. The right side of the expression is completely ignored.
> ```
> - Optional chaining stops execution the exact moment it hits `null` or `undefined`.

---

### Exercise 2: Optional Method Invocations (`?.()`)

**Problem:** Safely invoke `obj.customMethod?.()` when `customMethod` is undefined.

**Expected output:**
> [!check]- Answer
> ```text
> undefined
> ```
> ```javascript
> const obj = {};
> console.log(obj.customMethod?.());
> ```
>
> **Explanation:** `obj.method?.()` short-circuits to `undefined` if `method` is `null` or `undefined`.

---

### Exercise 3: Optional Bracket Property Access (`?.[]`)

**Problem:** Safely access array item `arr?.[0]` when `arr` is `null`.

**Expected output:**
> [!check]- Answer
> ```text
> undefined
> ```
> ```javascript
> const arr = null;
> console.log(arr?.[0]);
> ```
>
> **Explanation:** `?.[]` guards dynamic bracket property lookups against nullish targets.


---

## 7. Related Terms
- [Nullish Coalescing (`??`)](./nullish_coalescing.md) — The perfect companion to `?.` for providing default values.
- [Undefined](../level_01/undefined.md) — What is returned when `?.` fails to find the property.

---

## 8. Key Takeaways
- Optional Chaining (`?.`) safely accesses deeply nested properties.
- If the reference to the left of `?.` is `null` or `undefined`, the expression stops and evaluates to `undefined`.
- It completely eliminates fatal `TypeError` crashes caused by missing nested data.
- It can be used for properties (`obj?.prop`), arrays (`arr?.[0]`), and functions (`func?.()`).
```
