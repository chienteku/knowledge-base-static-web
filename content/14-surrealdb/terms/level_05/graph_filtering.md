# Graph Traversal Filtering (`WHERE` on edges)

> **Level 5 — Relational Data & Graph Operations**
> The query strategy in SurrealDB used to restrict graph traversals inside `WHERE` clauses, filtering records based on metadata properties stored on the connection edges, or attributes stored on the target nodes.

---

## 1. Prerequisites

- [Edge Properties](edge_properties.md) — The metadata on edges.
- [`WHERE` Clause](../level_03/where.md) — The query filter context.
- [Graph Arrow Operators (`->`, `<-`)](graph_arrows.md) — Graph arrow operators for traversal filtering.

---

## 2. Term Category


**Query Feature (inline edge and node filter conditions)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: Edge-Level Property Filtering

**Scenario:**
Query products purchased by `user:alice` via relation edge `purchased` where the purchase price `price_paid` was $> 500dec$.

**Requirements:**
1. Relate `user:alice -> purchased -> product:p1 SET price_paid = 1200dec`.
2. Select `->purchased[WHERE price_paid > 500dec]->product.name` from `user:alice`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET name = "Alice";
> CREATE product:p1 SET name = "High-End Laptop";
> RELATE user:alice->purchased->product:p1 SET price_paid = 1200dec;
> 
> -- Filter traversal by edge property
> SELECT ->purchased[WHERE price_paid > 500dec]->product.name AS expensive_purchases 
> FROM user:alice;
> ```
>
> #### Technical Explanation
>
> 1. `[WHERE price_paid > 500dec]` attaches filter conditions directly to the `purchased` edge table step.
> 2. Filters out relation edges failing the condition before resolving target vertex nodes.
> 3. Optimizes graph traversal performance by pruning invalid paths early.
> 
---

### Exercise 2: Target Vertex Property Filtering

**Scenario:**
Query users followed by `user:alice` via edge `follows` where the target user's `verified` status is `true`.

**Requirements:**
1. Select `->follows->user[WHERE verified = true].name` from `user:alice`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:bob SET name = "Bob", verified = true;
> CREATE user:carol SET name = "Carol", verified = false;
> RELATE user:alice->follows->user:bob;
> RELATE user:alice->follows->user:carol;
> 
> -- Filter traversal by target vertex property
> SELECT ->follows->user[WHERE verified = true].name AS verified_following 
> FROM user:alice;
> ```
>
> #### Technical Explanation
>
> 1. `->user[WHERE verified = true]` applies filter conditions to the target `user` vertex nodes.
> 2. Excludes unverified user records from the final projection array.
> 3. Enables target node filtering during graph navigation.
> 
---

### Exercise 3: Combined Edge and Vertex Dual Filtering

**Scenario:**
Query posts written by `user:alice` where the relation edge `wrote` has `role = "author"` AND the target post `published` status is `true`.

**Requirements:**
1. Apply edge filter `[WHERE role = "author"]` and vertex filter `[WHERE published = true]`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT ->wrote[WHERE role = "author"]->post[WHERE published = true].title AS authored_posts 
> FROM user:alice;
> ```
>
> #### Technical Explanation
>
> 1. Combines inline edge filtering and vertex filtering in a single graph path expression.
> 2. Both edge conditions AND target vertex conditions must evaluate to `true` to include the path.
> 3. Expresses complex graph queries declaratively without multi-stage subqueries.
> 
---





## 6. Related Terms

- [Edge Properties](edge_properties.md) — The metadata on edges.
- [`WHERE` Clause](../level_03/where.md) — The query filter context.

---

## 7. Key Takeaways
- Graph traversals can be filtered using properties of edges or target nodes.
- Relational equivalent to writing checks inside SQL JOIN ON/WHERE clauses.
- Edge filters stop at the edge name (e.g. `WHERE ->bought.quantity`).
- Target filters chain through the edge to the target table (e.g. `WHERE ->bought->product.price`).
- Placing edge filters on target paths evaluates to `NONE` and skips records.
- Combine edge and target filters inside a single `WHERE` block using `AND` / `OR`.
- Streamlines query data retrieval by pruning unwanted nodes early in the execution.
