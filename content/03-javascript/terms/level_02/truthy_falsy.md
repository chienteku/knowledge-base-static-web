# Truthy / Falsy

> **Level 2 — Control Flow & Data Structures**
> Values that evaluate to `true` or `false` in a boolean context. Falsy values: `false`, `0`, `""`, `null`, `undefined`, `NaN`.

---

## 1. Prerequisites
- [Boolean](../level_01/boolean.md) — A logical entity having two values: `true` or `false`.
- [Type Coercion](../level_01/type_coercion.md) — Implicit conversion of values from one data type to another.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In strongly typed languages, an `if` statement strictly requires a Boolean (`true` or `false`). If you pass a string or a number into an `if` statement, the program crashes. 

JavaScript was designed to be loose and forgiving. Instead of crashing, the JavaScript engine uses Type Coercion to automatically convert whatever value you give it into a Boolean. 
If the value converts to `false`, it is known as a "Falsy" value. 
If it converts to `true`, it is known as a "Truthy" value. This allows developers to write shorter, more expressive code like `if (username)` instead of `if (username !== "")`.

### (2) Reality Metaphor
Imagine a bouncer at a club. The official rule is "You must have a VIP pass (`true`) to enter." But the bouncer is flexible (JavaScript). 
If you don't have a pass, but you are wearing a nice suit (a populated string like `"hello"`), he considers that "close enough to VIP" (Truthy) and lets you in.
If you show up with empty pockets (`undefined`) or holding nothing but air (`""`), he considers that Falsy and denies you entry.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// An empty string is Falsy
if ("") {
  console.log("This will NOT run.");
}

// A string with spaces is Truthy!
if (" ") {
  console.log("This WILL run.");
}
```

#### Fuller Example
```javascript
function greetUser(name) {
  // If `name` is undefined, null, or an empty string, it evaluates to false
  if (name) {
    console.log(`Hello, ${name}!`);
  } else {
    console.log("Hello, Guest!");
  }
}

greetUser("Alice"); // Truthy -> "Hello, Alice!"
greetUser("");      // Falsy -> "Hello, Guest!"
greetUser();        // undefined is Falsy -> "Hello, Guest!"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: The `0` trap

**The mistake:** Assuming that a numerical value of `0` means the user inputted valid data, and checking it with a truthy check.

**Why it's wrong:** The number `0` is Falsy in JavaScript. If a user tries to input `0` as their age or score, and you use a truthy check (`if (score)`), the program will treat it as if they inputted nothing at all!

*Incorrect:*
```javascript
const userScore = 0;

if (userScore) {
  // This block gets skipped because 0 is Falsy!
  console.log(`Your score is ${userScore}`);
} else {
  console.log("No score provided."); // Prints this instead!
}
```

*Fix:*
```javascript
const userScore = 0;

// Explicitly check for undefined or null if 0 is a valid number
if (userScore !== undefined && userScore !== null) {
  console.log(`Your score is ${userScore}`);
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Truthy Falsy Callbacks

**The mistake:** Passing methods from Truthy Falsy instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "truthy_falsy",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "truthy_falsy",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Truthy Falsy Operations

**The mistake:** Executing asynchronous operations within Truthy Falsy without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/truthy_falsy"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/truthy_falsy");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in truthy_falsy: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Truthy or Falsy?

**Problem:** Look at the following values. Predict whether they are Truthy or Falsy.
1. `"false"` (a string)
2. `0`
3. `[]` (an empty array)
4. `NaN`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Truthy (Any non-empty string is truthy, even the word "false"!)
> 2. Falsy
> 3. Truthy (All objects and arrays are truthy, even if they are empty!)
> 4. Falsy
> ```
> - There are only 6 falsy values in JavaScript: `false`, `0`, `""` (empty string), `null`, `undefined`, and `NaN`. Everything else is Truthy.

---

### Exercise 2: Falsy Value Identification

**Problem:** Filter an array `[0, "", "hello", null, 42, undefined, NaN, false]` to extract only truthy values.

**Expected output:**
> [!check]- Answer
> ```text
> ["hello",42]
> ```
> ```javascript
> const items = [0, "", "hello", null, 42, undefined, NaN, false];
> const truthy = items.filter(Boolean);
> console.log(JSON.stringify(truthy));
> ```
>
> **Explanation:** `Array.prototype.filter(Boolean)` removes all 8 falsy JavaScript values.

---

### Exercise 3: Boolean Type Coercion with `Boolean()`

**Problem:** Test truthiness of `"0"`, `"false"`, `[]`, `{}` using `Boolean()`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> true
> true
> true
> ```
> ```javascript
> console.log(Boolean("0"));
> console.log(Boolean("false"));
> console.log(Boolean([]));
> console.log(Boolean({}));
> ```
>
> **Explanation:** Non-empty strings and object references are always truthy in JavaScript.


---

## 7. Related Terms
- [Type Coercion](../level_01/type_coercion.md) — Automatic conversion of values from one data type to another.
- [Boolean](../level_01/boolean.md) — Related concept: Boolean.
- [Comparison Operators](../level_01/comparison_operators.md) — Related concept: Comparison Operators.
- [Strict vs Loose Equality (=== vs ==)](../level_01/strict_vs_loose_equality.md) — Related concept: Strict vs Loose Equality (=== vs ==).
- [Ternary / Conditional Operator (? :)](../level_01/ternary_operator.md) — Related concept: Ternary / Conditional Operator (? :).
- [if / else](if_else.md) — Related concept: if / else.

---

## 8. Key Takeaways
- Falsy values evaluate to `false` in conditionals.
- **Memorize the 6 falsy values**: `false`, `0`, `""`, `null`, `undefined`, and `NaN`.
- Everything that is not on that list of 6 is Truthy. This includes empty arrays `[]` and empty objects `{}`.
- Be extremely careful when doing truthy checks on numbers, because `0` will trigger the `else` block.
