# Microservices vs Monolith

> **Level 10 — Designing & Tooling**
> Why many small APIs vs one big one.

---

## 1. Prerequisites
- [API (Application Programming Interface)](../level_03/api.md) — The core interface connection concepts.
- [REST (Representational State Transfer)](../level_03/rest.md) — The resource-focused communication style.

---

## 2. Term Category

**Architecture / Design (Universal: Governs the organizational structure of engineering codebases and server deployments.)**: Microservices vs Monolith is a fundamental concept in this technology stack. **Level 10 — Designing & Tooling**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When building a software application, developers must decide how to organize the backend code and host its processes. There are two primary architectural patterns:

#### 1. Monolithic Architecture
The entire application—including users, billing, inventory, and notifications—is built as a single, unified codebase compiled and running as a single process.
*   **Pros:** Simple to build, deploy, test, and debug. Database transactions are easy because everything sits in one database.
*   **Cons:** Hard to scale. If one module (like PDF generation) consumes high CPU, you must duplicate the **entire** application server. If one bug crashes the process, the entire application goes offline. As the team grows, developers step on each other's toes working in the same codebase.

#### 2. Microservices Architecture
The application is split into multiple small, independent services (e.g. a User Service, Billing Service, and Shipping Service). Each service runs its own process, has its own codebase, and has **its own private database**. Services communicate with each other over the network using REST, gRPC, or message brokers.
*   **Pros:** Independent scaling (scale only the high-traffic Billing service). Tech-stack flexibility (Node for User service, Go for Billing). High fault isolation (a crash in the Shipping service does not bring down the login system).
*   **Cons:** High operational complexity (requires container orchestrators like Kubernetes). Network latency overhead (services must make HTTP calls to talk to each other). Distributed transactions are hard to manage.

---

### (2) Architectural Diagrams

#### Monolith Structure
```text
  [ Client ] ───> [ Single Monolith Server ] ───> [ Single Shared Database ]
```

#### Microservices Structure
```text
                    ┌───> [ User Service ]    ───> [ User DB ]
  [ Client ] ───>  ├───> [ Billing Service ] ───> [ Billing DB ]
                    └───> [ Shipping Service ]───> [ Shipping DB ]
```

---

### (3) Reality Metaphor
Imagine tools used for repair.
- **A Monolith** is like a **Swiss Army Knife**. It has a knife, scissors, and screwdriver attached to a single handle. It is compact and easy to carry in your pocket. However, if the scissors break, you must mail the entire knife back to the factory. You also cannot swap out the screwdriver for a hammer.
- **Microservices** are like a **pegboard tool rack**. You have a separate hammer, a separate saw, and a separate screwdriver. If the saw gets dull, you buy a new one without affecting the hammer. You can add any size tool you want. However, carrying all these separate tools to a job site requires a toolbox and complex coordination.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Starting with microservices on Day 1 for a new product

**The mistake:** A startup with a team of 3 developers building their initial prototype using a microservices architecture.

**Why it's wrong:** At the start of a project, you do not know where the product boundaries lie. Splitting your app early introduces massive infrastructure overhead (managing containers, service discovery, API gateways) which slows down development, dragging down time-to-market.

*Fix:* Start with a modular monolith first. Once the business logic stabilizes and scaling demands or team sizes grow, split the bottlenecked domains into separate microservices.

### Mistake 2: Sharing a single database across microservices

**The mistake:** Splitting code into separate microservice APIs, but having them all query the same central PostgreSQL database.

**Why it's wrong:** This is a "distributed monolith." If the Billing team modifies the user table columns, the User service will crash. You have lost the benefit of independent deployments while keeping the complexity of distributed systems.

*Fix:* Each microservice must own its data store. No service is allowed to query another service's database directly. They must request data via APIs.

---

### Mistake 3: Prematurely Splitting a New Product into Microservices ("Distributed Monolith Anti-Pattern")

**The mistake:** Building a brand-new startup MVP with 20 separate microservices on day 1.

**Why it's wrong:** Microservices introduce massive operational overhead (CI/CD pipelines, network latency, distributed tracing). Start with a Modular Monolith and extract microservices when domain boundaries mature.

*Incorrect:*
```http
/* Building 20 microservices for unvalidated startup MVP on day 1 */
```

*Fix:*
```http
/* Start with a clean Modular Monolith architecture; extract microservices as scaling requires */
```

---

### Mistake 4: Sharing a Single Database Instance Across Multiple Microservices

**The mistake:** Connecting 5 microservices to a single shared PostgreSQL database instance.

**Why it's wrong:** Sharing a database tightly couples microservices at the database schema level. Schema migrations break multiple services simultaneously. Each microservice MUST own its private database.

*Incorrect:*
```http
/* Service A and Service B execute queries against the same SQL database tables */
```

*Fix:*
```http
/* Database per Service pattern: Service A owns DB A; Service B owns DB B */
```


---

## 5. Practice Exercises

### Exercise 1: Strangler Fig Pattern API Router

**Scenario:** An API gateway implements the Strangler Fig Pattern, gradually migrating endpoints from a legacy monolith to new microservices.

**Requirements:**
1. Write stranglerRoute(path, migratedPathsSet, monolithUrl, microserviceUrl).
2. Route migrated paths to microservice, others to monolith.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function stranglerRoute(path, migratedPathsSet, monolithUrl, microserviceUrl) {
>   const cleanMonolith = monolithUrl.replace(/\/$/, "");
>   const cleanMicro = microserviceUrl.replace(/\/$/, "");
>
>   if (migratedPathsSet.has(path)) {
>     return {
>       target: "MICROSERVICE",
>       url: `${cleanMicro}${path}`
>     };
>   }
>
>   return {
>     target: "MONOLITH",
>     url: `${cleanMonolith}${path}`
>   };
> }
>
> // Verification tests
> const migrated = new Set(["/api/v1/orders"]);
> const mono = "https://monolith.example.com";
> const micro = "https://orders-service.example.com";
>
> const r1 = stranglerRoute("/api/v1/orders", migrated, mono, micro);
> console.assert(r1.target === "MICROSERVICE", "Test 1 Failed: Migrated path routes to microservice");
>
> const r2 = stranglerRoute("/api/v1/users", migrated, mono, micro);
> console.assert(r2.target === "MONOLITH", "Test 2 Failed: Unmigrated path routes to monolith");
> ```
>
> #### Technical Explanation
>
> 1. **Strangler Fig Pattern**: Migration strategy incrementally replacing monolith features with microservices behind an API gateway.
> 2. **Zero Downtime Refactoring**: Allows refactoring large legacy codebases without risky big-bang deployments.
> 3. **Traffic Partitioning**: API Gateway routes specific endpoints to new microservices while legacy routes stay on monolith.
> 
---

### Exercise 2: Distributed Microservice Saga Orchestration Engine

**Scenario:** An orchestrator coordinates a multi-service transaction (Order -> Payment -> Inventory), executing compensating transactions if any step fails.

**Requirements:**
1. Write executeSagaPipeline(stepsArray).
2. Execute forward steps.
3. If a step fails, run compensating steps in reverse.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function executeSagaPipeline(stepsArray = []) {
>   const executedSteps = [];
>
>   for (const step of stepsArray) {
>     try {
>       const result = await step.execute();
>       executedSteps.push(step);
>     } catch (err) {
>       const compensations = [];
>       for (let i = executedSteps.length - 1; i >= 0; i--) {
>         if (typeof executedSteps[i].compensate === "function") {
>           const compRes = await executedSteps[i].compensate();
>           compensations.push(compRes);
>         }
>       }
>       return { success: false, failedStep: step.name, error: err.message, compensations };
>     }
>   }
>
>   return { success: true, executedCount: executedSteps.length };
> }
>
> // Verification tests
> const step1 = { name: "CreateOrder", execute: async () => true, compensate: async () => "OrderCancelled" };
> const step2 = { name: "ProcessPayment", execute: async () => { throw new Error("Card Declined"); } };
>
> executeSagaPipeline([step1, step2]).then(res => {
>   console.assert(res.success === false && res.failedStep === "ProcessPayment", "Test 1 Failed");
>   console.assert(res.compensations[0] === "OrderCancelled", "Test 2 Failed: Must compensate step1");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Distributed Transactions**: Microservices cannot use ACID database transactions across independent databases.
> 2. **Saga Pattern**: Sequence of local transactions; if a step fails, compensating transactions undo preceding changes.
> 3. **Eventual Consistency**: Guarantees system reaches consistent state eventually after compensation steps complete.
> 
---

### Exercise 3: Microservice Network Latency & Call Hop Auditor

**Scenario:** Measures the network latency penalty of microservice call chains (A -> B -> C -> D) vs in-memory monolith function calls.

**Requirements:**
1. Write auditCallChainLatency(hopCount, avgNetworkRttMs).
2. Compare microservice chain latency vs monolith.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditCallChainLatency(hopCount = 3, avgNetworkRttMs = 15) {
>   const monolithTotalMs = 0.001 * hopCount;
>   const microservicesTotalMs = hopCount * avgNetworkRttMs;
>
>   const latencyMultiplier = Math.round(microservicesTotalMs / monolithTotalMs);
>
>   return {
>     hopCount,
>     monolithTotalMs,
>     microservicesTotalMs,
>     latencyMultiplier
>   };
> }
>
> // Verification tests
> const audit = auditCallChainLatency(4, 10);
> console.assert(audit.microservicesTotalMs === 40, "Test 1 Failed: 40ms microservice network latency");
> console.assert(audit.latencyMultiplier > 1000, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Microservice Latency Overhead**: Every microservice-to-microservice network call adds network RTT, serialization, and connection setup overhead.
> 2. **Monolith Function Speed**: In-memory monolith calls operate at nanosecond speeds without network hops.
> 3. **Service Granularity Warning**: Avoid creating overly granular 'nanoservices' that cause extreme network latency cascades.
---

## 6. Related Terms
- [API Gateway](api_gateway.md) — The routing entry point used to coordinate microservices traffic.
- [Load Balancing](load_balancing.md) — The process of distributing incoming requests to scaled service instances.

---

## 7. Key Takeaways
- Monoliths combine all application logic into a single codebase and server process.
- Microservices split applications into small, independently deployable services.
- Monoliths are simpler to build; microservices scale better and offer fault isolation.
- Each microservice must own its database; sharing a database couples services tightly.
- Network latency increases in microservices due to service-to-service calls.
- Startups should build a monolith first, refactoring to microservices as they scale.
