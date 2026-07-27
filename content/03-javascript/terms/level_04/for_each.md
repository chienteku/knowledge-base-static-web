# forEach()

> **Level 4 — Iteration & Array Methods**
> Executes a provided function once for each array element without returning a new array.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — An ordered list of values.
- [Callback Function](../level_03/callback_function.md) — A function passed into another function.

---

## 2. Term Category
- **Array Method / Functional Programming**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before ES5 (2009), the only way to loop through an array was using a traditional `for` loop (`for(let i = 0; i < arr.length; i++)`). This required managing an index counter, checking the array length, and manually accessing `arr[i]`. It was a lot of boilerplate code for a very simple, repetitive task.

`forEach()` was designed as a declarative, functional alternative. It abstracts away the index management. You simply provide it a Callback Function, and the array will automatically iterate through itself, feeding each item into your callback one by one. It is specifically designed for performing "side effects" (like logging to the console, or modifying the DOM) rather than transforming data.

### (2) Reality Metaphor
A traditional `for` loop is like a teacher having a class roster. The teacher has to look at row 1, call the student's name, grade their paper, then manually move their finger down to row 2, and repeat until the bottom of the list.

`forEach()` is like a factory conveyor belt. The array puts each item on the belt, and as the item passes your workstation (the Callback Function), you perform your action on it automatically. You don't have to count or manage the belt itself.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const colors = ["red", "blue", "green"];

// The callback function automatically receives the current element
colors.forEach((color) => {
  console.log(`I like the color ${color}`);
});
```

#### Fuller Example
```javascript
const scores = [85, 92, 78, 100];
let total = 0;

// The callback can optionally accept the 'index' and the full 'array'
scores.forEach((score, index) => {
  console.log(`Student ${index + 1} scored: ${score}`);
  
  // A "side effect": modifying an external variable
  total += score;
});

console.log(`Class Average: ${total / scores.length}`);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to return a new array from `forEach`

**The mistake:** Expecting `forEach` to behave like `map()` and return a new array based on the `return` statement inside the callback.

**Why it's wrong:** `forEach` is strictly designed for side effects. It always returns `undefined`, regardless of what you return inside its callback. If you need to transform data and get a new array back, you must use `.map()`.

*Incorrect:*
```javascript
const numbers = [1, 2, 3];
// Developer expects 'doubled' to be [2, 4, 6]
const doubled = numbers.forEach(num => num * 2); 

console.log(doubled); // undefined
```

*Fix:*
```javascript
const numbers = [1, 2, 3];
// You have to manually push to an external array (or just use .map()!)
const doubled = [];
numbers.forEach(num => doubled.push(num * 2)); 
```

---

### Mistake 2: Losing Context Binding (`this`) in For Each Callbacks

**The mistake:** Passing methods from For Each instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "for_each",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "for_each",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in For Each Operations

**The mistake:** Executing asynchronous operations within For Each without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/for_each"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/for_each");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in for_each: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Logging inventory

**Problem:** Create an array of strings: `["Apple", "Banana", "Cherry"]`. Use `forEach` to log a string in the format `"Item X: [Fruit]"` where X is the 1-based index (e.g., "Item 1: Apple").

**Expected output:**
```text
Item 1: Apple
Item 2: Banana
Item 3: Cherry
```

> [!check]- Answer
> - `fruits.forEach((fruit, index) => { console.log(`Item ${index + 1}: ${fruit}`); });`

---

### Exercise 2: Side Effect Logging with `forEach`

**Problem:** Log elements of `["a", "b"]` with their 0-indexed positions using `forEach`.

**Expected output:**
```text
0: a
1: b
```

> [!check]- Answer
> ```javascript
> ["a", "b"].forEach((item, index) => {
>   console.log(`${index}: ${item}`);
> });
> ```
>
> **Explanation:** `forEach` passes `(element, index, array)` parameters to callback iterators.

### Exercise 3: Array Index Mutation in `forEach`

**Problem:** Mutate array elements in-place using `forEach((val, idx, arr) => arr[idx] = val * 2)`.

**Expected output:**
```text
[ 2, 4, 6 ]
```

> [!check]- Answer
> ```javascript
> const nums = [1, 2, 3];
> nums.forEach((val, i, arr) => arr[i] = val * 2);
> console.log(nums);
> ```
>
> **Explanation:** The 3rd parameter `arr` allows targeted in-place index mutation during iteration.

---

---

## 7. Related Terms
- [`map()`](../level_04/map.md) — Iterates and *returns a new array* of transformed data.
- [`for` Loop](../level_02/for_loop.md) — The traditional, imperative way to loop.

---

## 8. Key Takeaways
- `forEach()` executes a callback function once for every item in an array.
- It abstracts away the index management of a traditional `for` loop.
- It always returns `undefined`.
- It is ideal for side effects (logging, mutating external variables, updating the DOM).
