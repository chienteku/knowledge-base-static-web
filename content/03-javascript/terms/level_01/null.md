# null

> **Level 1 — Foundations**
> An intentional assignment value representing the absence of any object value.

---

## 1. Prerequisites
- [Variable](variable.md) — A named container for storing data values.
- [Primitive Types](primitive_types.md) — Basic immutable data types.
- [undefined](undefined.md) — A variable that has not yet been assigned a value.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: null is a fundamental concept in this technology stack. **Level 1 — Foundations**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
While `undefined` means "the engine hasn't given this a value yet," developers needed a way to explicitly say "I am actively deciding that this variable has *no value*." 

`null` was introduced to serve as an intentional empty state. It is primarily used to represent the purposeful absence of an object. For example, if you ask the browser to find an HTML element that doesn't exist, it returns `null` rather than `undefined` to indicate "I searched, and the result is nothing."

### (2) Reality Metaphor
If `undefined` is an empty file folder sitting on your desk waiting for its first document, `null` is when you take a document out of the folder, look at it, throw it in the shredder, and place a sticky note on the empty folder that says: "INTENTIONALLY LEFT BLANK."

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
let currentUser = null; // We explicitly know no one is logged in

if (currentUser === null) {
  console.log("Please log in to continue.");
}
```

#### Fuller Example
```javascript
// Simulating an API response
function fetchUserProfile(userId) {
  if (userId === 999) {
    // User not found in database. Return null intentionally.
    return null;
  }
  return { id: userId, name: "Alice" };
}

const profile = fetchUserProfile(999);

if (profile === null) {
  console.error("404: User profile could not be found.");
} else {
  console.log(`Welcome, ${profile.name}!`);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: The `typeof null` quirk

**The mistake:** Trusting `typeof` to accurately identify a `null` value.

**Why it's wrong:** In JavaScript, `typeof null` returns `"object"`. This is an infamous bug from the very first version of JavaScript that could never be fixed because fixing it would break backward compatibility with millions of early websites.

*Incorrect:*
```javascript
const value = null;
if (typeof value === 'null') {
  // This will NEVER run! typeof null is "object"
  console.log("It's null!");
}
```

*Fix:*
```javascript
const value = null;
// Use strict equality to check for null
if (value === null) {
  console.log("It's null!");
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Null Callbacks

**The mistake:** Passing methods from Null instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "null",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "null",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Null Operations

**The mistake:** Executing asynchronous operations within Null without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/null"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/null");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in null: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Intentional Absence User Profile Sanitizer

**Scenario:** A user profile API distinguishes between fields that were omitted (undefined) and fields that were intentionally cleared by the user (null).

**Requirements:**
1. Write a function processProfileField(fieldVal).
2. Return "OMITTED" if fieldVal === undefined.
3. Return "CLEARED" if fieldVal === null.
4. Return "VALID: " + fieldVal for valid values.

> [!check]- Answer
> #### Implementation
> ```javascript
> function processProfileField(fieldVal) {
>   if (fieldVal === undefined) return "OMITTED";
>   if (fieldVal === null) return "CLEARED";
>   return "VALID: " + fieldVal;
> }
> // Verification tests
> console.assert(processProfileField(undefined) === "OMITTED", "Test 1 Failed");
> console.assert(processProfileField(null) === "CLEARED", "Test 2 Failed");
> console.assert(processProfileField("Alice") === "VALID: Alice", "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Intentional Absence**: null represents an explicit, intentional absence of any object value.
> 2. **Difference from undefined**: undefined indicates an uninitialized binding or missing property, whereas null is an assigned empty sentinel value.
> 3. **Strict Equality**: Always use strict equality (===) to differentiate null from undefined, as loose equality (null == undefined) evaluates to true.
> 
---

### Exercise 2: Cache Miss vs Negative Sentinel Query

**Scenario:** An in-memory caching module returns undefined for a cache miss (record never queried) and null for a confirmed negative result (record queried, confirmed non-existent).

**Requirements:**
1. Check cache dictionary.
2. If key missing, return undefined.
3. If value is null, return cached negative sentinel status.
4. Return cached record.

> [!check]- Answer
> #### Implementation
> ```javascript
> function queryCacheStore(cacheMap, key) {
>   if (!(key in cacheMap)) {
>     return { status: "MISS", data: undefined };
>   }
>   const cachedVal = cacheMap[key];
>   if (cachedVal === null) {
>     return { status: "NOT_FOUND", data: null };
>   }
>   return { status: "HIT", data: cachedVal };
> }
> // Verification tests
> const cache = { user_1: { name: "Alice" }, user_99: null };
> console.assert(queryCacheStore(cache, "user_1").status === "HIT", "Test 1 Failed");
> console.assert(queryCacheStore(cache, "user_99").status === "NOT_FOUND", "Test 2 Failed");
> console.assert(queryCacheStore(cache, "user_50").status === "MISS", "Test 3 Failed");
> ```
> #### Technical Explanation
> 1. **Sentinel Pattern**: Using null as a sentinel value distinguishes 'no result found' from 'uninitialized query state'.
> 2. **Typeof Legacy Artifact**: typeof null returns "object", a historical JS bug preserved for web compatibility.
> 3. **Nullish Coalescing Compatibility**: The ?? operator treats both null and undefined as nullish values.
> 
---

### Exercise 3: DOM Node Selection Guard

**Scenario:** A browser UI module queries DOM elements using document.querySelector(). If an element is absent, the browser returns null. The code must guard against dereferencing null.

**Requirements:**
1. Check if node query result is null.
2. Safe dereference using null check or optional chaining ?..
3. Return element text content or fallback string.

> [!check]- Answer
> #### Implementation
> ```javascript
> function getElementTextContent(node) {
>   if (node === null) {
>     return "DEFAULT_TEXT";
>   }
>   return node.textContent ?? "DEFAULT_TEXT";
> }
> // Verification tests
> console.assert(getElementTextContent(null) === "DEFAULT_TEXT", "Test 1 Failed");
> console.assert(getElementTextContent({ textContent: "Header" }) === "Header", "Test 2 Failed");
> ```
> #### Technical Explanation
> 1. **DOM Null Returns**: DOM APIs (like querySelector) return null when an element is absent from the DOM tree.
> 2. **TypeError Prevention**: Dereferencing properties on null (e.g. null.textContent) throws a runtime TypeError.
> 3. **Primitive Status**: null is one of JavaScript's 7 primitive data types.
---

## 6. Related Terms
- [undefined](undefined.md) — A variable that has not yet been assigned a value.
- [Type Coercion](type_coercion.md) — Automatic conversion of values from one data type to another.
- [typeof](typeof.md) — Related concept: typeof.

---

## 7. Key Takeaways
- `null` represents the intentional absence of a value.
- You should use `null` (not `undefined`) when you want to clear a variable or return an empty state from a function.
- `typeof null` returning `"object"` is a famous, permanent language bug. Use `value === null` to check for it.
