# Set

> **Level 8 — Modern JavaScript (ES6+)**
> A collection of unique values of any type, primitive or object.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — The structure `Set` is most often compared to.
- [Map](map.md) — The sister data structure to Set.

---

## 2. Term Category
- **Data Structure** *(Introduced in ES6)*

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Object Reference Trap

**Problem:** Look at the following code. How many items are in the Set?
```javascript
const mySet = new Set();
mySet.add({ name: "Alice" });
mySet.add({ name: "Alice" });

console.log(mySet.size);
```

**Expected output:**
> [!check]- Answer
> ```text
> `2`.
> Just like Maps, Sets use strict equality (`===`) to check for duplicates. Because Objects are compared by memory reference, those are two completely different, unique Objects in memory, even though they look identical to a human. The Set accepts both!
> ```
> - Sets are extremely strict about what counts as a "duplicate".
> 
---

### Exercise 2: Array Deduplication with `Set` and Spread

**Problem:** Deduplicate `[1, 2, 2, 3, 3, 3]` using `[...new Set(arr)]`.

**Expected output:**
> [!check]- Answer
> ```text
> [ 1, 2, 3 ]
> ```
> ```javascript
> const dupes = [1, 2, 2, 3, 3, 3];
> const unique = [...new Set(dupes)];
> console.log(unique);
> ```
>
> **Explanation:** Passing arrays into `Set` constructors and spreading back into arrays removes duplicate items.
> 
---

### Exercise 3: Set Operations (`has`, `add`, `delete`)

**Problem:** Add elements to a `Set`, test `.has(2)`, delete `2`, and check `.size`.

**Expected output:**
> [!check]- Answer
> ```text
> has: true, size after delete: 1
> ```
> ```javascript
> const set = new Set();
> set.add(1);
> set.add(2);
> const hasTwo = set.has(2);
> set.delete(2);
> console.log(`has: ${hasTwo}, size after delete: ${set.size}`);
> ```
>
> **Explanation:** `Set` methods manage collections of unique values efficiently.
> 
> 
---

## 7. Related Terms
- [Map](map.md) — Uses the exact same strict equality rules, but stores key-value pairs.
- [Array](../level_02/array.md) — The structure often converted to and from a Set.
- [Array.from / Array.of / Array.isArray](../level_04/array_from_of_isarray.md) — Related concept: Array.from / Array.of / Array.isArray.

---

## 8. Key Takeaways
- A Set is a collection of strictly unique values. It automatically ignores duplicates.
- It is the fastest and cleanest way to remove duplicate values from an Array.
- Use `.add(value)`, `.has(value)`, and `.delete(value)` to interact with it.
- Sets do NOT have indexes (you cannot do `set[0]`).
- You can easily convert a Set back into an Array using `[...mySet]`.
```
