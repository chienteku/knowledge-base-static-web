# Symbol

> **Level 8 — Modern JavaScript (ES6+)**
> A unique and immutable primitive data type often used as object keys.

---

## 1. Prerequisites
- [Primitive Types](../level_01/primitive_types.md) — The core, immutable data types in JavaScript.
- [Object](../level_02/object.md) — The base key-value dictionary structure.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before ES6, object keys could only be strings. This constraint caused two issues:
1. **Namespace Collisions:** If two different third-party libraries tried to add properties to the same shared object using the same key name, they would silently overwrite each other's data.
2. **Hidden Metadata:** Developers had no way to add internal metadata properties to an object without them leaking during standard `for...in` loops, `Object.keys()` counts, or `JSON.stringify()` serializations.

To solve this, ES6 introduced **`Symbol`**:
- A primitive data type that represents a **completely unique, immutable identifier**.
- Created by calling the global `Symbol(description)` function. (Note: It is a factory function, **not** a constructor; calling it with `new Symbol()` throws a `TypeError`).
- Every Symbol returned is guaranteed to be globally unique. Even if two symbols are created with the exact same description, they are not equal: `Symbol("key") === Symbol("key")` evaluates to `false`.
- **Property Hiding:** When used as object keys, symbol properties are non-enumerable. They are ignored by `for...in` loops, `Object.keys()`, and `JSON.stringify()`.
- **Well-Known Symbols:** Special built-in Symbols used by the JavaScript engine to customize core language behaviors (e.g. **`Symbol.iterator`** to make an object compatible with `for...of` loops, or **`Symbol.toStringTag`** to customize `Object.prototype.toString` output).

### (2) Reality Metaphor
- A **String key** is like sticking a paper label onto a drawer saying `"Files"`. If another manager walks in and writes `"Files"` on a sticky note, they can put it on the drawer and overwrite your meaning.
- A **Symbol key** is like installing an **encrypted RFID badge reader** on the drawer. You label the reader `"Files Reader"` (the description). Even if someone else installs another reader labeled `"Files Reader"`, their card frequencies are completely unique. Only your specific badge can unlock your data, and a random clerk looking at the drawer from far away (standard loops) cannot even see the keyhole.

### (3) JavaScript Code Examples

#### Uniqueness and Hidden Keys
```javascript
// 1. Every symbol is unique
const idA = Symbol("userId");
const idB = Symbol("userId");

console.log(idA === idB); // false

// 2. Using symbols as object keys
const user = {
  name: "Alice",
  [idA]: 9901 // Computed property name syntax
};

console.log(user[idA]); // 9901

// 3. Symbol properties are non-enumerable
console.log(Object.keys(user)); // [ 'name' ] (idA is ignored!)
console.log(JSON.stringify(user)); // '{"name":"Alice"}' (idA is stripped!)

// 4. Retrieving symbol keys explicitly
const symbols = Object.getOwnPropertySymbols(user);
console.log(symbols); // [ Symbol(userId) ]
console.log(user[symbols[0]]); // 9901
```

#### Customizing Object Behavior with Well-Known Symbols
```javascript
// Customizing the output of Object.prototype.toString.call()
const customLogger = {
  // Use a well-known Symbol key
  [Symbol.toStringTag]: "SuperLogger" 
};

console.log(Object.prototype.toString.call(customLogger)); 
// Logs: "[object SuperLogger]" (Instead of "[object Object]"!)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Invoking Symbol with the `new` keyword

**The mistake:** Attempting to instantiate a symbol: `const sym = new Symbol()`.

**Why it's wrong:** `Symbol` is a primitive factory function, not a constructor. Constructing object wrapper instances around primitives is deprecated and throws a `TypeError`.

*Incorrect:*
```javascript
const mySymbol = new Symbol("desc"); // TypeError: Symbol is not a constructor
```

*Fix:*
```javascript
const mySymbol = Symbol("desc"); // Correct
```

---

### Mistake 2: Losing Context Binding (`this`) in Symbol Callbacks

**The mistake:** Passing methods from Symbol instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "symbol",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "symbol",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Symbol Operations

**The mistake:** Executing asynchronous operations within Symbol without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/symbol"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/symbol");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in symbol: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Collision Prevention

**Problem:** Complete the code to assign the value `"secured_token"` to `data` using a symbol `securityKey` as the key, ensuring the value cannot be read in the `Object.keys()` loop below.

```javascript
const data = {
  status: "active"
};

// Create a unique symbol
const securityKey = // Write symbol code
// Assign "secured_token" to data under the symbol key

console.log("Keys count:", Object.keys(data).length); // Should be 1
console.log("Token value:", data[securityKey]); // "secured_token"
```

> [!check]- Answer
> - Declare `const securityKey = Symbol("token")` and assign `data[securityKey] = "secured_token"`.

---

### Exercise 2: Creating Unique Object Hidden Keys with Symbols

**Problem:** Create two symbols `const s1 = Symbol("id"); const s2 = Symbol("id");`. Compare `s1 === s2` and use `s1` as an object key.

**Expected output:**
```text
false
123
```

> [!check]- Answer
> ```javascript
> const s1 = Symbol("id");
> const s2 = Symbol("id");
> console.log(s1 === s2); // false
> const user = { [s1]: 123 };
> console.log(user[s1]);
> ```
>
> **Explanation:** Every `Symbol()` call creates a unique, guaranteed non-colliding primitive value.

### Exercise 3: Global Symbol Registry with `Symbol.for()`

**Problem:** Demonstrate that `Symbol.for("key") === Symbol.for("key")` returns `true` using the global registry.

**Expected output:**
```text
true
```

> [!check]- Answer
> ```javascript
> const sym1 = Symbol.for("app.id");
> const sym2 = Symbol.for("app.id");
> console.log(sym1 === sym2);
> ```
>
> **Explanation:** `Symbol.for(key)` looks up or creates shared symbols in the cross-realm runtime global symbol registry.

---

### Exercise 4: Well-Known Symbol Customization (`Symbol.toPrimitive`)

**Problem:** Customize object string conversion using `[Symbol.toPrimitive](hint)`.

**Expected output:**
```text
42
```

> [!check]- Answer
> ```javascript
> const obj = {
>   [Symbol.toPrimitive](hint) { return 42; }
> };
> console.log(+obj);
> ```
>
> **Explanation:** Well-known Symbols like `Symbol.toPrimitive` hook into core JavaScript engine conversion routines.

### Exercise 5: Global Symbol Registry Lookup

**Problem:** Retrieve symbol key string from registry using `Symbol.keyFor(Symbol.for("app.id"))`.

**Expected output:**
```text
app.id
```

> [!check]- Answer
> ```javascript
> const sym = Symbol.for("app.id");
> console.log(Symbol.keyFor(sym));
> ```
>
> **Explanation:** `Symbol.keyFor(sym)` returns the registered key string for symbols in the global registry.

---

## 7. Related Terms
- [Iterators & Iterables (protocol)](./iterators_iterables.md) — The looping contract built on `Symbol.iterator`.
- [Private Class Fields (`#`)](../level_07/private_class_fields.md) — Enforces class encapsulation without relying on Symbol conventions.

---

## 8. Key Takeaways
- Symbols are a unique, immutable primitive data type introduced in ES6.
- Create symbols using the factory function `Symbol(desc)`. Never use the `new` keyword.
- Symbols are guaranteed to be unique; no two symbols are equal, regardless of descriptions.
- Symbol property keys are non-enumerable, meaning they are excluded from `for...in` loops, `Object.keys()`, and `JSON.stringify()`.
- Access symbol keys on objects using `Object.getOwnPropertySymbols(obj)`.
- Well-known symbols (like `Symbol.iterator`) customize language features on custom objects.
