# typeof

> **Level 1 — Foundations**
> Operator that returns a string indicating the type of the unevaluated operand.

---

## 1. Prerequisites
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [Variable](variable.md) — A named container for storing data values.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript is dynamically typed. This means you don't explicitly declare that `let score` is a Number; you just assign `score = 10` and the engine figures it out. Because variables can hold any type of data and can even change types via reassignment or coercion, developers needed a way to ask the engine, "What kind of data is currently sitting inside this variable?"

The `typeof` operator was introduced to inspect a value at runtime and return a string representing its base type (e.g., `"string"`, `"number"`, `"boolean"`).

### (2) Reality Metaphor
Imagine a metal detector at an airport. You send a mystery bag (a variable) through the scanner (`typeof`), and the screen tells you the general category of what's inside: "Electronics" (Number), "Clothing" (String), or "Liquids" (Boolean). It doesn't tell you *exactly* what shirt is in there, just the general category.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
console.log(typeof 'Hello'); // "string"
console.log(typeof 42);      // "number"
console.log(typeof true);    // "boolean"
```

#### Fuller Example
```javascript
function processInput(input) {
  // In a dynamically typed language, we must manually check types
  // if our function expects a specific data type.
  if (typeof input === 'number') {
    console.log(`Processing number: ${input * 2}`);
  } else if (typeof input === 'string') {
    console.log(`Processing string: ${input.toUpperCase()}`);
  } else {
    throw new Error('Unsupported data type provided!');
  }
}

try {
  processInput(10);
  processInput('apple');
} catch (err) {
  console.error(err.message);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: The Array and Null Quirks

**The mistake:** Expecting `typeof` to accurately distinguish between Arrays, Objects, and `null`.

**Why it's wrong:** `typeof` groups almost all complex data structures under `"object"`. Furthermore, due to a legacy bug in JavaScript's original implementation, `typeof null` incorrectly returns `"object"`.

*Incorrect:*
```javascript
const list = [1, 2, 3];
if (typeof list === 'array') { // This will NEVER be true
  console.log("It's a list!");
}
```

*Fix:*
```javascript
const list = [1, 2, 3];
// typeof list returns "object". To check for arrays, use Array.isArray()
if (Array.isArray(list)) {
  console.log("It's a list!");
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Typeof Callbacks

**The mistake:** Passing methods from Typeof instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "typeof",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "typeof",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Typeof Operations

**The mistake:** Executing asynchronous operations within Typeof without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/typeof"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/typeof");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in typeof: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Exploring Edge Cases

**Problem:** Use `typeof` to log the type of the following values: `undefined`, `NaN`, `null`, and a function `function() {}`.

**Expected output:**
> [!check]- Answer
> ```text
> "undefined"
> "number"
> "object"
> "function"
> ```
> - Yes, `NaN` (Not a Number) is ironically of type `"number"`.
> - Functions are a special type of object, and `typeof` uniquely identifies them as `"function"`.

---

### Exercise 2: Typeof Return Values

**Problem:** Check `typeof` for `[]`, `{}`, `null`, `undefined`, and `Symbol()`.

**Expected output:**
> [!check]- Answer
> ```text
> object
> object
> object
> undefined
> symbol
> ```
> ```javascript
> console.log(typeof []);
> console.log(typeof {});
> console.log(typeof null);
> console.log(typeof undefined);
> console.log(typeof Symbol());
> ```
>
> **Explanation:** `typeof` returns standard primitive or object type string names.

---

### Exercise 3: Safely Checking Undeclared Functions

**Problem:** Check if a global function `myPlugin` is defined using `typeof`.

**Expected output:**
> [!check]- Answer
> ```text
> false
> ```
> ```javascript
> console.log(typeof myPlugin === "function");
> ```
>
> **Explanation:** `typeof` safely evaluates undeclared variables to `"undefined"` without crashing.

---

## 7. Related Terms
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [null](null.md) — The intentional absence of value.
- [undefined](undefined.md) — The uninitialized state.
- [BigInt](bigint.md) — Related concept: BigInt.
- [instanceof](../level_07/instanceof.md) — Related concept: instanceof.

---

## 8. Key Takeaways
- `typeof` is an operator, not a function (you don't need parentheses, just write `typeof myVar`).
- It returns a lowercase string representing the type (e.g., `"string"`).
- It is great for primitives but terrible for complex data types (Arrays, Dates, Null all return `"object"`).
