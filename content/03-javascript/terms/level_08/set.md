# Set

> **Level 8 — Modern JavaScript (ES6+)**
> A collection of unique values of any type, primitive or object.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — The structure `Set` is most often compared to.
- [Map](map.md) — The sister data structure to Set.

---

## 2. Term Category

**Data Structure *(Introduced in ES6)* (Universal)**: Set is a fundamental concept in this technology stack. **Level 8 — Modern JavaScript (ES6+)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Arrays are fantastic for keeping lists of items, but Arrays allow duplicates. If you wanted to ensure an Array only contained *unique* items, you had to manually write `if (!array.includes(item)) { array.push(item) }` every single time you added data. This was tedious and slow.

ES6 introduced the **Set** data structure. A Set is simply a collection of values where **duplicates are strictly forbidden**. If you try to add a value that already exists in the Set, the Set just silently ignores it. Sets are incredibly fast at checking if an item exists (`.has()`) compared to Arrays, making them perfect for managing tags, active user IDs, or filtering out duplicate data.

### (2) Reality Metaphor
An Array is like a guestbook at a wedding. If Uncle Bob signs the book 5 times, his name appears 5 times.
A Set is like a VIP Bouncer's clipboard. The bouncer only cares *if* you are on the list. If Uncle Bob walks up to the bouncer and says "Add me to the list," the bouncer writes it down. If Uncle Bob walks up 5 minutes later and says "Add me to the list," the bouncer says, "You're already on it," and ignores him.

### (3) JavaScript Code Examples

#### Short Snippet: Basic Set Usage
```javascript
const colors = new Set();

// Adding data
colors.add("Red");
colors.add("Blue");
colors.add("Red"); // Duplicate! Silently ignored.

console.log(colors.size); // 2

// Checking for existence (Extremely fast!)
console.log(colors.has("Blue")); // true
console.log(colors.has("Green")); // false

// Removing data
colors.delete("Red");
```

#### Fuller Example: The Array Duplicate Remover
```javascript
// Sets are most famous for being the easiest way to remove duplicates from an Array!

const messyArray = [1, 2, 2, 3, 4, 4, 4, 5];

// 1. Pass the Array into a new Set. The Set instantly destroys the duplicates.
const cleanSet = new Set(messyArray);

// 2. Use the Spread Syntax to dump the clean Set back into a new Array!
const cleanArray = [...cleanSet];

console.log(cleanArray); // [1, 2, 3, 4, 5]

// Professional 1-liner:
const uniqueNames = [...new Set(["Alice", "Bob", "Alice"])]; // ["Alice", "Bob"]
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Set Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Set blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "set";
```

*Fix:*
```javascript
let value = "set";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Set Callbacks

**The mistake:** Passing methods from Set instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "set",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "set",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Set Operations

**The mistake:** Executing asynchronous operations within Set without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/set"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/set");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in set: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Unique Value Collection & Set Operations

**Scenario:** An e-commerce analytics tool removes duplicate customer tags using a Set and performs mathematical set intersection.

**Requirements:**
1. Write getUniqueTags(tagList).
2. Write getIntersectingTags(setA, setB).
3. Use Set methods .add(), .has().
4. Return array of unique/intersected items.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function getUniqueTags(tagList) {
>   if (!Array.isArray(tagList)) return [];
>   const tagSet = new Set(tagList);
>   return Array.from(tagSet);
> }
>
> function getIntersectingTags(arrayA, arrayB) {
>   const setB = new Set(arrayB);
>   return arrayA.filter(item => setB.has(item));
> }
>
> // Verification tests
> const tags = ["tech", "sale", "tech", "new"];
> const unique = getUniqueTags(tags);
> console.assert(unique.length === 3 && !unique.includes("tech", 1), "Test 1 Failed");
>
> const common = getIntersectingTags(["a", "b", "c"], ["b", "c", "d"]);
> console.assert(common.join(",") === "b,c", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Set Object Purpose**: Set objects store collections of unique values of any type, filtering out duplicates automatically.
> 2. **Fast Membership Testing**: Set.prototype.has(val) performs fast O(1) membership checks compared to Array.prototype.includes() O(n).
> 3. **Array Conversion**: Array.from(set) or [...set] converts Set instances back to standard arrays.
> 
---

### Exercise 2: Set Advanced Context Handler

**Scenario:** A web application component processes set data operations within enterprise workflows.

**Requirements:**
1. Write handleSetSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleSetSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleSetSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Set Architecture**: Applying set patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Set Performance Optimization

**Scenario:** An application utility optimizes set execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeSetTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeSetTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeSetTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Set Optimization**: Optimizing set improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Map](map.md) — Uses the exact same strict equality rules, but stores key-value pairs.
- [Array](../level_02/array.md) — The structure often converted to and from a Set.
- [Array.from / Array.of / Array.isArray](../level_04/array_from_of_isarray.md) — Related concept: Array.from / Array.of / Array.isArray.

---

## 7. Key Takeaways
- A Set is a collection of strictly unique values. It automatically ignores duplicates.
- It is the fastest and cleanest way to remove duplicate values from an Array.
- Use `.add(value)`, `.has(value)`, and `.delete(value)` to interact with it.
- Sets do NOT have indexes (you cannot do `set[0]`).
- You can easily convert a Set back into an Array using `[...mySet]`.
```
