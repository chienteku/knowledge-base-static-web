# for await...of / Async Iterators

> **Level 6 — Asynchronous JavaScript**
> Iterate over asynchronously produced values.

---

## 1. Prerequisites
- [async / await](async_await.md) — Asynchronous execution syntax.
- [for...of](../level_04/for_of.md) — Synchronous iterable loop statement.
- [Iterators & Iterables (protocol)](../level_08/iterators_iterables.md) — Interface protocols for sequential data retrieval.
- [Generator (function*)](../level_09/generator.md) — Functions that can pause and yield multiple values.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
A standard `for...of` loop is designed to iterate over synchronous collections that already exist in memory, such as an Array, a Set, or a Map. However, real-world data is often generated asynchronously over time—such as binary chunks streaming from a large file download, data packets arriving over a web socket, or lines read sequentially from a command terminal.

To support loops over asynchronous data streams, ES2018 introduced **Async Iterators** and the **`for await...of`** loop statement:
- In a standard iterator, the `.next()` method returns an object containing `{ value, done }`.
- In an **Async Iterator**, the `.next()` method returns a **Promise** that resolves to `{ value, done }`.
- The `for await...of` loop automatically awaits the Promise returned at each step. It pauses loop execution until the next data packet resolves, processes the loop body with the value, and then waits for the next packet.

This allows developers to write clean, synchronous-looking loops over streaming asynchronous resources.

### (2) Reality Metaphor
Imagine waiting for luggage at an airport.
- A **synchronous `for...of` loop** is like walking into the baggage room where all bags have already been unloaded and lined up in a row on the floor. You walk down the row, inspecting each bag one after another without waiting.
- A **`for await...of` loop** is like standing at the edge of the moving baggage carousel. The bags arrive asynchronously over time. You stand in one spot and wait (await) for the first bag to travel down the belt. When it arrives, you inspect it. Then, you wait (await) for the next bag to slide down the conveyor belt. The loop only finishes when the carousel stops moving and the screen displays "All bags unloaded" (`done: true`).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Consuming an async iterable stream inside an async function
async function processStream(asyncIterable) {
  for await (const chunk of asyncIterable) {
    console.log("Received chunk:", chunk);
  }
}
```

#### Fuller Example
```javascript
// Creating and consuming an Async Generator yielding values over time
// The asterisk (*) marks a generator, and 'async' makes it yield Promises
async function* generateUserEvents() {
  const events = ["Click Login", "Hover Menu", "Click Logout"];

  for (const event of events) {
    // Simulate network delay between events
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Yield the event name wrapped in a Promise under the hood
    yield event; 
  }
}

async function runMonitor() {
  console.log("Starting event monitor stream...");
  
  try {
    // for await...of automatically awaits the promise returned by each yield
    for await (const event of generateUserEvents()) {
      console.log(`[MONITOR ALERT] User Action: ${event}`);
    }
    console.log("Monitor stream completed.");
  } catch (error) {
    console.error("Stream disrupted:", error.message);
  }
}

runMonitor();
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `for await...of` outside of an `async` function

**The mistake:** Writing a `for await...of` loop in a standard synchronous function or in the global scope of a script.

**Why it's wrong:** Under the hood, `for await...of` performs an implicit `await` statement at every step of the loop. Just like the standard `await` keyword, `for await...of` can only be executed inside an `async` function (or inside a modern ES module that supports top-level await). If placed inside a synchronous function, the browser will throw a SyntaxError.

*Incorrect:*
```javascript
function readChunks(stream) {
  // SyntaxError: for await...of is only allowed within async functions
  for await (const chunk of stream) { 
    console.log(chunk);
  }
}
```

*Fix:*
```javascript
// Add the async keyword to the function wrapper
async function readChunks(stream) { 
  for await (const chunk of stream) {
    console.log(chunk);
  }
}
```

---

### Mistake 2: Losing Context Binding (`this`) in For Await Of Callbacks

**The mistake:** Passing methods from For Await Of instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "for_await_of",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "for_await_of",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in For Await Of Operations

**The mistake:** Executing asynchronous operations within For Await Of without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/for_await_of"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/for_await_of");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in for_await_of: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Async Stream Loop

**Problem:** Complete the async function `sumStream` to loop over the `numberStream` async generator using `for await...of` and calculate the total sum of the yielded numbers.

```javascript
async function* numberStream() {
  yield 10;
  await new Promise(res => setTimeout(res, 50));
  yield 20;
  await new Promise(res => setTimeout(res, 50));
  yield 30;
}

async function sumStream() {
  let total = 0;
  
  // Iterate numberStream() and sum values
  
  console.log("Total:", total);
}

sumStream();
```

**Expected output:**
> [!check]- Answer
> ```text
> Total: 60
> ```
> - Write `for await (const num of numberStream())`.
> - Inside the loop, increment total: `total += num;`.

---

### Exercise 2: Iterating Async Generators with `for await...of`

**Problem:** Create an async generator `async function* gen()` yielding `1` and `2`, and iterate with `for await...of`.

**Expected output:**
> [!check]- Answer
> ```text
> 1
> 2
> ```
> ```javascript
> async function* gen() {
>   yield 1;
>   yield 2;
> }
> async function run() {
>   for await (const val of gen()) {
>     console.log(val);
>   }
> }
> run();
> ```
>
> **Explanation:** `for await...of` awaits promised values yielded by async generator streams.

---

### Exercise 3: Iterating Arrays of Promises with `for await...of`

**Problem:** Iterate an array of resolved promises `[Promise.resolve(10), Promise.resolve(20)]` using `for await...of`.

**Expected output:**
> [!check]- Answer
> ```text
> 10
> 20
> ```
> ```javascript
> async function processPromises() {
>   const promises = [Promise.resolve(10), Promise.resolve(20)];
>   for await (const val of promises) {
>     console.log(val);
>   }
> }
> processPromises();
> ```
>
> **Explanation:** `for await...of` automatically awaits items when iterating collections containing promises.


---

## 7. Related Terms
- [for...of](../level_04/for_of.md) — The synchronous loop statement.
- [Generator (function*)](../level_09/generator.md) — The function design used to construct iterators.

---

## 8. Key Takeaways
- `for await...of` loops over asynchronous streams, resolving Promises returned at each step.
- Async Iterators return a Promise resolving to `{ value, done }` instead of a plain object.
- Use `async function*` (async generators) to create custom async streams.
- The `for await...of` loop must be wrapped inside an `async` function, as it halts execution waiting for each step to settle.
