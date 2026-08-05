# ACID Properties

> **Level 8 — Transactions, Concurrency & Data Integrity**
> The four core guarantees (Atomicity, Consistency, Isolation, Durability) that ensure all database transactions are processed reliably, preserving data correctness despite system crashes or concurrent updates.

---

## 1. Prerequisites
- [Transaction](transaction.md) — The unit of work context where ACID properties are applied.
---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (The defining framework for Relational Database Management Systems (RDBMS). Postgres enforces ACID by combining write-ahead logs (WAL), locking systems, and MVCC snapshot controls).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Relational databases are trusted to manage critical business records: banking ledger balances, ticket seat bookings, and medical histories. 

To deserve this trust, the database must guarantee correctness under all conditions—even if the database server loses power, crashes, or processes thousands of concurrent edits at the exact same millisecond.

We designed the **ACID** framework to define the four mathematical guarantees that make a database reliable.

---

### (2) The ACID Breakdown

#### 1. **A**tomicity — *"All or Nothing"*
A transaction is treated as a single, indivisible "atom" of work. 
-   Either every single SQL statement inside the transaction succeeds, or the entire transaction rolls back. 
-   You will never end up with a half-completed write.

#### 2. **C**onsistency — *"Valid State Transitions"*
A transaction can only transition the database from one valid state to another, obeying all schema rules, keys, and logical check constraints.
-   If you write a query that violates a `CHECK (price >= 0)` constraint, the database rolls back the transaction. 
-   The database protects itself from saving invalid data.

#### 3. **I**solation — *"Concurrent Independence"*
If multiple clients run transactions at the same time, the database executes them in isolation. 
-   Transaction A's uncommitted writes are invisible to Transaction B. 
-   Transactions behave *as if* they were running sequentially, preventing concurrent write anomalies.

#### 4. **D**urability — *"Permanent Storage"*
Once a transaction commits, its modifications are permanently written to non-volatile storage (disk files). 
-   Even if the database server loses power a microsecond after commit, the data is guaranteed to survive. 
-   Upon reboot, the system recovers transaction states using the Write-Ahead Log (WAL).

---

### (3) Reality Metaphor (Boarding an Airplane)
-   **Atomicity:** Either you and your luggage board the plane, or neither does. The airline will never fly the plane with your bags onboard while you are left standing on the runway.
-   **Consistency:** The check-in counter enforces a rule: *"Maximum weight is 50 lbs."* If your suitcase is 70 lbs, the system blocks your check-in until you remove items, keeping the plane balanced.
-   **Isolation:** While you are checking in, the passenger at the adjacent counter is buying the last seat. Your checkout screens do not overlap or edit each other.
-   **Durability:** Once the gate agent stamps your ticket and prints your boarding pass, your seat is locked in the central computer. Even if the airport power grids fail, your booking is saved.

---

### (4) Architecture Enforcers

| ACID Property | Under-The-Hood Database Mechanism |
| :--- | :--- |
| **Atomicity** | **Undo logs / WAL:** Keeps records of old bytes to roll back if aborted. |
| **Consistency** | **Constraint Engine:** Rejects writes violating schema validations. |
| **Isolation** | **Locks & MVCC:** Snapshot isolation blocks concurrent modifications. |
| **Durability** | **WAL (Write-Ahead Log):** Writes logs to disk before modifying actual data. |

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Believing NoSQL database systems offer ACID transactions by default

**The mistake:** Assuming that all databases (including MongoDB, Redis, Cassandra) enforce strict ACID guarantees out-of-the-box.

**Why it's wrong:** Many NoSQL databases compromise on ACID properties (specifically Isolation or Durability) to achieve high write speeds or run across massive distributed clusters. E.g., they might use "eventual consistency" (writes are committed locally and take seconds to sync across servers, meaning users can read out-of-date data).

**Fix: If your application requires strict calculations (like financial transactions), select an ACID-compliant Relational Database (like PostgreSQL).**

---



### Mistake 2: Assuming Autocommit Mode Wraps Multi-Statement Operations in a Single Transaction

**The mistake:** Executing 2 separate SQL statements without `BEGIN` expecting them to commit atomically.

**Why it's wrong:** In autocommit mode, EACH statement runs in its OWN individual transaction! If statement 2 fails, statement 1 remains committed on disk. Wrap multi-statement operations in `BEGIN ... COMMIT`.

*Incorrect:*
```sql
UPDATE accounts SET bal = bal - 100 WHERE id = 1;
UPDATE accounts SET bal = bal + 100 WHERE id = 2; -- ❌ If 2 fails, 1 is committed!
```

*Fix:*
```sql
BEGIN;
UPDATE accounts SET bal = bal - 100 WHERE id = 1;
UPDATE accounts SET bal = bal + 100 WHERE id = 2;
COMMIT;
```

### Mistake 3: Ignoring Network Errors When Issuing Commit Signals

**The mistake:** Assuming a transaction failed if the network connection drops during `COMMIT`.

**Why it's wrong:** If a network drop occurs during `COMMIT`, the transaction MAY have succeeded on disk! Use idempotent transaction IDs or check transaction status before retrying.

*Incorrect:*
```sql
// Retrying financial transaction blindly after network disconnect during COMMIT
```

*Fix:*
```sql
Check status or use idempotent request keys before retrying failed commits
```

## 6. Practice Exercises

### Exercise 1: ACID Property Identification

**Problem:** Match the database failures below to the specific **ACID property letter** that was violated:
1.  A server power failure occurred. Upon reboot, the last committed bank deposit was missing from the account balance.
2.  A transaction crashed, but the database saved the first half of the queries on disk, leaving a user profile with no matching login credentials.
3.  Two store clerks sold the same physical item to two different customers at the same millisecond because they read the same stock count value simultaneously.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Durability (D) - Committed writes must survive system power crashes.
> 2. Atomicity (A) - Partial writes are forbidden; the database should have rolled back.
> 3. Isolation (I) - Concurrent transactions must run in isolation to prevent double-booking.
> ```
> - Differentiate write survival errors from concurrency execution anomalies.
> - Consider which property rules the "all-or-nothing" boundary.

---



### Exercise 2: ACID Acronym Definitions

**Problem:** Define ACID properties: Atomicity (All-or-Nothing), Consistency (Valid states), Isolation (Concurrent safety), Durability (Persisted across crashes).

**Expected output:**
> [!check]- Answer
> ```text
> Atomicity (All-or-Nothing), Consistency (Valid states), Isolation (Concurrent safety), Durability (Persisted across crashes)
> ```
> ```text
> Atomicity (All-or-Nothing), Consistency (Valid states), Isolation (Concurrent safety), Durability (Persisted across crashes)
> ```
>
> **Explanation:** ACID guarantees structural data safety across concurrent transactions.

---

### Exercise 3: Transactional Money Transfer

**Problem:** Write ACID-compliant SQL transferring $50 from account 1 to account 2.

**Expected output:**
> [!check]- Answer
> ```text
> BEGIN; UPDATE accounts SET balance = balance - 50 WHERE id = 1; UPDATE accounts SET balance = balance + 50 WHERE id = 2; COMMIT;
> ```
> ```sql
> BEGIN;
> UPDATE accounts SET balance = balance - 50 WHERE id = 1;
> UPDATE accounts SET balance = balance + 50 WHERE id = 2;
> COMMIT;
> ```
>
> **Explanation:** Enclosing updates in `BEGIN...COMMIT` guarantees atomic all-or-nothing execution.

## 7. Related Terms
- [Transaction](transaction.md) — - The parent unit of work.
- [MVCC (Multi-Version Concurrency Control)](mvcc.md) — The mechanism enforcing Isolation in Postgres.
- [WAL (Write-Ahead Log)](../level_10/wal.md) — Related concept: WAL (Write-Ahead Log).
---

## 8. Key Takeaways
- ACID represents the four core guarantees of transactional databases.
- Atomicity guarantees "All-or-Nothing" transaction executions.
- Consistency ensures the database only saves data that satisfies all schema rules.
- Isolation prevents concurrent transactions from seeing each other's uncommitted data.
- Durability guarantees that committed data survives server power crashes.
- Relational databases (like Postgres) use WAL and locks to enforce ACID.
