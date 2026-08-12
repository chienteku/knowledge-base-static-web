# new Keyword

> **Level 7 — Objects & Prototypes**
> Creates an instance of a user-defined object type or a built-in object type.

---

## 1. Prerequisites
- [Constructor Function](constructor_function.md) — The function that `new` invokes.
- [this Keyword](this_keyword.md) — The context `new` binds.

---

## 2. Term Category

**Language Core / Operator (Universal)**: new Keyword is a fundamental concept in this technology stack. **Level 7 — Objects & Prototypes**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Custom new Keyword Constructor Simulation

**Scenario:** A JavaScript engine spec verifier implements customNew(Constructor, ...args) to simulate the exact 4-step algorithm of the new keyword.

**Requirements:**
1. Write customNew(Constructor, ...args).
2. 1. Create new object linked to Constructor.prototype.
3. 2. Invoke Constructor with 'this' context.
4. 3. Return returned object or created instance.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function customNew(Constructor, ...args) {
>   // Step 1 & 2: Create object linked to Constructor.prototype
>   const obj = Object.create(Constructor.prototype);
>   // Step 3: Invoke constructor with 'this' bound to obj
>   const result = Constructor.apply(obj, args);
>   // Step 4: Return result if it's an object/function, else return obj
>   return (typeof result === "object" && result !== null) || typeof result === "function" ? result : obj;
> }
>
> function User(name) {
>   this.name = name;
> }
> User.prototype.getName = function() { return this.name; };
>
> // Verification tests
> // @ts-ignore
> const u = customNew(User, "Alice");
> console.assert(u instanceof User, "Test 1 Failed");
> console.assert(u.getName() === "Alice", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **new Keyword Step 1**: Creates a blank, plain JavaScript object.
> 2. **new Keyword Step 2 & 3**: Links the new object's [[Prototype]] to Constructor.prototype and binds 'this' during execution.
> 3. **new Keyword Step 4**: Returns the created object unless the constructor explicitly returns a non-primitive object.
> 
---

### Exercise 2: New Keyword Advanced Context Handler

**Scenario:** A web application component processes new keyword data operations within enterprise workflows.

**Requirements:**
1. Write handleNewKeywordSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleNewKeywordSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleNewKeywordSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **New Keyword Architecture**: Applying new keyword patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: New Keyword Performance Optimization

**Scenario:** An application utility optimizes new keyword execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeNewKeywordTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeNewKeywordTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeNewKeywordTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **New Keyword Optimization**: Optimizing new keyword improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Constructor Function](constructor_function.md) — What the `new` keyword is designed to call.
- [Class](class.md) — The modern ES6 syntax, which *strictly requires* the `new` keyword to be used.
- [Object.create](object_create.md) — Related concept: Object.create.
- [Static Methods & Properties](static_methods_properties.md) — Related concept: Static Methods & Properties.

---

## 7. Key Takeaways
- The `new` keyword is an operator used to instantiate objects.
- It performs 4 secret steps: Creates `{}`, links the prototype, binds `this`, and returns the object.
- It is required when using ES6 Classes or traditional Constructor Functions.
- It cannot be used with Arrow Functions.
