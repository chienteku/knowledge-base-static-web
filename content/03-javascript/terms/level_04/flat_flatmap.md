# flat / flatMap

> **Level 4 — Iteration & Array Methods**
> Flatten nested arrays / map-then-flatten.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — A high-level, list-like object.
- [Map](../level_08/map.md) — Iterates through an array and returns a new array with transformed elements.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: flat / flatMap is a fundamental concept in this technology stack. **Level 4 — Iteration & Array Methods**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Multi-Level Category Hierarchy Flattening

**Scenario:** An e-commerce menu builder flattens deeply nested category arrays using flat(depth).

**Requirements:**
1. Write flattenCategories(nestedCategories, depth).
2. Use nestedCategories.flat(depth).
3. Return flattened categories array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function flattenCategories(nestedCategories, depth = 1) {
>   if (!Array.isArray(nestedCategories)) return [];
>   return nestedCategories.flat(depth);
> }
>
> // Verification tests
> const nested = ["Tech", ["Laptops", ["MacBook", "ThinkPad"]]];
> const flat1 = flattenCategories(nested, 1);
> console.assert(flat1.length === 3 && Array.isArray(flat1[1]) === false, "Test 1 Failed");
>
> const flatInfinity = flattenCategories(nested, Infinity);
> console.assert(flatInfinity.length === 4 && flatInfinity[3] === "ThinkPad", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **flat() Depth Parameter**: Array.prototype.flat(depth) recursively flattens sub-array elements up to specified depth (default 1).
> 2. **Infinity Depth**: Passing Infinity flattens all nested sub-arrays regardless of depth.
> 3. **Sparse Slot Removal**: flat() automatically removes empty sparse slots from arrays.
> 
---

### Exercise 2: Tokenization & Keyword Extraction via flatMap()

**Scenario:** A search indexer splits text sentence strings into keywords and flattens results in a single step using flatMap().

**Requirements:**
1. Write extractKeywords(sentences).
2. Use sentences.flatMap(s => s.toLowerCase().split(" ")).
3. Return flattened tokens array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function extractKeywords(sentences) {
>   if (!Array.isArray(sentences)) return [];
>   return sentences.flatMap(s => s.toLowerCase().split(" "));
> }
>
> // Verification tests
> const text = ["Hello World", "JavaScript Engines"];
> const words = extractKeywords(text);
> console.assert(words.join(",") === "hello,world,javascript,engines", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **flatMap() Dual Operation**: Array.prototype.flatMap(fn) maps each element using a transformation function and flattens result by depth 1.
> 2. **Performance Advantage**: Slightly more efficient than calling .map().flat() separately.
> 3. **Item Filtering / Expansion**: Returning an empty array [] in flatMap() filters out elements; returning multi-item arrays expands elements.
---

## 6. Related Terms
- [Map](../level_08/map.md) — The transformation iteration helper.
- [reduce()](reduce.md) — General purpose accumulator method which can also be used to flatten lists.

---

## 7. Key Takeaways
- `flat(depth)` merges nested sub-arrays into a new flat array down to the specified depth (default is `1`).
- `flatMap(callback)` maps each element and flattens the resulting array by exactly one level.
- `flatMap` is more performant than `.map().flat(1)` because it does not allocate a temporary intermediate array in memory.
- `flatMap` only flattens 1 level; if your mapping function returns deeply nested arrays, use `.map()` combined with `.flat(depth)`.
