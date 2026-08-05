# Denormalization

> **Level 6 — Schema Design & Normalization**
> The database optimization technique where redundancy is intentionally introduced into a normalized schema to eliminate complex joins and speed up read query performance.

---

## 1. Prerequisites
- [Third Normal Form (3NF)](third_normal_form.md) — The clean relational design standard.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Supported conceptually in all databases. Implemented using duplicate columns, pre-aggregated caching tables, or Materialized Views).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Trade-off Analysis

**Problem:** You decide to duplicate the `author_name` column from the `users` table directly into the `posts` table (which is a 3NF violation).
1.  What is the benefit of this change?
2.  What is the risk or cost of this change?

**Expected output:**
> [!check]- Answer
> ```text
> 1. Benefit: Speed. You can display a post and its author's name without running a JOIN query to the `users` table.
> 2. Risk/Cost: Data synchronization overhead. If an author edits their name, the system must update the `author_name` column in the `users` table AND in every matching row in the `posts` table, otherwise the database will display conflicting names.
> ```
> - Think about the steps required to render a list on screen.
> - Consider what happens when users edit their profiles.

---



### Exercise 2: Denormalizing Aggregate Counter with Trigger

**Problem:** Create trigger function updating denormalized `posts.comment_count` on new `comments` insertion.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE FUNCTION update_comment_count() RETURNS TRIGGER AS $$ BEGIN UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id; RETURN NEW; END; $$ LANGUAGE plpgsql;
> ```
> ```sql
> CREATE FUNCTION update_comment_count() RETURNS TRIGGER AS $$
> BEGIN
>   UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
>   RETURN NEW;
> END;
> $$ LANGUAGE plpgsql;
> ```
>
> **Explanation:** Triggers keep denormalized aggregate counter columns updated in real-time.

---

### Exercise 3: Denormalization Tradeoff Matrix

**Problem:** State tradeoff of Denormalization: Faster reads (eliminates JOINs) vs Slower writes & data redundancy sync overhead.

**Expected output:**
> [!check]- Answer
> ```text
> Faster read performance vs slower writes and data update synchronization overhead
> ```
> ```text
> Faster read performance vs slower writes and data update synchronization overhead
> ```
>
> **Explanation:** Denormalization sacrifices write simplicity to optimize high-throughput read workloads.

## 7. Related Terms
- [Third Normal Form (3NF)](third_normal_form.md) — The parent clean design target.
- [Materialized View](../level_09/materialized_view.md) — Related concept: Materialized View.
- [Normalization](normalization.md) — Related concept: Normalization.

---

## 8. Key Takeaways
- Denormalization intentionally duplicates data to speed up read queries.
- Trade-off: It makes reads much faster, but makes writes slower and more complex.
- Eliminates heavy `JOIN` and aggregate `COUNT`/`SUM` calculations on page loads.
- Requires application triggers or logic to keep duplicated data in sync.
- **Rule of Thumb:** Always normalize first. Only denormalize to fix measured bottlenecks.
