# .then() / .catch()

> **Level 6 — Asynchronous JavaScript**
> Methods chained onto Promises to handle fulfilled values or rejected errors.

---

## 1. Prerequisites
- [Promise](./promise.md) — The object that these methods attach to.
- [Callback Function](../level_03/callback_function.md) — Used inside `.then` and `.catch`.

---

## 2. Term Category
- **Language Core** *(Introduced in ES6)*

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Once JavaScript introduced the [Promise](./promise.md) object to represent future asynchronous data, developers needed a clean, standardized way to say: "When this Promise finally finishes, *then* do this specific thing with the data."

`.then()` and `.catch()` were created as the official API for interacting with Promises. Instead of passing an error callback and a success callback deep into an original function, you attach `.then()` directly to the returned Promise to handle success, and `.catch()` to handle failure. Because `.then()` always returns a *new* Promise, you can chain them together vertically, completely eliminating the sideways Pyramid of Doom (Callback Hell).

### (2) Reality Metaphor
Imagine handing your car keys to a mechanic. The mechanic gives you a claim ticket (the Promise).
You attach instructions to that ticket: 
"**THEN**, when the car is fixed, drive it to my house." 
"**CATCH** me on my cell phone if you find the engine is broken and cannot be fixed."

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// fetch() returns a Promise
const dataPromise = fetch('https://api.example.com/user');

dataPromise
  .then((response) => {
    // This callback ONLY runs if the Promise is "Fulfilled"
    console.log("Success! Data received:", response);
  })
  .catch((error) => {
    // This callback ONLY runs if the Promise is "Rejected"
    console.error("Uh oh, something broke:", error);
  });
```

#### Fuller Example: Promise Chaining
```javascript
// By chaining .then(), we flatten Callback Hell into a neat vertical list!

fetch('https://api.example.com/user/1')
  .then((response) => {
    // 1. Get the raw network response, convert to JSON
    return response.json(); 
  })
  .then((user) => {
    // 2. We receive the JSON user! Now fetch their posts...
    return fetch(`https://api.example.com/posts?userId=${user.id}`);
  })
  .then((postResponse) => {
    // 3. Convert posts to JSON
    return postResponse.json();
  })
  .then((posts) => {
    // 4. Finally, log the posts
    console.log("User's posts:", posts);
  })
  .catch((error) => {
    // A single .catch() at the bottom catches errors from ANY step in the chain!
    console.log("Global Error Handler:", error);
  });
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Then Catch Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Then Catch blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "then_catch";
```

*Fix:*
```javascript
let value = "then_catch";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Then Catch Callbacks

**The mistake:** Passing methods from Then Catch instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "then_catch",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "then_catch",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Then Catch Operations

**The mistake:** Executing asynchronous operations within Then Catch without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/then_catch"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/then_catch");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in then_catch: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Catching the Error

**Problem:** If the very first `fetch()` in a long chain of 10 `.then()` blocks fails due to a network error, which of those `.then()` blocks will execute?

**Expected output:**
```text
None of them. The engine instantly skips all `.then()` blocks and drops straight down to the nearest `.catch()` block.
```

> [!check]- Answer
> - This is why vertical chaining is so much cleaner than nested callbacks! One error handler to rule them all.

---

### Exercise 2: Chaining `.then()` and `.catch()`

**Problem:** Chain `.then()` and `.catch()` on a rejected promise.

**Expected output:**
```text
Caught: Rejection error
```

> [!check]- Answer
> ```javascript
> Promise.reject(new Error("Rejection error"))
>   .then(() => console.log("Success"))
>   .catch(err => console.log(`Caught: ${err.message}`));
> ```
>
> **Explanation:** `.catch(fn)` is syntactic shorthand for `.then(null, fn)`.

### Exercise 3: Recovering from Rejections with `.catch()`

**Problem:** Return a fallback value from `.catch()` and continue execution in a subsequent `.then()`.

**Expected output:**
```text
Recovered value: fallback
```

> [!check]- Answer
> ```javascript
> Promise.reject("error")
>   .catch(() => "fallback")
>   .then(val => console.log(`Recovered value: ${val}`));
> ```
>
> **Explanation:** Returning values from `.catch()` fulfills downstream promises, enabling recovery.

---

---

## 7. Related Terms
- [Promise](./promise.md) — The object that `.then` and `.catch` are attached to.
- [`async` / `await`](./async_await.md) — An even newer, cleaner syntax that replaces `.then()` chains.

---

## 8. Key Takeaways
- `.then()` executes a callback when a Promise is successfully Fulfilled.
- `.catch()` executes a callback when a Promise is Rejected (fails).
- You can chain `.then()` blocks vertically to perform sequential asynchronous tasks.
- A single `.catch()` at the end of a chain will catch an error from *any* previous step.
