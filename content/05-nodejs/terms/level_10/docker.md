# Docker

> **Level 10 — Security & Production**
> A technology that packages your Node.js application, its dependencies, and its exact operating system environment into a standardized "shipping container" that runs perfectly on any computer in the world.

---

## 1. Prerequisites
- [Environment Variables (dotenv)](env_vars.md) — Docker heavily relies on these to inject configuration into the container.
- [PM2 (Process Manager)](pm2.md) — Docker is the modern, cloud-native alternative to running raw PM2 on a server.

---

## 2. Term Category

**DevOps / Cloud Architecture (Deployment / System Architecture)**: Docker is a fundamental concept in this technology stack. **Level 10 — Security & Production**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
**The infamous developer excuse: "But it works on my machine!"**
You build a Node.js app on your Macbook (using Node v18). It works perfectly. You deploy it to the company's AWS Linux server (which happens to have Node v14 installed). The app crashes instantly because of version differences.
**Docker** was invented to kill the phrase "it works on my machine."
Instead of installing Node.js directly on the AWS server, Docker allows you to create a "Container". You put your code, your specific Node v18 version, and a mini Linux operating system inside this Container. 
You then ship the *entire container* to AWS. Because the container has its own internal environment, it is guaranteed to run exactly the same way everywhere.

### (2) Images vs Containers
- **The Dockerfile (The Recipe):** A text file explaining how to build your app. (`FROM node:18`, `COPY . .`, `RUN npm install`).
- **The Image (The Blueprint):** Running the Dockerfile produces an Image. It is a frozen, read-only snapshot of your app and the OS.
- **The Container (The Running App):** When you "Start" an Image, it becomes a Container. It is a running, breathing instance of your application.

### (3) The Kubernetes Connection
If you work at Netflix, you don't run 1 Container. You run 10,000 Containers. 
To manage thousands of containers (starting them, stopping them, load-balancing them), the industry uses an orchestrator called **Kubernetes (K8s)**. Kubernetes *only* speaks the language of Containers. Therefore, if you want your Node.js app to scale automatically in the modern cloud, it MUST be put inside a Docker container.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Copying `node_modules` into the Image

**The mistake:** A developer writes a `Dockerfile` that copies their entire Macbook project folder (including the heavy `node_modules` folder) into the Docker image. 

**Why it's wrong:** The `node_modules` folder contains compiled C++ binaries that are specific to the Macbook's Apple Silicon chip. When the Docker container tries to run on an AWS Linux chip, those binaries fail, and the app crashes. 
**Golden Rule:** Always add `node_modules` to your `.dockerignore` file! You should only copy `package.json`, and let the `Dockerfile` run `npm install` *inside* the Linux container to get the correct binaries.

---



### Mistake 2: Running Node.js Application as Root User inside Docker Containers (Security Risk)

**The mistake:** Omitting `USER node` directive in production Dockerfile.

**Why it's wrong:** By default, Docker containers run commands as root. If a process vulnerability is exploited, attackers gain root access to container system files. Switch to non-root `USER node`.

*Incorrect:*
```javascript
# In Dockerfile:
CMD ["node", "server.js"] # ❌ Runs as root user!
```

*Fix:*
```javascript
# In Dockerfile:
USER node
CMD ["node", "server.js"] # Runs safely as non-root node user
```

### Mistake 3: Copying `node_modules` into Docker Images via `COPY . .` Without `.dockerignore`

**The mistake:** Omitting `.dockerignore` and copying local host `node_modules` into container image.

**Why it's wrong:** Copying local `node_modules` overwrites container binaries with local OS binaries (e.g. macOS binaries on Linux container), causing binary execution crashes. Exclude `node_modules` in `.dockerignore`.

*Incorrect:*
```javascript
# Missing .dockerignore file; copying local host OS node_modules
```

*Fix:*
```javascript
# Create .dockerignore file:
node_modules
.git
```

## 5. Practice Exercises

### Exercise 1: Docker Container Environment Variable Loader & Validator

**Scenario:** Validates runtime environment variables supplied to Node.js Docker containers during container startup.

**Requirements:**
1. Write validateDockerContainerEnv(envObj, requiredKeysArray).
2. Verify required keys exist.
3. Return validation status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateDockerContainerEnv(envObj = {}, requiredKeysArray = []) {
>   const missingKeys = [];
>
>   for (const key of requiredKeysArray) {
>     if (!envObj[key] || !String(envObj[key]).trim()) {
>       missingKeys.push(key);
>     }
>   }
>
>   return {
>     isValid: missingKeys.length === 0,
>     missingKeys,
>     nodeEnv: envObj.NODE_ENV || "development"
>   };
> }
>
> // Verification tests
> const env = { NODE_ENV: "production", PORT: "8080", DB_URL: "postgres://..." };
> const res = validateDockerContainerEnv(env, ["PORT", "DB_URL", "JWT_SECRET"]);
>
> console.assert(res.isValid === false, "Test 1 Failed");
> console.assert(res.missingKeys.includes("JWT_SECRET"), "Test 2 Failed: Flagged missing JWT_SECRET");
> ```
>
> #### Technical Explanation
>
> 1. **Docker Container Configuration**: Docker containers receive environment configurations dynamically via `docker run -e` or K8s ConfigMaps.
> 2. **Fail-Fast Container Startup**: Validating environment variables at startup prevents silent runtime crashes halfway through execution.
> 3. **NODE_ENV=production Rule**: Always set `NODE_ENV=production` inside Docker containers to disable verbose dev logs and enable express caching.
> 
---

### Exercise 2: Docker SIGTERM Signal Handling & Graceful Exit

**Scenario:** Attaches a `SIGTERM` signal listener to process object to handle container stop requests issued by Docker (`docker stop`).

**Requirements:**
1. Write setupDockerSignalHandler(processMock, serverMock).
2. Listen for `SIGTERM`.
3. Stop HTTP server cleanly.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function setupDockerSignalHandler(processMock, serverMock) {
>   let isShuttingDown = false;
>
>   processMock.on("SIGTERM", () => {
>     isShuttingDown = true;
>     if (serverMock && typeof serverMock.close === "function") {
>       serverMock.close();
>     }
>   });
>
>   return {
>     isShuttingDown: () => isShuttingDown
>   };
> }
>
> // Verification tests
> const events = {};
> const mockProc = { on: (e, fn) => { events[e] = fn; } };
> let serverClosed = false;
> const mockServer = { close: () => { serverClosed = true; } };
>
> const handler = setupDockerSignalHandler(mockProc, mockServer);
> events["SIGTERM"]();
>
> console.assert(handler.isShuttingDown() === true, "Test 1 Failed");
> console.assert(serverClosed === true, "Test 2 Failed: Closed HTTP server on SIGTERM");
> ```
>
> #### Technical Explanation
>
> 1. **Docker `SIGTERM` Signal**: When executing `docker stop`, Docker sends `SIGTERM` to PID 1, waiting 10 seconds before issuing `SIGKILL`.
> 2. **PID 1 Problem in Containers**: If Node.js runs as PID 1 without an init system (Tini/dumb-init), it does not forward kernel signals unless registered explicitly.
> 3. **Graceful Container Teardown**: Allows finishing active HTTP requests and closing DB pools before container stops.
> 
---

### Exercise 3: Docker Container Healthcheck Endpoint

**Scenario:** Implements a Docker `/healthz` HTTP health check endpoint used by `HEALTHCHECK` instructions in Dockerfiles.

**Requirements:**
1. Write handleDockerHealthcheck(dbMock, redisMock).
2. Ping database and Redis.
3. Return 200 OK if healthy, 503 if degraded.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function handleDockerHealthcheck(dbMock, redisMock) {
>   try {
>     const dbOk = await dbMock.ping();
>     const redisOk = await redisMock.ping();
>
>     if (dbOk && redisOk) {
>       return { status: 200, body: { status: "UP", db: "CONNECTED", redis: "CONNECTED" } };
>     }
>     return { status: 503, body: { status: "DOWN", db: dbOk ? "UP" : "DOWN", redis: redisOk ? "UP" : "DOWN" } };
>   } catch (err) {
>     return { status: 503, body: { status: "DOWN", error: err.message } };
>   }
> }
>
> // Verification tests
> const db = { ping: async () => true };
> const redis = { ping: async () => true };
>
> handleDockerHealthcheck(db, redis).then(res => {
>   console.assert(res.status === 200, "Test 1 Failed: Healthy container 200 OK");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Dockerfile HEALTHCHECK**: Instructs Docker engine how to test container readiness (e.g. `HEALTHCHECK CMD curl -f http://localhost:8080/healthz`).
> 2. **Orchestrator Readiness Probes**: Kubernetes uses `/healthz` endpoints for Liveness and Readiness probes.
> 3. **503 Service Unavailable**: Returning 503 instructs container orchestrator to restart unhealthy container instances.
## 6. Related Terms
- [PM2 (Process Manager)](pm2.md) — While you can use PM2 inside Docker, Docker itself usually handles the "restarting if crashed" logic natively.
- [Node.js (Runtime Environment)](../level_01/nodejs.md) — The language you are containerizing!
- [Environment Variables (dotenv)](env_vars.md) — Related concept: Environment Variables (dotenv).
- [Graceful Shutdown & Process Signals](graceful_shutdown.md) — Related concept: Graceful Shutdown & Process Signals.
- [Reverse Proxy (Nginx)](reverse_proxy.md) — Related concept: Reverse Proxy (Nginx).

---

## 7. Key Takeaways
- **Docker** packages your app and its specific environment into a standardized container.
- It completely eliminates the "it works on my machine" problem, because the environment is frozen inside the container.
- **Images** are the read-only templates. **Containers** are the running instances.
- Docker is the fundamental building block of modern cloud architecture (AWS, Google Cloud, Kubernetes).
- Always use a `.dockerignore` file to prevent copying local `node_modules` into your Linux containers!
