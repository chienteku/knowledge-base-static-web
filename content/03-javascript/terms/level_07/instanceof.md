# instanceof

> **Level 7 — Objects & Prototypes**
> Test whether an object is built from a constructor.

---

## 1. Prerequisites
- [new Keyword](new_keyword.md) — The constructor instantiation operator.
- [Prototype Chain](prototype_chain.md) — The linked series of prototypes resolving properties and identities.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: instanceof is a fundamental concept in this technology stack. **Level 7 — Objects & Prototypes**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, the `typeof` operator is useful for identifying basic primitive data types (e.g., `typeof "text"` returns `"string"`). However, because Arrays, Dates, Regular Expressions, and custom class instances are all built on top of objects under the hood, calling `typeof` on any of them returns `"object"`. This makes it impossible to differentiate what kind of object you are holding.

To solve this, JavaScript implements the **`instanceof`** operator:
- **Syntax:** `object instanceof ConstructorFunction`
- **How it works:** It checks if the `prototype` property of the `ConstructorFunction` exists anywhere in the **prototype chain** of the target `object`.
- If it finds a match, it returns `true`. If it reaches the end of the chain (`null`) without finding a match, it returns `false`.

This is critical when performing runtime type checks, such as verifying if an argument is a valid `Date` object or matching custom exceptions.

### (2) Reality Metaphor
`instanceof` is like a genealogical **DNA lineage test**.
- Calling **`typeof`** is like looking at a person through binoculars from far away. It only tells you the broad species classification: "That is a human" (returns `"object"`).
- Calling **`instanceof`** is checking if a person is a descendant of a specific ancestor (e.g., `person instanceof Grandfather`). The test checks the person's lineage (prototype chain) step-by-step. If it finds the Grandfather anywhere in the family tree, the test returns `true`.

### (3) JavaScript Code Examples

#### Checking Built-in and Custom Types
```javascript
// 1. Built-in types
const numbers = [1, 2, 3];
const today = new Date();

console.log(typeof numbers); // "object" (Not specific enough!)
console.log(typeof today);   // "object"

console.log(numbers instanceof Array);  // true
console.log(numbers instanceof Object); // true (Array inherits from Object)
console.log(today instanceof Date);     // true

// 2. Custom classes
class Animal {}
class Dog extends Animal {}

const pet = new Dog();

console.log(pet instanceof Dog);    // true
console.log(pet instanceof Animal); // true (Dog inherits from Animal prototype chain)
console.log(pet instanceof Object); // true
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting `instanceof` to work on primitive literals

**The mistake:** Testing primitive variables like string or number literals using `instanceof`.

**Why it's wrong:** Primitive values are not objects and do not have prototype chains. Only object wrappers created via constructors carry prototype links.

*Incorrect:*
```javascript
const name = "Alice";
console.log(name instanceof String); // false (Primitive literal)
```

*Fix:*
```javascript
const name = "Alice";
console.log(typeof name === "string"); // true (Use typeof for primitives!)

// Or wrapping:
const wrappedName = new String("Alice");
console.log(wrappedName instanceof String); // true
```

### Mistake 2: Multi-Window (iframe) Context Failures

**The mistake:** Testing an array passed from an HTML `<iframe>` using `arr instanceof Array` inside the parent window.

**Why it's wrong:** Every iframe has its own isolated global context with its own distinct `Array` constructor function in memory. Even though the iframe array behaves identically, its prototype chain points to the iframe's `Array.prototype`, not the parent window's `Array.prototype`, causing `instanceof` to return `false`.

*Incorrect:*
```javascript
// arr is an array from an iframe
console.log(arr instanceof Array); // false (Different global Array constructor!)
```

*Fix:*
```javascript
// Use Array.isArray() which is cross-context safe:
console.log(Array.isArray(arr)); // true
```

---

### Mistake 3: Unhandled Asynchronous Failures in Instanceof Operations

**The mistake:** Executing asynchronous operations within Instanceof without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/instanceof"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/instanceof");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in instanceof: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Polymorphic Error Classification with instanceof

**Scenario:** An API gateway error handler uses the instanceof operator to classify incoming thrown errors and format HTTP status codes.

**Requirements:**
1. Write classifyApiError(err).
2. Check err instanceof TypeError, err instanceof RangeError, or err instanceof Error.
3. Return status code.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function classifyApiError(err) {
>   if (err instanceof TypeError) {
>     return 400; // Bad Request
>   } else if (err instanceof RangeError) {
>     return 422; // Unprocessable Entity
>   } else if (err instanceof Error) {
>     return 500; // Internal Server Error
>   }
>   return 500;
> }
>
> // Verification tests
> console.assert(classifyApiError(new TypeError("Invalid argument")) === 400, "Test 1 Failed");
> console.assert(classifyApiError(new RangeError("Out of bounds")) === 422, "Test 2 Failed");
> console.assert(classifyApiError(new Error("Generic")) === 500, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **instanceof Operator**: The instanceof operator tests whether constructor.prototype appears anywhere in object's prototype chain.
> 2. **Prototype Chain Verification**: Walks up the prototype chain checking [[Prototype]] references against target constructors.
> 3. **Cross-Realm Caveat**: instanceof may return false if objects were instantiated across different iframe/window realms.
> 
---

### Exercise 2: Instanceof Advanced Context Handler

**Scenario:** A web application component processes instanceof data operations within enterprise workflows.

**Requirements:**
1. Write handleInstanceofSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleInstanceofSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleInstanceofSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Instanceof Architecture**: Applying instanceof patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Instanceof Performance Optimization

**Scenario:** An application utility optimizes instanceof execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeInstanceofTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeInstanceofTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeInstanceofTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Instanceof Optimization**: Optimizing instanceof improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [typeof](../level_01/typeof.md) — The operator used to check primitive types.
- [Class](class.md) — ES6 syntax that maps prototype chains under class definitions.
- [Reflect](../level_09/reflect.md) — Related concept: Reflect.

---

## 7. Key Takeaways
- Use `instanceof` to verify if an object's prototype chain contains a constructor's prototype property.
- It is ideal for identifying complex types (like Arrays, Dates) or custom class instances where `typeof` returns `"object"`.
- `instanceof` returns `false` when compared against primitive literals.
- Beware of using `instanceof` on objects passed across different global environments (such as iframes) as they have separate constructor contexts.
