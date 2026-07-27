# switch

> **Level 2 — Control Flow & Data Structures**
> Evaluates an expression, matching its value to a `case` clause to execute associated statements.

---

## 1. Prerequisites
- [Statement](../level_01/statement.md) — An instruction that performs an action.
- [`if` / `else`](../level_02/if_else.md) — Conditional branching.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Traffic Light

**Problem:** Create a switch statement that evaluates a variable `color` (which can be "red", "yellow", or "green"). Log "Stop" for red, "Caution" for yellow, "Go" for green, and "Broken light" for any other value.

**Expected output (if color is "yellow"):**
```text
Caution
```

> [!check]- Answer
> - Start with `switch(color) { ... }`
> - Use `case "red":`
> - Don't forget your `break` statements!
> - Use `default:` for the "Broken light" scenario.

---

### Exercise 2: Strict Type Matching in Switch Statements

**Problem:** Pass string `"5"` into a `switch` with numeric `case 5:` and show that no match occurs.

**Expected output:**
```text
Default arm executed
```

> [!check]- Answer
> ```javascript
> const val = "5";
> switch (val) {
>   case 5:
>     console.log("Matched number");
>     break;
>   default:
>     console.log("Default arm executed");
> }
> ```
>
> **Explanation:** `switch` statements evaluate case clauses using strict equality `===` (no type coercion).

### Exercise 3: Grouping Multiple Cases

**Problem:** Group `case 1: case 2: case 3:` to execute shared logic printing `"Low"`.

**Expected output:**
```text
Low
```

> [!check]- Answer
> ```javascript
> const num = 2;
> switch (num) {
>   case 1:
>   case 2:
>   case 3:
>     console.log("Low");
>     break;
> }
> ```
>
> **Explanation:** Stacking consecutive `case` statements executes shared code blocks for multiple matching cases.

---

---

## 7. Related Terms
- [`if` / `else`](../level_02/if_else.md) — The more flexible alternative for conditional branching.

---

## 8. Key Takeaways
- Use `switch` when comparing a single expression against many possible exact values.
- `switch` uses strict equality (`===`) to match cases.
- **Always** remember to use `break` (or `return`) to stop execution from "falling through" into the next case.
- You can use the `default` keyword to handle any scenario where no cases match.
