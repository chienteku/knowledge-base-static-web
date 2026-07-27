# for...of

> **Level 4 — Iteration & Array Methods**
> Iterates over the values of iterable objects like Arrays, Strings, Maps, and Sets.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — An ordered list of values.
- [`for` Loop](../level_02/for_loop.md) — The traditional counting loop.

---

## 2. Term Category
- **Language Core** *(Introduced in ES6)*

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While the traditional `for` loop (`for (let i = 0; i < arr.length; i++)`) is powerful, it is verbose and prone to "off-by-one" errors. Array methods like `.forEach()` solved this, but they have a massive limitation: you cannot use `break` to stop the loop early, or `continue` to skip an iteration. 

In ES6, JavaScript introduced the `for...of` loop. It provides the clean, declarative syntax of `.forEach()` (no index management), but it is a real loop, meaning you can still use `break` and `continue`. Furthermore, it was designed to iterate over *any* "Iterable" data structure, not just Arrays—meaning you can easily loop through the individual characters of a String!

### (2) Reality Metaphor
Imagine a Pez dispenser filled with candy. A traditional loop requires you to count the candies, track which number you are on, and manually pull each one out. `for...of` is like just pressing the dispenser's head: it hands you the next piece of candy (the value) automatically until the dispenser is completely empty.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const colors = ["red", "blue", "green"];

// Reads as: "For every color OF colors..."
for (const color of colors) {
  console.log(color);
}
// Outputs: "red", "blue", "green"
```

#### Fuller Example
```javascript
const word = "HELLO";

// You can iterate over Strings!
for (const char of word) {
  if (char === "L") {
    continue; // Skip the 'L's
  }
  console.log(char);
}
// Outputs: "H", "E", "O"

const numbers = [10, 20, 30, 40, 50];

for (const num of numbers) {
  if (num === 30) {
    console.log("Found 30! Stopping early.");
    break; // You can't do this in a .forEach()!
  }
  console.log(`Checking ${num}...`);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use `for...of` on standard Objects

**The mistake:** Attempting to loop through the key-value pairs of a plain JavaScript Object `{ name: "Alice", age: 28 }` using `for...of`.

**Why it's wrong:** Plain Objects are *not* "Iterable" in JavaScript by default. They don't have a guaranteed order like Arrays do. If you try to use `for...of` on an object, the program will crash. (To loop over objects, use `for...in` or `Object.keys()`).

*Incorrect:*
```javascript
const user = { name: "Alice", age: 28 };

// TypeError: user is not iterable
for (const item of user) {
  console.log(item); 
}
```

*Fix:*
```javascript
const user = { name: "Alice", age: 28 };

// Get an array of the keys first!
for (const key of Object.keys(user)) {
  console.log(`${key}: ${user[key]}`); 
}
```

---

### Mistake 2: Losing Context Binding (`this`) in For Of Callbacks

**The mistake:** Passing methods from For Of instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "for_of",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "for_of",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in For Of Operations

**The mistake:** Executing asynchronous operations within For Of without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/for_of"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/for_of");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in for_of: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Finding the sum

**Problem:** You have an array: `[5, 10, 15]`. Create a variable `let sum = 0;`. Use a `for...of` loop to add each number to the `sum`.

**Expected output:**
```text
30
```

> [!check]- Answer
> - `for (const num of array) { sum += num; }`

---

### Exercise 2: Iterating Strings with `for...of`

**Problem:** Iterate over string `"JS"` using `for...of` and print characters.

**Expected output:**
```text
J
S
```

> [!check]- Answer
> ```javascript
> for (const char of "JS") {
>   console.log(char);
> }
> ```
>
> **Explanation:** Strings implement `Symbol.iterator`, enabling `for...of` grapheme character iteration.

### Exercise 3: Iterating Object Entries with Destructuring

**Problem:** Iterate `Object.entries({ a: 10, b: 20 })` with `for...of` destructuring `for (const [key, val] of ...)`.

**Expected output:**
```text
a = 10
b = 20
```

> [!check]- Answer
> ```javascript
> const data = { a: 10, b: 20 };
> for (const [key, val] of Object.entries(data)) {
>   console.log(`${key} = ${val}`);
> }
> ```
>
> **Explanation:** `Object.entries()` produces `[key, value]` entry arrays compatible with `for...of` destructuring.

---

---

## 7. Related Terms
- [`for...in`](../level_04/for_in.md) — Used for iterating over the *keys* of an Object.
- [`forEach()`](../level_04/for_each.md) — An array method that cannot be stopped with `break`.

---

## 8. Key Takeaways
- `for...of` iterates over the **Values** of an iterable data structure.
- It works beautifully on Arrays and Strings.
- It does **not** work on plain Objects.
- Unlike `.forEach()`, you can use `break` and `continue` inside a `for...of` loop.
- It is generally the preferred, modern way to write a standard loop.
