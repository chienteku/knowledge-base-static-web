# Worker Threads

> **Level 10 — Security & Production**
> True in-process parallelism for CPU-bound work without blocking the event loop.

---

## 1. Prerequisites
- [CPU-bound vs I/O-bound](../level_01/cpu_vs_io.md) — The types of heavy computations that require parallel threads.
- [Blocking the Event Loop](../level_01/blocking_event_loop.md) — The performance bottleneck resolved by threading.

---

## 2. Term Category

**Production / DevOps (Thread Concurrency Layer .)**: Worker Threads is a fundamental concept in this technology stack. **Level 10 — Security & Production**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
While `child_process.fork()` allows you to run parallel tasks in separate processes, spawning a new process is resource-heavy. The operating system must allocate a new memory heap, launch a new V8 engine instance, and load core modules from scratch. This consumes 10–30MB of RAM per process and introduces significant startup latency.

If you need to perform lightweight but CPU-intensive tasks (e.g. image resizing, cryptography hashing, or parsing large JSON payloads) inside a single application, spawning multiple child processes is inefficient.

To support lightweight, in-process concurrency, Node.js provides the built-in **`worker_threads` module**:
-   **Worker Threads:** Allows you to run multiple JavaScript threads concurrently **inside the same operating system process**.
-   **V8 Isolates:** Each worker thread has its own **V8 Isolate** (independent call stack, heap allocation, and microtask queue), meaning it runs JavaScript independently without blocking the main event loop thread.
-   **Shared Memory:** Unlike child processes, worker threads share the same process memory space. You can share raw binary data directly between threads using **`SharedArrayBuffer`**, avoiding the CPU overhead of serializing and copying objects.

---

### (2) Reality Metaphor
Imagine managing a corporate office.
- **Child Processes** are like **renting a new office building** down the street for a new task. The new building requires its own lobby, security staff, and utilities (**V8 engine overhead**). It is expensive to set up and occupies a lot of space. If they need to share documents with you, they must pack them in boxes and send them via courier (**IPC serialization**).
- **Worker Threads** are like **placing a new desk in your current office**. The new worker shares the same lobby, restrooms, and water pipes (**shared RAM memory**). Setting it up is cheap and fast, and if the workers want to share a folder, they can pass it directly across the desk (**`SharedArrayBuffer`**).

---

### (3) JavaScript Implementation Example

An Express route that offloads a heavy calculation to a worker thread:

#### 1. The Main Server script (`server.js`)
```javascript
const express = require('express');
const { Worker } = require('worker_threads');
const path = require('path');
const app = express();

app.get('/compute', (req, res) => {
  // Start a worker thread pointing to the calculation file
  const worker = new Worker(path.join(__dirname, 'worker.js'), {
    workerData: { iterations: 10_000_000 } // Pass inputs to the worker
  });

  // Listen for the calculation result
  worker.on('message', (result) => {
    res.json({ status: 'done', result });
  });

  worker.on('error', (err) => {
    res.status(500).send(err.message);
  });
});

app.listen(3000);
```

#### 2. The Worker script (`worker.js`)
```javascript
const { parentPort, workerData } = require('worker_threads');

// 1. Retrieve input parameters
const { iterations } = workerData;

// 2. Perform the CPU-bound calculations
let sum = 0;
for (let i = 0; i < iterations; i++) {
  sum += Math.sqrt(i);
}

// 3. Post the result back to the main thread
parentPort.postMessage(sum);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Worker Threads for I/O-bound operations

**The mistake:** Spawning worker threads to execute database queries or HTTP network requests:

```javascript
// BAD: Offloading I/O requests to a thread actually slows down the server!
const worker = new Worker('./io_worker.js'); // Fetching a remote API inside...
```

**Why it's wrong:** Node's Event Loop already handles I/O operations asynchronously and efficiently using libuv and OS kernel sockets. Creating a new thread introduces CPU overhead (thread setup, memory allocation, context switching). Running I/O operations in a worker thread makes the server slower and use more memory.

*Fix:* Only use worker threads for **CPU-bound mathematical or CPU-intensive calculations** (e.g. cryptography, encryption, image parsing, data sorting). Keep I/O operations inside standard asynchronous code loops.

---



### Mistake 2: Spawning New Worker Threads for Short, Frequent I/O Tasks (Overhead Trap)

**The mistake:** Spawning a `new Worker('./worker.js')` inside an HTTP request handler to execute a database query or small array map.

**Why it's wrong:** Spawning a Worker Thread creates a new V8 isolate instance (consuming ~20ms and several MB RAM). For short I/O tasks, thread spawn overhead exceeds task duration! Use worker pools.

*Incorrect:*
```javascript
app.get('/data', (req, res) => {
  const worker = new Worker('./worker.js'); // ❌ Massive spawn overhead for tiny task!
});
```

*Fix:*
```javascript
Use Worker Thread Pools (e.g. piscina) to reuse long-lived worker threads
```

### Mistake 3: Attempting to Pass Complex Non-Serializable Objects (Functions, DOM) via `postMessage()`

**The mistake:** Sending functions or database client instances through `parentPort.postMessage({ fn: () => {} })`.

**Why it's wrong:** Data passed via `postMessage()` is serialized using HTML structured clone algorithm. Functions, DOM nodes, and complex class instances cannot be cloned.

*Incorrect:*
```javascript
parentPort.postMessage({ callback: () => console.log('hi') }); // ❌ DataCloneError!
```

*Fix:*
```javascript
parentPort.postMessage({ type: 'SUCCESS', result: data }); // Pass serializable data
```

## 5. Practice Exercises

### Exercise 1: Worker Communication Loop

**Problem:** Complete the worker script below to receive a string, reverse it, and send the reversed string back to the parent thread:

```javascript
const { parentPort } = require('worker_threads');

// Listen for messages from the parent thread
parentPort.on('message', (text) => {
  // Reverse string
  const reversed = text.split('').reverse().join('');
  
  // Post reversed message back
  parentPort.postMessage(reversed);
});
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Basic Worker Thread Implementation

**Problem:** Write main thread code spawning worker `worker.js` passing `{ num: 10 }` via `workerData` and logging message.

**Expected output:**
> [!check]- Answer
> ```text
> const worker = new Worker('./worker.js', { workerData: { num: 10 } }); worker.on('message', result => console.log(result));
> ```
> ```javascript
> const { Worker } = require('worker_threads');
> const worker = new Worker('./worker.js', {
>   workerData: { num: 10 }
> });
> worker.on('message', (result) => {
>   console.log('Result from worker:', result);
> });
> ```
>
> **Explanation:** `Worker` constructor spawns background V8 isolate threads passing initial `workerData`.
> 
---

### Exercise 3: SharedArrayBuffer and Worker Threads

**Problem:** How do `SharedArrayBuffer` and `Atomics` allow Worker Threads to share memory without copying?

**Expected output:**
> [!check]- Answer
> ```text
> SharedArrayBuffer grants multiple worker threads shared access to identical raw binary memory bytes.
> ```
> ```text
> SharedArrayBuffer grants multiple worker threads shared access to identical raw binary memory bytes.
> ```
>
> **Explanation:** `SharedArrayBuffer` enables zero-copy parallel memory access across worker threads.
> 
## 6. Related Terms
- [Child Processes (child_process)](child_processes.md) — Multi-process concurrency with isolated memories.
- [The cluster Module](cluster_module.md) — Spawning multiple instances of a Node server process.

---

## 7. Key Takeaways
- Worker threads enable multi-threaded execution within a single Node.js process.
- Each worker thread runs inside its own V8 Isolate (stack/heap), preventing event loop blockages.
- Threads share process memory, allowing direct binary sharing using `SharedArrayBuffer`.
- Setting up threads is cheaper and uses less memory than spawning child processes.
- Do not use worker threads for database or network I/O; only use them for CPU-intensive calculations.
