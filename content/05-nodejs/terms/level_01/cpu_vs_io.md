# CPU-bound vs I/O-bound

> **Level 1 — Introduction & Architecture**
> Why Node shines at I/O but chokes on heavy computation.

---

## 1. Prerequisites
- [Single-Threaded Architecture](single_threaded.md) — The single-threaded context affected by processing bottlenecks.
- [The Event Loop & Libuv](event_loop.md) — The loop managing task scheduling.

---

## 2. Term Category

**Node.js Core Architecture (Node.js Core Architecture .)**: CPU-bound vs I/O-bound is a fundamental concept in this technology stack. **Level 1 — Introduction & Architecture**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Every server application performs two primary activities: computing data or transferring data. Understanding the difference between **CPU-bound** and **I/O-bound** operations is key to understanding when to use Node.js and when to choose another language:

#### 1. I/O-bound (Input/Output Bound)
- **Definition:** Operations where execution speed is limited by waiting for external hardware or networks to transfer data.
- **Examples:** Reading a file from disk, querying a database, calling a third-party API, or waiting for a user input.
- **CPU Behavior:** During I/O, the CPU does almost no work; it sits idle waiting for the hard drive or network card to respond.
- **Node's Strength:** Because Node.js utilizes non-blocking I/O, it excels at these tasks. Instead of keeping a thread idle, Node registers a callback and immediately handles other requests.

#### 2. CPU-bound
- **Definition:** Operations where execution speed is limited by the speed of the CPU executing arithmetic instructions.
- **Examples:** Resizing a high-resolution image, video encoding, password hashing, file compression (Gzip), or running machine learning algorithms.
- **CPU Behavior:** The processor runs at 100% capacity executing instructions as fast as possible.
- **Node's Weakness:** Because Node.js has only one thread, a CPU-bound task occupies the thread completely. The Event Loop freezes, preventing the server from processing other incoming network requests.

---

### (2) Reality Metaphor
Imagine a retail store.
- **I/O-Bound** is like a **Cashier**. Their work consists of scanning an item, sliding it across the counter, and waiting for the credit card terminal to authorize (**network latency**). The cashier is not performing strenuous labor; they spend most of their time waiting. If they work asynchronously (serving customer B while customer A's payment processes), one cashier can manage a huge line.
- **CPU-Bound** is like a **Tailor** sewing a custom suit. The tailor must focus 100% of their physical attention on cutting and sewing. They cannot sew 10 suits in parallel. If a new client walks in, they must stand at the door waiting until the suit is completely finished.

---

### (3) Implementation Comparison

An Express backend demonstrating how I/O-bound endpoints scale while CPU-bound endpoints block:

```javascript
const express = require('express');
const app = express();

// 1. I/O-Bound Endpoint: Querying a Database
app.get('/user/:id', async (req, res) => {
  // The CPU sits idle while the database searches.
  // Node's single thread is free to handle other requests during this wait!
  const user = await database.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(user);
});

// 2. CPU-Bound Endpoint: Calculating Fibonacci Numbers
app.get('/fibonacci/:num', (req, res) => {
  const num = parseInt(req.params.num);
  
  // WARNING: Heavy recursive calculation blocks the thread!
  const calculateFib = (n) => {
    if (n < 2) return n;
    return calculateFib(n - 1) + calculateFib(n - 2);
  };
  
  const result = calculateFib(num); // If num is 45, the server freezes for seconds!
  res.json({ result });
});

app.listen(3000);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Node.js as a primary engine for data science or machine learning

**The mistake:** A development team builds a machine learning pipeline (tensor calculations, data model training) directly inside Node.js, thinking it will scale because of Node's popularity.

**Why it's wrong:** Machine learning requires massive CPU floating-point calculations. Building this inside Node's single-threaded environment will freeze the API gateway.

*Fix:* Build data science applications in languages designed for CPU parallelism (like Python or C++). Use Node.js strictly as a lightweight API gateway that communicates with Python microservices asynchronously.

---



### Mistake 2: Using Node.js Default Event Loop Threads for High-Compute Cryptographic / Image Tasks

**The mistake:** Performing CPU-heavy image resizing (e.g. Sharp without async workers) or heavy matrix multiplication directly in web request handlers.

**Why it's wrong:** Node.js non-blocking architecture excels at I/O-bound tasks (database, network, file streaming), but CPU-bound tasks block the single main thread.

*Incorrect:*
```javascript
app.post('/encrypt', (req, res) => {
  const hash = syncHeavyPBKDF2(req.body.password); // ❌ Blocks event loop CPU!
  res.send(hash);
});
```

*Fix:*
```javascript
app.post('/encrypt', (req, res) => {
  crypto.pbkdf2(req.body.password, salt, 100000, 64, 'sha512', (err, key) => {
    res.send(key.toString('hex')); // Async libuv offloading
  });
});
```

### Mistake 3: Assuming Database Queries Are CPU-Bound Operations

**The mistake:** Thinking database queries require Worker Threads because they handle large amounts of data.

**Why it's wrong:** Database queries are I/O-bound. Node.js waits for network sockets / database drivers asynchronously without consuming main thread CPU computation time.

*Incorrect:*
```javascript
// Spawning a new Worker Thread just to run a standard SQL query
```

*Fix:*
```javascript
// Run SQL queries directly using standard async database drivers
const users = await db.query('SELECT * FROM users');
```

## 5. Practice Exercises

### Exercise 1: CPU-Bound vs I/O-Bound Task Classifier & Dispatcher

**Scenario:** An API worker pipeline classifies tasks as either I/O-bound (database/network) or CPU-bound (hashing/crypto) to apply correct execution strategies.

**Requirements:**
1. Write classifyTask(taskType).
2. Route I/O tasks to async non-blocking execution.
3. Route CPU tasks to worker threads or offloaded executors.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function classifyTask(taskType) {
>   const ioTasks = new Set(["HTTP_FETCH", "FILE_READ", "DB_QUERY", "REDIS_GET"]);
>   const cpuTasks = new Set(["PASSWORD_HASH", "IMAGE_RESIZE", "JSON_COMPRESS", "MATRIX_MULTIPLICATION"]);
>
>   if (ioTasks.has(taskType)) {
>     return { type: "IO_BOUND", executionStrategy: "ASYNC_NON_BLOCKING" };
>   }
>   if (cpuTasks.has(taskType)) {
>     return { type: "CPU_BOUND", executionStrategy: "WORKER_THREAD" };
>   }
>   return { type: "UNKNOWN", executionStrategy: "DEFAULT" };
> }
>
> // Verification tests
> console.assert(classifyTask("HTTP_FETCH").executionStrategy === "ASYNC_NON_BLOCKING", "Test 1 Failed");
> console.assert(classifyTask("PASSWORD_HASH").executionStrategy === "WORKER_THREAD", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **I/O-Bound Operations**: Tasks spent waiting for external responses (disks, network, databases); Node.js handles millions concurrently via non-blocking I/O.
> 2. **CPU-Bound Operations**: Tasks requiring continuous CPU processing (crypto, compression, image parsing); blocks the event loop unless offloaded.
> 3. **Architecture Strategy**: I/O tasks use async/await; CPU tasks use Worker Threads or external microservices.
> 
---

### Exercise 2: Offloading Heavy CPU Encryption Computation

**Scenario:** A user authentication module offloads heavy bcrypt password hashing to worker pools or asynchronous crypto methods (`crypto.pbkdf2`) to avoid blocking thread.

**Requirements:**
1. Write hashPasswordAsync(password, salt, iterations, keylen, mockCrypto).
2. Execute asynchronous PBKDF2 hashing.
3. Return hashed hex string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function hashPasswordAsync(password, salt, iterations = 1000, keylen = 32, mockCrypto) {
>   const cryptoLib = mockCrypto || require("crypto");
>
>   return new Promise((resolve, reject) => {
>     cryptoLib.pbkdf2(password, salt, iterations, keylen, "sha256", (err, derivedKey) => {
>       if (err) return reject(err);
>       resolve(derivedKey.toString("hex"));
>     });
>   });
> }
>
> // Verification tests
> const mockCrypto = {
>   pbkdf2: (pass, salt, iter, len, algo, cb) => {
>     setTimeout(() => cb(null, Buffer.from("mock_hashed_bytes")), 10);
>   }
> };
>
> hashPasswordAsync("secret123", "salt123", 1000, 32, mockCrypto).then(hash => {
>   console.assert(typeof hash === "string" && hash.length > 0, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Asynchronous Crypto Methods**: Node.js `crypto` async methods (pbkdf2, randomBytes) offload work to libuv thread pool.
> 2. **Blocking Synchronous Counterparts**: Synchronous methods (`pbkdf2Sync`) block the event loop for 100ms+, freezing server throughput.
> 3. **Thread Pool Offloading**: CPU-heavy C++ bindings execute in background libuv worker threads.
> 
---

### Exercise 3: High-Concurrency I/O Stream Throughput Evaluator

**Scenario:** An API gateway benchmark simulates handling 1,000 concurrent I/O network streams without thread allocation overhead.

**Requirements:**
1. Write simulateConcurrentIoTasks(taskCount, mockIoFn).
2. Execute concurrent I/O tasks with Promise.all.
3. Verify all tasks resolve without blocking.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function simulateConcurrentIoTasks(taskCount = 1000, mockIoFn) {
>   const tasks = [];
>   const start = Date.now();
>
>   for (let i = 0; i < taskCount; i++) {
>     tasks.push(mockIoFn(i));
>   }
>
>   const results = await Promise.all(tasks);
>   const durationMs = Date.now() - start;
>
>   return {
>     totalTasks: results.length,
>     durationMs,
>     throughputPerSec: Math.round((taskCount / (durationMs || 1)) * 1000)
>   };
> }
>
> // Verification tests
> const mockIo = (id) => new Promise(r => setTimeout(() => r(id), 20));
>
> simulateConcurrentIoTasks(100, mockIo).then(res => {
>   console.assert(res.totalTasks === 100, "Test 1 Failed");
>   console.assert(res.durationMs < 100, "Test 2 Failed: All 100 I/O tasks executed concurrently in ~20ms");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Concurrently Serving I/O**: Node.js handles thousands of concurrent I/O requests with minimal RAM overhead because OS sockets use event notifications.
> 2. **No Thread-per-Request Overhead**: Multi-threaded servers (Java, PHP) allocate 1MB RAM per thread; Node.js uses single Event Loop for all I/O.
> 3. **Non-Blocking Network Sockets**: OS kernel epoll/kqueue notifies Node.js when network data arrives.
## 6. Related Terms
- [Blocking the Event Loop](blocking_event_loop.md) — The consequence of running CPU-bound code on the main thread.
- [Single-Threaded Architecture](single_threaded.md) — The core design constraint behind Node's CPU limits.
- [Non-Blocking I/O](non_blocking_io.md) — Related concept: Non-Blocking I/O.

---

## 7. Key Takeaways
- I/O-bound tasks are bottlenecked by data transfers (disk, network, databases).
- CPU-bound tasks are bottlenecked by mathematical calculations.
- Node.js is highly optimized for high-concurrency I/O-bound operations.
- CPU-bound operations block Node's single thread, freezing the Event Loop.
- Offload CPU-bound calculations from Node to separate microservices or worker threads.
