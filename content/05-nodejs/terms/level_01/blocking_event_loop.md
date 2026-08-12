# Blocking the Event Loop

> **Level 1 — Introduction & Architecture**
> Concrete anti-patterns (huge `while`, sync `fs`, `JSON.parse` on giant payloads) that freeze the server.

---

## 1. Prerequisites
- [The Event Loop & Libuv](event_loop.md) — The loop mechanism that must be kept free.
- [CPU-bound vs I/O-bound](cpu_vs_io.md) — The workloads that lead to thread blocking.

---

## 2. Term Category

**Node.js Core Architecture (Node.js Core Architecture .)**: Blocking the Event Loop is a fundamental concept in this technology stack. **Level 1 — Introduction & Architecture**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
"Never block the Event Loop" is the golden rule of Node.js backend development. 

Because Node.js executes all JavaScript code on a single thread, any line of code that takes a long time to compute synchronously blocks the main thread. When the thread is blocked, the Event Loop stops spinning. The consequences are immediate and severe:
- **Server Freezes:** Incoming client HTTP requests queue up at the OS socket level but cannot be accepted by Node.
- **Timeouts:** Active requests hang, and clients experience server timeouts.
- **Deferred Callbacks:** Asynchronous operations (like file reads or database queries) that complete in the background have their callbacks stuck in Libuv's queues, unable to execute.

To maintain a highly responsive server, developers must identify and avoid event-loop blocking anti-patterns.

---

### (2) Event-Loop Blocking Anti-Patterns

#### 1. Synchronous File System Operations
Using synchronous methods (e.g. `fs.readFileSync`) inside a request path forces Node to stop all execution while the hard drive physically searches and reads data:
```javascript
// BAD: Blocks the event loop for EVERY connection
app.get('/data', (req, res) => {
  const data = fs.readFileSync('large-file.json'); // Main thread freezes!
  res.send(data);
});
```

#### 2. CPU-Intensive Loops and Calculations
Running deep loops or sorting massive datasets in memory prevents the loop from turning:
```javascript
// BAD: Freezes the entire server while calculating
for (let i = 0; i < 1e9; i++) { /* CPU math */ }
```

#### 3. Large JSON Parsing
Parsing massive JSON payloads (e.g. a 50MB string from an API response) is a synchronous operation. V8 must block the thread while parsing the string into an object:
```javascript
// BAD: Giant payloads block the thread during parse
const data = JSON.parse(hugeStringPayload); 
```

#### 4. ReDoS (Regular Expression Denial of Service)
Evaluating a complex regular expression with nested quantifiers against a malicious user string can trigger exponential backtracking in the V8 engine, locking up the CPU for minutes.

---

### (3) Reality Metaphor
Imagine a **railway single-track switch operator** standing at a control board.
- **Non-Blocking Operation** is like the operator receiving a signal: *"Train A is arriving."* The operator flips a switch (0.1ms) and immediately turns to listen for the next signal. Trains pass through the junction smoothly.
- **Blocking the Event Loop** is like the operator receiving the signal, but instead of just flipping the switch, they decide to **repaint the entire switch booth by hand (1 hour)**. While they are busy painting, Trains B, C, and D arrive at the junction. Because the operator is occupied and cannot flip the switches, the trains halt, paralyzing the entire railway network.

---

### (4) Code Example: Fixing a Blocking Path

#### The Problem: Synchronous File Reads
```javascript
const express = require('express');
const fs = require('fs');
const app = express();

app.get('/config', (req, res) => {
  // readFileSync halts the main thread during disk search!
  const config = fs.readFileSync('./config.json', 'utf8');
  res.send(config);
});
```

#### The Solution: Asynchronous File Reads
Using `fs.promises` offloads the file search to the Libuv Thread Pool, keeping the main thread free to handle other traffic:
```javascript
const express = require('express');
const fs = require('fs').promises; // Use Promise-based APIs
const app = express();

app.get('/config', async (req, res) => {
  try {
    // Non-blocking: thread pool reads the file, callback resolves later
    const config = await fs.readFile('./config.json', 'utf8');
    res.send(config);
  } catch (err) {
    res.status(500).send("Error reading config");
  }
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming that `.forEach()` or `.map()` arrays run asynchronously

**The mistake:** Believing that because you write a `.forEach()` loop to process a dataset, it runs in the background.

```javascript
// WRONG: This still blocks the event loop!
largeArray.forEach((item) => {
  performMath(item);
});
```

**Why it's wrong:** Array methods like `.forEach`, `.map`, and `.reduce` are standard JavaScript synchronous functions. They do not offload work. If `largeArray` contains 1,000,000 records, the main thread will execute all 1,000,000 operations sequentially, blocking the event loop.

---



### Mistake 2: Executing CPU-Intensive Synchronous Loops on the Main Event Loop Thread

**The mistake:** Running a long synchronous `for` loop (e.g., 10 billion iterations) or heavy regex on the main thread.

**Why it's wrong:** Because Node.js executes application JavaScript on a single thread, blocking the event loop prevents all concurrent HTTP requests, timer callbacks, and I/O handlers from processing, making the server unresponsive.

*Incorrect:*
```javascript
app.get('/compute', (req, res) => {
  for (let i = 0; i < 1e10; i++) {} // ❌ Freezes the entire server!
  res.send('Done');
});
```

*Fix:*
```javascript
app.get('/compute', (req, res) => {
  // Offload CPU-heavy computation to Worker Threads
  const worker = new Worker('./worker.js');
  worker.on('message', (result) => res.send(result));
});
```

### Mistake 3: Using Synchronous File System APIs (`fs.readFileSync`) in Request Handlers

**The mistake:** Calling `fs.readFileSync()` inside an Express route or HTTP request handler.

**Why it's wrong:** Synchronous I/O halts event loop iteration until the disk completes reading, blocking all other client requests. Use async file APIs (`fs.promises.readFile` or callbacks).

*Incorrect:*
```javascript
app.get('/file', (req, res) => {
  const data = fs.readFileSync('large.txt'); // ❌ Blocks Event Loop during disk read!
  res.send(data);
});
```

*Fix:*
```javascript
app.get('/file', async (req, res) => {
  const data = await fs.promises.readFile('large.txt'); // Asynchronous non-blocking
  res.send(data);
});
```

## 5. Practice Exercises

### Exercise 1: Offloading Synchronous Processing with Chunked setImmediate

**Scenario:** A backend server processes a 10,000-item array. To prevent blocking incoming HTTP requests for more than 10ms, the computation is broken into non-blocking chunks using `setImmediate()`.

**Requirements:**
1. Write processInChunks(itemsArray, chunkSize, processItemFn).
2. Process chunkSize items synchronously per tick.
3. Yield control to the Event Loop with setImmediate().
4. Return a Promise resolving when all items complete.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function processInChunks(itemsArray = [], chunkSize = 100, processItemFn) {
>   return new Promise((resolve, reject) => {
>     let index = 0;
>
>     function doChunk() {
>       try {
>         const end = Math.min(index + chunkSize, itemsArray.length);
>         for (; index < end; index++) {
>           processItemFn(itemsArray[index], index);
>         }
>
>         if (index < itemsArray.length) {
>           setImmediate(doChunk);
>         } else {
>           resolve(itemsArray.length);
>         }
>       } catch (err) {
>         reject(err);
>       }
>     }
>
>     doChunk();
>   });
> }
>
> // Verification tests
> const data = Array.from({ length: 250 }, (_, i) => i);
> let processedCount = 0;
>
> processInChunks(data, 100, (item) => { processedCount++; }).then(total => {
>   console.assert(total === 250, "Test 1 Failed: Total processed count mismatch");
>   console.assert(processedCount === 250, "Test 2 Failed: Item processor count mismatch");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Event Loop Blocking Danger**: Synchronous long-running loops block the single Node.js main thread, preventing HTTP requests and I/O handlers from executing.
> 2. **setImmediate() Yielding**: Yields execution back to the Event Loop Check phase, allowing I/O events to be processed between chunks.
> 3. **Chunk Size Trade-off**: Smaller chunk sizes reduce event loop lag but increase total processing time due to scheduling overhead.
> 
---

### Exercise 2: Event Loop Delay & Lag Monitor

**Scenario:** A microservice APM (Application Performance Monitoring) agent tracks event loop lag by measuring drift between scheduled `setTimeout` execution times.

**Requirements:**
1. Write createEventLoopDelayMonitor(checkIntervalMs, thresholdMs).
2. Schedule timer every checkIntervalMs.
3. Calculate `lag = actualTime - (expectedTime)`.
4. Flag warning when lag exceeds thresholdMs.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createEventLoopDelayMonitor(checkIntervalMs = 1000, thresholdMs = 50) {
>   let timerId = null;
>   let lastTime = Date.now();
>   let maxLagObserved = 0;
>
>   function checkLag() {
>     const now = Date.now();
>     const elapsed = now - lastTime;
>     const lag = Math.max(0, elapsed - checkIntervalMs);
>
>     maxLagObserved = Math.max(maxLagObserved, lag);
>     lastTime = now;
>
>     return {
>       lag,
>       isBlocked: lag >= thresholdMs,
>       maxLagObserved
>     };
>   }
>
>   return {
>     measure: checkLag
>   };
> }
>
> // Verification tests
> const monitor = createEventLoopDelayMonitor(100, 20);
> const start = Date.now();
> while (Date.now() - start < 150) {} // Block for 150ms
>
> const metrics = monitor.measure();
> console.assert(metrics.isBlocked === true, "Test 1 Failed: Must detect event loop blocking");
> console.assert(metrics.lag >= 40, "Test 2 Failed: Lag must be recorded correctly");
> ```
>
> #### Technical Explanation
>
> 1. **Event Loop Lag Definition**: The time delay between when an event (timer/I/O) was scheduled to fire and when the handler actually runs.
> 2. **Diagnosing APM Metrics**: Event loop lag >50ms indicates CPU-bound synchronous code is degrading server responsiveness.
> 3. **Production Monitoring**: Tools like pino or perf_hooks (monitorEventLoopDelay) monitor lag natively in production.
> 
---

### Exercise 3: Synchronous JSON.parse vs Asynchronous Streaming Parser

**Scenario:** An API gateway validates incoming multi-megabyte JSON payloads, comparing the blocking impact of synchronous `JSON.parse()` vs streaming chunk processing.

**Requirements:**
1. Write parseJsonSafely(rawJsonString, maxByteSize).
2. Check payload byte size.
3. Reject oversized strings before JSON.parse to prevent Event Loop freezing.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseJsonSafely(rawJsonString, maxByteSize = 1_000_000) {
>   if (typeof rawJsonString !== "string") {
>     throw new TypeError("Payload must be a string");
>   }
>
>   const byteLength = Buffer.byteLength(rawJsonString, "utf-8");
>   if (byteLength > maxByteSize) {
>     return {
>       success: false,
>       error: "PAYLOAD_TOO_LARGE",
>       message: `JSON payload size (${byteLength} bytes) exceeds limit of ${maxByteSize} bytes`
>     };
>   }
>
>   try {
>     const data = JSON.parse(rawJsonString);
>     return { success: true, data };
>   } catch (err) {
>     return { success: false, error: "INVALID_JSON", message: err.message };
>   }
> }
>
> // Verification tests
> const smallJson = JSON.stringify({ id: 1, name: "Alice" });
> const largeJson = JSON.stringify({ data: "x".repeat(2000) });
>
> console.assert(parseJsonSafely(smallJson, 1000).success === true, "Test 1 Failed");
> console.assert(parseJsonSafely(largeJson, 1000).error === "PAYLOAD_TOO_LARGE", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **JSON.parse Synchronous Cost**: JSON.parse is a synchronous C++ operation; parsing 50MB JSON blocks the event loop for several hundred milliseconds.
> 2. **Pre-Parse Guards**: Verifying Content-Length or byte size before parsing protects servers against Denial of Service (DoS).
> 3. **Streaming Alternatives**: Use streaming JSON parsers (e.g. stream-json) for large file processing.
## 6. Related Terms
- [The Event Loop & Libuv](event_loop.md) — The loop system frozen by blocking code.
- [Single-Threaded Architecture](single_threaded.md) — The execution structure vulnerable to blocking.
- [CPU-bound vs I/O-bound](cpu_vs_io.md) — Related concept: CPU-bound vs I/O-bound.
- [Memory Leaks & Garbage Collection](../level_10/memory_leaks.md) — Related concept: Memory Leaks & Garbage Collection.
- [Non-Blocking I/O](non_blocking_io.md) — Related concept: Non-Blocking I/O.

---

## 7. Key Takeaways
- Blocking the Event Loop freezes Node's single main thread.
- When blocked, the server cannot accept new requests or run async callbacks.
- Common causes include synchronous file methods (`readFileSync`), deep loops, large JSON parsing, and ReDoS.
- Array methods like `.forEach` and `.map` run synchronously and block the loop on large datasets.
- Use asynchronous APIs (like `fs.promises`) to offload I/O tasks to background workers.
