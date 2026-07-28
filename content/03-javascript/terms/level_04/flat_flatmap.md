# flat / flatMap

> **Level 4 — Iteration & Array Methods**
> Flatten nested arrays / map-then-flatten.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — A high-level, list-like object.
- [`map()`](../level_04/map.md) — Iterates through an array and returns a new array with transformed elements.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When processing nested datasets (such as an array of user orders, where each order contains an array of items), developers often end up with nested arrays (e.g., `[[item1, item2], [item3]]`). Working with these nested loops is cumbersome. 

To solve this, JavaScript introduced two powerful non-mutating methods in ES2019:
- **`flat(depth)`:** Unpacks sub-arrays up to a specified nesting level (defaults to `1`) and returns a flat array.
- **`flatMap(callback)`:** Iterates through a collection, maps each element to a new value (which can be a sub-array), and then flattens the result by exactly 1 level. 

While you could theoretically replicate `.flatMap(cb)` by calling `.map(cb).flat(1)`, `.flatMap()` is much more efficient because it performs the map and flat operations in a single pass, avoiding the CPU overhead of creating a temporary intermediate array in memory.

### (2) Reality Metaphor
- **`flat`** is like unpacking nested shipping crates. If you have boxes inside a larger box, flattening depth 1 is like opening the outer box and dumping the smaller boxes onto the floor. If you specify `Infinity` depth, you open every single inner box until all individual items are lying flat on the floor.
- **`flatMap`** is like opening packages of cookies. You open each package (map), inspect or decorate the cookies (transform), and dump all the cookies into a single flat serving tray (flat) instead of keeping them in separate boxes.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const nested = [1, [2, [3]]];

console.log(nested.flat());    // [1, 2, [3]] (flattens 1 level by default)
console.log(nested.flat(2));   // [1, 2, 3] (flattens 2 levels deep)
console.log(nested.flat(Infinity)); // [1, 2, 3] (flattens all levels)
```

#### Fuller Example
```javascript
// Processing blog posts and extracting a flat list of tags
const posts = [
  { id: 1, title: "JS Tips", tags: ["javascript", "coding"] },
  { id: 2, title: "HTML Basics", tags: ["html"] },
  { id: 3, title: "Styling", tags: ["css", "web"] }
];

// Goal: Get a single flat array of all tags across all posts

// Using standard map: returns a nested array of arrays
const nestedTags = posts.map(post => post.tags);
console.log("Nested tags:", nestedTags);
// [ [ 'javascript', 'coding' ], [ 'html' ], [ 'css', 'web' ] ]

// Using flatMap: transforms and flattens in a single step
const flatTags = posts.flatMap(post => post.tags);
console.log("Flat tags:", flatTags);
// [ 'javascript', 'coding', 'html', 'css', 'web' ]

// Another example: splitting sentences into a flat list of words
const sentences = ["Hello world", "Learning JavaScript is fun"];
const words = sentences.flatMap(sentence => sentence.split(" "));
console.log("Words list:", words);
// [ 'Hello', 'world', 'Learning', 'JavaScript', 'is', 'fun' ]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting `flat()` to flatten nested arrays completely by default

**The mistake:** Calling `array.flat()` on a 3-layer deep nested array expecting a 1D flat array.

**Why it's wrong:** By default, `.flat()` only flattens one level deep (equivalent to depth = `1`). To flatten completely, you must specify the exact nesting depth or pass `Infinity`.

*Incorrect:*
```javascript
const deeplyNested = [1, [2, [3, [4]]]];
const result = deeplyNested.flat();

console.log(result); // [1, 2, [3, [4]]] (still has nested arrays!)
```

*Fix:*
```javascript
const deeplyNested = [1, [2, [3, [4]]]];
const result = deeplyNested.flat(Infinity); // Flatten all levels

console.log(result); // [1, 2, 3, 4]
```

### Mistake 2: Losing Context Binding (`this`) in Flat Flatmap Callbacks

**The mistake:** Passing methods from Flat Flatmap instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "flat_flatmap",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "flat_flatmap",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Flat Flatmap Operations

**The mistake:** Executing asynchronous operations within Flat Flatmap without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/flat_flatmap"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/flat_flatmap");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in flat_flatmap: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Parse and Clean Comments

**Problem:** Complete the code to extract a flat array of username strings from the nested `threads` structure using `flatMap`.

```javascript
const threads = [
  {
    topic: "JS",
    comments: [{ user: "Alice" }, { user: "Bob" }]
  },
  {
    topic: "CSS",
    comments: [{ user: "Charlie" }]
  }
];

const usernames = // Write flatMap code here

console.log(usernames);
```

**Expected output:**
> [!check]- Answer
> ```text
> [ 'Alice', 'Bob', 'Charlie' ]
> ```
> - Map each thread to its comments array, extracting the user string.
> - Within `flatMap`, you can chain `.map(c => c.user)` on the `comments` array.
> - e.g., `threads.flatMap(thread => thread.comments.map(c => c.user))`

---

### Exercise 2: Deep Flattening with `flat(Infinity)`

**Problem:** Flatten a deeply nested array `[1, [2, [3, [4]]]]` using `.flat(Infinity)`.

**Expected output:**
> [!check]- Answer
> ```text
> [ 1, 2, 3, 4 ]
> ```
> ```javascript
> const nested = [1, [2, [3, [4]]]];
> console.log(nested.flat(Infinity));
> ```
>
> **Explanation:** `flat(Infinity)` recurses through all nested array levels to produce a 1D array.

---

### Exercise 3: Mapping and Flattening with `flatMap`

**Problem:** Use `.flatMap(x => [x, x * 2])` on `[1, 2]`.

**Expected output:**
> [!check]- Answer
> ```text
> [ 1, 2, 2, 4 ]
> ```
> ```javascript
> const nums = [1, 2];
> console.log(nums.flatMap(x => [x, x * 2]));
> ```
>
> **Explanation:** `flatMap` combines `.map()` and `.flat(1)` in a single efficient pass.

---

## 7. Related Terms
- [`map()`](../level_04/map.md) — The transformation iteration helper.
- [`reduce()`](../level_04/reduce.md) — General purpose accumulator method which can also be used to flatten lists.

---

## 8. Key Takeaways
- `flat(depth)` merges nested sub-arrays into a new flat array down to the specified depth (default is `1`).
- `flatMap(callback)` maps each element and flattens the resulting array by exactly one level.
- `flatMap` is more performant than `.map().flat(1)` because it does not allocate a temporary intermediate array in memory.
- `flatMap` only flattens 1 level; if your mapping function returns deeply nested arrays, use `.map()` combined with `.flat(depth)`.
