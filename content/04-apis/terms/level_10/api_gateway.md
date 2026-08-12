# API Gateway

> **Level 10 — Designing & Tooling**
> The single entry point that routes/authenticates/rate-limits.

---

## 1. Prerequisites
- [REST (Representational State Transfer)](../level_03/rest.md) — The resource-based communication style.
- [Rate Limiting (429 Too Many Requests)](../level_06/rate_limiting.md) — The policies limiting client queries.

---

## 2. Term Category

**Architecture / Design (Universal: Acts as the entry gate for frontend client integrations and microservice service routers.)**: API Gateway is a fundamental concept in this technology stack. **Level 10 — Designing & Tooling**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Reverse Proxy API Gateway Route Manager

**Scenario:** An API Gateway inspects request URLs and routes them to upstream microservices (`/users/*` -> UserService, `/orders/*` -> OrderService).

**Requirements:**
1. Write routeGatewayRequest(path, microservicesMap).
2. Match prefix.
3. Return target upstream URL.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function routeGatewayRequest(path, microservicesMap = {}) {
>   if (!path || typeof path !== "string") return null;
>
>   for (const [prefix, upstreamUrl] of Object.entries(microservicesMap)) {
>     if (path.startsWith(prefix)) {
>       const targetPath = path.substring(prefix.length);
>       const cleanUpstream = upstreamUrl.replace(/\/$/, "");
>       const cleanPath = targetPath.startsWith("/") ? targetPath : "/" + targetPath;
>
>       return {
>         matched: true,
>         prefix,
>         upstreamUrl: `${cleanUpstream}${cleanPath}`
>       };
>     }
>   }
>
>   return { matched: false, upstreamUrl: null };
> }
>
> // Verification tests
> const routes = {
>   "/api/v1/users": "https://user-service.internal:8080",
>   "/api/v1/orders": "https://order-service.internal:8081"
> };
>
> const routed = routeGatewayRequest("/api/v1/users/42", routes);
> console.assert(routed.matched === true, "Test 1 Failed");
> console.assert(routed.upstreamUrl === "https://user-service.internal:8080/42", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **API Gateway Pattern**: Single entry point for all client requests, routing traffic to internal backend microservices.
> 2. **URL Path Rewriting**: Strips gateway prefixes and rewrites paths before proxying to upstream services.
> 3. **Microservice Decoupling**: Conceals internal microservice network topology and IP addresses from external public clients.
> 
---

### Exercise 2: Cross-Cutting Correlation ID Gateway Filter

**Scenario:** An API Gateway middleware injects a unique `X-Correlation-ID` header into incoming requests if missing, enabling end-to-end distributed tracing.

**Requirements:**
1. Write enforceCorrelationId(headers).
2. Check X-Correlation-ID presence.
3. Generate UUID if missing and attach to headers.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function enforceCorrelationId(headers = {}, mockUuidGenerator) {
>   const normalized = { ...headers };
>   const existingId = normalized["x-correlation-id"] || normalized["X-Correlation-ID"];
>
>   if (existingId) {
>     return { correlationId: existingId, headers: normalized, generated: false };
>   }
>
>   const newId = mockUuidGenerator 
>     ? mockUuidGenerator() 
>     : `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
>
>   normalized["X-Correlation-ID"] = newId;
>
>   return {
>     correlationId: newId,
>     headers: normalized,
>     generated: true
>   };
> }
>
> // Verification tests
> const res1 = enforceCorrelationId({ "X-Correlation-ID": "existing_123" });
> console.assert(res1.generated === false && res1.correlationId === "existing_123", "Test 1 Failed");
>
> const res2 = enforceCorrelationId({});
> console.assert(res2.generated === true && res2.correlationId.startsWith("corr_"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Distributed Tracing**: Tracking a single client request as it traverses multiple microservices.
> 2. **X-Correlation-ID Header**: Standard HTTP header passed across microservice calls to aggregate logs in central tools (Datadog, Kibana).
> 3. **Cross-Cutting Gateway Concerns**: API Gateways handle authentication, logging, rate limiting, and header injection globally.
> 
---

### Exercise 3: Gateway Authentication & Rate Limit Security Filter

**Scenario:** An API Gateway filter evaluates request JWT tokens and client IP rate limits before forwarding traffic upstream.

**Requirements:**
1. Write evaluateGatewaySecurity(authHeader, clientIp, rateLimiterFn, authVerifierFn).
2. Check auth and rate limit.
3. Return 200, 401, or 429.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function evaluateGatewaySecurity(authHeader, clientIp, rateLimiterFn, authVerifierFn) {
>   const isAllowedRate = await rateLimiterFn(clientIp);
>   if (!isAllowedRate) {
>     return { allowed: false, status: 429, error: "Too Many Requests" };
>   }
>
>   const isAuthenticated = await authVerifierFn(authHeader);
>   if (!isAuthenticated) {
>     return { allowed: false, status: 401, error: "Unauthorized" };
>   }
>
>   return { allowed: true, status: 200 };
> }
>
> // Verification tests
> const allowRate = async () => true;
> const blockRate = async () => false;
> const validAuth = async (h) => h === "Bearer ok";
>
> evaluateGatewaySecurity("Bearer ok", "1.1.1.1", blockRate, validAuth).then(r1 => {
>   console.assert(r1.status === 429, "Test 1 Failed: Rate limit must take precedence");
>
>   return evaluateGatewaySecurity("Bearer bad", "1.1.1.1", allowRate, validAuth).then(r2 => {
>     console.assert(r2.status === 401, "Test 2 Failed: Invalid auth rejected");
>   });
> });
> ```
>
> #### Technical Explanation
>
> 1. **Centralized Gateway Security**: Offloads auth verification and rate limiting from individual backend microservices to the gateway.
> 2. **Resource Protection**: Blocks malicious or unauthenticated traffic at the edge of the network.
> 3. **Performance Optimization**: Reduces CPU load on backend microservices by rejecting invalid requests early.
---

## 6. Related Terms
- [Microservices vs Monolith](microservices_monolith.md) — The backend architectures managed by gateways.
- [Load Balancing](load_balancing.md) — The process of distributing routed traffic to scaled service instances.
- [Rate Limiting (429 Too Many Requests)](../level_06/rate_limiting.md) — Gateway rate limiting.
- [API Versioning (v1, v2)](versioning.md) — API versioning at gateway.

---

## 7. Key Takeaways
- The API Gateway acts as the single reverse proxy entry point for all client requests.
- It routes incoming HTTP requests to internal microservice ports based on URL paths.
- It centralizes cross-cutting concerns (SSL termination, CORS, Auth, Rate Limiting).
- Gateways simplify client integrations by hiding internal service layouts.
- Keep the gateway thin; avoid adding business logic or database queries.
