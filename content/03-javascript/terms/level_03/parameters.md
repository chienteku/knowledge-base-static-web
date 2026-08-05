# Parameters

> **Level 3 — Functions & Scope**
> The named variables listed in the function definition.

---

## 1. Prerequisites
- [Function](function.md) — A reusable block of code.
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
If a function could only operate on hardcoded data, it wouldn't be very reusable. To make functions dynamic, we needed a way to feed them different data every time they run. 

"Parameters" are the variables defined in the parentheses `()` when you *create* a function. They act as placeholders or local variables that exist only inside the function. When the function runs, these placeholders are filled with the actual data (Arguments) provided by the caller.

### (2) Reality Metaphor
Imagine a parking ticket template. The printed text on the blank ticket says `[License Plate Number]` and `[Fine Amount]`. These blank spaces are the **Parameters**. They tell the officer exactly what information is required to issue a ticket, but they don't contain real data until the officer actually writes on them.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// 'firstName' and 'lastName' are PARAMETERS
function greet(firstName, lastName) {
  console.log(`Hello, ${firstName} ${lastName}!`);
}
```

#### Fuller Example
```javascript
// Using Default Parameters (ES6 Feature)
// If the caller doesn't provide a 'greeting' or 'name', use the defaults
function welcomeUser(name = "Guest", greeting = "Welcome") {
  console.log(`${greeting}, ${name}!`);
}

welcomeUser("Alice", "Good morning"); // "Good morning, Alice!"
welcomeUser("Bob");                   // "Welcome, Bob!"
welcomeUser();                        // "Welcome, Guest!"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Parameters Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Parameters blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "parameters";
```

*Fix:*
```javascript
let value = "parameters";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Parameters Callbacks

**The mistake:** Passing methods from Parameters instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "parameters",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "parameters",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Parameters Operations

**The mistake:** Executing asynchronous operations within Parameters without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/parameters"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/parameters");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in parameters: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Default Parameters

**Problem:** Create a function `calculateTax` with two parameters: `price` and `taxRate`. Give `taxRate` a default parameter value of `0.05`. Return `price + (price * taxRate)`. Call it once with just `(100)` and once with `(100, 0.10)`.

**Expected output:**
> [!check]- Answer
> ```text
> 105
> 110
> ```
> - `function calculateTax(price, taxRate = 0.05) { ... }`

---

### Exercise 2: Default Parameter Evaluation Scope

**Problem:** Write `function greet(name = "Guest", msg = `Hello ${name}`)` and test `greet("Alice")`.

**Expected output:**
> [!check]- Answer
> ```text
> Hello Alice
> ```
> ```javascript
> function greet(name = "Guest", msg = `Hello ${name}`) {
>   console.log(msg);
> }
> greet("Alice");
> ```
>
> **Explanation:** Default parameters evaluate left-to-right in an intermediate parameter scope frame.

---

### Exercise 3: Destructured Parameter Defaults

**Problem:** Destructure options parameter `function config({ port = 8080, host = "localhost" } = {})`.

**Expected output:**
> [!check]- Answer
> ```text
> 8080
> localhost
> ```
> ```javascript
> function config({ port = 8080, host = "localhost" } = {}) {
>   console.log(port);
>   console.log(host);
> }
> config();
> ```
>
> **Explanation:** Destructured default parameters accept defaulted object configurations safely.


---

## 7. Related Terms
- [Arguments](arguments.md) — The actual values passed to the function when it is invoked.
- [Function](function.md) — The block of code that parameters belong to.

---

## 8. Key Takeaways
- Parameters are defined in the parentheses when you write the function.
- They act as local variables that can only be accessed inside that specific function.
- ES6 introduced "Default Parameters", allowing you to set a fallback value if no argument is passed (e.g., `function(name = "Guest")`).
