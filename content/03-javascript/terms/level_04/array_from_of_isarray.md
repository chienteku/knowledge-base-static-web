# Array.from / Array.of / Array.isArray

> **Level 4 — Iteration & Array Methods**
> Create arrays from iterables/args; type-check.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — A high-level, list-like object.
- [Iterators & Iterables (protocol)](../level_08/iterators_iterables.md) — Objects that define their iteration behavior (like strings, arrays, or Sets).

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, constructing, converting, and identifying arrays has historical quirks. The TC39 committee introduced three static utility methods on the global `Array` constructor to fix these pain points:

1. **`Array.isArray(value)`:** Since arrays are technically objects under the hood, running `typeof []` returns `"object"`. This makes it impossible to distinguish between a plain object and a list. `Array.isArray()` solves this by verifying if the value is structurally a true array.
2. **`Array.from(arrayLikeOrIterable, mapFn)`:** Frequently, web APIs return "array-like" objects (such as a DOM `NodeList` from `document.querySelectorAll()`, or the `arguments` object inside functions). These structures don't have access to array methods like `.map()` or `.filter()`. `Array.from()` converts these iterables or array-like objects into standard arrays.
3. **`Array.of(args...)`:** The standard constructor `new Array(N)` behaves inconsistently: writing `new Array("5")` creates `["5"]`, but writing `new Array(5)` creates an empty array containing `5` empty slots. `Array.of(5)` guarantees a consistent behavior: it always instantiates an array containing the exact arguments passed to it, yielding `[5]`.

### (2) Reality Metaphor
- **`Array.isArray`** is like a border control scanner checking an ID. Plain folders (objects) and catalog lists (arrays) look similar from the outside, but the scanner determines if it has the official "Array Passport."
- **`Array.from`** is like a plastic recycling factory. You feed in loose plastic bottles or scrap toys (array-like NodeLists or Sets), and the machine melts them down and reshapes them into a standard, clean ruler (an Array) with centimeter marks (indices).
- **`Array.of`** is like a cookie box packaging machine. No matter what ingredients or cookies you throw in (whether it's just one chocolate chip or a mix of five different items), it always wraps them in a single standard box.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Array.isArray
console.log(typeof []);             // "object" (useless for checking)
console.log(Array.isArray([]));      // true (correct check!)
console.log(Array.isArray({}));      // false

// Array.of
console.log(new Array(3));           // [empty × 3] (weird legacy behavior!)
console.log(Array.of(3));            // [3] (consistent!)

// Array.from
console.log(Array.from("JS"));       // ["J", "S"] (converts iterable string to array)
```

#### Fuller Example
```javascript
// Converting a Set collection and processing values with Array.from
const rawScoresSet = new Set([80, 90, 80, 95]); // Sets store unique values only
console.log("Unique Scores Set:", rawScoresSet); // Set(3) { 80, 90, 95 }

// 1. Set does not support array index access or map()
// Convert Set to array using Array.from with an optional mapping function
const scoresArray = Array.from(rawScoresSet, function(score) {
  return score + 5; // Add 5 bonus points during conversion!
});
console.log("Bonus Scores Array:", scoresArray); // [ 85, 95, 100 ]

// 2. Type-checking a parameter to ensure safe processing
function sumScores(input) {
  if (!Array.isArray(input)) {
    console.log("Error: Expected an array of numbers.");
    return 0;
  }
  
  // Safe to use array reduce now
  return input.reduce((sum, score) => sum + score, 0);
}

console.log("Sum:", sumScores(scoresArray)); // Sum: 280
console.log("Sum with object:", sumScores({ score1: 85 })); // Error logs, returns 0
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `typeof` to Check for Arrays

**The mistake:** Writing `if (typeof value === "array")` to validate functions inputs.

**Why it's wrong:** The string `"array"` is never returned by `typeof`. It returns `"object"` for arrays, which means your validation will completely fail.

*Incorrect:*
```javascript
const list = [1, 2, 3];

if (typeof list === "array") { // This condition is ALWAYS false!
  console.log("Processing array...");
}
```

*Fix:*
```javascript
const list = [1, 2, 3];

if (Array.isArray(list)) { // Correct
  console.log("Processing array...");
}
```

### Mistake 2: Confusing `new Array(size)` with `Array.of(value)`

**The mistake:** Attempting to create an array with a single numeric value using the `new Array` constructor.

**Why it's wrong:** Passing a single number `N` to the constructor creates a sparse array of size `N` containing empty slots, not an array containing `N`.

*Incorrect:*
```javascript
const list = new Array(3);

console.log(list); // [empty × 3]
console.log(list[0]); // undefined
```

*Fix:*
```javascript
const list = Array.of(3);

console.log(list); // [3]
console.log(list[0]); // 3
```

---

### Mistake 3: Unhandled Asynchronous Failures in Array From Of Isarray Operations

**The mistake:** Executing asynchronous operations within Array From Of Isarray without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/array_from_of_isarray"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/array_from_of_isarray");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in array_from_of_isarray: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Set Converter

**Problem:** Complete the code to convert a list of unique names (a Set) into a sorted array using `Array.from`.

```javascript
const uniqueNames = new Set(["David", "Alice", "Bob"]);

const sortedNames = // Write conversion and sort here

console.log(sortedNames);
```

**Expected output:**
> [!check]- Answer
> ```text
> [ 'Alice', 'Bob', 'David' ]
> ```
> - Pass `uniqueNames` into `Array.from()`.
> - Call `.sort()` on the resulting array to order the names alphabetically.
> 
---

### Exercise 2: Creating Number Ranges with `Array.from`

**Problem:** Create an array `[1, 2, 3, 4, 5]` using `Array.from({ length: 5 }, (_, i) => i + 1)`.

**Expected output:**
> [!check]- Answer
> ```text
> [ 1, 2, 3, 4, 5 ]
> ```
> ```javascript
> const range = Array.from({ length: 5 }, (_, i) => i + 1);
> console.log(range);
> ```
>
> **Explanation:** `Array.from` accepts length objects and mapping callbacks to generate collections dynamically.
> 
---

### Exercise 3: Converting NodeList to Array

**Problem:** Use `Array.from()` to convert an array-like object `{ 0: 'a', 1: 'b', length: 2 }` into a real array.

**Expected output:**
> [!check]- Answer
> ```text
> [ "a", "b" ]
> ```
> ```javascript
> const arrayLike = { 0: "a", 1: "b", length: 2 };
> const arr = Array.from(arrayLike);
> console.log(JSON.stringify(arr));
> ```
>
> **Explanation:** `Array.from` converts any array-like or iterable object into a true `Array` instance.
> 
---

## 7. Related Terms
- [Spread Syntax (...)](../level_08/spread_syntax.md) — Shorthand to convert certain iterables: `[...mySet]`.
- [Set](../level_08/set.md) — Unique value collection structure.

---

## 8. Key Takeaways
- Use `Array.isArray(value)` to check if a value is an array (avoid `typeof` which returns `"object"`).
- `Array.from(iterable)` converts array-like objects or iterables (like Strings, Sets, or NodeLists) into standard arrays.
- `Array.from(iterable, mapFn)` accepts an optional map function to transform values during conversion.
- `Array.of(items...)` creates a new array containing all elements passed as arguments, resolving legacy inconsistencies in `new Array()`.
