# null

> **Level 1 — Foundations**
> An intentional assignment value representing the absence of any object value.

---

## 1. Prerequisites
- [Variable](../level_01/variable.md) — A named container for storing data values.
- [Primitive Types](../level_01/primitive_types.md) — Basic immutable data types.
- [`undefined`](../level_01/undefined.md) — A variable that has not yet been assigned a value.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Null vs Undefined

**Problem:** Create a variable `a` but do not initialize it. Create a variable `b` and assign it `null`. Log the strict equality (`===`) and loose equality (`==`) comparison of `a` and `b`.

**Expected output:**
> [!check]- Answer
> ```text
> false
> true
> ```
> - `undefined === null` is `false` because they are different types.
> - `undefined == null` is `true` due to type coercion; they both represent "emptiness".

---

### Exercise 2: Safe Null Equality Checking

**Problem:** Check if a variable `x` is `null` or `undefined` using loose equality `x == null`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> true
> false
> ```
> ```javascript
> function isNullish(x) {
>   return x == null;
> }
> console.log(isNullish(null));
> console.log(isNullish(undefined));
> console.log(isNullish(0));
> ```
>
> **Explanation:** `x == null` matches both `null` and `undefined` while returning `false` for all other falsy values (`0`, `false`, `""`).

---

### Exercise 3: Null Coalescing Defaulting

**Problem:** Use `??` to supply default `"Guest"` for `null` and `undefined`, but keep empty string `""` and `0`.

**Expected output:**
> [!check]- Answer
> ```text
> Guest
> Guest
> ""
> 0
> ```
> ```javascript
> console.log(null ?? "Guest");
> console.log(undefined ?? "Guest");
> console.log("" ?? "Guest");
> console.log(0 ?? "Guest");
> ```
>
> **Explanation:** `a ?? b` returns `b` only if `a` is `null` or `undefined`.


---

## 7. Related Terms
- [`undefined`](../level_01/undefined.md) — A variable that has not yet been assigned a value.
- [Type Coercion](../level_01/type_coercion.md) — Automatic conversion of values from one data type to another.

---

## 8. Key Takeaways
- `null` represents the intentional absence of a value.
- You should use `null` (not `undefined`) when you want to clear a variable or return an empty state from a function.
- `typeof null` returning `"object"` is a famous, permanent language bug. Use `value === null` to check for it.
