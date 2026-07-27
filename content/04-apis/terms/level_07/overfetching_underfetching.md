# Over-fetching vs Under-fetching

> **Level 7 — Data Formats & Serialization**
> The REST pain points GraphQL was built to solve.

---

## 1. Prerequisites
- [REST (Representational State Transfer)](../level_03/rest.md) — The resource-based endpoint architectural design.
- [GraphQL (The REST Alternative)](./graphql.md) — The query language designed to address REST constraints.

---

## 2. Term Category
- **Architecture / Design**

---

## 3. Environment Context
- **Universal**: Affects client-side request orchestrations and backend database query layout designs.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Diagnostic Audit

**Problem:** Read this scenario and determine which data transfer issue is occurring:

*A mobile app fetches `/api/products`. The response contains a list of 100 products. Each product object includes a 5,000-character description field and a history log array of edits. The mobile app only displays the product names and prices.*

- **A.** Under-fetching
- **B.** Over-fetching
- **C.** Idempotency collision

> [!check]- Answer
> - **B (Over-fetching).** The mobile app only displays names and prices, but downloads descriptions and edit logs, wasting device bandwidth and memory.


---

### Exercise 2: Overfetching vs Underfetching Definitions

**Problem:** Define Overfetching and Underfetching in API design.

**Expected output:**
```text
Overfetching: API response returns more data fields than the client needs.
Underfetching: API response returns insufficient data, forcing client to make additional requests.
```

> [!check]- Answer
> ```text
> Overfetching -> Fetching extra unneeded data fields (wasteful payload size).
> Underfetching -> Fetching partial data (forces additional round-trip requests).
> ```
> - **Explanation:** Both problems represent inefficient payload granularity.
---

### Exercise 3: GraphQL Payload Solution

**Problem:** How does GraphQL solve both Overfetching and Underfetching in a single request?

**Expected output:**
```text
Clients specify exact required fields in query requests, fetching precisely what is needed in a single round trip.
```

> [!check]- Answer
> ```graphql
> query {
> user(id: 5) {
> name
> posts { title }
> }
> }
> ```
> - **Explanation:** Declarative field queries eliminate overfetching and underfetching.
---

## 7. Related Terms
- [Resource Naming & URI Design](../level_03/resource_naming.md) — The design pattern governing REST routes.
- [Pagination (Offset vs. Cursor)](../level_06/pagination.md) — The methods of splitting large resource collections to prevent over-fetching.

---

## 8. Key Takeaways
- Over-fetching is receiving more data fields than required, wasting bandwidth.
- Under-fetching is receiving insufficient data, forcing sequential requests (N+1 query problem).
- REST architectures are prone to over-fetching and under-fetching due to resource-focused endpoints.
- GraphQL solves both issues by enabling clients to declare exact data needs in a single request.
- Creating custom REST endpoints for specific views solves under-fetching but leads to endpoint maintenance overhead.
