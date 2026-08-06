# Serverless Functions

> **Level 10 — Advanced Architecture**
> A cloud computing execution model where backend code is packaged as individual, on-demand functions (such as AWS Lambda) that execute on ephemeral servers managed entirely by the hosting provider.

---

## 1. Prerequisites
- [Dynamic Rendering (SSR)](../level_08/ssr.md) — The dynamic rendering mechanism that serverless functions execute.
- [Node.js Runtime](../level_01/nodejs_runtime.md) — The environment running inside a serverless container.

---

## 2. Term Category

**Build & Deployment** (Serverless Function Architecture): Serverless Functions compile dynamic Next.js route handlers into auto-scaling on-demand execution lambdas.



---

## 3. Explanation

### Environment Context
- **Server Only** (Serverless execution environments are restricted strictly to backend cloud hosting platforms).

### (1) Design Motivation — "Why did we design this?"
In traditional web hosting, developers deploy applications to a server virtual machine (like AWS EC2) that runs continuously. This model has several drawbacks:
-   **Inefficiency:** You pay for the server 24/7, even at night when traffic is zero.
-   **Scaling Complexity:** If traffic spikes, you must manage load balancers and boot up new virtual machines to handle the load.
-   **Maintenance:** You are responsible for OS updates, security patches, and server crashes.

**Serverless Functions** (also known as Function-as-a-Service or FaaS) solve this. You do not manage any server instances. You upload code snippets, and the hosting provider boots up container instances on-demand to process requests, scaling from zero to thousands of instances automatically, and charging only for the exact milliseconds your code runs.

---

### (2) Cold Starts vs. Warm Runs
Because serverless functions scale down to zero when idle to save resources, the very first request after a period of inactivity triggers a **Cold Start**:
1.  The cloud provider provisions a container.
2.  It loads your application code.
3.  It boots the Node.js runtime and executes your request handler.

This initial setup introduces a latency delay (often 1-3 seconds). Subsequent requests hit the already-running container (a **Warm Run**), executing instantly.

---

### (3) Statelessness Constraints
Serverless containers are ephemeral; they are destroyed when idle. This imposes two strict architecture constraints:
-   **No Local File System Persistence:** You cannot save file uploads to local disk folders. Files saved locally disappear as soon as the container terminates.
-   **No Shared Global Variables:** Global variables (like `let count = 0`) are not shared across separate incoming requests. Each request may route to a different concurrent container instance.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Saving uploaded files to local disk folders inside a Server Action or Route Handler

**The mistake:** Writing user profile uploads to local directories like `./public/uploads`:

```typescript
// app/api/upload/route.ts
// BAD: Wiped out as soon as the serverless function shuts down!
await fs.writeFile('./public/uploads/avatar.png', buffer);
```

**Why it's wrong:** Serverless containers are ephemeral and stateless. If you save files locally, they will disappear when the container is recycled. Additionally, users hitting a different container instance will get a 404 because the file only exists on the container that processed the upload.

**Golden Rule:** Always upload persistent media assets to a dedicated cloud storage service (such as Amazon S3, Google Cloud Storage, or Vercel Blob).

---

### Mistake 2: Maintaining Long-Lived In-Memory State inside Serverless Functions

**The mistake:** Storing active WebSocket connections or in-memory arrays inside a serverless Route Handler.

**Why it's wrong:** Serverless functions are ephemeral stateless containers that terminate when idle. In-memory state is lost on container teardown. Use external stores like Redis or database.

*Incorrect:*
```typescript
let requestCount = 0; // ❌ Reset to 0 whenever serverless function instance terminates!
```

*Fix:*
```typescript
await redis.incr('request_count'); // Persistent state in Redis
```

---

### Mistake 3: Exceeding Serverless Function Execution Timeouts

**The mistake:** Running 60-second processing tasks inside a standard serverless function route.

**Why it's wrong:** Serverless platforms (Vercel, AWS Lambda) enforce strict execution timeouts (e.g. 10s–15s for Hobby plans). Long requests are forcefully terminated. Use background job queues.

*Incorrect:*
```tsx
/* Running 60-second processing script inside Route Handler */
```

*Fix:*
```tsx
/* Trigger background job queue (Inngest / QStash / BullMQ) for long-running tasks */
```


---

## 5. Practice Exercises

### Exercise 1: Analyzing Serverless Execution Architecture

**Scenario:**
Explain how Next.js App Router dynamic route handlers compile into auto-scaling Serverless Functions on Vercel/AWS Lambda.

**Requirements:**
1. Detail stateless execution, cold starts, and scaling rules.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Serverless Function Architecture:
> - Stateless Execution: Each incoming request triggers an isolated container instance.
> - Auto-Scaling: Scales automatically from 0 to thousands of concurrent requests.
> - Cold Start: Initial request spins up a new Node.js container instance (adds ~100-300ms latency).
> ```

> #### Technical Explanation
>
> 1. Serverless functions eliminate persistent server management and fixed monthly hosting costs.
> 2. Containers spin down to 0 instances when idle to save resources.
> 3. Core backend deployment model for modern cloud platforms.

---

### Exercise 2: Managing Global Database Connections in Serverless Environments

**Scenario:**
Reuse database connection pools across serverless function invocations using global connection caching.

**Requirements:**
1. Cache DB connection on global scope.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import { Pool } from "pg";

let cachedPool: Pool | null = null;

export function getDbPool() {
  if (!cachedPool) {
    cachedPool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }
  return cachedPool;
}
```

> #### Technical Explanation
>
> 1. Serverless containers stay warm for subsequent requests, allowing global variables (`cachedPool`) to be reused.
> 2. Reusing connection pools prevents exhausting database connection limits during traffic spikes.
> 3. Mandatory pattern for database access in serverless environments.

---

### Exercise 3: Configuring Maximum Execution Duration (Timeout Settings)

**Scenario:**
Configure maximum execution duration for a long-running Server Action or Route Handler in `next.config.js` or route config.

**Requirements:**
1. Export `export const maxDuration = 60`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/api/heavy-job/route.ts
> export const maxDuration = 60; // Max execution timeout: 60 seconds

export async function POST() {
  // Heavy computation or AI processing job...
  return Response.json({ status: "Completed" });
}
```

> #### Technical Explanation
>
> 1. `maxDuration` sets maximum serverless function execution timeout limits (in seconds).
> 2. Prevents long-running AI or image generation jobs from timing out prematurely.
> 3. Cloud platform configuration directive.

---




---

## 6. Related Terms
- [Edge Runtime vs Node.js Runtime](edge_runtime.md) — The edge-alternative to serverless computing.
- [Deployment (Vercel)](vercel_deployment.md) — The platform that handles serverless deployments automatically.
- [Content Delivery Network (CDN) & Edge Cache](cdn_edge.md) — Related concept: Content Delivery Network (CDN) & Edge Cache.

---

## 7. Key Takeaways
- Serverless Functions run backend code on-demand without server management.
- Containers scale automatically, charging only for active execution time.
- Idle functions suffer from "cold start" boot latency on the first request.
- Serverless containers are stateless and ephemeral.
- Store persistent media assets in cloud storage, never on the local container disk.
