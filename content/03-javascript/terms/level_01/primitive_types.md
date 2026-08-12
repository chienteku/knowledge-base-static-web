# Primitive Types

> **Level 1 — Foundations**
> Basic immutable data types: `String`, `Number`, `Boolean`, `Undefined`, `Null`, `Symbol`, `BigInt`.

---

## 1. Prerequisites
- [Variable](variable.md) — A named container for storing data values.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Primitive Types is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Primitive Value Copy vs Reference Mutation Inspector

**Scenario:** A state management library validates that primitive values (string, number, boolean, bigint, symbol, undefined, null) are copied by value, ensuring immutability when passed to functions.

**Requirements:**
1. Write a function testPrimitiveImmutability(originalNum, originalStr).
2. Modify local copies inside the function.
3. Verify that original primitive arguments remain completely unchanged.

> [!check]- Answer
> #### Implementation
> ```javascript
> function testPrimitiveImmutability(num, str) {
>   let copyNum = num;
>   let copyStr = str;
>   copyNum += 100;
>   copyStr += " WORLD";
>   return {
>     numUnchanged: num === 10,
>     strUnchanged: str === "HELLO"
>   };
> }
> // Verification tests
> const n = 10;
> const s = "HELLO";
> const res = testPrimitiveImmutability(n, s);
> console.assert(res.numUnchanged === true && res.strUnchanged === true, "Test 1 Failed");
> ```
> #### Technical Explanation
> 1. **Pass-by-Value**: Primitive values are stored directly in stack memory and passed by value (copied on assignment).
> 2. **Immutability**: Primitive values themselves cannot be mutated; operations on primitives create entirely new primitive values.
> 3. **The 7 Primitives**: JavaScript has 7 primitive types: number, string, boolean, bigint, symbol, undefined, and null.
> 
---

### Exercise 2: Primitive Type Categorizer & Serializer

**Scenario:** An API serializer categorizes payload values into primitive vs non-primitive types and builds a type summary diagnostic map.

**Requirements:**
1. Check if input is a primitive type using typeof and null checks.
2. Return object { isPrimitive: boolean, type: string }.

> [!check]- Answer
> #### Implementation
> ```javascript
> function inspectPrimitiveType(value) {
>   if (value === null) {
>     return { isPrimitive: true, type: "null" };
>   }
>   const typeStr = typeof value;
>   const primitiveTypes = ["string", "number", "boolean", "bigint", "symbol", "undefined"];
>   const isPrimitive = primitiveTypes.includes(typeStr);
>   return { isPrimitive, type: isPrimitive ? typeStr : "object" };
> }
> // Verification tests
> console.assert(inspectPrimitiveType("hello").isPrimitive === true, "Test 1 Failed");
> console.assert(inspectPrimitiveType(42n).type === "bigint", "Test 2 Failed");
> console.assert(inspectPrimitiveType(null).type === "null", "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Typeof Anomalies**: typeof null returns "object", requiring an explicit value === null check when identifying primitives.
> 2. **Primitive Collection**: All non-primitive values in JS inherit from Object.
> 3. **Stack Storage**: Primitives are lightweight and stored directly in stack frames.
> 
---

### Exercise 3: Auto-Boxing Mechanism Inspector

**Scenario:** A JavaScript engine utility demonstrates auto-boxing: accessing methods on primitive strings ("hello".toUpperCase()) temporarily wraps the primitive in a Object wrapper before returning the primitive result.

**Requirements:**
1. Call string and number primitive methods (.toUpperCase(), .toFixed()).
2. Verify that the primitive itself remains an immutable primitive type.

> [!check]- Answer
> #### Implementation
> ```javascript
> function inspectAutoBoxing(primitiveStr, primitiveNum) {
>   const upper = primitiveStr.toUpperCase();
>   const formatted = primitiveNum.toFixed(2);
>   const isStrPrimitive = typeof primitiveStr === "string";
>   const isNumPrimitive = typeof primitiveNum === "number";
>   return { upper, formatted, isStrPrimitive, isNumPrimitive };
> }
> // Verification tests
> const res = inspectAutoBoxing("javascript", 42.1);
> console.assert(res.upper === "JAVASCRIPT", "Test 1 Failed");
> console.assert(res.formatted === "42.10", "Test 2 Failed");
> console.assert(res.isStrPrimitive && res.isNumPrimitive, "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Auto-Boxing Mechanism**: When a method is called on a primitive, JavaScript temporarily wraps it in its object equivalent (e.g. String, Number).
> 2. **Transient Wrapper Disposal**: As soon as the method execution completes, the temporary wrapper object is discarded by garbage collection.
> 3. **Primitive Preservation**: Auto-boxing allows primitives to access helper methods without sacrificing lightweight stack storage performance.
---

## 6. Related Terms
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

## 7. Key Takeaways
- There are 7 primitive types: `String`, `Number`, `Boolean`, `Undefined`, `Null`, `Symbol`, and `BigInt`.
- Primitives are passed by **value**, meaning a copy is made when you assign them to a new variable.
- Primitives are **immutable**; their values cannot be changed in memory. You can only reassign a variable to point to a new primitive value.
