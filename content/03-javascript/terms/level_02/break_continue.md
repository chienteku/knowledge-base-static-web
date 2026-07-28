# break / continue

> **Level 2 — Control Flow & Data Structures**
> Exit a loop early / skip to next iteration.

---

## 1. Prerequisites
- [`for` Loop](../level_02/for_loop.md) — A loop that repeats until a specified condition evaluates to false.
- [`while` Loop](../level_02/while_loop.md) — A loop that executes a block of code as long as the specified condition evaluates to true.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Loops execute blocks of code repeatedly. However, there are scenarios where running a loop to completion is inefficient or incorrect. For example, if you are searching for a specific user in an array of one million items, once you find the user, running the remaining 999,999 iterations is a massive waste of computer resources. 

To solve this, the TC39 committee implemented the control flow keywords `break` and `continue`:
- **`break`** allows a program to immediately terminate the loop and jump to the code directly after it, saving CPU cycles.
- **`continue`** allows a program to skip the remainder of the current loop iteration and jump straight to the evaluation of the next iteration.

### (2) Reality Metaphor
- **`break`** is like pulling the emergency brake on a train. No matter where the train is on its route, the train stops immediately, and passengers get off.
- **`continue`** is like a mail delivery person encountering a house with a "No Mail Today" sign. They skip walking up to that house's mailbox (skipping the remainder of the iteration) and immediately drive to the next house on the route.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Demonstrating break and continue in a basic for loop
for (let i = 1; i <= 5; i++) {
  if (i === 2) {
    continue; // Skip the rest of this iteration (leaves out 2)
  }
  if (i === 4) {
    break; // Exit the loop entirely once we hit 4
  }
  console.log(i); // Logs 1, then 3
}
```

#### Fuller Example
```javascript
// A database search logic scanning for a premium user's record
const userDatabase = [
  { id: 101, name: "Alice", type: "standard" },
  { id: 102, name: "Bob", type: "guest" },
  { id: 103, name: "Charlie", type: "premium" },
  { id: 104, name: "David", type: "premium" },
  { id: 105, name: "Eve", type: "standard" }
];

let targetUser = null;

for (let i = 0; i < userDatabase.length; i++) {
  const user = userDatabase[i];

  // Skip standard/guest users using continue
  if (user.type !== "premium") {
    console.log(`Skipping standard/guest user: ${user.name}`);
    continue;
  }

  // Once the first premium user is found, grab it and stop the loop with break
  console.log(`Premium user found: ${user.name}! Stopping search.`);
  targetUser = user;
  break;
}

console.log("Search Result:", targetUser);
// Logs:
// Skipping standard/guest user: Alice
// Skipping standard/guest user: Bob
// Premium user found: Charlie! Stopping search.
// Search Result: { id: 103, name: 'Charlie', type: 'premium' }
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Infinite Loops with `continue` in `while` Loops

**The mistake:** Using `continue` in a `while` loop before incrementing the iterator variable.

**Why it's wrong:** Unlike a `for` loop (which executes its update expression in the header), a `while` loop updates its loop counter inside the body. If the `continue` keyword is hit before the counter is updated, the code jumps back to the condition with the *exact same* counter value, causing the loop to run forever.

*Incorrect:*
```javascript
let count = 0;

while (count < 5) {
  if (count === 2) {
    continue; // Will jump to "count < 5" without incrementing count! Infinite loop!
  }
  console.log(count);
  count++;
}
```

*Fix:*
```javascript
let count = 0;

while (count < 5) {
  if (count === 2) {
    count++; // Manually update the counter variable BEFORE continue
    continue;
  }
  console.log(count);
  count++;
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Break Continue Callbacks

**The mistake:** Passing methods from Break Continue instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "break_continue",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "break_continue",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Break Continue Operations

**The mistake:** Executing asynchronous operations within Break Continue without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/break_continue"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/break_continue");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in break_continue: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Finding the First Even Number

**Problem:** Complete the code to find the first even number in the array. Once found, assign it to `firstEven` and exit the loop immediately.

```javascript
const numbers = [11, 23, 8, 14, 21, 32];
let firstEven = null;

for (let i = 0; i < numbers.length; i++) {
  // Check if number is even
  // Assign to firstEven and break
}

console.log("First even number:", firstEven);
```

**Expected output:**
> [!check]- Answer
> ```text
> First even number: 8
> ```
> - A number is even if `(num % 2) === 0`.
> - Use `break` to exit the loop once the condition evaluates to true.

---

### Exercise 2: Labeled Break Statements in Nested Loops

**Problem:** Use a labeled break `outerLoop:` to exit a double nested loop when `i === 1 && j === 1`.

**Expected output:**
> [!check]- Answer
> ```text
> Exited outer loop at i: 1, j: 1
> ```
> ```javascript
> outerLoop:
> for (let i = 0; i < 3; i++) {
>   for (let j = 0; j < 3; j++) {
>     if (i === 1 && j === 1) {
>       console.log(`Exited outer loop at i: ${i}, j: ${j}`);
>       break outerLoop;
>     }
>   }
> }
> ```
>
> **Explanation:** Labeled `break labelName;` terminates multi-level nested loops specified by the target label.

---

### Exercise 3: Skipping Odd Numbers with `continue`

**Problem:** Print even numbers between `1` and `6` using a loop with `continue`.

**Expected output:**
> [!check]- Answer
> ```text
> 2
> 4
> 6
> ```
> ```javascript
> for (let i = 1; i <= 6; i++) {
>   if (i % 2 !== 0) continue;
>   console.log(i);
> }
> ```
>
> **Explanation:** `continue` skips the remainder of the current iteration body and jumps to loop step updates.

---

## 7. Related Terms
- [`for` Loop](../level_02/for_loop.md) — Repetitive block executing a specific number of times.
- [`while` Loop](../level_02/while_loop.md) — Repetitive block executing as long as a condition holds true.
- [`switch`](../level_02/switch.md) — Conditional branch that also relies on the `break` statement.

---

## 8. Key Takeaways
- The `break` statement terminates the enclosing loop or switch statement immediately, resuming execution at the next statement after the loop.
- The `continue` statement terminates the current loop iteration, skipping remaining code inside the loop and triggering the next loop check.
- Be highly cautious using `continue` inside `while` loops to ensure the loop counter variable is updated before skipping, avoiding infinite loop crashes.
