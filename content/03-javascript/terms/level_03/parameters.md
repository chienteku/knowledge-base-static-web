# Parameters

> **Level 3 — Functions & Scope**
> The named variables listed in the function definition.

---

## 1. Prerequisites
- [Function](function.md) — A reusable block of code.
- [Variable](../level_01/variable.md) — A named container for storing data values.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Parameters is a fundamental concept in this technology stack. **Level 3 — Functions & Scope**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Rest Parameters Variadic Collector

**Scenario:** An API route dispatcher collects an arbitrary number of trailing query filter parameters into a true array using ES6 rest parameters (...filters).

**Requirements:**
1. Write buildQueryUrl(baseUrl, ...filters).
2. Use rest parameters to collect variadic filter arguments.
3. Join filters with "&".
4. Return formatted URL.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildQueryUrl(baseUrl, ...filters) {
>   if (filters.length === 0) return baseUrl;
>   const queryString = filters.join("&");
>   return `${baseUrl}?${queryString}`;
> }
>
> // Verification tests
> const url1 = buildQueryUrl("https://api.com/items");
> console.assert(url1 === "https://api.com/items", "Test 1 Failed");
>
> const url2 = buildQueryUrl("https://api.com/items", "page=1", "sort=desc");
> console.assert(url2 === "https://api.com/items?page=1&sort=desc", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Rest Parameter Syntax**: Rest parameter syntax (...args) collects trailing individual arguments into a true Array instance.
> 2. **Rest Parameter Placement**: Rest parameters must be the last parameter in a function signature.
> 3. **Contrast with arguments**: Rest parameters create a real Array instance, supporting methods like .map(), .filter(), and .join().
> 
---

### Exercise 2: Default Parameter Fallback Evaluator

**Scenario:** A service configuration initializer uses ES6 default parameters to assign fallback values when arguments are explicitly undefined.

**Requirements:**
1. Write createServerConfig(port = 8080, host = "localhost", timeout = 5000).
2. Verify default parameters trigger on missing or undefined arguments.
3. Return config object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createServerConfig(port = 8080, host = "localhost", timeout = 5000) {
>   return { port, host, timeout };
> }
>
> // Verification tests
> const cfg1 = createServerConfig();
> console.assert(cfg1.port === 8080 && cfg1.host === "localhost", "Test 1 Failed");
>
> const cfg2 = createServerConfig(3000, undefined, 10000);
> console.assert(cfg2.port === 3000 && cfg2.host === "localhost" && cfg2.timeout === 10000, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Default Parameter Syntax**: Syntax param = defaultValue assigns initial values if passed argument is undefined.
> 2. **Trigger Condition**: Default parameters evaluate ONLY when argument is explicitly undefined (passing null does NOT trigger defaults).
> 3. **Expression Defaults**: Default parameters can evaluate dynamic expressions or function calls at invocation time.
> 
---

### Exercise 3: Destructured Object Parameters with Default Values

**Scenario:** A UI component prop parser uses destructured object parameters with default values to extract props cleanly.

**Requirements:**
1. Write renderButton({ label = "Submit", color = "blue", disabled = false } = {}).
2. Extract properties via destructuring.
3. Return formatted descriptor string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function renderButton({ label = "Submit", color = "blue", disabled = false } = {}) {
>   return `Button[${label}, ${color}, disabled=${disabled}]`;
> }
>
> // Verification tests
> console.assert(renderButton() === "Button[Submit, blue, disabled=false]", "Test 1 Failed");
> console.assert(renderButton({ label: "Cancel", color: "red" }) === "Button[Cancel, red, disabled=false]", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Parameter Destructuring**: Unpacks properties directly from object arguments inside parameter signatures.
> 2. **Fallback Default Object**: = {} suffix guarantees destructuring succeeds even if caller passes no argument (undefined).
> 3. **Clean Function Signatures**: Replaces verbose internal option checking with declarative parameter definitions.
---

## 6. Related Terms
- [Arguments](arguments.md) — The actual values passed to the function when it is invoked.
- [Function](function.md) — The block of code that parameters belong to.

---

## 7. Key Takeaways
- Parameters are defined in the parentheses when you write the function.
- They act as local variables that can only be accessed inside that specific function.
- ES6 introduced "Default Parameters", allowing you to set a fallback value if no argument is passed (e.g., `function(name = "Guest")`).
