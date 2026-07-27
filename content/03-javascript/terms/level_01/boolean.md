# Boolean

> **Level 1 — Foundations**
> A logical entity having two values: `true` or `false`.

---

## 1. Prerequisites
- [Primitive Types](../level_01/primitive_types.md) — Basic immutable data types.
- [Variable](../level_01/variable.md) — A named container for storing data values.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Named after mathematician George Boole, the Boolean data type is the bedrock of computer logic. To allow a program to make decisions (branching), it needs a way to represent a binary state: yes/no, on/off, true/false. Without booleans, we wouldn't be able to write `if...else` statements or control the flow of an application based on conditions like "is the user logged in?"

### (2) Reality Metaphor
A boolean is like a simple light switch. The light is either ON (`true`) or OFF (`false`). There is no in-between state, no dimming. It's an absolute binary choice.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const isUserLoggedIn = true;
const hasPremiumSubscription = false;

console.log(typeof isUserLoggedIn); // "boolean"
```

#### Fuller Example
```javascript
const userAge = 20;
const requiredAge = 18;

// Comparison operators return a boolean value
const isOldEnough = userAge >= requiredAge;

if (isOldEnough) {
  console.log("Welcome to the site.");
} else {
  console.log("Access denied.");
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing boolean strings with actual booleans

**The mistake:** Wrapping `true` or `false` in quotes, creating a String instead of a Boolean.

**Why it's wrong:** A non-empty string in JavaScript evaluates to a "truthy" value. So `"false"` is actually evaluated as `true` in a conditional statement!

*Incorrect:*
```javascript
const isReady = "false"; // This is a String!

if (isReady) {
  // This WILL run because a non-empty string is "truthy"
  console.log("We are ready!"); 
}
```

*Fix:*
```javascript
const isReady = false; // This is a proper Boolean

if (isReady) {
  // This will NOT run
  console.log("We are ready!");
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Boolean Callbacks

**The mistake:** Passing methods from Boolean instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "boolean",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "boolean",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Boolean Operations

**The mistake:** Executing asynchronous operations within Boolean without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/boolean"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/boolean");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in boolean: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Logic Check

**Problem:** Declare a variable `isRaining` and set it to `false`. Declare `hasUmbrella` and set it to `true`. Write a condition that logs "You can go outside" if it is not raining OR if you have an umbrella.

**Expected output:**
```text
You can go outside
```

> [!check]- Answer
> - The logical NOT operator is `!`.
> - The logical OR operator is `||`.
> - Combine them: `(!isRaining || hasUmbrella)`

---

### Exercise 2: Double NOT `!!` Boolean Coercion

**Problem:** Coerce values `"hello"`, `0`, `null`, `[]`, `{}` into explicit boolean primitives using `!!`.

**Expected output:**
```text
true
false
false
true
true
```

> [!check]- Answer
> ```javascript
> console.log(!!"hello");
> console.log(!!0);
> console.log(!!null);
> console.log(!![]);
> console.log(!!{});
> ```
>
> **Explanation:** `!!value` coerces truthy values to `true` and falsy values (`0`, `null`, `undefined`, `NaN`, `""`, `false`) to `false`.

### Exercise 3: Boolean Constructor vs Boolean Function

**Problem:** Demonstrate the difference between `Boolean(0)` (primitive) and `new Boolean(0)` (object).

**Expected output:**
```text
false
true
```

> [!check]- Answer
> console.log(Boolean(0)); // false (primitive boolean)
> console.log(!!new Boolean(0)); // true (object instance is truthy)
> ```
>
> **Explanation:** Calling `Boolean(val)` casts to primitive boolean, whereas `new Boolean(val)` constructs an object wrapper.

---

---

## 7. Related Terms
- [Primitive Types](../level_01/primitive_types.md) — Basic immutable data types.
- [Truthy / Falsy](../level_02/truthy_falsy.md) — Values that evaluate to true or false in a boolean context.

---

## 8. Key Takeaways
- Booleans only have two possible values: `true` and `false`.
- They are primarily used in conditional statements to control the flow of the program.
- Comparison operators (like `>`, `<`, `===`) always return a boolean value.
