# `RELATE` Statement

> **Level 5 — Relational Data & Graph Operations**
> The specialized SurrealQL statement used to create graph relationship records (edges) connecting two node records, using a visually descriptive arrow syntax.

---

## 1. Prerequisites

- [Graph Connections (Overview: Nodes vs Edges)](graph_overview.md) — The parent paradigm.
- [Record Link (Concept)](record_link_concept.md) — Record link concept.

---

## 2. Term Category


**SurrealQL Command (graph edge creation statement)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: Directed Relation Edge Creation with `RELATE`

**Scenario:**
Create a directed relation edge `wrote` connecting author `user:alice` to blog post `post:p1` using the `RELATE` statement.

**Requirements:**
1. Create nodes `user:alice` and `post:p1`.
2. Execute `RELATE user:alice -> wrote -> post:p1`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET name = "Alice";
> CREATE post:p1 SET title = "SurrealQL RELATE Statement";
> 
> -- Create directed graph relation edge
> RELATE user:alice->wrote->post:p1;
> ```
>
> #### Technical Explanation
>
> 1. `RELATE in->edge->out` establishes a directed graph connection between source (`in`) and target (`out`) record IDs.
> 2. Creates a relation edge record in table `wrote`.
> 3. Enables native graph arrow traversals (`->wrote->post`).

---

### Exercise 2: Attaching Properties to Edge Records in `RELATE`

**Scenario:**
Create a relation edge `reviewed` connecting `user:bob` to `product:p1`, setting edge metadata `rating = 5` and `comment = "Excellent!"`.

**Requirements:**
1. Execute `RELATE user:bob -> reviewed -> product:p1 SET rating = 5, comment = "Excellent!"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:bob SET name = "Bob";
> CREATE product:p1 SET name = "Headphones";
> 
> -- Create relation edge with metadata properties
> RELATE user:bob->reviewed->product:p1 SET 
>     rating = 5,
>     comment = "Excellent!",
>     reviewed_at = time::now();
> ```
>
> #### Technical Explanation
>
> 1. `SET key = val` attaches custom metadata properties to the created relation edge document.
> 2. Relation edges act as full record documents with primary key IDs, `in`, `out`, and custom fields.
> 3. Replaces SQL junction tables containing metadata columns.

---

### Exercise 3: Bulk Relation Edge Creation via Subqueries

**Scenario:**
Relate user `user:admin` to ALL products in table `product` using relation edge `manages` in a single `RELATE` statement.

**Requirements:**
1. Execute `RELATE user:admin -> manages -> (SELECT id FROM product)`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:admin SET name = "Admin User";
> CREATE product:p1 SET name = "Item 1";
> CREATE product:p2 SET name = "Item 2";
> 
> -- Bulk create relation edges using subqueries
> RELATE user:admin->manages->(SELECT VALUE id FROM product);
> ```
>
> #### Technical Explanation
>
> 1. `RELATE` accepts subqueries `(SELECT VALUE id FROM ...)` to bulk-create relation edges across record arrays.
> 2. Creates individual relation edge records for every target ID returned by the subquery.
> 3. Enables high-performance bulk graph edge construction.

---





## 6. Related Terms

- [Graph Connections (Overview: Nodes vs Edges)](graph_overview.md) — The parent paradigm.
- [Graph Arrow Operators (`->`, `<-`)](graph_arrows.md) — Querying relationships.
- [Edge Properties](edge_properties.md) — Related concept: Edge Properties.
- [Record Link (Concept)](record_link_concept.md) — Related concept: Record Link (Concept).

---

## 7. Key Takeaways
- The `RELATE` statement creates graph edge records in SurrealDB.
- Uses a visually descriptive arrow syntax: `node_a -> edge -> node_b`.
- Automatically populates the mandatory `in` and `out` pointer fields.
- Custom properties are attached to the edge record using the `SET` keyword.
- Returns the created relation document back to the client program.
- Avoid using standard `CREATE` commands to build graph connections.
- Requires relation tables to be defined first in schema-full mode.
