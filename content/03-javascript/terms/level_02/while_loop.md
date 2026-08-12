# while Loop

> **Level 2 — Control Flow & Data Structures**
> A loop that executes a block of code as long as the specified condition evaluates to true.

---

## 1. Prerequisites
- [Boolean](../level_01/boolean.md) — A logical entity having two values: `true` or `false`.
- [Statement](../level_01/statement.md) — An instruction that performs an action.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: while Loop is a fundamental concept in this technology stack. **Level 2 — Control Flow & Data Structures**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Job Queue Batch Processor with Work Limit

**Scenario:** A background worker processes a queue array using a while loop while items remain in the queue (queue.length > 0) and processed count is below batch limit.

**Requirements:**
1. Write processJobQueue(jobQueue, batchLimit).
2. Process jobs while queue.length > 0 and processed < batchLimit.
3. Remove item using queue.shift().
4. Return processed items.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processJobQueue(jobQueue, batchLimit) {
>   const queue = [...jobQueue];
>   const processed = [];
>
>   while (queue.length > 0 && processed.length < batchLimit) {
>     const job = queue.shift();
>     processed.push(job);
>   }
>   return { processed, remainingCount: queue.length };
> }
>
> // Verification tests
> const res = processJobQueue(["job1", "job2", "job3", "job4"], 2);
> console.assert(res.processed.length === 2, "Test 1 Failed");
> console.assert(res.remainingCount === 2, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Pre-Check Condition**: A while loop tests its condition before executing the loop body statement.
> 2. **Queue Draining Pattern**: Loop condition while (queue.length > 0) drains work queues dynamically.
> 3. **Infinite Loop Prevention**: Ensure loop body mutates state toward condition termination.
> 
---

### Exercise 2: Financial Compounding Periods Halving Counter

**Scenario:** A financial algorithm determines how many compounding periods are required for a debt balance to halve by repeatedly dividing balance in a while loop.

**Requirements:**
1. Write countHalvingPeriods(initialBalance, targetBalance).
2. Divide balance by 2 inside while (balance > targetBalance).
3. Increment period count.
4. Return period count.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function countHalvingPeriods(initialBalance, targetBalance) {
>   let balance = initialBalance;
>   let periods = 0;
>
>   while (balance > targetBalance) {
>     balance /= 2;
>     periods++;
>   }
>   return periods;
> }
>
> // Verification tests
> const periods = countHalvingPeriods(100, 25);
> console.assert(periods === 2, "Test 1 Failed: 100 -> 50 -> 25 requires 2 periods");
> ```
>
> #### Technical Explanation
>
> 1. **Dynamic Halving**: While loops suit scenarios where iteration count is determined dynamically by mathematical state.
> 2. **State Mutation Requirement**: Modifying balance /= 2 inside the body guarantees reaching the termination condition.
> 3. **Pre-Test Safety**: If initial balance <= target, the loop body executes 0 times safely.
> 
---

### Exercise 3: Linked Data Node Traversal Engine

**Scenario:** A graph data structure utility traverses a chain of linked node objects (node = node.next) using a while (node !== null) loop until reaching the end node.

**Requirements:**
1. Write traverseLinkedList(headNode).
2. Traverse chain using while (currentNode !== null).
3. Collect node values into array.
4. Return values array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function traverseLinkedList(headNode) {
>   const values = [];
>   let currentNode = headNode;
>
>   while (currentNode !== null) {
>     values.push(currentNode.value);
>     currentNode = currentNode.next;
>   }
>   return values;
> }
>
> // Verification tests
> const list = { value: "A", next: { value: "B", next: { value: "C", next: null } } };
> const res = traverseLinkedList(list);
> console.assert(res.join(",") === "A,B,C", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Pointer Traversal Pattern**: while (node !== null) is the standard pattern for traversing pointer-linked data structures.
> 2. **Null Termination**: Reaching next === null terminates loop execution cleanly.
> 3. **Variable Reference Updating**: Updating currentNode = currentNode.next advances traversal to subsequent heap memory references.
---

## 6. Related Terms
- [for Loop](for_loop.md) — A loop that repeats until a specified condition evaluates to false (better for known iterations).
- [do...while](do_while.md) — A variation that executes the block at least once.
- [break / continue](break_continue.md) — Related concept: break / continue.

---

## 7. Key Takeaways
- Use `while` loops when you don't know exactly how many iterations you need.
- The condition is checked *before* the block of code executes. If the condition is false initially, the code never runs.
- You must manually update the condition variable inside the loop to avoid infinite loops.
