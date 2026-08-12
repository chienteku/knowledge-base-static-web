# GraphQL (The REST Alternative)

> **Level 7 — Data Formats & Serialization**
> A modern query language for APIs, developed by Facebook, that allows the Client to ask for exactly the specific data it needs, and nothing more.

---

## 1. Prerequisites
- [REST (Representational State Transfer)](../level_03/rest.md) — GraphQL was invented specifically to solve the inefficiencies of REST.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — The format GraphQL uses to return data.

---

## 2. Term Category

**API Architecture / Query Language (Modern Backend/Frontend Architecture)**: GraphQL (The REST Alternative) is a fundamental concept in this technology stack. **Level 7 — Data Formats & Serialization**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In a traditional REST API, the Server decides what data to send. 
If a mobile app needs a user's name to display in a tiny header, it makes a request to `GET /api/users/5`. The REST server responds with the name, but *also* responds with the user's email, age, address, phone number, and 50 other fields! This is called **Over-fetching**. It wastes massive amounts of mobile data.
Conversely, if the app needs the user's name *and* a list of their friends, it might have to make one request to `/users/5`, wait for the response, and then make a second request to `/users/5/friends`. This is called **Under-fetching**.
In 2012, Facebook invented **GraphQL** to solve this. Instead of multiple endpoints, a GraphQL API only has *one* endpoint (usually `POST /graphql`). The Client sends a "Query" outlining the exact shape of the data it wants, and the Server replies with exactly that shape.

### (2) What does a Query look like?
The frontend developer writes a query that looks like JSON without the values:

**The Request (Client asks for specific fields):**
```graphql
query {
  user(id: 5) {
    name
    friends {
      name
    }
  }
}
```

**The Response (Server returns exactly what was asked):**
```json
{
  "data": {
    "user": {
      "name": "Bob",
      "friends": [
        { "name": "Alice" },
        { "name": "Charlie" }
      ]
    }
  }
}
```
Notice how there are no emails or addresses? Over-fetching is solved! Notice how we got the user and the friends in a single request? Under-fetching is solved!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming GraphQL is a database

**The mistake:** A developer says, "I am going to migrate my Postgres database to a GraphQL database."

**Why it's wrong:** GraphQL is NOT a database! It is a *Query Language for APIs*. It sits directly in front of your existing database (Postgres, MongoDB, etc.) and acts as a translator. The Client speaks GraphQL to the Server, and the Server translates that into SQL to talk to Postgres.
**Golden Rule:** GraphQL replaces REST, it does not replace SQL.

---

### Mistake 2: Experiencing the N+1 Database Query Problem in GraphQL Resolvers

**The mistake:** Querying database inside a child GraphQL field resolver without batching.

**Why it's wrong:** If a query requests 100 posts and their author details, un-batched field resolvers execute 1 query for posts + 100 individual queries for authors (N+1 queries). Use `DataLoader`.

*Incorrect:*
```javascript
// Un-batched field resolver
Author: { author(post) { return db.getAuthor(post.authorId); } } // ❌ N+1 queries!
```

*Fix:*
```javascript
// Use DataLoader to batch and cache sub-queries:
Author: { author(post) { return authorLoader.load(post.authorId); } }
```

---

### Mistake 3: Exposing Un-Bounded Deeply Nested GraphQL Queries (Denial of Service)

**The mistake:** Allowing clients to execute infinitely recursive GraphQL queries (`author { posts { author { posts ... } } }`).

**Why it's wrong:** Un-bounded recursive queries crash backend database servers. Implement query depth limiting and query complexity analysis (`graphql-depth-limit`).

*Incorrect:*
```graphql
# Recursive un-bounded query crashing backend server
query { author { posts { author { posts { author { id } } } } } }
```

*Fix:*
```javascript
// Enforce maximum query depth limits in GraphQL server setup:
validationRules: [ depthLimit(5) ]
```


---

## 5. Practice Exercises

### Exercise 1: Client-Side GraphQL Request Serializer

**Scenario:** A lightweight GraphQL client constructs standard POST request payloads containing `query` strings and `variables` objects.

**Requirements:**
1. Write buildGraphQLPayload(queryStr, variablesObj).
2. Return formatted JSON payload object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildGraphQLPayload(queryStr, variablesObj = {}) {
>   if (!queryStr || typeof queryStr !== "string") {
>     throw new Error("GraphQL query string is required");
>   }
>
>   // Minify whitespace in query
>   const minifiedQuery = queryStr.replace(/\s+/g, " ").trim();
>
>   return {
>     query: minifiedQuery,
>     variables: variablesObj
>   };
> }
>
> // Verification tests
> const query = `
>   query GetUser($id: ID!) {
>     user(id: $id) {
>       id
>       name
>     }
>   }
> `;
>
> const payload = buildGraphQLPayload(query, { id: "u42" });
> console.assert(payload.variables.id === "u42", "Test 1 Failed");
> console.assert(payload.query.startsWith("query GetUser"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **GraphQL Request Structure**: GraphQL HTTP POST requests transmit JSON body: { query, variables, operationName }.
> 2. **Single Endpoint Architecture**: All GraphQL operations target a single endpoint (e.g. POST /graphql).
> 3. **Minification & Query Optimization**: Trimming extra whitespace reduces request payload size over the wire.
> 
---

### Exercise 2: GraphQL Field Execution & Partial Error Evaluator

**Scenario:** A GraphQL client parser handles GraphQL response structures, processing `data` payloads alongside `errors` arrays.

**Requirements:**
1. Write parseGraphQLResponse(responseJson).
2. Return object { data, errors, hasErrors }.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseGraphQLResponse(responseJson) {
>   if (!responseJson || typeof responseJson !== "object") {
>     return { data: null, errors: [{ message: "Invalid GraphQL response" }], hasErrors: true };
>   }
>
>   const hasErrors = Array.isArray(responseJson.errors) && responseJson.errors.length > 0;
>
>   return {
>     data: responseJson.data || null,
>     errors: responseJson.errors || [],
>     hasErrors
>   };
> }
>
> // Verification tests
> const resWithPartialError = {
>   data: { user: { id: "u1", name: "Alice" } },
>   errors: [{ message: "Failed to fetch user permissions", path: ["user", "permissions"] }]
> };
>
> const parsed = parseGraphQLResponse(resWithPartialError);
> console.assert(parsed.data.user.name === "Alice", "Test 1 Failed: Partial data preserved");
> console.assert(parsed.hasErrors === true && parsed.errors.length === 1, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Partial Data Execution**: GraphQL can return partial data in res.data even if some field resolvers fail and populate res.errors.
> 2. **200 OK Status Code for Errors**: GraphQL HTTP servers return 200 OK even when execution errors occur inside fields.
> 3. **Field-Level Error Granularity**: Errors array lists exact field paths (e.g. ['user', 'permissions']) where execution failed.
> 
---

### Exercise 3: GraphQL vs REST Selection Resolver

**Scenario:** An API architect helper chooses between GraphQL (for dynamic mobile UIs avoiding overfetching) and REST (for simple CRUD/caching).

**Requirements:**
1. Write recommendApiProtocol(options).
2. Recommend 'GRAPHQL' or 'REST'.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function recommendApiProtocol(options = {}) {
>   const { requiresDynamicFieldSelection, hasHeavyCdnCachingNeeds, multipleAggregatedViews } = options;
>
>   if (hasHeavyCdnCachingNeeds) {
>     return "REST"; // REST HTTP URLs cache naturally on CDNs
>   }
>   if (requiresDynamicFieldSelection || multipleAggregatedViews) {
>     return "GRAPHQL";
>   }
>   return "REST";
> }
>
> // Verification tests
> console.assert(recommendApiProtocol({ requiresDynamicFieldSelection: true }) === "GRAPHQL", "Test 1 Failed");
> console.assert(recommendApiProtocol({ hasHeavyCdnCachingNeeds: true }) === "REST", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **GraphQL Strengths**: Single query fetches exact nested fields needed, solving overfetching/underfetching.
> 2. **REST Caching Advantage**: Distinct HTTP URLs (/users/1) leverage standard HTTP/CDN caching proxies naturally.
> 3. **Architectural Trade-offs**: GraphQL shifts query complexity to server resolvers; REST uses static endpoint contracts.
---

## 6. Related Terms
- [REST (Representational State Transfer)](../level_03/rest.md) — The architecture GraphQL is slowly replacing in highly complex applications.
- [Swagger / OpenAPI Specification](../level_10/openapi.md) — Related concept: Swagger / OpenAPI Specification.
- [API Versioning (v1, v2)](../level_10/versioning.md) — Related concept: API Versioning (v1, v2).
- [Over-fetching vs Under-fetching](overfetching_underfetching.md) — Solving over/under fetching.
- [JSON (JavaScript Object Notation)](../level_01/json.md) — JSON query payloads.
- [API (Application Programming Interface)](../level_03/api.md) — Related concept: API (Application Programming Interface).

---

## 7. Key Takeaways
- **GraphQL** is an alternative to REST APIs.
- It solves **Over-fetching** (getting too much data) and **Under-fetching** (not getting enough data).
- The Client is in control: it explicitly asks for the exact fields it needs.
- It uses a single endpoint (`POST /graphql`) instead of dozens of resource-based URLs.
