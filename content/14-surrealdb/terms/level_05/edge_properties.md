# Edge Properties

> **Level 5 — Relational Data & Graph Operations**
> The metadata properties stored directly on graph relationship records (edges) in SurrealDB, and the query paths used to extract these attributes instead of traversing past them to the target nodes.

---

## 1. Prerequisites

- [`RELATE` Statement](relate.md) — The command creating the edges.
- [`object`](../level_02/object_type.md) — Nested metadata structures.

---

## 2. Term Category


**Schema & Modeling (graph edge record properties and metadata)**: - **Database Structure / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Relationships in the real world have attributes:
-   A user doesn't just "know" another user; they met at a specific time, and have a level of closeness (closeness score).
-   A customer doesn't just "buy" a product; they buy a specific quantity, at a specific price, on a specific date.

In SQL, you store these attributes inside columns of many-to-many junction tables. 

In basic graph databases, accessing edge attributes requires complex syntax extensions.

We designed **Edge Properties** in SurrealDB to treat relationships as first-class documents. 

Because graph edges are records stored in relation tables, they can hold any standard data type (integers, strings, arrays, nested objects). 

You store relationship metadata directly on the edge. 

When querying, you can select these properties by targeting the edge path (e.g. `->bought.quantity`) rather than jumping past the edge to the target node.

---

### (2) Querying Edge Properties
Understanding the traversal path is critical to extract edge properties:
-   **Traversing to Target Node:** `->bought->product` (jumps *past* the edge, returning the product record details).
-   **Traversing to Edge Properties:** `->bought.price` or `->bought` (stops *at* the edge, returning the properties stored on the `bought` relationship record).

---

### (3) Reality Metaphor (Highway Toll Tickets)
Imagine driving between cities:
-   **Nodes (Cities):** New York and Boston.
-   **Edge (Highway Road):** The physical highway connecting them.
-   **Edge Properties:** The **Toll Booth Ticket** handed to you when you enter the highway.
    -   The ticket stores: the entrance time, your vehicle weight, and the toll fee.
    -   This data does not belong to New York or Boston; it is printed on the highway ticket itself.

---

### (4) Code Examples

#### Writing and Reading Edge Properties in SurrealQL
Let's model a customer purchase graph:

```sql
-- 1. Create a relationship with edge properties (quantity and price)
RELATE user:john -> bought -> product:laptop
  SET quantity = 2,
      unit_price = 1200.00dec,
      purchased_at = time::now();

-- 2. Query target details (jumps PAST edge properties to get product title)
SELECT ->bought->product.title AS product_name FROM user:john;
-- Returns: [ { "product_name": ["Laptop Pro"] } ]

-- 3. Query edge properties (stops AT the edge to get unit_price)
SELECT ->bought.unit_price AS prices FROM user:john;
-- Returns: [ { "prices": [1200.00dec] } ]

-- 4. Retrieve both the edge properties AND the target node details together
-- (By selecting the edge records, which contain 'out' pointers)
SELECT ->bought AS purchases FROM user:john;
-- Returns:
// [
//   {
//     "purchases": [
//       {
//         "id": bought:a9f8g...,
//         "in": user:john,
//         "out": product:laptop, // Target link
//         "quantity": 2,
//         "unit_price": 1200.00dec,
//         "purchased_at": d"2026-07-21T15:00:00Z"
//       }
//     ]
//   }
// ]
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to query edge properties by chaining through the target node, resulting in 'NONE' evaluations

**The mistake:** Writing the query `SELECT ->bought->product.quantity FROM user:john;` expecting to retrieve the number of items purchased.

**Why it's wrong:** The `->product` segment tells SurrealDB to jump to the `product` table. 

Because `quantity` is stored *on the edge* (`bought` table) and not *on the product schema* (the product catalog doesn't track individual checkout quantities), the database returns `NONE`.

**Fix: Do not include the target table in your selection path when querying edge properties. Stop at the edge name:**

```sql
-- BAD (Looks on product table)
SELECT ->bought->product.quantity FROM user:john;

-- GOOD (Looks on bought edge table)
SELECT ->bought.quantity FROM user:john;
```

---



### Mistake 2: Storing Relationship Properties in Node Records instead of Graph Edge Records

**The mistake:** Storing `relationship_created_at` or `role` fields on the `user` or `group` node records.

**Why it's wrong:** Properties belonging to the *connection itself* (like `rating`, `permission_level`, `created_at`) belong on the edge record created by `RELATE`.

*Incorrect:*
```surrealql
CREATE user:alice SET membership_role = "admin"; // ❌ Store on node instead of edge!
```

*Fix:*
```surrealql
RELATE user:alice->member_of->group:tech SET role = "admin", created_at = time::now();
```

### Mistake 3: Querying Edge Properties Without Including Edge Table Names in Arrow Paths

**The mistake:** Writing `SELECT ->member_of.role FROM user:alice;` omitting the target node table.

**Why it's wrong:** To project edge properties, reference the edge table in the arrow path `->member_of[WHERE role = 'admin']->group` or query the edge table directly.

*Incorrect:*
```surrealql
SELECT ->member_of.role FROM user:alice; // ❌ Incomplete arrow projection!
```

*Fix:*
```surrealql
SELECT ->member_of[WHERE role = "admin"]->group AS admin_groups FROM user:alice;
```





## 5. Practice Exercises

### Exercise 1: Adding Metadata Properties to Relation Edges

**Scenario:**
An e-commerce system relates a `user` to a `product` via a `purchased` relation edge, storing metadata fields `price_paid` (`decimal`) and `purchased_at` (`datetime`).

**Requirements:**
1. Execute `RELATE user:alice -> purchased -> product:p1` setting edge metadata fields.
2. Select the relation edge record to verify stored properties.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET name = "Alice";
> CREATE product:p1 SET name = "Laptop";
> 
> -- Create relation edge with metadata properties
> RELATE user:alice->purchased->product:p1 SET 
>     price_paid = 1199.99dec,
>     purchased_at = time::now(),
>     rating = 5;
> 
> SELECT * FROM purchased;
> ```
>
> #### Technical Explanation
>
> 1. SurrealDB relation edges are first-class record documents capable of storing arbitrary properties.
> 2. Stores `in` (source pointer), `out` (target pointer), and custom metadata fields (`price_paid`).
> 3. Eliminates separate SQL junction tables with extra payload columns.

---

### Exercise 2: Filtering Queries by Edge Properties

**Scenario:**
Query all products purchased by `user:alice` where the edge metadata property `rating` is $\ge 4$.

**Requirements:**
1. Write a `SELECT` query traversing `->purchased[WHERE rating >= 4]->product`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Filter traversal by edge record metadata property
> SELECT ->purchased[WHERE rating >= 4]->product.name AS highly_rated_purchases 
> FROM user:alice;
> ```
>
> #### Technical Explanation
>
> 1. `[WHERE rating >= 4]` filters the relation edge records (`purchased`) during arrow traversal.
> 2. Only follows edge paths that satisfy edge property constraints.
> 3. Combines graph topology navigation with rich metadata filtering.

---

### Exercise 3: Updating Properties on Existing Relation Edges

**Scenario:**
Update the `rating` property on an existing `purchased` relation edge between `user:alice` and `product:p1`.

**Requirements:**
1. Update relation edge `purchased` setting `rating = 5`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Update edge property
> UPDATE purchased SET rating = 5 WHERE in = user:alice AND out = product:p1;
> ```
>
> #### Technical Explanation
>
> 1. Relation edges can be updated like standard database tables using `UPDATE`.
> 2. Matching on `in` and `out` targets specific edge instances directly.
> 3. Mutates edge properties without breaking graph vertex connections.

---





## 6. Related Terms

- [`RELATE` Statement](relate.md) — The command creating the edges.
- [Graph Traversal Filtering (`WHERE` on edges)](graph_filtering.md) — Filtering using edge properties.

---

## 7. Key Takeaways
- Edges act as first-class documents and can store any data type properties.
- Relational equivalent to columns in SQL many-to-many junction tables.
- Querying `->edge->target` bypasses edge properties to fetch target fields.
- Querying `->edge.property` extracts metadata stored on the relationship edge.
- Do not chain the target table name when selecting edge properties.
- Storing properties on edges is ideal for timestamps, ratings, and quantities.
- Retrieve the complete edge record (including `out` links) by selecting `->edge`.
