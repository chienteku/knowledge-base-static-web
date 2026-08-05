# `SAVEPOINT` / `ROLLBACK TO`

> **Level 8 — Transactions, Concurrency & Data Integrity**
> The SQL transaction control statements used to set named checkpoints inside a transaction, allowing partial rollbacks to the checkpoint if errors occur without aborting the entire transaction.

---

## 1. Prerequisites
- [`BEGIN` / `COMMIT` / `ROLLBACK`](begin_commit_rollback.md) — The parent transaction control commands.
---

## 2. Term Category
- **SQL DML Statement / Control**

---

## 3. Environment Context
- **PostgreSQL Core** (Stored in-memory inside the active transaction state. Every active savepoint consumes memory; creating thousands of nested savepoints can cause transaction performance lag).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard SQL transactions, if a single query crashes, the entire transaction is marked as aborted. 

You cannot commit any queries, and you are forced to run a full `ROLLBACK`.

This is correct for basic bank transfers. 

But consider a **data import wizard** that inserts 1,000 new products into a catalog:
-   If product #999 has an invalid price constraint, the database crashes.
-   Without checkpoints, you lose all 998 successfully imported products.
-   You have to fix the CSV file and restart the entire 1,000-row import.

We designed **Savepoints** to solve this. 

A savepoint is a checkpoint marker placed inside an active transaction. 

If an error occurs, you can tell the database to **Rollback to** that specific checkpoint. 

This undoes only the queries written *after* the checkpoint was set, keeping the preceding writes safe. 

You can then fix the error, continue writing, and commit the transaction successfully.

---

### (2) Key Commands
-   **`SAVEPOINT name;`**: Creates a named checkpoint.
-   **`ROLLBACK TO name;`**: Undoes all writes executed after that savepoint was set.
-   **`RELEASE SAVEPOINT name;`**: Deletes the checkpoint from memory. (Highly recommended once the risk is past, to free database memory).

---

### (3) Reality Metaphor (Video Game Checkpoints)
Imagine playing a difficult adventure video game:
-   You start the level (the `BEGIN` command).
-   You defeat the first boss, and walk past a **Checkpoint Flag** (you declare a `SAVEPOINT`).
-   You try to cross a bridge, but fall into a pit of spikes (a query error).
-   **Without checkpoints (Standard SQL):** You die and are sent back to the title screen, losing all progress from Level 1.
-   **With checkpoints (`ROLLBACK TO`):** You respawn at the Checkpoint Flag. The first boss remains defeated, and you can try crossing the bridge again.

---

### (4) Code Examples

#### Partial Rollback in Action
```sql
CREATE TABLE inventory (item VARCHAR(50) UNIQUE, price NUMERIC(10,2));

BEGIN;

INSERT INTO inventory VALUES ('Mouse', 20.00);

-- 1. Create a checkpoint named 'after_first_insert'
SAVEPOINT after_first_insert;

-- 2. Try to insert a duplicate item (this fails the unique constraint!)
INSERT INTO inventory VALUES ('Mouse', 25.00);
-- ERROR: duplicate key value violates unique constraint "inventory_item_key"

-- 3. The transaction is stalled. We roll back ONLY to the checkpoint!
ROLLBACK TO after_first_insert;

-- 4. Insert a different item instead (succeeds)
INSERT INTO inventory VALUES ('Keyboard', 50.00);

COMMIT;

-- Database contains: 'Mouse' (20.00) and 'Keyboard' (50.00). 
-- The duplicate error was bypassed!
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Leaving thousands of active savepoints open inside a single loop

**The mistake:** Writing a backend loop that inserts 10,000 rows, creating a new `SAVEPOINT` before every single insert, but never running `RELEASE SAVEPOINT`.

**Why it's wrong:** The database engine must keep track of every savepoint in RAM to support potential rollbacks. 

Accumulating thousands of savepoints consumes transaction memory buffers, slowing down query speeds and bloating database locking engines.

**Fix: Once an insertion succeeds, run `RELEASE SAVEPOINT [name]` to destroy the checkpoint, freeing up transaction memory.**

---



### Mistake 2: Accumulating Thousands of Savepoints inside a Single Transaction (Memory Leak)

**The mistake:** Creating 10,000 savepoints inside a single transaction loop without releasing them.

**Why it's wrong:** Each active savepoint consumes memory in the transaction context. Thousands of savepoints degrade transaction execution speed. Use `RELEASE SAVEPOINT name` to free memory.

*Incorrect:*
```sql
FOR i IN 1..10000 LOOP SAVEPOINT sp; -- ❌ Memory accumulation!
```

*Fix:*
```sql
RELEASE SAVEPOINT sp; -- Free savepoint memory when inner block completes
```

### Mistake 3: Expecting `ROLLBACK TO SAVEPOINT` to End the Parent Outer Transaction

**The mistake:** Issuing `ROLLBACK TO SAVEPOINT sp` and assuming the outer transaction is closed.

**Why it's wrong:** `ROLLBACK TO SAVEPOINT` rolls back ONLY statement mutations executed after the specified savepoint! The outer transaction remains OPEN and requires an explicit `COMMIT` or `ROLLBACK`.

*Incorrect:*
```sql
// Assuming ROLLBACK TO SAVEPOINT ends transaction
```

*Fix:*
```sql
Execute COMMIT or ROLLBACK to conclude the outer transaction block
```

## 6. Practice Exercises

### Exercise 1: Seeding Script Checkpoints

**Problem:** You have a seeding script. You want to insert a user `'Frank'`, set a checkpoint named `'post_frank'`, insert a second user `'Grace'` (which will fail because Grace already exists in the unique database list), roll back the failure, insert a third user `'Heidi'`, and commit. 

Write the complete SQL transaction script.

**Expected output:**
> [!check]- Answer
> ```sql
> BEGIN;
> INSERT INTO users (username) VALUES ('Frank');
> SAVEPOINT post_frank;
> INSERT INTO users (username) VALUES ('Grace'); -- Simulates duplicate crash
> ROLLBACK TO post_frank;
> INSERT INTO users (username) VALUES ('Heidi');
> COMMIT;
> ```
> - Set the savepoint name after the insert of Frank.
> - Target the exact checkpoint name inside the `ROLLBACK TO` clause.

---



### Exercise 2: Savepoint Syntax Workflow

**Problem:** Write SQL workflow creating `SAVEPOINT my_sp`, inserting a test row, and rolling back to `my_sp`.

**Expected output:**
> [!check]- Answer
> ```text
> BEGIN; SAVEPOINT my_sp; INSERT INTO users (name) VALUES ('Test'); ROLLBACK TO SAVEPOINT my_sp; COMMIT;
> ```
> ```sql
> BEGIN;
> SAVEPOINT my_sp;
> INSERT INTO users (name) VALUES ('Test');
> ROLLBACK TO SAVEPOINT my_sp;
> COMMIT;
> ```
>
> **Explanation:** `ROLLBACK TO SAVEPOINT` undoes mutations executed after the savepoint without aborting the main transaction.

---

### Exercise 3: Releasing Savepoints

**Problem:** Command to release savepoint `sp1` freeing internal memory (`RELEASE SAVEPOINT sp1;`).

**Expected output:**
> [!check]- Answer
> ```text
> RELEASE SAVEPOINT sp1;
> ```
> ```sql
> RELEASE SAVEPOINT sp1;
> ```
>
> **Explanation:** `RELEASE SAVEPOINT` destroys sub-transaction markers while keeping data mutations intact.

## 7. Related Terms
- [`BEGIN` / `COMMIT` / `ROLLBACK`](begin_commit_rollback.md) — The parent transaction controls.
---

## 8. Key Takeaways
- Savepoints are named checkpoints set inside an active transaction.
- `ROLLBACK TO` undoes only queries executed after the savepoint was created.
- Allows transactions to survive single query errors without full rollbacks.
- Use `RELEASE SAVEPOINT` to delete checkpoints once they are no longer needed.
- Overusing savepoints without releasing them bloats transaction memory.
- Excellent for bulk import scripts, data seeding, and conditional migrations.
