# Destructuring

> **Level 8 — Modern JavaScript (ES6+)**
> Syntax for extracting values from arrays or properties from objects into distinct variables.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — Extracting from arrays.
- [Object](../level_02/object.md) — Extracting from objects.

---

## 2. Term Category
- **Syntax Feature** *(Introduced in ES6)*

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before ES6, if you had an object with 5 properties and you wanted to save 3 of them into local variables, you had to write 3 separate, repetitive lines of code: `const x = obj.x; const y = obj.y; const z = obj.z;`. The same problem existed for pulling the first few items out of an Array.

The language designers realized this was incredibly tedious. They introduced **Destructuring Assignment**, which allows you to "unpack" an object or an array on the right side of an equals sign, and map those values directly into multiple variables on the left side, all in a single, clean line of code.

### (2) Reality Metaphor
Imagine receiving a gift basket (an Object) containing an apple, a banana, and a pear.
Without destructuring, you have to write instructions: "Take the apple out and put it on the table. Now take the banana out and put it on the table."
With destructuring, you simply hold out both hands and say: "Give me the apple and the banana," and the basket magically places both fruits directly into your hands at the same time.

### (3) JavaScript Code Examples

#### Short Snippet: Object Destructuring
```javascript
const user = {
  name: "Alice",
  age: 28,
  role: "Admin"
};

// We create two new variables 'name' and 'role', 
// and fill them with the matching keys from 'user'!
const { name, role } = user;

console.log(name); // "Alice"
console.log(role); // "Admin"
```

#### Fuller Example: Arrays and Aliasing
```javascript
// --- ARRAY DESTRUCTURING ---
const rgbColors = [255, 128, 0];

// Arrays destructure based on strict ORDER, not name!
const [red, green, blue] = rgbColors;
console.log(green); // 128

// --- OBJECT ALIASING ---
const apiResponse = { data: "Secret Info", status: 200 };

// What if we want to rename the variable?
// We use a colon: { oldName: newName }
const { data: secretData, status } = apiResponse;

console.log(secretData); // "Secret Info"
// console.log(data); // ReferenceError! 'data' variable doesn't exist.
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Destructuring Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Destructuring blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "destructuring";
```

*Fix:*
```javascript
let value = "destructuring";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Destructuring Callbacks

**The mistake:** Passing methods from Destructuring instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "destructuring",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "destructuring",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Destructuring Operations

**The mistake:** Executing asynchronous operations within Destructuring without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/destructuring"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/destructuring");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in destructuring: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Skipping Array Elements

**Problem:** You have an array `const topThree = ["Gold", "Silver", "Bronze"]`. Write a destructuring assignment that only creates a variable for the "Bronze" medal, completely ignoring Gold and Silver.

**Expected output:**
```javascript
// You can skip elements by leaving commas!
const [, , thirdPlace] = topThree;
console.log(thirdPlace); // "Bronze"
```

> [!check]- Answer
> - Just put commas without a variable name!

---

### Exercise 2: Renaming Variables during Destructuring

**Problem:** Rename property `first_name` to variable `firstName` when destructuring `{ first_name: "Alice" }`.

**Expected output:**
```text
Alice
```

> [!check]- Answer
> ```javascript
> const user = { first_name: "Alice" };
> const { first_name: firstName } = user;
> console.log(firstName);
> ```
>
> **Explanation:** Syntax `{ key: localName }` renames object properties to local variable names.

### Exercise 3: Swapping Variables without Temporary Storage

**Problem:** Swap `let a = 1; let b = 2;` using array destructuring `[a, b] = [b, a]`.

**Expected output:**
```text
a: 2, b: 1
```

> [!check]- Answer
> ```javascript
> let a = 1;
> let b = 2;
> [a, b] = [b, a];
> console.log(`a: ${a}, b: ${b}`);
> ```
>
> **Explanation:** Array destructuring assignment swaps variable values inline.

---

---

## 7. Related Terms
- [Rest Parameter](./rest_parameter.md) — Often used inside destructuring to gather the "leftover" items.
- [Object](../level_02/object.md) — The structure most commonly destructured.

---

## 8. Key Takeaways
- Destructuring cleanly extracts values from Objects and Arrays into local variables.
- Object destructuring uses `{}` and matches by property **name**.
- Array destructuring uses `[]` and matches by **order**.
- You can rename object properties during extraction using `oldName: newName`.
