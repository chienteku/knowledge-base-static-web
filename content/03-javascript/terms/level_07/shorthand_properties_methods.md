# Shorthand Properties & Methods

> **Level 7 — Objects & Prototypes**
> `{ x }` and `{ method() {} }` object shorthands.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The base key-value data structure.
---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In web development, we frequently map existing variables directly into object properties. For instance, when constructing a database payload or sending a JSON request, we write code like `{ username: username, age: age, status: status }`. Having to write the identifier twice for every key is repetitive and bloats the code.

Similarly, declaring methods inside object literals historically required writing out the `function` keyword:
```javascript
const calculator = {
  add: function(a, b) { return a + b; }
};
```

To eliminate this boilerplate, ES6 introduced **Shorthand Properties and Methods**:
1. **Property Shorthand:** If the object key name matches the variable name containing the value, you only need to write the name once: `{ username, age, status }`.
2. **Method Shorthand:** You can declare functions directly inside the object by omitting the colon `:` and the `function` keyword: `add(a, b) { ... }`.

### (2) Reality Metaphor
Imagine a label designer printing tags for boxes.
- The **legacy syntax** is like a strict clerk who requires you to say everything twice: "The label of this slot is named 'User', and you will place the 'User' document inside it. The label of that slot is named 'Age', and you will place the 'Age' document inside it."
- The **shorthand syntax** is like a smart manager. You hand them a bundle of labeled documents ("User", "Age") and say: "File these." The manager automatically labels the drawers "User" and "Age" and slides the documents inside.

### (3) JavaScript Code Examples

#### Property and Method Shorthand Comparison
```javascript
const username = "Alice";
const role = "admin";

// 1. Legacy ES5 Syntax
const legacyUser = {
  username: username,
  role: role,
  sayHi: function() {
    return "Hi, " + this.username;
  }
};

// 2. Modern ES6 Shorthand Syntax
const modernUser = {
  username, // Key name defaults to "username", value is Alice
  role,     // Key name defaults to "role", value is admin
  
  // Method shorthand (omits ': function')
  sayHi() {
    return `Hi, ${this.username}`;
  }
};

console.log(modernUser.username); // "Alice"
console.log(modernUser.sayHi());  // "Hi, Alice"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing Shorthand Methods with Arrow Functions

**The mistake:** Assuming that shorthand method declarations `myMethod() {}` behave identically to arrow function property declarations `myMethod: () => {}`.

**Why it's wrong:** Shorthand methods behave like traditional function expressions: they receive a dynamic **`this`** context bound to the object executing them. Arrow functions, however, lack their own `this` binding and inherit `this` lexically from their surrounding scope, which will cause `this` to resolve to the global object or `undefined`.

*Incorrect:*
```javascript
const profile = {
  name: "Bob",
  // Arrow function: loses 'this' binding!
  greet: () => {
    return `Hello, ${this.name}`; // 'this' points to global window/undefined
  }
};

console.log(profile.greet()); // "Hello, undefined"
```

*Fix:*
```javascript
const profile = {
  name: "Bob",
  // Shorthand method: preserves dynamic 'this' binding
  greet() {
    return `Hello, ${this.name}`; // 'this' points to profile
  }
};

console.log(profile.greet()); // "Hello, Bob"
```

---

### Mistake 2: Losing Context Binding (`this`) in Shorthand Properties Methods Callbacks

**The mistake:** Passing methods from Shorthand Properties Methods instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "shorthand_properties_methods",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "shorthand_properties_methods",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Shorthand Properties Methods Operations

**The mistake:** Executing asynchronous operations within Shorthand Properties Methods without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/shorthand_properties_methods"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/shorthand_properties_methods");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in shorthand_properties_methods: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Build Shorthand Coordinates

**Problem:** Complete the function `createPoint` to construct and return an object using **property and method shorthands** for `x`, `y`, and a method `printCoords` that returns the string `"Coordinates: X, Y"`.

```javascript
function createPoint(x, y) {
  // Return object using shorthand syntax
}

const point = createPoint(10, 20);
console.log(point.x); // 10
console.log(point.printCoords()); // "Coordinates: 10, 20"
```

> [!check]- Answer
> - Inside the object return, write `x, y,` and then declare the method: `printCoords() { return ... }`.

---

### Exercise 2: ES6 Property Shorthand

**Problem:** Create object `{ name, age }` from variables `name = "Alice"` and `age = 30`.

**Expected output:**
> [!check]- Answer
> ```text
> {"name":"Alice","age":30}
> ```
> ```javascript
> const name = "Alice";
> const age = 30;
> const user = { name, age };
> console.log(JSON.stringify(user));
> ```
>
> **Explanation:** ES6 property shorthand `{ name }` maps variable names directly as object keys.

---

### Exercise 3: ES6 Method Shorthand

**Problem:** Define method `speak() { return "Hi"; }` inside object literal.

**Expected output:**
> [!check]- Answer
> ```text
> Hi
> ```
> ```javascript
> const bot = { speak() { return "Hi"; } };
> console.log(bot.speak());
> ```
>
> **Explanation:** ES6 method shorthand eliminates colon and `function` keywords in object definitions.


---

## 7. Related Terms
- [Destructuring](../level_08/destructuring.md) — The matching syntax used to extract values from objects.
- [Computed Property Names](computed_property_names.md) — Related concept: Computed Property Names.
---

## 8. Key Takeaways
- Property shorthand allows you to write just the variable name (e.g. `{name}`) when the key and value variable names match.
- Method shorthand allows declaring functions directly without using the `: function` keyword.
- Shorthand methods preserve dynamic `this` binding behavior, whereas arrow functions do not.
- Use shorthands to make object literal declarations clean, concise, and easy to read.
