# Promise

> **Level 6 — Asynchronous JavaScript**
> An object representing the eventual completion (or failure) of an asynchronous operation. States: Pending, Fulfilled, Rejected.

---

## 1. Prerequisites
- [Asynchronous](./asynchronous.md) — Operations that take time to complete.
- [Callback Hell](./callback_hell.md) — The problem Promises were invented to solve.

---

## 2. Term Category
- **Language Core** *(Introduced in ES6)*

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript needed a better way to handle asynchronous data without resorting to [Callback Hell](./callback_hell.md). Developers needed a standardized object that could say: "I don't have the data right now because I'm still downloading it, but I *promise* I will give it to you eventually."

A Promise is exactly that: a placeholder object for a future value. Instead of passing callbacks deep into functions, functions now return a Promise object instantly. You can then attach methods to that Promise to handle the data whenever it finally arrives.

### (2) Reality Metaphor
A Promise is exactly like a restaurant pager. 
You place your order and the cashier hands you a plastic pager (the Promise). It doesn't have your food in it, but it represents the *eventual* delivery of your food. 
The pager has three states:
1. **Pending**: It's quiet. Your food is cooking.
2. **Fulfilled (Resolved)**: It buzzes and lights up! Your food is ready.
3. **Rejected**: The cashier comes over and says, "Sorry, we are out of steak." Your order failed.

### (3) JavaScript Code Examples

#### Short Snippet: The 3 States
```javascript
// A Promise is just an Object you can log to the console!
const myPromise = fetch('https://api.example.com/data');

console.log(myPromise); 
// Depending on when you log it, you will see:
// Promise { <state>: "pending" }
// Promise { <state>: "fulfilled", <value>: {...} }
// Promise { <state>: "rejected", <reason>: Error }
```

#### Fuller Example: Creating your own Promise
```javascript
function orderFood(item) {
  // A Promise takes a callback with two parameters: resolve (success) and reject (failure)
  return new Promise((resolve, reject) => {
    console.log(`Cooking ${item}...`);
    
    setTimeout(() => {
      if (item === "Steak") {
        resolve("Here is your perfectly cooked Steak!"); // Success!
      } else {
        reject("Sorry, we only serve Steak today.");    // Failure!
      }
    }, 2000);
  });
}

// We receive the "Pager" instantly
const foodPager = orderFood("Steak");
console.log(foodPager); // Promise { <pending> }
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Promise Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Promise blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "promise";
```

*Fix:*
```javascript
let value = "promise";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Promise Callbacks

**The mistake:** Passing methods from Promise instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "promise",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "promise",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Promise Operations

**The mistake:** Executing asynchronous operations within Promise without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/promise"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/promise");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in promise: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: The Three States

**Problem:** What are the three possible states of a Promise? What do they mean?

**Expected output:**
> [!check]- Answer
> ```text
> 1. Pending: The async operation is still ongoing.
> 2. Fulfilled (or Resolved): The operation completed successfully.
> 3. Rejected: The operation failed (usually throwing an error).
> ```
> - Think about the restaurant pager! Quiet, Buzzing, or Cashier apologizing.

---

### Exercise 2: Creating Resolved and Rejected Promises

**Problem:** Create promises using `Promise.resolve(42)` and `Promise.reject("Error")`.

**Expected output:**
> [!check]- Answer
> ```text
> Resolved: 42
> Rejected: Error
> ```
> ```javascript
> Promise.resolve(42).then(v => console.log(`Resolved: ${v}`));
> Promise.reject("Error").catch(e => console.log(`Rejected: ${e}`));
> ```
>
> **Explanation:** `Promise.resolve()` and `Promise.reject()` return pre-settled promise instances.

---

### Exercise 3: Promise State Transition Permanence

**Problem:** Demonstrate that calling `resolve(1)` then `resolve(2)` inside `new Promise` ignores the second resolution call.

**Expected output:**
> [!check]- Answer
> ```text
> Resolved value: 1
> ```
> ```javascript
> const p = new Promise((resolve) => {
>   resolve(1);
>   resolve(2);
> });
> p.then(v => console.log(`Resolved value: ${v}`));
> ```
>
> **Explanation:** Promises can settle only once; subsequent `resolve` or `reject` calls are ignored.


---

## 7. Related Terms
- [`async` / `await`](./async_await.md) — The modern syntax used to unwrap the data inside a Promise.
- [`.then()` / `.catch()`](./then_catch.md) — The traditional methods used to handle resolved or rejected Promises.

---

## 8. Key Takeaways
- A Promise is an object representing a value that may be available now, or in the future, or never.
- It solves the problem of nested Callback Hell.
- It always exists in one of three states: **Pending**, **Fulfilled**, or **Rejected**.
- Once a Promise is Fulfilled or Rejected, its state is locked forever and cannot change.
