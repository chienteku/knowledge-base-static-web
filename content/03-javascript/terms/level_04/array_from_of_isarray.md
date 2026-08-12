# Array.from / Array.of / Array.isArray

> **Level 4 — Iteration & Array Methods**
> Create arrays from iterables/args; type-check.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — A high-level, list-like object.
- [Iterators & Iterables (protocol)](../level_08/iterators_iterables.md) — Objects that define their iteration behavior (like strings, arrays, or Sets).

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Array.from / Array.of / Array.isArray is a fundamental concept in this technology stack. **Level 4 — Iteration & Array Methods**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Array-Like NodeList / Arguments Conversion & Mapping

**Scenario:** A frontend UI library receives array-like collections (such as DOM NodeLists or function arguments) and converts them into true Array instances using Array.from() with a mapping function.

**Requirements:**
1. Write normalizeArrayLike(arrayLike, mapFn).
2. Use Array.from(arrayLike, mapFn) to convert and transform.
3. Return true Array instance.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function normalizeArrayLike(arrayLike, mapFn) {
>   if (!arrayLike || typeof arrayLike.length !== "number") {
>     return [];
>   }
>   const result = Array.from(arrayLike, mapFn || (x => x));
>   return result;
> }
>
> // Verification tests
> const arrayLikeObj = { 0: "10", 1: "20", length: 2 };
> const nums = normalizeArrayLike(arrayLikeObj, val => Number(val) * 2);
> console.assert(Array.isArray(nums) === true, "Test 1 Failed: Must return true Array");
> console.assert(nums.join(",") === "20,40", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Array.from() Mechanism**: Array.from(arrayLike, mapFn) converts array-like or iterable objects into true Array instances while applying a mapping function.
> 2. **Map Function Parameter**: The second parameter of Array.from() acts as a built-in map transformation step without allocating intermediate arrays.
> 3. **Array-Like Objects**: Array-like objects possess an integer .length property and indexed keys (0, 1, 2...).
> 
---

### Exercise 2: API Gateway Payload Array Type Guard

**Scenario:** An API payload parser inspects incoming JSON structures, using Array.isArray() to distinguish true arrays from plain objects, numbers, or null values.

**Requirements:**
1. Write parseArrayPayload(payload).
2. Check if payload is a true array using Array.isArray().
3. If true, return payload items count; else return 0.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseArrayPayload(payload) {
>   if (!Array.isArray(payload)) {
>     return 0;
>   }
>   return payload.length;
> }
>
> // Verification tests
> console.assert(parseArrayPayload([1, 2, 3]) === 3, "Test 1 Failed");
> console.assert(parseArrayPayload({ 0: "a", length: 1 }) === 0, "Test 2 Failed: Array-like object must fail Array.isArray()");
> console.assert(parseArrayPayload(null) === 0, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Array.isArray() Guard**: Array.isArray(val) is the standard method for accurately identifying true Array instances across iframe/window contexts.
> 2. **typeof Anomaly Prevention**: Because typeof [] evaluates to "object", typeof alone cannot differentiate arrays from objects or null.
> 3. **Cross-Realm Reliability**: Array.isArray() works reliably across different window/realm iframe execution contexts.
> 
---

### Exercise 3: Single-Element Array Construction with Array.of()

**Scenario:** A factory component constructs array instances from variable arguments, using Array.of() to avoid the single-integer constructor trap of new Array(5).

**Requirements:**
1. Write createNumericList(...elements).
2. Construct array using Array.of(...elements).
3. Verify single numeric argument creates element, not sparse array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createNumericList(...elements) {
>   const result = Array.of(...elements);
>   return result;
> }
>
> // Verification tests
> const singleVal = createNumericList(5);
> console.assert(singleVal.length === 1 && singleVal[0] === 5, "Test 1 Failed: Array.of(5) must create [5], not 5 sparse slots");
>
> const multiVal = createNumericList(10, 20);
> console.assert(multiVal.length === 2 && multiVal[0] === 10, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Array.of() Purpose**: Array.of(...items) creates a new Array instance with a variable number of arguments, regardless of argument count or type.
> 2. **Constructor Pitfall Avoidance**: Avoids the legacy new Array(number) pitfall where a single numeric argument creates a sparse array with empty slots.
> 3. **Consistency across Arities**: Array.of(5) produces [5], whereas Array(5) produces 5 empty array slots.
---

## 6. Related Terms
- [Spread Syntax (...)](../level_08/spread_syntax.md) — Shorthand to convert certain iterables: `[...mySet]`.
- [Set](../level_08/set.md) — Unique value collection structure.

---

## 7. Key Takeaways
- Use `Array.isArray(value)` to check if a value is an array (avoid `typeof` which returns `"object"`).
- `Array.from(iterable)` converts array-like objects or iterables (like Strings, Sets, or NodeLists) into standard arrays.
- `Array.from(iterable, mapFn)` accepts an optional map function to transform values during conversion.
- `Array.of(items...)` creates a new array containing all elements passed as arguments, resolving legacy inconsistencies in `new Array()`.
