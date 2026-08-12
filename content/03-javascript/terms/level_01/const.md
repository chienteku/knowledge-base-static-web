# const

> **Level 1 — Foundations**
> Block-scoped variable declaration that cannot be reassigned after its initial assignment.

---

## 1. Prerequisites
- [Variable](variable.md) — A named container for storing data values.
- [let](let.md) — Block-scoped variable declaration.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: const is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Immutable Microservice Configuration Registry

**Scenario:** A backend microservice initializes configuration parameters (API base URLs, port numbers, timeout thresholds). These bindings must never be reassigned at runtime.

**Requirements:**
1. Declare configuration settings using const.
2. Attempting to reassign a const binding must throw a TypeError.
3. Export an accessor function returning configuration values.

> [!check]- Answer
> #### Implementation
> ```javascript
> function getServiceConfig() {
>   const PORT = 8080;
>   const API_BASE = "https://api.example.com/v1";
> let reassignmentFailed = false;
>   try {
>     // @ts-ignore
>     PORT = 9090;
>   } catch (err) {
>     reassignmentFailed = err instanceof TypeError;
>   }
> return { PORT, API_BASE, reassignmentFailed };
> }
> // Verification tests
> const cfg = getServiceConfig();
> console.assert(cfg.PORT === 8080, "Test 1 Failed");
> console.assert(cfg.reassignmentFailed === true, "Test 2 Failed: Reassignment must throw TypeError");
> ```
> #### Technical Explanation
> 1. **Reassignment Restriction**: Variables declared with const create a read-only reference binding. Reassigning a const variable throws a runtime TypeError.
> 2. **Mandatory Initializer**: const declarations must be initialized immediately upon declaration; const x; is a syntax error.
> 3. **Block Scope**: const declarations are scoped to their enclosing block {}, preventing variable leaks.
> 
---

### Exercise 2: Shallow Immutability vs Deep Object Freezing

**Scenario:** A developer uses const to declare a configuration object, but discovers that const does NOT prevent mutating internal object properties. The object must be frozen using Object.freeze().

**Requirements:**
1. Declare an object using const.
2. Demonstrate that const permits property mutation (obj.prop = val).
3. Freeze the object using Object.freeze() to enforce property immutability.

> [!check]- Answer
> #### Implementation
> ```javascript
> function createImmutableConfig() {
>   const config = Object.freeze({
>     host: "localhost",
>     port: 5432
>   });
> let mutationFailed = false;
>   try {
>     config.port = 3306;
>   } catch (err) {
>     mutationFailed = true;
>   }
> mutationFailed = mutationFailed || config.port === 5432;
> return { config, mutationFailed };
> }
> // Verification tests
> const res = createImmutableConfig();
> console.assert(res.config.port === 5432, "Test 1 Failed: Port was mutated");
> console.assert(res.mutationFailed === true, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Shallow Immutability**: const prevents reassigning the variable binding itself, but does not freeze the underlying object value stored in memory.
> 2. **Object.freeze()**: To prevent property mutation on objects declared with const, use Object.freeze().
> 3. **Reference Storage**: Objects are assigned by reference; const guarantees the reference pointer remains constant.
> 
---

### Exercise 3: Block-Scoped Loop Binding Isolation

**Scenario:** An asynchronous batch processor uses a for...of loop with const bindings to process queue elements. Each iteration creates an isolated lexical scope block.

**Requirements:**
1. Iterate over an array using for (const item of items).
2. Demonstrate that each iteration receives its own distinct const binding.
3. Process and return item transformations.

> [!check]- Answer
> #### Implementation
> ```javascript
> function processItems(items) {
>   const results = [];
> for (const item of items) {
>     const processed = item.toUpperCase();
>     results.push(processed);
>   }
> return results;
> }
> // Verification tests
> const output = processItems(["alpha", "beta", "gamma"]);
> console.assert(output.join(",") === "ALPHA,BETA,GAMMA", "Test 1 Failed");
> ```
> #### Technical Explanation
> 1. **Per-Iteration Binding**: In for...of and for...in loops, a new const variable binding is created for each loop iteration block.
> 2. **No Accumulator Mutation**: Because for...of does not reassign the loop variable, using const is fully valid.
> 3. **Closure Safety**: Per-iteration block scoping prevents asynchronous closure bugs common with var.
---

## 6. Related Terms
- [let](let.md) — Block-scoped variable declaration that allows reassignment.
- [Variable](variable.md) — A named container for storing data values.
- [Assignment Operators](assignment_operators.md) — Related concept: Assignment Operators.
- [Object.freeze / Object.seal](../level_07/object_freeze_seal.md) — Related concept: Object.freeze / Object.seal.

---

## 7. Key Takeaways
- Use `const` by default for all variable declarations. Only switch to `let` if you are absolutely sure the variable's reference needs to change.
- `const` requires an initial value at the time of declaration.
- `const` prevents reassignment of the variable identifier, but does **not** make the values inside arrays or objects immutable.
