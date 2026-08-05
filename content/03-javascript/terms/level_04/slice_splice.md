# slice / splice

> **Level 4 — Iteration & Array Methods**
> Copy a sub-array (pure) vs insert/remove in place (mutating).

---

## 1. Prerequisites
- [Array](../level_02/array.md) — A high-level, list-like object.
- [Array Index & .length](../level_02/array_index_length.md) — Zero-based positional access.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While basic stack/queue methods (like `push` and `pop`) operate on array boundaries, developers need ways to manipulate elements inside the middle of an array. To solve this, JavaScript provides two similarly named but fundamentally different methods: `slice` and `splice`.

- **`slice(start, end)`** was designed to **extract** a portion of an array without modifying the original data. It is a **non-mutating (pure)** method that copies the target segment into a brand-new array.
- **`splice(start, deleteCount, item1, item2, ...)`** was designed to **modify** arrays in-place by removing, replacing, or inserting elements at any index. It is a **mutating** method that directly alters the original array and returns an array of any deleted items.

Understanding the difference is critical to preventing accidental data corruption when copying or editing lists.

### (2) Reality Metaphor
- **`slice`** is like taking a photocopy of a page from a book, and then using scissors to cut out a single paragraph. The original book page remains completely whole and unaltered.
- **`splice`** is like physical film editing (or splicing tape). You physically cut a section out of the original tape roll (deleting it) and glue a new strip of tape in its place. The original tape roll is permanently modified.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const numbers = [10, 20, 30, 40, 50];

// slice(start, end) -> extracts indices 1 and 2 (up to, but not including, index 3)
const subArray = numbers.slice(1, 3); 
console.log(subArray); // [20, 30]
console.log(numbers);  // [10, 20, 30, 40, 50] (Original unchanged!)

// splice(start, deleteCount, insertItem) -> removes 1 item at index 2, inserts 99
const deleted = numbers.splice(2, 1, 99); 
console.log(deleted); // [30] (returned deleted element)
console.log(numbers); // [10, 20, 99, 40, 50] (Original mutated!)
```

#### Fuller Example
```javascript
// A student grade book management system demonstrating list adjustments
const gradeBook = ["A", "B", "A", "C", "F"];

// 1. Get the honor roll grades (first 3 grades) using non-mutating slice
const honorRoll = gradeBook.slice(0, 3);
console.log("Honor Roll:", honorRoll); // [ 'A', 'B', 'A' ]
console.log("Original Grade Book:", gradeBook); // [ 'A', 'B', 'A', 'C', 'F' ] (safe!)

// 2. Remove the failing grade 'F' (index 4) using splice
gradeBook.splice(4, 1); // remove 1 item starting at index 4
console.log("Failing grade removed:", gradeBook); // [ 'A', 'B', 'A', 'C' ]

// 3. Replace the 'C' grade (index 3) with a 'B' using splice
gradeBook.splice(3, 1, "B"); // delete 1 item at index 3, insert "B"
console.log("Grade corrected:", gradeBook); // [ 'A', 'B', 'A', 'B' ]

// 4. Insert 'A+' at index 1 without deleting anything
gradeBook.splice(1, 0, "A+"); // deleteCount is 0
console.log("Bonus added:", gradeBook); // [ 'A', 'A+', 'B', 'A', 'B' ]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing `slice` and `splice` spelling and behavior

**The mistake:** Calling `splice()` expecting the original array to remain unchanged.

**Why it's wrong:** Because their names differ by only one letter (`p`), developers frequently swap them. Calling `splice` modifies the target array in-place, which can destroy data references.

*Incorrect:*
```javascript
const inventory = ["Hat", "Shirt", "Shoes"];

// Intent: get just the first item, keeping inventory intact
const firstItem = inventory.splice(0, 1); // Mutates inventory!

console.log(inventory); // ["Shirt", "Shoes"] (Original was modified!)
```

*Fix:*
```javascript
const inventory = ["Hat", "Shirt", "Shoes"];

// Use slice to make a copy
const firstItem = inventory.slice(0, 1);

console.log(inventory); // ["Hat", "Shirt", "Shoes"] (Original preserved)
console.log(firstItem); // ["Hat"]
```

### Mistake 2: Losing Context Binding (`this`) in Slice Splice Callbacks

**The mistake:** Passing methods from Slice Splice instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "slice_splice",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "slice_splice",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Slice Splice Operations

**The mistake:** Executing asynchronous operations within Slice Splice without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/slice_splice"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/slice_splice");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in slice_splice: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Replace Elements

**Problem:** Complete the code to replace the element `"Iron"` with `"Copper"` inside the `metals` array in-place using `splice`.

```javascript
const metals = ["Gold", "Silver", "Iron", "Bronze"];

// Replace Iron (index 2) with Copper
// Write splice here

console.log(metals);
```

**Expected output:**
> [!check]- Answer
> ```text
> [ 'Gold', 'Silver', 'Copper', 'Bronze' ]
> ```
> - The start index is `2`.
> - The delete count is `1`.
> - The replacement item is `"Copper"`.

---

### Exercise 2: Removing Array Items with `splice`

**Problem:** Remove 2 items starting at index `1` from `[10, 20, 30, 40]` using `.splice(1, 2)`.

**Expected output:**
> [!check]- Answer
> ```text
> Removed: [ 20, 30 ], Remaining: [ 10, 40 ]
> ```
> ```javascript
> const arr = [10, 20, 30, 40];
> const removed = arr.splice(1, 2);
> console.log(`Removed: [ ${removed} ], Remaining: [ ${arr} ]`);
> ```
>
> **Explanation:** `splice(start, deleteCount)` mutates original array in-place and returns removed items.

---

### Exercise 3: Shallow Copying Arrays with `slice()`

**Problem:** Make a shallow copy of `[1, 2, 3]` using `.slice()`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> ```
> ```javascript
> const orig = [1, 2, 3];
> const copy = orig.slice();
> console.log(orig !== copy && orig.length === copy.length);
> ```
>
> **Explanation:** `slice()` called without arguments returns a shallow copy of the source array.

---

## 7. Related Terms
- [push / pop / shift / unshift](push_pop_shift_unshift.md) — Adding/removing elements at boundaries.
- [Spread Syntax (...)](../level_08/spread_syntax.md) — Alternative syntax to copy sections of arrays.

---

## 8. Key Takeaways
- `slice(start, end)` is non-mutating: it extracts a sub-section of an array and returns it in a new array, leaving the original unchanged.
- `splice(start, deleteCount, items...)` is mutating: it modifies the original array in-place by deleting, replacing, or inserting items.
- `slice` takes a range of indices up to, but not including, the `end` index; `splice` takes a starting index and a count of elements to delete.
- `splice` returns an array containing the elements that were deleted during the operation.
