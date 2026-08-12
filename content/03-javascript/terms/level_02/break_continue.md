# break / continue

> **Level 2 — Control Flow & Data Structures**
> Exit a loop early / skip to next iteration.

---

## 1. Prerequisites
- [for Loop](for_loop.md) — A loop that repeats until a specified condition evaluates to false.
- [while Loop](while_loop.md) — A loop that executes a block of code as long as the specified condition evaluates to true.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: break / continue is a fundamental concept in this technology stack. **Level 2 — Control Flow & Data Structures**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Order Queue Processing with Error Guard & Halting

**Scenario:** An automated order fulfillment loop processes a queue of orders. It skips cancelled orders using continue and aborts processing entirely using break if a critical payment alert occurs.

**Requirements:**
1. Write processOrderBatch(orders).
2. Skip orders with status "CANCELLED" using continue.
3. Halt processing immediately if order status is "CRITICAL_ERROR" using break.
4. Return processed revenue and count.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processOrderBatch(orders) {
>   let processedRevenue = 0;
>   let count = 0;
>
>   for (let i = 0; i < orders.length; i++) {
>     const item = orders[i];
>     if (item.status === "CANCELLED") {
>       continue;
>     }
>     if (item.status === "CRITICAL_ERROR") {
>       break;
>     }
>     processedRevenue += item.amount;
>     count++;
>   }
>   return { processedRevenue, count };
> }
>
> // Verification tests
> const batch = [
>   { amount: 100, status: "OK" },
>   { amount: 50, status: "CANCELLED" },
>   { amount: 200, status: "CRITICAL_ERROR" },
>   { amount: 300, status: "OK" }
> ];
> const res = processOrderBatch(batch);
> console.assert(res.processedRevenue === 100 && res.count === 1, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Continue Statement**: The continue statement terminates execution of the current loop iteration and proceeds to the next iteration.
> 2. **Break Statement**: The break statement terminates execution of the enclosing loop block immediately.
> 3. **Loop Control Scope**: break and continue apply to the nearest enclosing loop unless a label is specified.
> 
---

### Exercise 2: Spatial Coordinate Matrix Search with Labeled Break

**Scenario:** A GIS mapping engine searches a 2D spatial coordinate grid for a target location identifier, breaking out of nested grid loops instantly using a labeled break statement (break searchGrid).

**Requirements:**
1. Write locateGridTarget(gridMatrix, targetId).
2. Label outer loop as searchGrid: for (...).
3. When targetId matches, capture row/col coordinates and break searchGrid.
4. Return coordinate position.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function locateGridTarget(gridMatrix, targetId) {
>   let targetRow = -1;
>   let targetCol = -1;
>
>   searchGrid: for (let r = 0; r < gridMatrix.length; r++) {
>     for (let c = 0; c < gridMatrix[r].length; c++) {
>       if (gridMatrix[r][c] === targetId) {
>         targetRow = r;
>         targetCol = c;
>         break searchGrid;
>       }
>     }
>   }
>   return { row: targetRow, col: targetCol };
> }
>
> // Verification tests
> const grid = [
>   ["A1", "A2"],
>   ["B1", "TARGET"],
>   ["C1", "C2"]
> ];
> const pos = locateGridTarget(grid, "TARGET");
> console.assert(pos.row === 1 && pos.col === 1, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Labeled Statements**: Prefixing a statement with an identifier label (labelName:) allows targeting outer execution contexts.
> 2. **Multi-Nested Loop Exit**: Passing a label to break labelName exits multi-nested loops directly without extra flag variables.
> 3. **Execution Jump Mechanics**: Labeled break jumps execution directly to the statement immediately following the labeled block.
> 
---

### Exercise 3: Data Stream Filter with Continue Guard

**Scenario:** A real-time data stream pipeline filters out corrupt payload frames using continue before applying expensive mathematical calculations.

**Requirements:**
1. Write processStreamFrames(frames).
2. If frame.isCorrupt is true, skip processing via continue.
3. Calculate total valid frame bytes.
4. Return total valid bytes count.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processStreamFrames(frames) {
>   let totalBytes = 0;
>
>   for (const frame of frames) {
>     if (!frame || frame.isCorrupt) {
>       continue;
>     }
>     totalBytes += frame.byteLength;
>   }
>   return totalBytes;
> }
>
> // Verification tests
> const stream = [
>   { byteLength: 512, isCorrupt: false },
>   { byteLength: 1024, isCorrupt: true },
>   { byteLength: 256, isCorrupt: false }
> ];
> console.assert(processStreamFrames(stream) === 768, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Guard Clause Pattern**: Using continue as a guard clause flattens nested conditional logic inside loops.
> 2. **Loop Continuation**: In for loops, continue jumps to the loop update expression before checking condition.
> 3. **Performance Optimization**: Skipping invalid iterations early avoids wasting CPU cycles on corrupt payloads.
---

## 6. Related Terms
- [for Loop](for_loop.md) — Repetitive block executing a specific number of times.
- [while Loop](while_loop.md) — Repetitive block executing as long as a condition holds true.
- [switch](switch.md) — Conditional branch that also relies on the `break` statement.

---

## 7. Key Takeaways
- The `break` statement terminates the enclosing loop or switch statement immediately, resuming execution at the next statement after the loop.
- The `continue` statement terminates the current loop iteration, skipping remaining code inside the loop and triggering the next loop check.
- Be highly cautious using `continue` inside `while` loops to ensure the loop counter variable is updated before skipping, avoiding infinite loop crashes.
