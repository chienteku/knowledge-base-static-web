# Property

> **Level 2 — Control Flow & Data Structures**
> An association between a name (key) and a value within an object.

---

## 1. Prerequisites
- [Object](object.md) — A collection of key-value pairs.

---

## 2. Term Category

**Object-Oriented Programming (Universal: Works everywhere)**: Property is a fundamental concept in this technology stack. **Level 2 — Control Flow & Data Structures**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: E-Commerce Product Metadata Manager

**Scenario:** A catalog management service reads, adds, and updates key-value metadata properties on product objects.

**Requirements:**
1. Write updateProductMetadata(product, key, value).
2. Set property on product object.
3. Check if property exists.
4. Return updated product.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function updateProductMetadata(product, key, value) {
>   const copy = { ...product };
>   copy[key] = value;
>   return copy;
> }
>
> // Verification tests
> const prod = { id: 1, name: "Laptop" };
> const updated = updateProductMetadata(prod, "inStock", true);
> console.assert(updated.inStock === true, "Test 1 Failed");
> console.assert(prod.inStock === undefined, "Test 2 Failed: Original should not be mutated");
> ```
>
> #### Technical Explanation
>
> 1. **Property Mapping**: Properties are named key-value associations bound to object instances.
> 2. **Dynamic Assignment**: Bracket notation obj[key] = val assigns values to dynamic string property keys.
> 3. **Property Access**: Accessing undefined properties evaluates to undefined without throwing.
> 
---

### Exercise 2: Feature Flag Sanitizer with Delete Operator

**Scenario:** A feature flag service inspects feature flags and deletes temporary debugging flags using the delete operator.

**Requirements:**
1. Write sanitizeFlags(flagsObject, tempFlagKey).
2. Remove tempFlagKey property using delete operator.
3. Return updated object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function sanitizeFlags(flagsObject, tempFlagKey) {
>   const flags = { ...flagsObject };
>   if (tempFlagKey in flags) {
>     delete flags[tempFlagKey];
>   }
>   return flags;
> }
>
> // Verification tests
> const initial = { featureA: true, debugFlag: true };
> const cleaned = sanitizeFlags(initial, "debugFlag");
> console.assert("debugFlag" in initial === true, "Test 1 Failed");
> console.assert("debugFlag" in cleaned === false, "Test 2 Failed: Property not deleted");
> ```
>
> #### Technical Explanation
>
> 1. **Delete Operator**: The delete operator removes a property binding from an object instance entirely.
> 2. **Difference from undefined**: Setting obj.prop = undefined retains the key; delete removes the key key completely.
> 3. **In Operator Check**: Expression key in obj checks if the key exists on the object or its prototype chain.
> 
---

### Exercise 3: Own Property Checker Utility

**Scenario:** An object mapping library verifies whether a property is an 'own' property using Object.hasOwn() rather than inherited from prototype chain.

**Requirements:**
1. Write verifyOwnProperty(obj, propKey).
2. Check if propKey is an own property using Object.hasOwn(obj, propKey).
3. Return boolean result.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function verifyOwnProperty(obj, propKey) {
>   if (obj === null || typeof obj !== "object") return false;
>   return Object.hasOwn(obj, propKey);
> }
>
> // Verification tests
> const parent = { inheritedProp: "parent" };
> const child = Object.create(parent);
> child.ownProp = "child";
>
> console.assert(verifyOwnProperty(child, "ownProp") === true, "Test 1 Failed");
> console.assert(verifyOwnProperty(child, "inheritedProp") === false, "Test 2 Failed: Inherited property detected as own");
> ```
>
> #### Technical Explanation
>
> 1. **Object.hasOwn() Standard**: Modern ES2022 method replacing legacy Object.prototype.hasOwnProperty.call().
> 2. **Own vs Inherited**: Own properties exist directly on the object instance; inherited properties exist on prototype chain.
> 3. **Type Safety**: Object.hasOwn() safely checks properties on objects created via Object.create(null).
---

## 6. Related Terms
- [Object](object.md) — The container that holds properties.
- [Method](method.md) — A specific type of property where the value is a function.

---

## 7. Key Takeaways
- A property is just a key-value pair inside an object.
- The "key" is usually a string, and the "value" can be absolutely any JavaScript data type (Primitive, Array, another Object, etc.).
- Accessing a property that doesn't exist returns `undefined`.
