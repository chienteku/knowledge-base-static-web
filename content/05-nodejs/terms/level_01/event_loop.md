# The Event Loop & Libuv

> **Level 1 — Introduction & Architecture**
> The beating heart of Node.js. An infinite loop that constantly monitors the background C++ workers, checks if they have finished their I/O tasks, and pushes their callbacks back onto the main JavaScript thread to be executed.

---

## 1. Prerequisites
- [Single-Threaded Architecture](single_threaded.md) — The Event Loop manages this single thread.
- [Non-Blocking I/O](non_blocking_io.md) — The Event Loop organizes the chaos created by Non-Blocking tasks.

---

## 2. Term Category

**Node.js Core Architecture (Node.js)**: The Event Loop & Libuv is a fundamental concept in this technology stack. **Level 1 — Introduction & Architecture**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
We know Node.js is Single-Threaded, and we know it hands off slow database queries to background C++ workers so it doesn't block. 
But wait... if the main thread moves on, how does it know when the database query is actually done? How does the data get back into the JavaScript code?
This requires an orchestrator. A traffic cop. That traffic cop is the **Event Loop**, and it is powered by a C++ library named **Libuv**.

### (2) Reality Metaphor
Imagine a massive restaurant kitchen:
1. The **Main Thread** is the Head Chef. He is the only one allowed to plate the final dishes.
2. The **Background Workers (Libuv)** are the sous-chefs peeling potatoes and roasting meat (I/O tasks).
3. The **Event Loop** is the Kitchen Manager. He walks around in a circle, forever. He checks the sous-chefs: "Are the potatoes done? No? Okay. Is the meat done? Yes! Okay, put the meat on the Head Chef's desk."

### (3) The Phases of the Event Loop
The Event Loop isn't just a random circle. It is a highly structured infinite `while` loop with specific phases:
1. **Timers Phase:** Executes `setTimeout()` and `setInterval()` callbacks.
2. **Poll Phase:** The most important phase. It retrieves new I/O events (like incoming HTTP requests or finished database queries) and executes their callbacks.
3. **Check Phase:** Executes `setImmediate()` callbacks.
4. *(It loops back to the top and repeats infinitely until the program closes).*

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Event Loop Priority

**The mistake:** A developer writes a `setTimeout(fn, 0)` and assumes it will execute immediately, before the file system finishes reading.

**Why it's wrong:** The Event Loop does not guarantee exact millisecond precision. If you set a timeout to `0`, it just means "put this in the Timers queue." If the Event Loop is currently stuck processing a massive `while` loop in the Main Thread, your 0ms timer might not execute for 5 seconds!
**Golden Rule:** The Event Loop can only push callbacks to the Main Thread if the Main Thread is empty. If you block the Main Thread, the Event Loop stops spinning!

---



### Mistake 2: Assuming `setTimeout(fn, 0)` Executes Immediately (Zero Millisecond Guarantee Fallacy)

**The mistake:** Expecting `setTimeout(fn, 0)` to execute instantaneously before any other scheduled code.

**Why it's wrong:** The timer phase is subject to OS timer granularity (minimum 1ms in Node.js) and can only execute after current call stack and microtask queues (Promises, `nextTick`) drain.

*Incorrect:*
```javascript
setTimeout(() => console.log('Timer'), 0);
Promise.resolve().then(() => console.log('Promise'));
// Expecting 'Timer' before 'Promise'
```

*Fix:*
```javascript
// Output will be:
// Promise
// Timer
// Microtasks (Promises) ALWAYS take precedence over macrotasks (Timers)!
```

### Mistake 3: Starving the Event Loop Phase Cycles via Recursive `process.nextTick`

**The mistake:** Recursively invoking `process.nextTick()` continuously.

**Why it's wrong:** Node.js processes `process.nextTick` queue completely before moving to the next Event Loop phase. Infinite `nextTick` recursion starves I/O phases and timers indefinitely.

*Incorrect:*
```javascript
function starve() {
  process.nextTick(starve); // ❌ Starves Event Loop completely!
}
starve();
```

*Fix:*
```javascript
function safe() {
  setImmediate(safe); // Pushes callback to Check phase, allowing event loop to poll I/O
}
safe();
```

## 5. Practice Exercises

### Exercise 1: Event Loop Execution Phases Order Inspector

**Scenario:** An Event Loop diagnostic script tracks the exact execution order across microtask queues (`process.nextTick`, `Promise`) and macrotask phases (`Timers`, `Check`).

**Requirements:**
1. Write trackExecutionOrder(logArray).
2. Schedule nextTick, Promise, setTimeout, setImmediate.
3. Verify execution sequence.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function trackExecutionOrder(logArray = []) {
>   // 1. Synchronous main call stack
>   logArray.push("1_SYNC_START");
>
>   // Timers Phase (Macrotask)
>   setTimeout(() => {
>     logArray.push("5_TIMEOUT_MACRO");
>   }, 0);
>
>   // Check Phase (Macrotask)
>   setImmediate(() => {
>     logArray.push("6_IMMEDIATE_MACRO");
>   });
>
>   // Microtask: Promise
>   Promise.resolve().then(() => {
>     logArray.push("4_PROMISE_MICRO");
>   });
>
>   // Microtask: process.nextTick (Highest Priority Microtask!)
>   process.nextTick(() => {
>     logArray.push("3_NEXT_TICK_MICRO");
>   });
>
>   logArray.push("2_SYNC_END");
> }
>
> // Verification tests
> const order = [];
> trackExecutionOrder(order);
>
> setImmediate(() => {
>   console.assert(order[0] === "1_SYNC_START", "Test 1 Failed: Sync first");
>   console.assert(order[1] === "2_SYNC_END", "Test 2 Failed: Sync end second");
>   console.assert(order[2] === "3_NEXT_TICK_MICRO", "Test 3 Failed: nextTick microtask third");
>   console.assert(order[3] === "4_PROMISE_MICRO", "Test 4 Failed: Promise microtask fourth");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Six Event Loop Phases**: Timers -> Pending Callbacks -> Idle/Prepare -> Poll -> Check -> Close Callbacks.
> 2. **Microtask Priority**: process.nextTick queue is processed BEFORE Promise microtask queue; microtasks run immediately after current Call Stack empties.
> 3. **Macrotask Phase Transitions**: setTimeout (Timers phase) vs setImmediate (Check phase).
> 
---

### Exercise 2: Microtask Queue Starvation Guard

**Scenario:** Demonstrates how infinite recursive `process.nextTick()` calls starve the Event Loop, blocking I/O and Timers from executing.

**Requirements:**
1. Write safeNextTickQueue(taskCount, maxPerTick).
2. Limit max nextTick executions per tick.
3. Yield to setImmediate.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function safeNextTickQueue(taskCount = 100, maxPerTick = 10, processFn) {
>   let completed = 0;
>
>   function runBatch() {
>     let count = 0;
>     while (count < maxPerTick && completed < taskCount) {
>       processFn(completed);
>       completed++;
>       count++;
>     }
>
>     if (completed < taskCount) {
>       // Yield to Check phase (setImmediate) to avoid microtask starvation!
>       setImmediate(runBatch);
>     }
>   }
>
>   runBatch();
>   return { isComplete: () => completed === taskCount, getCompleted: () => completed };
> }
>
> // Verification tests
> let itemsDone = 0;
> const runner = safeNextTickQueue(50, 10, () => { itemsDone++; });
>
> setImmediate(() => {
>   console.assert(runner.getCompleted() > 0, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Microtask Starvation Danger**: Recursive process.nextTick() calls continuously drain the nextTick queue without yielding to libuv Event Loop phases.
> 2. **Event Loop Starvation**: Prevents I/O handlers, WebSocket packets, and HTTP requests from being processed.
> 3. **setImmediate Solution**: setImmediate yields execution to the Macrotask Check phase, allowing I/O events to be processed between batches.
> 
---

### Exercise 3: Custom Event Loop Tick Timings Profiler

**Scenario:** An APM profiler measures average tick duration across Event Loop iterations to identify lag spikes.

**Requirements:**
1. Write profileEventLoopTicks(sampleCount).
2. Track time between setImmediate ticks.
3. Return average tick duration.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function profileEventLoopTicks(sampleCount = 5) {
>   return new Promise((resolve) => {
>     const durations = [];
>     let lastTime = Date.now();
>     let count = 0;
>
>     function tick() {
>       const now = Date.now();
>       durations.push(now - lastTime);
>       lastTime = now;
>       count++;
>
>       if (count < sampleCount) {
>         setImmediate(tick);
>       } else {
>         const sum = durations.reduce((a, b) => a + b, 0);
>         resolve({
>           sampleCount,
>           durations,
>           avgTickMs: Math.round(sum / durations.length)
>         });
>       }
>     }
>
>     setImmediate(tick);
>   });
> }
>
> // Verification tests
> profileEventLoopTicks(3).then(res => {
>   console.assert(res.durations.length === 3, "Test 1 Failed");
>   console.assert(typeof res.avgTickMs === "number", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Event Loop Tick**: Single complete iteration through the 6 phases of the Node.js Event Loop.
> 2. **Tick Duration Metric**: In a healthy server, empty tick duration is <1ms.
> 3. **APM Profiling**: Profiling tick duration alerts devops teams when server ticks stall.
## 6. Related Terms
- [Non-Blocking I/O](non_blocking_io.md) — The tasks that get sent to the background.
- [Callbacks & Callback Hell](../level_05/callbacks.md) — The actual functions that the Event Loop pushes onto the main thread.
- [Blocking the Event Loop](blocking_event_loop.md) — Related concept: Blocking the Event Loop.
- [The Call Stack](call_stack.md) — Related concept: The Call Stack.
- [Single-Threaded Architecture](single_threaded.md) — Related concept: Single-Threaded Architecture.
- [The Thread Pool (libuv)](thread_pool.md) — Related concept: The Thread Pool (libuv).
- [V8 JavaScript Engine](v8_engine.md) — Related concept: V8 JavaScript Engine.
- [Microtasks vs Macrotasks](../level_05/microtasks_macrotasks.md) — Related concept: Microtasks vs Macrotasks.
- [process.nextTick() vs setImmediate()](../level_05/nexttick_setimmediate.md) — Related concept: process.nextTick() vs setImmediate().
- [Node.js (Runtime Environment)](nodejs.md) — Related concept: Node.js (Runtime Environment).

---

## 7. Key Takeaways
- **Libuv** is the C++ library that gives Node.js its background worker threads.
- The **Event Loop** is an infinite loop that constantly checks if those background workers are finished.
- When a worker finishes, the Event Loop pushes its Callback function onto the Main Thread to be executed.
- If you block the Main Thread, the Event Loop cannot deliver callbacks, and your app freezes.
