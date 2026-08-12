# Array

> **Level 2 — Control Flow & Data Structures**
> A high-level, list-like object for storing an ordered collection of multiple values.

---

## 1. Prerequisites
- [Variable](../level_01/variable.md) — A named container for storing data values.
- [Primitive Types](../level_01/primitive_types.md) — Basic immutable data types.

---

## 2. Term Category

**Data Structure (Universal: Works everywhere)**: Array is a fundamental concept in this technology stack. **Level 2 — Control Flow & Data Structures**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If a program needs to store the names of 100 students, creating 100 separate variables (`let student1 = "Alice"; let student2 = "Bob";`) is completely unmanageable. We needed a single data structure that could hold a list of multiple values, keep them in a specific order, and provide an easy way to access, add, or remove items. 

The Array was designed to solve this problem. In JavaScript, an Array is technically a specialized Object where the keys are numbers (indexes starting at 0). It comes with a massive suite of built-in methods (like `.push()`, `.pop()`, `.map()`) that make list manipulation incredibly powerful.

### (2) Reality Metaphor
An Array is like a pill organizer with numbered compartments. The whole organizer is the Array. The compartments are the "indexes" (0, 1, 2, 3...). You can put different pills (values) into different compartments. If you want the pill from Tuesday, you just open compartment `1`.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Creating an array of strings
const colors = ["red", "blue", "green"];

// Accessing the first item (Arrays are 0-indexed)
console.log(colors[0]); // "red"
```

#### Fuller Example
```javascript
const highScores = [98, 72, 85];

// Adding a new score to the END of the array
highScores.push(100);

// Removing the LAST score from the array
const removedScore = highScores.pop(); 

console.log(highScores);  // [98, 72, 85]
console.log(`Length: ${highScores.length}`); // 3

// Arrays can hold mixed data types (though it's generally best practice to keep them uniform)
const mixedArray = ["Alice", 42, true, null];
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Off-by-one errors with `.length`

**The mistake:** Assuming that `array[array.length]` will return the last item in the array.

**Why it's wrong:** Because arrays are 0-indexed, the highest index is always one less than the length. If an array has 3 items, its length is 3, but its indexes are 0, 1, and 2. Trying to access `array[3]` will return `undefined`.

*Incorrect:*
```javascript
const fruits = ["Apple", "Banana", "Cherry"];
const lastFruit = fruits[fruits.length]; // Returns undefined!
```

*Fix:*
```javascript
const fruits = ["Apple", "Banana", "Cherry"];
// Subtract 1 to get the actual last index
const lastFruit = fruits[fruits.length - 1]; // "Cherry"

// Modern JS shortcut:
const modernLast = fruits.at(-1); // "Cherry"
```

---

### Mistake 2: Losing Context Binding (`this`) in Array Callbacks

**The mistake:** Passing methods from Array instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "array",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "array",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Array Operations

**The mistake:** Executing asynchronous operations within Array without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/array"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/array");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in array: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Order Processing Queue Manager

**Scenario:** An inventory fulfillment service stores ordered item objects in an array. It adds incoming batch items to the end using .push(), removes processed items from the front using .shift(), and tracks queue length.

**Requirements:**
1. Write a function processOrderQueue(initialQueue, newItems).
2. Use .push() to add new item objects.
3. Use .shift() to remove the first processed item.
4. Return an object containing { updatedQueue, processedItem, queueLength }.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processOrderQueue(initialQueue, newItems) {
>   const queue = [...initialQueue];
>   for (const item of newItems) {
>     queue.push(item);
>   }
>   const processedItem = queue.shift();
>   return {
>     updatedQueue: queue,
>     processedItem: processedItem,
>     queueLength: queue.length
>   };
> }
>
> // Verification tests
> const res = processOrderQueue([{ id: 1 }, { id: 2 }], [{ id: 3 }]);
> console.assert(res.processedItem.id === 1, "Test 1 Failed");
> console.assert(res.queueLength === 2, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Ordered Indexing**: Arrays store ordered sequences of elements accessible via zero-based integer indices.
> 2. **Mutating Array Methods**: Methods like .push() and .shift() modify the underlying array length and element placement in place.
> 3. **Dynamic Resizing**: JavaScript arrays automatically expand or shrink memory allocation as elements are added or removed.
> 
---

### Exercise 2: User Role Permission Array Merger

**Scenario:** An authorization middleware merges existing user role arrays with new granted capability roles, ensuring unique non-duplicate entries.

**Requirements:**
1. Write mergePermissions(existingRoles, newRoles).
2. Combine role arrays into a single array.
3. Remove duplicate role entries.
4. Return the combined permissions array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function mergePermissions(existingRoles, newRoles) {
>   const combined = existingRoles.concat(newRoles);
>   const uniqueRoles = [];
>   for (const role of combined) {
>     if (!uniqueRoles.includes(role)) {
>       uniqueRoles.push(role);
>     }
>   }
>   return uniqueRoles;
> }
>
> // Verification tests
> const perms = mergePermissions(["read", "write"], ["write", "execute"]);
> console.assert(perms.length === 3, "Test 1 Failed");
> console.assert(perms.includes("execute"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Non-Mutating Combination**: The .concat() method produces a new array combining elements without mutating source arrays.
> 2. **Element Searching**: The .includes() method inspects array element presence returning a boolean primitive.
> 3. **Reference Identity**: Arrays are reference objects stored on the heap; two distinct arrays with identical elements are not reference-equal.
> 
---

### Exercise 3: Sliding Metric Window Buffer

**Scenario:** A server monitoring agent maintains a sliding window array of CPU usage metrics, capping maximum array length by removing old readings when limits are exceeded.

**Requirements:**
1. Write pushTelemetryReading(windowArray, newReading, maxSize).
2. Push new metric reading to array.
3. If array length exceeds maxSize, remove oldest element from front.
4. Return updated window array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function pushTelemetryReading(windowArray, newReading, maxSize) {
>   const updated = [...windowArray];
>   updated.push(newReading);
>   while (updated.length > maxSize) {
>     updated.shift();
>   }
>   return updated;
> }
>
> // Verification tests
> const buffer = pushTelemetryReading([45, 50, 55], 60, 3);
> console.assert(buffer.length === 3, "Test 1 Failed");
> console.assert(buffer[0] === 50 && buffer[2] === 60, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Array Length Bound**: The .length property reflects the highest integer index plus one.
> 2. **Sliding Window Pattern**: Combining .push() and .shift() converts an array into a fixed-capacity FIFO queue.
> 3. **Shallow Copying**: Using spread syntax [...arr] creates a shallow copy, preserving original input immutability.
---

## 6. Related Terms
- [Object](object.md) — A collection of key-value pairs (Arrays are technically a type of Object).
- [for Loop](for_loop.md) — The most common way to iterate through an Array.
- [Array Index & .length](array_index_length.md) — Related concept: Array Index & .length.
- [Set](../level_08/set.md) — Related concept: Set.
- [push / pop / shift / unshift](../level_04/push_pop_shift_unshift.md) — Mutating methods.

---

## 7. Key Takeaways
- Arrays are ordered lists of values enclosed in square brackets `[]`.
- They are **0-indexed**, meaning the first item is at index `0`.
- The `.length` property returns the total number of items in the array.
- In JavaScript, Arrays can hold mixed data types, but usually, it's best to store a single type of data (like an array of all strings or all numbers).
