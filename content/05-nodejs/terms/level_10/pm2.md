# PM2 (Process Manager)

> **Level 10 — Security & Production**
> An advanced, production-grade process manager for Node.js that keeps your application alive forever, restarts it if it crashes, and allows it to use all of the server's CPU cores.

---

## 1. Prerequisites
- [The Event Loop & Libuv](../level_01/event_loop.md) — Remember that Node.js runs on a Single Thread. PM2 fixes this limitation!
- [Node.js (Runtime Environment)](../level_01/nodejs.md) — How you usually run apps (`node server.js`).

---

## 2. Term Category

**DevOps / Production Tooling (Production Servers)**: PM2 (Process Manager) is a fundamental concept in this technology stack. **Level 10 — Security & Production**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you deploy your app to a production server and run `node server.js`, you have two massive problems:
1. **The Crash:** If your code has a bug and throws a fatal error, the Node process exits. Your website goes offline permanently until you manually log into the server and restart it.
2. **The Single Thread:** If you rent an expensive server with 8 CPU Cores, running `node server.js` will only use **1 Core**. The other 7 cores will sit at 0% usage while your users complain about a slow website.

**PM2 (Process Manager 2)** solves both of these problems instantly.

### (2) The "Keep Alive" Daemon
Instead of running `node server.js`, you run `pm2 start server.js`.
PM2 acts as a watchdog. It runs in the background (as a Daemon). If your Node.js app crashes, PM2 instantly detects it and restarts the app within milliseconds. Your website stays online forever.

### (3) Cluster Mode (Multi-Threading)
PM2 solves the single-thread problem using "Cluster Mode." 
By running `pm2 start server.js -i max`, PM2 will look at the server, see 8 CPU cores, and automatically launch 8 identical copies of your Node.js application!
PM2 then acts as a Load Balancer. When 8 users request the homepage, PM2 sends User 1 to Core 1, User 2 to Core 2, etc. You just multiplied your server's performance by 8x with a single command.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing data in RAM while in Cluster Mode

**The mistake:** A developer uses an array in memory to store active chat users: `const activeUsers = []`. They deploy the app using PM2 Cluster Mode on a 4-core server.

**Why it's wrong:** Cluster Mode spawns 4 completely separate, isolated Node processes. They DO NOT share memory! If Bob connects to Core 1, he goes into Core 1's array. If Alice connects to Core 2, she goes into Core 2's array. Core 1 has no idea Alice exists. The chat feature completely breaks.
**Golden Rule:** When using PM2 Cluster Mode (or any horizontal scaling), your Node.js app MUST be Stateless. All shared data (like active users or sessions) must be stored in an external database like Redis.

---



### Mistake 2: Running PM2 inside Single-App Docker Containers (Anti-Pattern Layering)

**The mistake:** Using PM2 as `CMD ["pm2-runtime", "start", ...]` inside single-app Docker containers.

**Why it's wrong:** Docker containers are designed to run a single process (PID 1). Layering PM2 inside Docker adds unneeded process overhead and complicates container signal management. Let Docker/Kubernetes handle process restarts.

*Incorrect:*
```javascript
# In Dockerfile:
RUN npm install -g pm2
CMD ["pm2-runtime", "server.js"] // ❌ Unneeded process manager inside Docker!
```

*Fix:*
```javascript
# In Dockerfile:
CMD ["node", "server.js"] // Let Docker handle process lifecycle directly
```

### Mistake 3: Using `pm2 restart` Instead of `pm2 reload` for Zero-Downtime Production Updates

**The mistake:** Running `pm2 restart app` during live production deployments.

**Why it's wrong:** `pm2 restart` kills all worker processes simultaneously, creating service downtime during restart. `pm2 reload` performs a zero-downtime rolling update worker by worker.

*Incorrect:*
```javascript
pm2 restart my-app # ❌ Drops active connections simultaneously!
```

*Fix:*
```javascript
pm2 reload my-app # Zero-downtime rolling reload
```

## 5. Practice Exercises

### Exercise 1: PM2 Ecosystem File Configuration Generator

**Scenario:** Generates production `ecosystem.config.js` settings for PM2 cluster mode deployment.

**Requirements:**
1. Write generatePm2Config(appName, scriptPath, instances).
2. Set cluster mode (`exec_mode: 'cluster'`).
3. Set max_memory_restart.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function generatePm2Config(appName, scriptPath = "./app.js", instances = "max") {
>   return {
>     apps: [
>       {
>         name: appName,
>         script: scriptPath,
>         instances: instances,
>         exec_mode: "cluster",
>         max_memory_restart: "1G",
>         env_production: {
>           NODE_ENV: "production"
>         }
>       }
>     ]
>   };
> }
>
> // Verification tests
> const config = generatePm2Config("api-server", "./server.js", 4);
> console.assert(config.apps[0].name === "api-server", "Test 1 Failed");
> console.assert(config.apps[0].exec_mode === "cluster", "Test 2 Failed");
> console.assert(config.apps[0].max_memory_restart === "1G", "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **PM2 Process Manager**: Production process manager providing cluster mode, auto-restarts, zero-downtime reloads, and log management.
> 2. **PM2 Cluster Mode**: Automatically forks application across all available CPU cores using Node.js `cluster` module.
> 3. **`max_memory_restart`**: Restarts worker process if RAM usage exceeds configured threshold (e.g. `1G`).
> 
---

### Exercise 2: PM2 Programmatic Application Reload Controller

**Scenario:** Calls PM2 API programmatically (`pm2.reload()`) to reload application workers with zero downtime.

**Requirements:**
1. Write reloadPm2Application(pm2Mock, appName).
2. Connect to PM2.
3. Reload app and disconnect.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function reloadPm2Application(pm2Mock, appName) {
>   return new Promise((resolve, reject) => {
>     pm2Mock.connect((err) => {
>       if (err) return reject(err);
>
>       pm2Mock.reload(appName, (reloadErr, proc) => {
>         pm2Mock.disconnect();
>         if (reloadErr) return reject(reloadErr);
>         resolve({ success: true, reloadedApp: appName });
>       });
>     });
>   });
> }
>
> // Verification tests
> const mockPm2 = {
>   connect: (cb) => cb(null),
>   reload: (app, cb) => cb(null, [{ name: app }]),
>   disconnect: () => {}
> };
>
> reloadPm2Application(mockPm2, "api-server").then(res => {
>   console.assert(res.success === true, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **`pm2 reload` vs `pm2 restart`**: `pm2 reload` performs 0-downtime rolling worker restart; `pm2 restart` kills and restarts all workers simultaneously.
> 2. **Programmatic PM2 API**: Allows triggering deploys and reloads directly inside CI/CD deployment scripts.
> 3. **PM2 Connection Teardown**: Always call `pm2.disconnect()` after PM2 API commands to close daemon socket connection.
> 
---

### Exercise 3: PM2 Memory Threshold Auto-Restart Evaluator

**Scenario:** Evaluates current process memory against PM2 `max_memory_restart` thresholds to determine if a worker needs restarting.

**Requirements:**
1. Write evaluatePm2MemoryThreshold(currentMemoryMb, limitMemoryMb).
2. Return restart recommendation.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function evaluatePm2MemoryThreshold(currentMemoryMb, limitMemoryMb = 1024) {
>   const isOverLimit = currentMemoryMb >= limitMemoryMb;
>
>   return {
>     currentMemoryMb,
>     limitMemoryMb,
>     shouldRestart: isOverLimit,
>     action: isOverLimit ? "TRIGGER_PM2_WORKER_RELOAD" : "NORMAL_EXECUTION"
>   };
> }
>
> // Verification tests
> console.assert(evaluatePm2MemoryThreshold(1200, 1024).shouldRestart === true, "Test 1 Failed");
> console.assert(evaluatePm2MemoryThreshold(500, 1024).shouldRestart === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **PM2 Memory Watchdog**: PM2 monitors worker memory consumption every 30 seconds.
> 2. **Memory Leak Safeguard**: Restars leaking workers in cluster mode without dropping active traffic.
> 3. **Graceful Worker Swap**: Spins up new replacement worker before stopping memory-exceeded worker.
## 6. Related Terms
- [Docker](docker.md) — The modern alternative/companion to PM2. Docker also manages keeping processes alive and isolated.
- [The os & util Modules](../level_02/os_util_modules.md) — Related concept: The os & util Modules.
- [The cluster Module](cluster_module.md) — Related concept: The cluster Module.
- [Graceful Shutdown & Process Signals](graceful_shutdown.md) — Related concept: Graceful Shutdown & Process Signals.
- [Load Balancing](load_balancing.md) — Related concept: Load Balancing.
- [Logging & Monitoring](logging_monitoring.md) — Related concept: Logging & Monitoring.

---

## 7. Key Takeaways
- Never run raw `node server.js` in a production environment. If it crashes, it stays dead.
- **PM2** is a process manager that automatically restarts your app if it crashes.
- **Cluster Mode** allows PM2 to spawn multiple copies of your app, utilizing 100% of the server's CPU cores.
- If you use Cluster Mode, your app must be Stateless (no storing data in local variables), because the different processes do not share RAM.
