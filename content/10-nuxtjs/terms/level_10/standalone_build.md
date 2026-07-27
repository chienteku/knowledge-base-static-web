# Standalone Build (Node server)

> **Level 10 — Error Handling & Production**
> The self-contained production bundle created inside `.output/` after building the application, allowing hosting on any Node.js environment without root project source code or dependencies.

---

## 1. Prerequisites
- [Nitro Engine](../level_01/nitro_engine.md) — The engine that compiles the standalone server bundle.
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The rendering mode that requires a running server to operate.

---

## 2. Term Category
- **Deployment**

---

## 3. Environment Context
- **Server Only** (Runs as a persistent backend Node.js process to listen to client requests).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Starting the Production Server

**Problem:** You have compiled your application using `npm run build`. Write the command to launch the standalone production server locally using Node.js.

**Expected output:**
```bash
node .output/server/index.mjs
```

> [!check]- Answer
> - Execute the entrypoint javascript module located inside the compiled server directory.

---

### Exercise 2: Minimal Nuxt 3 Dockerfile Pattern

**Problem:** Write multi-stage Dockerfile compiling `.output/` and launching `node .output/server/index.mjs` in lightweight `node:18-alpine` runtime.

**Expected output:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

> [!check]- Answer
> - Standalone `.output/` requires zero external `node_modules` in production containers.
> 
> ```dockerfile
> FROM node:18-alpine AS builder
> WORKDIR /app
> COPY . .
> RUN npm ci && npm run build
> 
> FROM node:18-alpine AS runner
> WORKDIR /app
> COPY --from=builder /app/.output ./.output
> ENV PORT=3000
> EXPOSE 3000
> CMD ["node", ".output/server/index.mjs"]
> ```

---

### Exercise 3: Standalone Zero-Dependency Engine

**Problem:** Why is the `.output/server/index.mjs` file self-contained without needing `package.json`?

**Expected output:**
```text
Nitro bundles and tree-shakes all server dependencies into the single compiled ESM module file at build time.
```

> [!check]- Answer
> - Nitro bundles all server dependencies into the standalone `.output/server` directory.
> 
> ```text
> Zero production node_modules dependencies required!
> ```


---

## 7. Related Terms
- [`.output/` Directory](../level_10/output_directory.md) — The folder where the standalone build is stored.
- [Environment Variables (`.env`)](../level_10/env_variables.md) — Configuring production values for the standalone server.

---

## 8. Key Takeaways
- A Standalone Build is a portable, production-ready bundle located in the `.output/` folder.
- It is generated by running the `npm run build` command.
- The entrypoint to run the server is `node .output/server/index.mjs`.
- It does not require root source files or `node_modules` to run.
- Use a process manager like PM2 or containerize with Docker for production stability.
