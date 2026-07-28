# Map

> **Level 8 — Modern JavaScript (ES6+)**
> A collection of keyed data items that allows keys of any type (unlike plain Objects).

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The traditional key-value structure `Map` improves upon.
- [Array](../level_02/array.md) — Maps are Iterable, just like Arrays.

---

## 2. Term Category
- **Data Structure** *(Introduced in ES6)*

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
For 20 years, JavaScript developers used plain Objects (`{}`) to store key-value data (like a dictionary). However, Objects have severe limitations:
1. Object keys can **only be Strings or Symbols**. If you try to use a Number or another Object as a key, JS secretly converts it to the string `"[object Object]"`.
2. Objects don't know how big they are (you have to use `Object.keys(obj).length`).
3. Objects are not easily iterable.

ES6 introduced the **Map** data structure to be the ultimate, professional-grade dictionary. A Map allows *anything* to be a key (even another object or a function!). It remembers the exact order you inserted items, it has a built-in `.size` property, and it is perfectly designed to be used with `for...of` loops.

### (2) Reality Metaphor
A standard Object is like a cheap filing cabinet. You can only put sticky notes (Strings) on the folders to identify them. If you try to tape a coffee mug to the folder as a label, it falls off.
A Map is a high-tech locker system. It allows you to use *anything* as the key to open the locker. You can use a password (String), a fingerprint (Object), or a physical keycard (Function). It is perfectly secure and keeps an exact count of how many lockers are full.

### (3) JavaScript Code Examples

#### Short Snippet: Basic Map Usage
```javascript
// We must use 'new' to create a Map
const userRoles = new Map();

// We use .set(key, value) to add data
userRoles.set("Alice", "Admin");
userRoles.set("Bob", "Guest");

// We use .get(key) to retrieve data
console.log(userRoles.get("Alice")); // "Admin"

// We use .has(key) to check if a key exists
console.log(userRoles.has("Charlie")); // false

// Built-in size property!
console.log(userRoles.size); // 2
```

#### Fuller Example: Objects as Keys!
```javascript
// Imagine we fetch User objects from a database
const user1 = { id: 101, name: "Alice" };
const user2 = { id: 102, name: "Bob" };

// We want to attach "login timestamps" to these users, 
// but we don't want to modify the actual user objects!

const loginTracker = new Map();

// We use the ACTUAL OBJECT as the key!
loginTracker.set(user1, "Tuesday, 8:00 AM");
loginTracker.set(user2, "Tuesday, 9:15 AM");

// We can retrieve the timestamp by passing the exact object back!
console.log(loginTracker.get(user1)); // "Tuesday, 8:00 AM"

// Maps are fully iterable!
for (const [userObj, time] of loginTracker) {
  console.log(`${userObj.name} logged in at ${time}`);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Map Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Map blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "map";
```

*Fix:*
```javascript
let value = "map";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Map Callbacks

**The mistake:** Passing methods from Map instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "map",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "map",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Map Operations

**The mistake:** Executing asynchronous operations within Map without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/map"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/map");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in map: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The Reference Trap

**Problem:** Look at the following code. What will `.get()` return?
```javascript
const map = new Map();
map.set([1, 2, 3], "Secret Code");

console.log(map.get([1, 2, 3]));
```

**Expected output:**
> [!check]- Answer
> ```text
> `undefined`.
> Why? Because `[1, 2, 3]` is an Array (which is an Object). When you write `[1, 2, 3]` the second time inside `.get()`, it creates a completely *new* array in a different location in memory. Maps use strict equality (`===`) to match keys. The new array does not match the old array's memory address! You must save the array to a variable first to use it as a key.
> ```
> - Remember how Objects are compared by reference, not by value!

---

### Exercise 2: Map Key-Value Store Operations

**Problem:** Store `map.set("a", 10)`, check `map.has("a")`, read `map.get("a")`, and print `map.size`.

**Expected output:**
> [!check]- Answer
> ```text
> has: true, val: 10, size: 1
> ```
> ```javascript
> const map = new Map();
> map.set("a", 10);
> console.log(`has: ${map.has("a")}, val: ${map.get("a")}, size: ${map.size}`);
> ```
>
> **Explanation:** ES6 `Map` provides fast key-value storage supporting arbitrary key types.

---

### Exercise 3: Iterating Maps with `for...of`

**Problem:** Iterate `new Map([["x", 1], ["y", 2]])` using `for (const [k, v] of map)`.

**Expected output:**
> [!check]- Answer
> ```text
> x = 1
> y = 2
> ```
> ```javascript
> const map = new Map([["x", 1], ["y", 2]]);
> for (const [k, v] of map) {
>   console.log(`${k} = ${v}`);
> }
> ```
>
> **Explanation:** `Map` objects preserve key insertion order during iteration.


---

## 7. Related Terms
- [Set](./set.md) — The sister data structure to Map (stores unique values without keys).
- [Object](../level_02/object.md) — The older structure that Maps often replace for complex dictionaries.

---

## 8. Key Takeaways
- A Map is a modern data structure for storing Key-Value pairs.
- Unlike Objects, Map keys can be of ANY data type (including Arrays, Functions, and other Objects).
- You must use `.set(key, value)`, `.get(key)`, and `.has(key)` to interact with it.
- Maps maintain their insertion order and have a convenient `.size` property.
- Maps are natively iterable with `for...of` loops.
```
