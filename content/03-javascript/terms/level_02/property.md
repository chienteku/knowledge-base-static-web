# Property

> **Level 2 — Control Flow & Data Structures**
> An association between a name (key) and a value within an object.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — A collection of key-value pairs.

---

## 2. Term Category
- **Object-Oriented Programming**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If an Object is a container, we needed a vocabulary to describe the individual items inside that container. A "Property" is simply the pairing of the label (the key) and the actual data (the value). This terminology allows developers to discuss data structures clearly: "Check the `length` property of the array" or "Update the `email` property of the user object."

### (2) Reality Metaphor
If an Object is a driver's license, the Properties are the specific lines of information printed on it.
- **Key:** "Date of Birth" | **Value:** "1990-01-01"
- **Key:** "Eye Color" | **Value:** "Brown"
Together, the Key and the Value make up one "Property" of the license.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const car = {
  brand: "Toyota",  // This line is a property
  wheels: 4         // This line is another property
};

console.log(car.brand); // Accessing the 'brand' property
```

#### Fuller Example
```javascript
const user = {};

// You can add properties dynamically
user.firstName = "John";
user.lastName = "Doe";

// You can check if a property exists using the 'in' operator
if ("firstName" in user) {
  console.log("The object has a firstName property.");
}

// You can delete a property entirely
delete user.lastName;

console.log(user); // { firstName: "John" }
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Accessing a non-existent property

**The mistake:** Assuming that asking for a property that doesn't exist will crash the program.

**Why it's wrong:** In many strict languages, asking for `user.address` if it doesn't exist will throw an error and crash. In JavaScript, it simply returns `undefined`. This can cause silent bugs further down in your code if you try to do something with that `undefined` value.

*Incorrect:*
```javascript
const dog = { breed: "Poodle" };
// No error is thrown. `age` simply evaluates to undefined.
const dogAge = dog.age; 
```

*Fix:*
```javascript
const dog = { breed: "Poodle" };
// Always provide fallback logic or check if it exists
const dogAge = dog.age || "Age unknown"; 
```

---

### Mistake 2: Losing Context Binding (`this`) in Property Callbacks

**The mistake:** Passing methods from Property instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "property",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "property",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Property Operations

**The mistake:** Executing asynchronous operations within Property without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/property"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/property");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in property: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Property Deletion

**Problem:** Create an object `settings` with properties `theme: "dark"` and `notifications: true`. Use the `delete` operator to remove the `notifications` property. Then log the `settings` object.

**Expected output:**
> [!check]- Answer
> ```text
> { theme: 'dark' }
> ```
> - `delete settings.notifications;`

---

### Exercise 2: Checking Own Properties with `Object.hasOwn`

**Problem:** Check if `"toString"` is an own property of `{ a: 1 }` vs `"a"` using `Object.hasOwn()`.

**Expected output:**
> [!check]- Answer
> ```text
> a: true, toString: false
> ```
> ```javascript
> const obj = { a: 1 };
> console.log(`a: ${Object.hasOwn(obj, "a")}, toString: ${Object.hasOwn(obj, "toString")}`);
> ```
>
> **Explanation:** `Object.hasOwn(obj, prop)` checks if `prop` exists as a direct non-inherited property on `obj`.

---

### Exercise 3: Configuring Property Descriptors

**Problem:** Use `Object.defineProperty` to create a non-writable property `id: 100`.

**Expected output:**
> [!check]- Answer
> ```text
> 100
> ```
> ```javascript
> const item = {};
> Object.defineProperty(item, "id", {
>   value: 100,
>   writable: false
> });
> console.log(item.id);
> ```
>
> **Explanation:** Property descriptors configure `writable`, `enumerable`, and `configurable` object property flags.


---

## 7. Related Terms
- [Object](../level_02/object.md) — The container that holds properties.
- [Method](../level_02/method.md) — A specific type of property where the value is a function.

---

## 8. Key Takeaways
- A property is just a key-value pair inside an object.
- The "key" is usually a string, and the "value" can be absolutely any JavaScript data type (Primitive, Array, another Object, etc.).
- Accessing a property that doesn't exist returns `undefined`.
