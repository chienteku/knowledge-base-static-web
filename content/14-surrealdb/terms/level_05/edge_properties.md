# Edge Properties

> **Level 5 — Relational Data & Graph Operations**
> The metadata properties stored directly on graph relationship records (edges) in SurrealDB, and the query paths used to extract these attributes instead of traversing past them to the target nodes.

---

## 1. Prerequisites
- [`RELATE` Statement](relate.md) — The command creating the edges.
- [Object Type](../level_02/object_type.md) — Nested metadata structures.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Stored directly inside the relation table records. Serialized on disk alongside the mandatory `in` and `out` pointer blocks).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Storing Relationship Properties in Node Records instead of Graph Edge Records

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

### Mistake 5: Querying Edge Properties Without Including Edge Table Names in Arrow Paths

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

## 6. Practice Exercises

### Exercise 1: Edge Property Querying

**Problem:** You are building a school grading app. 
The database connects students to tests using a `took` relationship edge, storing scores on the edge:
`RELATE student:alice -> took -> test:math SET score = 95;`
Write the SurrealQL query to:
1.  Select the student `student:alice`.
2.  Retrieve a list of the `score` values stored on the `took` edges.

**Expected output:**
```sql
SELECT ->took.score FROM student:alice;
```

> [!check]- Answer
> - The source node is `student:alice`.
> - Do not traverse past the edge to the `test` table; select `score` directly from the `took` path.

---



### Exercise 2: Creating Graph Edge with Custom Properties

**Problem:** Relate `user:alice` to `product:99` with edge `reviewed` setting `rating = 5` and `comment = "Great!"`.

**Expected output:**
```text
RELATE user:alice->reviewed->product:99 SET rating = 5, comment = "Great!";
```

> [!check]- Answer
> ```surrealql
> RELATE user:alice->reviewed->product:99 SET rating = 5, comment = "Great!";
> ```
>
> **Explanation:** `RELATE ... SET key = val` attaches rich metadata properties directly to graph edge records.

### Exercise 3: Querying Edge Properties directly

**Problem:** Select all `reviewed` edge records where `rating >= 4`.

**Expected output:**
```text
SELECT * FROM reviewed WHERE rating >= 4;
```

> [!check]- Answer
> ```surrealql
> SELECT * FROM reviewed WHERE rating >= 4;
> ```
>
> **Explanation:** Graph edge tables (like `reviewed`) can be queried directly like standard tables.



### Exercise 4: Creating Graph Edge with Custom Properties

**Problem:** Relate `user:alice` to `product:99` with edge `reviewed` setting `rating = 5` and `comment = "Great!"`.

**Expected output:**
```text
RELATE user:alice->reviewed->product:99 SET rating = 5, comment = "Great!";
```

> [!check]- Answer
> ```surrealql
> RELATE user:alice->reviewed->product:99 SET rating = 5, comment = "Great!";
> ```
>
> **Explanation:** `RELATE ... SET key = val` attaches rich metadata properties directly to graph edge records.

### Exercise 5: Querying Edge Properties directly

**Problem:** Select all `reviewed` edge records where `rating >= 4`.

**Expected output:**
```text
SELECT * FROM reviewed WHERE rating >= 4;
```

> [!check]- Answer
> ```surrealql
> SELECT * FROM reviewed WHERE rating >= 4;
> ```
>
> **Explanation:** Graph edge tables (like `reviewed`) can be queried directly like standard tables.

## 7. Related Terms
- [`RELATE` Statement](relate.md) — The command creating the edges.
- [Graph Traversal Filtering (`WHERE` on edges)](graph_filtering.md) — Filtering using edge properties.

---

## 8. Key Takeaways
- Edges act as first-class documents and can store any data type properties.
- Relational equivalent to columns in SQL many-to-many junction tables.
- Querying `->edge->target` bypasses edge properties to fetch target fields.
- Querying `->edge.property` extracts metadata stored on the relationship edge.
- Do not chain the target table name when selecting edge properties.
- Storing properties on edges is ideal for timestamps, ratings, and quantities.
- Retrieve the complete edge record (including `out` links) by selecting `->edge`.
