# `UPSERT` (`ON CONFLICT`)

> **Level 3 — CRUD Operations (The Four Pillars of SQL)**
> A PostgreSQL SQL feature that performs an atomic "insert-or-update" operation, automatically executing an update or ignoring the write if a unique key conflict occurs during an insert.

---

## 1. Prerequisites
- [`INSERT INTO`](insert_into.md) — The baseline write command.
- [`UNIQUE` Constraint](../level_02/unique_constraint.md) — The database rule that triggers conflict intercepts.

---

## 2. Term Category

**SQL Command / Clause** (Conditional Insert or Update Clause): `ON CONFLICT ... DO UPDATE` (Upsert) performs an update if a key conflict occurs during row insertion.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Introduced in PostgreSQL 9.5. Executes atomically within the storage engine, preventing race conditions (dirty reads/writes) between competing client connections).

### (1) Design Motivation — "Why did we design this?"
In web applications, you often encounter situations where you want to write a record, but update it if it already exists:
-   **User Signup:** A user clicks "Register." If their email is new, insert them. If their email is already in the database, update their `last_active_at` date instead of crashing with a duplicate key error.
-   **Analytics Tracker:** You log page visits. If the page URL is new, set count to `1`. If the page URL exists, increment the count by `1`.

In standard SQL, you had to write complex code:
1.  Query the database: `SELECT * FROM stats WHERE url = '/home'`.
2.  In your application code, write an `if/else` block.
3.  If missing, run `INSERT`. If present, run `UPDATE`.

This is an anti-pattern because it is subject to **Race Conditions**. 

If two clients run the `SELECT` query at the same millisecond, both see the record is missing, both attempt to run `INSERT`, and one crashes with a duplicate key error.

To solve this, PostgreSQL designed the **`ON CONFLICT`** clause (commonly known as **UPSERT**). It handles the select-check-write cycle inside the database engine in a single, atomic step.

---

### (2) The `ON CONFLICT` Options
When an insert conflicts with a unique constraint, you tell Postgres to do one of two things:

1.  **`DO NOTHING`**: Silently ignore the insert and exit without throwing an error.
2.  **`DO UPDATE`**: Run a secondary update script.

Inside the `DO UPDATE` clause, you can reference a special virtual table named **`EXCLUDED`**. This table contains the values you *attempted* to insert.

---

### (3) Reality Metaphor
Imagine hanging coats in a theater cloakroom:
-   **Standard Insert:** You walk to hook `15` and hang a coat. If a coat is already hanging there, you drop both coats on the floor in a panic (Duplicate key crash).
-   **`ON CONFLICT DO NOTHING`:** You walk to hook `15`. Seeing a coat is already there, you shrug and walk away.
-   **`ON CONFLICT DO UPDATE`:** You walk to hook `15`. Seeing a coat is already there, you leave the old coat hanging but attach a sticker to it saying: *"Last checked at 7:00 PM"* (updating metadata).

---

### (4) Code Examples

#### 1. ON CONFLICT DO NOTHING
Prevents script crashes when bulk importing duplicates:

```sql
CREATE TABLE email_list (
  email VARCHAR(100) UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- First insert succeeds
INSERT INTO email_list (email) VALUES ('bob@example.com');

-- Second insert would crash, but DO NOTHING makes it exit silently!
INSERT INTO email_list (email) VALUES ('bob@example.com')
ON CONFLICT (email) DO NOTHING;
```

#### 2. ON CONFLICT DO UPDATE (The Upsert)
Increment a counter automatically:

```sql
CREATE TABLE page_views (
  url VARCHAR(200) UNIQUE,
  views_count INT DEFAULT 1
);

-- Insert '/home'. If it already exists, increment its count by 1!
INSERT INTO page_views (url, views_count) 
VALUES ('/home', 1)
ON CONFLICT (url) 
DO UPDATE SET views_count = page_views.views_count + 1;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that ON CONFLICT requires a unique index target

**The mistake:** Writing `ON CONFLICT (email) DO NOTHING` when the `email` column does not have a `UNIQUE` constraint or unique index defined on it.

**Why it's wrong:** Postgres cannot resolve a "conflict" unless a unique constraint triggers the block first. If the column allows duplicates, Postgres will simply insert a duplicate row, ignoring your `ON CONFLICT` clause and throwing a syntax error.

**Fix: Ensure that the column targeted in the parenthesis `ON CONFLICT (column_name)` is configured as a `PRIMARY KEY` or carries a `UNIQUE` constraint.**

---



### Mistake 2: Using `ON CONFLICT` Target Columns Without a Matching UNIQUE Constraint or Index

**The mistake:** Executing `INSERT INTO users (email, name) VALUES ('a@ex.com', 'Alice') ON CONFLICT (email) DO UPDATE ...` when `email` lacks a unique index.

**Why it's wrong:** `ON CONFLICT (target_column)` strictly REQUIRES an active UNIQUE index or constraint on `target_column`. Omitting the unique index throws error `there is no unique or exclusion constraint matching the ON CONFLICT specification`.

*Incorrect:*
```sql
INSERT ... ON CONFLICT (email) DO UPDATE ...; -- ❌ Fails if email lacks unique index!
```

*Fix:*
```sql
CREATE UNIQUE INDEX idx_users_email ON users (email);
INSERT INTO users (email, name) VALUES ('a@ex.com', 'Alice') ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;
```

### Mistake 3: Confusing `EXCLUDED.col` Target Values with Pre-Existing Row Values inside `DO UPDATE`

**The mistake:** Writing `DO UPDATE SET name = name` expecting to reference the newly proposed insert value.

**Why it's wrong:** In `ON CONFLICT DO UPDATE`, column name `name` references the PRE-EXISTING row value in the database. `EXCLUDED.name` references the NEW proposed insertion tuple.

*Incorrect:*
```sql
ON CONFLICT (id) DO UPDATE SET name = name; -- ❌ Sets name to existing value!
```

*Fix:*
```sql
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name; -- Sets name to proposed new value
```

## 5. Practice Exercises

### Exercise 1: Conditional Upsert Execution with `ON CONFLICT DO UPDATE`

**Scenario:**
Insert or update user setting for `user_id = 42`. If setting exists, update `theme`; if missing, insert a new setting row.

**Requirements:**
1. Execute `INSERT INTO ... ON CONFLICT (user_id) DO UPDATE SET ...`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> INSERT INTO user_settings (user_id, theme, updated_at) 
> VALUES (42, 'dark', CURRENT_TIMESTAMP) 
> ON CONFLICT (user_id) 
> DO UPDATE SET 
>   theme = EXCLUDED.theme,
>   updated_at = EXCLUDED.updated_at 
> RETURNING user_id, theme;
> ```
>
> #### Technical Explanation
>
> 1. `ON CONFLICT (user_id)` detects unique constraint violations on `user_id`.
> 2. `DO UPDATE SET` modifies the existing row using `EXCLUDED.col` pseudo-table values.
> 3. Atomic insert-or-update operation in a single query.

---

### Exercise 2: Silent Duplicate Exclusion with `ON CONFLICT DO NOTHING`

**Scenario:**
Insert a tag into `tags` table, silently ignoring the write if the tag name already exists.

**Requirements:**
1. Execute `INSERT INTO tags (name) VALUES ('sql') ON CONFLICT (name) DO NOTHING`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> INSERT INTO tags (name) 
> VALUES ('postgresql') 
> ON CONFLICT (name) 
> DO NOTHING 
> RETURNING id;
> ```
>
> #### Technical Explanation
>
> 1. `DO NOTHING` suppresses unique constraint violation errors, leaving existing rows unchanged.
> 2. If conflict occurs, returns 0 affected rows without aborting the transaction.
> 3. Ideal for idempotent tag and dictionary inserts.

---

### Exercise 3: Multi-Column Composite Key Upserts

**Scenario:**
Upsert daily page view metrics into `page_views` table on composite unique key `(page_url, view_date)`.

**Requirements:**
1. Execute `ON CONFLICT (page_url, view_date) DO UPDATE SET view_count = page_views.view_count + 1`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> INSERT INTO page_views (page_url, view_date, view_count) 
> VALUES ('/home', CURRENT_DATE, 1) 
> ON CONFLICT (page_url, view_date) 
> DO UPDATE SET 
>   view_count = page_views.view_count + 1 
> RETURNING page_url, view_count;
> ```
>
> #### Technical Explanation
>
> 1. `ON CONFLICT (col1, col2)` targets multi-column unique constraints.
> 2. `page_views.view_count + 1` increments running totals on existing rows atomically.
> 3. Foundation for analytics aggregation pipelines.

---



## 6. Related Terms
- [`INSERT INTO`](insert_into.md) — The parent write statement.
- [`UNIQUE` Constraint](../level_02/unique_constraint.md) — The trigger rule for conflicts.

---

## 7. Key Takeaways
- An UPSERT (insert-or-update) is written in Postgres using `ON CONFLICT`.
- Runs atomically inside the database engine, eliminating application race conditions.
- `ON CONFLICT DO NOTHING` bypasses writes silently if unique constraints fail.
- `ON CONFLICT DO UPDATE` runs modifications using the virtual `EXCLUDED` values.
- The target column in `ON CONFLICT` must carry a unique index or primary key constraint.
