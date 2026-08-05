# do...while

> **Level 2 — Control Flow & Data Structures**
> Similar to `while`, but guaranteed to execute the code block at least once.

---

## 1. Prerequisites
- [while Loop](while_loop.md) — A loop that executes as long as a condition is true.
---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
A standard `while` loop checks its condition *before* it runs its code block. If the condition is false from the very beginning, the loop's code will execute exactly zero times. 

However, there are scenarios where you absolutely must run the code at least once before you can even check the condition. For example, prompting a user for a password: you have to ask them *at least once* before you can check if the password they typed is correct. The `do...while` loop was designed to guarantee that the first iteration always runs.

### (2) Reality Metaphor
A normal `while` loop is like a bouncer at a club checking IDs. They check your ID *before* letting you in. If you aren't 21, you never step foot inside.
A `do...while` loop is like an all-you-can-eat buffet where you pay *after* you eat. You are guaranteed to eat at least one plate of food. After you finish that plate, the waiter asks if you want another (evaluating the condition).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
let count = 10;

// Even though the condition (count < 5) is false, 
// the block runs once before checking!
do {
  console.log(`Count is: ${count}`);
  count++;
} while (count < 5);

// Output: "Count is: 10"
```

#### Fuller Example
```javascript
// A classic pattern: generating a unique ID and checking if it exists
const existingIds = [12, 45, 88];
let newId;

do {
  // Generate a random ID between 1 and 100
  newId = Math.floor(Math.random() * 100) + 1;
  console.log(`Trying ID: ${newId}`);
  
// Keep looping AS LONG AS the ID already exists in our list
} while (existingIds.includes(newId));

console.log(`Success! Assigned new unique ID: ${newId}`);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the semicolon

**The mistake:** Leaving off the semicolon at the very end of the `do...while` statement.

**Why it's wrong:** Unlike `if` statements, `for` loops, or normal `while` loops, the `do...while` syntax ends with the condition in parentheses. By convention and strict syntax rules, it should be terminated with a semicolon to prevent the JavaScript engine from misinterpreting the next line of code as part of the loop.

*Incorrect:*
```javascript
let i = 0;
do {
  i++;
} while (i < 3) // Missing semicolon!
console.log("Done");
```

*Fix:*
```javascript
let i = 0;
do {
  i++;
} while (i < 3); // Better!
console.log("Done");
```

---

### Mistake 2: Losing Context Binding (`this`) in Do While Callbacks

**The mistake:** Passing methods from Do While instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "do_while",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "do_while",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Do While Operations

**The mistake:** Executing asynchronous operations within Do While without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/do_while"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/do_while");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in do_while: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The Persistent Prompt

**Problem:** Write a script that declares a variable `isValid` and sets it to `false`. Use a `do...while` loop to log "Checking validity..." and then immediately set `isValid` to `true`. The loop should continue as long as `isValid` is false. How many times will it log?

**Expected output:**
> [!check]- Answer
> ```text
> Checking validity...
> (It logs exactly 1 time)
> ```
> - `do { console.log(...); isValid = true; } while (!isValid);`
> - Because it's set to true inside the first pass, the condition evaluates to false at the end, and the loop stops.

---

### Exercise 2: Guaranteed First Execution Trace

**Problem:** Write a `do...while` loop that runs once even though initial condition `x > 10` is `false` (`x = 5`).

**Expected output:**
> [!check]- Answer
> ```text
> Ran once with x = 5
> ```
> ```javascript
> let x = 5;
> do {
>   console.log(`Ran once with x = ${x}`);
> } while (x > 10);
> ```
>
> **Explanation:** `do...while` loops execute the body first before checking the termination condition.

---

### Exercise 3: Interactive User Retry Simulation

**Problem:** Simulate a retry mechanism that executes up to 3 times or until `success` is `true`.

**Expected output:**
> [!check]- Answer
> ```text
> Attempt 1
> Attempt 2
> Success on attempt 2
> ```
> ```javascript
> let attempt = 0;
> let success = false;
> do {
>   attempt++;
>   console.log(`Attempt ${attempt}`);
>   if (attempt === 2) success = true;
> } while (!success && attempt < 3);
> console.log(`Success on attempt ${attempt}`);
> ```
>
> **Explanation:** `do...while` ensures operations execute at least once before testing stopping criteria.

---

## 7. Related Terms
- [while Loop](while_loop.md) — The standard while loop that checks the condition first.
- [for Loop](for_loop.md) — A loop for iterating a specific number of times.
---

## 8. Key Takeaways
- The `do...while` loop executes the code block *before* evaluating the condition.
- It is guaranteed to run at least one time, even if the condition is false.
- Useful for user prompts or situations where the data needed for the condition is generated *inside* the loop.
