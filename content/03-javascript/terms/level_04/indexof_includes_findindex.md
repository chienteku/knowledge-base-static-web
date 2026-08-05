# indexOf / includes / findIndex

> **Level 4 — Iteration & Array Methods**
> Search for elements/positions in an array.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — A high-level, list-like object.
- [Strict vs Loose Equality (=== vs ==)](../level_01/strict_vs_loose_equality.md) — Identity comparison without coercion.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Finding data inside lists is one of the most common programming tasks. However, depending on the scenario, developers need different search outcomes:
1. **`indexOf(element)`:** Searches the array for a primitive value and returns the **first index** where it is found, or `-1` if it isn't found. This is useful when you need to know *where* an item is so you can modify or splice it.
2. **`includes(element)`:** A modern ES6 helper that searches for a primitive and simply returns a boolean (`true`/`false`). This is much cleaner when you only need to check if an item *exists* without needing its index.
3. **`findIndex(callback)`:** A higher-order method that searches for items using a custom logic function. This is required when searching arrays containing **objects**, where standard strict equality checks fail due to reference comparisons.

### (2) Reality Metaphor
- **`indexOf`** is like asking a bookshelf manager: "In which slot number is the book named 'Dracula'?" The manager replies: "Slot 3" or "I cannot find it (-1)".
- **`includes`** is like scanning a shopping list: "Do we have milk on the list?" The answer is a simple "Yes" or "No".
- **`findIndex`** is like telling a security guard: "Tell me the position of the first car in the parking lot that has a broken headlight." The guard inspects each car one by one using your description (the callback) and returns the parking slot number.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const colors = ["Red", "Green", "Blue"];

console.log(colors.indexOf("Green")); // 1
console.log(colors.indexOf("Yellow")); // -1 (Not found)

console.log(colors.includes("Blue")); // true
console.log(colors.includes("Yellow")); // false
```

#### Fuller Example
```javascript
// A student attendance and VIP reservation check system
const guestList = ["Alice", "Bob", "Charlie"];

// 1. Using includes() to make a simple boolean check
const guestName = "Charlie";
if (guestList.includes(guestName)) {
  console.log(`${guestName} is on the guest list!`); // This runs
}

// 2. Using indexOf() to find and update a record
const nameToReplace = "Bob";
const bobIndex = guestList.indexOf(nameToReplace);

if (bobIndex !== -1) {
  // Replace Bob with Beatrice using splice
  guestList.splice(bobIndex, 1, "Beatrice");
}
console.log("Updated Guest List:", guestList); // [ 'Alice', 'Beatrice', 'Charlie' ]

// 3. Using findIndex() to search an array of objects
const library = [
  { id: 201, title: "The Hobbit", borrowed: true },
  { id: 202, title: "1984", borrowed: false },
  { id: 203, title: "Ulysses", borrowed: true }
];

// Goal: Find the index of the first book that is NOT borrowed
const availableBookIndex = library.findIndex(function(book) {
  return book.borrowed === false;
});

console.log("First available book slot:", availableBookIndex); // 1 (which represents "1984")
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `indexOf` or `includes` to Find Objects

**The mistake:** Expecting `indexOf` or `includes` to find an object matching a value search.

**Why it's wrong:** Under the hood, these methods use strict equality (`===`) comparison. Objects in JavaScript are compared by reference, not value. Two identical-looking objects `{ id: 1 }` are separate instances in memory, so they are not strictly equal.

*Incorrect:*
```javascript
const users = [{ name: "Alice" }, { name: "Bob" }];

// Attempts to search for matching object literal
const index = users.indexOf({ name: "Bob" }); 
console.log(index); // -1 (Not found!)
```

*Fix:*
```javascript
const users = [{ name: "Alice" }, { name: "Bob" }];

// Use findIndex with a callback to check property values dynamically
const index = users.findIndex(user => user.name === "Bob");
console.log(index); // 1
```

### Mistake 2: Checking `indexOf` output as a direct boolean (Truthy/Falsy)

**The mistake:** Writing `if (array.indexOf(item))` to check if an item exists.

**Why it's wrong:** If the item is the first element in the array, `indexOf` returns `0`. In JavaScript, `0` is a falsy value, so the block will fail to execute!

*Incorrect:*
```javascript
const items = ["A", "B", "C"];

if (items.indexOf("A")) { // Evaluates to 0 -> falsy!
  console.log("Found A!"); // This will NOT run!
}
```

*Fix:*
```javascript
const items = ["A", "B", "C"];

// Check if result is not equal to -1, or use includes()
if (items.indexOf("A") !== -1) {
  console.log("Found A!");
}
```

---

### Mistake 3: Unhandled Asynchronous Failures in Indexof Includes Findindex Operations

**The mistake:** Executing asynchronous operations within Indexof Includes Findindex without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/indexof_includes_findindex"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/indexof_includes_findindex");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in indexof_includes_findindex: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Search and Edit

**Problem:** Complete the code to check if `"Soda"` is inside the `cart` list using `includes`. If it is, find its index using `indexOf` and replace it with `"Water"` using `splice`.

```javascript
const cart = ["Apple", "Bread", "Soda", "Cheese"];

// Check and replace
```

**Expected output:**
> [!check]- Answer
> ```text
> [ 'Apple', 'Bread', 'Water', 'Cheese' ]
> ```
> - Check existence using `cart.includes("Soda")`.
> - Find index using `const index = cart.indexOf("Soda")`.
> - Replace using `cart.splice(index, 1, "Water")`.

---

### Exercise 2: Searching Objects with `findIndex`

**Problem:** Find the index of user `{ id: 2 }` in `[{ id: 1 }, { id: 2 }]` using `findIndex`.

**Expected output:**
> [!check]- Answer
> ```text
> 1
> ```
> ```javascript
> const users = [{ id: 1 }, { id: 2 }];
> console.log(users.findIndex(u => u.id === 2));
> ```
>
> **Explanation:** `findIndex` uses predicate callbacks, enabling object property search.

---

### Exercise 3: Checking Element Inclusion with `includes`

**Problem:** Check if array `[1, 2, NaN]` contains `NaN` using `.includes(NaN)`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> ```
> ```javascript
> const arr = [1, 2, NaN];
> console.log(arr.includes(NaN));
> ```
>
> **Explanation:** `Array.prototype.includes` uses SameValueZero equality, correctly detecting `NaN`.

---

## 7. Related Terms
- [find()](find.md) — Returns the actual matched element itself (rather than its index).
- [some()](some.md) — Checks if at least one element satisfies a callback condition.

---

## 8. Key Takeaways
- `includes(element)` checks for primitive existence and returns a boolean (`true`/`false`).
- `indexOf(element)` searches for a primitive and returns its index, or `-1` if not found.
- `findIndex(callback)` is a higher-order method used to find indices in complex arrays (like arrays of objects) using logic evaluations.
- Never use `indexOf` or `includes` on objects because they compare references rather than key-value contents.
