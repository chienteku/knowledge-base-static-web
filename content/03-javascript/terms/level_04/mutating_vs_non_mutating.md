# Mutating vs Non-mutating Methods

> **Level 4 — Iteration & Array Methods**
> Which array methods change the original vs return new.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — A high-level, list-like object for storing an ordered collection.
- [Reference vs Value](../level_07/reference_vs_value.md) — Primitives copy by value; objects/arrays by reference.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, arrays are objects, meaning they are stored in memory and passed around by reference. When we perform operations on arrays, different methods behave in fundamentally different ways:
1. **Mutating Methods (In-Place):** These methods modify the original array directly in memory. Any variables referencing that same array will see the changes. Examples include `.push()`, `.pop()`, `.splice()`, and `.sort()`.
2. **Non-mutating Methods (Pure):** These methods leave the original array untouched and return a *brand-new* array in memory containing the result. Examples include `.slice()`, `.concat()`, `.map()`, and `.filter()`.

Mutating arrays is highly memory-efficient because the engine doesn't need to allocate space for copies. However, mutating shared references can lead to severe logic bugs (e.g. data changing unexpectedly in one part of your code because of an action in another). Modern paradigms, especially in libraries like React, strongly mandate using non-mutating methods.

### (2) Reality Metaphor
Imagine a shared cooking recipe card on a kitchen table.
- A **mutating method** is like grabbing a blue pen and crossing out "1 cup of milk" and writing "2 cups of milk" directly on the card. The card itself has changed, and any other chef who reads it will see the new instruction.
- A **non-mutating method** is like taking the recipe card, placing it on a photocopy machine, printing a duplicate, and writing your adjustments on the photocopy. The original shared card remains completely untouched on the kitchen counter.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Mutating: modifies original array in-place
const listA = [1, 2, 3];
listA.push(4); 
console.log(listA); // [1, 2, 3, 4] (Original modified!)

// Non-mutating: leaves original untouched, returns a new array
const listB = [1, 2, 3];
const combined = listB.concat(4);
console.log(listB);    // [1, 2, 3] (Original safe!)
console.log(combined); // [1, 2, 3, 4] (New array!)
```

#### Fuller Example
```javascript
// Managing scoreboards in a game server
const players = ["Alice", "Bob", "Charlie"];

// IMPURE/MUTATING: sorting mutates the array passed in
function rankPlayersMutating(playerList) {
  // sort() is MUTATING!
  return playerList.sort(); 
}

const ranked = rankPlayersMutating(players);
console.log("Ranked:", ranked); // [ 'Alice', 'Bob', 'Charlie' ]
console.log("Original players array:", players); // [ 'Alice', 'Bob', 'Charlie' ] (changed to alphabetical!)

// PURE/NON-MUTATING: copying array before sorting to protect original references
const playersList2 = ["Eve", "David", "Frank"];

function rankPlayersNonMutating(playerList) {
  // Use spread syntax (...) to copy the array first, then sort the copy
  return [...playerList].sort(); 
}

const ranked2 = rankPlayersNonMutating(playersList2);
console.log("Ranked 2:", ranked2); // [ 'David', 'Eve', 'Frank' ]
console.log("Original players 2 array:", playersList2); // [ 'Eve', 'David', 'Frank' ] (Preserved!)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming `.sort()` and `.reverse()` are Non-mutating

**The mistake:** Assuming sorting or reversing an array leaves the original copy intact.

**Why it's wrong:** In JavaScript, `.sort()` and `.reverse()` mutate the array in-place. If you pass an array to a function that sorts it, you will accidentally modify the array globally.

*Incorrect:*
```javascript
const highScores = [500, 1200, 800];
const sortedScores = highScores.sort(); // Mutates highScores!

console.log(highScores); // [500, 800, 1200]
```

*Fix:*
```javascript
const highScores = [500, 1200, 800];

// Copy first, then sort
const sortedScores = [...highScores].sort();

console.log(highScores);   // [500, 1200, 800] (Original safe!)
console.log(sortedScores); // [500, 800, 1200]
```

---

### Mistake 2: Losing Context Binding (`this`) in Mutating Vs Non Mutating Callbacks

**The mistake:** Passing methods from Mutating Vs Non Mutating instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "mutating_vs_non_mutating",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "mutating_vs_non_mutating",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Mutating Vs Non Mutating Operations

**The mistake:** Executing asynchronous operations within Mutating Vs Non Mutating without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/mutating_vs_non_mutating"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/mutating_vs_non_mutating");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in mutating_vs_non_mutating: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Mutating Check

**Problem:** Identify which of the following operations are mutating and which are non-mutating.

```javascript
const items = ["A", "B", "C"];

// Action 1
items.pop();

// Action 2
const subItems = items.slice(0, 1);

// Action 3
items.reverse();
```

**Expected output:**
```text
Action 1 (.pop()): Mutating (modifies size of 'items' in-place).
Action 2 (.slice()): Non-mutating (returns a new sub-array, 'items' unchanged).
Action 3 (.reverse()): Mutating (reverses order of 'items' in-place).
```

> [!check]- Answer
> - Methods that add, remove, or reorder elements of the calling array in-place are mutating.
> - Methods that extract sections or map values into new instances are non-mutating.

---

### Exercise 2: Categorizing Mutating vs Non-Mutating Methods

**Problem:** Classify `push`, `map`, `sort`, `filter`, `splice`, `slice` as Mutating or Non-Mutating.

**Expected output:**
```text
push: Mutating
map: Non-Mutating
sort: Mutating
filter: Non-Mutating
splice: Mutating
slice: Non-Mutating
```

> [!check]- Answer
> ```javascript
> console.log("push: Mutating\nmap: Non-Mutating\nsort: Mutating\nfilter: Non-Mutating\nsplice: Mutating\nslice: Non-Mutating");
> ```
>
> **Explanation:** Mutating methods alter target array memory directly; non-mutating methods return new collection references.

### Exercise 3: Non-Mutating Array Sorting with `toSorted()`

**Problem:** Sort `[3, 1, 2]` without mutating original using `.toSorted()` concept or `[...arr].sort()`.

**Expected output:**
```text
Original: [3, 1, 2], Sorted: [1, 2, 3]
```

> [!check]- Answer
> ```javascript
> const orig = [3, 1, 2];
> const sorted = [...orig].sort();
> console.log(`Original: JSON.stringify(orig), Sorted: JSON.stringify(sorted)`);
> console.log(`Original: [${orig}], Sorted: [${sorted}]`);
> ```
>
> **Explanation:** Copying arrays before sorting prevents collateral mutation side effects.

---

---

## 7. Related Terms
- [Immutability](../level_09/immutability.md) — Designing data flow that never mutates state.
- [Spread Syntax](../level_08/spread_syntax.md) — Shorthand syntax (`[...]`) used to easily clone arrays before performing mutations.

---

## 8. Key Takeaways
- Mutating methods (like `push`, `pop`, `splice`, `sort`) modify the original array directly in memory.
- Non-mutating methods (like `slice`, `concat`, `map`, `filter`) return a new array instance, preserving the original array.
- `.sort()` and `.reverse()` are mutating methods; always clone the array using spread syntax (`[...arr]`) first if you want to preserve the original order.
- Non-mutating approaches are standard practice in modern frameworks to prevent unexpected state bugs.
