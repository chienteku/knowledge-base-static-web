# for Loop

> **Level 2 — Control Flow & Data Structures**
> A loop that repeats until a specified condition evaluates to false.

---

## 1. Prerequisites
- [Variable](../level_01/variable.md) — A named container for storing data values.
- [Statement](../level_01/statement.md) — An instruction that performs an action.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: for Loop is a fundamental concept in this technology stack. **Level 2 — Control Flow & Data Structures**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Batch Transaction Subtotal & Fee Accumulator

**Scenario:** A payment gateway iterates through an array of transaction amounts using a standard counting for loop, accumulating gross subtotal, processing fees, and net payouts.

**Requirements:**
1. Write calculateBatchFinancials(transactions, feeRate).
2. Initialize accumulator variables.
3. Use a 3-part for loop (let i = 0; i < transactions.length; i++).
4. Return object { grossSubtotal, totalFees, netPayout }.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function calculateBatchFinancials(transactions, feeRate) {
>   let grossSubtotal = 0;
>   let totalFees = 0;
>
>   for (let i = 0; i < transactions.length; i++) {
>     const amount = transactions[i];
>     const fee = amount * feeRate;
>     grossSubtotal += amount;
>     totalFees += fee;
>   }
>
>   const netPayout = grossSubtotal - totalFees;
>   return {
>     grossSubtotal: Number(grossSubtotal.toFixed(2)),
>     totalFees: Number(totalFees.toFixed(2)),
>     netPayout: Number(netPayout.toFixed(2))
>   };
> }
>
> // Verification tests
> const res = calculateBatchFinancials([100, 200, 300], 0.02);
> console.assert(res.grossSubtotal === 600.00, "Test 1 Failed");
> console.assert(res.totalFees === 12.00, "Test 2 Failed");
> console.assert(res.netPayout === 588.00, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **3-Part Syntax**: A for loop defines initialization, test condition, and final update expression: for (init; test; update).
> 2. **Counter Scope**: Declaring counter with let i = 0 binds i strictly within the loop's block scope.
> 3. **Sequential Index Access**: Accessing array[i] sequentially in a counting loop is highly optimized by JS engines.
> 
---

### Exercise 2: Array Reverse Matrix In-Place Swap

**Scenario:** A signal processing module reverses array elements in place by iterating backwards from array.length - 1 down to 0 using a decrementing for loop.

**Requirements:**
1. Write reverseArrayInPlace(items).
2. Iterate backwards using for (let i = items.length - 1; i >= 0; i--).
3. Push elements into reversed array.
4. Return reversed array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function reverseArrayInPlace(items) {
>   const reversed = [];
>   for (let i = items.length - 1; i >= 0; i--) {
>     reversed.push(items[i]);
>   }
>   return reversed;
> }
>
> // Verification tests
> const output = reverseArrayInPlace([1, 2, 3, 4]);
> console.assert(output.join(",") === "4,3,2,1", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Backward Iteration**: Setting init to length - 1 and decrementing i-- iterates elements in reverse order.
> 2. **Condition Boundary**: Test condition i >= 0 ensures the first element (index 0) is included in iteration.
> 3. **Index Arithmetic**: Customizing update expressions permits arbitrary step sizes or directional traversal.
> 
---

### Exercise 3: Strided Telemetry Sampling Downsampler

**Scenario:** A charting library downsamples high-frequency telemetry data by picking every Nth sample, incrementing the for loop index by step size (i += step).

**Requirements:**
1. Write downsampleReadings(readings, stepSize).
2. Iterate using for (let i = 0; i < readings.length; i += stepSize).
3. Collect sampled elements.
4. Return downsampled array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function downsampleReadings(readings, stepSize) {
>   if (stepSize <= 0) return [];
>   const sampled = [];
>   for (let i = 0; i < readings.length; i += stepSize) {
>     sampled.push(readings[i]);
>   }
>   return sampled;
> }
>
> // Verification tests
> const sample = downsampleReadings([10, 20, 30, 40, 50, 60], 2);
> console.assert(sample.join(",") === "10,30,50", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Custom Step Update**: Updating index via i += stepSize skips array elements efficiently without evaluating unneeded slots.
> 2. **Boundary Protection**: The condition i < readings.length prevents accessing out-of-bound undefined indices.
> 3. **Performance Control**: Strided for loops minimize memory overhead compared to intermediate array filtering.
---

## 6. Related Terms
- [while Loop](while_loop.md) — A simpler loop based purely on a condition.
- [Array](array.md) — A list-like object often iterated over using loops.
- [Increment / Decrement (++ / --)](../level_01/increment_decrement.md) — Related concept: Increment / Decrement (++ / --).
- [Array Index & .length](array_index_length.md) — Related concept: Array Index & .length.
- [break / continue](break_continue.md) — Related concept: break / continue.
- [do...while](do_while.md) — Related concept: do...while.
- [forEach()](../level_04/for_each.md) — Related concept: forEach().

---

## 7. Key Takeaways
- The `for` loop is the most common tool for running code a specific number of times.
- It consists of three parts separated by semicolons: `for (initialization; condition; update)`.
- Use `let` (not `const`!) for the initialization variable, because it must be reassigned on every iteration.
- Be careful with your conditions to avoid infinite loops and off-by-one errors.
