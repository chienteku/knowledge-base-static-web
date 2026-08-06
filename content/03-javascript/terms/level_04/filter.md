# filter()

> **Level 4 — Iteration & Array Methods**
> Creates a new array with all elements that pass the test implemented by the provided function.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — An ordered list of values.
- [Truthy / Falsy](../level_02/truthy_falsy.md) — Values that evaluate to boolean true or false.

---

## 2. Term Category
- **Array Method / Functional Programming**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Often, you have a massive dataset but you only care about a specific subset of it: finding all users over age 18, finding all products under $50, or removing all empty strings from a list. 

Like `map()`, doing this manually with a `for` loop requires creating an empty array, writing an `if` statement, pushing to the new array, and returning it. `filter()` was designed to abstract this. You provide a callback function that acts as a true/false test. `filter()` automatically builds a new array, runs your test on every item, and only copies the items into the new array if they pass the test (return a "Truthy" value).

### (2) Reality Metaphor
`filter()` is like a nightclub bouncer holding a guest list. A massive line of people (the Array) approaches the door. The bouncer checks each person against a specific rule: "Are you wearing sneakers?" (the Callback function). If the answer is `false`, they are turned away. If the answer is `true`, they are allowed into the club (the New Array).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const numbers = [1, 2, 3, 4, 5, 6];

// The callback must return true or false (or a truthy/falsy value)
const evens = numbers.filter((num) => {
  return num % 2 === 0; // true if even, false if odd
});

console.log(evens); // [2, 4, 6]
```

#### Fuller Example
```javascript
const inventory = [
  { name: "Apples", type: "fruit", count: 10 },
  { name: "Carrots", type: "vegetable", count: 5 },
  { name: "Bananas", type: "fruit", count: 0 },
  { name: "Broccoli", type: "vegetable", count: 12 }
];

// Find all items that are fruits AND are in stock
const inStockFruits = inventory.filter(item => item.type === "fruit" && item.count > 0);

console.log(inStockFruits);
// Output: [ { name: "Apples", type: "fruit", count: 10 } ]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to return the *value* instead of a *boolean*

**The mistake:** Writing the callback function as if you are using `map()`, returning the actual data you want instead of a true/false condition.

**Why it's wrong:** `filter()` does not transform data. It only uses your return value to evaluate `true` or `false`. If you return a truthy value (like an object or a string), `filter()` simply says "Ah, they passed the test!" and copies the original item into the new array. 

*Incorrect:*
```javascript
const words = ["hi", "hello", "hey"];

// Developer wants an array of just the word "hello"
const result = words.filter(word => {
  if (word === "hello") {
    return word; // This is a string, which is truthy!
  }
});

// Since the string "hello" is truthy, it passes.
// The others implicitly return undefined (falsy), so they fail.
// This "happens" to work, but is terrible practice!
```

*Fix:*
```javascript
// Return a boolean expression!
const result = words.filter(word => word === "hello"); 
```

---

### Mistake 2: Losing Context Binding (`this`) in Filter Callbacks

**The mistake:** Passing methods from Filter instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "filter",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "filter",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Filter Operations

**The mistake:** Executing asynchronous operations within Filter without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/filter"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/filter");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in filter: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Cleanup

**Problem:** You have an array: `[0, "apple", false, "banana", "", "cherry", null]`. Use `filter()` to remove all falsy values from the array, leaving only the valid strings.

**Expected output:**
> [!check]- Answer
> ```text
> ["apple", "banana", "cherry"]
> ```
> - The callback just needs to return truthy or falsy. 
> - You can simply write: `array.filter(item => item);` ! If the item itself is truthy, it passes. If it is falsy, it fails.
> 
---

### Exercise 2: Filtering Even Numbers

**Problem:** Filter `[1, 2, 3, 4, 5, 6]` to extract even numbers.

**Expected output:**
> [!check]- Answer
> ```text
> [ 2, 4, 6 ]
> ```
> ```javascript
> const nums = [1, 2, 3, 4, 5, 6];
> const evens = nums.filter(x => x % 2 === 0);
> console.log(evens);
> ```
>
> **Explanation:** `.filter()` returns a new array containing elements that pass predicate tests.
> 
---

### Exercise 3: Removing Nullish Values with `.filter(Boolean)`

**Problem:** Clean an array `[1, null, 2, undefined, 3, ""]` using `.filter(Boolean)`.

**Expected output:**
> [!check]- Answer
> ```text
> [ 1, 2, 3 ]
> ```
> ```javascript
> const dirty = [1, null, 2, undefined, 3, ""];
> const clean = dirty.filter(Boolean);
> console.log(clean);
> ```
>
> **Explanation:** Passing `Boolean` filters out all falsy values (`null`, `undefined`, `0`, ``).
> 
> 
---

## 7. Related Terms
- [Map](../level_08/map.md) — Used when you want to transform data, resulting in an array of the *same* length.
- [find()](find.md) — Similar to `filter`, but stops and returns only the *first* item that passes the test.
- [every()](every.md) — Related concept: every().
- [reduce()](reduce.md) — Related concept: reduce().

---

## 8. Key Takeaways
- `filter()` creates a **new array** containing only the items that passed a test.
- The new array will be smaller than or equal to the original array's length.
- The callback function MUST return a boolean (or a truthy/falsy value).
- It does **not** mutate the original array.
