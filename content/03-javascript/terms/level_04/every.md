# every()

> **Level 4 — Iteration & Array Methods**
> Tests whether all elements in the array pass the test implemented by the provided function.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — An ordered list of values.
- [some()](some.md) — Tests if *at least one* element passes the test.
---

## 2. Term Category
- **Array Method / Functional Programming**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Are they all strings?

**Problem:** You have an array: `["apple", "banana", 42, "cherry"]`. Use `every()` and the `typeof` operator to check if every single item in the array is a string.

**Expected output:**
> [!check]- Answer
> ```text
> false
> ```
> - `array.every(item => typeof item === "string")`

---

### Exercise 2: Validating Array Positive Numbers

**Problem:** Check if all items in `[2, 4, 6]` are even using `.every()`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> ```
> ```javascript
> const nums = [2, 4, 6];
> console.log(nums.every(x => x % 2 === 0));
> ```
>
> **Explanation:** `.every()` returns `true` if every element satisfies the testing predicate.

---

### Exercise 3: Short-Circuiting in `.every()`

**Problem:** Demonstrate that `.every()` stops testing upon encountering the first `false` element.

**Expected output:**
> [!check]- Answer
> ```text
> Tested: 1
> Tested: -2
> false
> ```
> ```javascript
> const res = [1, -2, 3].every(x => {
>   console.log(`Tested: ${x}`);
>   return x > 0;
> });
> console.log(res);
> ```
>
> **Explanation:** `.every()` short-circuits immediately when a falsy result is returned.


---

## 7. Related Terms
- [some()](some.md) — The lenient sibling. Returns true if *at least one* passes.
- [filter()](filter.md) — Actually extracts the elements that pass, rather than just returning true/false.
---

## 8. Key Takeaways
- `every()` returns a strict boolean: `true` or `false`.
- It returns `true` only if **all** elements pass the test.
- It "short-circuits" (stops executing) the moment it finds a falsy result.
- If called on an empty array, it always returns `true`.
