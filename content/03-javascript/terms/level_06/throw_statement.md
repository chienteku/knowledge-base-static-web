# throw statement

> **Level 6 — Asynchronous JavaScript**
> Raise an exception to unwind the call stack.

---

## 1. Prerequisites
- [Error Handling (`try`/`catch`/`finally`)](./error_handling.md) — Structured exception handling flow.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Validation Thrower

**Problem:** Complete the function `validatePassword` to throw a `RangeError` if the password length is less than `8` characters.

```javascript
function validatePassword(pass) {
  // Check length
  // Throw RangeError if less than 8
  return "Password is valid.";
}

try {
  validatePassword("12345");
} catch (error) {
  console.log("Error caught:", error.name, "-", error.message);
}
```

**Expected output:**
> [!check]- Answer
> ```text
> Error caught: RangeError - Password is too short!
> ```
> - The condition is `if (pass.length < 8)`.
> - Raise the error using `throw new RangeError("Password is too short!");`.

---

### Exercise 2: Throwing Errors on Invalid Arguments

**Problem:** Throw `TypeError("Age must be a number")` if `typeof age !== 'number'`.

**Expected output:**
> [!check]- Answer
> ```text
> TypeError: Age must be a number
> ```
> ```javascript
> function setAge(age) {
>   if (typeof age !== "number") throw new TypeError("Age must be a number");
> }
> try {
>   setAge("twenty");
> } catch (err) {
>   console.log(`${err.name}: ${err.message}`);
> }
> ```
>
> **Explanation:** `throw` interrupts execution flow and passes control to the nearest `catch` block.

---

### Exercise 3: Re-Throwing Caught Exceptions

**Problem:** Catch an error, log it, and `throw err` again to parent callers.

**Expected output:**
> [!check]- Answer
> ```text
> Logged and re-thrown error
> ```
> ```javascript
> try {
>   try {
>     throw new Error("DB Connection Error");
>   } catch (err) {
>     console.log("Logged and re-thrown error");
>     throw err;
>   }
> } catch (parentErr) {}
> ```
>
> **Explanation:** Re-throwing caught errors allows logging at local boundaries while delegating failure handling to callers.


---

## 7. Related Terms
- [`Error` object & Error Types](./error_object.md) — The constructor object containing message and stack trace info.
- [Call Stack](./call_stack.md) — The stack of executions that unwinds when an error is thrown.

---

## 8. Key Takeaways
- The `throw` statement manually raises an exception when business logic or validation checks fail.
- Executing `throw` halts current function execution immediately and unwinds the Call Stack.
- Always throw instantiated `Error` objects (e.g. `throw new Error(...)`) instead of primitive strings to ensure a debuggable stack trace is generated.
