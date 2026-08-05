# Load Balancing

> **Level 10 — Security & Production**
> Spreading traffic across clustered Node processes/instances (why statelessness matters).

---

## 1. Prerequisites
- [The cluster Module](cluster_module.md) — The process clustering system matching this network architecture.
- [JWT (JSON Web Tokens)](jwt.md) — The stateless token strategy enabling distributed routing.

---

## 2. Term Category
- **Production / DevOps / Systems Architecture**

---

## 3. Environment Context
- **Network Infrastructure Layer** (Sits in front of your Node application instances to distribute incoming TCP/HTTP connection requests).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Session Architecture Design

**Problem:** You are refactoring a stateful app to support a load balancer. The legacy code stores user profiles in local memory.
Design the refactored architecture by choosing the correct storage components for a stateless system:

```text
Legacy (Stateful, cannot be load-balanced):
Client ──> [ Load Balancer ] ──> [ Server A ] (Saves session locally: const sessions = { user_id })

Refactored (Stateless, load-balance ready):
Client ──> [ Load Balancer ] ──> [ Server A or B ] ──> [ Shared Redis Store ] (Stores session tokens)
                                                    ──> [ Shared PostgreSQL ] (Stores persistent user data)
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Load Balancing Algorithms

**Problem:** Match load balancing algorithm to description:
1. Distributes requests sequentially in circular order (Round Robin)
2. Sends request to server with fewest active connections (Least Connections)
3. Hashes client IP to assign fixed target server (IP Hash)

**Expected output:**
> [!check]- Answer
> ```text
> 1. Round Robin
> 2. Least Connections
> 3. IP Hash
> ```
> ```text
> 1. Round Robin
> 2. Least Connections
> 3. IP Hash
> ```
>
> **Explanation:** Load balancing algorithms optimize request distribution based on traffic patterns.

---

### Exercise 3: Layer 4 vs Layer 7 Load Balancing

**Problem:** Distinguish Layer 4 (Transport) vs Layer 7 (Application) load balancing.

**Expected output:**
> [!check]- Answer
> ```text
> Layer 4 routes packets based on IP/Port (TCP/UDP); Layer 7 routes requests based on HTTP headers, URLs, and cookies.
> ```
> ```text
> Layer 4 routes packets based on IP/Port (TCP/UDP); Layer 7 routes requests based on HTTP headers, URLs, and cookies.
> ```
>
> **Explanation:** Layer 7 load balancing supports smart HTTP path routing and header inspection.

## 7. Related Terms
- [Reverse Proxy (Nginx)](reverse_proxy.md) — The gateway server that frequently performs load balancing.
- [PM2 (Process Manager)](pm2.md) — Manages local process clusters under server-wide load balancers.
- [The cluster Module](cluster_module.md) — Related concept: The cluster Module.

---

## 8. Key Takeaways
- Load balancing distributes client request traffic across multiple backend servers.
- It prevents single-server bottlenecks and enables horizontal scaling.
- Common routing algorithms include Round-Robin, Least Connections, and IP Hash.
- Clustered applications must be stateless; do not store session data in server memory.
- Store session data in centralized caches (like Redis) or database layers.
- Avoid using sticky sessions as a substitute for stateless application design.
