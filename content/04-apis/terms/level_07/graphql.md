# GraphQL (The REST Alternative)

> **Level 7 — Data Formats & Serialization**
> A modern query language for APIs, developed by Facebook, that allows the Client to ask for exactly the specific data it needs, and nothing more.

---

## 1. Prerequisites
- [REST](../level_03/rest.md) — GraphQL was invented specifically to solve the inefficiencies of REST.
- [JSON](../level_01/json.md) — The format GraphQL uses to return data.

---

## 2. Term Category
- **API Architecture / Query Language**

---

## 3. Environment Context
- **Modern Backend/Frontend Architecture**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: REST vs GraphQL

**Problem:** You are building an app that shows a list of 100 blog posts. You only need the `title` of each post. 
In a REST API, `GET /posts` returns the title, the author ID, the date, and the full 5,000-word body of every post. 
Why is GraphQL a better choice here?

**Expected output:**
> [!check]- Answer
> ```text
> Because of Over-fetching! 
> In REST, you are forced to download the 5,000-word body for 100 posts, which might be 5 Megabytes of useless data. 
> In GraphQL, you simply query `query { posts { title } }`. The server only sends the titles, turning a 5MB payload into a 5KB payload, making the app 1000x faster!
> ```
> - Who decides what data is sent in REST? Who decides in GraphQL?

---

### Exercise 2: GraphQL 3 Operation Types

**Problem:** Identify the 3 root operation types supported by GraphQL schemas.

**Expected output:**
> [!check]- Answer
> ```text
> 1. query (Read operations)
> 2. mutation (Write/Update operations)
> 3. subscription (Real-time event streams)
> ```
> ```text
> 1. query -> Fetch read data
> 2. mutation -> Execute write/update actions
> 3. subscription -> Real-time WebSocket event streams
> ```
> - **Explanation:** GraphQL categorizes operations into queries, mutations, and subscriptions.
---

### Exercise 3: GraphQL Single Endpoint Architecture

**Problem:** Contrast REST multi-endpoint URIs (`/users`, `/posts`) with GraphQL endpoint architecture.

**Expected output:**
> [!check]- Answer
> ```text
> GraphQL exposes a single HTTP POST endpoint (e.g. `/graphql`) accepting query payloads in request bodies.
> ```
> ```http
> POST /graphql HTTP/1.1
> Content-Type: application/json
> {"query": "{ user(id: 5) { name email } }"}
> ```
> - **Explanation:** GraphQL routes all data operations through a unified endpoint.
---

## 7. Related Terms
- [REST](../level_03/rest.md) — The architecture GraphQL is slowly replacing in highly complex applications.

---

## 8. Key Takeaways
- **GraphQL** is an alternative to REST APIs.
- It solves **Over-fetching** (getting too much data) and **Under-fetching** (not getting enough data).
- The Client is in control: it explicitly asks for the exact fields it needs.
- It uses a single endpoint (`POST /graphql`) instead of dozens of resource-based URLs.
