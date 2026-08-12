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

### Exercise 1: Cluster Setup

**Problem:** Write a primary block that detects if the server is running on a machine with less than 2 CPU cores. If it has only 1 core, run the server without forks. If it has 2 or more cores, fork workers to utilize all cores:

```javascript
const cluster = require('cluster');
const os = require('os');
const express = require('express');

const numCPUs = os.cpus().length;

if (numCPUs > 1 && cluster.isPrimary) {
  console.log(`Forking ${numCPUs} workers...`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Start single server instance directly
  const app = express();
  app.listen(3000, () => {
    console.log(`Server running directly on process ${process.pid}`);
  });
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Basic Cluster Setup

**Problem:** Write basic Node.js Cluster code forking workers for each CPU core if primary, or starting server if worker.

**Expected output:**
> [!check]- Answer
> ```text
> if (cluster.isPrimary) { os.cpus().forEach(() => cluster.fork()); } else { app.listen(3000); }
> ```
> ```javascript
> const cluster = require('cluster');
> const os = require('os');
> if (cluster.isPrimary) {
>   os.cpus().forEach(() => cluster.fork());
> } else {
>   app.listen(3000);
> }
> ```
>
> **Explanation:** Primary process forks workers; worker processes listen on the shared HTTP port.
> 
---

### Exercise 3: Port Sharing in Cluster

**Problem:** How can multiple clustered worker processes listen on the exact same HTTP port (3000) without `EADDRINUSE` errors?

**Expected output:**
> [!check]- Answer
> ```text
> The primary process opens the network socket and distributes incoming connections to workers using round-robin scheduling.
> ```
> ```text
> The primary process opens the network socket and distributes incoming connections to workers using round-robin scheduling.
> ```
>
> **Explanation:** Cluster primary hands off incoming TCP connections to worker processes transparently.
> 
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
