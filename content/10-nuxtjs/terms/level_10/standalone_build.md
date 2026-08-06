# Standalone Build (Node server)

> **Level 10 — Error Handling & Production**
> The self-contained production bundle created inside `.output/` after building the application, allowing hosting on any Node.js environment without root project source code or dependencies.

---

## 1. Prerequisites
- [Nitro Engine](../level_01/nitro_engine.md) — The engine that compiles the standalone server bundle.
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The rendering mode that requires a running server to operate.

---

## 2. Term Category

**Server & Nitro Engine** (Zero-Dependency Node Server Bundle): Standalone Node Server builds (`preset: "node-server"`) package the application into a self-contained Node server runnable with `node .output/server/index.mjs`.



---

## 3. Explanation

### Environment Context
- **Server Only** (Runs as a persistent backend Node.js process to listen to client requests).

### (1) Design Motivation — "Why did we design this?"
In development, you run `npm run dev`, which compiles code on-the-fly, watches files, and hot-reloads the browser. This process consumes significant memory, includes dev-only code, and is insecure for production.

For production, you need a bundle that is:
1.  **Fast:** Pre-compiled and minified for performance.
2.  **Secure:** Stripped of source code files, source maps, and development dependencies.
3.  **Portable:** Able to run on any virtual private server (VPS) or container without needing to compile dependencies again.

A **Standalone Build** accomplishes this. When you run `npm run build`, Nuxt compiles the application into the `.output/` directory, which is completely isolated from your workspace code.

---

### (2) Running the Standalone Bundle
The output of a production build consists of:
-   **`.output/public/`:** Static HTML files, images, CSS, and JS.
-   **`.output/server/`:** A compiled Node.js backend.

To launch the application on a production server (like AWS, DigitalOcean, or Heroku), copy only the `.output` directory to the server and run:

```bash
# Start the production application using standard Node.js
node .output/server/index.mjs
```

---

### (3) Self-Containment (No `node_modules` required!)
A common issue in Node deployment is running `npm install` on the production server, which can fail due to version conflicts. 

Nitro builds the `.output/server/` bundle with all necessary server dependencies pre-bundled. You do **not** need your root project's `node_modules` or `package.json` to run the standalone build. You only need a system with Node.js installed.

---

### (4) Process Management (PM2 & Docker)
Because raw Node.js processes can crash on unhandled errors, production environments run standalone builds using process managers like **PM2** or inside **Docker** containers to manage restarts and clustering:

```bash
# PM2 command to run the server in the background with auto-restart
pm2 start .output/server/index.mjs --name "nuxt-app"
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Copying the whole root repository to production

**The mistake:** Uploading the entire development directory (including `components/`, `pages/`, `node_modules/`, and `.git/`) to a production server and running `npm run build` there.

**Why it's wrong:** Exposing your source code and development configuration files on a production server increases security risks. Additionally, compiling on production servers can consume significant CPU and memory resources, potentially causing downtime.

**Golden Rule:** Build your application in a CI/CD pipeline (such as GitHub Actions). Once built, transfer only the generated `.output/` directory to the production server.

---

### Mistake 2: Installing `node_modules` in Production Containers Running `.output/server/index.mjs`

**The mistake:** Running `npm install` inside production Docker container after building `.output/`.

**Why it's wrong:** Nitro standalone build bundles ALL required production dependencies directly inside `.output/server/`. Running `npm install` in production containers is redundant and inflates Docker image size.

*Incorrect:*
```vue
/* Running npm install inside production container running .output/server/index.mjs */
```

*Fix:*
```vue
/* Run node .output/server/index.mjs directly without installing node_modules */
```

---

### Mistake 3: Forgetting Environment Variables When Launching `.output/server/index.mjs`

**The mistake:** Running `node .output/server/index.mjs` without passing `PORT` or `NITRO_PORT` environment variables.

**Why it's wrong:** Nitro defaults to port 3000 unless `PORT` or `NITRO_PORT` environment variables are supplied at startup.

*Incorrect:*
```vue
node .output/server/index.mjs // Defaults to port 3000 without configuration
```

*Fix:*
```vue
PORT=8080 NODE_ENV=production node .output/server/index.mjs
```


---

## 5. Practice Exercises

### Exercise 1: Building a Standalone Docker Container for Nuxt 3

**Scenario:**
Write a minimal production `Dockerfile` leveraging standalone Node server output (`.output/server`).

**Requirements:**
1. Write multi-stage Dockerfile copying `.output/`.

> [!check]- Answer
>
> #### Implementation
>
> ```dockerfile
> # Production Dockerfile
> FROM node:18-alpine AS runner
> WORKDIR /app
> 
> # Copy pre-built standalone server output
> COPY .output /app/.output
> 
> ENV PORT=3000
> ENV NODE_ENV=production
> EXPOSE 3000
> 
> CMD ["node", ".output/server/index.mjs"]
> ```
> 
> #### Technical Explanation
>
> 1. Standalone builds require ONLY the `.output/` directory and a Node.js runtime.
> 2. Omits devDependencies, TypeScript compilers, and root `node_modules/` from deployment images.
> 3. Reduces Docker container image size from 1GB+ down to ~100MB.
> 
---

### Exercise 2: Setting Environment Variables in Standalone Deployments

**Scenario:**
Pass environment variables `PORT=8080` and `DATABASE_URL` to a standalone server process.

**Requirements:**
1. Pass environment variables before `node .output/server/index.mjs`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> PORT=8080 NUXT_DATABASE_URL="postgres://..." node .output/server/index.mjs
> ```
> 
> #### Technical Explanation
>
> 1. Standalone Nitro server reads process environment variables at startup.
> 2. `PORT=8080` configures the HTTP listening port.
> 3. `NUXT_` prefixed variables populate runtime configuration settings dynamically.
> 
---

### Exercise 3: Process Management with PM2 for Standalone Builds

**Scenario:**
Configure a PM2 `ecosystem.config.js` file to run standalone Nuxt server in cluster mode.

**Requirements:**
1. Write PM2 `ecosystem.config.js` targeting `.output/server/index.mjs`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // ecosystem.config.js
> module.exports = {
>   apps: [
>     {
>       name: "nuxt-app",
>       script: "./.output/server/index.mjs",
>       instances: "max",
>       exec_mode: "cluster",
>       env: {
>         PORT: 3000,
>         NODE_ENV: "production"
>       }
>     }
>   ]
> };
> ```
> 
> #### Technical Explanation
>
> 1. PM2 manages standalone Node server processes, automatically restarting worker processes if crashes occur.
> 2. `exec_mode: 'cluster'` spawns multiple Node.js worker processes across all available CPU cores.
> 3. Production Node.js server deployment standard.
> 
---


## 6. Related Terms
- [`.output/` Directory](output_directory.md) — The folder where the standalone build is stored.
- [Environment Variables (`.env`)](env_variables.md) — Configuring production values for the standalone server.
- [Edge Deployment](edge_deployment.md) — Related concept: Edge Deployment.
- [Nitro Engine](../level_01/nitro_engine.md) — Nitro standalone server.

---

## 7. Key Takeaways
- A Standalone Build is a portable, production-ready bundle located in the `.output/` folder.
- It is generated by running the `npm run build` command.
- The entrypoint to run the server is `node .output/server/index.mjs`.
- It does not require root source files or `node_modules` to run.
- Use a process manager like PM2 or containerize with Docker for production stability.
