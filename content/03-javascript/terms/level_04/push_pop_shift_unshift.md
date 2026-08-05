# push / pop / shift / unshift

> **Level 4 — Iteration & Array Methods**
> Add/remove at the end/start of an array (mutating).

---

## 1. Prerequisites
- [Array](../level_02/array.md) — A high-level, list-like object.
- [Array Index & .length](../level_02/array_index_length.md) — Zero-based positional access and size of an array.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In computer science, list structures often need to grow and shrink dynamically. Rather than manually recalculating array positions or modifying length properties (like `arr[arr.length] = val`), JavaScript provides four built-in, highly optimized mutating methods:
- **`push(element)`:** Adds one or more elements to the **end** of the array. Returns the *new length* of the array.
- **`pop()`:** Removes the **last** element from the array and returns it.
- **`unshift(element)`:** Adds one or more elements to the **beginning** of the array. Returns the *new length* of the array.
- **`shift()`:** Removes the **first** element from the array and returns it.

Additionally, these methods are designed with performance trade-offs. `push` and `pop` are highly efficient ($O(1)$ operations) because elements at the end don't affect other positions. In contrast, `shift` and `unshift` are slower ($O(N)$ operations) because the engine must re-index every single subsequent item in memory.

### (2) Reality Metaphor
- **`push` and `pop` (Stack):** Think of a stack of plates on a kitchen shelf. You place a new plate on the top of the stack (`push`), and you retrieve a plate by taking it off the top (`pop`). The plates underneath are never moved.
- **`shift` and `unshift` (Queue):** Think of a line of people waiting for a movie ticket. If someone cuts to the very front of the line (`unshift`), or if the first person gets their ticket and leaves (`shift`), *every single person standing in line* behind them must take a step backward or forward to adjust their position.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const fruits = ["Banana", "Orange"];

fruits.push("Apple");      // Add to end -> ["Banana", "Orange", "Apple"]
const last = fruits.pop(); // Remove from end -> "Apple" (fruits is back to ["Banana", "Orange"])

fruits.unshift("Mango");   // Add to start -> ["Mango", "Banana", "Orange"]
const first = fruits.shift(); // Remove from start -> "Mango" (fruits is back to ["Banana", "Orange"])
```

#### Fuller Example
```javascript
// Implementing a simple undo stack and print queue simulation
const documentHistory = []; // Stack for undo actions

function makeEdit(content) {
  console.log(`Action: ${content}`);
  documentHistory.push(content); // Push edit to top of stack
}

function undo() {
  if (documentHistory.length > 0) {
    const undoneAction = documentHistory.pop(); // Pop latest action off stack
    console.log(`Undone: ${undoneAction}`);
  } else {
    console.log("Nothing to undo.");
  }
}

makeEdit("Type 'Hello'");
makeEdit("Bold text");
undo(); // Undone: Bold text
console.log("Current History:", documentHistory); // [ "Type 'Hello'" ]

// Simulating a print job queue (FIFO: First In, First Out)
const printQueue = [];

function sendToPrinter(docName) {
  printQueue.push(docName); // Add job to end of queue
}

function printNextJob() {
  if (printQueue.length > 0) {
    const activeJob = printQueue.shift(); // Shift job off front of queue
    console.log(`Printing: ${activeJob}`);
  }
}

sendToPrinter("TaxReturn.pdf");
sendToPrinter("Photo.jpg");
printNextJob(); // Printing: TaxReturn.pdf
console.log("Remaining Queue:", printQueue); // [ "Photo.jpg" ]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting `push()` or `unshift()` to return the Modified Array

**The mistake:** Chaining operations on the output of a `push()` call, expecting it to represent the updated array.

**Why it's wrong:** `push()` and `unshift()` return the **new length** (a `Number`) of the array, not the array itself. Trying to chain methods on it will throw errors.

*Incorrect:*
```javascript
const items = ["A", "B"];
const updated = items.push("C").reverse(); // TypeError: items.push(...).reverse is not a function
// Because it evaluates to: 3.reverse()
```

*Fix:*
```javascript
const items = ["A", "B"];
items.push("C"); // Modifies items in-place
items.reverse(); 

console.log(items); // ["C", "B", "A"]
```

---

### Mistake 2: Losing Context Binding (`this`) in Push Pop Shift Unshift Callbacks

**The mistake:** Passing methods from Push Pop Shift Unshift instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "push_pop_shift_unshift",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "push_pop_shift_unshift",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Push Pop Shift Unshift Operations

**The mistake:** Executing asynchronous operations within Push Pop Shift Unshift without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/push_pop_shift_unshift"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/push_pop_shift_unshift");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in push_pop_shift_unshift: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Task Manager

**Problem:** Complete the code to manage a task list. Add `"Clean Room"` to the start of the list, add `"Buy Milk"` to the end, and then remove the last task from the list.

```javascript
const tasks = ["Study JavaScript"];

// Add Clean Room to start
// Add Buy Milk to end
// Remove last task

console.log("Final tasks:", tasks);
```

**Expected output:**
> [!check]- Answer
> ```text
> Final tasks: [ 'Clean Room', 'Study JavaScript' ]
> ```
> - Add to the start using `.unshift()`.
> - Add to the end using `.push()`.
> - Remove from the end using `.pop()`.

---

### Exercise 2: Stack Operations with `push` and `pop`

**Problem:** Push `10` and `20` onto array stack, pop `20`, and print final stack.

**Expected output:**
> [!check]- Answer
> ```text
> Popped: 20, Stack: [ 10 ]
> ```
> ```javascript
> const stack = [];
> stack.push(10);
> stack.push(20);
> const popped = stack.pop();
> console.log(`Popped: ${popped}, Stack: [ ${stack} ]`);
> ```
>
> **Explanation:** `push` appends elements to end; `pop` removes and returns last element ($O(1)$).

---

### Exercise 3: Return Values of Push vs Pop

**Problem:** Print return value of `[1, 2].push(3)` (new length) vs `[1, 2].pop()` (removed value).

**Expected output:**
> [!check]- Answer
> ```text
> push return: 3, pop return: 2
> ```
> ```javascript
> const a = [1, 2];
> console.log(`push return: ${a.push(3)}`);
> const b = [1, 2];
> console.log(`pop return: ${b.pop()}`);
> ```
>
> **Explanation:** `push()` returns the new array length; `pop()` returns the removed element.


---

## 7. Related Terms
- [Mutating vs Non-mutating Methods](mutating_vs_non_mutating.md) — The distinction between changing arrays in-place or returning new ones.
- [slice / splice](slice_splice.md) — Index-based sub-array slicing and splicing.
- [Array](../level_02/array.md) — Related concept: Array.

---

## 8. Key Takeaways
- `push` (end) and `unshift` (start) add elements and return the new array `length`.
- `pop` (end) and `shift` (start) remove elements and return the removed element value.
- `push` and `pop` are high-performance $O(1)$ operations; `shift` and `unshift` are slower $O(N)$ operations because they force the engine to re-index all elements.
- All four methods mutate the original array reference in-place.
