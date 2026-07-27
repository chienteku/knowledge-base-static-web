# `RELATE` Statement

> **Level 5 — Relational Data & Graph Operations**
> The specialized SurrealQL statement used to create graph relationship records (edges) connecting two node records, using a visually descriptive arrow syntax.

---

## 1. Prerequisites
- [Graph Connections (Overview: Nodes vs Edges)](graph_overview.md) — The parent paradigm.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed by the graph transaction engine. Installs edge pointer records in storage, linking the index nodes of both target records).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In other databases, creating relationships is abstract and verbose:
-   **PostgreSQL:** You write a standard `INSERT INTO junction_table (a_id, b_id) VALUES (1, 2);`. The query text does not show the direction or nature of the link.
-   **Neo4j (Cypher):** Uses arrow patterns for query writes, but is complex to learn.

We designed the **`RELATE`** statement in SurrealQL to make relationship creation visual and clean:
-   The syntax uses arrows (`->`) to draw the connection in the query text: `node_a -> edge -> node_b`.
-   It automatically sets the `in` field (to node A) and the `out` field (to node B) behind the scenes.
-   It allows you to attach custom properties (like `created_at` or `weight`) to the relationship record using the standard `SET` keyword.

---

### (2) Arrow Notation Direction
The `RELATE` statement reads from left to right:
`RELATE user:john -> follows -> user:bob;`
-   This creates a directed relationship *from* John *to* Bob.
-   SurrealDB writes an edge record in the `follows` table:
    -   `in` = `user:john`
    -   `out` = `user:bob`

---

### (3) Reality Metaphor (Bridge Construction)
Imagine building a road network:
-   **SQL Junction Table:** Writing in a city logbook: *"Road #45 connects Zone A to Zone B."* It is a text record, but not a physical connection.
-   **`RELATE` Statement:** A construction crew **building a physical bridge (Edge)** between two islands (Nodes).
    -   The query text visually maps the bridge direction: `IslandA -> Bridge -> IslandB`.
    -   The crew anchors the pillars, writes the toll rate (properties) on the bridge entrance gate, and records the active connection.

---

### (4) Code Examples

#### Creating Graph Relationships in SurrealQL
Let's link users, posts, and products:

```sql
-- 1. Create a simple follows relationship (no properties)
RELATE user:john -> follows -> user:bob;

-- 2. Create a relationship with custom properties (rating and timestamp)
RELATE user:alice -> reviewed -> product:laptop
  SET rating = 5,
      comment = "Excellent machine!",
      created_at = time::now();

-- 3. Query the relation table directly to inspect edge records
SELECT * FROM reviewed;

-- Output returned (contains automatically populated 'in' and 'out' keys!):
// [
//   {
//     "id": reviewed:a9f8g7h...,
//     "in": user:alice,
//     "out": product:laptop,
//     "rating": 5,
//     "comment": "Excellent machine!",
//     "created_at": d"2026-07-21T15:00:00Z"
//   }
// ]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to create relationships by manually running 'CREATE <relation_table> SET in = ..., out = ...' instead of using the native 'RELATE' statement

**The mistake:** Writing the query `CREATE follows SET in = user:john, out = user:bob;` hoping to build a graph connection.

**Why it's wrong:** While this may work on some schema-less tables, it is a bad practice. 

Using `CREATE` bypasses the query compiler's graph validation checks. 

It makes the query hard to read compared to the visual arrow syntax and can fail under schema-full table rules.

**Fix: Always use the `RELATE` statement for creating graph edge connections:**

```sql
-- BAD
CREATE follows SET in = user:john, out = user:bob;

-- GOOD
RELATE user:john -> follows -> user:bob;
```

---



### Mistake 2: Using `CREATE` or `INSERT` to Create Graph Edges instead of `RELATE`

**The mistake:** Writing `CREATE wrote CONTENT { in: user:alice, out: post:1 };`.

**Why it's wrong:** While `CREATE` can insert records into edge tables, `RELATE` is the dedicated SurrealQL statement designed for graph edge creation, validating graph table types and arrow syntaxes.

*Incorrect:*
```surrealql
-- Non-idiomatic edge creation
CREATE wrote SET in = user:alice, out = post:1;
```

*Fix:*
```surrealql
RELATE user:alice->wrote->post:1; // Idiomatic SurrealQL graph edge creation
```

### Mistake 3: Forgetting `SET` or `CONTENT` Clauses when Attaching Properties to `RELATE` Statements

**The mistake:** Writing `RELATE user:alice->wrote->post:1 { rating: 5 };` without `SET` or `CONTENT`.

**Why it's wrong:** `RELATE` requires `SET key = val` or `CONTENT { ... }` or `MERGE { ... }` when attaching edge properties.

*Incorrect:*
```surrealql
RELATE user:alice->wrote->post:1 { rating: 5 }; // ❌ Parse error!
```

*Fix:*
```surrealql
RELATE user:alice->wrote->post:1 SET rating = 5;
-- Or:
RELATE user:alice->wrote->post:1 CONTENT { rating: 5 };
```



### Mistake 4: Using `CREATE` or `INSERT` to Create Graph Edges instead of `RELATE`

**The mistake:** Writing `CREATE wrote CONTENT { in: user:alice, out: post:1 };`.

**Why it's wrong:** While `CREATE` can insert records into edge tables, `RELATE` is the dedicated SurrealQL statement designed for graph edge creation, validating graph table types and arrow syntaxes.

*Incorrect:*
```surrealql
-- Non-idiomatic edge creation
CREATE wrote SET in = user:alice, out = post:1;
```

*Fix:*
```surrealql
RELATE user:alice->wrote->post:1; // Idiomatic SurrealQL graph edge creation
```

### Mistake 5: Forgetting `SET` or `CONTENT` Clauses when Attaching Properties to `RELATE` Statements

**The mistake:** Writing `RELATE user:alice->wrote->post:1 { rating: 5 };` without `SET` or `CONTENT`.

**Why it's wrong:** `RELATE` requires `SET key = val` or `CONTENT { ... }` or `MERGE { ... }` when attaching edge properties.

*Incorrect:*
```surrealql
RELATE user:alice->wrote->post:1 { rating: 5 }; // ❌ Parse error!
```

*Fix:*
```surrealql
RELATE user:alice->wrote->post:1 SET rating = 5;
-- Or:
RELATE user:alice->wrote->post:1 CONTENT { rating: 5 };
```

## 6. Practice Exercises

### Exercise 1: Relate Statement Construction

**Problem:** You are building an e-commerce platform. 
Write the SurrealQL statement to relate a customer record (`customer:alice`) to a store branch (`store:downtown`).
-   The relationship edge table name must be `visited`.
-   Set the relationship property `visit_date` to `time::now()`.

**Expected output:**
```sql
RELATE customer:alice -> visited -> store:downtown SET visit_date = time::now();
```

> [!check]- Answer
> - Construct the statement using the arrow format: `source -> edge -> target`.
> - Use the `SET` keyword to append custom property values to the relation.

---



### Exercise 2: Relating Node Records with Edge Properties

**Problem:** Relate `user:alice` to `group:devs` with edge `member_of` setting `role = "admin"` and `joined_at = time::now()`.

**Expected output:**
```text
RELATE user:alice->member_of->group:devs SET role = "admin", joined_at = time::now();
```

> [!check]- Answer
> ```surrealql
> RELATE user:alice->member_of->group:devs SET role = "admin", joined_at = time::now();
> ```
>
> **Explanation:** `RELATE node->edge->node SET ...` constructs graph edges with custom properties.

### Exercise 3: Relating Sets of Records

**Problem:** Relate all users in `user` table to `organization:main` using `RELATE (SELECT * FROM user)->member_of->organization:main`.

**Expected output:**
```text
RELATE (SELECT * FROM user)->member_of->organization:main;
```

> [!check]- Answer
> ```surrealql
> RELATE (SELECT * FROM user)->member_of->organization:main;
> ```
>
> **Explanation:** Subqueries inside `RELATE` create graph edges in bulk across record sets.



### Exercise 4: Relating Node Records with Edge Properties

**Problem:** Relate `user:alice` to `group:devs` with edge `member_of` setting `role = "admin"` and `joined_at = time::now()`.

**Expected output:**
```text
RELATE user:alice->member_of->group:devs SET role = "admin", joined_at = time::now();
```

> [!check]- Answer
> ```surrealql
> RELATE user:alice->member_of->group:devs SET role = "admin", joined_at = time::now();
> ```
>
> **Explanation:** `RELATE node->edge->node SET ...` constructs graph edges with custom properties.

### Exercise 5: Relating Sets of Records

**Problem:** Relate all users in `user` table to `organization:main` using `RELATE (SELECT * FROM user)->member_of->organization:main`.

**Expected output:**
```text
RELATE (SELECT * FROM user)->member_of->organization:main;
```

> [!check]- Answer
> ```surrealql
> RELATE (SELECT * FROM user)->member_of->organization:main;
> ```
>
> **Explanation:** Subqueries inside `RELATE` create graph edges in bulk across record sets.

## 7. Related Terms
- [Graph Connections (Overview: Nodes vs Edges)](graph_overview.md) — The parent paradigm.
- [Graph Arrow Operators (`->`, `<-`)](graph_arrows.md) — Querying relationships.

---

## 8. Key Takeaways
- The `RELATE` statement creates graph edge records in SurrealDB.
- Uses a visually descriptive arrow syntax: `node_a -> edge -> node_b`.
- Automatically populates the mandatory `in` and `out` pointer fields.
- Custom properties are attached to the edge record using the `SET` keyword.
- Returns the created relation document back to the client program.
- Avoid using standard `CREATE` commands to build graph connections.
- Requires relation tables to be defined first in schema-full mode.
