# for Loop

> **Level 2 — Control Flow & Data Structures**
> A loop that repeats until a specified condition evaluates to false.

---

## 1. Prerequisites
- [Variable](../level_01/variable.md) — A named container for storing data values.
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
A fundamental power of computers is doing repetitive tasks incredibly fast. If you need to print out numbers 1 through 10,000, writing `console.log()` 10,000 times is impossible. We needed a construct that tells the engine, "Run this block of code over and over again, but keep track of how many times you've done it, and stop when you reach a certain limit."

The `for` loop condenses three critical pieces of iteration into a single, highly readable line: 
1. **Initialization:** Set up a starting counter.
2. **Condition:** Decide when the loop should stop.
3. **Iteration (Update):** Update the counter after each cycle.

### (2) Reality Metaphor
A `for` loop is like running laps around a track with a coach watching you. 
- **Initialization:** The coach hands you a clicker set to `0`.
- **Condition:** The coach says, "Keep running as long as your clicker reads less than 5."
- **Iteration:** Every time you cross the finish line (finish a lap of code), you press the clicker (`+1`). Once the clicker hits 5, the coach yells "Stop!" and you exit the track.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Initialization: let i = 0
// Condition: i < 5
// Update: i++ (increase i by 1)
for (let i = 0; i < 5; i++) {
  console.log(`Current loop iteration: ${i}`);
}
// This will log 0, 1, 2, 3, 4
```

#### Fuller Example
```javascript
const upcomingEvents = ["Conference", "Workshop", "Meetup"];

// A classic use case for a `for` loop is iterating over an array
for (let index = 0; index < upcomingEvents.length; index++) {
  const currentEvent = upcomingEvents[index];
  console.log(`Event ${index + 1}: ${currentEvent}`);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Infinite Loops

**The mistake:** Writing a condition that will never evaluate to false, or forgetting to update the counter, causing the loop to run forever and crash the browser.

**Why it's wrong:** The JavaScript engine is single-threaded. If it gets trapped in an infinite loop, it cannot do anything else (like responding to user clicks or updating the UI) until the loop finishes, which it never will.

*Incorrect:*
```javascript
// i gets smaller, so `i < 10` will ALWAYS be true!
// for (let i = 0; i < 10; i--) {
//   console.log("This will crash the tab.");
// }
```

*Fix:*
```javascript
for (let i = 0; i < 10; i++) {
  // Correctly incrementing towards the exit condition
}
```

### Mistake 2: Off-by-one errors

**The mistake:** Using `<=` instead of `<` when iterating over arrays, causing the loop to try and access an index that doesn't exist.

**Why it's wrong:** Arrays in JavaScript are zero-indexed. If an array has 3 items, its indexes are 0, 1, and 2. The `.length` is 3. If your loop condition is `i <= array.length`, the final iteration will try to access index 3, which is `undefined`.

*Incorrect:*
```javascript
const items = ["A", "B", "C"];
for (let i = 0; i <= items.length; i++) {
  // The last iteration prints "undefined"
}
```

*Fix:*
```javascript
const items = ["A", "B", "C"];
for (let i = 0; i < items.length; i++) {
  // Stops perfectly at index 2
}
```

---

### Mistake 3: Unhandled Asynchronous Failures in For Loop Operations

**The mistake:** Executing asynchronous operations within For Loop without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/for_loop"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/for_loop");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in for_loop: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Counting Backwards

**Problem:** Write a `for` loop that counts down from 10 to 1, logging each number to the console, and then logs "Liftoff!" after the loop finishes.

**Expected output:**
> [!check]- Answer
> ```text
> 10
> 9
> ...
> 1
> Liftoff!
> ```
> - Initialization: `let i = 10`
> - Condition: `i > 0`
> - Update: `i--`
> - Put the `console.log("Liftoff!")` *outside* and *after* the loop body.

---

### Exercise 2: Comparing `for...in` vs `for...of`

**Problem:** Iterate over `["a", "b"]` using both `for...in` and `for...of` and print values.

**Expected output:**
> [!check]- Answer
> ```text
> for...in key: "0" (type string)
> for...in key: "1" (type string)
> for...of val: a
> for...of val: b
> ```
> ```javascript
> const arr = ["a", "b"];
> for (const key in arr) {
>   console.log(`for...in key: "${key}" (type ${typeof key})`);
> }
> for (const val of arr) {
>   console.log(`for...of val: ${val}`);
> }
> ```
>
> **Explanation:** `for...in` inspects object keys as strings; `for...of` iterates values of iterable collections.

---

### Exercise 3: Reverse Array Iteration

**Problem:** Write a `for` loop iterating an array `[10, 20, 30]` in reverse order.

**Expected output:**
> [!check]- Answer
> ```text
> 30
> 20
> 10
> ```
> ```javascript
> const nums = [10, 20, 30];
> for (let i = nums.length - 1; i >= 0; i--) {
>   console.log(nums[i]);
> }
> ```
>
> **Explanation:** Setting initial index `i = length - 1` and decrementing `i--` traverses arrays backwards.

---

## 7. Related Terms
- [while Loop](while_loop.md) — A simpler loop based purely on a condition.
- [Array](array.md) — A list-like object often iterated over using loops.
- [Increment / Decrement (++ / --)](../level_01/increment_decrement.md) — Related concept: Increment / Decrement (++ / --).
- [Array Index & .length](array_index_length.md) — Related concept: Array Index & .length.
- [break / continue](break_continue.md) — Related concept: break / continue.
- [do...while](do_while.md) — Related concept: do...while.
- [forEach()](../level_04/for_each.md) — Related concept: forEach().
---

## 8. Key Takeaways
- The `for` loop is the most common tool for running code a specific number of times.
- It consists of three parts separated by semicolons: `for (initialization; condition; update)`.
- Use `let` (not `const`!) for the initialization variable, because it must be reassigned on every iteration.
- Be careful with your conditions to avoid infinite loops and off-by-one errors.
