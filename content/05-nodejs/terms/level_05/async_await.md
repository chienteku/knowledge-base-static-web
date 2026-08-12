# async / await in Node

> **Level 5 — Asynchronous Patterns**
> The modern syntax syntax for asynchronous control flow.

---

## 1. Prerequisites
- [Callbacks & Callback Hell](callbacks.md) — The original nesting problem.
- [Promisification (util.promisify)](promisification.md) — The bridge converting callbacks into Promise handles.

---

## 2. Term Category

**Async Pattern (Node.js / V8 Engine .)**: async / await in Node is a fundamental concept in this technology stack. **Level 5 — Asynchronous Patterns**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Promises solved the nesting issues of callback hell. However, writing long chains of `.then()` and `.catch()` blocks can still become verbose and difficult to follow, especially when dealing with conditional logic or error handling across multiple steps.

To write asynchronous JavaScript that reads like standard, linear synchronous code, developers use **`async` / `await`**:
-   **`async` Functions:** Declaring a function with the `async` keyword forces it to return a Promise. Any value returned by the function is automatically wrapped in a resolved Promise.
-   **`await` Keyword:** Pauses the execution of the enclosing `async` function until the targeted Promise resolves or rejects, returning the resolved value directly.
-   **Non-blocking Under the Hood:** When V8 encounters the `await` keyword, it **does not block** Node's main server thread. Instead, V8 pauses the execution of *this specific function*, packages the remaining lines of the function as a microtask callback, and immediately returns control to the Event Loop to process other users' requests.

---

### (2) Code Evolution: Callbacks vs. Promises vs. Async/Await

Here is how a file-to-database pipe has evolved:

#### 1. Callback Hell Approach
```javascript
fs.readFile('config.json', 'utf8', (err, configStr) => {
  if (err) return handleErr(err);
  const config = JSON.parse(configStr);
  
  db.query('SELECT * FROM users WHERE id = ?', [config.userId], (err, user) => {
    if (err) return handleErr(err);
    console.log("Found User:", user);
  });
});
```

#### 2. Promise Chain `.then()` Approach
```javascript
fs.promises.readFile('config.json', 'utf8')
  .then(configStr => JSON.parse(configStr))
  .then(config => db.query('SELECT * FROM users WHERE id = ?', [config.userId]))
  .then(user => console.log("Found User:", user))
  .catch(err => handleErr(err));
```

#### 3. Modern Async/Await Approach
```javascript
async function getUserConfig() {
  try {
    const configStr = await fs.promises.readFile('config.json', 'utf8');
    const config = JSON.parse(configStr);
    const user = await db.query('SELECT * FROM users WHERE id = ?', [config.userId]);
    console.log("Found User:", user);
  } catch (err) {
    handleErr(err);
  }
}
```

---

### (3) Reality Metaphor
Imagine ordering food at a busy gourmet food court.
- **Callbacks** are like standing in a physical line. You order and must stand at the counter waiting for your food. You cannot leave or do other things.
- **Promises** are like being handed a flashing pager. You can sit down, but you must register an instruction sheet: *"When pager flashes, stand up, walk to counter 2, pick up soup, then go to table."*
- **Async/Await** is like placing a digital order from your table. You write:
  `const soup = await counter.getSoup();`
  V8 handles the paging mechanics in the background. It pauses your table's active state, lets other customers order, and automatically wakes you up to eat the moment the soup is ready.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `await` keyword

**The mistake:** Assigning a Promise-returning function call directly to a variable without the `await` keyword.

```javascript
// WRONG: user is a Promise object, not the resolved data!
const user = db.query('SELECT * FROM users WHERE id = 1');
console.log(user.username); // Undefined! (Since user is Promise { <pending> })
```

**Why it's wrong:** Calling an asynchronous function returns a pending Promise object instantly. Without `await`, your code continues executing synchronously before the network operation completes.

### Mistake 2: Running independent async calls sequentially in a loop

**The mistake:** Awaiting each query inside a `for` loop, causing queries to run one after another:
```javascript
// BAD: Takes 5 seconds if each query takes 1 second!
const userIds = [1, 2, 3, 4, 5];
for (const id of userIds) {
  const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
}
```

*Fix:* Fire all queries in parallel and await their combined resolution using `Promise.all`:
```javascript
// GOOD: Fires all queries in parallel; resolves in 1 second!
const userIds = [1, 2, 3, 4, 5];
const promises = userIds.map(id => db.query('SELECT * FROM users WHERE id = ?', [id]));
const users = await Promise.all(promises);
```

---



### Mistake 3: Executing Sequential `await` Statements for Independent Async Operations (Async Waterfall Trap)

**The mistake:** Writing `const user = await fetchUser(); const posts = await fetchPosts();` when `fetchPosts` does not depend on `user`.

**Why it's wrong:** Awaiting independent promises sequentially forces them to execute serially, doubling overall response latency. Use `Promise.all([fetchUser(), fetchPosts()])` for parallel execution.

*Incorrect:*
```javascript
const user = await fetchUser(); // ❌ Takes 200ms
const posts = await fetchPosts(); // ❌ Takes 200ms (Total: 400ms!)
```

*Fix:*
```javascript
const [user, posts] = await Promise.all([
  fetchUser(),
  fetchPosts()
]); // Total: 200ms parallel!
```

### Mistake 4: Forgetting `await` on Async Functions Returning Promises Inside Try/Catch Blocks

**The mistake:** Writing `try { return fetchUser(); } catch(err) { ... }` without `await`.

**Why it's wrong:** Without `await`, the function immediately returns an unfulfilled Promise. If the Promise rejects later asynchronously, the local `try/catch` block fails to catch it.

*Incorrect:*
```javascript
async function getUser() {
  try {
    return fetchUser(); // ❌ Catch block bypassed on async rejection!
  } catch (err) {
    return fallback;
  }
}
```

*Fix:*
```javascript
async function getUser() {
  try {
    return await fetchUser(); // await forces resolution inside try block
  } catch (err) {
    return fallback;
  }
}
```

## 5. Practice Exercises

### Exercise 1: Sequential vs Parallel Async/Await Execution Pipeline

**Scenario:** An API aggregator compares performance between sequential `await` calls and concurrent `Promise.all()` fetching when retrieving user profile, order history, and preferences.

**Requirements:**
1. Write fetchUserDataSequential(userId, mockFetchers).
2. Write fetchUserDataParallel(userId, mockFetchers).
3. Verify parallel execution completes significantly faster.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function fetchUserDataSequential(userId, mockFetchers) {
>   const start = Date.now();
>   const profile = await mockFetchers.getProfile(userId);
>   const orders = await mockFetchers.getOrders(userId);
>   const prefs = await mockFetchers.getPreferences(userId);
>
>   return {
>     data: { profile, orders, prefs },
>     durationMs: Date.now() - start
>   };
> }
>
> async function fetchUserDataParallel(userId, mockFetchers) {
>   const start = Date.now();
>   const [profile, orders, prefs] = await Promise.all([
>     mockFetchers.getProfile(userId),
>     mockFetchers.getOrders(userId),
>     mockFetchers.getPreferences(userId)
>   ]);
>
>   return {
>     data: { profile, orders, prefs },
>     durationMs: Date.now() - start
>   };
> }
>
> // Verification tests
> const delay = (ms, val) => new Promise(r => setTimeout(() => r(val), ms));
> const mockFetchers = {
>   getProfile: (id) => delay(20, { id, name: "Alice" }),
>   getOrders: (id) => delay(20, [{ id: 101 }]),
>   getPreferences: (id) => delay(20, { theme: "dark" })
> };
>
> Promise.all([
>   fetchUserDataSequential("u1", mockFetchers),
>   fetchUserDataParallel("u1", mockFetchers)
> ]).then(([seq, par]) => {
>   console.assert(seq.durationMs >= 50, "Test 1 Failed: Sequential takes sum of delays (~60ms)");
>   console.assert(par.durationMs < 40, "Test 2 Failed: Parallel takes max of delays (~20ms)");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Sequential Await Waterfall**: Awaiting independent async calls sequentially creates unnecessary network waterfalls.
> 2. **Promise.all Parallelism**: Promise.all initiates async operations concurrently, resolving when all promises complete.
> 3. **Performance Optimization**: Always use `Promise.all()` for independent asynchronous network/disk tasks.
> 
---

### Exercise 2: Top-Level Async/Await Wrapper with Exponential Backoff Retry

**Scenario:** A resilient database connection initializer wraps async operations in a retry loop with exponential backoff on transient errors.

**Requirements:**
1. Write executeWithAsyncRetry(asyncTaskFn, maxAttempts, mockSleep).
2. Execute async task.
3. Catch errors and retry with exponential delay up to maxAttempts.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function executeWithAsyncRetry(asyncTaskFn, maxAttempts = 3, mockSleep) {
>   const sleep = mockSleep || ((ms) => new Promise(r => setTimeout(r, ms)));
>
>   let attempt = 0;
>   while (attempt < maxAttempts) {
>     try {
>       return await asyncTaskFn(attempt);
>     } catch (err) {
>       attempt++;
>       if (attempt >= maxAttempts) {
>         throw err;
>       }
>       const backoffMs = Math.pow(2, attempt) * 10;
>       await sleep(backoffMs);
>     }
>   }
> }
>
> // Verification tests
> let attemptsRan = 0;
> const mockSleep = async () => {};
> const flakyTask = async (attempt) => {
>   attemptsRan++;
>   if (attemptsRan < 3) throw new Error("Connection failed");
>   return "CONNECTED";
> };
>
> executeWithAsyncRetry(flakyTask, 3, mockSleep).then(res => {
>   console.assert(res === "CONNECTED", "Test 1 Failed");
>   console.assert(attemptsRan === 3, "Test 2 Failed: Retried 3 times");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Async/Await Error Handling**: Use standard `try...catch` blocks to catch rejected Promises in async functions.
> 2. **Exponential Backoff**: Increases delay between retries (`2^attempt * baseMs`) to avoid hammering failing backend services.
> 3. **Clean Asynchronous Control Flow**: Async/await syntax converts complex promise chaining into readable synchronous-looking code.
> 
---

### Exercise 3: Async Generator Stream Data Aggregator

**Scenario:** A file parser processes large data streams using ES2018 Async Generators (`for await...of`).

**Requirements:**
1. Write processAsyncStream(asyncIterable).
2. Iterate items using `for await...of`.
3. Sum numeric values.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function processAsyncStream(asyncIterable) {
>   let totalSum = 0;
>   let itemCount = 0;
>
>   for await (const chunk of asyncIterable) {
>     totalSum += Number(chunk);
>     itemCount++;
>   }
>
>   return {
>     totalSum,
>     itemCount,
>     average: itemCount > 0 ? totalSum / itemCount : 0
>   };
> }
>
> // Verification tests
> async function* generateData() {
>   yield 10;
>   yield 20;
>   yield 30;
> }
>
> processAsyncStream(generateData()).then(res => {
>   console.assert(res.totalSum === 60, "Test 1 Failed: Sum must be 60");
>   console.assert(res.average === 20, "Test 2 Failed: Average must be 20");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Async Generators (`async function*`)**: Functions yielding Promises or async values on demand.
> 2. **`for await...of` Loop**: Iterates over async iterables (ReadableStreams, Async Generators) sequentially yielding values as they arrive.
> 3. **Memory Efficient Streaming**: Processes data chunks as they stream without buffering complete datasets in memory.
## 6. Related Terms
- [Unhandled Promise Rejections](unhandled_rejections.md) — The errors triggered if you fail to handle async await exceptions.
- [Async Error Handling (try/catch + .catch)](async_error_handling.md) — The mechanisms used to capture errors during await.
- [Promisification (util.promisify)](promisification.md) — Promisifying callbacks.

---

## 7. Key Takeaways
- `async` / `await` provides clean, linear syntax for asynchronous JavaScript.
- Functions marked with `async` always return a Promise.
- `await` pauses the enclosing function until a Promise resolves, returning the result directly.
- The `await` keyword does not block Node's main thread; it schedules the remainder of the function as a microtask.
- Forgetting `await` returns a pending Promise object, causing undefined behaviors.
- Avoid sequential await in loops for independent operations; use `Promise.all` for parallel execution.
