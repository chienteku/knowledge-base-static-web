# Non-Blocking I/O

> **Level 1 — Introduction & Architecture**
> The design principle where Node.js initiates an I/O task (like reading a file or querying a database) and immediately moves on to the next line of code instead of sitting around waiting for the task to finish.

---

## 1. Prerequisites
- [Single-Threaded Architecture](../level_01/single_threaded.md) — Non-Blocking I/O is the *only* reason a Single-Threaded app doesn't instantly freeze.

---

## 2. Term Category
- **Computer Science Concept / Architecture**

---

## 3. Environment Context
- **Node.js Core Architecture**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If Node.js only has **one thread**, what happens when it needs to read a 500MB file from the hard drive? Reading that file might take 3 seconds. 
If Node.js used **Blocking I/O** (like Java or Python do by default), that single thread would stop on that line of code for 3 seconds. During those 3 seconds, the entire server would be frozen. No other users could connect.
To prevent this, Node.js uses **Non-Blocking I/O** (Input/Output). When Node.js asks the hard drive for a file, it does *not* wait. It registers a "Callback" (a promise to handle the data later) and instantly moves to the very next line of code.

### (2) Reality Metaphor
**Blocking I/O:** You go to a fast-food counter, order a burger, and stand at the cash register staring at the cashier for 10 minutes until the burger is ready. No one behind you in line can order.
**Non-Blocking I/O:** You go to a fast-food counter, order a burger, and the cashier hands you a **buzzer**. You step aside. The cashier immediately takes the order of the next person in line. When your burger is ready, the buzzer goes off, and you step up to get your food.

### (3) How does it actually work?
Your JavaScript code is single-threaded. But the C++ code underneath Node.js (specifically a library called **Libuv**) has a secret pool of worker threads. 
When you make a database query, the main thread hands the job to the secret C++ workers and moves on. The C++ workers wait for the database, and when it's done, they "buzz" the main thread.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `*Sync` methods in production

**The mistake:** A developer uses `fs.readFileSync('file.txt')` instead of `fs.readFile('file.txt')` inside an API endpoint.

**Why it's wrong:** Almost every core module in Node.js has two versions: an Asynchronous version (Non-Blocking) and a Synchronous version (Blocking, ending in `Sync`). 
If you use `readFileSync` inside a route, you are intentionally breaking the Non-Blocking architecture! You force the main thread to freeze and wait for the file to read, destroying your server's ability to handle multiple users.
**Golden Rule:** Never use `Sync` methods in production web servers. They are only acceptable for initial startup scripts before the server starts listening for traffic.

---



### Mistake 2: Mixing Async Callbacks with Synchronous Return Values

**The mistake:** Attempting to return data synchronously from an asynchronous I/O callback function.

**Why it's wrong:** Async I/O runs out-of-band. Returning a value from inside an async callback returns to libuv, not to the caller of the outer function.

*Incorrect:*
```javascript
function getUser(id) {
  fs.readFile('user.json', (err, data) => {
    return JSON.parse(data); // ❌ Returns to callback, outer getUser returns undefined!
  });
}
const user = getUser(1); // undefined
```

*Fix:*
```javascript
async function getUser(id) {
  const data = await fs.promises.readFile('user.json');
  return JSON.parse(data); // Returns Promise resolving to user
}
```

### Mistake 3: Blocking Non-Blocking I/O Loops with Busy Waiting (`while` loops)

**The mistake:** Writing a `while(Date.now() < end)` loop to pause execution for 2 seconds.

**Why it's wrong:** Busy waiting locks the single CPU thread in a 100% CPU loop, preventing non-blocking I/O callbacks from being handled. Use `setTimeout` or `timers/promises`.

*Incorrect:*
```javascript
function sleepSync(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {} // ❌ Busy wait blocks CPU!
}
```

*Fix:*
```javascript
const { setTimeout } = require('timers/promises');
await setTimeout(2000); // Non-blocking timer pause
```

## 6. Practice Exercises

### Exercise 1: Predict the Order

**Problem:** In what order will these three `console.log` statements print to the terminal?

```javascript
console.log("1. Starting...");

fs.readFile('huge-file.txt', () => {
  console.log("2. File finished reading!");
});

console.log("3. Done.");
```

**Expected output:**
> [!check]- Answer
> ```text
> 1. Starting...
> 3. Done.
> 2. File finished reading!
> 
> Because `fs.readFile` is Non-Blocking, Node.js hands the task to the C++ background workers and immediately jumps to line 3. Only after the file is completely read does the callback function on line 2 execute.
> ```
> - Does Node.js stop and wait on the `readFile` line?

---



### Exercise 2: Non-Blocking Async File Reading Pattern

**Problem:** Convert synchronous code `const text = fs.readFileSync('file.txt', 'utf-8'); console.log(text);` to non-blocking async syntax using `fs.promises`.

**Expected output:**
> [!check]- Answer
> ```text
> const text = await fs.promises.readFile('file.txt', 'utf-8'); console.log(text);
> ```
> ```javascript
> const text = await fs.promises.readFile('file.txt', 'utf-8');
> console.log(text);
> ```
>
> **Explanation:** `fs.promises` delegates file operations to thread pool without blocking the main event loop.

---

### Exercise 3: Understanding Non-Blocking Concurrency

**Problem:** If 100 HTTP requests request a database query taking 50ms each, approximately how long does Node.js take to process all 100 requests concurrently?

**Expected output:**
> [!check]- Answer
> ```text
> Slightly over 50ms (around 50-60ms total) because non-blocking I/O queries execute concurrently on database sockets.
> ```
> ```text
> ~50-60ms total
> ```
>
> **Explanation:** Non-blocking I/O fires all 100 socket queries concurrently without waiting sequentially for each query to finish.

## 7. Related Terms
- [The Event Loop](../level_01/event_loop.md) — The mechanism that acts as the "buzzer", telling the main thread that the background I/O task is finished.
- [Callbacks](../level_05/callbacks.md) — The functions you provide to handle the data once the Non-Blocking I/O is done.

---

## 8. Key Takeaways
- **Non-Blocking I/O** means Node.js never sits idle waiting for network requests, database queries, or file reads to finish.
- It achieves this by offloading the slow I/O work to background C++ threads.
- This is the secret to how a Single-Threaded language can handle thousands of concurrent users.
- Never use synchronous (`Sync`) methods in a live web server!
