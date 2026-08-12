# switch

> **Level 2 — Control Flow & Data Structures**
> Evaluates an expression, matching its value to a `case` clause to execute associated statements.

---

## 1. Prerequisites
- [Statement](../level_01/statement.md) — An instruction that performs an action.
- [if / else](if_else.md) — Conditional branching.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: switch is a fundamental concept in this technology stack. **Level 2 — Control Flow & Data Structures**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
While `if / else if` chains are great for complex logical checks (e.g., `score > 90 && isPassing`), they become extremely repetitive and hard to read when you are simply comparing a single variable against a long list of exact potential values. 

The `switch` statement was designed specifically for this scenario: evaluating one expression and routing the execution path based on which exact value it matches. It acts as a cleaner, more readable alternative to a massive wall of `else if (status === "...")` checks.

### (2) Reality Metaphor
Imagine a classic mailroom sorting system. A worker takes a package, looks at the destination city (the expression), and tosses it down a specific chute (the `case`) labeled for that city. If the city doesn't match any of the labeled chutes, they toss it into a general "Return to Sender" bin (the `default` case).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const currentDay = "Tuesday";

switch (currentDay) {
  case "Monday":
    console.log("Start of the work week.");
    break; // Without break, it would "fall through" to the next case!
  case "Tuesday":
    console.log("Taco Tuesday!");
    break;
  default:
    console.log("Just a regular day.");
}
```

#### Fuller Example
```javascript
function getHttpStatusMessage(statusCode) {
  // The switch evaluates the expression (statusCode) using strict equality (===)
  switch (statusCode) {
    case 200:
      return "OK";
    case 201:
      return "Created";
    case 400:
      return "Bad Request";
    case 401:
    case 403: // You can stack cases to share the same execution block!
      return "Unauthorized / Forbidden";
    case 404:
      return "Not Found";
    case 500:
      return "Internal Server Error";
    default:
      return "Unknown Status Code";
  }
}

console.log(getHttpStatusMessage(404)); // "Not Found"
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `break` keyword

**The mistake:** Omitting the `break` statement at the end of a `case` block.

**Why it's wrong:** JavaScript `switch` statements have a quirk called "fall-through". If an engine matches a case and executes its code, it will *continue* executing the code in all subsequent cases until it hits a `break` or a `return`, regardless of whether those subsequent cases match the original expression!

*Incorrect:*
```javascript
const animal = "Dog";

switch (animal) {
  case "Dog":
    console.log("Woof!");
    // Forgot the break!
  case "Cat":
    console.log("Meow!");
    break;
}
// Outputs: "Woof!" AND "Meow!"
```

*Fix:*
```javascript
const animal = "Dog";

switch (animal) {
  case "Dog":
    console.log("Woof!");
    break; // Now it exits the switch immediately after running this block.
  case "Cat":
    console.log("Meow!");
    break;
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Switch Callbacks

**The mistake:** Passing methods from Switch instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "switch",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "switch",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Switch Operations

**The mistake:** Executing asynchronous operations within Switch without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/switch"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/switch");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in switch: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Order Fulfillment State Machine Router

**Scenario:** An e-commerce fulfillment engine transitions order states based on incoming event status strings using a switch statement with explicit break handlers.

**Requirements:**
1. Write processOrderStatus(currentStatus, action).
2. Handle cases "PENDING", "SHIPPED", "DELIVERED", "CANCELLED".
3. Include break statements.
4. Return next status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processOrderStatus(currentStatus, action) {
>   let nextStatus = currentStatus;
>
>   switch (action) {
>     case "PAY":
>       if (currentStatus === "PENDING") nextStatus = "PAID";
>       break;
>     case "SHIP":
>       if (currentStatus === "PAID") nextStatus = "SHIPPED";
>       break;
>     case "CANCEL":
>       if (currentStatus !== "DELIVERED") nextStatus = "CANCELLED";
>       break;
>     default:
>       break;
>   }
>   return nextStatus;
> }
>
> // Verification tests
> console.assert(processOrderStatus("PENDING", "PAY") === "PAID", "Test 1 Failed");
> console.assert(processOrderStatus("PAID", "SHIP") === "SHIPPED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Switch Evaluation**: Matches expression against case clauses using strict equality (===).
> 2. **Break Prevention**: The break statement prevents fall-through into subsequent case blocks.
> 3. **Default Case**: The default clause executes when no matching case label is found.
> 
---

### Exercise 2: Multi-Case Grouping HTTP Status Classifier

**Scenario:** An HTTP API response handler groups multiple status code cases together without break statements to categorize response types.

**Requirements:**
1. Write categorizeHttpStatus(code).
2. Group 200, 201, 204 into "SUCCESS".
3. Group 400, 401, 403, 404 into "CLIENT_ERROR".
4. Group 500, 502, 503 into "SERVER_ERROR".
5. Return category string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function categorizeHttpStatus(code) {
>   let category = "UNKNOWN";
>
>   switch (code) {
>     case 200:
>     case 201:
>     case 204:
>       category = "SUCCESS";
>       break;
>     case 400:
>     case 401:
>     case 403:
>     case 404:
>       category = "CLIENT_ERROR";
>       break;
>     case 500:
>     case 502:
>     case 503:
>       category = "SERVER_ERROR";
>       break;
>     default:
>       category = "UNKNOWN";
>       break;
>   }
>   return category;
> }
>
> // Verification tests
> console.assert(categorizeHttpStatus(201) === "SUCCESS", "Test 1 Failed");
> console.assert(categorizeHttpStatus(404) === "CLIENT_ERROR", "Test 2 Failed");
> console.assert(categorizeHttpStatus(503) === "SERVER_ERROR", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Case Fall-Through**: Omitting break allows multiple case labels to execute the same statement block.
> 2. **Strict Matching**: Switch matching uses ===, so "200" does not match numeric 200.
> 3. **Multi-Case Design**: Provides clean structure for multi-value categorical dispatching.
> 
---

### Exercise 3: CLI Command Action Dispatcher

**Scenario:** A command line interface routes user flag strings (--version, --help, --build) to action handlers using switch.

**Requirements:**
1. Write dispatchCliFlag(flag).
2. Handle "--version" / "-v", "--help" / "-h", "--build" / "-b".
3. Return action identifier.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function dispatchCliFlag(flag) {
>   switch (flag) {
>     case "--version":
>     case "-v":
>       return "SHOW_VERSION";
>     case "--help":
>     case "-h":
>       return "SHOW_HELP";
>     case "--build":
>     case "-b":
>       return "EXECUTE_BUILD";
>     default:
>       return "INVALID_FLAG";
>   }
> }
>
> // Verification tests
> console.assert(dispatchCliFlag("-v") === "SHOW_VERSION", "Test 1 Failed");
> console.assert(dispatchCliFlag("--build") === "EXECUTE_BUILD", "Test 2 Failed");
> console.assert(dispatchCliFlag("--unknown") === "INVALID_FLAG", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Direct Case Return**: Returning directly from a case block exits the switch and function simultaneously without needing explicit break.
> 2. **String Matching**: Evaluates string matching cleanly across multi-alias command flags.
> 3. **Fall-Through Aliasing**: Stacking case labels creates clear alias groups for command handlers.
---

## 6. Related Terms
- [if / else](if_else.md) — The more flexible alternative for conditional branching.
- [break / continue](break_continue.md) — Related concept: break / continue.

---

## 7. Key Takeaways
- Use `switch` when comparing a single expression against many possible exact values.
- `switch` uses strict equality (`===`) to match cases.
- **Always** remember to use `break` (or `return`) to stop execution from "falling through" into the next case.
- You can use the `default` keyword to handle any scenario where no cases match.
