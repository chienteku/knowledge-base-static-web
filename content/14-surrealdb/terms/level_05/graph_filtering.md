# Graph Traversal Filtering (`WHERE` on edges)

> **Level 5 — Relational Data & Graph Operations**
> The query strategy in SurrealDB used to restrict graph traversals inside `WHERE` clauses, filtering records based on metadata properties stored on the connection edges, or attributes stored on the target nodes.

---

## 1. Prerequisites
- [Edge Properties](edge_properties.md) — The metadata on edges.
- [`WHERE` Clause](../level_03/where.md) — The query filter context.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed by the query execution planner. Resolves path filters in memory during traversal sweeps to prune unmatched nodes early).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When traversing graph networks, you rarely want to retrieve all connected items:
-   **Analytics:** You want to find products bought by a user, but *only* those where they bought more than 2 items (edge property filter).
-   **Security:** You want to find users who follow a page, but *only* if they followed it before a specific date (edge property filter).
-   **Catalogs:** You want to find articles written by John's friends, but *only* if the articles are about "Rust" (target node filter).

In standard SQL, writing these filters requires adding complex checks inside the `ON` or `WHERE` clauses of multi-table `JOIN` statements.

We designed **Graph Traversal Filtering** in SurrealQL to allow you to write path-based conditions directly inside the standard `WHERE` clause. 

You trace the arrow path to the target property (whether it lives on the edge, like `->bought.quantity`, or on the target node, like `->bought->product.category`), keeping filter logic aligned with your data structure.

---

### (2) The Two Filtering Path Types

#### 1. Filtering by Edge Properties (Metadata on the Link)
Trace the path up to the edge table name only:
`WHERE ->bought.quantity > 2` (checks the quantity field stored *on the edge*).

#### 2. Filtering by Target Node Properties (Metadata on the Destination)
Trace the path through the edge to the target table name:
`WHERE ->bought->product.category = "electronics"` (checks the category field stored *on the product table*).

---

### (3) Reality Metaphor (Highway Inspection Checkpoints)
Imagine checking cars coming off a highway:
-   **Target Node Filter (Destination Check):** An inspection gate at the end of the road. 
    -   The officer checks: *"Are you driving a commercial vehicle?"* (Checks properties of the vehicle/target node). Only commercial trucks pass.
-   **Edge Filter (Ticket Check):** A **Toll Road Inspection Gate**. 
    -   The officer checks the toll ticket: *"Show me your ticket. Did you pay more than $10 in tolls? And did you enter the highway before 10:00 AM?"* (Checks properties of the road path/edge). 
    -   Only cars with matching tickets pass.

---

### (4) Code Examples

#### Filtering Graph Traversals in SurrealQL
Let's filter a buyer-product network:

```sql
-- Assume relationship exists: user:john -> bought -> product:laptop (quantity = 2)

-- 1. Filter using Edge Properties
-- Retrieve products bought by John, but ONLY if the purchase quantity is greater than 1
SELECT ->bought->product.title AS items
FROM user:john
WHERE ->bought.quantity > 1;
-- Returns: [ { "items": ["Laptop Pro"] } ] (quantity is 2, matches!)

-- 2. Filter using Target Node Properties
-- Retrieve products bought by John, but ONLY if the product category is "electronics"
SELECT ->bought->product.title AS tech_items
FROM user:john
WHERE ->bought->product.category = "electronics";

-- 3. Combine both filters in a single query!
SELECT ->bought->product.title AS spec_items
FROM user:john
WHERE ->bought.quantity > 1 AND ->bought->product.price < 1500.00dec;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Placing edge property filters on the target node path, resulting in 'NONE' mismatches that filter out all results

**The mistake:** Writing the query filter as `WHERE ->bought->product.quantity > 1` to filter by purchase quantity.

**Why it's wrong:** Chaining `->product` tells the database to evaluate the query filter on the fields of the `product` record. 

Because `quantity` is saved on the `bought` edge record and not on the `product` catalog schema, the path evaluates to `NONE`. 

Since `NONE > 1` is false, the query filters out all records, returning `[]`.

**Fix: Verify whether the field you are filtering lives on the edge table (stop at edge name) or the target table (chain through to target):**

```sql
-- BAD (Looks on product table)
SELECT * FROM user:john WHERE ->bought->product.quantity > 1;

-- GOOD (Looks on bought edge table)
SELECT * FROM user:john WHERE ->bought.quantity > 1;
```

---



### Mistake 2: Filtering Edge Properties in Node `WHERE` Clauses instead of Arrow Bracket Clauses

**The mistake:** Writing `SELECT ->wrote->post WHERE rating = 5 FROM user:alice;` when `rating` is stored on `wrote` edge.

**Why it's wrong:** Filtering edge properties requires bracket syntax inside the arrow path: `->wrote[WHERE rating = 5]->post`.

*Incorrect:*
```surrealql
-- Trying to filter edge property in top-level WHERE
SELECT ->wrote->post FROM user:alice WHERE rating = 5; // ❌ Top-level WHERE filters user:alice!
```

*Fix:*
```surrealql
SELECT ->wrote[WHERE rating = 5]->post FROM user:alice; // Filters edge property inside arrow
```

### Mistake 3: Filtering Target Node Properties Without Parenthesis Clauses

**The mistake:** Writing `SELECT ->wrote->post WHERE published = true FROM user:alice;`.

**Why it's wrong:** Top-level `WHERE` filters the source record (`user:alice`). To filter target `post` nodes, use `->wrote->(post WHERE published = true)`.

*Incorrect:*
```surrealql
SELECT ->wrote->post FROM user:alice WHERE published = true; // Filters user:alice, not post!
```

*Fix:*
```surrealql
SELECT ->wrote->(post WHERE published = true) FROM user:alice;
```



### Mistake 4: Filtering Edge Properties in Node `WHERE` Clauses instead of Arrow Bracket Clauses

**The mistake:** Writing `SELECT ->wrote->post WHERE rating = 5 FROM user:alice;` when `rating` is stored on `wrote` edge.

**Why it's wrong:** Filtering edge properties requires bracket syntax inside the arrow path: `->wrote[WHERE rating = 5]->post`.

*Incorrect:*
```surrealql
-- Trying to filter edge property in top-level WHERE
SELECT ->wrote->post FROM user:alice WHERE rating = 5; // ❌ Top-level WHERE filters user:alice!
```

*Fix:*
```surrealql
SELECT ->wrote[WHERE rating = 5]->post FROM user:alice; // Filters edge property inside arrow
```

### Mistake 5: Filtering Target Node Properties Without Parenthesis Clauses

**The mistake:** Writing `SELECT ->wrote->post WHERE published = true FROM user:alice;`.

**Why it's wrong:** Top-level `WHERE` filters the source record (`user:alice`). To filter target `post` nodes, use `->wrote->(post WHERE published = true)`.

*Incorrect:*
```surrealql
SELECT ->wrote->post FROM user:alice WHERE published = true; // Filters user:alice, not post!
```

*Fix:*
```surrealql
SELECT ->wrote->(post WHERE published = true) FROM user:alice;
```

## 6. Practice Exercises

### Exercise 1: Filter Path Design

**Problem:** You have a `user` table. 
Users connect to other users via a `follows` edge. The edge stores `closeness_score`. 
Write the SurrealQL query to:
1.  Select the user record `user:alice`.
2.  Retrieve the usernames of people Alice follows.
3.  Filter only connections where the `closeness_score` on the `follows` edge is greater than `5`.

**Expected output:**
```sql
SELECT ->follows->user.username FROM user:alice WHERE ->follows.closeness_score > 5;
```

> [!check]- Answer
> - The source node is `user:alice`.
> - Check if `closeness_score` lives on the `follows` edge or the target `user` record, and format your `WHERE` path accordingly.

---



### Exercise 2: Filtering Graph Traversals by Edge Property

**Problem:** Select posts liked by `user:alice` where edge property `weight >= 8` using `->like[WHERE weight >= 8]->post`.

**Expected output:**
```text
SELECT ->like[WHERE weight >= 8]->post AS top_likes FROM user:alice;
```

> [!check]- Answer
> ```surrealql
> SELECT ->like[WHERE weight >= 8]->post AS top_likes FROM user:alice;
> ```
>
> **Explanation:** `->edge[WHERE condition]->node` filters graph traversals by edge properties.

### Exercise 3: Filtering Graph Traversals by Target Node Property

**Problem:** Select products purchased by `user:alice` where `price > 100` using `->purchased->(product WHERE price > 100)`.

**Expected output:**
```text
SELECT ->purchased->(product WHERE price > 100) AS expensive_purchases FROM user:alice;
```

> [!check]- Answer
> ```surrealql
> SELECT ->purchased->(product WHERE price > 100) AS expensive_purchases FROM user:alice;
> ```
>
> **Explanation:** `->(node WHERE condition)` filters graph traversals by target node properties.



### Exercise 4: Filtering Graph Traversals by Edge Property

**Problem:** Select posts liked by `user:alice` where edge property `weight >= 8` using `->like[WHERE weight >= 8]->post`.

**Expected output:**
```text
SELECT ->like[WHERE weight >= 8]->post AS top_likes FROM user:alice;
```

> [!check]- Answer
> ```surrealql
> SELECT ->like[WHERE weight >= 8]->post AS top_likes FROM user:alice;
> ```
>
> **Explanation:** `->edge[WHERE condition]->node` filters graph traversals by edge properties.

### Exercise 5: Filtering Graph Traversals by Target Node Property

**Problem:** Select products purchased by `user:alice` where `price > 100` using `->purchased->(product WHERE price > 100)`.

**Expected output:**
```text
SELECT ->purchased->(product WHERE price > 100) AS expensive_purchases FROM user:alice;
```

> [!check]- Answer
> ```surrealql
> SELECT ->purchased->(product WHERE price > 100) AS expensive_purchases FROM user:alice;
> ```
>
> **Explanation:** `->(node WHERE condition)` filters graph traversals by target node properties.

## 7. Related Terms
- [Edge Properties](edge_properties.md) — The metadata on edges.
- [`WHERE` Clause](../level_03/where.md) — The query filter context.

---

## 8. Key Takeaways
- Graph traversals can be filtered using properties of edges or target nodes.
- Relational equivalent to writing checks inside SQL JOIN ON/WHERE clauses.
- Edge filters stop at the edge name (e.g. `WHERE ->bought.quantity`).
- Target filters chain through the edge to the target table (e.g. `WHERE ->bought->product.price`).
- Placing edge filters on target paths evaluates to `NONE` and skips records.
- Combine edge and target filters inside a single `WHERE` block using `AND` / `OR`.
- Streamlines query data retrieval by pruning unwanted nodes early in the execution.
