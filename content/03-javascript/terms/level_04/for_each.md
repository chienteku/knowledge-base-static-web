# forEach()

> **Level 4 — Iteration & Array Methods**
> Executes a provided function once for each array element without returning a new array.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — An ordered list of values.
- [Callback Function](../level_03/callback_function.md) — A function passed into another function.

---

## 2. Term Category

**Array Method / Functional Programming (Universal: Works everywhere)**: forEach() is a fundamental concept in this technology stack. **Level 4 — Iteration & Array Methods**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Side-Effect Metrics Aggregator & Logger

**Scenario:** A telemetry logging service iterates through request metric objects using forEach(), sending log data to an external logger sink.

**Requirements:**
1. Write logMetrics(metricsList, loggerFn).
2. Iterate using metricsList.forEach(m => loggerFn(m)).
3. Return processed item count.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function logMetrics(metricsList, loggerFn) {
>   if (!Array.isArray(metricsList) || typeof loggerFn !== "function") return 0;
>   let count = 0;
>   metricsList.forEach(metric => {
>     loggerFn(metric);
>     count++;
>   });
>   return count;
> }
>
> // Verification tests
> let loggedCount = 0;
> logMetrics([{ req: 1 }, { req: 2 }], () => { loggedCount++; });
> console.assert(loggedCount === 2, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **forEach() Purpose**: Array.prototype.forEach(callback) executes a provided callback for each array element for side-effects.
> 2. **Return Value is undefined**: forEach() always returns undefined and cannot be chained.
> 3. **Non-Breakable Loop**: forEach() cannot be stopped early using break or return statements.
---

## 6. Related Terms
- [Map](../level_08/map.md) — Iterates and *returns a new array* of transformed data.
- [for Loop](../level_02/for_loop.md) — The traditional, imperative way to loop.
- [for...of](for_of.md) — Related concept: for...of.
- [querySelectorAll & NodeList](../level_05/queryselectorall_nodelist.md) — Related concept: querySelectorAll & NodeList.

---

## 7. Key Takeaways
- `forEach()` executes a callback function once for every item in an array.
- It abstracts away the index management of a traditional `for` loop.
- It always returns `undefined`.
- It is ideal for side effects (logging, mutating external variables, updating the DOM).
