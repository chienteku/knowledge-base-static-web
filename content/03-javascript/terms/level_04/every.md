# every()

> **Level 4 — Iteration & Array Methods**
> Tests whether all elements in the array pass the test implemented by the provided function.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — An ordered list of values.
- [some()](some.md) — Tests if *at least one* element passes the test.

---

## 2. Term Category

**Array Method / Functional Programming (Universal: Works everywhere)**: every() is a fundamental concept in this technology stack. **Level 4 — Iteration & Array Methods**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes you need absolute certainty about a dataset. For instance, before letting a user submit a form, you need to verify that *every single required field* is filled out. 

`every()` is the strict counterpart to `some()`. While `some()` stops searching as soon as it finds a single "Yes", `every()` stops searching as soon as it finds a single "No". It forces the entire array to pass the test; if even one element fails, the whole function instantly returns `false`.

### (2) Reality Metaphor
Imagine a strict security checkpoint at an airport. A family of five walks up. The security officer's rule is: "Does everyone have a passport?"
The officer checks the first person: Yes.
Second person: Yes.
Third person: No.
The officer instantly stops checking. The answer is "No" (`false`). The entire family is rejected because they didn't *every* have a passport.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const grades = [90, 85, 100, 75, 88];

// Did the student pass EVERY test? (Score >= 70)
const passedAll = grades.every((grade) => grade >= 70);

console.log(passedAll); // true
```

#### Fuller Example
```javascript
const formFields = [
  { field: "Username", value: "Alice123" },
  { field: "Email", value: "alice@test.com" },
  { field: "Password", value: "" } // Uh oh, empty string!
];

// Verify that EVERY field has a truthy value (not empty)
const isFormValid = formFields.every(field => field.value);

if (isFormValid) {
  console.log("Submitting form...");
} else {
  console.log("Error: Please fill out all fields.");
}
// Output: Error: Please fill out all fields.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Every Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Every blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "every";
```

*Fix:*
```javascript
let value = "every";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Every Callbacks

**The mistake:** Passing methods from Every instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "every",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "every",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Every Operations

**The mistake:** Executing asynchronous operations within Every without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/every"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/every");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in every: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Order Checkout Compliance Checklist

**Scenario:** An e-commerce checkout engine verifies that all cart item objects satisfy inventory, pricing, and compliance requirements using every().

**Requirements:**
1. Write validateOrderItems(cartItems).
2. Use cartItems.every(predicate).
3. Verify item.inStock is true and item.price > 0.
4. Return boolean validation status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateOrderItems(cartItems) {
>   if (!Array.isArray(cartItems) || cartItems.length === 0) return false;
>   return cartItems.every(item => item.inStock === true && typeof item.price === "number" && item.price > 0);
> }
>
> // Verification tests
> const validCart = [{ inStock: true, price: 10 }, { inStock: true, price: 25 }];
> console.assert(validateOrderItems(validCart) === true, "Test 1 Failed");
>
> const invalidCart = [{ inStock: true, price: 10 }, { inStock: false, price: 15 }];
> console.assert(validateOrderItems(invalidCart) === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **every() Predicate Evaluation**: Array.prototype.every(predicate) checks whether all elements in the array satisfy the predicate condition.
> 2. **Short-Circuit Execution**: every() stops iterating immediately (short-circuits) upon encountering the first falsy predicate result.
> 3. **Vacuous Truth for Empty Arrays**: Calling every() on an empty array returns true for any predicate condition (vacuous truth).
> 
---

### Exercise 2: Form Input Field Constraints Validator

**Scenario:** A registration form engine checks whether all required input field objects meet length and validation criteria.

**Requirements:**
1. Write validateFormInputs(fields).
2. Use fields.every(field => field.value.trim().length >= field.minLen).
3. Return boolean validity.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateFormInputs(fields) {
>   if (!Array.isArray(fields) || fields.length === 0) return false;
>   return fields.every(field => typeof field.value === "string" && field.value.trim().length >= (field.minLen || 1));
> }
>
> // Verification tests
> const fields1 = [
>   { name: "username", value: "alice", minLen: 3 },
>   { name: "email", value: "alice@example.com", minLen: 5 }
> ];
> console.assert(validateFormInputs(fields1) === true, "Test 1 Failed");
>
> const fields2 = [
>   { name: "username", value: "bo", minLen: 3 }
> ];
> console.assert(validateFormInputs(fields2) === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Predicate Boolean Return**: The predicate callback passed to every() must evaluate to a truthy or falsy value for each element.
> 2. **All-or-Nothing Rule**: Returns true if and only if EVERY element satisfies the condition; otherwise returns false.
> 3. **Callback Arguments**: The predicate callback receives element, index, and array parameters.
> 
---

### Exercise 3: Microservice System Health Probe Array Evaluator

**Scenario:** A cloud monitoring dashboard evaluates status metrics from an array of service probes, verifying system health.

**Requirements:**
1. Write isClusterHealthy(probeList).
2. Check if probe.status === "HEALTHY" and probe.latencyMs < 200 using every().
3. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function isClusterHealthy(probeList) {
>   if (!Array.isArray(probeList) || probeList.length === 0) return false;
>   return probeList.every(probe => probe.status === "HEALTHY" && probe.latencyMs < 200);
> }
>
> // Verification tests
> const probes1 = [
>   { status: "HEALTHY", latencyMs: 45 },
>   { status: "HEALTHY", latencyMs: 120 }
> ];
> console.assert(isClusterHealthy(probes1) === true, "Test 1 Failed");
>
> const probes2 = [
>   { status: "HEALTHY", latencyMs: 45 },
>   { status: "DEGRADED", latencyMs: 500 }
> ];
> console.assert(isClusterHealthy(probes2) === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **High-Performance Short-Circuit**: If the first probe is DEGRADED, every() returns false instantly without inspecting remaining probes.
> 2. **Pure Inspection**: every() does not mutate the source array.
> 3. **Guard against Empty Inputs**: Check Array.isArray() and length > 0 before calling every() to prevent empty array vacuous truth bugs.
---

## 6. Related Terms
- [some()](some.md) — The lenient sibling. Returns true if *at least one* passes.
- [filter()](filter.md) — Actually extracts the elements that pass, rather than just returning true/false.

---

## 7. Key Takeaways
- `every()` returns a strict boolean: `true` or `false`.
- It returns `true` only if **all** elements pass the test.
- It "short-circuits" (stops executing) the moment it finds a falsy result.
- If called on an empty array, it always returns `true`.
