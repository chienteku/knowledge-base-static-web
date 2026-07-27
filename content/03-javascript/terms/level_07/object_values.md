# Object.values()

> **Level 7 — Objects & Prototypes**
> Returns an array of a given object's own enumerable string-keyed property values.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The collection of key-value pairs.
- [`Object.keys()`](./object_keys.md) — The sibling method.

---

## 2. Term Category
- **Built-in Method** *(Object, Introduced in ES8 / 2017)*

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
After developers used `Object.keys()` for years, they realized a common pattern: they would get the keys array, just so they could loop through it and use `obj[key]` to extract the actual data (the values). 

The language designers realized this was an unnecessary middle step. If developers just want the data inside the object, why force them to extract the keys first? In ES8, they introduced `Object.values()`. It skips the keys entirely and extracts only the right-side data of the key-value pairs, returning them in a clean Array.

### (2) Reality Metaphor
Imagine a massive filing cabinet (the Object).
`Object.values()` is like asking the secretary to open every single drawer, pull out the physical documents inside (the values), and hand you a stack of the documents, completely ignoring the labels on the outside of the folders.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const user = {
  name: "Alice",
  age: 28,
  isAdmin: true
};

// Extracting just the data into an Array
const valuesArray = Object.values(user);

console.log(valuesArray); 
// Output: ["Alice", 28, true]
```

#### Fuller Example: Calculating a Total
```javascript
// Imagine a shopping cart object
const cartPrices = {
  shoes: 50.00,
  shirt: 20.00,
  hat: 15.00
};

// We don't care about the names of the items, we just need to sum the math!
const prices = Object.values(cartPrices); // [50.00, 20.00, 15.00]

let total = 0;
prices.forEach(price => {
  total += price;
});

console.log(`Your total is $${total}`);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Object Values Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Object Values blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "object_values";
```

*Fix:*
```javascript
let value = "object_values";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Object Values Callbacks

**The mistake:** Passing methods from Object Values instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "object_values",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "object_values",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Object Values Operations

**The mistake:** Executing asynchronous operations within Object Values without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/object_values"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/object_values");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in object_values: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The Value Search

**Problem:** You have an object mapping user IDs to their status: `const users = { u1: "offline", u2: "online", u3: "offline" }`. Using `Object.values()` and the array `.includes()` method, write a single line of code to check if ANY user is "online".

**Expected output:**
```javascript
const isAnyoneOnline = Object.values(users).includes("online");
console.log(isAnyoneOnline); // true
```

> [!check]- Answer
> - Extract the values into an array, then immediately chain `.includes()`.

---

### Exercise 2: Summing Object Numerical Values

**Problem:** Sum values of `{ apples: 5, oranges: 10 }` using `Object.values()` and `.reduce()`.

**Expected output:**
```text
15
```

> [!check]- Answer
> ```javascript
> const inventory = { apples: 5, oranges: 10 };
> const total = Object.values(inventory).reduce((a, b) => a + b, 0);
> console.log(total);
> ```
>
> **Explanation:** `Object.values()` extracts an array of own property values for reduction.

### Exercise 3: Checking Value Inclusion with `.includes()`

**Problem:** Check if value `"admin"` exists in `{ role: "admin" }` using `Object.values(obj).includes(...)`.

**Expected output:**
```text
true
```

> [!check]- Answer
> ```javascript
> const user = { role: "admin" };
> console.log(Object.values(user).includes("admin"));
> ```
>
> **Explanation:** `Object.values()` enables array search methods over object value fields.

---

---

## 7. Related Terms
- [`Object.keys()`](./object_keys.md) — Returns the keys instead of the values.
- [`Object.entries()`](./object_entries.md) — Returns both!

---

## 8. Key Takeaways
- `Object.values(obj)` returns an Array containing the data (values) from an object.
- It completely ignores the keys (property names).
- It is the fastest way to extract all data from an object for summation, filtering, or processing.
- Like `.keys()`, it ignores inherited prototype properties.
