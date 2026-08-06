# `UPSERT`

> **Level 3 — CRUD Operations in SurrealQL**
> The native, standalone SurrealQL statement that guarantees a write operation: it updates records that match the query criteria, or automatically inserts a new record if no matches are found.

---

## 1. Prerequisites

- [`UPDATE`](update.md) — The update write statement.
- [`INSERT ... ON DUPLICATE KEY UPDATE`](insert_on_duplicate.md) — The insert-based upsert alternative.

---

## 2. Term Category


**SurrealQL Command (conditional update-or-insert statement)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In database workflows, you often need to ensure a record exists with specific values:
-   If a user preferences document exists, update their theme.
-   If the preferences document is missing, create it.

If you write this using separate queries:
1.  Run `SELECT` to see if the record exists.
2.  If yes, run `UPDATE`.
3.  If no, run `INSERT` / `CREATE`.

This takes three round-trips to the database, which slows down your application and introduces race conditions (another process might write the record between your select and insert steps).

We designed the native, standalone **`UPSERT`** statement in SurrealQL to solve this in a single query transaction. 

It guarantees that a write occurs. 

If the target record exists, it updates it. 

If it is missing, it inserts it on the spot.

---

### (2) The Key Difference: `UPDATE` vs. `UPSERT`
While `UPDATE` will create a record if you target a specific Record ID directly (e.g. `UPDATE user:john`), **`UPDATE` and `UPSERT` behave differently when using filters (`WHERE` clauses)**:

-   **`UPDATE ... WHERE <condition>`:**
    -   Scans the table.
    -   If **no records** match the condition, the query **does nothing** (zero records modified, no new records created).
-   **`UPSERT ... WHERE <condition>`:**
    -   Scans the table.
    -   If **no records** match the condition, the query **automatically creates a new record**, applying the filter values and the update settings to the new document.

---

### (3) Reality Metaphor (Table Service)
Imagine serving drinks at a cafe:
-   **`UPDATE` with Filter:** You walk into the room and say: *"For everyone sitting at Table 5, change their order to coffee."* 
    -   If Table 5 is empty, you shrug and walk out. No coffee is served.
-   **`UPSERT` with Filter:** You walk in and say: *"For everyone at Table 5, change their order to coffee."* 
    -   If Table 5 is empty, you pull out a chair, seat a new customer at Table 5, and place a hot cup of coffee in front of them. 
    -   You guarantee a coffee is served.

---

### (4) Code Examples

#### UPDATE vs. UPSERT on Filter Misses
Let's see how both statements handle a filter miss:

```sql
-- Assume the user table has NO users with email 'alice@mail.com'

-- ==========================================
-- SCENARIO A: UPDATE (Does nothing!)
-- ==========================================
UPDATE user SET active = true WHERE email = "alice@mail.com";
-- Result: Returns empty array []. No new record is created on disk.

-- ==========================================
-- SCENARIO B: UPSERT (Creates a record!)
-- ==========================================
UPSERT user SET active = true WHERE email = "alice@mail.com";
-- Result: SurrealDB notices no records match the email.
-- It automatically inserts a new user record:
-- { id: user:random_id, email: "alice@mail.com", active: true }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using 'UPDATE ... WHERE' expecting a fallback record to be created when no documents match the query filter

**The mistake:** Running the query `UPDATE user SET status = "subscribed" WHERE email = $input_email;` expecting the database to automatically register new subscribers.

**Why it's wrong:** Because it is an `UPDATE` statement with a `WHERE` clause, it will fail silently if the email is not already in the database. 

It will return `[]` and create no record, leaving your subscriber list empty.

**Fix: Use `UPSERT ... WHERE` if you want the database to automatically create the record when the filter criteria find no matches:**

```sql
-- CORRECT (Guarantees subscriber record is written)
UPSERT user SET status = "subscribed" WHERE email = $input_email;
```

---



### Mistake 2: Expecting `UPSERT` to Fail on Primary Key Collisions Like `CREATE`

**The mistake:** Using `UPSERT` expecting it to raise an error if the record already exists.

**Why it's wrong:** `UPSERT` automatically creates the record if missing OR updates it if it exists. If collision errors are required, use `CREATE`.

*Incorrect:*
```surrealql
-- Expecting collision error
UPSERT user:alice SET name = "Alice"; // ❌ Will NOT raise collision error!
```

*Fix:*
```surrealql
CREATE user:alice SET name = "Alice"; // Raises error if user:alice exists
```

### Mistake 3: Omitting Table or Record Target in `UPSERT` Statements

**The mistake:** Writing `UPSERT SET name = 'Alice';` without specifying table or Record ID.

**Why it's wrong:** `UPSERT` requires a target table or target Record ID.

*Incorrect:*
```surrealql
UPSERT SET name = "Alice"; // ❌ Syntax error!
```

*Fix:*
```surrealql
UPSERT user:alice SET name = "Alice";
```

## 5. Practice Exercises

### Exercise 1: Conditional Update-or-Insert Execution

**Scenario:**
An API integration syncs user setting records. If setting `setting:john` exists, update its `theme` value; if it does not exist, insert a new setting record.

**Requirements:**
1. Write the `UPSERT setting:john` statement setting `theme = "dark"`.
2. Execute the query twice to verify idempotent insert-or-update execution.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Upsert creates record if absent, or updates record if present
> UPSERT setting:john SET theme = "dark";
> 
> -- Second execution safely updates existing setting:john record
> UPSERT setting:john SET theme = "light";
> ```
>
> #### Technical Explanation
>
> 1. `UPSERT table:id` checks primary key existence: creates record if absent, or updates record if present.
> 2. Unlike `CREATE` (which fails on existing primary keys), `UPSERT` guarantees idempotent write execution.
> 3. Eliminates preliminary `SELECT` check queries in application code.
> 
---

### Exercise 2: Bulk Upserting Filtered Record Batches

**Scenario:**
A background synchronization job upserts user metrics records where `active = true`.

**Requirements:**
1. Write an `UPSERT user` query with a `WHERE` filter clause.
2. Set `last_synced = time::now()`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:u1 SET active = true;
> CREATE user:u2 SET active = false;
> 
> -- Bulk upsert active users
> UPSERT user SET last_synced = time::now() WHERE active = true;
> ```
>
> #### Technical Explanation
>
> 1. `UPSERT table SET ... WHERE condition` updates matching existing records and creates non-existing target records.
> 2. Operates within an atomic write transaction block.
> 3. Ideal for state synchronization and cache warming tasks.
> 
---

### Exercise 3: Upserting with `MERGE` Strategy

**Scenario:**
Upsert customer preferences using `UPSERT ... MERGE { notifications: true }` to avoid overwriting existing profile data if the customer record exists.

**Requirements:**
1. Execute `UPSERT customer:c1 MERGE { notifications: true }`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Non-destructive upsert using MERGE strategy
> UPSERT customer:c1 MERGE { notifications: true };
> ```
>
> #### Technical Explanation
>
> 1. Combining `UPSERT` with `MERGE` creates new records or shallow-merges JSON properties into existing records.
> 2. Preserves unmentioned properties on existing records while initializing new records cleanly.
> 3. Essential for partial record synchronization workflows.
> 
---



## 6. Related Terms

- [`UPDATE`](update.md) — The update write statement.
- [`INSERT ... ON DUPLICATE KEY UPDATE`](insert_on_duplicate.md) — The insert-based upsert alternative.

---

## 7. Key Takeaways
- The standalone `UPSERT` statement guarantees a database write.
- Updates existing matching records, or inserts a new record on a miss.
- `UPDATE ... WHERE` does nothing on a miss; `UPSERT ... WHERE` inserts a record.
- Copied parameters from the `WHERE` clause are used to populate the new document.
- Eliminates application round-trip selects and inserts, preventing race conditions.
- Returns the updated or newly created record back to the client program.
- Highly useful for preferences, count caches, and status logs syncs.
