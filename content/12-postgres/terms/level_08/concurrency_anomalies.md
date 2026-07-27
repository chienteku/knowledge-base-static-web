# Concurrency Anomalies (Dirty, Non-Repeatable, Phantom Reads)

> **Level 8 — Transactions, Concurrency & Data Integrity**
> The three classic data consistency read errors (Dirty Reads, Non-Repeatable Reads, Phantom Reads) that occur when concurrent database transactions execute without sufficient isolation.

---

## 1. Prerequisites
- [MVCC (Multi-Version Concurrency Control)](mvcc.md) — The versioning snapshot manager.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Standardized by the SQL-92 specification. Used to define transaction isolation level boundaries across all relational engines).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Relational databases must support concurrent operations. 

However, if the database allowed transactions to run completely unchecked, they would corrupt each other's views.

For example, if you are generating a financial report inside Transaction A, you expect that the data you read does not shift or morph while you compile the page. 

If it does, your report calculations will be incorrect.

To analyze and prevent these bugs, database theory defines the **Three Classic Concurrency Anomalies**:

---

### (2) The Three Anomalies

#### 1. Dirty Read (Reading Uncommitted Drafts)
Transaction A reads data written by Transaction B **before** Transaction B commits.
-   *The danger:* If Transaction B encounters an error and rolls back, Transaction A has read "phantom" data that never legally existed in the database.
-   *PostgreSQL Note:* **Dirty reads are mathematically impossible in PostgreSQL.** Because of MVCC snapshot rules, Postgres never allows a transaction to read uncommitted row versions.

#### 2. Non-Repeatable Read (Values Shift Mid-Transaction)
Transaction A reads a row. Transaction B updates or deletes that exact row and commits. Transaction A reads the same row again, but finds the values have changed (or the row is deleted).
-   *The danger:* The same select query returns different values inside the same transaction block.

#### 3. Phantom Read (New Rows Appear Mid-Transaction)
Transaction A runs a query filtering a range of rows (e.g. `WHERE salary > 50000`, yielding 10 rows). Transaction B inserts a new employee earning `$60,000` and commits. Transaction A runs the same query again, and suddenly **11 rows** appear.
-   *The danger:* A new "phantom" row appeared in the range filter out of nowhere.

---

### (3) Reality Metaphor (Booking Concert Tickets)
-   **Dirty Read:** You check a ticket site and see Seat `12B` is marked "Sold". You walk away. However, the buyer's credit card failed, and the booking was cancelled. You read a dirty, uncommitted draft state.
-   **Non-Repeatable Read:** You look up Seat `12B` and see it costs `$50`. You click "Next Page". While you are typing details, a manager updates the seat price to `$60`. You look again, and the value of that exact seat has shifted.
-   **Phantom Read:** You count how many seats are booked in Row H (10 seats). While you are looking, another user books a new seat in Row H. You recount, and suddenly 11 seats are booked. A phantom seat appeared in the row.

---

### (4) Anomaly Matrix

| Anomaly | What happens? | PostgreSQL Default Status |
| :--- | :--- | :--- |
| **Dirty Read** | Read uncommitted writes. | **Prevented** |
| **Non-Repeatable Read** | Same row changes values. | Possible (at default level) |
| **Phantom Read** | New rows appear in range. | Possible (at default level) |

*(Note: How to prevent these anomalies using isolation settings is covered in the next term: [Transaction Isolation Levels](isolation_levels.md)).*

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Believing PostgreSQL allows dirty reads under "Read Uncommitted" isolation

**The mistake:** Configuring your PostgreSQL connection to `READ UNCOMMITTED` expecting to read active, uncommitted dirty rows from other sessions to build a real-time monitor page.

**Why it's wrong:** Under the SQL standard, `READ UNCOMMITTED` allows dirty reads. However, because of PostgreSQL's MVCC snapshot architecture, Postgres is physically incapable of reading uncommitted data. If you set the isolation to `READ UNCOMMITTED`, Postgres silently upgrades the connection to `READ COMMITTED`, blocking dirty reads.

**Fix: Do not rely on dirty reads for application features. If you need real-time data sync, use WebSockets, queues, or polling.**

---



### Mistake 2: Assuming `READ COMMITTED` Prevents Lost Updates in Read-Modify-Write Cycles

**The mistake:** Reading `score` in app, adding 1 in code, and issuing `UPDATE users SET score = 11 WHERE id = 1` under `READ COMMITTED`.

**Why it's wrong:** Concurrent transactions reading `score = 10` concurrently will both write `score = 11`, overwriting each other's updates (Lost Update). Use atomic SQL `UPDATE users SET score = score + 1` or `SELECT FOR UPDATE`.

*Incorrect:*
```sql
const score = await readScore(); await updateScore(score + 1); -- ❌ Lost update anomaly!
```

*Fix:*
```sql
UPDATE users SET score = score + 1 WHERE id = 1; -- Atomic SQL update
```

### Mistake 3: Assuming `REPEATABLE READ` Prevents Serialization Anomalies (Write Skew)

**The mistake:** Relying on `REPEATABLE READ` to prevent Write Skew anomalies across related tables.

**Why it's wrong:** `REPEATABLE READ` prevents Non-Repeatable Reads and Phantom Reads, but permits Write Skew! Use `SERIALIZABLE` isolation level for strict anomaly prevention.

*Incorrect:*
```sql
// Expecting REPEATABLE READ to prevent Write Skew across tables
```

*Fix:*
```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

## 6. Practice Exercises

### Exercise 1: Anomaly Diagnostics

**Problem:** Identify which specific concurrency anomaly occurred in the following scenario logs:
-   `Session 1:` Runs `SELECT count FROM store WHERE id = 1;` -> returns `10`.
-   `Session 2:` Runs `UPDATE store SET count = 20 WHERE id = 1; COMMIT;`
-   `Session 1:` Runs `SELECT count FROM store WHERE id = 1;` -> returns `20`.

**Expected output:**
```text
Non-Repeatable Read!
Session 1 queried the exact same row (id = 1) twice inside the same transaction block, but the value changed between reads due to Session 2's committed update.
```

> [!check]- Answer
> - The target row remains the same, but the inner value shifts.
> - Identify if the transaction completed its commit sequence.

---



### Exercise 2: Concurrency Anomalies Breakdown

**Problem:** Match anomalies: 1. Dirty Read (Reads uncommitted data); 2. Non-Repeatable Read (Re-read returns modified values); 3. Phantom Read (Re-read returns newly inserted rows).

**Expected output:**
```text
1. Dirty Read, 2. Non-Repeatable Read, 3. Phantom Read
```

> [!check]- Answer
> ```text
> 1. Dirty Read, 2. Non-Repeatable Read, 3. Phantom Read
> ```
>
> **Explanation:** Concurrency anomalies describe data inconsistencies caused by un-isolated concurrent transactions.

### Exercise 3: Preventing Lost Updates

**Problem:** Write atomic SQL statement preventing Lost Update anomaly when incrementing user `points`.

**Expected output:**
```text
UPDATE users SET points = points + 10 WHERE id = 1;
```

> [!check]- Answer
> ```sql
> UPDATE users SET points = points + 10 WHERE id = 1;
> ```
>
> **Explanation:** Performing arithmetic inside atomic SQL `UPDATE` statements guarantees concurrent update safety.

## 7. Related Terms
- [MVCC (Multi-Version Concurrency Control)](mvcc.md) — The version snapshot driver.
- [Transaction Isolation Levels](isolation_levels.md) — The settings used to block anomalies.

---

## 8. Key Takeaways
- Concurrency anomalies are read consistency errors occurring during parallel execution.
- Dirty Read: Reading uncommitted edits (prevented natively in PostgreSQL).
- Non-Repeatable Read: An existing row changes values mid-transaction.
- Phantom Read: New rows appear inside a range query mid-transaction.
- SQL-92 isolation levels are defined by which anomalies they allow or block.
- Standard PostgreSQL prevents dirty reads at all levels due to MVCC.
