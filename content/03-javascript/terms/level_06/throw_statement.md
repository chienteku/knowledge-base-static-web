# throw statement

> **Level 6 — Asynchronous JavaScript**
> Raise an exception to unwind the call stack.

---

## 1. Prerequisites
- [Error Handling (try/catch/finally)](error_handling.md) — Structured exception handling flow.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: throw statement is a fundamental concept in this technology stack. **Level 6 — Asynchronous JavaScript**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
While the JavaScript engine throws errors automatically when code violates syntactic rules (like trying to access a non-existent variable), it cannot detect violations of your application's business logic. For example, if you write a banking function to withdraw money, the engine has no problem subtracting a negative value or an amount greater than the user's balance because they are valid numbers. 

To solve this, developers use the **`throw`** statement to manually trigger an exception when validation or validation checks fail. When the `throw` keyword is executed:
1. It halts execution of the current function immediately.
2. It wraps the payload (the error details) and returns it up the active Call Stack.
3. The engine unwinds the stack, stepping out of nested functions, searching for the nearest enclosing `try...catch` block. If no catch block is found, the thread terminates (crashes).

In JavaScript, you can throw *any* value (a string, a number, or an object). However, it is an industry best practice to only throw instances of the built-in `Error` class to preserve stack trace debugging metadata.

### (2) Reality Metaphor
The `throw` statement is like a referee blowing a whistle during a sports match.
- The game is running smoothly (normal code execution).
- A player commits a foul, such as touching the ball with their hands (validation check fails).
- The referee immediately blows the whistle (**`throw`**). Play stops immediately; no more passes are allowed (execution halts, call stack unwinds).
- The game does not restart until the penalty is resolved by the captains and referee (**`catch`**).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
function checkAge(age) {
  if (age < 0) {
    // Manually raise a runtime error
    throw new Error("Age cannot be negative."); 
  }
  return `Age registered: ${age}`;
}

console.log(checkAge(25)); // Runs normally
checkAge(-5); // Execution halts, throws Error!
```

#### Fuller Example
```javascript
// Bank account withdrawal validator
const userAccount = { name: "Alice", balance: 500 };

function withdrawFunds(account, amount) {
  console.log(`Attempting to withdraw $${amount} from ${account.name}'s account...`);

  if (typeof amount !== "number" || Number.isNaN(amount)) {
    throw new TypeError("Withdrawal amount must be a numeric value.");
  }
  
  if (amount <= 0) {
    throw new RangeError("Withdrawal amount must be greater than zero.");
  }

  if (amount > account.balance) {
    // Custom logic violation: cannot withdraw more than balance
    throw new Error("Insufficient funds available.");
  }

  account.balance -= amount;
  return account.balance;
}

try {
  // Alice tries to withdraw $600 (only has $500)
  const remaining = withdrawFunds(userAccount, 600);
  console.log("Transaction complete. New Balance:", remaining);
} catch (error) {
  // Catch intercepts the thrown exception
  console.error("ALERT: Transaction Aborted.");
  console.error("Reason:", error.message); // "Insufficient funds available."
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Throwing Plain String Literals

**The mistake:** Writing `throw "Error message";` instead of throwing an Error object.

**Why it's wrong:** Throwing a raw string literal does not capture stack trace metadata (the record of nested files and line numbers where the failure occurred). This makes debugging and tracking down the source of bugs in large codebases incredibly difficult.

*Incorrect:*
```javascript
function divide(a, b) {
  if (b === 0) {
    throw "Division by zero is not allowed!"; // String has no stack trace!
  }
  return a / b;
}
```

*Fix:*
```javascript
function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero is not allowed!"); // Correct
  }
  return a / b;
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Throw Statement Callbacks

**The mistake:** Passing methods from Throw Statement instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "throw_statement",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "throw_statement",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Throw Statement Operations

**The mistake:** Executing asynchronous operations within Throw Statement without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/throw_statement"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/throw_statement");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in throw_statement: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Validation Guard with Custom Throw Statements

**Scenario:** A form validator validates user input payloads, using throw statements to throw Error instances when invariants fail.

**Requirements:**
1. Write validateUserInput(input).
2. Throw Error if input missing or invalid.
3. Return clean user payload.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateUserInput(input) {
>   if (!input || typeof input !== "object") {
>     throw new TypeError("Payload must be a non-null object");
>   }
>   if (!input.username || input.username.trim().length === 0) {
>     throw new Error("Username is required");
>   }
>   return { username: input.username.trim() };
> }
>
> // Verification tests
> console.assert(validateUserInput({ username: "alice " }).username === "alice", "Test 1 Failed");
>
> let caughtErr = null;
> try {
>   validateUserInput({});
> } catch (err) {
>   caughtErr = err;
> }
> console.assert(caughtErr instanceof Error && caughtErr.message === "Username is required", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **throw Statement**: The throw statement stops current execution and passes control to first matching catch block in call stack.
> 2. **Throwing Error Objects**: Always throw instances of Error (or subclasses) to preserve stack traces and error metadata.
> 3. **Control Flow Transfer**: Uncaught throw statements unwind the call stack up to top-level global script context.
> 
---

### Exercise 2: Throw Statement Advanced Context Handler

**Scenario:** A web application component processes throw statement data operations within enterprise workflows.

**Requirements:**
1. Write handleThrowStatementSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleThrowStatementSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleThrowStatementSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Throw Statement Architecture**: Applying throw statement patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Throw Statement Performance Optimization

**Scenario:** An application utility optimizes throw statement execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeThrowStatementTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeThrowStatementTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeThrowStatementTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Throw Statement Optimization**: Optimizing throw statement improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Error object & Error Types](error_object.md) — The constructor object containing message and stack trace info.
- [Call Stack](call_stack.md) — The stack of executions that unwinds when an error is thrown.
- [Error Handling (try/catch/finally)](error_handling.md) — Related concept: Error Handling (try/catch/finally).

---

## 7. Key Takeaways
- The `throw` statement manually raises an exception when business logic or validation checks fail.
- Executing `throw` halts current function execution immediately and unwinds the Call Stack.
- Always throw instantiated `Error` objects (e.g. `throw new Error(...)`) instead of primitive strings to ensure a debuggable stack trace is generated.
