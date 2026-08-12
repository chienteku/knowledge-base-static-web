# Default Parameters

> **Level 8 — Modern JavaScript (ES6+)**
> Allows named function parameters to be initialized with default values if no value or `undefined` is passed.

---

## 1. Prerequisites
- [Function](../level_03/function.md) — The structure that uses parameters.
- [undefined](../level_01/undefined.md) — The value that triggers the default fallback.

---

## 2. Term Category

**Syntax Feature *(Introduced in ES6)* (Universal)**: Default Parameters is a fundamental concept in this technology stack. **Level 8 — Modern JavaScript (ES6+)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, if you define a function that expects 3 arguments, but the user only passes 2, the engine doesn't crash. It simply sets the missing 3rd argument to `undefined`. 
Before ES6, developers had to write clunky `if` statements inside every function to check for `undefined` and assign fallback values manually (e.g., `if (color === undefined) color = "black";`).

ES6 introduced **Default Parameters**, allowing developers to assign fallback values directly inside the function signature `(color = "black")`. It makes the code instantly readable, self-documenting, and eliminates boilerplate checks.

### (2) Reality Metaphor
Imagine ordering a hamburger at a restaurant.
The waiter asks: "What kind of cheese do you want?" 
If you specify "Swiss", they give you Swiss.
If you say nothing at all (undefined), they automatically give you "American", because that is the Default Parameter established by the restaurant.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// We assign a default value right in the parameter list!
function greet(name = "Guest") {
  console.log(`Welcome, ${name}!`);
}

greet("Alice"); // "Welcome, Alice!"
greet();        // "Welcome, Guest!" (Fell back to default)
```

#### Fuller Example: Multiple Parameters and Expressions
```javascript
// Default parameters can be complex expressions or function calls!
function calculatePrice(price, taxRate = 0.05, discount = 0) {
  const total = price + (price * taxRate) - discount;
  return total;
}

// 1. Using all provided values
console.log(calculatePrice(100, 0.10, 5)); // 105

// 2. Omitting the last two (falling back to defaults)
console.log(calculatePrice(100)); // 105 (tax is 0.05, discount is 0)

// 3. Omitting the middle one? 
// You MUST pass explicitly 'undefined' to trigger the default!
console.log(calculatePrice(100, undefined, 20)); // 85
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Default Parameters Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Default Parameters blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "default_parameters";
```

*Fix:*
```javascript
let value = "default_parameters";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Default Parameters Callbacks

**The mistake:** Passing methods from Default Parameters instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "default_parameters",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "default_parameters",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Default Parameters Operations

**The mistake:** Executing asynchronous operations within Default Parameters without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/default_parameters"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/default_parameters");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in default_parameters: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Server Config Initializer with Dynamic Expression Defaults

**Scenario:** An API gateway initializes server configuration objects, using ES6 default parameters to calculate dynamic default timeouts and ports at invocation time.

**Requirements:**
1. Write createGatewayConfig(port = 8080, timeout = getCalculatedTimeout()).
2. Verify default arguments trigger on undefined.
3. Return config object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function getCalculatedTimeout() {
>   return 5000;
> }
>
> function createGatewayConfig(port = 8080, timeout = getCalculatedTimeout()) {
>   return { port, timeout };
> }
>
> // Verification tests
> const cfg1 = createGatewayConfig();
> console.assert(cfg1.port === 8080 && cfg1.timeout === 5000, "Test 1 Failed");
>
> const cfg2 = createGatewayConfig(3000, undefined);
> console.assert(cfg2.port === 3000 && cfg2.timeout === 5000, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Default Parameter Evaluation**: Default parameters are evaluated at call time when passed arguments are explicitly undefined.
> 2. **Dynamic Expression Evaluation**: Defaults can be function calls or expressions that run when triggered.
> 3. **Null vs Undefined Trigger**: Passing null does NOT trigger default parameters; defaults activate exclusively on undefined.
> 
---

### Exercise 2: Destructured Options Parameter with Default Object Fallback

**Scenario:** A UI component prop handler uses destructured object parameters with default property values and a default fallback object.

**Requirements:**
1. Write renderBadge({ text = "Default", color = "blue", active = true } = {}).
2. Extract props cleanly.
3. Return formatted descriptor.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function renderBadge({ text = "Default", color = "blue", active = true } = {}) {
>   return `Badge[${text}, ${color}, active=${active}]`;
> }
>
> // Verification tests
> console.assert(renderBadge() === "Badge[Default, blue, active=true]", "Test 1 Failed");
> console.assert(renderBadge({ text: "Alert", color: "red" }) === "Badge[Alert, red, active=true]", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Destructuring Defaults**: Properties inside destructured parameters assign defaults when individual keys are missing.
> 2. **Fallback Default Object (= {})**: = {} suffix guarantees parameter destructuring succeeds when caller passes no arguments.
> 3. **Declarative Function Signatures**: Eliminates verbose option checking code inside function bodies.
> 
---

### Exercise 3: Default Parameter Null vs Undefined Safeguard

**Scenario:** A configuration parser validates that default parameters trigger ONLY when arguments are undefined, providing defensive fallback logic for null arguments.

**Requirements:**
1. Write parseConfigValue(val = "DEFAULT").
2. Handle explicit null using val ?? "DEFAULT".
3. Return normalized value.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseConfigValue(val = "DEFAULT") {
>   // Default parameter val = "DEFAULT" triggers on undefined
>   // Nullish coalescing val ?? "DEFAULT" handles explicit null
>   return val ?? "DEFAULT";
> }
>
> // Verification tests
> console.assert(parseConfigValue(undefined) === "DEFAULT", "Test 1 Failed");
> console.assert(parseConfigValue(null) === "DEFAULT", "Test 2 Failed");
> console.assert(parseConfigValue("CUSTOM") === "CUSTOM", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Default Parameter Trigger Condition**: ES6 default parameters evaluate ONLY when argument is undefined.
> 2. **Explicit null Argument Behavior**: Passing null explicitly sets parameter value to null, bypassing default parameter assignments.
> 3. **Defensive Nullish Fallbacks**: Combining default parameters with nullish coalescing (??) guarantees robust default handling.
> 
---

## 6. Related Terms
- [undefined](../level_01/undefined.md) — The *only* value that triggers a default parameter.
- [Destructuring](destructuring.md) — You can also use default parameters inside destructuring assignments!

---

## 7. Key Takeaways
- Default Parameters allow you to assign fallback values in the function signature using `=`.
- They are ONLY triggered if the argument is omitted entirely, or if you explicitly pass `undefined`.
- Falsy values like `null`, `0`, or `""` will *not* trigger the default.
- They make code cleaner by removing manual `undefined` checks.
```
