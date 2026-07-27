# new Keyword

> **Level 7 — Objects & Prototypes**
> Creates an instance of a user-defined object type or a built-in object type.

---

## 1. Prerequisites
- [Constructor Function](./constructor_function.md) — The function that `new` invokes.
- [`this` Keyword](./this_keyword.md) — The context `new` binds.

---

## 2. Term Category
- **Language Core / Operator**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript designers wanted developers to easily stamp out multiple copies of an object using [Constructor Functions](./constructor_function.md). But a Constructor is just a regular function; how does the engine know to treat it like a factory? 

They introduced the `new` operator. When you put `new` in front of a function call, you are issuing a 4-step command to the JavaScript engine. It automates the tedious boilerplate of creating an object, linking its prototype, applying `this`, and returning the object.

### (2) Reality Metaphor
The `new` keyword is like handing a blank passport to an immigration officer.
When you approach the desk and say `new`, the officer:
1. Grabs a blank passport book (creates an empty object).
2. Stamps it with the country's official seal (links the Prototype).
3. Fills in your specific name and eye color (binds `this` and runs the function).
4. Hands the completed passport back to you (returns the object).

### (3) JavaScript Code Examples

#### Short Snippet: The Magic 4 Steps
```javascript
function Player(name) {
  this.name = name;
  this.score = 0;
}

// The 'new' keyword triggers 4 invisible steps under the hood:
const p1 = new Player("Alice"); 

/* What 'new' secretly did:
1. Created a brand new empty object: {}
2. Linked that object's prototype to Player.prototype
3. Called Player("Alice"), forcing 'this' to point to the new {}
4. Secretly returned the new object: return this;
*/
```

#### Fuller Example: Built-in Objects
```javascript
// We don't just use 'new' for our own functions. 
// We use it for JavaScript's built-in Constructors too!

const today = new Date(); // Creates a Date object instance
const error = new Error("Something broke!"); // Creates an Error object instance
const map = new Map(); // Creates a Map data structure

console.log(today.getFullYear());
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding New Keyword Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within New Keyword blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "new_keyword";
```

*Fix:*
```javascript
let value = "new_keyword";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in New Keyword Callbacks

**The mistake:** Passing methods from New Keyword instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "new_keyword",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "new_keyword",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in New Keyword Operations

**The mistake:** Executing asynchronous operations within New Keyword without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/new_keyword"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/new_keyword");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in new_keyword: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: What did you return?

**Problem:** By default, `new` automatically returns the `this` object. What happens if you explicitly write `return { test: "Oops" }` inside your constructor?

**Expected output:**
```text
If a constructor explicitly returns a non-primitive Object, the `new` keyword will respect that and return the custom object INSTEAD of the `this` object! (If you return a primitive like a string or number, it ignores it and returns `this`).
```

> [!check]- Answer
> - Constructors shouldn't have `return` statements for exactly this reason!

---

### Exercise 2: Tracing `new` Execution Steps

**Problem:** List 4 internal actions performed when calling `new Constructor()`.

**Expected output:**
```text
1. Create obj, 2. Set prototype, 3. Bind this & execute, 4. Return obj
```

> [!check]- Answer
> ```javascript
> console.log("1. Create obj, 2. Set prototype, 3. Bind this & execute, 4. Return obj");
> ```
>
> **Explanation:** `new` creates a blank object, binds its `__proto__`, executes constructor with `this`, and returns object.

### Exercise 3: Overriding Constructor Return with Objects

**Problem:** Demonstrate that returning `{ custom: true }` from a constructor overrides `new` creation.

**Expected output:**
```text
true
```

> [!check]- Answer
> ```javascript
> function Demo() {
>   return { custom: true };
> }
> console.log(new Demo().custom);
> ```
>
> **Explanation:** Returning object references from constructor functions explicitly overrides standard instance return values.

---

---

## 7. Related Terms
- [Constructor Function](./constructor_function.md) — What the `new` keyword is designed to call.
- [Class](./class.md) — The modern ES6 syntax, which *strictly requires* the `new` keyword to be used.

---

## 8. Key Takeaways
- The `new` keyword is an operator used to instantiate objects.
- It performs 4 secret steps: Creates `{}`, links the prototype, binds `this`, and returns the object.
- It is required when using ES6 Classes or traditional Constructor Functions.
- It cannot be used with Arrow Functions.
