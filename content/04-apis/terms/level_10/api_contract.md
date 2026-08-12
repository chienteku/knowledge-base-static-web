# API Contract / Schema-First Design

> **Level 10 — Designing & Tooling**
> Agreeing the interface before writing code.

---

## 1. Prerequisites
- [REST (Representational State Transfer)](../level_03/rest.md) — The resource-based architectural paradigm.
- [Swagger / OpenAPI Specification](openapi.md) — The language used to write machine-readable contracts.

---

## 2. Term Category

**Architecture / Design (Universal: Governs the organizational workflow between frontend, backend, mobile, and QA engineering teams.)**: API Contract / Schema-First Design is a fundamental concept in this technology stack. **Level 10 — Designing & Tooling**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: JSON Schema API Contract Validator

**Scenario:** An API gateway validates incoming request payloads against an agreed-upon JSON Schema API contract before routing to backend microservices.

**Requirements:**
1. Write validateApiContract(payloadObj, contractSchema).
2. Check field presence.
3. Check primitive types (string, number, boolean).
4. Return { valid, errors }.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateApiContract(payloadObj, contractSchema = {}) {
>   if (!payloadObj || typeof payloadObj !== "object") {
>     return { valid: false, errors: ["Payload must be a non-null object"] };
>   }
>
>   const errors = [];
>   const requiredFields = contractSchema.required || [];
>   const properties = contractSchema.properties || {};
>
>   for (const field of requiredFields) {
>     if (!(field in payloadObj) || payloadObj[field] === undefined || payloadObj[field] === null) {
>       errors.push(`Contract violation: missing required field '${field}'`);
>     }
>   }
>
>   for (const [key, rules] of Object.entries(properties)) {
>     if (key in payloadObj && payloadObj[key] !== undefined) {
>       const actualType = typeof payloadObj[key];
>       if (rules.type && actualType !== rules.type) {
>         errors.push(`Contract violation: field '${key}' expected type '${rules.type}', got '${actualType}'`);
>       }
>     }
>   }
>
>   return { valid: errors.length === 0, errors };
> }
>
> // Verification tests
> const schema = {
>   required: ["userId", "email"],
>   properties: {
>     userId: { type: "number" },
>     email: { type: "string" }
>   }
> };
>
> const res1 = validateApiContract({ userId: 101, email: "a@a.com" }, schema);
> console.assert(res1.valid === true, "Test 1 Failed");
>
> const res2 = validateApiContract({ userId: "invalid_string" }, schema);
> console.assert(res2.valid === false && res2.errors.length === 2, "Test 2 Failed: Identifies missing email and bad userId type");
> ```
>
> #### Technical Explanation
>
> 1. **API Contract Concept**: Formal specification (JSON Schema, OpenAPI) defining request/response structures between producer and consumer.
> 2. **Gateway Validation Shift-Left**: Validating contract schema at the API gateway rejects invalid payloads before hitting internal backend services.
> 3. **Consumer-Driven Contracts**: Ensures frontend and backend teams align on property names and data types.
> 
---

### Exercise 2: Breaking Change Contract Detector

**Scenario:** An API CI/CD pipeline tool compares new API response schemas against existing contracts to detect breaking changes.

**Requirements:**
1. Write detectContractBreakingChanges(oldSchema, newSchema).
2. Flag removed fields or changed primitive types.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function detectContractBreakingChanges(oldSchema = {}, newSchema = {}) {
>   const breakingChanges = [];
>
>   const oldProps = oldSchema.properties || {};
>   const newProps = newSchema.properties || {};
>
>   for (const [key, oldRules] of Object.entries(oldProps)) {
>     if (!(key in newProps)) {
>       breakingChanges.push(`Breaking change: removed field '${key}'`);
>     } else if (oldRules.type !== newProps[key].type) {
>       breakingChanges.push(`Breaking change: type of '${key}' changed from '${oldRules.type}' to '${newProps[key].type}'`);
>     }
>   }
>
>   return { isBreaking: breakingChanges.length > 0, breakingChanges };
> }
>
> // Verification tests
> const v1 = { properties: { id: { type: "number" }, name: { type: "string" } } };
> const v2 = { properties: { id: { type: "string" } } };
>
> const res = detectContractBreakingChanges(v1, v2);
> console.assert(res.isBreaking === true && res.breakingChanges.length === 2, "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Backward Compatibility**: Additive changes (adding optional fields) are non-breaking; removing fields or altering types breaks clients.
> 2. **CI/CD Breaking Change Guards**: Automated contract testing prevents deploying updates that break frontend API integrations.
> 3. **Major Version Triggers**: Breaking changes require bumping the major API version number (v1 -> v2).
> 
---

### Exercise 3: Consumer-Pact Contract Testing Verifier

**Scenario:** Simulates Consumer-Driven Contract testing (Pact) by verifying server responses match consumer expected mock interactions.

**Requirements:**
1. Write verifyConsumerPact(interaction, mockServerFn).
2. Execute interaction.
3. Assert response matches expected contract.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function verifyConsumerPact(expectedInteraction, mockServerFn) {
>   const { request, response: expectedResponse } = expectedInteraction;
>
>   const actualResponse = await mockServerFn(request.method, request.path, request.body);
>
>   const statusMatches = actualResponse.status === expectedResponse.status;
>
>   return {
>     valid: statusMatches,
>     statusMatches
>   };
> }
>
> // Verification tests
> const pact = {
>   request: { method: "GET", path: "/users/1" },
>   response: { status: 200 }
> };
>
> const mockServer = async (m, p) => ({ status: 200 });
>
> verifyConsumerPact(pact, mockServer).then(res => {
>   console.assert(res.valid === true, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Consumer-Driven Contract (Pact)**: Testing strategy where API consumers write tests specifying expected API provider behavior.
> 2. **Decoupled Integration Testing**: Verifies producer and consumer compatibility without needing active end-to-end environment deployment.
> 3. **Contract Mismatch Alerts**: Flags discrepancies between frontend expectations and backend responses early in build cycles.
---

## 6. Related Terms
- [Mocking APIs](mocking.md) — The process of serving mock data derived directly from the API contract.
- [API Versioning (v1, v2)](versioning.md) — The process of releasing updates to a contract without breaking legacy systems.
- [Deprecation & Sunsetting](deprecation_sunsetting.md) — Related concept: Deprecation & Sunsetting.
- [Swagger / OpenAPI Specification](openapi.md) — Related concept: Swagger / OpenAPI Specification.

---

## 7. Key Takeaways
- Schema-First Design establishes an API Contract before writing code.
- The contract defines paths, request bodies, status codes, and data schemas.
- It enables frontend and backend teams to develop concurrently using mock servers.
- OpenAPI/Swagger is the standard language used to write machine-readable contracts.
- Automated contract testing prevents code implementations from drifting from the contract.
