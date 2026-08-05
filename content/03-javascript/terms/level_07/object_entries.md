# Object.entries()

> **Level 7 — Objects & Prototypes**
> Returns an array of a given object's own enumerable string-keyed property `[key, value]` pairs.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The fundamental structure.
- [Object.keys()](object_keys.md)

---

## 2. Term Category
- **Built-in Method** *(Object, Introduced in ES8 / 2017)*

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes you need the keys, and sometimes you need the values. But what if you need *both* at exactly the same time? 

If you use `Object.keys()`, you have to do the clunky `obj[key]` lookup to get the value. If you use `Object.values()`, the keys are completely destroyed and lost. To give developers the ultimate tool for iterating over objects, ES8 introduced `Object.entries()`. It converts an Object into an Array of Arrays (a 2D Array). Each inner array contains exactly two items: `[theKey, theValue]`. This perfectly bridges the gap between Objects and Arrays, allowing developers to map or loop over full objects with zero friction.

### (2) Reality Metaphor
Imagine the massive filing cabinet again.
- `Object.keys()` gives you a list of the folder labels.
- `Object.values()` gives you a stack of the actual documents.
- `Object.entries()` asks the secretary to pull out every single folder intact. They hand you a stack of folders. You can see the label on the outside *and* the document on the inside simultaneously. 

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const user = {
  name: "Alice",
  age: 28
};

// Converts the Object into a 2D Array!
const entriesArray = Object.entries(user);

console.log(entriesArray); 
/* Output:
[
  ["name", "Alice"],
  ["age", 28]
]
*/
```

#### Fuller Example: The Modern Object Loop
```javascript
const inventory = {
  apples: 12,
  bananas: 5,
  oranges: 0
};

// Object.entries is almost always paired with a 'for...of' loop 
// and Array Destructuring!

for (const [fruitName, count] of Object.entries(inventory)) {
  if (count > 0) {
    console.log(`We have ${count} ${fruitName} in stock.`);
  } else {
    console.log(`We are completely out of ${fruitName}!`);
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the 2D Array structure

**The mistake:** Trying to access `.name` or `.value` on the items returned by `Object.entries()`.

**Why it's wrong:** `Object.entries()` does *not* return an array of objects like `[{key: "name", value: "Alice"}]`. It strictly returns an array of simple arrays `[["name", "Alice"]]`. You must access them using array indexes (e.g., `item[0]` for the key, `item[1]` for the value), or better yet, use Array Destructuring `const [key, val]`.

*Incorrect:*
```javascript
const data = Object.entries({ a: 1 });
// Crash! Array elements don't have a .key property.
console.log(data[0].key); 
```

*Fix:*
```javascript
const data = Object.entries({ a: 1 });
console.log(data[0][0]); // "a" (The Key)
console.log(data[0][1]); // 1 (The Value)
```

---

### Mistake 2: Losing Context Binding (`this`) in Object Entries Callbacks

**The mistake:** Passing methods from Object Entries instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "object_entries",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "object_entries",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Object Entries Operations

**The mistake:** Executing asynchronous operations within Object Entries without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/object_entries"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/object_entries");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in object_entries: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Reversing the process

**Problem:** `Object.entries()` converts an Object into a 2D Array. Is there a built-in method that does the exact reverse (takes a 2D Array and turns it back into an Object)?

**Expected output:**
> [!check]- Answer
> ```text
> Yes! `Object.fromEntries()`.
> Example: 
> const arr = [["name", "Bob"], ["age", 30]];
> const obj = Object.fromEntries(arr); // { name: "Bob", age: 30 }
> ```
> - Introduced in ES10 (2019).

---

### Exercise 2: Converting Object Entries to Map

**Problem:** Convert `Object.entries({ a: 1, b: 2 })` into a `Map` instance.

**Expected output:**
> [!check]- Answer
> ```text
> 1
> ```
> ```javascript
> const map = new Map(Object.entries({ a: 1, b: 2 }));
> console.log(map.get("a"));
> ```
>
> **Explanation:** `Object.entries()` returns `[key, value]` arrays compatible with `Map` constructors.

---

### Exercise 3: Rebuilding Objects with `Object.fromEntries`

**Problem:** Transform entries back into an object using `Object.fromEntries([["x", 10]])`.

**Expected output:**
> [!check]- Answer
> ```text
> {"x":10}
> ```
> ```javascript
> const entries = [["x", 10]];
> console.log(JSON.stringify(Object.fromEntries(entries)));
> ```
>
> **Explanation:** `Object.fromEntries()` transforms iterable `[key, value]` pairs back into objects.


---

## 7. Related Terms
- [Object.keys()](object_keys.md) — Extracts only the first half.
- [Object.values()](object_values.md) — Extracts only the second half.

---

## 8. Key Takeaways
- `Object.entries(obj)` returns a 2D Array representing the key-value pairs of an object.
- Each inner array contains exactly two items: `[key, value]`.
- It is the most robust and modern way to iterate over an entire object using `for...of` loops.
- It can be easily reversed back into an object using `Object.fromEntries()`.
