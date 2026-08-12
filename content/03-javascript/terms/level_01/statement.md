# Statement

> **Level 1 — Foundations**
> An instruction that performs an action (e.g., `let x = 5;`).

---

## 1. Prerequisites
- None!

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Statement is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Every programming language needs a way to tell the computer *what to do*. A JavaScript program is essentially a sequence of instructions executed by the engine. These individual instructions are called "Statements". 

If a program is a recipe, statements are the individual steps: "Preheat the oven", "Mix the flour", "Bake for 30 minutes". A statement performs an action, changes the state of the program, or dictates the flow of execution, but it doesn't necessarily produce a tangible value that you can store in a variable.

### (2) Reality Metaphor
A statement is like a direct command given to a soldier: "Drop and give me twenty!" or "March forward!" The soldier performs the action, but the command itself doesn't "return" a physical object to the commander.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// This entire line is a statement
let maxUsers = 100;

// This is an if statement
if (maxUsers > 50) {
  console.log("Capacity reached"); // Another statement
}
```

#### Fuller Example
```javascript
// A sequence of statements executed top-to-bottom
function initializeApp() {
  // Statement 1: Variable declaration
  const dbStatus = "Connected";
  
  // Statement 2: Control flow (if statement)
  if (dbStatus === "Connected") {
    // Statement 3: Function call
    console.log("App is ready to go!");
  }
}

// Statement 4: Calling the function
initializeApp();
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to assign a statement to a variable

**The mistake:** Confusing statements (actions) with expressions (values) and trying to capture a statement's result in a variable.

**Why it's wrong:** An `if` statement doesn't evaluate to a value. You cannot assign an `if` block to a variable.

*Incorrect:*
```javascript
// SyntaxError: Unexpected token 'if'
// const result = if (true) { "Yes" } else { "No" };
```

*Fix:*
```javascript
// Use a ternary expression instead (expressions resolve to values!)
const result = true ? "Yes" : "No";
```

---

### Mistake 2: Losing Context Binding (`this`) in Statement Callbacks

**The mistake:** Passing methods from Statement instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "statement",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "statement",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Statement Operations

**The mistake:** Executing asynchronous operations within Statement without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/statement"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/statement");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in statement: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Order Processing Control Flow Engine

**Scenario:** An e-commerce fulfillment service processes a batch of orders using control flow statements (if/else, for, break, continue).

**Requirements:**
1. Iterate over an order list using a for statement.
2. Use continue to skip cancelled orders.
3. Use break if a critical system alert flag is met.
4. Accumulate and return total processed order revenue.

> [!check]- Answer
> #### Implementation
> ```javascript
> function processOrderQueue(orders) {
>   let totalRevenue = 0;
>   let processedCount = 0;
> for (let i = 0; i < orders.length; i++) {
>     const order = orders[i];
>     if (order.status === "cancelled") continue;
>     if (order.status === "CRITICAL_HALT") break;
> totalRevenue += order.amount;
>     processedCount++;
>   }
> return { totalRevenue, processedCount };
> }
> // Verification tests
> const queue = [
>   { amount: 100, status: "completed" },
>   { amount: 50, status: "cancelled" },
>   { amount: 200, status: "completed" }
> ];
> const res = processOrderQueue(queue);
> console.assert(res.totalRevenue === 300 && res.processedCount === 2, "Test 1 Failed");
> ```
> #### Technical Explanation
> 1. **Statement vs Expression**: A statement performs an action or controls program flow; it does not evaluate to a value.
> 2. **Control Flow Jump Statements**: Keywords like break and continue alter standard sequential statement execution flow.
> 3. **Block Statement Scope**: Enclosing statements inside braces {} forms a Block Statement, establishing a local lexical scope.
> 
---

### Exercise 2: Switch-Case State Dispatcher

**Scenario:** An application state manager routes incoming event actions using a switch statement with explicit break commands to prevent case fall-through.

**Requirements:**
1. Write dispatchAction(state, action).
2. Handle "INCREMENT", "DECREMENT", and "RESET" cases.
3. Include a default case returning current state.

> [!check]- Answer
> #### Implementation
> ```javascript
> function dispatchAction(count, action) {
>   let nextCount = count;
>   switch (action.type) {
>     case "INCREMENT":
>       nextCount += action.payload ?? 1;
>       break;
>     case "DECREMENT":
>       nextCount -= action.payload ?? 1;
>       break;
>     case "RESET":
>       nextCount = 0;
>       break;
>     default:
>       break;
>   }
>   return nextCount;
> }
> // Verification tests
> console.assert(dispatchAction(5, { type: "INCREMENT", payload: 2 }) === 7, "Test 1 Failed");
> console.assert(dispatchAction(5, { type: "RESET" }) === 0, "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **Switch Statement Mechanism**: Matches an expression against case clauses using strict equality (===).
> 2. **Break Termination**: The break statement terminates the switch block, preventing execution fall-through into subsequent cases.
> 3. **Default Fallback**: The default clause executes if no matching case label is found.
> 
---

### Exercise 3: Labeled Matrix Search Break Statement

**Scenario:** A 2D grid pathfinder searches a matrix for a target coordinate and exits nested loops immediately using a Labeled Statement (label: for (...)).

**Requirements:**
1. Define a labeled statement outerLoop: for (...).
2. Iterate through 2D array matrix.
3. Break out of BOTH loops using break outerLoop when target is found.

> [!check]- Answer
> #### Implementation
> ```javascript
> function findMatrixTarget(matrix, target) {
>   let foundRow = -1;
>   let foundCol = -1;
> outerLoop: for (let r = 0; r < matrix.length; r++) {
>     for (let c = 0; c < matrix[r].length; c++) {
>       if (matrix[r][c] === target) {
>         foundRow = r;
>         foundCol = c;
>         break outerLoop;
>       }
>     }
>   }
>   return { row: foundRow, col: foundCol };
> }
> // Verification tests
> const grid = [[1, 2], [4, 99]];
> const pos = findMatrixTarget(grid, 99);
> console.assert(pos.row === 1 && pos.col === 1, "Test 1 Failed");
> ```
> #### Technical Explanation
> 1. **Labeled Statements**: Attaching a prefix label identifier (e.g. outerLoop:) to a statement allows targeted control jumps.
> 2. **Multi-Level Break**: Passing a label name to break labelName terminates the specified outer loop statement directly.
> 3. **Syntax Constraints**: Labels can only prefix loop or block statements.
---

## 6. Related Terms
- [Expression](expression.md) — Any valid unit of code that resolves to a single value.
- [Automatic Semicolon Insertion (ASI)](asi.md) — Related concept: Automatic Semicolon Insertion (ASI).

---

## 7. Key Takeaways
- A statement is an instruction to the engine to *do something*.
- Declarations (`let x;`), assignments (`x = 5;`), and control flows (`if`, `for`) are all statements.
- By convention, standard statements in JavaScript end with a semicolon (`;`).
