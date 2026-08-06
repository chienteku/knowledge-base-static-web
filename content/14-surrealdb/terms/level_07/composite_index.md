# Composite Index

> **Level 7 — Indexes, Full-Text Search & Performance**
> An index in SurrealDB built across multiple fields (`COLUMNS field1, field2`), optimizing queries that filter or sort by combinations of those specific fields according to left-to-right column prefix rules.

---

## 1. Prerequisites

- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The parent index context.
- [`WHERE` Clause](../level_03/where.md) — Multi-field filter queries.

---

## 2. Term Category


**Performance / Operations (multi-column composite index definition)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In multi-tenant or multi-attribute applications, queries frequently filter by multiple fields simultaneously:
- Finding all users belonging to tenant `"corp_a"` who have the role `"admin"`.
- Searching products in category `"electronics"` sorted by `price`.

If you define two separate single-column indexes (one on `tenant` and one on `role`):
- The database engine can usually only pick one index per table scan, or perform an index merge step.
- Single-column indexes cannot optimize queries that sort by a second column.

In SQL (PostgreSQL), developers build compound indexes (`CREATE INDEX ON table (col1, col2)`). In MongoDB, developers build compound indexes (`{ col1: 1, col2: 1 }`).

We designed **Composite Indexes** in SurrealQL to optimize multi-field queries. By listing multiple columns in a `DEFINE INDEX` statement, SurrealDB builds a single, multi-key B-Tree structure. This allows queries filtering or sorting on those combined fields to execute in a single fast index lookup.

---

### (2) Column Order & Left-to-Right Prefix Rule
The order of columns defined in a composite index matters:
- Index definition: `COLUMNS tenant, role, status`
- **Supported Queries:**
  - Filters matching `tenant` (Leftmost column).
  - Filters matching `tenant AND role` (Left prefix pair).
  - Filters matching `tenant AND role AND status` (Full combination).
- **NOT Supported:** Filters matching *only* `role` or *only* `status` (skipping the leftmost `tenant` column bypasses the index tree).

---

### (3) Reality Metaphor (The Telephone Directory)
Imagine looking up names in a traditional phone book:
- **Composite Index Order:** The phone book is sorted by `(Last Name, First Name)`.
- **Supported Lookup:** Looking up everyone named `"Smith"` (left prefix) or looking up `"Smith, John"` (full prefix) is instant.
- **Unsupported Lookup:** Looking up everyone whose first name is `"John"` (without knowing their last name) requires scanning the entire phone book from cover to cover.

---

### (4) Code Examples

#### Creating Composite Indexes in SurrealQL

```sql
DEFINE TABLE order SCHEMAFULL;
DEFINE FIELD customer ON order TYPE record<customer>;
DEFINE FIELD status ON order TYPE string;
DEFINE FIELD created_at ON order TYPE datetime;

-- 1. Defining a 3-column composite index
-- Optimizes queries filtering by customer + status, sorted by created_at!
DEFINE INDEX idx_customer_status_date ON order COLUMNS customer, status, created_at;

-- 2. Query that FULLY utilizes this composite index
SELECT * FROM order 
WHERE customer = customer:alice AND status = "shipped" 
ORDER BY created_at DESC;

-- 3. Query that PARTIALLY utilizes this index (left prefix match: customer only)
SELECT * FROM order WHERE customer = customer:alice;

-- 4. Query that CANNOT use this index (skips leftmost column 'customer')
SELECT * FROM order WHERE status = "shipped"; -- Full table scan!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Placing secondary or rare search columns first in the composite column list, breaking prefix optimization for primary searches

**The mistake:** Defining `COLUMNS status, customer` when 95% of your application queries search by `customer` alone.

**Why it's wrong:** Because `status` is listed first, queries searching by `customer` alone cannot use the composite index, resulting in slow full table scans.

**Fix: Place the most frequently queried / most selective columns first in the `COLUMNS` list:**

```sql
-- BAD (queries filtering only by customer cannot use this)
DEFINE INDEX idx_order ON order COLUMNS status, customer;

-- GOOD (leftmost column matches primary query pattern)
DEFINE INDEX idx_order ON order COLUMNS customer, status;
```

---



### Mistake 2: Mismatched Field Ordering Between Composite Index Definition and Query `WHERE` Clauses

**The mistake:** Defining `FIELDS tenant, status` but querying `WHERE status = 'active'` without `tenant`.

**Why it's wrong:** B-Tree composite indexes require the leading index column (`tenant`) in `WHERE` predicates to perform index range scans efficiently.

*Incorrect:*
```surrealql
DEFINE INDEX tenant_status ON TABLE user FIELDS tenant, status;
SELECT * FROM user WHERE status = "active"; // ❌ Cannot utilize composite index efficiently!
```

*Fix:*
```surrealql
SELECT * FROM user WHERE tenant = "t1" AND status = "active"; // Leading index column included
```

### Mistake 3: Creating Multiple Single-Column Indexes Instead of One Composite Index for Multi-Column Predicates

**The mistake:** Creating separate indexes on `tenant` and `status` when queries always filter by `WHERE tenant = X AND status = Y`.

**Why it's wrong:** Two single-column indexes force the engine to intersect index results. A single composite index on `FIELDS tenant, status` satisfies multi-column queries in a single lookup.

*Incorrect:*
```surrealql
DEFINE INDEX idx1 ON TABLE user FIELDS tenant;
DEFINE INDEX idx2 ON TABLE user FIELDS status;
```

*Fix:*
```surrealql
DEFINE INDEX idx_composite ON TABLE user FIELDS tenant, status;
```

## 5. Practice Exercises

### Exercise 1: Multi-Column Composite Index Definition

**Scenario:**
An e-commerce query frequently filters product listings by `category` and `status` simultaneously. Create a composite index to accelerate multi-field queries.

**Requirements:**
1. Define table `product` as `SCHEMAFULL`.
2. Define composite index `idx_cat_status` covering columns `category` and `status`.
3. Write a query filtering by both fields to leverage the index.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE product SCHEMAFULL;
> DEFINE FIELD category ON TABLE product TYPE string;
> DEFINE FIELD status ON TABLE product TYPE string;
> 
> -- Define multi-column composite index
> DEFINE INDEX idx_cat_status ON TABLE product COLUMNS category, status;
> 
> -- Query leveraging composite index
> SELECT * FROM product WHERE category = "electronics" AND status = "available";
> ```
>
> #### Technical Explanation
>
> 1. Composite indexes (`COLUMNS col1, col2`) index multi-field combinations together in a single B-tree index structure.
> 2. Accelerates queries containing multi-field `WHERE` clause filters.
> 3. Column order in index definition (`category, status`) determines index prefix matching rules.
> 
---

### Exercise 2: Left-Prefix Matching Evaluation

**Scenario:**
Evaluate whether `idx_cat_status` (covering `category, status`) can optimize a query filtering ONLY on `category`.

**Requirements:**
1. Execute `SELECT * FROM product WHERE category = "electronics";`.
2. State whether left-prefix index matching applies.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT * FROM product WHERE category = "electronics";
> ```
>
> #### Technical Explanation
>
> 1. Composite B-tree indexes support left-prefix matching, optimizing queries on the leading column (`category`).
> 2. Queries filtering ONLY on the secondary column (`status`) cannot utilize the composite index effectively.
> 3. Reduces the need for separate single-column indexes on leading fields.
> 
---

### Exercise 3: Composite Index Overwrites with `OVERWRITE`

**Scenario:**
Update `idx_cat_status` to include a third column `price` using `DEFINE INDEX OVERWRITE`.

**Requirements:**
1. Write `DEFINE INDEX OVERWRITE idx_cat_status ON TABLE product COLUMNS category, status, price`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE INDEX OVERWRITE idx_cat_status ON TABLE product 
>     COLUMNS category, status, price;
> ```
>
> #### Technical Explanation
>
> 1. `OVERWRITE` updates existing index definitions idempotently without prior `REMOVE INDEX` calls.
> 2. Rebuilds index pages in the background.
> 3. Facilitates schema index tuning in CI/CD migration scripts.
> 
---



## 6. Related Terms

- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The parent index context.
- [Unique Index](unique_index.md) — Composite unique constraints.
- [Query Explanation & Performance](query_explanation.md) — Related concept: Query Explanation & Performance.

---

## 7. Key Takeaways
- Composite indexes combine multiple fields (`COLUMNS col1, col2, col3`).
- Relational equivalent to PostgreSQL compound indexes; NoSQL equivalent to MongoDB compound indexes.
- Left-to-right prefix rule: queries must include the leftmost column to use the index.
- Optimizes queries that filter by multiple fields or filter and sort simultaneously.
- Put the most selective or most frequently queried column first in the column list.
