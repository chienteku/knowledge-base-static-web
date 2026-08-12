# API Versioning

> **Level 9 — REST APIs & Best Practices**
> `/api/v1/...` — evolving an API without breaking existing clients.

---

## 1. Prerequisites
- [REST API Design](rest_api.md) — The fundamental principles of API endpoint structures.

---

## 2. Term Category

**Architecture / Design Pattern (Web App Server Layer .)**: API Versioning is a fundamental concept in this technology stack. **Level 9 — REST APIs & Best Practices**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Web APIs are living systems. Over time, you need to add features, restructure schemas, or rename fields. However, making breaking updates (such as renaming `user_id` to `userId`, changing an object data type into an array, or removing a key) will instantly crash existing mobile apps, frontend applications, and partner integrations that rely on the old format.

To update an API without breaking existing clients, developers implement **API Versioning**:
-   **URI Path Versioning (Most Common):** The version identifier is embedded directly in the request path:
    `/api/v1/users` or `/api/v2/users`
    This allows you to deploy v1 and v2 controllers simultaneously inside the same Node.js process.
-   **Header-based Versioning:** The client specifies the requested version in HTTP headers (e.g. `Accept: application/vnd.myapi.v2+json` or `X-API-Version: 2`), keeping the URL clean.
-   **Query Parameter Versioning:** Appended in the query string: `/api/users?version=2`.

---

### (2) Reality Metaphor
Imagine electrical outlets in a house.
- **Non-versioned API:** You decide to replace all the standard two-prong electrical outlets in your house with a new circular-pin standard overnight. Every appliance you own (phone charger, toaster) instantly stops working unless you rewire them.
- **Versioned API:** You keep the two-prong outlets active on one wall (**Version 1**) while installing the new circular-pin outlets on another wall (**Version 2**). Older appliances can still draw power safely from the v1 outlets, while new appliances plug into v2. Once all old appliances are decommissioned, you can plaster over the v1 outlets (**deprecation and sunsetting**).

---

### (3) Express Implementation Example

Implementing v1 and v2 routes side-by-side in Express using routers:

```javascript
const express = require('express');
const app = express();

// ==========================================
// VERSION 1 (Legacy client payload format)
// ==========================================
const v1Router = express.Router();
v1Router.get('/user', (req, res) => {
  // Returns legacy 'user_id' string key
  res.json({ user_id: "usr_99", name: "Alice" });
});

// ==========================================
// VERSION 2 (Modernized camelCase format)
// ==========================================
const v2Router = express.Router();
v2Router.get('/user', (req, res) => {
  // Returns modern camelCase 'userId' key
  res.json({ userId: 99, name: "Alice" }); // Number ID and camelCase
});

// Mount the routers under versioned paths
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

app.listen(3000);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Incrementing version numbers for non-breaking, backward-compatible additions

**The mistake:** Upgrading an entire API from `v1` to `v2` simply because you added a new optional field `profilePicture` to the User schema payload.

**Why it's wrong:** Adding optional fields or new endpoints does not break existing clients; older clients will ignore the new field. Creating a new API version requires maintaining duplicate code paths and database queries, which increases maintenance overhead. Only increment version numbers for **breaking changes** (e.g. changing field names, deleting fields, or changing response status codes).

---



### Mistake 2: Breaking Existing API Consumers by Modifying API Response Payloads In-Place Without Versioning

**The mistake:** Removing a property `user.name` or changing data types in an existing `/api/users` endpoint.

**Why it's wrong:** Existing mobile apps and frontend clients relying on old API payload contracts will break or crash. Introduce new API versions (`/api/v2/users`) for breaking API changes.

*Incorrect:*
```javascript
// Removing user.name property in place on /api/users endpoint
```

*Fix:*
```javascript
Keep /api/v1/users payload intact; create /api/v2/users with new payload schema
```

### Mistake 3: Mixing Multiple Versioning Strategies (URL Path, Query Params, Headers) Inconsistently

**The mistake:** Using `/api/v1/users` for some endpoints while using `Accept: application/vnd.api.v2+json` headers for others.

**Why it's wrong:** Mixing versioning strategies confuses API consumers and complicates proxy cache configurations. Standardize on a single versioning strategy across the organization.

*Incorrect:*
```javascript
// Using URL path for users API, but header versioning for products API
```

*Fix:*
```javascript
Standardize on URL Path versioning (/api/v1/...) across all service endpoints
```

## 5. Practice Exercises

### Exercise 1: URL Path API Version Router

**Scenario:** An API gateway inspects URL prefixes (`/v1/users`, `/v2/users`) to dispatch incoming requests to the appropriate versioned controller.

**Requirements:**
1. Write routeByUrlVersion(req, res, v1Controller, v2Controller).
2. Extract version prefix `/v1` or `/v2`.
3. Dispatch to target version handler or return 404.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function routeByUrlVersion(req, res, v1Controller, v2Controller) {
>   const url = req.url || "/";
>
>   if (url.startsWith("/v1/")) {
>     const subUrl = url.replace("/v1", "");
>     return v1Controller.handle({ ...req, url: subUrl }, res);
>   }
>
>   if (url.startsWith("/v2/")) {
>     const subUrl = url.replace("/v2", "");
>     return v2Controller.handle({ ...req, url: subUrl }, res);
>   }
>
>   res.statusCode = 404;
>   res.end(JSON.stringify({ error: "UNSUPPORTED_API_VERSION" }));
> }
>
> // Verification tests
> let v1Called = false;
> let v2Called = false;
>
> const v1 = { handle: (req, res) => { v1Called = req.url === "/users"; } };
> const v2 = { handle: (req, res) => { v2Called = req.url === "/users"; } };
>
> routeByUrlVersion({ url: "/v1/users" }, {}, v1, v2);
> console.assert(v1Called === true, "Test 1 Failed: Routed to v1");
>
> routeByUrlVersion({ url: "/v2/users" }, {}, v1, v2);
> console.assert(v2Called === true, "Test 2 Failed: Routed to v2");
> ```
>
> #### Technical Explanation
>
> 1. **URL Path Versioning Strategy**: Most common versioning strategy (`/api/v1/resource`), highly visible and easily cached by CDNs.
> 2. **Prefix Stripping**: Gateway strips version prefixes (`/v1`) before forwarding requests to internal microservice routers.
> 3. **Version Support Matrix**: Allows running legacy v1 routes alongside modern v2 routes during migration periods.
> 
---

### Exercise 2: Accept Header API Version Negotiator

**Scenario:** An enterprise API negotiates API versions via custom vendor `Accept` headers (`Accept: application/vnd.company.v2+json`).

**Requirements:**
1. Write negotiateHeaderVersion(reqHeaders, versionMap).
2. Parse `Accept` header version token.
3. Execute matching version handler.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function negotiateHeaderVersion(reqHeaders = {}, versionMap = {}) {
>   const acceptHeader = reqHeaders["accept"] || reqHeaders["Accept"] || "";
>   const match = acceptHeader.match(/application\/vnd\.company\.v(\d+)\+json/i);
>
>   const version = match ? `v${match[1]}` : "v1";
>   const handler = versionMap[version];
>
>   if (!handler) {
>     return { status: 406, error: `API version '${version}' not acceptable` };
>   }
>
>   return { status: 200, version, data: handler() };
> }
>
> // Verification tests
> const handlers = {
>   v1: () => ({ name: "Alice" }),
>   v2: () => ({ id: 42, fullName: "Alice Smith" })
> };
>
> const res1 = negotiateHeaderVersion({ Accept: "application/vnd.company.v2+json" }, handlers);
> console.assert(res1.version === "v2" && res1.data.fullName === "Alice Smith", "Test 1 Failed: v2 header parsed");
>
> const res2 = negotiateHeaderVersion({}, handlers);
> console.assert(res2.version === "v1", "Test 2 Failed: Defaulted to v1");
> ```
>
> #### Technical Explanation
>
> 1. **Header Content Negotiation**: Keeps URLs clean (`/users`) while negotiating versions using standard HTTP `Accept` headers.
> 2. **HTTP 406 Not Acceptable**: Returns 406 status if requested API version format is unsupported.
> 3. **REST Pureness**: Adheres to REST principles by treating versioning as resource representation negotiation.
> 
---

### Exercise 3: API Version Sunset & Deprecation Header Injector

**Scenario:** A middleware injects standard HTTP `Deprecation` and `Sunset` response headers to alert API consumers of upcoming v1 version retirement.

**Requirements:**
1. Write versionSunsetMiddleware(sunsetDateISO, successorUrl).
2. Attach `Deprecation: true` header.
3. Attach `Sunset: <date>` header.
4. Attach `Link: <url>; rel="successor-version"`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createSunsetMiddleware(sunsetDateISO, successorUrl) {
>   return function versionSunsetMiddleware(req, res, next) {
>     res.setHeader("Deprecation", "true");
>     res.setHeader("Sunset", new Date(sunsetDateISO).toUTCString());
>     if (successorUrl) {
>       res.setHeader("Link", `<${successorUrl}>; rel="successor-version"`);
>     }
>     next();
>   };
> }
>
> // Verification tests
> const headers = {};
> const mockRes = { setHeader: (k, v) => { headers[k] = v; } };
>
> const middleware = createSunsetMiddleware("2026-12-31T23:59:59Z", "https://api.company.com/v2/users");
> middleware({}, mockRes, () => {});
>
> console.assert(headers["Deprecation"] === "true", "Test 1 Failed");
> console.assert(headers["Sunset"].includes("2026"), "Test 2 Failed");
> console.assert(headers["Link"].includes("rel="successor-version""), "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **IETF Deprecation & Sunset Headers**: Standardized HTTP headers informing clients of API deprecation timelines.
> 2. **Successor Link Header**: Directs developers to successor API endpoints (`rel="successor-version"`).
> 3. **Proactive Developer Communication**: Prevents breaking client applications by providing programmatic deprecation notices in API responses.
## 6. Related Terms
- [REST API Design](rest_api.md) — The structuring rules governing endpoints.

---

## 7. Key Takeaways
- API versioning allows you to evolve endpoints without breaking active clients.
- URI path versioning (`/api/v1/`) is the most common and readable method.
- Other versioning methods include custom HTTP headers and query parameters.
- Only increment API versions for breaking changes (deletions, renaming, type changes).
- Maintain versioned code paths cleanly using separate Express Router files.
- Versioning is temporary; plan for old versions to eventually sunset.
