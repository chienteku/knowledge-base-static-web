# Docker & Standalone Build

> **Level 10 — Advanced Architecture**
> The official Next.js feature designed for self-hosting. It compiles your entire application, including `node_modules`, into a highly optimized, miniaturized folder perfect for Docker containers.

---

## 1. Prerequisites
- [Deployment (Vercel)](vercel_deployment.md) — The platform you are choosing *not* to use.
- [The Next.js Cache (The Four Caches)](../level_08/next_cache.md) — Important to understand when self-hosting.

---

## 2. Term Category

**Build & Deployment** (Zero-Dependency Node Server Bundle): Standalone builds (`output: "standalone"`) package Next.js into a self-contained Node server runnable without root `node_modules`.



---

## 3. Explanation

### Environment Context
- **Production (Self-Hosted)**

### (1) Design Motivation — "Why did we design this?"
If you decide you don't want to use Vercel (perhaps your company requires deploying to your own private AWS or Kubernetes cluster), you need to "Self-Host" Next.js.
Historically, deploying a Node.js app meant copying your entire `node_modules` folder (often 1GB+ in size) to the server. This made Docker images massive and slow to deploy.
Next.js solved this with the **Standalone output**. It intelligently traces your code and copies *only* the specific files and specific `node_modules` actually used in production into a tiny, self-contained folder.

### (2) Enabling Standalone Mode
You simply add one line to your `next.config.mjs` file:

```js
// next.config.mjs
export default {
  output: 'standalone',
};
```

When you run `npm run build`, Next.js creates a `.next/standalone/` directory. This directory is a fully functioning Node.js server! It contains your `.env` variables, your optimized code, and a heavily pruned `node_modules` folder.

### (3) Running the Standalone Server
You do not use `npm run start` anymore. You run the generated `server.js` file directly using Node:

```bash
node .next/standalone/server.js
```
*(Note: You must also manually copy the `public/` and `.next/static/` folders to this directory to serve images and CSS).*

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Not understanding Cache persistence in Docker

**The mistake:** A developer deploys their standalone Next.js app via Docker to AWS ECS. They configure a Route Handler to use ISR (`revalidate: 60`). Every time AWS spins up a new Docker container, the cache is completely empty, causing massive spikes in database load.

**Why it's wrong:** By default, Next.js stores its Data Cache and Full Route Cache (ISR) directly on the local file system (`.next/cache`). In a Docker/Kubernetes environment, containers are ephemeral. When a container dies, the file system is deleted. When a new container boots, it has an empty cache.
**Golden Rule:** If you are self-hosting Next.js using multiple Docker containers, you MUST configure an external Next.js Custom Cache Handler (like Redis) so all containers share the same cache!

---

### Mistake 2: Copying Entire `node_modules` Directory into Production Docker Images

**The mistake:** Copying 1GB `node_modules` folder into production Docker containers.

**Why it's wrong:** Next.js standalone build generates a minimal isolated output folder containing ONLY necessary dependencies. Copying full `node_modules` inflates Docker image size to gigabytes.

*Incorrect:*
```tsx
/* Copying full 1GB node_modules folder into production Docker image */
```

*Fix:*
```tsx
// Enable standalone build in next.config.js:
module.exports = { output: 'standalone' };
```

---

### Mistake 3: Forgetting to Copy `.next/static` and `public/` Folders in Standalone Dockerfiles

**The mistake:** Running `node .next/standalone/server.js` without copying `.next/static` and `public/`.

**Why it's wrong:** The `.next/standalone` folder excludes static client assets (`.next/static`) and `public/` files. Omitting them causes 404 errors on static CSS, JS, and image requests.

*Incorrect:*
```tsx
/* Running standalone server.js without copying static assets */
```

*Fix:*
```tsx
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
```


---

## 5. Practice Exercises

### Exercise 1: Configuring Standalone Output in `next.config.js`

**Scenario:**
Configure `output: 'standalone'` in `next.config.js` to generate a self-contained Node.js server bundle.

**Requirements:**
1. Set `output: "standalone"` in `next.config.js`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // next.config.js
> module.exports = {
>   output: "standalone"
> };
> ```
> 
> #### Technical Explanation
>
> 1. `output: 'standalone'` automatically traces dependencies and copies ONLY required node_modules into `.next/standalone/`.
> 2. Dramatically reduces production Docker container image sizes from 1GB+ down to ~100MB.
> 3. Standard build configuration for Docker and Kubernetes deployments.
> 
---

### Exercise 2: Writing a Production Dockerfile for Standalone Builds

**Scenario:**
Write a minimal multi-stage `Dockerfile` leveraging `.next/standalone` output.

**Requirements:**
1. Copy `.next/standalone` and `.next/static` in runner stage.

> [!check]- Answer
>
> #### Implementation
>
> ```dockerfile
> FROM node:18-alpine AS runner
> WORKDIR /app
> 
> ENV NODE_ENV=production
> ENV PORT=3000
> 
> COPY .next/standalone ./
> COPY .next/static ./.next/static
> COPY public ./public
> 
> EXPOSE 3000
> CMD ["node", "server.js"]
> ```
> 
> #### Technical Explanation
>
> 1. Standalone server runs directly via `node server.js` without requiring `npm install` on the target container.
> 2. Static assets (`.next/static` and `public/`) must be explicitly copied into the container folder.
> 3. Optimized Docker deployment pattern.
> 
---

### Exercise 3: Setting Environment Variables in Standalone Containers

**Scenario:**
Pass runtime environment variables (`PORT=8080`, `DATABASE_URL`) to a standalone container process.

**Requirements:**
1. Pass environment variables before `node server.js`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> # Run standalone container with environment variables
> docker run -p 8080:8080 -e PORT=8080 -e DATABASE_URL="postgresql://..." my-next-app
> ```
> 
> #### Technical Explanation
>
> 1. Standalone Next.js server reads process environment variables at container startup.
> 2. `PORT=8080` configures the HTTP listening port.
> 3. Decouples build-time compilation from runtime environment configuration.
> 
---


## 6. Related Terms
- [Deployment (Vercel)](vercel_deployment.md) — The zero-config alternative to self-hosting.
- [Incremental Static Regeneration (ISR)](../level_08/isr.md) — The feature that breaks if your Docker cache isn't configured correctly.
- [The Next.js Compiler (SWC)](swc.md) — Related concept: The Next.js Compiler (SWC).

---

## 7. Key Takeaways
- The **`output: 'standalone'`** config tells Next.js to compile your app into a miniaturized, self-contained Node.js server.
- It drastically reduces the size of `node_modules`, making it the perfect artifact for Docker images and Kubernetes clusters.
- You run the standalone app using `node server.js` rather than `npm run start`.
- When self-hosting Next.js with Docker, you must be extremely careful with the Next.js Cache, as the local file system cache will not be shared across multiple containers.
