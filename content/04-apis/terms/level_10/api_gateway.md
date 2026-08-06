# API Gateway

> **Level 10 — Designing & Tooling**
> The single entry point that routes/authenticates/rate-limits.

---

## 1. Prerequisites
- [REST (Representational State Transfer)](../level_03/rest.md) — The resource-based communication style.
- [Rate Limiting (429 Too Many Requests)](../level_06/rate_limiting.md) — The policies limiting client queries.

---

## 2. Term Category
- **Architecture / Design**

---

## 3. Environment Context
- **Universal**: Acts as the entry gate for frontend client integrations and microservice service routers.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a microservices architecture, you might have dozens of backend services running on separate internal servers and port ranges (e.g. User Service on port 3001, Billing Service on port 3002, Catalog Service on port 3003).

If frontend client applications (like a web app) attempt to communicate directly with these microservices, problems arise:
- **URL Bloat:** Clients must manage dozens of different backend base URLs.
- **Duplicated Logic:** Every microservice must implement its own authentication checking, CORS header configuration, logging, and rate-limiting.
- **Brittle Client Code:** If you split or rename an internal backend service, the client codebase breaks.

To solve this, developers place an **API Gateway** in front of their microservices:
- **The Gateway:** A reverse proxy server acting as the **single entry point** for all client requests.
- **Routing:** Clients send all requests to one domain (e.g. `api.app.com`). The gateway inspects the request path and forwards it internally (e.g. routing `/users/*` to port 3001, and `/payments/*` to port 3002).
- **Cross-Cutting Concerns:** The gateway handles authentication token verification, SSL decryption (SSL termination), CORS policy resolution, and rate-limiting at the network edge. This keeps downstream microservices simple and focused.

---

### (2) Architectural Flow

```text
                  ┌──────────────────────┐
                  │     API GATEWAY      │
                  │                      │
  [ Web Client ] ─┼─> (1) Authenticates  │    ┌───> [ User Service (Port 3001) ]
                  │   (2) Rate Limits    │───┼───> [ Billing Service (Port 3002) ]
                  │   (3) Routes Path    │    └───> [ Catalog Service (Port 3003) ]
                  └──────────────────────┘
```

---

### (3) Reality Metaphor
Imagine entering a large corporate headquarters building.
- **Without an API Gateway** is like walking into a building with 50 offices but **no lobby desk**. Visitors wander corridors, knock on doors, and ask: *"Are you Billing?"* Each office must hire its own receptionist to check visitor badges.
- **With an API Gateway** is like placing a **single reception security desk at the front lobby**. The lobby guard checks your ID (**Authentication**), confirms your appointment (**Rate Limiting**), and tells you: *"Take the elevator to room 402"* (**Routing**). The individual offices do not need their own security checks because the lobby guard already verified everyone.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Embedding custom business logic inside the API Gateway

**The mistake:** Writing code inside the API Gateway that queries database tables directly or converts JSON data formats.

**Why it's wrong:** The API Gateway is a high-throughput routing layer. Adding database queries or business rules turns it into a monolithic bottleneck. It couples the gateway to your services, forcing you to deploy the gateway every time you change a database schema.

*Fix:* Keep the gateway "thin." Limit its responsibilities strictly to routing, token validation, rate-limiting, and header manipulation.

---

### Mistake 2: Overloading API Gateways with Heavy Business Logic (Monolithic Gateway Anti-Pattern)

**The mistake:** Writing complex database queries and order calculations inside an API Gateway configuration layer (Kong/AWS API Gateway).

**Why it's wrong:** API Gateways should focus on cross-cutting concerns (routing, rate limiting, TLS termination, auth). Heavy business logic turns the gateway into a bottleneck single-point-of-failure.

*Incorrect:*
```http
/* Writing custom business domain logic inside API Gateway Lua/JS scripts */
```

*Fix:*
```http
/* Keep Gateway lean (Routing, Rate Limiting, Auth); delegate business logic to downstream microservices */
```

---

### Mistake 3: Exposing Microservice Internal Endpoints Directly to Public Internet Without Gateway Protection

**The mistake:** Bypassing the API Gateway and allowing direct public access to internal backend microservice ports.

**Why it's wrong:** Direct exposure exposes microservices to un-authenticated attacks and bypasses centralized rate limiting and security filters. Internal microservices should sit behind private VPC subnets.

*Incorrect:*
```http
/* Exposing internal microservice port 8081 to public internet */
```

*Fix:*
```http
/* Restrict microservices to private VPC; route public traffic through API Gateway */
```


---

## 6. Practice Exercises

### Exercise 1: Responsibility Audit

**Problem:** Identify which of the following is **not** a standard responsibility of a thin API Gateway:

- **A.** Terminating SSL certificates (decrypting HTTPS requests to HTTP for internal service networks).
- **B.** Calculating shopping cart discounts based on a user's loyalty points.
- **C.** Blocking IP addresses that exceed a rate limit of 100 requests per minute.

> [!check]- Answer
> - **B** (Calculating cart discounts is business logic. This belongs inside the Billing/Checkout microservice, not the API Gateway routing layer).
> 
> 
---

### Exercise 2: API Gateway Responsibilities Matrix

**Problem:** List 4 primary cross-cutting responsibilities managed by an enterprise API Gateway.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Request Routing / Reverse Proxying
> 2. Centralized Authentication & Authorization
> 3. Rate Limiting & Throttling
> 4. TLS Termination & CORS management
> ```
> ```text
> 1. Request Routing / Reverse Proxying
> 2. Centralized Authentication & Authorization
> 3. Rate Limiting & Throttling
> 4. TLS Termination & CORS management
> ```
> - **Explanation:** API Gateways centralize entry-point security, routing, and traffic management.
---

### Exercise 3: BFF (Backend-For-Frontend) Pattern

**Problem:** What is the Backend-For-Frontend (BFF) API Gateway pattern?

**Expected output:**
> [!check]- Answer
> ```text
> Creating tailored API Gateway instances for specific client types (e.g. Mobile BFF vs Web BFF) to optimize payload structures for each platform.
> ```
> ```text
> Creating tailored API Gateway instances for specific client types (e.g. Mobile BFF vs Web BFF) to optimize payload structures for each platform.
> ```
> - **Explanation:** BFF gateways customize API payloads for specific client device needs.
---

## 7. Related Terms
- [Microservices vs Monolith](microservices_monolith.md) — The backend architectures managed by gateways.
- [Load Balancing](load_balancing.md) — The process of distributing routed traffic to scaled service instances.
- [Rate Limiting (429 Too Many Requests)](../level_06/rate_limiting.md) — Gateway rate limiting.
- [API Versioning (v1, v2)](versioning.md) — API versioning at gateway.

---

## 8. Key Takeaways
- The API Gateway acts as the single reverse proxy entry point for all client requests.
- It routes incoming HTTP requests to internal microservice ports based on URL paths.
- It centralizes cross-cutting concerns (SSL termination, CORS, Auth, Rate Limiting).
- Gateways simplify client integrations by hiding internal service layouts.
- Keep the gateway thin; avoid adding business logic or database queries.
