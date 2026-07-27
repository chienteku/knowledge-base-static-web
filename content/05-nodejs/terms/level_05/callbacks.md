# Callbacks & Callback Hell

> **Level 5 — Asynchronous Patterns**
> A function passed as an argument to another function, intended to be executed later once an asynchronous task completes. When chained deeply, it creates unreadable "Callback Hell."

---

## 1. Prerequisites
- [Non-Blocking I/O](../level_01/non_blocking_io.md) — Callbacks are the original mechanism Node.js used to handle Non-Blocking I/O.
- [The Event Loop](../level_01/event_loop.md) — The loop pushes callbacks back onto the main thread.

---

## 2. Term Category
- **JavaScript / Node.js Design Pattern**

---

## 3. Environment Context
- **Universal** (Heavily utilized in early Node.js).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Because Node.js does not wait for a file to read (Non-Blocking), how does your code know when the file is actually ready?
You provide a **Callback Function**. You say to Node.js: *"Go read this file in the background. I am moving on to the next line of code. When you finish reading it, run this specific function I'm giving you."*

### (2) The "Error-First" Callback Pattern
In Node.js, asynchronous operations can fail (e.g., the file doesn't exist). By standard convention, the very first argument of a Node.js callback is *always* the `error` object. If it succeeds, `error` is null, and the second argument contains the `data`.
```javascript
const fs = require('fs');

fs.readFile('data.txt', 'utf8', (err, data) => {
  if (err) {
    console.error("Failed to read file:", err);
    return; // Stop execution
  }
  console.log("File content:", data);
});
```

### (3) Callback Hell (The Pyramid of Doom)
Callbacks work great for one task. But what if you need to:
1. Read a file to get a user ID.
2. Query the database for that user.
3. Update the user's profile.
4. Send an email to the user.
Because each task is asynchronous, you have to nest the callbacks inside of each other. The code drifts further and further to the right, forming a triangle shape known as **Callback Hell**.
```javascript
fs.readFile('user.json', (err, user) => {
  db.query(user.id, (err, profile) => {
    profile.update('status', (err, updated) => {
      email.send(updated.email, (err, success) => {
        console.log("Finally done.");
      });
    });
  });
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to `return` after handling an error

**The mistake:** A developer writes `if (err) { console.error(err); } console.log(data);` inside a callback.

**Why it's wrong:** If an error occurs, the code logs the error but *keeps running the rest of the function*. It will try to `console.log(data)`, but `data` will be undefined, instantly crashing your server. 
**Golden Rule:** Always add a `return` statement inside the `if (err)` block to stop the callback function from executing the success logic.

---



### Mistake 2: Failing to Follow Node.js Error-First Callback Conventions `(err, data) => {}`

**The mistake:** Writing a custom async function calling `callback(data)` with data in the 1st parameter slot.

**Why it's wrong:** Node.js standard convention requires the 1st argument of callbacks to be reserved for error objects (`null` if no error). Reversing argument order breaks utility tools like `util.promisify`.

*Incorrect:*
```javascript
function fetchData(cb) {
  cb({ user: 'Alice' }); // ❌ Data passed in error position!
}
```

*Fix:*
```javascript
function fetchData(cb) {
  cb(null, { user: 'Alice' }); // 1st arg null (no error), 2nd arg data
}
```

### Mistake 3: Calling Callbacks Multiple Times inside a Single Function Execution (Callback Hell)

**The mistake:** Omitting `return` when calling a callback on an error condition.

**Why it's wrong:** Without `return`, execution continues past the error check, invoking the callback a 2nd time with result data and causing dual-response bugs.

*Incorrect:*
```javascript
fs.readFile('file.txt', (err, data) => {
  if (err) cb(err); // ❌ Missing return! Keeps running below!
  cb(null, data);
});
```

*Fix:*
```javascript
fs.readFile('file.txt', (err, data) => {
  if (err) return cb(err); // Explicit return on error
  cb(null, data);
});
```

## 6. Practice Exercises

### Exercise 1: Spot the Pattern

**Problem:** You are creating your own asynchronous function that fetches data from a fake API. According to the "Error-First" Node.js convention, how should you call the `callback` function if the API fails?

```javascript
function fetchUser(callback) {
  const success = false;
  if (!success) {
    // How do you trigger the callback here?
  }
}
```

**Expected output:**
```javascript
callback(new Error("API Failed"), null);
```
*Explanation: The first argument must be the error object. The second argument (the data) is null because it failed.*

> [!check]- Answer
> - Remember the "Error-First" rule! What is argument 1? What is argument 2?

---



### Exercise 2: Refactoring Callback Pyramid of Doom to Promises

**Problem:** Refactor nested callback `step1((err, a) => { step2(a, (err, b) => { step3(b, cb); }); });` to `async/await`.

**Expected output:**
```text
const a = await step1(); const b = await step2(a); const result = await step3(b);
```

> [!check]- Answer
> ```javascript
> const a = await step1();
> const b = await step2(a);
> const result = await step3(b);
> ```
>
> **Explanation:** `async/await` flattens nested callback pyramids into clean sequential code.

### Exercise 3: Error-First Callback Check

**Problem:** Write error check guard for callback `(err, result) => {}`.

**Expected output:**
```text
if (err) { console.error(err); return; }
```

> [!check]- Answer
> ```javascript
> if (err) {
>   console.error('Operation failed:', err);
>   return;
> }
> ```
>
> **Explanation:** Checking `if (err)` first enforces Node.js error-first safety checks.

## 7. Related Terms
- [Promises](../../../04-apis/terms/level_05/promises.md) — The modern solution that completely eliminated Callback Hell.
- [Promisification](../level_05/promisification.md) — How you convert old callback code into modern Promise code.

---

## 8. Key Takeaways
- **Callbacks** are functions executed after an asynchronous task completes.
- Node.js established the **Error-First** convention (`err, data`).
- Nested callbacks create **Callback Hell**, making code impossible to read and maintain.
- Always `return` early if the `err` object exists.
