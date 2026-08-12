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

### Exercise 1: Virtual Machines vs Docker

**Problem:** Before Docker, people used Virtual Machines (VMs) to isolate applications. A VM installs an entire heavy 20GB Windows or Ubuntu Operating System just to run one Node.js app. Why is a Docker Container better than a VM?

**Expected output:**
> [!check]- Answer
> ```text
> Containers are incredibly lightweight. Instead of installing a full 20GB OS, a container shares the host computer's operating system kernel. A Node.js Docker image might only be 100 Megabytes, and it boots up in 1 second instead of 1 minute!
> ```
> - Think about size and speed.
> 
---



### Exercise 2: Multi-Stage Dockerfile Pattern

**Problem:** Why use multi-stage Docker builds for Node.js applications?

**Expected output:**
> [!check]- Answer
> ```text
> To separate build steps (TypeScript compilation, devDependencies) from final lean production runtime image.
> ```
> ```dockerfile
> FROM node:18 AS build
> WORKDIR /app
> COPY package*.json ./
> RUN npm ci
> COPY . .
> RUN npm run build
>
> FROM node:18-alpine AS runner
> WORKDIR /app
> COPY --from=build /app/dist ./dist
> COPY package*.json ./
> RUN npm ci --omit=dev
> CMD ["node", "dist/index.js"]
> ```
>
> **Explanation:** Multi-stage builds produce tiny production images containing zero dev dependencies.
> 
---

### Exercise 3: Docker Process Signal Passing (PID 1 Problem)

**Problem:** Why use `dumb-init` or Tini as entrypoint in Docker containers running Node.js?

**Expected output:**
> [!check]- Answer
> ```text
> To act as PID 1 init process, properly forwarding SIGTERM signals to Node for graceful shutdown and reaping zombie processes.
> ```
> ```text
> To act as PID 1 init process, properly forwarding SIGTERM signals to Node for graceful shutdown and reaping zombie processes.
> ```
>
> **Explanation:** Node.js as PID 1 does not handle default kernel signals properly without an init wrapper.
> 
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
