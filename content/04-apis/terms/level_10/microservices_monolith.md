# Microservices vs Monolith

> **Level 10 — Designing & Tooling**
> Why many small APIs vs one big one.

---

## 1. Prerequisites
- [API (Application Programming Interface)](../level_03/api.md) — The core interface connection concepts.
- [REST (Representational State Transfer)](../level_03/rest.md) — The resource-focused communication style.

---

## 2. Term Category
- **Architecture / Design**

---

## 3. Environment Context
- **Universal**: Governs the organizational structure of engineering codebases and server deployments.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Scaling Analysis

**Problem:** You are running an e-commerce platform. During black Friday, payment volume spikes, but users are not updating their profile details. Which architecture allows you to scale the payment capacity without duplicating the user-management code?

- **A.** Monolith
- **B.** Microservices

> [!check]- Answer
> - **B (Microservices).** You can scale up the Billing microservice by running more containers of that specific service, leaving the User service running at its normal scale.


---

### Exercise 2: Monolith vs Microservices Trade-Off Matrix

**Problem:** Compare Monolith vs Microservices across:
1. Deployment Complexity
2. Codebase Refactoring Ease
3. Independent Service Scaling

**Expected output:**
```text
1. Monolith: Low (Single CI/CD pipeline); Microservices: High (Multiple pipelines & containers)
2. Monolith: Easy (In-memory function calls); Microservices: Hard (Distributed API contracts)
3. Monolith: Hard (Scale entire app); Microservices: Easy (Scale individual hot services)
```

> [!check]- Answer
> ```text
> Deployment -> Monolith: Simple, Microservices: Complex (Orchestration required)
> Refactoring -> Monolith: Easy in-memory, Microservices: Complex network contracts
> Scaling     -> Monolith: Scale entire box, Microservices: Scale specific hot nodes
> ```
> - **Explanation:** Microservices trade operational simplicity for independent team scaling.
---

### Exercise 3: Database-per-Service Pattern

**Problem:** How do microservices join data across services without direct cross-database SQL queries?

**Expected output:**
```text
Via API call aggregation (Gateway/BFF), Event-Driven Pub/Sub domain events, or CQRS read models.
```

> [!check]- Answer
> ```text
> Via API call aggregation (Gateway/BFF), Event-Driven Pub/Sub domain events, or CQRS read models.
> ```
> - **Explanation:** Microservices communicate via APIs or async event streams rather than shared SQL joins.
---

## 7. Related Terms
- [API Gateway](./api_gateway.md) — The routing entry point used to coordinate microservices traffic.
- [Load Balancing](./load_balancing.md) — The process of distributing incoming requests to scaled service instances.

---

## 8. Key Takeaways
- Monoliths combine all application logic into a single codebase and server process.
- Microservices split applications into small, independently deployable services.
- Monoliths are simpler to build; microservices scale better and offer fault isolation.
- Each microservice must own its database; sharing a database couples services tightly.
- Network latency increases in microservices due to service-to-service calls.
- Startups should build a monolith first, refactoring to microservices as they scale.
