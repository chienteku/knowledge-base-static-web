# Denormalization

> **Level 6 — Schema Design & Normalization**
> The database optimization technique where redundancy is intentionally introduced into a normalized schema to eliminate complex joins and speed up read query performance.

---

## 1. Prerequisites
- [Third Normal Form (3NF)](third_normal_form.md) — The clean relational design standard.

---

## 2. Term Category

**Schema Design** (Read Optimization Architecture): Denormalization strategically introduces controlled data redundancy into normalized schemas to eliminate costly join operations.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported conceptually in all databases. Implemented using duplicate columns, pre-aggregated caching tables, or Materialized Views).

### (1) Design Motivation — "Why did we design this?"
Normalization (specifically 3NF) is the golden rule of database design. It eliminates duplicate data, protects data integrity, and makes writing data very fast and clean.

However, normalization splits data across many tables. 

If you are building a high-traffic web dashboard (like a social media feed), loading a single page might require querying the `posts` table, and joining it with `users` (for avatars), `categories` (for labels), and running a `COUNT` aggregate on `comments` (to show comment counts).

If your website has 1 million active users reloading the feed:
-   Running 4-table joins and count aggregates on every page load consumes massive CPU.
-   The database server halts, causing site lag.

We designed the concept of **Denormalization** to solve this read-performance bottleneck. 

It is the conscious decision to violate normalization rules by duplicating columns or storing pre-calculated aggregates directly inside primary tables (for example, caching a `comments_count` column inside the `posts` table).

---

### (2) The Normalization vs. Denormalization Trade-off

| Dimension | Normalized (3NF) | Denormalized |
| :--- | :--- | :--- |
| **Optimization** | Optimized for **Writes** (inserts/updates). | Optimized for **Reads** (selects/reports). |
| **Joins** | High count (slow read speeds). | Low count/None (high read speeds). |
| **Disk Space** | Small footprint (no duplicates). | Large footprint (data is duplicated). |
| **Integrity Risk** | None (guaranteed consistent on disk). | High (requires app code to sync duplicates). |

---

### (3) Reality Metaphor
Imagine a restaurant kitchen recipe book:
-   **Normalized:** The recipe for lasagna says: *"Step 1: Prep 2 cups of marinara sauce (see Marinara page 42)."* To cook, you constantly flip back and forth between page 10 and page 42 (Joins). The book is thin, but reading takes time.
-   **Denormalized:** The recipe page prints the complete marinara sauce steps directly on the lasagna page. You read straight down without flipping pages (Fast Reads). However, the book is thicker (uses more space), and if you change your marinara recipe, you must edit it on 5 different pages (update risk).

---

### (4) Code Examples

#### Normalized vs. Denormalized Schema

**Normalized (3NF):**
```sql
CREATE TABLE posts (id INT PRIMARY KEY, title TEXT);
CREATE TABLE comments (id INT PRIMARY KEY, post_id INT REFERENCES posts(id), msg TEXT);

-- Query: Requires counting rows every page load (Slow)
SELECT posts.title, COUNT(comments.id) AS comments_count
FROM posts
LEFT JOIN comments ON posts.id = comments.post_id
GROUP BY posts.id;
```

**Denormalized (Caching Counts):**
```sql
CREATE TABLE posts (
  id INT PRIMARY KEY,
  title TEXT,
  comments_count INT DEFAULT 0 -- Cached count column (Denormalized!)
);

-- Query: Instant select, no joins or count scans needed! (Fast)
SELECT title, comments_count FROM posts;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Denormalizing prematurely before measuring performance bottlenecks

**The mistake:** Designing a brand new database with duplicate columns and cached counters from Day 1 because you "know the site will be popular."

**Why it's wrong:** Denormalization introduces severe complexity. If you cache a `comments_count`, your application backend must write extra code to increment that count every time a comment is added, and decrement it when a comment is deleted. 

If your server crashes mid-write, the count goes out of sync, displaying corrupt statistics to users. 

**Fix: Always start by designing a clean, fully normalized schema (3NF). Only denormalize columns after production profiling or load tests prove that specific joins are causing slow response times.**

---



### Mistake 2: Premature Denormalization Without Measuring Actual Query Read Bottlenecks

**The mistake:** Denormalizing `user_name` into 20 tables before building standard JOIN queries and indexes.

**Why it's wrong:** Denormalization introduces complex data update sync overhead. Normalize first, measure performance with `EXPLAIN ANALYZE`, and denormalize ONLY measured read bottlenecks.

*Incorrect:*
```sql
// Denormalizing fields into 20 tables prematurely
```

*Fix:*
```sql
Maintain 3NF normalization; denormalize only after measuring actual read bottlenecks
```

### Mistake 3: Failing to Maintain Data Sync Across Denormalized Columns

**The mistake:** Denormalizing `user_email` into `orders` without creating triggers or transactional sync when user email changes.

**Why it's wrong:** If user email changes in `users`, denormalized `orders.user_email` columns become stale and out of sync. Use triggers or background worker sync tasks.

*Incorrect:*
```sql
// Updating users.email without updating orders.user_email
```

*Fix:*
```sql
Create AFTER UPDATE trigger on users to synchronize denormalized order_email fields
```

## 5. Practice Exercises

### Exercise 1: Adding Pre-Calculated Aggregate Summary Columns

**Scenario:**
Denormalize `users` table by adding a cached `total_orders_count` column to avoid expensive aggregate subqueries on profile pages.

**Requirements:**
1. Add `total_orders_count INTEGER NOT NULL DEFAULT 0` to `users`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> ALTER TABLE users 
> ADD COLUMN total_orders_count INTEGER NOT NULL DEFAULT 0;
> 
> -- Maintenance trigger or application update increments total_orders_count on order insert
> UPDATE users AS u 
> SET total_orders_count = (
>   SELECT COUNT(*) FROM orders AS o WHERE o.user_id = u.id
> );
> ```
>
> #### Technical Explanation
>
> 1. Denormalization stores redundant pre-computed summary metrics directly in parent rows.
> 2. Eliminates issuing `COUNT(*)` aggregate table scans on every user profile view ($O(1)$ read velocity).
> 3. Trade-off: Requires maintaining sync integrity during order inserts/deletes using triggers or application logic.

---

### Exercise 2: Maintaining Denormalized Cache Columns via Triggers

**Scenario:**
Create a PostgreSQL trigger function that automatically updates `users.total_orders_count` whenever a new row is inserted into `orders`.

**Requirements:**
1. Write trigger function incrementing `total_orders_count`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE OR REPLACE FUNCTION update_user_order_count() 
> RETURNS TRIGGER AS $$
> BEGIN
>   UPDATE users 
>   SET total_orders_count = total_orders_count + 1 
>   WHERE id = NEW.user_id;
>   RETURN NEW;
> END;
> $$ LANGUAGE plpgsql;
> 
> CREATE TRIGGER trg_order_count_inc 
> AFTER INSERT ON orders 
> FOR EACH ROW 
> EXECUTE FUNCTION update_user_order_count();
> ```
>
> #### Technical Explanation
>
> 1. Database triggers enforce automatic cache synchronization at the storage layer.
> 2. Guarantees denormalized counts remain 100% accurate across concurrent application transactions.
> 3. Prevents cache drift bugs.

---

### Exercise 3: Trade-Off Analysis: Normalization vs Denormalization

**Scenario:**
Formulate a technical trade-off matrix comparing strict 3NF schema vs Denormalized read-optimized schema.

**Requirements:**
1. Contrast read latency, write latency, storage overhead, and consistency risks.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Schema Architecture Selection Matrix:
> - Normalized Schema (3NF): Zero data duplication, guaranteed write consistency, higher read join latency.
> - Denormalized Schema: Sub-millisecond read latency, zero joins, higher write latency (trigger overhead), risk of cache drift.
> Rule: Normalize first! Denormalize only when empirical query profiling proves join bottlenecks.
> ```
>
> #### Technical Explanation
>
> 1. Normalization optimizes write safety and data integrity.
> 2. Denormalization optimizes read velocity for high-traffic read-heavy workloads.
> 3. Base choice on measured system bottlenecks.

---



## 6. Related Terms
- [Third Normal Form (3NF)](third_normal_form.md) — The parent clean design target.
- [Materialized View](../level_09/materialized_view.md) — Related concept: Materialized View.
- [Normalization](normalization.md) — Related concept: Normalization.

---

## 7. Key Takeaways
- Denormalization intentionally duplicates data to speed up read queries.
- Trade-off: It makes reads much faster, but makes writes slower and more complex.
- Eliminates heavy `JOIN` and aggregate `COUNT`/`SUM` calculations on page loads.
- Requires application triggers or logic to keep duplicated data in sync.
- **Rule of Thumb:** Always normalize first. Only denormalize to fix measured bottlenecks.
