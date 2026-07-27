# Blocking the Event Loop

> **Level 1 — Introduction & Architecture**
> Concrete anti-patterns (huge `while`, sync `fs`, `JSON.parse` on giant payloads) that freeze the server.

---

## 1. Prerequisites
- [The Event Loop & Libuv](./event_loop.md) — The loop mechanism that must be kept free.
- [CPU-bound vs I/O-bound](./cpu_vs_io.md) — The workloads that lead to thread blocking.

---

## 2. Term Category
- **Node.js Core Architecture**

---

## 3. Environment Context
- **Node.js Core Architecture** (Governs execution efficiency on single-threaded runtime engines).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Code Review

**Problem:** Review this Express route. Identify the line of code that blocks the Event Loop and write the fix:

```javascript
app.post('/import-data', (req, res) => {
  const rawData = req.body.rawData; 
  const parsed = JSON.parse(rawData); // Assume rawData is a 100MB string
  saveToDatabase(parsed);
  res.send("Import complete");
});
```

> [!check]- Answer
> `JSON.parse(rawData)` blocks the event loop because parsing a 100MB string is synchronous and computationally heavy. To fix this, offload the parsing to a separate worker thread or process the payload as a stream of smaller chunks (using JSON streaming parsers) to avoid blocking the main thread.

---



### Exercise 2: Identifying Blocking vs Non-Blocking Code

**Problem:** Determine which function blocks the Event Loop: 1) `JSON.parse()` on a 500MB string; 2) `fs.promises.readFile()`. Explain why.

**Expected output:**
```text
1) JSON.parse() on a 500MB string blocks the main thread because JSON parsing is a synchronous operation handled on the V8 call stack.
```

> [!check]- Answer
> ```text
> 1) JSON.parse() on a 500MB string blocks the main thread because JSON parsing is a synchronous operation handled on the V8 call stack.
> ```
>
> **Explanation:** Heavy synchronous JSON parsing or CPU math blocks main loop execution; async disk I/O delegates work to libuv worker threads.

### Exercise 3: Refactoring Synchronous File Reading

**Problem:** Refactor `const data = fs.readFileSync('config.json')` into non-blocking async promises.

**Expected output:**
```text
const data = await fs.promises.readFile('config.json', 'utf-8');
```

> [!check]- Answer
> ```javascript
> const data = await fs.promises.readFile('config.json', 'utf-8');
> ```
>
> **Explanation:** `fs.promises.readFile` returns a Promise, allowing the event loop to handle other requests while reading from disk.

## 7. Related Terms
- [The Event Loop & Libuv](./event_loop.md) — The loop system frozen by blocking code.
- [Single-Threaded Architecture](./single_threaded.md) — The execution structure vulnerable to blocking.

---

## 8. Key Takeaways
- Blocking the Event Loop freezes Node's single main thread.
- When blocked, the server cannot accept new requests or run async callbacks.
- Common causes include synchronous file methods (`readFileSync`), deep loops, large JSON parsing, and ReDoS.
- Array methods like `.forEach` and `.map` run synchronously and block the loop on large datasets.
- Use asynchronous APIs (like `fs.promises`) to offload I/O tasks to background workers.
