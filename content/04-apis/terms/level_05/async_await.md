# async / await

> **Level 5 — Fetching Data (Client-Side)**
> Syntactic sugar that allows developers to write asynchronous Promise-based code so it *looks* and reads like normal, synchronous code.

---

## 1. Prerequisites
- [Promises (in the context of networks)](promises.md) — `async/await` is just a prettier way of writing `.then()`.
- [The fetch() API](fetch.md) — The primary reason we need `async/await`.

---

## 2. Term Category

**JavaScript Core Concept / Syntax (Universal JavaScript .)**: async / await is a fundamental concept in this technology stack. **Level 5 — Fetching Data (Client-Side)**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
While Promises and `.then()` solved the problem of freezing the browser, they introduced a new problem: **Callback Hell**. 
If you need to fetch a user, and *then* fetch that user's posts, and *then* fetch the comments on those posts, you end up with deeply nested, hard-to-read `.then()` chains.
In 2017, JavaScript introduced `async` and `await`. It does exactly the same thing as `.then()` under the hood, but it allows you to write your code in a straight, flat, top-to-bottom line. It revolutionized how JavaScript developers write network requests.

### (2) Reality Metaphor
**`.then()` (The old way):** You order a pizza delivery. You write down instructions on a sticky note: "When the pizza arrives, put it on the table." You stick the note to the door and go watch TV. (You are scheduling future actions).
**`await` (The new way):** You order a pizza delivery. You pull up a chair, sit next to the front door, and literally wait. You do nothing else until the pizza arrives, and then you put it on the table yourself. (You are explicitly pausing the execution of your current function).

### (3) The Two Rules
1. You can only use the keyword `await` inside a function that has been labeled with the keyword `async`.
2. `await` forces JavaScript to **pause the execution of that specific function** until the Promise resolves. (It does *not* freeze the whole browser, just the function it's inside).

### (4) Code Examples

#### The Old Way (`.then()`)
```javascript
function getUserData() {
  fetch('https://api.example.com/user')
    .then(response => response.json())
    .then(data => {
      console.log(data);
    });
}
```

#### The New Way (`async/await`)
```javascript
// 1. Label the function as async
async function getUserData() {
  // 2. Tell JS to literally pause and wait for the network!
  const response = await fetch('https://api.example.com/user');
  
  // 3. Wait for the JSON to parse
  const data = await response.json();
  
  console.log(data);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `async` keyword

**The mistake:** A developer writes:
```javascript
function loadData() {
  const res = await fetch('/api'); // ERROR!
}
```

**Why it's wrong:** JavaScript engine strictly forbids the use of `await` inside normal functions. If it allowed it, it might accidentally pause critical background processes. You must explicitly label the function as `async` to tell the engine "I intend for this function to be paused."
**Solution:** Change it to `async function loadData()`.

---

### Mistake 2: Awaiting Sequential Independent API Calls inside Loops (Waterfall Latency Penalty)

**The mistake:** Writing `for (const id of ids) { await fetch(`/api/${id}`); }` for independent requests.

**Why it's wrong:** Awaiting inside a loop forces each request to wait for the previous request to finish, creating sequential network waterfall delays. Use `Promise.all()` to execute in parallel.

*Incorrect:*
```javascript
const results = [];
for (const id of ids) {
  const res = await fetch(`/api/items/${id}`); // ❌ Sequential network waterfall!
  results.push(await res.json());
}
```

*Fix:*
```javascript
const promises = ids.map(id => fetch(`/api/items/${id}`).then(r => r.json()));
const results = await Promise.all(promises); // Parallel execution
```

---

### Mistake 3: Forgetting `try / catch` Blocks Around `async / await` API Requests

**The mistake:** Calling `await fetch()` without wrapping in `try / catch` handling.

**Why it's wrong:** Uncaught rejected promises in async functions cause UnhandledPromiseRejection warnings or crash Node.js process runtimes.

*Incorrect:*
```javascript
async function getData() {
  const res = await fetch('/api/data'); // ❌ Unhandled promise rejection on network failure!
  return res.json();
}
```

*Fix:*
```javascript
async function getData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}
```


---

## 5. Practice Exercises

### Exercise 1: Sequential Async Task Pipeline Runner

**Scenario:** An API data pipeline executes asynchronous processing tasks sequentially, passing intermediate results to the next step.

**Requirements:**
1. Write runAsyncPipeline(initialData, taskFunctions).
2. Execute each async function sequentially with await.
3. Return final processed data.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function runAsyncPipeline(initialData, taskFunctions = []) {
>   let currentResult = initialData;
>
>   for (const task of taskFunctions) {
>     if (typeof task !== "function") {
>       throw new Error("Pipeline task must be a function");
>     }
>     currentResult = await task(currentResult);
>   }
>
>   return currentResult;
> }
>
> // Verification tests
> const step1 = async (val) => val + 10;
> const step2 = async (val) => val * 2;
> const step3 = async (val) => `Result: ${val}`;
>
> runAsyncPipeline(5, [step1, step2, step3]).then(finalVal => {
>   console.assert(finalVal === "Result: 30", "Test 1 Failed: 5 -> +10=15 -> *2=30 -> Result: 30");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Async Function Return**: async functions ALWAYS return a Promise resolving to the returned value.
> 2. **Sequential await in Loops**: Using await inside a for...of loop pauses loop execution until each promise settles.
> 3. **Readable Control Flow**: Eliminates nested promise .then() chains in favor of synchronous-looking code.
> 
---

### Exercise 2: Safe Async Error Wrapper (Go-style tuple return)

**Scenario:** A utility wraps async functions to catch errors gracefully, returning `[data, error]` tuples instead of throwing exceptions.

**Requirements:**
1. Write safeAsync(asyncFn).
2. Execute asyncFn.
3. Return `[data, null]` on success, `[null, error]` on failure.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function safeAsync(asyncFn) {
>   try {
>     const data = await asyncFn();
>     return [data, null];
>   } catch (err) {
>     return [null, err];
>   }
> }
>
> // Verification tests
> const successTask = async () => ({ id: 42 });
> const failTask = async () => { throw new Error("Database offline"); };
>
> safeAsync(successTask).then(([data, err]) => {
>   console.assert(data.id === 42 && err === null, "Test 1 Failed");
> });
>
> safeAsync(failTask).then(([data, err]) => {
>   console.assert(data === null && err.message === "Database offline", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Tuple Error Handling**: Pattern inspired by Go language (val, err) that avoids try...catch block boilerplate.
> 2. **Explicit Error Checks**: Forces calling code to handle error parameter explicitly before consuming data.
> 3. **Uncaught Promise Rejections**: Prevents unhandled promise rejections by capturing errors at boundary.
> 
---

### Exercise 3: Parallel Execution with await Promise.all() vs Sequential await

**Scenario:** An API aggregator compares performance of sequential `await` execution vs parallel `Promise.all()` execution for fetching independent user profiles.

**Requirements:**
1. Write fetchUsersParallel(userIds, fetchFn).
2. Use Promise.all() to run fetch requests concurrently.
3. Return array of resolved profiles.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function fetchUsersParallel(userIds = [], fetchFn) {
>   if (!Array.isArray(userIds) || userIds.length === 0) return [];
>
>   const promiseArray = userIds.map(id => fetchFn(id));
>
>   const profiles = await Promise.all(promiseArray);
>   return profiles;
> }
>
> // Verification tests
> const mockFetch = async (id) => ({ id, name: `User ${id}` });
>
> fetchUsersParallel(["u1", "u2", "u3"], mockFetch).then(results => {
>   console.assert(results.length === 3, "Test 1 Failed");
>   console.assert(results[0].name === "User u1", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Sequential Waterfall Risk**: Awaiting inside a loop sequentially adds latency (RTT * N); parallel Promise.all reduces latency to max(RTT).
> 2. **Concurrency vs Parallelism**: Executes multiple asynchronous HTTP requests concurrently on the event loop.
> 3. **Fail-Fast Behavior**: Promise.all rejects immediately if any single promise rejects.
---

## 6. Related Terms
- [Error Handling (try / catch)](error_handling.md) — Because we no longer use `.catch()`, we need a new way to handle errors with `async/await`.
- [Promises (in the context of networks)](promises.md) — Related concept: Promises (in the context of networks).
- [The fetch() API](fetch.md) — Related concept: The fetch() API.

---

## 7. Key Takeaways
- **`async/await`** is the modern, readable way to handle Promises.
- It allows you to write asynchronous network code in a flat, top-to-bottom style.
- **`await`** literally pauses the execution of the function until the network request finishes.
- You can only use `await` inside an **`async`** function.
