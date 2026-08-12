# Graceful Shutdown & Process Signals

> **Level 10 — Security & Production**
> Handling `SIGTERM`/`SIGINT` to drain connections before exit (essential in Docker/PM2).

---

## 1. Prerequisites
- [The process Object](../level_02/process_object.md) — The process wrapper capturing OS signals.
- [Docker](docker.md) — The container container environments that emit shutdown signals during updates.

---

## 2. Term Category

**Production / DevOps (Operating System Layer .)**: Graceful Shutdown & Process Signals is a fundamental concept in this technology stack. **Level 10 — Security & Production**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In production environments, servers are constantly restarted, scaled down, or redeployed. When a container manager (like Docker) or process manager (like PM2) needs to stop your application, it sends a POSIX signal to the process:
-   **`SIGTERM`:** Sent by Kubernetes or Docker to request a clean termination.
-   **`SIGINT`:** Sent when you press `Ctrl+C` in the terminal to interrupt the process.

By default, if Node.js receives these signals and you have not registered a listener, the process terminates **immediately**. 

This abrupt exit cuts off active HTTP requests mid-flight, leaves database transactions uncompleted, and can corrupt files currently being written.

To prevent this, developers implement **Graceful Shutdown**:
1.  **Signal Interception:** Listen for signals using `process.on('SIGTERM', ...)` or `process.on('SIGINT', ...)`.
2.  **Stop Accepting Traffic:** Call `server.close()`. This stops the HTTP server from accepting new connections while keeping existing connections active.
3.  **Drain Connections:** Allow active HTTP requests to finish processing.
4.  **Close Resources:** Shut down database connection pools, Redis clients, and file descriptors.
5.  **Clean Exit:** Call `process.exit(0)` to notify the host system that the server shut down cleanly.
6.  **Force Timeout:** Set a fallback timer. If the server does not exit within a specific timeout (e.g. 10–30 seconds) because of a hung request or socket, force an exit (`process.exit(1)`) to prevent the container from hanging forever.

---

### (2) Reality Metaphor
Imagine a restaurant closing at the end of the day.
- **Abrupt Shutdown (No Handler):** At closing time, the manager turns off the lights, locks the doors, and walks out. Customers eating dinner are left in the dark, and credit card payments fail mid-transaction.
- **Graceful Shutdown (Standard Procedure):** The manager locks the front door so no **new** customers can enter (**`server.close()`**). Customers already inside are allowed to finish their meals and pay (**draining connections**). The kitchen staff then cleans the grills and locks the food safe (**closing database pools**). Once the last customer leaves, the manager locks the exit doors and goes home (**`process.exit(0)`**).

---

### (3) JavaScript Graceful Shutdown Example

```javascript
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const server = app.listen(3000, () => console.log('Server active on port 3000'));

// 1. Intercept SIGTERM (Docker/Kubernetes shutdown request)
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Commencing graceful shutdown...');
  shutdown();
});

// 2. Intercept SIGINT (Ctrl+C manual interruption)
process.on('SIGINT', () => {
  console.log('SIGINT signal received. Commencing graceful shutdown...');
  shutdown();
});

function shutdown() {
  // A. Set a fallback timeout to force exit if cleanup hangs (e.g. 10 seconds)
  const forceExitTimeout = setTimeout(() => {
    console.error('Graceful shutdown took too long. Forcing termination...');
    process.exit(1); // Exit with failure code
  }, 10000);

  // B. Stop accepting new requests and drain active ones
  server.close(async () => {
    console.log('HTTP server closed. Cleaning up database connections...');
    
    try {
      // C. Close database connection pools cleanly
      await mongoose.connection.close();
      console.log('Database connections closed cleanly.');
      
      clearTimeout(forceExitTimeout); // Cancel force exit timer
      process.exit(0); // Exit cleanly
    } catch (err) {
      console.error('Error during database cleanup:', err.message);
      process.exit(1);
    }
  });
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting a fallback force-exit timeout

**The mistake:** Calling `server.close()` and expecting the server to exit without setting a fallback timeout escape hatch.

**Why it's wrong:** If a client opens an active **Websocket connection** or a database query hangs indefinitely, the server's close callback will never fire. The process will hang forever, preventing updates or scaling actions in your container deployment.

---



### Mistake 2: Killing Server Process Immediately on `SIGTERM` Without Waiting for Active HTTP Requests to Complete

**The mistake:** Calling `process.exit(0)` immediately inside `process.on('SIGTERM')` listener.

**Why it's wrong:** Terminating immediately drops active in-flight HTTP requests and breaks ongoing database transactions. Call `server.close()` to stop accepting new connections and finish active ones.

*Incorrect:*
```javascript
process.on('SIGTERM', () => {
  process.exit(0); // ❌ Immediately drops active in-flight client requests!
});
```

*Fix:*
```javascript
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
});
```

### Mistake 3: Forgetting Hard Timeout Limit on Graceful Shutdown Handlers (Hanging Process Trap)

**The mistake:** Waiting indefinitely for open sockets to close during `server.close()`.

**Why it's wrong:** If a long-polling socket or database query hangs, the graceful shutdown handler will hang forever, delaying deployment rollouts. Force-exit process after a timeout (e.g. 10 seconds).

*Incorrect:*
```javascript
// Graceful shutdown handler without fallback setTimeout force-exit
```

*Fix:*
```javascript
process.on('SIGTERM', () => {
  setTimeout(() => process.exit(1), 10000).unref(); // Force exit fallback after 10s
  server.close(() => process.exit(0));
});
```

## 5. Practice Exercises

### Exercise 1: Production Graceful Shutdown Coordinator

**Scenario:** Coordinates application teardown by stopping HTTP server listeners, draining DB connection pools, and flushing loggers within a 10s deadline.

**Requirements:**
1. Write executeGracefulShutdown(serverMock, dbPoolMock, timeoutMs).
2. Close server.
3. Close DB pool.
4. Enforce maximum timeout.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function executeGracefulShutdown(serverMock, dbPoolMock, timeoutMs = 10000) {
>   const steps = [];
>
>   const shutdownPromise = (async () => {
>     if (serverMock && typeof serverMock.close === "function") {
>       await new Promise(resolve => serverMock.close(resolve));
>       steps.push("SERVER_CLOSED");
>     }
>
>     if (dbPoolMock && typeof dbPoolMock.end === "function") {
>       await dbPoolMock.end();
>       steps.push("DB_DRAINED");
>     }
>
>     return { success: true, steps };
>   })();
>
>   const timeoutPromise = new Promise((_, reject) => {
>     setTimeout(() => reject(new Error("GRACEFUL_SHUTDOWN_TIMEOUT")), timeoutMs);
>   });
>
>   return Promise.race([shutdownPromise, timeoutPromise]);
> }
>
> // Verification tests
> const mockServer = { close: (cb) => cb() };
> const mockPool = { end: async () => {} };
>
> executeGracefulShutdown(mockServer, mockPool, 1000).then(res => {
>   console.assert(res.success === true, "Test 1 Failed");
>   console.assert(res.steps.includes("SERVER_CLOSED") && res.steps.includes("DB_DRAINED"), "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Graceful Shutdown Sequence**: Stop accepting new requests -> Finish active in-flight requests -> Drain DB pools -> Close loggers -> Exit process.
> 2. **Timeout Safety Net**: Enforces a hard deadline (e.g. 10s) using `Promise.race()` to prevent hanging processes indefinitely.
> 3. **Zero Dropped Requests**: Ensures zero in-flight HTTP requests are dropped during deployments.
> 
---

### Exercise 2: Active HTTP Request Draining Guard

**Scenario:** Tracks active HTTP socket connections to ensure all in-flight requests finish before server process exits.

**Requirements:**
1. Write createConnectionTracker(serverMock).
2. Track open sockets on `connection` event.
3. Destroy remaining idle sockets on shutdown.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createConnectionTracker(serverMock) {
>   const openSockets = new Set();
>
>   if (serverMock && typeof serverMock.on === "function") {
>     serverMock.on("connection", (socket) => {
>       openSockets.add(socket);
>       socket.on("close", () => openSockets.delete(socket));
>     });
>   }
>
>   return {
>     getActiveCount: () => openSockets.size,
>     destroyAllSockets() {
>       for (const socket of openSockets) {
>         if (typeof socket.destroy === "function") socket.destroy();
>       }
>       openSockets.clear();
>     }
>   };
> }
>
> // Verification tests
> const events = {};
> const mockServer = { on: (e, fn) => { events[e] = fn; } };
> const tracker = createConnectionTracker(mockServer);
>
> let destroyed = false;
> const mockSocket = { on: () => {}, destroy: () => { destroyed = true; } };
>
> events["connection"](mockSocket);
> console.assert(tracker.getActiveCount() === 1, "Test 1 Failed: Tracked 1 active socket");
>
> tracker.destroyAllSockets();
> console.assert(destroyed === true, "Test 2 Failed: Destroyed socket on force shutdown");
> ```
>
> #### Technical Explanation
>
> 1. **Socket Connection Tracking**: Tracking active TCP sockets allows identifying long-lived HTTP Keep-Alive connections during shutdown.
> 2. **`server.close()` Behavior**: `server.close()` stops listening for new connections but keeps existing open HTTP sockets alive.
> 3. **`server.closeIdleConnections()`**: Node.js v18.2.0+ provides native `.closeIdleConnections()` method to close non-active Keep-Alive sockets.
> 
---

### Exercise 3: Emergency Forced Exit Timeout Safety Net

**Scenario:** Schedules an un-refed emergency timer that forces `process.exit(1)` if graceful shutdown steps exceed maximum time limit.

**Requirements:**
1. Write setupEmergencyExitTimer(maxWaitMs, processMock).
2. Schedule timer.
3. Un-ref timer to avoid delaying clean exit.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function setupEmergencyExitTimer(maxWaitMs = 10000, processMock) {
>   const proc = processMock || process;
>
>   const timer = setTimeout(() => {
>     if (proc && typeof proc.exit === "function") {
>       proc.exit(1);
>     }
>   }, maxWaitMs);
>
>   if (timer && typeof timer.unref === "function") {
>     timer.unref(); // Don't hold event loop open if shutdown completes early!
>   }
>
>   return {
>     timer,
>     cancel: () => clearTimeout(timer)
>   };
> }
>
> // Verification tests
> let exited = false;
> const mockProc = { exit: (code) => { exited = true; } };
>
> const safety = setupEmergencyExitTimer(10, mockProc);
> setTimeout(() => {
>   console.assert(exited === true, "Test 1 Failed: Emergency timer triggered process.exit(1)");
> }, 20);
> ```
>
> #### Technical Explanation
>
> 1. **Un-refed Timers (`timer.unref()`)**: Allows the timer to run without keeping the Node.js event loop active if all async tasks finish.
> 2. **Non-Zero Exit Code**: Exiting with code 1 signals orchestrators (K8s/Docker) that process shutdown failed to complete gracefully.
> 3. **Failsafe Guarantee**: Guarantees container process will terminate even if database client pool drain deadlocks.
## 6. Related Terms
- [PM2 (Process Manager)](pm2.md) — Automatically sends SIGINT and awaits graceful shutdowns during updates.
- [Docker](docker.md) — Relies on SIGTERM handling to shut down containers cleanly.
- [Logging & Monitoring](logging_monitoring.md) — Related concept: Logging & Monitoring.

---

## 7. Key Takeaways
- Graceful shutdown prevents data loss and connection interruptions during restarts.
- OS managers signal shutdown requests using POSIX signals: `SIGTERM` and `SIGINT`.
- `server.close()` stops new connections while allowing active requests to finish.
- Close database connection pools and file resources during the shutdown phase.
- Always include a fallback `setTimeout` to force exit if connections hang.
- Call `process.exit(0)` for clean shutdowns; use `process.exit(1)` for errors or timeouts.
