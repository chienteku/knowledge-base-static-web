# PM2 (Process Manager)

> **Level 10 — Security & Production**
> An advanced, production-grade process manager for Node.js that keeps your application alive forever, restarts it if it crashes, and allows it to use all of the server's CPU cores.

---

## 1. Prerequisites
- [The Event Loop & Libuv](../level_01/event_loop.md) — Remember that Node.js runs on a Single Thread. PM2 fixes this limitation!
- [Node.js (Runtime Environment)](../level_01/nodejs.md) — How you usually run apps (`node server.js`).

---

## 2. Term Category
- **DevOps / Production Tooling**

---

## 3. Environment Context
- **Production Servers (VPS, AWS EC2, DigitalOcean)**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Development vs Production

**Problem:** In development, you use a tool called `nodemon` to restart your server every time you save a file. In production, you use `pm2`. Both of them restart the server. Why don't we just use `nodemon` in production?

**Expected output:**
> [!check]- Answer
> ```text
> `nodemon` restarts the server when FILES change. (Great for coding).
> `pm2` restarts the server when the APP CRASHES, and provides Load Balancing, logging, and performance monitoring. (Great for production).
> ```
> - What is the trigger that causes the restart in each tool?

---



### Exercise 2: PM2 Cluster Mode Launch Command

**Problem:** Write PM2 CLI command to start `server.js` in cluster mode using all available CPU cores.

**Expected output:**
> [!check]- Answer
> ```text
> pm2 start server.js -i max
> ```
> ```bash
> pm2 start server.js -i max
> ```
>
> **Explanation:** `-i max` launches PM2 cluster workers matching available CPU core count.

---

### Exercise 3: PM2 Ecosystem File Generation

**Problem:** Which PM2 command generates an `ecosystem.config.js` template file?

**Expected output:**
> [!check]- Answer
> ```text
> pm2 init (or pm2 ecosystem)
> ```
> ```bash
> pm2 init
> ```
>
> **Explanation:** `pm2 init` creates an `ecosystem.config.js` configuration file for managing app environments.

## 7. Related Terms
- [Docker](docker.md) — The modern alternative/companion to PM2. Docker also manages keeping processes alive and isolated.
- [The os & util Modules](../level_02/os_util_modules.md) — Related concept: The os & util Modules.
- [The cluster Module](cluster_module.md) — Related concept: The cluster Module.
- [Graceful Shutdown & Process Signals](graceful_shutdown.md) — Related concept: Graceful Shutdown & Process Signals.
- [Load Balancing](load_balancing.md) — Related concept: Load Balancing.
- [Logging & Monitoring](logging_monitoring.md) — Related concept: Logging & Monitoring.

---

## 8. Key Takeaways
- Never run raw `node server.js` in a production environment. If it crashes, it stays dead.
- **PM2** is a process manager that automatically restarts your app if it crashes.
- **Cluster Mode** allows PM2 to spawn multiple copies of your app, utilizing 100% of the server's CPU cores.
- If you use Cluster Mode, your app must be Stateless (no storing data in local variables), because the different processes do not share RAM.
