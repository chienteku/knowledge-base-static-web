# Object.keys()

> **Level 7 — Objects & Prototypes**
> Returns an array of a given object's own enumerable string-keyed property names.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The collection of key-value pairs.
- [Array](../level_02/array.md) — The data structure this method returns.

---

## 2. Term Category
- **Built-in Method** *(Object)*

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, Objects are fundamentally used to map "Keys" to "Values". But an Object is not an Iterable (like an Array); you cannot easily loop over it with a standard `for...of` loop. 

If a developer needed to know exactly how many properties an object had, or needed to loop through just the property names, they traditionally had to write a messy `for...in` loop and manually filter out inherited prototype properties. `Object.keys()` was introduced to solve this perfectly: it reads an object and instantly returns a clean Array containing only the *names* (the keys) of that specific object's properties. Because it returns an Array, you can immediately use powerful array methods like `.length`, `.forEach()`, or `.map()`.

### (2) Reality Metaphor
Imagine looking at a massive filing cabinet (the Object). 
`Object.keys()` is like asking the secretary to run through every single drawer and write down *only the labels* on the outside of the folders, handing you a neatly alphabetized list of those labels (an Array of strings). They do not give you the documents inside the folders (the values).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const user = {
  name: "Alice",
  age: 28,
  isAdmin: true
};

// Extracting just the keys into an Array
const keysArray = Object.keys(user);

console.log(keysArray); 
// Output: ["name", "age", "isAdmin"]
```

#### Fuller Example: Dynamic Property Checking
```javascript
const car = {
  make: "Toyota",
  model: "Corolla"
};

// 1. Checking the size of an object
// You cannot do car.length! You must use Object.keys()
console.log(`The car object has ${Object.keys(car).length} properties.`);

// 2. Iterating over the keys
Object.keys(car).forEach(key => {
  // We can dynamically access the values using bracket notation!
  const value = car[key]; 
  console.log(`Key: ${key} | Value: ${value}`);
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Object Keys Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Object Keys blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "object_keys";
```

*Fix:*
```javascript
let value = "object_keys";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Object Keys Callbacks

**The mistake:** Passing methods from Object Keys instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "object_keys",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "object_keys",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Object Keys Operations

**The mistake:** Executing asynchronous operations within Object Keys without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/object_keys"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/object_keys");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in object_keys: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The Empty Check

**Problem:** You are fetching data from an API. Sometimes it returns a valid user object, and sometimes it returns a completely empty object `{}`. Write an `if` statement using `Object.keys()` to check if the object is empty.

**Expected output:**
```javascript
if (Object.keys(apiData).length === 0) {
  console.log("The object is empty!");
}
```

> [!check]- Answer
> - Since `apiData.length` doesn't exist on Objects, you must turn it into an array first.

---

### Exercise 2: Counting Own Properties

**Problem:** Count own properties of `{ a: 1, b: 2 }` using `Object.keys(obj).length`.

**Expected output:**
```text
2
```

> [!check]- Answer
> ```javascript
> const obj = { a: 1, b: 2 };
> console.log(Object.keys(obj).length);
> ```
>
> **Explanation:** `Object.keys()` returns an array of own enumerable string property keys.

### Exercise 3: Filtering Keys by Value Criteria

**Problem:** Filter keys of `{ a: 10, b: 5, c: 20 }` for values > 8.

**Expected output:**
```text
["a","c"]
```

> [!check]- Answer
> ```javascript
> const data = { a: 10, b: 5, c: 20 };
> const keys = Object.keys(data).filter(k => data[k] > 8);
> console.log(JSON.stringify(keys));
> ```
>
> **Explanation:** Combining `Object.keys()` with `filter` extracts property names satisfying value predicates.

---

---

## 7. Related Terms
- [`Object.values()`](./object_values.md) — Returns the values instead of the keys.
- [`Object.entries()`](./object_entries.md) — Returns both!

---

## 8. Key Takeaways
- `Object.keys(obj)` returns an Array of strings representing the object's property names.
- It only returns the object's *own* properties, completely ignoring the Prototype chain.
- It is the standard way to find the "length" (number of properties) of an object.
- Because it returns an Array, it is often chained directly with `.forEach()` or `.map()`.
