# Single-Threaded Architecture

> **Level 1 — Introduction & Architecture**
> The architectural design choice where Node.js uses only *one* main thread (one CPU core) to execute all of your JavaScript code, rather than spinning up a new thread for every user.

---

## 1. Prerequisites
- [V8 Engine](../level_01/v8_engine.md) — V8 is inherently single-threaded.

---

## 2. Term Category
- **Computer Science Concept / Architecture**

---

## 3. Environment Context
- **Node.js Core Architecture**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional backend languages (like Java or PHP), servers use **Multi-Threaded Architecture**. When 1,000 users visit a Java website, the server creates 1,000 separate "Threads" (mini-processes) in the CPU. Each thread requires about 2MB of RAM. 1,000 users = 2 Gigabytes of RAM wasted just on managing threads! If 10,000 users visit, the server crashes from memory exhaustion.
Ryan Dahl designed Node.js to be **Single-Threaded**. Whether 1 user visits or 10,000 users visit, Node.js only uses **ONE** main thread to run your JavaScript. Because it doesn't create new threads, it uses almost zero RAM to handle concurrent connections, making it massively scalable.

### (2) Reality Metaphor
**Multi-Threaded (Java):** A restaurant with 10 waiters. A customer walks in, Waiter #1 takes their order, goes to the kitchen, and *stands there doing nothing for 15 minutes* until the food is ready. If 11 customers walk in, the restaurant crashes because all the waiters are busy waiting.
**Single-Threaded (Node.js):** A restaurant with **One Waiter** on roller skates. The waiter takes an order, hands it to the kitchen, and *immediately skates to the next table* to take another order. The single waiter never stops moving and never waits. One waiter can serve 1,000 tables!

### (3) The Catch: CPU-Intensive Tasks
Because there is only one waiter, what happens if a customer asks the waiter to do complex math for 5 minutes instead of just writing down an order? 
The waiter stops. The other 999 customers get ignored for 5 minutes. The restaurant freezes. 
This is why Node.js is terrible at heavy CPU tasks (like video encoding or complex AI math).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Blocking the Main Thread

**The mistake:** A developer builds an API endpoint that loops 10 billion times to calculate prime numbers.

**Why it's wrong:** Because Node.js is Single-Threaded, while your code is busy looping 10 billion times, *no other user can use the website*. The entire server is frozen. Every single HTTP request from other users will time out. 
**Golden Rule:** Node.js is for I/O (Input/Output: reading databases, sending network requests). It is NOT for heavy CPU math! Never block the main thread.

---



### Mistake 2: Assuming 'Single-Threaded' Means Node.js Cannot Use Multiple CPU Cores

**The mistake:** Believing Node.js can never perform parallel background processing.

**Why it's wrong:** Application JavaScript code runs on a single main thread, but Node.js uses C++ Worker Threads (libuv) and Cluster/Worker Thread modules for multi-core parallelism.

*Incorrect:*
```javascript
// Avoiding Node.js because project requires background worker threads
```

*Fix:*
```javascript
Use Worker Threads (worker_threads module) or Cluster module to utilize all CPU cores
```

### Mistake 3: Uncaught Exceptions Crashing the Entire Node.js Server Process

**The mistake:** Failing to catch errors in a single request handler, causing the single-threaded process to exit.

**Why it's wrong:** Because all users share a single Node.js process, an uncaught exception in one request handler crashes the process for ALL users.

*Incorrect:*
```javascript
app.get('/crash', (req, res) => {
  throw new Error('Boom!'); // ❌ Crashes entire server for all users!
});
```

*Fix:*
```javascript
app.get('/crash', (req, res, next) => {
  try {
    throw new Error('Boom!');
  } catch (err) {
    next(err); // Handle gracefully via Express error middleware
  }
});
```

## 6. Practice Exercises

### Exercise 1: Right Tool for the Job

**Problem:** Your startup is building two products:
1. A real-time chat app processing 10,000 small text messages per second.
2. A video processing app that converts 4K videos into 1080p.
Which product should use Node.js, and which should use a multi-threaded language like Go or Java?

**Expected output:**
> [!check]- Answer
> ```text
> 1. Chat App = Node.js. It requires handling thousands of concurrent connections with very little CPU work (just passing text around). The single-threaded "roller-skate waiter" is perfect for this.
> 2. Video App = Go/Java/C++. Video conversion requires massive CPU math. If you use Node.js, the single thread will block and the server will freeze.
> ```
> - Which app requires heavy math? Which app requires fast I/O?

---



### Exercise 2: Single-Threaded Architecture Mechanics

**Problem:** Explain what component in Node.js handles background file I/O and crypto operations if JavaScript runs on a single thread.

**Expected output:**
> [!check]- Answer
> ```text
> libuv C++ thread pool (default 4 threads).
> ```
> ```text
> libuv C++ thread pool (default 4 threads)
> ```
>
> **Explanation:** `libuv` manages a background pool of C++ worker threads for filesystem, DNS, and crypto tasks.

---

### Exercise 3: Process Manager Protection

**Problem:** What process manager tool is standard for automatically restarting crashed single-threaded Node.js applications in production?

**Expected output:**
> [!check]- Answer
> ```text
> PM2 (or systemd / Docker container restart policies).
> ```
> ```text
> PM2 (or systemd / Docker container restart policies)
> ```
>
> **Explanation:** PM2 monitors Node.js processes and instantly restarts them if uncaught errors occur.

## 7. Related Terms
- [Non-Blocking I/O](../level_01/non_blocking_io.md) — How the single thread manages to avoid waiting for the kitchen.
- [The Event Loop](../level_01/event_loop.md) — The mechanism that tells the single thread when the kitchen is done cooking.

---

## 8. Key Takeaways
- **Single-Threaded** means Node.js uses exactly one CPU core to run your JavaScript.
- It is highly memory efficient because it doesn't spin up thousands of threads for users.
- It is perfect for handling high-concurrency, data-heavy applications (Chat apps, REST APIs).
- It is terrible for CPU-heavy applications (Image/Video processing, Machine Learning).
- **Never block the main thread!**
