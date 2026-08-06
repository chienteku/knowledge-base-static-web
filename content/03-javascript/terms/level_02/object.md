# Object

> **Level 2 — Control Flow & Data Structures**
> A collection of key-value pairs representing properties and methods.

---

## 1. Prerequisites
- [Variable](../level_01/variable.md) — A named container for storing data values.
- [Primitive Types](../level_01/primitive_types.md) — Basic immutable data types.

---

## 2. Term Category
- **Data Structure**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While Primitives (like Strings and Numbers) are great for storing single values, real-world entities are complex. A "User" isn't just a string; a User has a name, an age, an email, and an active status. 

Instead of creating four separate variables (`userName`, `userAge`, `userEmail`, `userStatus`), JavaScript provides Objects. Objects allow you to group related data and functionality together into a single, cohesive package using a system of "key-value pairs." Almost everything in JavaScript that is not a Primitive is an Object (including Arrays and Functions).

### (2) Reality Metaphor
An Object is like a physical dictionary. The whole book is the Object. 
- The words you look up are the **Keys** (or property names). 
- The definitions you read are the **Values**. 
If you want to know what "Apple" means, you flip to the key "Apple" and read the associated value.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Creating an object literal using curly braces {}
const user = {
  name: "Alice",     // Key: 'name', Value: "Alice"
  age: 28,           // Key: 'age', Value: 28
  isAdmin: true      // Key: 'isAdmin', Value: true
};

// Accessing data using "dot notation"
console.log(user.name); // "Alice"
```

#### Fuller Example
```javascript
const spaceship = {
  name: "Apollo",
  crewSize: 3,
  "registration-number": "N-1701", // Keys with hyphens MUST be strings
};

// 1. Dot Notation (Most common)
spaceship.crewSize = 4; // Updating a value

// 2. Bracket Notation (Required for variables or invalid identifier names)
const keyIWant = "name";
console.log(spaceship[keyIWant]); // "Apollo"
console.log(spaceship["registration-number"]); // "N-1701"

// Adding a new property dynamically
spaceship.isReadyForLaunch = true;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing Dot Notation with Bracket Notation

**The mistake:** Trying to use a variable with dot notation.

**Why it's wrong:** When you use `object.key`, JavaScript literally looks for a property named the exact string `"key"`. If you have a variable `let myVar = "age";` and you do `user.myVar`, it looks for the property `"myVar"`, not `"age"`. To evaluate a variable, you MUST use bracket notation `user[myVar]`.

*Incorrect:*
```javascript
const person = { age: 30 };
const propertyToFind = "age";

console.log(person.propertyToFind); // undefined! Looks for literally "propertyToFind"
```

*Fix:*
```javascript
const person = { age: 30 };
const propertyToFind = "age";

console.log(person[propertyToFind]); // 30 (Evaluates variable, looks up "age")
```

---

### Mistake 2: Losing Context Binding (`this`) in Object Callbacks

**The mistake:** Passing methods from Object instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "object",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "object",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Object Operations

**The mistake:** Executing asynchronous operations within Object without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/object"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/object");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in object: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Build a Book

**Problem:** Create an object called `book` with three properties: `title` (a string), `author` (a string), and `pages` (a number). Then, use dot notation to log a sentence like: "The book [Title] was written by [Author]."

**Expected output:**
*(Depends on your strings, e.g., "The book Dune was written by Frank Herbert.")*

> [!check]- Answer
> - Create it like `const book = { title: "Dune", author: "Frank Herbert", pages: 412 };`
> - Use template literals `` `The book ${book.title}...` `` for easy logging.
> 
---

### Exercise 2: Object Keys, Values, and Entries

**Problem:** Print keys, values, and entries of `{ a: 1, b: 2 }` using `Object.keys`, `Object.values`, and `Object.entries`.

**Expected output:**
> [!check]- Answer
> ```text
> ["a","b"]
> [1,2]
> [["a",1],["b",2]]
> ```
> ```javascript
> const obj = { a: 1, b: 2 };
> console.log(JSON.stringify(Object.keys(obj)));
> console.log(JSON.stringify(Object.values(obj)));
> console.log(JSON.stringify(Object.entries(obj)));
> ```
>
> **Explanation:** `Object.keys`, `Object.values`, and `Object.entries` extract iterable arrays of object metadata.
> 
---

### Exercise 3: Deep Copying with `structuredClone`

**Problem:** Create a deep clone of nested object `{ a: { b: 1 } }` using `structuredClone()`.

**Expected output:**
> [!check]- Answer
> ```text
> Original b: 1, Clone b: 99
> ```
> ```javascript
> const orig = { a: { b: 1 } };
> const copy = structuredClone(orig);
> copy.a.b = 99;
> console.log(`Original b: ${orig.a.b}, Clone b: ${copy.a.b}`);
> ```
>
> **Explanation:** `structuredClone` creates complete, independent deep memory copies of objects and nested collections.
> 
> 
---

## 7. Related Terms
- [Property](property.md) — An association between a key and a value in an object.
- [Method](method.md) — A function that is stored as a property of an object.
- [Array](array.md) — A specialized list-like object.
- [for...in](../level_04/for_in.md) — Related concept: for...in.
- [Map](../level_08/map.md) — Related concept: Map.
- [Prototype Chain](../level_07/prototype_chain.md) — Related concept: Prototype Chain.
- [this Keyword](../level_07/this_keyword.md) — Related concept: this Keyword.
- [Destructuring](../level_08/destructuring.md) — Related concept: Destructuring.
- [Garbage Collection](../level_09/garbage_collection.md) — Related concept: Garbage Collection.
- [Proxy](../level_09/proxy.md) — Related concept: Proxy.
- [Property Access (dot vs bracket notation)](property_access.md) — Dot vs bracket notation.
- [Prototype](../level_07/prototype.md) — Prototype chain.

---

## 8. Key Takeaways
- Objects are collections of key-value pairs enclosed in `{}`.
- Use **Dot Notation** (`user.name`) when you know the exact name of the property.
- Use **Bracket Notation** (`user["name"]` or `user[variable]`) when the property name contains special characters, or when you are using a variable to find the key.
