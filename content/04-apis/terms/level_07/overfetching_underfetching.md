# Over-fetching vs Under-fetching

> **Level 7 — Data Formats & Serialization**
> The REST pain points GraphQL was built to solve.

---

## 1. Prerequisites
- [REST (Representational State Transfer)](../level_03/rest.md) — The resource-based endpoint architectural design.
- [GraphQL (The REST Alternative)](graphql.md) — The query language designed to address REST constraints.

---

## 2. Term Category

**Architecture / Design (Universal: Affects client-side request orchestrations and backend database query layout designs.)**: Over-fetching vs Under-fetching is a fundamental concept in this technology stack. **Level 7 — Data Formats & Serialization**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In RESTful architectures, endpoints are strictly organized around server-side database resources (for example: `GET /api/users/:id`, `GET /api/posts`, `GET /api/comments`).

While this structure is clean, it introduces two major data-transfer inefficiencies in client-side applications:

#### 1. Over-fetching
*   **The Issue:** The client requests a resource but receives significantly more data fields than it needs.
*   **Example:** A user profile badge widget only needs to display a user's `username` and `avatarUrl`. To get this, it calls `GET /api/users/42`. However, the server returns the *entire* user object (containing `address`, `phoneNumber`, `bio`, `creationDate`, `loginHistory`, etc.).
*   **Impact:** Wastes network bandwidth, slows down JSON parsing, and increases mobile data usage.

#### 2. Under-fetching (The N+1 Network Problem)
*   **The Issue:** The client requests a resource, but the endpoint does not return enough information. The client is forced to make multiple sequential network requests to gather the required data.
*   **Example:** To display a simple user dashboard showing their profile and their latest 3 posts, the client must run:
    1.  `GET /api/users/42` (Retrieve profile details).
    2.  `GET /api/users/42/posts` (Retrieve post list; returns post IDs: `[101, 102, 103]`).
    3.  `GET /api/posts/101` (Retrieve content for post 1).
    4.  `GET /api/posts/102` (Retrieve content for post 2).
    5.  `GET /api/posts/103` (Retrieve content for post 3).
*   **Impact:** Causes lag because the client must wait for 5 sequential network round-trips (latency spikes).

---

### (2) The GraphQL Solution
GraphQL solves both issues by allowing the client to send a single query describing the exact data requirements:

```text
  [ REST Client ] ──( 5 requests / 5 RTTs )──> [ REST API ]
  
  [ GraphQL Client ] ──( 1 query request / 1 RTT )──> [ GraphQL API ]
```

---

### (3) Reality Metaphor
Imagine buying ingredients to bake a cake.
- **REST (Pre-packaged Boxes)** is like shopping at a store that only sells rigid, pre-packaged boxes:
  - **Over-fetching:** You need a single apple, but you must buy the `"Fruit Box"` which contains an apple, a pineapple, and a watermelon. You pay for and transport weight you do not want.
  - **Under-fetching:** You also need flour and sugar. The fruit box does not contain them. You must make another trip to the bakery aisle for flour, and a third trip to the bulk aisle for sugar (**multiple round-trips**).
- **GraphQL (Custom shopping list)** is like handing a custom list to a clerk: *"Give me exactly 1 apple, 1 cup of flour, and 1 cup of sugar."* The clerk gathers only those items and hands them to you in a **single bag** in **one trip**.

---

### (4) Implementation Comparison: REST vs. GraphQL

#### Scenario: Fetch user profile name and title of their latest posts

#### 1. The REST Approach (Under-fetching / Sequential)
```javascript
// Request 1: Get user
const user = await fetch('/api/users/42').then(r => r.json());
// Request 2: Get posts
const posts = await fetch(`/api/users/${user.id}/posts`).then(r => r.json());

renderProfile(user.name, posts.map(p => p.title));
```

#### 2. The GraphQL Approach (Declarative / Single Trip)
The client queries exactly what fields they want:
```graphql
query GetUserData {
  user(id: 42) {
    name
    posts(limit: 2) {
      title
    }
  }
}
```

The server returns exactly that structure in a single response:
```json
{
  "data": {
    "user": {
      "name": "Bob",
      "posts": [
        { "title": "Understanding APIs" },
        { "title": "CORS Explained" }
      ]
    }
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Creating custom endpoints to bypass REST under-fetching

**The mistake:** Creating custom summary endpoints like `GET /api/dashboard-summary` or `GET /api/user-mobile-view` to pack different resources into one response.

**Why it's wrong:** While this fixes under-fetching for that specific screen, it leads to **endpoint explosion**. Every time the design team modifies a UI view, the backend developers must write, test, and maintain a new custom API endpoint.

*Fix:* Utilize query parameter filters (like `/api/users/42?embed=posts`) in REST, or migrate to a GraphQL gateway to let client views declare their data dynamically.

---

### Mistake 2: Overfetching Massive JSON Models for Mobile Client Screens

**The mistake:** Returning 50-field user objects (`SELECT *`) to a mobile app displaying only usernames.

**Why it's wrong:** Overfetching wastes mobile bandwidth, increases payload parsing CPU time, and degrades battery life. Use Sparse Fieldsets (`?fields=id,name`) or GraphQL.

*Incorrect:*
```http
GET /api/users/5 -> Returns 50KB payload containing addresses, history, and settings
```

*Fix:*
```http
GET /api/users/5?fields=id,name -> Returns 1KB payload containing requested fields only
```

---

### Mistake 3: Underfetching Data Forcing Waterfall N+1 Client Requests

**The mistake:** Designing endpoints so lean that rendering a user profile requires 5 sequential API calls.

**Why it's wrong:** Underfetching forces clients to execute multiple round-trip requests (`GET /user` -> `GET /posts` -> `GET /comments`), accumulating network latency delays. Use embedded sub-resources (`?embed=posts`).

*Incorrect:*
```http
/* Client issues 5 sequential GET requests to fetch profile components */
```

*Fix:*
```http
GET /api/users/5?embed=posts,comments ; Single request fetching nested sub-resources
```


---

## 5. Practice Exercises

### Exercise 1: REST Sparse Fieldsets Payload Trimmer

**Scenario:** An API gateway implements Sparse Fieldsets (`?fields=id,name,email`), filtering out unwanted payload attributes to eliminate overfetching.

**Requirements:**
1. Write trimSparseFieldsets(resourceObj, requestedFieldsArray).
2. Return object containing ONLY requested fields.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function trimSparseFieldsets(resourceObj, requestedFieldsArray = []) {
>   if (!resourceObj || requestedFieldsArray.length === 0) return resourceObj;
>
>   const allowedSet = new Set(requestedFieldsArray.map(f => f.trim()));
>   const trimmed = {};
>
>   for (const [key, value] of Object.entries(resourceObj)) {
>     if (allowedSet.has(key)) {
>       trimmed[key] = value;
>     }
>   }
>
>   return trimmed;
> }
>
> // Verification tests
> const fullUser = { id: 1, name: "Alice", email: "a@a.com", address: "123 St", ssn: "999" };
> const trimmed = trimSparseFieldsets(fullUser, ["id", "name"]);
>
> console.assert(trimmed.id === 1 && trimmed.name === "Alice", "Test 1 Failed");
> console.assert(trimmed.email === undefined && trimmed.ssn === undefined, "Test 2 Failed: Overfetched fields must be trimmed");
> ```
>
> #### Technical Explanation
>
> 1. **Overfetching Definition**: When an API endpoint returns far more data fields than the client needs for its current UI view.
> 2. **Sparse Fieldsets**: JSON:API standard query parameter (?fields=name,email) allowing clients to select desired fields.
> 3. **Bandwidth Reduction**: Reduces JSON payload size and mobile data consumption.
> 
---

### Exercise 2: Underfetching Batch Aggregator

**Scenario:** An API client solves Underfetching by aggregating multiple N+1 resource requests into a single batch query.

**Requirements:**
1. Write fetchAggregatedUserData(userId, fetchUserFn, fetchOrdersFn).
2. Combine user profile and user orders into single response.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function fetchAggregatedUserData(userId, fetchUserFn, fetchOrdersFn) {
>   const [user, orders] = await Promise.all([
>     fetchUserFn(userId),
>     fetchOrdersFn(userId)
>   ]);
>
>   return {
>     ...user,
>     orders
>   };
> }
>
> // Verification tests
> const fUser = async (id) => ({ id, name: "Alice" });
> const fOrders = async (id) => [{ orderId: 101 }];
>
> fetchAggregatedUserData("u1", fUser, fOrders).then(aggregated => {
>   console.assert(aggregated.name === "Alice" && aggregated.orders.length === 1, "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Underfetching Definition**: When a single REST endpoint does not return enough data, forcing the client to make multiple roundtrip requests (N+1 problem).
> 2. **N+1 Query Problem**: Fetching a list of N items then making N separate HTTP calls to fetch details for each item.
> 3. **Compound Endpoints**: Aggregating related sub-resources in single response to prevent underfetching.
> 
---

### Exercise 3: Overfetching vs Underfetching Diagnostic Audit

**Scenario:** An API auditor analyzes endpoint consumption metrics and flags overfetching (>50% unused fields) or underfetching (>3 sequential calls).

**Requirements:**
1. Write auditApiEfficiency(usedFieldsCount, totalFieldsCount, sequentialHttpCalls).
2. Return diagnostic metrics.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function auditApiEfficiency(usedFieldsCount, totalFieldsCount, sequentialHttpCalls) {
>   const fieldUsagePct = Math.round((usedFieldsCount / totalFieldsCount) * 100);
>
>   const isOverfetching = fieldUsagePct < 50;
>   const isUnderfetching = sequentialHttpCalls > 2;
>
>   return {
>     fieldUsagePct,
>     isOverfetching,
>     isUnderfetching,
>     recommendation: isOverfetching 
>       ? "Use Sparse Fieldsets or GraphQL to avoid overfetching"
>       : isUnderfetching 
>         ? "Use batch endpoints or GraphQL to avoid underfetching"
>         : "Optimal API efficiency"
>   };
> }
>
> // Verification tests
> const audit1 = auditApiEfficiency(2, 10, 1);
> console.assert(audit1.isOverfetching === true, "Test 1 Failed: 20% field usage is overfetching");
>
> const audit2 = auditApiEfficiency(8, 10, 5);
> console.assert(audit2.isUnderfetching === true, "Test 2 Failed: 5 calls is underfetching");
> ```
>
> #### Technical Explanation
>
> 1. **Payload Efficiency**: Optimizing field count and HTTP call frequency maximizes mobile app performance.
> 2. **GraphQL Solution**: GraphQL addresses both overfetching (clients request exact fields) and underfetching (nested queries in 1 call).
> 3. **Network Latency Impact**: Multiple sequential calls (underfetching) compound RTT latency severely over cellular networks.
---

## 6. Related Terms
- [Resource Naming & URI Design](../level_03/resource_naming.md) — The design pattern governing REST routes.
- [Pagination (Offset vs. Cursor)](../level_06/pagination.md) — The methods of splitting large resource collections to prevent over-fetching.
- [GraphQL (The REST Alternative)](graphql.md) — Related concept: GraphQL (The REST Alternative).

---

## 7. Key Takeaways
- Over-fetching is receiving more data fields than required, wasting bandwidth.
- Under-fetching is receiving insufficient data, forcing sequential requests (N+1 query problem).
- REST architectures are prone to over-fetching and under-fetching due to resource-focused endpoints.
- GraphQL solves both issues by enabling clients to declare exact data needs in a single request.
- Creating custom REST endpoints for specific views solves under-fetching but leads to endpoint maintenance overhead.
