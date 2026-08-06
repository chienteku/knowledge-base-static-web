# const

> **Level 1 — Foundations**
> Block-scoped variable declaration that cannot be reassigned after its initial assignment.

---

## 1. Prerequisites
- [Variable](variable.md) — A named container for storing data values.
- [let](let.md) — Block-scoped variable declaration.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While `let` fixed the scoping issues of `var`, developers still needed a way to signal intent: "This value should never change." In large applications, accidentally reassigning a configuration variable or a core object can cause catastrophic bugs. 

By introducing `const` (short for constant), the language provides a way to lock a variable's assignment. If another developer (or you, three months later) tries to overwrite it, the engine throws a `TypeError`. This enforces predictable code and better readability.

### (2) Reality Metaphor
Think of `const` like a permanent tattoo. Once it's inked (initialized), you can't erase it or swap it for a different design (reassignment). However, if the tattoo is of a basket (an object or array), you can still put things into or take things out of the basket—you just can't replace the basket itself.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const API_URL = 'https://api.example.com';
// API_URL = 'https://hacked.com'; // TypeError: Assignment to constant variable.
console.log(API_URL);
```

#### Fuller Example
```javascript
// `const` is ideal for configuration and fixed references
const maxRetries = 3;
const userProfile = { name: 'Alice', role: 'admin' };

// We CANNOT reassign userProfile to a new object
// userProfile = { name: 'Bob' }; // Error!

// But we CAN mutate the object's properties!
userProfile.name = 'Alicia';
console.log(userProfile.name); // 'Alicia'
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Const Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Const blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "const";
```

*Fix:*
```javascript
let value = "const";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Const Callbacks

**The mistake:** Passing methods from Const instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "const",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "const",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Const Operations

**The mistake:** Executing asynchronous operations within Const without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/const"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/const");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in const: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Reassignment vs Mutation

**Problem:** Declare a `const` array with three numbers. Try to reassign the array to a completely new array. Then, try to use `.push()` to add a number to the original array.

**Expected output:**
> [!check]- Answer
> ```text
> TypeError (on reassignment)
> [1, 2, 3, 4] (after pushing)
> ```
> - You cannot use `=` on a `const` variable after it's initialized.
> - Array methods like `.push()` mutate the existing array in memory, which is allowed.
> 
---

### Exercise 2: Deep Freezing Const Objects

**Problem:** Use `Object.freeze()` to prevent property mutation on a `const` user object `{ role: "admin" }`.

**Expected output:**
> [!check]- Answer
> ```text
> TypeError or property unchanged
> ```
> ```javascript
> const config = Object.freeze({ role: "admin" });
> // config.role = "user"; // Silently ignored in non-strict, throws TypeError in strict mode
> console.log(config.role); // "admin"
> ```
>
> **Explanation:** `Object.freeze()` prevents adding, removing, or modifying properties on target objects.
> 
---

### Exercise 3: Const Block Scope Temporal Dead Zone

**Problem:** Demonstrate accessing `const x` before its declaration line triggers a `ReferenceError`.

**Expected output:**
> [!check]- Answer
> ```text
> ReferenceError: Cannot access x before initialization
> ```
> ```javascript
> try {
>   console.log(x);
>   const x = 10;
> } catch (err) {
>   console.log(err.name + ": " + err.message);
> }
> ```
>
> **Explanation:** `const` bindings reside in Temporal Dead Zone (TDZ) from block entry until their declaration line executes.
> 
---

## 7. Related Terms
- [let](let.md) — Block-scoped variable declaration that allows reassignment.
- [Variable](variable.md) — A named container for storing data values.
- [Assignment Operators](assignment_operators.md) — Related concept: Assignment Operators.
- [Object.freeze / Object.seal](../level_07/object_freeze_seal.md) — Related concept: Object.freeze / Object.seal.

---

## 8. Key Takeaways
- Use `const` by default for all variable declarations. Only switch to `let` if you are absolutely sure the variable's reference needs to change.
- `const` requires an initial value at the time of declaration.
- `const` prevents reassignment of the variable identifier, but does **not** make the values inside arrays or objects immutable.
