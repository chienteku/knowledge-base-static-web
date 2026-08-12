# The cluster Module

> **Level 10 — Security & Production**
> Forking the server across all CPU cores to use the whole machine.

---

## 1. Prerequisites
- [Child Processes (child_process)](child_processes.md) — The process-spawning concepts used under the hood.
- [Single-Threaded Architecture](../level_01/single_threaded.md) — The single-core limitation that clustering resolves.

---

## 2. Term Category

**Production / DevOps (Server Scaling Layer .)**: The cluster Module is a fundamental concept in this technology stack. **Level 10 — Security & Production**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, a Node.js application executes on a single CPU core. However, modern production servers typically have 4, 8, or 16 CPU cores. If you run your server as a single Node process, you leave the other CPU cores idle, wasting hardware capacity.

To utilize all available CPU cores, Node.js provides the built-in **`cluster` module**:
-   **Primary (Master) Process:** The main process. It does not handle network requests or listen on ports. Its sole job is to spawn duplicate child processes (known as **Workers**) using `cluster.fork()`.
-   **Worker Processes:** The child processes that run your actual application code (e.g. your Express server). All workers share the same server port (e.g. port 3000).
-   **Round-Robin Routing:** The Primary process acts as an internal load balancer, receiving incoming TCP connections and routing them to the workers using a Round-Robin scheduling algorithm.
-   **Self-Healing:** If a worker process crashes due to an unhandled error, the Primary process detects the exit event and immediately forks a new worker to replace it, maintaining uptime.

---

### (2) Reality Metaphor
Imagine a busy fast-food restaurant.
- **Single Process (One Cashier):** The restaurant has 8 registers (**CPU cores**), but only 1 cashier working at register 1. A long queue of customers forms. The cashier works as fast as they can, but the other 7 registers sit empty. Customers experience long wait times.
- **Clustered Process (Dispatcher & Cashiers):** The restaurant places a dispatcher at the entrance (**Primary process**). They hire 8 cashiers to staff all 8 registers (**Worker processes**). As customers enter, the dispatcher routes them: *"Customer 1 go to Register 1, Customer 2 go to Register 2..."* using a rotation. If cashier 3 falls ill (**worker crash**), the dispatcher immediately calls a replacement cashier from the breakroom to keep all registers open.

---

### (3) JavaScript Implementation Example

A self-healing, multi-core Express cluster implementation:

```javascript
const cluster = require('cluster');
const os = require('os');
const express = require('express');

// 1. Check if this is the orchestration Primary process
if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Primary process ${process.pid} is running.`);
  console.log(`Spawning ${numCPUs} worker servers...`);

  // 2. Fork a worker process for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // 3. Self-Healing: Restart workers if they crash
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker process ${worker.process.pid} crashed. Restarting...`);
    cluster.fork();
  });

} else {
  // 4. WORKER BRANCH: Runs the actual Express server
  const app = express();
  
  app.get('/', (req, res) => {
    res.send(`Hello from Worker Process ID: ${process.pid}`);
  });

  // All workers share the same port 3000!
  app.listen(3000, () => {
    console.log(`Worker process ${process.pid} started.`);
  });
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Keeping state in local memory inside clustered applications

**The mistake:** Storing user sessions, shopping carts, or request counters in a local JavaScript object inside your application code when running a cluster:

```javascript
// DANGER: This local session object is isolated inside each individual worker process!
const sessions = {}; 

app.post('/login', (req, res) => {
  sessions[req.body.userId] = { authenticated: true };
  res.send('Logged in');
});
```

**Why it's wrong:** Each worker process has its own isolated memory heap. If a user logs in on Worker 1, their session data is stored in Worker 1's memory. When they make their next request, the Primary process might route them to Worker 2. Since Worker 2 does not have access to Worker 1's memory, the user is prompted to log in again.

*Fix:* Clustered applications must be **completely stateless**. Store all shared state (like user sessions or temporary tokens) in an external, shared database or in-memory store like Redis.

---



### Mistake 2: Storing In-Memory State (Sessions, Caches) Across Clustered Forked Workers

**The mistake:** Storing user session objects in a local variable `const sessions = {}` in a clustered Node.js server.

**Why it's wrong:** Each clustered worker is an independent OS process with isolated memory space. Subsequent requests routed to a different worker process will miss the session. Use Redis.

*Incorrect:*
```javascript
const sessions = {}; // ❌ State is not shared across clustered worker processes!
```

*Fix:*
```javascript
// Use centralized Redis store for shared session and cache state:
const RedisStore = require('connect-redis');
```

### Mistake 3: Failing to Respawn Worker Processes When a Cluster Worker Exits

**The mistake:** Forking cluster workers without listening for `cluster.on('exit')` to restart dead workers.

**Why it's wrong:** If a worker process crashes due to an uncaught exception, overall server capacity drops. Listen for `'exit'` and fork a replacement worker process.

*Incorrect:*
```javascript
if (cluster.isPrimary) {
  for (let i = 0; i < cpus; i++) cluster.fork();
  // ❌ Missing exit listener! Dead workers are never replaced!
}
```

*Fix:*
```javascript
cluster.on('exit', (worker, code, signal) => {
  console.log(`Worker ${worker.process.pid} died. Respawning...`);
  cluster.fork(); // Respawn new worker
});
```

## 5. Practice Exercises

### Exercise 1: CPU-Core Multi-Worker Cluster Manager

**Scenario:** Uses core `cluster` module to fork primary master process into multiple worker processes across available CPU cores (`os.cpus().length`).

**Requirements:**
1. Write setupClusterManager(clusterMock, osMock).
2. If isPrimary, fork worker per CPU core.
3. If isWorker, run HTTP server.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function setupClusterManager(clusterMock, osMock, startWorkerServerFn) {
>   const isPrimary = clusterMock.isPrimary || clusterMock.isMaster;
>   const numCpus = (osMock?.cpus() || [{}]).length;
>
>   const spawnedWorkers = [];
>
>   if (isPrimary) {
>     for (let i = 0; i < numCpus; i++) {
>       const worker = clusterMock.fork();
>       spawnedWorkers.push(worker);
>     }
>     return { isPrimary: true, workerCount: spawnedWorkers.length };
>   }
>
>   startWorkerServerFn();
>   return { isPrimary: false, workerCount: 0 };
> }
>
> // Verification tests
> const forked = [];
> const mockClusterPrimary = { isPrimary: true, fork: () => { const w = {}; forked.push(w); return w; } };
> const mockOs = { cpus: () => [{}, {}, {}, {}] };
>
> const res = setupClusterManager(mockClusterPrimary, mockOs, () => {});
> console.assert(res.isPrimary === true, "Test 1 Failed");
> console.assert(res.workerCount === 4, "Test 2 Failed: Forked 4 workers for 4 CPU cores");
> ```
>
> #### Technical Explanation
>
> 1. **Node.js Cluster Module**: Allows taking advantage of multi-core systems by spawning a cluster of worker Node.js processes sharing server ports.
> 2. **Primary / Worker Roles**: Primary process manages worker lifecycles; Worker processes handle actual HTTP network requests.
> 3. **IPC Master Control**: Primary and worker processes communicate using built-in IPC channels.
> 
---

### Exercise 2: Zero-Downtime Rolling Worker Restart

**Scenario:** Performs zero-downtime rolling restarts across cluster workers by replacing workers sequentially one by one.

**Requirements:**
1. Write rollingRestartWorkers(workersArray, clusterMock).
2. Disconnect old worker.
3. Fork replacement worker before proceeding.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function rollingRestartWorkers(workersArray = [], clusterMock) {
>   const restarted = [];
>
>   for (const worker of workersArray) {
>     if (typeof worker.disconnect === "function") {
>       worker.disconnect();
>     }
>     const newWorker = clusterMock.fork();
>     restarted.push(newWorker);
>   }
>
>   return {
>     restartedCount: restarted.length,
>     success: true
>   };
> }
>
> // Verification tests
> let disconnectedCount = 0;
> let forkedCount = 0;
>
> const mockWorkers = [
>   { disconnect: () => { disconnectedCount++; } },
>   { disconnect: () => { disconnectedCount++; } }
> ];
>
> const mockCluster = { fork: () => { forkedCount++; return {}; } };
>
> rollingRestartWorkers(mockWorkers, mockCluster).then(res => {
>   console.assert(disconnectedCount === 2, "Test 1 Failed");
>   console.assert(forkedCount === 2, "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Zero-Downtime Deployments**: Sequential rolling restarts ensure active HTTP requests complete on old workers while new workers spin up.
> 2. **`worker.disconnect()`**: Closes server connection listeners on old worker, allowing it to finish active requests before exiting.
> 3. **Load Balancer Traffic Rerouting**: Master process automatically stops routing new TCP connections to disconnected workers.
> 
---

### Exercise 3: Worker Process Crash Recovery & Auto-Respawn Guard

**Scenario:** Attaches an `'exit'` listener on primary cluster process to automatically respawn worker processes if they crash unexpectedly.

**Requirements:**
1. Write attachWorkerCrashRecovery(clusterMock, loggerMock).
2. Listen for `cluster.on('exit')`.
3. Respawn dead worker via `cluster.fork()`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function attachWorkerCrashRecovery(clusterMock, loggerMock) {
>   const respawned = [];
>
>   clusterMock.on("exit", (worker, code, signal) => {
>     if (loggerMock && typeof loggerMock.warn === "function") {
>       loggerMock.warn(`Worker ${worker.process?.pid || "unknown"} died (code: ${code}, signal: ${signal}). Respawning...`);
>     }
>
>     const newWorker = clusterMock.fork();
>     respawned.push(newWorker);
>   });
>
>   return { respawnedList: respawned };
> }
>
> // Verification tests
> const events = {};
> const mockCluster = {
>   on: (e, fn) => { events[e] = fn; },
>   fork: () => ({ pid: 999 })
> };
>
> const recovery = attachWorkerCrashRecovery(mockCluster, { warn: () => {} });
> events["exit"]({ process: { pid: 101 } }, 1, null);
>
> console.assert(recovery.respawnedList.length === 1, "Test 1 Failed: Auto-respawned crashed worker");
> ```
>
> #### Technical Explanation
>
> 1. **High Availability Auto-Healing**: Ensures server cluster capacity recovers automatically if a worker crashes due to an unhandled exception.
> 2. **Worker Exit Code Inspection**: Differentiates between intentional shutdowns (`code === 0`) and unexpected crashes (`code !== 0`).
> 3. **Crash Loop Mitigation**: Production supervisors (PM2, K8s) limit rapid crash-loop respawn frequencies.
## 6. Related Terms
- [PM2 (Process Manager)](pm2.md) — Production tool automating cluster creation and management.
- [Load Balancing](load_balancing.md) — The networking architecture distributing traffic across server instances.
- [Child Processes (child_process)](child_processes.md) — Related concept: Child Processes (child_process).
- [Worker Threads](worker_threads.md) — Related concept: Worker Threads.

---

## 7. Key Takeaways
- The `cluster` module enables a Node.js server to run across all available CPU cores.
- The Primary process orchestrates workers but does not handle requests directly.
- Worker processes share the same port and handle incoming network requests.
- The Primary process balances connection traffic using a Round-Robin algorithm.
- Clustered applications must be stateless; share memory via external stores like Redis.
- If a worker process crashes, the Primary process should fork a replacement to maintain availability.
