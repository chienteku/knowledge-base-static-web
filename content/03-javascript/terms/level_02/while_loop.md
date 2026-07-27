# while Loop

> **Level 2 — Control Flow & Data Structures**
> A loop that executes a block of code as long as the specified condition evaluates to true.

---

## 1. Prerequisites
- [Boolean](../level_01/boolean.md) — A logical entity having two values: `true` or `false`.
- [Statement](../level_01/statement.md) — An instruction that performs an action.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
A `for` loop is great when you know *exactly* how many times you want to run a block of code (like iterating through a 10-item list). But what if you don't know how many times the loop should run? What if the loop needs to run until a user clicks a button, or until a random number generator hits a specific target? 

The `while` loop was designed for exactly this. It strips away the initialization and update steps of the `for` loop, leaving only the condition. It simply says: "As long as this statement is true, keep going."

### (2) Reality Metaphor
A `while` loop is like waiting for a pot of water to boil. You don't know exactly how many seconds it will take. You just stand there and check the pot: "Is the water boiling?" If false, wait another minute. "Is the water boiling?" Once the answer is true, you stop waiting and make your tea.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
let fuel = 3;

// The loop will run as long as fuel is greater than 0
while (fuel > 0) {
  console.log(`Driving... Fuel left: ${fuel}`);
  fuel--; // IMPORTANT: We must update the condition variable!
}
console.log("Out of gas.");
```

#### Fuller Example
```javascript
function findRandomMatch(targetNumber) {
  let attempts = 0;
  let currentGuess = null;
  
  // We don't know how many attempts this will take!
  while (currentGuess !== targetNumber) {
    // Generate a random number between 1 and 10
    currentGuess = Math.floor(Math.random() * 10) + 1;
    attempts++;
    console.log(`Attempt ${attempts}: Guessed ${currentGuess}`);
  }
  
  console.log(`Success! Found ${targetNumber} after ${attempts} attempts.`);
}

findRandomMatch(7);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: The Infinite Loop

**The mistake:** Forgetting to update the variable that the `while` condition checks inside the loop body.

**Why it's wrong:** If the condition is true when the loop starts, and nothing inside the loop ever changes that condition to false, the loop will run forever until the browser tab crashes.

*Incorrect:*
```javascript
let count = 5;
while (count > 0) {
  console.log("This will print forever...");
  // Forgot to do count--
}
```

*Fix:*
```javascript
let count = 5;
while (count > 0) {
  console.log(`Count is ${count}`);
  count--; // Now it will eventually reach 0 and stop!
}
```

---

### Mistake 2: Losing Context Binding (`this`) in While Loop Callbacks

**The mistake:** Passing methods from While Loop instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "while_loop",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "while_loop",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in While Loop Operations

**The mistake:** Executing asynchronous operations within While Loop without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/while_loop"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/while_loop");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in while_loop: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Halving numbers

**Problem:** Write a `while` loop that takes a starting number of `100`. Inside the loop, divide the number by `2` and log it. The loop should stop *before* the number drops below `1`.

**Expected output:**
```text
50
25
12.5
6.25
3.125
1.5625
```

> [!check]- Answer
> - Start with `let num = 100;`
> - The condition should be `while (num / 2 >= 1)` or similar.
> - Inside the loop, do `num = num / 2;` and then `console.log(num);`.

---

### Exercise 2: Standard While Loop Accumulator

**Problem:** Sum numbers from `1` to `5` using a `while` loop.

**Expected output:**
```text
15
```

> [!check]- Answer
> ```javascript
> let sum = 0;
> let i = 1;
> while (i <= 5) {
>   sum += i;
>   i++;
> }
> console.log(sum);
> ```
>
> **Explanation:** `while` loops execute code blocks repeatedly as long as conditional expressions evaluate to truthy.

### Exercise 3: Sentinel Value Loop Termination

**Problem:** Pop items off an array `[10, 20, 30]` using `while (stack.length > 0)`.

**Expected output:**
```text
Popped: 30
Popped: 20
Popped: 10
```

> [!check]- Answer
> ```javascript
> const stack = [10, 20, 30];
> while (stack.length > 0) {
>   console.log(`Popped: ${stack.pop()}`);
> }
> ```
>
> **Explanation:** Mutating collection boundaries in loop conditions provides clean sentinel termination.

---

---

## 7. Related Terms
- [`for` Loop](../level_02/for_loop.md) — A loop that repeats until a specified condition evaluates to false (better for known iterations).
- [`do...while`](../level_02/do_while.md) — A variation that executes the block at least once.

---

## 8. Key Takeaways
- Use `while` loops when you don't know exactly how many iterations you need.
- The condition is checked *before* the block of code executes. If the condition is false initially, the code never runs.
- You must manually update the condition variable inside the loop to avoid infinite loops.
