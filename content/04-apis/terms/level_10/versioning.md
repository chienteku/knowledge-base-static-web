# API Versioning (v1, v2)

> **Level 10 — Designing & Tooling**
> The practice of creating a new, separate iteration of your API when making breaking changes, so you don't instantly crash all the old applications currently using it.

---

## 1. Prerequisites
- [REST (Representational State Transfer)](../level_03/rest.md) — The architecture where versioning is most heavily debated.
- [Endpoints & Resources](../level_03/endpoints_resources.md) — The URLs that get versioned.

---

## 2. Term Category

**API Architecture / Best Practices (Backend Architecture)**: API Versioning (v1, v2) is a fundamental concept in this technology stack. **Level 10 — Designing & Tooling**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you build an endpoint `GET /api/users`. It returns an array of strings: `["Bob", "Alice"]`. Thousands of mobile apps download your API and write code expecting an array of strings.
Six months later, your manager says: "We need more data. Change the API to return an array of Objects: `[{name: 'Bob'}, {name: 'Alice'}]`."
If you just change the code on the server and deploy it, **every single mobile app in the world will instantly crash** because their code is trying to read strings, not objects. This is called a "Breaking Change."
Because you cannot force users to update their mobile apps, you must support *both* the old code and the new code simultaneously. This is **API Versioning**.

### (2) How it looks (URL Versioning)
The most common way to version an API is to put a `/v1/` or `/v2/` directly into the URL path.
- The old mobile apps keep calling: `GET /api/v1/users` (returns Strings).
- The newly updated apps call: `GET /api/v2/users` (returns Objects).
Your backend server literally runs both versions of the code side-by-side.

### (3) The Cost of Versioning
Versioning is heavily discouraged unless absolutely necessary. 
Why? Because if you have a `v1`, `v2`, and `v3` API running simultaneously, you have to fix a bug in three different places! It doubles or triples your maintenance workload.
A change is only "Breaking" if you rename/delete a field, or change its data type. **Adding** a new field is *not* a breaking change, and does not require a new version!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Versioning because of a new feature

**The mistake:** A developer builds `GET /api/v1/posts`. A week later, they want to add a new `GET /api/comments` endpoint. They decide to bump the whole API to `v2` because it has new features.

**Why it's wrong:** Version bumps are for *Destructive* changes only! If you add a new endpoint, or if you add a new `createdAt` field to an existing JSON response, old clients will simply ignore the new data. Their code won't break. You only bump to `v2` if you are destroying or mutating existing behavior that old clients rely on.
**Golden Rule:** Avoid creating a `v2` at all costs. Always try to make your changes backwards-compatible.

---

### Mistake 2: Using Query Parameter Versioning (`?v=2`) for Major Breaking API Changes

**The mistake:** Versioning major breaking structural API changes using optional query parameters (`/users?version=2`).

**Why it's wrong:** Query parameters are easily omitted by clients and complicate caching layers. Use **URI Path Versioning** (`/v1/users` vs `/v2/users`) or **Header Versioning** for major breaking changes.

*Incorrect:*
```http
GET /api/users?v=2 HTTP/1.1 ; ❌ Easily omitted query parameter versioning!
```

*Fix:*
```http
GET /api/v2/users HTTP/1.1 ; Explicit URI path versioning
```

---

### Mistake 3: Creating New API Major Versions for Non-Breaking Compatible Field Additions

**The mistake:** Bumping API version from `/v1/users` to `/v2/users` simply to add a new optional `middleName` field.

**Why it's wrong:** Adding optional fields is backward compatible. Bumping major versions for non-breaking changes forces unnecessary migration work for clients. Reserve major versions for breaking contract changes.

*Incorrect:*
```http
/* Bumping version /v1 -> /v2 to add optional field */
```

*Fix:*
```http
/* Add optional fields directly to /v1 endpoint without version bump */
```


---

## 5. Practice Exercises

### Exercise 1: Multi-Strategy API Version Extractor

**Scenario:** An API gateway extracts the requested API version from URI path (`/v1/`), custom header (`X-API-Version`), or `Accept` header.

**Requirements:**
1. Write extractApiVersion(req).
2. Check URI path first (`/v1/`, `/v2/`).
3. Check `X-API-Version` header.
4. Check `Accept` header vendor media type.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function extractApiVersion(req = {}) {
>   const path = req.path || "";
>   const headers = req.headers || {};
>
>   // 1. URI Path Strategy: /v1/users or /v2/orders
>   const pathMatch = path.match(/\/v(\d+)(\/|$)/i);
>   if (pathMatch) {
>     return { version: `v${pathMatch[1]}`, source: "URI_PATH" };
>   }
>
>   // 2. Custom Header Strategy: X-API-Version: 2
>   const headerVer = headers["x-api-version"] || headers["X-API-Version"];
>   if (headerVer) {
>     return { version: headerVer.startsWith("v") ? headerVer : `v${headerVer}`, source: "HEADER" };
>   }
>
>   // 3. Accept Header Content Negotiation: Accept: application/vnd.company.v2+json
>   const accept = headers["accept"] || headers["Accept"] || "";
>   const acceptMatch = accept.match(/vnd\.[^.]+\.v(\d+)\+json/i);
>   if (acceptMatch) {
>     return { version: `v${acceptMatch[1]}`, source: "ACCEPT_HEADER" };
>   }
>
>   return { version: "v1", source: "DEFAULT_FALLBACK" }; // Default fallback
> }
>
> // Verification tests
> console.assert(extractApiVersion({ path: "/v2/users" }).version === "v2", "Test 1 Failed: Path strategy");
> console.assert(extractApiVersion({ headers: { "X-API-Version": "3" } }).version === "v3", "Test 2 Failed: Header strategy");
> console.assert(extractApiVersion({ headers: { "Accept": "application/vnd.myco.v4+json" } }).version === "v4", "Test 3 Failed: Accept header strategy");
> ```
>
> #### Technical Explanation
>
> 1. **API Versioning Strategies**: Three main approaches: URI Path (/v1/), Custom Header (X-API-Version), and Content Negotiation (Accept header).
> 2. **URI Path Versioning**: Most common and developer-friendly pattern; explicitly visible in URLs.
> 3. **Content Negotiation Versioning**: Strict REST approach keeping URLs clean while requesting specific media type versions.
> 
---

### Exercise 2: Express-Style API Version Routing Middleware

**Scenario:** A server middleware routes HTTP requests to different controller version modules (`v1Controller` vs `v2Controller`) based on requested version.

**Requirements:**
1. Write createVersionRouter(versionMap).
2. Extract version.
3. Route request to matching version controller.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createVersionRouter(versionMap = {}) {
>   return function routeVersion(req) {
>     const versionObj = req.version || { version: "v1" };
>     const verKey = versionObj.version;
>
>     const controller = versionMap[verKey] || versionMap["v1"];
>     if (!controller) {
>       return { status: 400, error: `API Version '${verKey}' not supported` };
>     }
>
>     return { status: 200, activeVersion: verKey, controller };
>   };
> }
>
> // Verification tests
> const v1Ctrl = () => "v1_data";
> const v2Ctrl = () => "v2_data";
> const router = createVersionRouter({ v1: v1Ctrl, v2: v2Ctrl });
>
> const res = router({ version: { version: "v2" } });
> console.assert(res.activeVersion === "v2" && res.controller() === "v2_data", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Version Routing Isolation**: Separates controller code for v1 and v2 to keep codebase clean during migration.
> 2. **Graceful Fallback**: Falls back to default major version (v1) if un-versioned request arrives.
> 3. **Major Version Branching**: Major version changes indicate incompatible API contract updates.
> 
---

### Exercise 3: Semantic Versioning (SemVer) Compatibility Validator

**Scenario:** Evaluates whether client SDK SemVer versions (MAJOR.MINOR.PATCH) are compatible with server API versions.

**Requirements:**
1. Write checkSemverCompatibility(clientVersionStr, serverVersionStr).
2. Allow MINOR and PATCH updates; reject MAJOR mismatches.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function checkSemverCompatibility(clientVersionStr, serverVersionStr) {
>   const parse = (v) => v.replace(/^v/, "").split(".").map(n => parseInt(n, 10));
>
>   const [cMajor, cMinor] = parse(clientVersionStr);
>   const [sMajor, sMinor] = parse(serverVersionStr);
>
>   if (cMajor !== sMajor) {
>     return {
>       compatible: false,
>       reason: `Breaking change: Major version mismatch (Client v${cMajor} vs Server v${sMajor})`
>     };
>   }
>
>   return {
>     compatible: true,
>     isClientOutdated: sMinor > cMinor
>   };
> }
>
> // Verification tests
> const c1 = checkSemverCompatibility("1.2.0", "1.4.0");
> console.assert(c1.compatible === true && c1.isClientOutdated === true, "Test 1 Failed: Same MAJOR is compatible");
>
> const c2 = checkSemverCompatibility("1.2.0", "2.0.0");
> console.assert(c2.compatible === false, "Test 2 Failed: MAJOR mismatch is incompatible");
> ```
>
> #### Technical Explanation
>
> 1. **Semantic Versioning (SemVer)**: MAJOR.MINOR.PATCH versioning format (e.g. 2.1.4).
> 2. **MAJOR Version Bump**: Increments for incompatible, breaking API contract changes.
> 3. **MINOR & PATCH Bumps**: Increments for backward-compatible feature additions (MINOR) and bug fixes (PATCH).
---

## 6. Related Terms
- [Endpoints & Resources](../level_03/endpoints_resources.md) — Where the `/v1/` is injected.
- [GraphQL (The REST Alternative)](../level_07/graphql.md) — GraphQL famously avoids versioning because clients specifically ask for the exact fields they want. If a field is deprecated, GraphQL just throws a warning.
- [Content Negotiation (Accept)](../level_02/content_negotiation.md) — Related concept: Content Negotiation (Accept).
- [Resource Naming & URI Design](../level_03/resource_naming.md) — Related concept: Resource Naming & URI Design.
- [API Contract / Schema-First Design](api_contract.md) — Related concept: API Contract / Schema-First Design.
- [Deprecation & Sunsetting](deprecation_sunsetting.md) — Related concept: Deprecation & Sunsetting.
- [API Gateway](api_gateway.md) — Related concept: API Gateway.

---

## 7. Key Takeaways
- **API Versioning** allows old, outdated clients to continue working while new clients get updated data structures.
- It is most commonly implemented in the URL path (e.g., `/api/v1/resource`).
- You should only create a new version for **Breaking Changes** (renaming, deleting, or changing data types).
- Adding new endpoints or new fields to a JSON payload is non-breaking.
