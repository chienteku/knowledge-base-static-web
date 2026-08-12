# Microtasks vs Macrotasks

> **Level 5 — Asynchronous Patterns**
> The two distinct priority queues inside the Node.js Event Loop. Microtasks (like Promises) are V.I.P.s that get to cut the line, while Macrotasks (like `setTimeout`) have to wait their turn.

---

## 1. Prerequisites
- [The Event Loop & Libuv](../level_01/event_loop.md) — This is a deep dive into exactly how the Event Loop prioritizes work.

---

## 2. Term Category

**Node.js Core Architecture / Advanced Concept (Universal .)**: Microtasks vs Macrotasks is a fundamental concept in this technology stack. **Level 5 — Asynchronous Patterns**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If a user clicks a button, a 1-second `setTimeout` finishes, and a network `Promise` resolves all at the exact same millisecond... which one does JavaScript execute first? 
If the Event Loop just threw everything into one giant line, the UI might freeze while waiting for an irrelevant timer to finish. 
To solve this, the Event Loop was split into two separate queues: the **Macrotask Queue** (normal priority) and the **Microtask Queue** (ultra-high VIP priority).

### (2) The Macrotask Queue (The Regular Line)
These are standard, heavier operations managed by the host environment (Node.js or the Browser).
- `setTimeout()`, `setInterval()`, `setImmediate()`
- I/O Operations (reading files, network requests)
When a Macrotask finishes, its callback is placed in the regular line.

### (3) The Microtask Queue (The VIP Line)
These are tiny, fast operations that need to happen *immediately* after the current code finishes, before the Event Loop is allowed to do anything else.
- **Promises** (`.then()`, `.catch()`, `async/await` resolution)
- `process.nextTick()` (Node.js only, the ultimate VIP)
When a Promise resolves, its `.then()` callback is placed in the VIP line.

### (4) The Rule of Execution
When the main thread finishes executing the current script, the Event Loop looks at the VIP Microtask line. It executes **every single Microtask** until the line is completely empty. Only then does it allow **ONE** Macrotask to execute. After that one Macrotask, it instantly checks the Microtask line again!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Starving the Event Loop

**The mistake:** A developer writes a recursive Promise that instantly resolves itself over and over again infinitely. 

**Why it's wrong:** Because Microtasks (Promises) get VIP priority, the Event Loop will execute the Microtask line until it's empty. If you keep adding new Promises to the line, it will never be empty! The Event Loop will be trapped in the VIP line forever, and your Macrotasks (like `setTimeout` or incoming HTTP requests) will **never** execute. This is called "Starving the Event Loop."
**Golden Rule:** Avoid infinite recursive Promises. They block the Event Loop just as badly as a synchronous `while(true)` loop.

---



### Mistake 2: Assuming `setTimeout(fn, 0)` Runs Before `Promise.resolve().then(fn)`

**The mistake:** Expecting `setTimeout(..., 0)` macrotask to execute before a resolved Promise microtask.

**Why it's wrong:** Microtasks (Promises, `queueMicrotask`, `process.nextTick`) are processed immediately after current call stack unwinds, taking priority over Macrotasks (Timers, I/O).

*Incorrect:*
```javascript
setTimeout(() => console.log('Macrotask'), 0);
Promise.resolve().then(() => console.log('Microtask'));
// Output: Microtask -> Macrotask
```

*Fix:*
```javascript
// Understand queue priority: Microtask Queue is always drained before Macrotask Timers!
```

### Mistake 3: Infinite Microtask Loop Freezing Macrotask Processing

**The mistake:** Queueing microtasks continuously via recursive `queueMicrotask()`.

**Why it's wrong:** The event loop MUST drain the entire Microtask Queue completely before moving to macrotask timer/check phases. Infinite microtask loops starve all I/O and timers.

*Incorrect:*
```javascript
function loop() {
  queueMicrotask(loop); // ❌ Starves Event Loop Macrotasks completely!
}
loop();
```

*Fix:*
```javascript
function loop() {
  setImmediate(loop); // Macrotask allows event loop to poll I/O between iterations
}
loop();
```

## 5. Practice Exercises

### Exercise 1: Predict the Output Priority

**Problem:** In what exact order will these console logs print to the terminal?

```javascript
console.log("1. Sync Code");

setTimeout(() => {
  console.log("2. Macrotask (Timeout)");
}, 0);

Promise.resolve().then(() => {
  console.log("3. Microtask (Promise)");
});

console.log("4. Sync Code End");
```

**Expected output:**
> [!check]- Answer
> ```text
> 1. Sync Code
> 4. Sync Code End
> 3. Microtask (Promise)
> 2. Macrotask (Timeout)
> 
> Explanation: 
> - Synchronous code always runs first (1, 4).
> - The Event Loop checks the VIP Microtask line (Promises) and runs them (3).
> - Finally, it checks the normal Macrotask line (Timeout) and runs it (2).
> ```
> - Sync first. VIPs second. Regulars last.
> 
---



### Exercise 2: Classifying Microtasks vs Macrotasks

**Problem:** Classify as Microtask or Macrotask:
1. `Promise.then()`
2. `setTimeout()`
3. `setImmediate()`
4. `queueMicrotask()`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Microtask
> 2. Macrotask
> 3. Macrotask
> 4. Microtask
> ```
> ```text
> 1. Microtask
> 2. Macrotask
> 3. Macrotask
> 4. Microtask
> ```
>
> **Explanation:** Promises and `queueMicrotask` are Microtasks; timers and `setImmediate` are Macrotasks.
> 
---

### Exercise 3: Tracing Mixed Task Execution Order

**Problem:** Predict console output:
```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
```

**Expected output:**
> [!check]- Answer
> ```text
> 1
> 4
> 3
> 2
> ```
> ```text
> 1
> 4
> 3
> 2
> ```
>
> **Explanation:** Sync logs (1, 4) execute first on Call Stack, followed by Microtask Promise (3), then Macrotask timer (2).
> 
## 6. Related Terms
- [The Event Loop & Libuv](../level_01/event_loop.md) — The manager of these two queues.
- [process.nextTick() vs setImmediate()](nexttick_setimmediate.md) — Related concept: process.nextTick() vs setImmediate().
- [Unhandled Promise Rejections](unhandled_rejections.md) — Related concept: Unhandled Promise Rejections.

---

## 7. Key Takeaways
- **Macrotasks** (`setTimeout`, I/O) are normal priority.
- **Microtasks** (Promises, `process.nextTick`) are VIP priority.
- The Event Loop completely empties the Microtask queue before it allows a single Macrotask to run.
- You can "starve" the Event Loop by chaining infinite Microtasks, preventing timers and network requests from ever firing.
