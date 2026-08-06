# Load Balancing

> **Level 10 — Designing & Tooling**
> Spreading traffic across servers (and why statelessness enables it).

---

## 1. Prerequisites
- [Statelessness](../level_03/statelessness.md) — The architectural constraint making horizontal scaling simple.

---

## 2. Term Category
- **Architecture / Design**

---

## 3. Environment Context
- **Universal**: Implemented within cloud networks (AWS, Cloudflare), ingress controllers, and system architecture topologies.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Traffic Distribution

**Problem:** A load balancer routes traffic to 3 backend servers using a **Round Robin** algorithm. If 300 requests arrive, how many requests will Server B handle under normal conditions?

> [!check]- Answer
> - **100 requests.** (Under Round Robin, requests are distributed evenly down the list. Each of the 3 servers handles $300 / 3 = 100$ requests).
> 
> 
---

### Exercise 2: Layer 4 vs Layer 7 Load Balancing

**Problem:** Distinguish Layer 4 (Transport) vs Layer 7 (Application) Load Balancing.

**Expected output:**
> [!check]- Answer
> ```text
> Layer 4: Balances traffic at IP/TCP level without inspecting packet payload content (faster, high throughput).
> Layer 7: Balances traffic inspecting HTTP headers, URIs, and cookies (content-aware routing).
> ```
> ```text
> Layer 4 (Network/TCP) -> IP & Port routing (Fast, high throughput, payload agnostic).
> Layer 7 (Application) -> HTTP header, URL path, and cookie routing (Content aware).
> ```
> - **Explanation:** Layer 7 balances by application content; Layer 4 balances by raw TCP streams.
---

### Exercise 3: Load Balancing Algorithm Selection

**Problem:** Which algorithm is best for long-lived WebSocket connections?
1. Round-Robin
2. Least Connections
3. IP Hash

**Expected output:**
> [!check]- Answer
> ```text
> Least Connections (routes new connections to the server currently handling the fewest active sockets).
> ```
> ```text
> Least Connections (routes new connections to the server currently handling the fewest active sockets).
> ```
> - **Explanation:** Least Connections maintains balanced socket distributions over long durations.
---

## 7. Related Terms
- [API Gateway](api_gateway.md) — The edge proxy that often integrates load balancing features.
- [Session vs Token Authentication](../level_04/session_vs_token_auth.md) — The authentication models that determine whether server state is required.
- [Microservices vs Monolith](microservices_monolith.md) — Related concept: Microservices vs Monolith.

---

## 8. Key Takeaways
- Load balancers distribute incoming network traffic across a cluster of backend servers.
- Horizontal scaling runs multiple identical servers; vertical scaling increases one server's resources.
- Round Robin and Least Connections are standard routing algorithms.
- Stateless API designs allow any server to handle any request, enabling seamless scaling.
- Stateful designs require sticky sessions, which limit load balancer efficiency.
- Ensure database capacity scales to support scaled backend server connections.
