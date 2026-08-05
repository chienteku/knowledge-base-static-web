# Primitive Types

> **Level 1 — Foundations**
> Basic immutable data types: `String`, `Number`, `Boolean`, `Undefined`, `Null`, `Symbol`, `BigInt`.

---

## 1. Prerequisites
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
At its core, a computer processor only understands bits (0s and 1s). To make programming human-readable, language designers create higher-level abstractions. In JavaScript, we needed a fundamental set of "building blocks" to represent the most basic forms of data: text, math, truth, and emptiness. 

These building blocks are called "Primitives". They are designed to be simple, fast, and most importantly, **immutable**. When you manipulate a primitive value, you aren't changing the original value in memory; you are creating an entirely new value. This immutability makes primitives predictable and safe to pass around in your code.

### (2) Reality Metaphor
Primitive types are like chemical elements (Hydrogen, Oxygen, Gold). They are the fundamental, indivisible building blocks of matter. You cannot break a gold atom down into "smaller" pieces of gold. You can combine them to make complex molecules (Objects and Arrays), but the base elements themselves are atomic and unchangeable.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Examples of different primitive types
const name = 'Alice'; // String
const age = 28;       // Number
const isCool = true;  // Boolean
const empty = null;   // Null
```

#### Fuller Example
```javascript
// Demonstrating the immutability of primitives
let message = 'Hello';
let originalMessage = message; // Copies the value 'Hello'

// String methods return NEW strings, they don't change the original
message.toUpperCase(); 

console.log(message); // Still 'Hello'

// We must reassign the variable to store the new value
message = message.toUpperCase(); 

console.log(message); // 'HELLO'
console.log(originalMessage); // 'Hello' - the original copy is untouched
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to mutate a primitive

**The mistake:** Attempting to add properties to a primitive or change a specific character in a string.

**Why it's wrong:** Primitives are immutable. They do not have properties that can be permanently altered. While JavaScript temporarily wraps primitives in objects so you can call methods on them (like `.toUpperCase()`), any changes are immediately discarded.

*Incorrect:*
```javascript
let str = 'cat';
str[0] = 'b'; // Trying to change 'cat' to 'bat'
console.log(str); // Still outputs 'cat'!
```

*Fix:*
```javascript
let str = 'cat';
// Create a completely new string and reassign it
str = 'b' + str.slice(1);
console.log(str); // 'bat'
```

---

### Mistake 2: Losing Context Binding (`this`) in Primitive Types Callbacks

**The mistake:** Passing methods from Primitive Types instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "primitive_types",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "primitive_types",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Primitive Types Operations

**The mistake:** Executing asynchronous operations within Primitive Types without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/primitive_types"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/primitive_types");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in primitive_types: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Identify the Primitive

**Problem:** Create five variables, assigning one of each of the five most common primitive types (String, Number, Boolean, Undefined, Null) to them. Use the `typeof` operator to log the type of each variable.

**Expected output:**
> [!check]- Answer
> ```text
> string
> number
> boolean
> undefined
> object (Note: typeof null is an infamous historical bug!)
> ```
> - `undefined` is the default value for an uninitialized variable.
> - To use `typeof`, simply type `typeof variableName`.

---

### Exercise 2: Identifying All 7 JavaScript Primitives

**Problem:** List all 7 primitive types in JavaScript and test their `typeof` outputs.

**Expected output:**
> [!check]- Answer
> ```text
> string, number, boolean, undefined, object, symbol, bigint
> ```
> ```javascript
> console.log(typeof "text");
> console.log(typeof 42);
> console.log(typeof true);
> console.log(typeof undefined);
> console.log(typeof null); // "object" (legacy bug)
> console.log(typeof Symbol());
> console.log(typeof 10n);
> ```
>
> **Explanation:** JavaScript contains 7 primitive types: string, number, boolean, undefined, null, symbol, and bigint.

---

### Exercise 3: Primitive Copy-by-Value Behavior

**Problem:** Demonstrate that assigning `let b = a` for primitives copies the value, leaving `a` unaffected when `b` changes.

**Expected output:**
> [!check]- Answer
> ```text
> a: 10, b: 20
> ```
> ```javascript
> let a = 10;
> let b = a;
> b = 20;
> console.log(`a: ${a}, b: ${b}`);
> ```
>
> **Explanation:** Primitive values are passed and assigned by value, creating independent copies.


---

## 7. Related Terms
- [typeof](typeof.md) — Operator that returns a string indicating the type.
- [String](string.md) — A sequence of characters.
- [Number](number.md) — Represents numerical values.
- [BigInt](bigint.md) — Related concept: BigInt.
- [Boolean](boolean.md) — Related concept: Boolean.
- [Dynamic & Weak Typing](dynamic_weak_typing.md) — Related concept: Dynamic & Weak Typing.
- [undefined](undefined.md) — Related concept: undefined.
- [TypeScript](../level_10/typescript.md) — Related concept: TypeScript.
- [Reference vs Value (copy semantics)](../level_07/reference_vs_value.md) — Value vs reference semantics.
- [ECMAScript](ecmascript.md) — Related concept: ECMAScript.
---

## 8. Key Takeaways
- There are 7 primitive types: `String`, `Number`, `Boolean`, `Undefined`, `Null`, `Symbol`, and `BigInt`.
- Primitives are passed by **value**, meaning a copy is made when you assign them to a new variable.
- Primitives are **immutable**; their values cannot be changed in memory. You can only reassign a variable to point to a new primitive value.
