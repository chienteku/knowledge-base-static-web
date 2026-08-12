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

### Exercise 1: Microtask vs Macrotask Execution Order Profiler

**Scenario:** A queue profiler records the exact execution sequence between Microtasks (`queueMicrotask`, `Promise`) and Macrotasks (`setTimeout`, `setImmediate`).

**Requirements:**
1. Write profileQueueOrder(logArray).
2. Schedule Macrotasks and Microtasks.
3. Assert Microtasks execute BEFORE Macrotasks.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function profileQueueOrder(logArray = []) {
>   logArray.push("1_SYNC");
>
>   setTimeout(() => {
>     logArray.push("4_MACRO_TIMEOUT");
>   }, 0);
>
>   Promise.resolve().then(() => {
>     logArray.push("2_MICRO_PROMISE");
>   });
>
>   queueMicrotask(() => {
>     logArray.push("3_MICRO_QUEUE");
>   });
> }
>
> // Verification tests
> const order = [];
> profileQueueOrder(order);
>
> setTimeout(() => {
>   console.assert(order[0] === "1_SYNC", "Test 1 Failed");
>   console.assert(order[1] === "2_MICRO_PROMISE", "Test 2 Failed");
>   console.assert(order[2] === "3_MICRO_QUEUE", "Test 3 Failed");
>   console.assert(order[3] === "4_MACRO_TIMEOUT", "Test 4 Failed: Macrotask runs after all microtasks");
> }, 20);
> ```
>
> #### Technical Explanation
>
> 1. **Microtask Queue Execution**: Microtasks (Promise callbacks, queueMicrotask) execute immediately after current Call Stack empties, BEFORE any Macrotask.
> 2. **Macrotask Phase Transitions**: Macrotasks (setTimeout, setImmediate, I/O) run during specific Event Loop phases.
> 3. **Event Loop Draining Rule**: Node.js drains the ENTIRE Microtask queue before picking up the next Macrotask.
> 
---

### Exercise 2: Preventing Macrotask Delay Spikes via Microtask Batches

**Scenario:** A task scheduler limits microtask queue depth to prevent starving the Event Loop macrotask phases.

**Requirements:**
1. Write scheduleMicrotaskBatch(tasksArray, maxBatchSize).
2. Process maxBatchSize microtasks.
3. Yield to setImmediate if more remain.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function scheduleMicrotaskBatch(tasksArray = [], maxBatchSize = 10, processTaskFn) {
>   let index = 0;
>
>   function runBatch() {
>     const end = Math.min(index + maxBatchSize, tasksArray.length);
>     for (; index < end; index++) {
>       queueMicrotask(() => processTaskFn(tasksArray[index]));
>     }
>
>     if (index < tasksArray.length) {
>       setImmediate(runBatch); // Yield to Macrotask phase!
>     }
>   }
>
>   runBatch();
> }
>
> // Verification tests
> const items = [1, 2, 3, 4, 5];
> let processed = 0;
> scheduleMicrotaskBatch(items, 2, (item) => { processed++; });
>
> setImmediate(() => {
>   console.assert(processed > 0, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Microtask Queue Depth**: Overloading the microtask queue delays macrotask execution (timers, socket I/O).
> 2. **Yielding via setImmediate**: Using setImmediate between microtask batches allows the Event Loop to process I/O events.
> 3. **Starvation Mitigation**: Keeps server response times consistent under heavy async loads.
> 
---

### Exercise 3: queueMicrotask Batch State Scheduler

**Scenario:** Enqueues state reconciliation callbacks using native `queueMicrotask()`.

**Requirements:**
1. Write queueMicrotaskStateUpdate(stateObj, updatesObj).
2. Defer state merge to microtask queue.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function queueMicrotaskStateUpdate(stateObj, updatesObj) {
>   return new Promise((resolve) => {
>     queueMicrotask(() => {
>       Object.assign(stateObj, updatesObj);
>       resolve(stateObj);
>     });
>   });
> }
>
> // Verification tests
> const state = { count: 0 };
> queueMicrotaskStateUpdate(state, { count: 1, name: "updated" }).then(res => {
>   console.assert(res.count === 1 && res.name === "updated", "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **queueMicrotask Standard API**: Standard HTML/Node.js API for scheduling microtasks without instantiating Promise objects.
> 2. **State Batching**: Defers state mutation to the end of current JavaScript execution frame.
> 3. **Lightweight Scheduling**: Lower memory overhead compared to `Promise.resolve().then()`.
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
