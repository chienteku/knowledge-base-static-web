# Array

> **Level 2 — Control Flow & Data Structures**
> A high-level, list-like object for storing an ordered collection of multiple values.

---

## 1. Prerequisites
- [Variable](../level_01/variable.md) — A named container for storing data values.
- [Primitive Types](../level_01/primitive_types.md) — Basic immutable data types.

---

## 2. Term Category
- **Data Structure**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Array Manipulation

**Problem:** Create an array called `todos` with two strings: `"Wake up"` and `"Eat breakfast"`. Use an array method to add `"Go to work"` to the end of the array. Then log the entire array.

**Expected output:**
> [!check]- Answer
> ```text
> ["Wake up", "Eat breakfast", "Go to work"]
> ```
> - Use `todos.push("Go to work");` to add an item to the end of the array.

---

### Exercise 2: Filling Sparse Arrays safely

**Problem:** Create a 5-element array filled with number `0` using `Array(5).fill(0)`.

**Expected output:**
> [!check]- Answer
> ```text
> [ 0, 0, 0, 0, 0 ]
> ```
> ```javascript
> const arr = Array(5).fill(0);
> console.log(arr);
> ```
>
> **Explanation:** `Array(n).fill(val)` populates empty sparse array slots with default initial values.

---

### Exercise 3: Array Reference Comparison

**Problem:** Compare `[1, 2] === [1, 2]` and explain why array equality checks return `false`.

**Expected output:**
> [!check]- Answer
> ```text
> false
> ```
> ```javascript
> console.log([1, 2] === [1, 2]);
> ```
>
> **Explanation:** Arrays are reference types in JavaScript; two separate literals reside at distinct memory addresses.

---

## 7. Related Terms
- [Object](object.md) — A collection of key-value pairs (Arrays are technically a type of Object).
- [for Loop](for_loop.md) — The most common way to iterate through an Array.
- [Array Index & .length](array_index_length.md) — Related concept: Array Index & .length.
- [Set](../level_08/set.md) — Related concept: Set.
- [push / pop / shift / unshift](../level_04/push_pop_shift_unshift.md) — Mutating methods.

---

## 8. Key Takeaways
- Arrays are ordered lists of values enclosed in square brackets `[]`.
- They are **0-indexed**, meaning the first item is at index `0`.
- The `.length` property returns the total number of items in the array.
- In JavaScript, Arrays can hold mixed data types, but usually, it's best to store a single type of data (like an array of all strings or all numbers).
