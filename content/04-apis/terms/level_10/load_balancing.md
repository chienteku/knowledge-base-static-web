# Load Balancing

> **Level 10 — Designing & Tooling**
> Spreading traffic across servers (and why statelessness enables it).

---

## 1. Prerequisites
- [Statelessness](../level_03/statelessness.md) — The architectural constraint making horizontal scaling simple.

---

## 2. Term Category

**Architecture / Design (Universal: Implemented within cloud networks , ingress controllers, and system architecture topologies.)**: Load Balancing is a fundamental concept in this technology stack. **Level 10 — Designing & Tooling**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A single backend server machine has physical limits (CPU cores, RAM size, network card throughput). If a web application receives a sudden spike in traffic, a single server will become overloaded, slow down, and crash.

Instead of buying a larger, more expensive server (vertical scaling / scaling up), modern architectures scale horizontally by running multiple identical copies of the server process across a cluster of machines (horizontal scaling / scaling out).

To distribute incoming client requests evenly across this server cluster, we place a **Load Balancer** in front of them:
- **The Load Balancer:** A dedicated software proxy (like Nginx, HAProxy, or AWS ALB) or hardware device that sits between clients and the server pool.
- **Routing Algorithms:**
  - **Round Robin:** Alternating requests down the list (Request 1 to Server A, Request 2 to Server B, Request 3 to Server C, Request 4 to Server A).
  - **Least Connections:** Forwarding requests to whichever server is currently handling the fewest active sessions.

#### Why Statelessness is Critical
If your servers are **stateful** (storing session details like logged-in states in their local RAM), the load balancer must use "sticky sessions" to route a specific user to the exact same server instance for every single request. If that server crashes, the user's session data is lost, logging them out.

If your servers are **stateless** (storing session states externally in Redis or JWTs), the load balancer can route any request to **any server** at any time. If Server A crashes, the load balancer routes the next query to Server B, and the user experiences no interruption.

---

### (2) Architectural Topology

```text
                  ┌──────────────────────┐
                  │    LOAD BALANCER     │
                  │                      │     ┌───> [ Server A (Stateless) ] ───┐
  [ Web Clients ]─┼─> (1) Round Robin    │ ───┼───> [ Server B (Stateless) ] ───┼──> [ Redis Session Cache ]
                  │   (2) Health Checks  │     └───> [ Server C (Stateless) ] ───┘
                  └──────────────────────┘
```

---

### (3) Reality Metaphor
Imagine a busy grocery store checkout area.
- **Stateful (Sticky Sessions)** is like cashiers who must memorize your face and cart items. You must stand in Cashier A's line. If Cashier A leaves for a break (**crashes**), your progress is lost, and you must start over in another cashier's line.
- **Stateless with Load Balancing** is like a single queue line managed by an usher (**the Load Balancer**). 
  - As cashiers (**servers**) free up, the usher directs the next customer to Cashier A, B, or C. Because the cashiers do not need to memorize you (they read your items using the barcodes—**stateless data**), any cashier can process your transaction. If Cashier A leaves, the line flows through Cashier B and C.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Scaling stateless web servers without scaling the database

**The mistake:** Scaling your backend API from 2 servers to 50 servers during a traffic spike, while leaving the database running on a single database instance.

**Why it's wrong:** While scaling stateless API servers is easy, they all query the same database. If 50 web servers make concurrent queries to one database, the database connection pool will exhaust, locking tables and crashing the entire system.

*Fix:* Implement database read-replicas (routing read queries to clone nodes), database caching layers (Redis), or database sharding to distribute database load alongside your servers.

---

### Mistake 2: Using Simple Round-Robin Balancing for Heterogeneous Server Instance Capacities

**The mistake:** Distributing traffic equally 50/50 across a 2-CPU server and an 8-CPU server using Round-Robin.

**Why it's wrong:** Equal distribution overloads smaller instances while under-utilizing high-capacity instances. Use **Weighted Round-Robin** or **Least Connections** load balancing.

*Incorrect:*
```http
/* Equal 50/50 Round-Robin distribution overloading low-tier instances */
```

*Fix:*
```http
/* Configure Weighted Round-Robin (Weight 1 vs Weight 4) or Least Connections */
```

---

### Mistake 3: Failing to Configure Health Check Endpoints (`/healthz`) on Target Group Instances

**The mistake:** Deploying servers behind a load balancer without configuring health check ping paths.

**Why it's wrong:** If a backend instance crashes, the load balancer continues routing user traffic to the dead instance without health checks, causing 502/504 errors for users.

*Incorrect:*
```http
/* Missing load balancer health check path configuration */
```

*Fix:*
```javascript
// Add light HTTP health check endpoint on server:
app.get('/healthz', (req, res) => res.status(200).send('OK'));
```


---

## 5. Practice Exercises

### Exercise 1: Weighted Round-Robin Load Balancer

**Scenario:** An API load balancer selects backend target servers using a Weighted Round-Robin algorithm to distribute traffic based on server capacity.

**Requirements:**
1. Write createWeightedLoadBalancer(serversList).
2. Implement selectNextServer().
3. Distribute calls proportional to weights.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createWeightedLoadBalancer(serversList = []) {
>   if (!Array.isArray(serversList) || serversList.length === 0) {
>     throw new Error("Servers list required");
>   }
>
>   const pool = [];
>   serversList.forEach(s => {
>     const weight = s.weight || 1;
>     for (let i = 0; i < weight; i++) {
>       pool.push(s.url);
>     }
>   });
>
>   let index = 0;
>
>   return {
>     selectNextServer() {
>       const selected = pool[index];
>       index = (index + 1) % pool.length;
>       return selected;
>     }
>   };
> }
>
> // Verification tests
> const servers = [
>   { url: "server1", weight: 2 },
>   { url: "server2", weight: 1 }
> ];
>
> const lb = createWeightedLoadBalancer(servers);
> const choices = [lb.selectNextServer(), lb.selectNextServer(), lb.selectNextServer()];
>
> console.assert(choices.filter(s => s === "server1").length === 2, "Test 1 Failed: server1 selected twice");
> console.assert(choices.filter(s => s === "server2").length === 1, "Test 2 Failed: server2 selected once");
> ```
>
> #### Technical Explanation
>
> 1. **Load Balancing Purpose**: Distributes incoming network traffic across multiple backend servers to maximize throughput.
> 2. **Weighted Round-Robin**: Directs more traffic to higher-capacity servers (e.g. 16-core servers vs 4-core servers).
> 3. **High Availability**: Ensures no single server becomes a performance bottleneck under heavy traffic.
> 
---

### Exercise 2: IP Hash Sticky Session Load Balancer Router

**Scenario:** A load balancer routes client requests to backend servers based on client IP hash, ensuring sticky session persistence.

**Requirements:**
1. Write selectServerByIpHash(clientIp, serversArray).
2. Compute simple numeric hash of clientIp.
3. Select server via `hash % serversArray.length`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function selectServerByIpHash(clientIp, serversArray = []) {
>   if (!clientIp || serversArray.length === 0) return null;
>
>   let hash = 0;
>   for (let i = 0; i < clientIp.length; i++) {
>     hash = (hash << 5) - hash + clientIp.charCodeAt(i);
>     hash |= 0;
>   }
>
>   const positiveHash = Math.abs(hash);
>   const selectedIndex = positiveHash % serversArray.length;
>
>   return serversArray[selectedIndex];
> }
>
> // Verification tests
> const pool = ["serverA", "serverB", "serverC"];
> const s1 = selectServerByIpHash("192.168.1.50", pool);
> const s2 = selectServerByIpHash("192.168.1.50", pool);
>
> console.assert(s1 === s2, "Test 1 Failed: Same IP must ALWAYS map to the same server");
> ```
>
> #### Technical Explanation
>
> 1. **IP Hashing Mechanics**: Hashes client IP address to deterministically map clients to specific backend servers.
> 2. **Sticky Sessions**: Guarantees a client connects to the same backend server on every request.
> 3. **Stateful Service Support**: Necessary for legacy stateful applications storing in-memory user session state.
> 
---

### Exercise 3: Passive Health Check & Auto-Removal Circuit Engine

**Scenario:** An API load balancer monitors backend server failure rates and temporarily removes unhealthy servers from the active pool.

**Requirements:**
1. Write auditServerHealth(serversMap, maxFailures).
2. Remove servers exceeding maxFailures.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditServerHealth(serversMap = new Map(), maxFailures = 3) {
>   const healthyPool = [];
>   const removedServers = [];
>
>   for (const [url, state] of serversMap.entries()) {
>     if (state.failedCount >= maxFailures) {
>       state.isHealthy = false;
>       removedServers.push(url);
>     } else {
>       state.isHealthy = true;
>       healthyPool.push(url);
>     }
>   }
>
>   return { healthyPool, removedServers };
> }
>
> // Verification tests
> const map = new Map([
>   ["server1", { failedCount: 0 }],
>   ["server2", { failedCount: 3 }]
> ]);
>
> const audit = auditServerHealth(map, 3);
> console.assert(audit.healthyPool.length === 1 && audit.healthyPool[0] === "server1", "Test 1 Failed");
> console.assert(audit.removedServers.includes("server2"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Passive Health Checks**: Monitors actual client request failures to detect broken backend servers.
> 2. **Active Health Checks**: Periodically pings health endpoints (`/healthz`) to verify server readiness.
> 3. **Self-Healing Pools**: Re-adds servers to active load balancer pool when health checks succeed again.
---

## 6. Related Terms
- [API Gateway](api_gateway.md) — The edge proxy that often integrates load balancing features.
- [Session vs Token Authentication](../level_04/session_vs_token_auth.md) — The authentication models that determine whether server state is required.
- [Microservices vs Monolith](microservices_monolith.md) — Related concept: Microservices vs Monolith.

---

## 7. Key Takeaways
- Load balancers distribute incoming network traffic across a cluster of backend servers.
- Horizontal scaling runs multiple identical servers; vertical scaling increases one server's resources.
- Round Robin and Least Connections are standard routing algorithms.
- Stateless API designs allow any server to handle any request, enabling seamless scaling.
- Stateful designs require sticky sessions, which limit load balancer efficiency.
- Ensure database capacity scales to support scaled backend server connections.
