# Serverless Functions

> **Level 10 — Advanced Architecture**
> A cloud computing execution model where backend code is packaged as individual, on-demand functions (such as AWS Lambda) that execute on ephemeral servers managed entirely by the hosting provider.

---

## 1. Prerequisites
- [Dynamic Rendering (SSR)](../level_08/ssr.md) — The dynamic rendering mechanism that serverless functions execute.
- [Node.js Runtime](../level_01/nodejs_runtime.md) — The environment running inside a serverless container.
---

## 2. Term Category
- **Infrastructure**

---

## 3. Environment Context
- **Server Only** (Serverless execution environments are restricted strictly to backend cloud hosting platforms).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Serverless Scaling Analysis

**Problem:** Your Next.js app has a dynamic route `/api/reports` deployed to Vercel as a Serverless Function. On Monday morning at 9:00 AM, 500 users request that page simultaneously. Explain how many serverless containers boot up, and what happens to user variables.

**Expected output:**
> [!check]- Answer
> ```text
> The cloud provider will automatically detect the traffic spike and spin up approximately 500 individual, concurrent container instances. 
> Each container runs in isolation; they do not share server memory or local files. 
> Once the reports finish processing and traffic subsides, the provider scales down, destroying the containers.
> ```
> - Think about concurrency and stateless scaling characteristics.

---

### Exercise 2: Serverless Route Config Timeout Setup

**Problem:** Write segment config line setting maximum serverless execution duration to 60 seconds (Pro plan).

**Expected output:**
> [!check]- Answer
> ```typescript
> export const maxDuration = 60;
> ```
> - `export const maxDuration = N` configures serverless function timeout in seconds.
> 
> ```typescript
> export const maxDuration = 60; // 60 seconds max duration
> ```

---

### Exercise 3: Serverless Concurrency Auto-Scaling

**Problem:** How do Serverless Functions handle 1,000 simultaneous concurrent HTTP requests?

**Expected output:**
> [!check]- Answer
> ```text
> The cloud platform automatically spawns 1,000 independent container instances in parallel to handle each request concurrently.
> ```
> - Auto-scales by spawning independent execution containers per request.
> 
> ```text
> 1,000 Requests -> 1,000 Parallel Serverless Containers
> ```


---

## 7. Related Terms
- [Edge Runtime vs Node.js Runtime](edge_runtime.md) — The edge-alternative to serverless computing.
- [Deployment (Vercel)](vercel_deployment.md) — The platform that handles serverless deployments automatically.
- [Content Delivery Network (CDN) & Edge Cache](cdn_edge.md) — Related concept: Content Delivery Network (CDN) & Edge Cache.
---

## 8. Key Takeaways
- Serverless Functions run backend code on-demand without server management.
- Containers scale automatically, charging only for active execution time.
- Idle functions suffer from "cold start" boot latency on the first request.
- Serverless containers are stateless and ephemeral.
- Store persistent media assets in cloud storage, never on the local container disk.
