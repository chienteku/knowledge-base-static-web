# API Contract / Schema-First Design

> **Level 10 — Designing & Tooling**
> Agreeing the interface before writing code.

---

## 1. Prerequisites
- [REST (Representational State Transfer)](../level_03/rest.md) — The resource-based architectural paradigm.
- [Swagger / OpenAPI Specification](./openapi.md) — The language used to write machine-readable contracts.

---

## 2. Term Category
- **Architecture / Design**

---

## 3. Environment Context
- **Universal**: Governs the organizational workflow between frontend, backend, mobile, and QA engineering teams.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional software development, the backend team writes code to build API endpoints first, and only documents them afterward (or neglects documentation entirely). This "code-first" approach creates bottlenecks:
- **Frontend Blocking:** Frontend developers cannot write request logic or test UI views until the backend is fully coded and deployed to a staging server.
- **Integration Friction:** If backend developers change response keys midway through coding (e.g. from `createdAt` to `created_at`), the frontend breaks, causing integration delays.

To solve this coordination bottleneck, teams implement **Schema-First Design (API Contract Design)**:
- **The API Contract:** A machine-readable file (written in YAML or JSON using **OpenAPI/Swagger**) that details every endpoint, expected request payload, status code response, and data validation type.
- **The Workflow:** Both backend and frontend teams write the contract **together** before writing any code. Once approved:
  - The frontend team runs a **mock server** using the contract, allowing them to build and test the client interface immediately with fake data.
  - The backend team writes code to match the contract, using automated contract testing tools (like Prism or Dredd) to verify compliance.
  - Automatic tools can compile client libraries (SDKs) directly from the contract.

---

### (2) Reality Metaphor
Imagine building a new skyscraper.
- **Code-First Design** is like the bricklayers starting to build walls immediately. The plumbers walk in later and try to drill holes for pipes. If a wall was built in the wrong place, it must be demolished and rebuilt, causing expensive rework.
- **Schema-First Design** is drawing a **detailed architectural blueprint (the API Contract)** before buying any concrete or pipes. The bricklayers lay walls matching the blueprint measurements, and the plumbers order pipe connections that fit the blueprint layout. Both work concurrently, and the pipes fit into the walls on the first try.

---

### (3) API Contract Example (OpenAPI YAML)

Here is a segment of an API contract defining a user registration endpoint:

```yaml
openapi: 3.0.0
info:
  title: User Registration API
  version: 1.0.0
paths:
  /users:
    post:
      summary: Register a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - username
                - email
              properties:
                username:
                  type: string
                email:
                  type: string
                  format: email
      responses:
        '210':
          description: User registered successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: integer
                  username:
                    type: string
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Permitting code implementations to drift from the contract

**The mistake:** Changing property keys in the backend database code (e.g. changing `user_id` to `userId`) without updating the OpenAPI contract file.

**Why it's wrong:** The contract is the single source of truth. If the code deviates from it, client applications using mock servers based on the contract will fail when connected to the real production backend, negating the benefits of schema-first development.

*Fix:* Implement automated **Contract Verification Tests** in your CI/CD pipelines to block builds if the code response schemas do not match the API Contract file.

---

### Mistake 2: Violating API Contracts by Changing Response Data Types (Breaking Change)

**The mistake:** Changing response JSON field `id` from integer `123` to string `"123"` in a live endpoint.

**Why it's wrong:** Altering field types breaks strictly-typed client parsers (TypeScript, Swift, Java), causing runtime crashes in mobile apps.

*Incorrect:*
```javascript
// Changing response type in v1 endpoint
res.json({ id: "123" }); // ❌ Breaks clients expecting integer id: 123!
```

*Fix:*
```javascript
// Preserve existing field types or introduce new versioned API contract
```

---

### Mistake 3: Using Informal Verbal Agreements Instead of Machine-Readable Contract Specs (OpenAPI)

**The mistake:** Agreeing on API field structures via Slack messages without an OpenAPI/Swagger spec file.

**Why it's wrong:** Informal specs quickly drift from actual code implementations. Use machine-readable OpenAPI/JSON Schema specs for automated contract testing.

*Incorrect:*
```http
/* Relying on Slack notes for backend/frontend API field integration */
```

*Fix:*
```http
/* Author authoritative OpenAPI (OAS 3.0) YAML specs for contract validation */
```


---

## 6. Practice Exercises

### Exercise 1: Workflow Analysis

**Problem:** Which of the following is a primary benefit of Schema-First Design over Code-First Design?

- **A.** It makes the database run queries faster.
- **B.** It allows frontend and backend teams to develop code concurrently, reducing integration delays.
- **C.** It eliminates the need for unit testing.

> [!check]- Answer
> - **B** (By agreeing on the contract first, frontend developers use mock servers to build views while the backend implements the actual endpoint logic simultaneously).


---

### Exercise 2: Consumer-Driven Contract Testing (Pact)

**Problem:** What is the primary objective of Consumer-Driven Contract Testing tools like Pact?

**Expected output:**
> [!check]- Answer
> ```text
> Allows API consumers to define expected request/response contracts, validating backend services against those contracts during CI/CD builds before deployment.
> ```
> ```text
> Allows API consumers to define expected request/response contracts, validating backend services against those contracts during CI/CD builds before deployment.
> ```
> - **Explanation:** Contract testing prevents breaking API changes from entering production.
---

### Exercise 3: Backward Compatible API Changes

**Problem:** Which 2 modifications to an API response contract are considered backward compatible?
1. Adding a new optional response field
2. Removing an existing response field
3. Renaming an existing field key

**Expected output:**
> [!check]- Answer
> ```text
> Modification 1 (Adding new optional response fields is backward compatible).
> ```
> ```text
> Modification 1 -> Adding new optional response fields is backward compatible.
> Modifying/removing existing fields breaks contracts.
> ```
> - **Explanation:** Adding new optional fields preserves existing client compatibility.
---

## 7. Related Terms
- [Mocking APIs](./mocking.md) — The process of serving mock data derived directly from the API contract.
- [API Versioning (v1, v2)](./versioning.md) — The process of releasing updates to a contract without breaking legacy systems.

---

## 8. Key Takeaways
- Schema-First Design establishes an API Contract before writing code.
- The contract defines paths, request bodies, status codes, and data schemas.
- It enables frontend and backend teams to develop concurrently using mock servers.
- OpenAPI/Swagger is the standard language used to write machine-readable contracts.
- Automated contract testing prevents code implementations from drifting from the contract.
