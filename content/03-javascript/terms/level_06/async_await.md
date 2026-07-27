# async / await

> **Level 6 — Asynchronous JavaScript**
> Syntactic sugar built on top of Promises, making asynchronous code read synchronously.

---

## 1. Prerequisites
- [Promise](./promise.md) — The underlying technology `async/await` interacts with.
- [Synchronous](./synchronous.md) — The style of code `async/await` mimics.

---

## 2. Term Category
- **Language Core** *(Introduced in ES8 / ES2017)*

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While `.then()` chains successfully fixed the "Pyramid of Doom" caused by callbacks, they still required developers to write lots of callback functions, `return` statements, and visually break up their logic. Developers constantly wished they could just write standard, top-to-bottom synchronous code, but still have it operate asynchronously under the hood.

In ES8, JavaScript introduced `async` and `await`. It is purely "syntactic sugar" (a sweeter, easier way to write existing logic) placed directly on top of Promises. By marking a function as `async`, you gain the magical ability to use the `await` keyword inside it. `await` literally pauses the execution of that specific function until a Promise resolves, unwraps the data, and hands it to a normal variable, completely eliminating the need for `.then()`.

### (2) Reality Metaphor
Using `.then()` is like ordering a package and leaving a note on the door: "Whenever the mailman arrives, please put the package in the bin."
Using `await` is like sitting in a magical chair. You say "I await my package." Time freezes for you, but the rest of the world keeps moving. The moment the mailman hands you the package, time unfreezes, and you immediately continue your day holding the package in your hands.

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// 1. Mark the function with 'async'
async function getUser() {
  console.log("Fetching...");
  
  // 2. Use 'await' to pause until the Promise finishes. 
  // It automatically unwraps the resolved data!
  const response = await fetch('https://api.example.com/user');
  const data = await response.json();
  
  console.log("User received:", data);
}

getUser();
```

#### Fuller Example: Try / Catch Error Handling
```javascript
// Because async/await behaves synchronously, we use standard try/catch blocks!

async function getDashboardData() {
  try {
    const userRes = await fetch('/api/user/1');
    const user = await userRes.json();
    
    // We can easily use data from the previous line on the next line
    const postRes = await fetch(`/api/posts?userId=${user.id}`);
    const posts = await postRes.json();
    
    console.log(`Loaded ${posts.length} posts for ${user.name}`);
    
  } catch (error) {
    // This catches errors from ANY of the awaited Promises above
    console.error("Dashboard failed to load:", error);
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Async Await Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Async Await blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "async_await";
```

*Fix:*
```javascript
let value = "async_await";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Async Await Callbacks

**The mistake:** Passing methods from Async Await instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "async_await",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "async_await",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Async Await Operations

**The mistake:** Executing asynchronous operations within Async Await without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/async_await"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/async_await");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in async_await: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Refactoring

**Problem:** Convert this `.then()` chain into `async/await` syntax.
```javascript
function getJoke() {
  fetch('https://api.jokes.com/random')
    .then(res => res.json())
    .then(data => console.log(data.joke));
}
```

**Expected output:**
```javascript
async function getJoke() {
  const res = await fetch('https://api.jokes.com/random');
  const data = await res.json();
  console.log(data.joke);
}
```

> [!check]- Answer
> - Don't forget to add `async` to the function declaration!
> - Assign the result of `await fetch(...)` to a variable.

---

### Exercise 2: Async Await Error Handling with Try/Catch

**Problem:** Wrap `await Promise.reject(new Error("Failed"))` in a `try...catch` block.

**Expected output:**
```text
Caught error: Failed
```

> [!check]- Answer
> ```javascript
> async function run() {
>   try {
>     await Promise.reject(new Error("Failed"));
>   } catch (err) {
>     console.log(`Caught error: ${err.message}`);
>   }
> }
> run();
> ```
>
> **Explanation:** `try...catch` blocks catch rejected promise errors thrown inside `async` functions.

### Exercise 3: Parallel Execution with `Promise.all` inside Async Functions

**Problem:** Await two promises concurrently `const [a, b] = await Promise.all([p1, p2])`.

**Expected output:**
```text
Results: 10, 20
```

> [!check]- Answer
> ```javascript
> async function fetchBoth() {
>   const p1 = Promise.resolve(10);
>   const p2 = Promise.resolve(20);
>   const [a, b] = await Promise.all([p1, p2]);
>   console.log(`Results: ${a}, ${b}`);
> }
> fetchBoth();
> ```
>
> **Explanation:** Combining `await` with `Promise.all` executes independent promises concurrently.

---

## 7. Related Terms
- [Promise](./promise.md) — What `async/await` is secretly working with under the hood.
- [`.then()` / `.catch()`](./then_catch.md) — The older syntax that `async/await` replaces.

---

## 8. Key Takeaways
- `async/await` allows you to write asynchronous code that reads like synchronous code.
- To use `await`, you must mark the parent function with the `async` keyword.
- `await` pauses the function execution until the Promise resolves, then unwraps the data.
- Under the hood, an `async` function always automatically returns a Promise!
- Use standard `try { ... } catch (error) { ... }` blocks to handle errors.
