# API Versioning

> **Level 9 — REST APIs & Best Practices**
> `/api/v1/...` — evolving an API without breaking existing clients.

---

## 1. Prerequisites
- [REST API Design](./rest_api.md) — The fundamental principles of API endpoint structures.

---

## 2. Term Category
- **Architecture / Design Pattern**

---

## 3. Environment Context
- **Web App Server Layer** (Governs route path compilation and HTTP header request negotiations).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Breaking Existing API Consumers by Modifying API Response Payloads In-Place Without Versioning

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

### Mistake 5: Mixing Multiple Versioning Strategies (URL Path, Query Params, Headers) Inconsistently

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



### Mistake 6: Breaking Existing API Consumers by Modifying API Response Payloads In-Place Without Versioning

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

### Mistake 7: Mixing Multiple Versioning Strategies (URL Path, Query Params, Headers) Inconsistently

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

## 6. Practice Exercises

### Exercise 1: Version Fallback Router

**Problem:** You are deprecating v1. Configure Express to forward requests to the v2 router, but keep a legacy `/api/v1/user` endpoint returning the old field format for backward compatibility:

```javascript
const express = require('express');
const app = express();

const v2Router = express.Router();
v2Router.get('/user', (req, res) => res.json({ id: 42, username: "dev" }));

// Mount V2
app.use('/api/v2', v2Router);

// Legacy V1 compatibility route:
app.get('/api/v1/user', (req, res) => {
  // Translate V2 properties back to the V1 format manually:
  res.json({ userId: "42", name: "dev" });
});
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

### Exercise 2: Express URL Path Versioning Router

**Problem:** Mount `v1Router` and `v2Router` on `/api/v1` and `/api/v2` in Express.

**Expected output:**
```text
app.use('/api/v1', v1Router); app.use('/api/v2', v2Router);
```

> [!check]- Answer
> ```javascript
> app.use('/api/v1', v1Router);
> app.use('/api/v2', v2Router);
> ```
>
> **Explanation:** URL path versioning mounts versioned Express routers on distinct sub-path prefixes.

### Exercise 3: 3 Common API Versioning Strategies

**Problem:** List 3 common API versioning strategies.

**Expected output:**
```text
1. URI Path (/api/v1/users)
2. Query Parameter (/api/users?version=1)
3. Custom Header (Accept: application/json; version=1)
```

> [!check]- Answer
> ```text
> 1. URI Path (/api/v1/users)
> 2. Query Parameter (/api/users?version=1)
> 3. Custom Header / Accept Header
> ```
>
> **Explanation:** URI path is most explicit; headers keep URLs clean; query params are easy to test.



### Exercise 4: Express URL Path Versioning Router

**Problem:** Mount `v1Router` and `v2Router` on `/api/v1` and `/api/v2` in Express.

**Expected output:**
```text
app.use('/api/v1', v1Router); app.use('/api/v2', v2Router);
```

> [!check]- Answer
> ```javascript
> app.use('/api/v1', v1Router);
> app.use('/api/v2', v2Router);
> ```
>
> **Explanation:** URL path versioning mounts versioned Express routers on distinct sub-path prefixes.

### Exercise 5: 3 Common API Versioning Strategies

**Problem:** List 3 common API versioning strategies.

**Expected output:**
```text
1. URI Path (/api/v1/users)
2. Query Parameter (/api/users?version=1)
3. Custom Header (Accept: application/json; version=1)
```

> [!check]- Answer
> ```text
> 1. URI Path (/api/v1/users)
> 2. Query Parameter (/api/users?version=1)
> 3. Custom Header / Accept Header
> ```
>
> **Explanation:** URI path is most explicit; headers keep URLs clean; query params are easy to test.



### Exercise 6: Express URL Path Versioning Router

**Problem:** Mount `v1Router` and `v2Router` on `/api/v1` and `/api/v2` in Express.

**Expected output:**
```text
app.use('/api/v1', v1Router); app.use('/api/v2', v2Router);
```

> [!check]- Answer
> ```javascript
> app.use('/api/v1', v1Router);
> app.use('/api/v2', v2Router);
> ```
>
> **Explanation:** URL path versioning mounts versioned Express routers on distinct sub-path prefixes.

### Exercise 7: 3 Common API Versioning Strategies

**Problem:** List 3 common API versioning strategies.

**Expected output:**
```text
1. URI Path (/api/v1/users)
2. Query Parameter (/api/users?version=1)
3. Custom Header (Accept: application/json; version=1)
```

> [!check]- Answer
> ```text
> 1. URI Path (/api/v1/users)
> 2. Query Parameter (/api/users?version=1)
> 3. Custom Header / Accept Header
> ```
>
> **Explanation:** URI path is most explicit; headers keep URLs clean; query params are easy to test.

## 7. Related Terms
- [REST API Design](./rest_api.md) — The structuring rules governing endpoints.

---

## 8. Key Takeaways
- API versioning allows you to evolve endpoints without breaking active clients.
- URI path versioning (`/api/v1/`) is the most common and readable method.
- Other versioning methods include custom HTTP headers and query parameters.
- Only increment API versions for breaking changes (deletions, renaming, type changes).
- Maintain versioned code paths cleanly using separate Express Router files.
- Versioning is temporary; plan for old versions to eventually sunset.
