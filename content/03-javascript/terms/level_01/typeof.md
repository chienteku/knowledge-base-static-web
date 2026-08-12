# typeof

> **Level 1 — Foundations**
> Operator that returns a string indicating the type of the unevaluated operand.

---

## 1. Prerequisites
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [Variable](variable.md) — A named container for storing data values.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: typeof is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Polymorphic API Payload Type Inspector

**Scenario:** An API router validates dynamic payload fields, using typeof to route numbers, strings, objects, and functions to appropriate processing handlers.

**Requirements:**
1. Inspect input using typeof.
2. Return string identifier ("NUMBER", "STRING", "FUNCTION", "OBJECT").
3. Handle null explicitly to fix the historical typeof null === "object" bug.

> [!check]- Answer
> #### Implementation
> ```javascript
> function inspectPayloadType(payload) {
>   if (payload === null) {
>     return "NULL";
>   }
>   const rawType = typeof payload;
>   switch (rawType) {
>     case "number": return "NUMBER";
>     case "string": return "STRING";
>     case "function": return "FUNCTION";
>     case "object": return Array.isArray(payload) ? "ARRAY" : "OBJECT";
>     default: return rawType.toUpperCase();
>   }
> }
> // Verification tests
> console.assert(inspectPayloadType(42) === "NUMBER", "Test 1 Failed");
> console.assert(inspectPayloadType(null) === "NULL", "Test 2 Failed");
> console.assert(inspectPayloadType([1, 2]) === "ARRAY", "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Typeof Return Values**: typeof evaluates to one of 8 literal strings: "undefined", "boolean", "number", "bigint", "string", "symbol", "function", or "object".
> 2. **The typeof null Legacy Artifact**: typeof null returns "object", a historical bug in JS preserved for backward compatibility.
> 3. **Array Classification**: Both arrays and objects return "object"; use Array.isArray() to distinguish arrays.
> 
---

### Exercise 2: Undeclared Variable Inspection Guard

**Scenario:** A feature detection utility checks for browser global objects (e.g. window.ethereum) without triggering a ReferenceError when inspecting undeclared variables.

**Requirements:**
1. Check if a variable exists using typeof variable !== "undefined".
2. Return boolean status safely.

> [!check]- Answer
> #### Implementation
> ```javascript
> const hasGlobalThis = typeof globalThis !== "undefined";
> // Verification tests
> console.assert(hasGlobalThis === true, "Test 1 Failed");
> const hasFakeVar = typeof unassignedGlobalVar !== "undefined";
> console.assert(hasFakeVar === false, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Undeclared Variable Safety**: typeof is the only operator that can safely inspect an undeclared variable without throwing a ReferenceError.
> 2. **Uninitialized vs Undeclared**: Both uninitialized variables (let x;) and undeclared variables return "undefined".
> 3. **Unary Operator**: typeof is a unary operator that takes a single operand expression.
> 
---

### Exercise 3: Primitive vs Object Classifier Utility

**Scenario:** A deep cloning utility classifies incoming properties to determine whether to copy values directly or recursively clone objects.

**Requirements:**
1. Return true for primitives (including null).
2. Return false for objects and functions.

> [!check]- Answer
> #### Implementation
> ```javascript
> function isPrimitive(val) {
>   if (val === null) return true;
>   const type = typeof val;
>   return type !== "object" && type !== "function";
> }
> // Verification tests
> console.assert(isPrimitive("hello") === true, "Test 1 Failed");
> console.assert(isPrimitive(100) === true, "Test 2 Failed");
> console.assert(isPrimitive({}) === false, "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Primitive Classification**: Primitives consist of strings, numbers, booleans, bigints, symbols, undefined, and null.
> 2. **Functions as Objects**: In JavaScript, functions are first-class callable objects; typeof fn returns "function".
> 3. **Cloning Decisions**: Primitive values can be copied directly by value, whereas objects require reference tracking or recursive cloning.
---

## 6. Related Terms
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [null](null.md) — The intentional absence of value.
- [undefined](undefined.md) — The uninitialized state.
- [BigInt](bigint.md) — Related concept: BigInt.
- [instanceof](../level_07/instanceof.md) — Related concept: instanceof.

---

## 7. Key Takeaways
- `typeof` is an operator, not a function (you don't need parentheses, just write `typeof myVar`).
- It returns a lowercase string representing the type (e.g., `"string"`).
- It is great for primitives but terrible for complex data types (Arrays, Dates, Null all return `"object"`).
