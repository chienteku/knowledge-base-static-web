# Load Balancing

> **Level 10 — Security & Production**
> Spreading traffic across clustered Node processes/instances (why statelessness matters).

---

## 1. Prerequisites
- [The cluster Module](cluster_module.md) — The process clustering system matching this network architecture.
- [JWT (JSON Web Tokens)](jwt.md) — The stateless token strategy enabling distributed routing.

---

## 2. Term Category

**Production / DevOps / Systems Architecture (Network Infrastructure Layer .)**: Load Balancing is a fundamental concept in this technology stack. **Level 10 — Security & Production**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
As application traffic grows, a single server instance (even when clustered across all CPU cores) will eventually reach its hardware resource limit (CPU, RAM, or network bandwidth).

To handle millions of concurrent users, you must scale **horizontally**—deploying duplicate copies of your Node.js application across multiple physical servers or virtual container instances.

To distribute incoming client requests across these multiple servers, you need a **Load Balancer**:
-   **Load Balancer:** A networking component that acts as a single point of entry for your application. It receives public client connections and distributes them across your backend server pool.
-   **Common Routing Algorithms:**
    -   *Round-Robin:* Distributes requests sequentially down the list of servers.
    -   *Least Connections:* Routes requests to the server with the fewest active connections.
    -   *IP Hash:* Hashes the client's IP address to determine the server, ensuring a client consistently hits the same backend instance (**Sticky Sessions**).
-   **The Stateless Requirement:** If Server A handles a user's login request and saves their session in its local memory heap, and the load balancer routes the user's next request to Server B, Server B will not recognize the user. For load balancing to work, your application must be **stateless**: all session data must be stored in a shared external database or cache (like Redis), or encoded inside client-side JWTs.

---

### (2) Reality Metaphor
Imagine a busy check-in line at an airport.
- **The Load Balancer** is the **airport line coordinator** standing at the front of the queue, directing passengers: *"You go to counter 1, you go to counter 2..."*
- **The Server Instances** are the **ticketing agents** staffing the counters.
- **Statelessness (Standard System):** Every ticketing agent has access to the main airline database. It does not matter which agent you are directed to; you show your ID, they fetch your details from the cloud database, and print your boarding pass.
- **Stateful (Broken System):** Each agent writes customer check-ins in a local notepad on their desk. If Agent 1 checks you in, but you step out of line to buy water and are directed to Agent 2 upon returning, Agent 2 has no record of your check-in. You must start over.

---

### (3) System Architecture: Nginx Load Balancer Config

An example Nginx configuration distributing traffic across three Node.js instances:

```nginx
# 1. Define the upstream group of server instances
upstream my_node_app {
    server 192.168.1.10:3000; # Server A
    server 192.168.1.11:3000; # Server B
    server 192.168.1.12:3000; # Server C
}

server {
    listen 80;
    server_name myapp.com;

    location / {
        # 2. Forward incoming traffic to the upstream group
        proxy_pass http://my_node_app;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Sticky Sessions as a permanent workaround for stateful applications

**The mistake:** Enabling "Sticky Sessions" (IP hashing) on the load balancer to force clients to stick to a single server instance, allowing you to keep in-memory sessions instead of refactoring your code to be stateless.

**Why it's wrong:** If a server instance crashes, undergoes a deployment restart, or scales down automatically during low traffic, all sessions stored in that server's memory are lost. This logs out users and interrupts active operations. Sticky sessions also limit the effectiveness of load balancing, as a few high-traffic users can overload a single server instance while others sit idle.

---



### Mistake 2: Relying on Sticky Sessions (Session Affinity) Instead of Stateless Authentication

**The mistake:** Configuring load balancers with sticky sessions to route users to the same server process.

**Why it's wrong:** Sticky sessions prevent equal load distribution, break during server auto-scaling, and fail when single server instances restart. Use stateless JWT tokens or centralized Redis sessions.

*Incorrect:*
```javascript
// Relying on load balancer sticky sessions to maintain in-memory server state
```

*Fix:*
```javascript
Use stateless JWTs or shared Redis session stores across all load-balanced servers
```

### Mistake 3: Configuring Health Check Endpoints That Perform Heavy Database Operations

**The mistake:** Configuring load balancer health check `/health` to execute heavy complex SQL queries every 5 seconds.

**Why it's wrong:** Frequent heavy health checks consume server CPU and DB connections. Keep health check endpoints light (`res.send('OK')`).

*Incorrect:*
```javascript
app.get('/health', async (req, res) => {
  await db.query('SELECT * FROM audit_logs'); // ❌ Heavy DB query on health check!
});
```

*Fix:*
```javascript
app.get('/health', (req, res) => res.status(200).send('OK')); // Fast light health check
```

## 5. Practice Exercises

### Exercise 1: Round-Robin Load Balancer Dispatcher

**Scenario:** Implements a Round-Robin load balancing algorithm distributing incoming HTTP requests across a pool of backend server instances.

**Requirements:**
1. Write createRoundRobinBalancer(serversArray).
2. Implement `getNextServer()`.
3. Rotate index sequentially.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createRoundRobinBalancer(serversArray = []) {
>   let currentIndex = 0;
>
>   return {
>     getNextServer() {
>       if (serversArray.length === 0) {
>         throw new Error("No backend servers available in load balancer pool");
>       }
>
>       const server = serversArray[currentIndex];
>       currentIndex = (currentIndex + 1) % serversArray.length;
>       return server;
>     }
>   };
> }
>
> // Verification tests
> const balancer = createRoundRobinBalancer(["http://s1:8080", "http://s2:8080"]);
> console.assert(balancer.getNextServer() === "http://s1:8080", "Test 1 Failed");
> console.assert(balancer.getNextServer() === "http://s2:8080", "Test 2 Failed");
> console.assert(balancer.getNextServer() === "http://s1:8080", "Test 3 Failed: Cycled back to s1");
> ```
>
> #### Technical Explanation
>
> 1. **Round-Robin Load Balancing**: Distributes requests evenly across backend nodes in sequential circular order.
> 2. **Stateless Traffic Distribution**: Simplest load balancing algorithm for homogeneous backend server clusters.
> 3. **Nginx & HAProxy Default**: Used as default algorithm by Nginx and Cloudflare edge proxies.
> 
---

### Exercise 2: Weighted Round-Robin Load Balancer Dispatcher

**Scenario:** Implements Weighted Round-Robin load balancing to send more traffic to powerful backend servers based on weight capacity.

**Requirements:**
1. Write createWeightedBalancer(serverWeightsArray).
2. Distribute traffic proportional to weight.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createWeightedBalancer(serverWeightsArray = []) {
>   const expandedPool = [];
>
>   for (const item of serverWeightsArray) {
>     for (let i = 0; i < (item.weight || 1); i++) {
>       expandedPool.push(item.server);
>     }
>   }
>
>   let index = 0;
>   return {
>     getNextServer() {
>       if (expandedPool.length === 0) throw new Error("Empty pool");
>       const server = expandedPool[index];
>       index = (index + 1) % expandedPool.length;
>       return server;
>     }
>   };
> }
>
> // Verification tests
> const pool = [
>   { server: "s1", weight: 3 },
>   { server: "s2", weight: 1 }
> ];
>
> const balancer = createWeightedBalancer(pool);
> const hits = { s1: 0, s2: 0 };
> for (let i = 0; i < 4; i++) {
>   hits[balancer.getNextServer()]++;
> }
>
> console.assert(hits.s1 === 3 && hits.s2 === 1, "Test 1 Failed: s1 received 3x traffic of s2");
> ```
>
> #### Technical Explanation
>
> 1. **Weighted Load Balancing**: Directs higher request ratios to servers with more CPU/RAM resources.
> 2. **Heterogeneous Server Clusters**: Allows mixing high-capacity bare-metal servers with smaller cloud VMs in single cluster.
> 3. **Expanded Pool Construction**: Simple implementation expands server array proportional to integer weight ratios.
> 
---

### Exercise 3: Dynamic Health-Check Pool Rotator

**Scenario:** Monitors backend server health checks and automatically removes unhealthy servers from the active routing pool.

**Requirements:**
1. Write updateLoadBalancerHealth(serverPool, healthcheckResults).
2. Filter active servers.
3. Return healthy active servers.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function updateLoadBalancerHealth(serverPool = [], healthcheckResults = {}) {
>   const healthyServers = serverPool.filter(server => {
>     return healthcheckResults[server] === true;
>   });
>
>   return {
>     healthyServers,
>     unhealthyServers: serverPool.filter(s => !healthcheckResults[s]),
>     activeCount: healthyServers.length
>   };
> }
>
> // Verification tests
> const servers = ["s1", "s2", "s3"];
> const health = { s1: true, s2: false, s3: true };
>
> const result = updateLoadBalancerHealth(servers, health);
> console.assert(result.activeCount === 2, "Test 1 Failed: 2 healthy servers active");
> console.assert(result.unhealthyServers.includes("s2"), "Test 2 Failed: Removed unhealthy s2");
> ```
>
> #### Technical Explanation
>
> 1. **Active Health Checking**: Load balancers periodically send HTTP GET `/healthz` pings to verify backend node health.
> 2. **Automatic Failover**: Instantly drops failing nodes from active load balancer pool to prevent user request errors.
> 3. **Self-Healing Recovery**: Re-adds recovered nodes back to routing pool automatically once healthchecks pass again.
## 6. Related Terms
- [Reverse Proxy (Nginx)](reverse_proxy.md) — The gateway server that frequently performs load balancing.
- [PM2 (Process Manager)](pm2.md) — Manages local process clusters under server-wide load balancers.
- [The cluster Module](cluster_module.md) — Related concept: The cluster Module.

---

## 7. Key Takeaways
- Load balancing distributes client request traffic across multiple backend servers.
- It prevents single-server bottlenecks and enables horizontal scaling.
- Common routing algorithms include Round-Robin, Least Connections, and IP Hash.
- Clustered applications must be stateless; do not store session data in server memory.
- Store session data in centralized caches (like Redis) or database layers.
- Avoid using sticky sessions as a substitute for stateless application design.
