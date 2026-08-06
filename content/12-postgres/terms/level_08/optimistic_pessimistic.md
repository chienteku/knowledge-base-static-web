# Optimistic vs. Pessimistic Locking

> **Level 8 — Transactions, Concurrency & Data Integrity**
> The two primary design strategies for handling multi-user write conflicts: preventing conflicts by locking upfront (`Pessimistic`) versus allowing free edits and validating consistency at the moment of saving (`Optimistic`).

---

## 1. Prerequisites
- [Locking (Row-level, Table-level)](locking.md) — The locking basics.
- [`SELECT ... FOR UPDATE`](select_for_update.md) — The SQL tool for pessimistic locking.

---

## 2. Term Category

**Core Concept** (Concurrency Control Strategies): Optimistic vs Pessimistic Concurrency Control compares version checking at commit time against explicit lock acquisition (`SELECT FOR UPDATE`) before modification.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Pessimistic locking relies on built-in database row locks. Optimistic locking is implemented at the application code layer using version columns).

### (1) Design Motivation — "Why did we design this?"
When building multi-user web applications (like e-commerce sites, wikis, or project managers), multiple users will inevitably try to edit the same record at the same time.

How should the application manage these conflicts? 

We have two primary design philosophies:

---

### (2) Pessimistic Locking (Lock Upfront)
**Philosophy:** *"Assume conflicts are highly likely to happen."*
-   **Strategy:** You lock the row immediately when you read it, blocking all other users from touching it until you finish your write.
-   **SQL Implementation:** `SELECT ... FOR UPDATE`.
-   **Best for:** Short, high-conflict operations where errors are expensive (e.g., flight seat bookings, bank balance transfers).
-   **Drawbacks:** Slows down concurrent traffic because users must wait in line. High risk of deadlocks.

---

### (3) Optimistic Locking (Verify at Save)
**Philosophy:** *"Assume conflicts are rare. Let everyone edit freely."*
-   **Strategy:** You do not lock anything when reading. Instead, you add a `version INT` column to your table. When saving, you check if the version is still the same as when you read it. If it changed, the update fails, and the application forces a retry.
-   **SQL Implementation:** `UPDATE ... WHERE id = 5 AND version = current_version;`.
-   **Best for:** Low-conflict systems, or operations involving human editing time (e.g., editing a wiki article page, updating user profile details).
-   **Benefits:** High concurrency, zero row locks, zero deadlock risk.

---

### (4) Reality Metaphor
Imagine booking a seat on a tour bus:
-   **Pessimistic:** You board the bus, place your backpack on a seat (the lock), and walk to the front to pay the driver. No one can touch that seat while you pay.
-   **Optimistic:** You pay the driver first, walk down the aisle, and hope the seat is still empty. If someone sat there first, you walk back to the driver, get a refund, and wait for the next bus (retry).

---

### (5) Code Examples

#### 1. Pessimistic Locking in SQL
```sql
BEGIN;
-- Lock the row immediately
SELECT price FROM products WHERE id = 12 FOR UPDATE;
-- Calculate new price and save
UPDATE products SET price = 45.00 WHERE id = 12;
COMMIT;
```

#### 2. Optimistic Locking in SQL & Application
First, read the data and keep track of the current version:

```sql
SELECT price, version FROM products WHERE id = 12;
-- Returns: price = 40.00, version = 5
```

Now, calculate the new price in your app backend. 

When saving, include the version in the `WHERE` filter and increment it:

```sql
UPDATE products 
SET price = 45.00, version = 6 
WHERE id = 12 AND version = 5; -- Checks if version is still 5!
```

-   **Success:** If another user hasn't edited the product, the version is still `5`. The query updates **1 row**.
-   **Conflict:** If another user updated it first, the database version is now `6`. Your query finds **0 matching rows** because `version = 5` is no longer true. Your app detects `0 rows updated`, rolls back, and asks the user to reload the page.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using pessimistic locking for human-input workflows

**The mistake:** Locking a wiki article row with `SELECT FOR UPDATE` when a user clicks "Edit," keeping the database transaction open while the user types in their browser.

**Why it's wrong:** Typing a document takes minutes. While the user is typing (or if they walk away to eat lunch), the database connection remains open, and the row lock is held active in Postgres. 

Other users trying to edit the same article or load statistics are blocked, filling up connection pools and crashing the server.

**Fix: For operations involving human delay, always use Optimistic Locking. For short, millisecond-fast machine writes (like financial checkouts), use Pessimistic Locking.**

---



### Mistake 2: Using Pessimistic Locking (`SELECT FOR UPDATE`) for Long Human UI Edit Sessions

**The mistake:** Acquiring `SELECT FOR UPDATE` when a user opens an edit form in a web browser.

**Why it's wrong:** Holding pessimistic row locks across web HTTP sessions keeps database connections open and blocks concurrent operations indefinitely! Use Optimistic Locking (`version` column) for web forms.

*Incorrect:*
```sql
// Holding SELECT FOR UPDATE while waiting for user browser form submission
```

*Fix:*
```sql
Use Optimistic Locking: UPDATE t SET val = 'new', version = version + 1 WHERE id = 1 AND version = 5;
```

### Mistake 3: Omitting Version Check Verification in Optimistic Locking Update Statements

**The mistake:** Executing `UPDATE products SET price = 100 WHERE id = 1;` without checking the `version` column.

**Why it's wrong:** Failing to check `WHERE version = expected_version` bypasses optimistic concurrency control entirely, causing concurrent edit overwrites.

*Incorrect:*
```sql
UPDATE products SET price = 100 WHERE id = 1; -- ❌ Missing version predicate check!
```

*Fix:*
```sql
UPDATE products SET price = 100, version = version + 1 WHERE id = 1 AND version = 5;
```

## 5. Practice Exercises

### Exercise 1: Implementing Optimistic Concurrency Control with Version Numbers

**Scenario:**
Implement Optimistic Concurrency Control on table `products` using a `version` integer column.

**Requirements:**
1. Execute `UPDATE products SET stock = stock - 1, version = version + 1 WHERE id = 1 AND version = $current_version`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- Application fetches row + version (e.g. version = 3)
> SELECT id, stock, version FROM products WHERE id = 1;
> 
> -- Application attempts write, checking version matches
> UPDATE products 
> SET stock = stock - 1, 
>     version = version + 1 
> WHERE id = 1 
>   AND version = 3 
> RETURNING id, version;
> ```
>
> #### Technical Explanation
>
> 1. Optimistic locking assumes concurrent conflicts are rare and avoids acquiring database locks during read phase.
> 2. If another transaction modified the row concurrently (`version` became 4), `UPDATE` matches 0 rows.
> 3. Application detects 0 updated rows and throws a concurrency conflict error.

---

### Exercise 2: Implementing Pessimistic Locking with `SELECT FOR UPDATE`

**Scenario:**
Implement Pessimistic Concurrency Control using `SELECT FOR UPDATE` to lock a row before updating stock.

**Requirements:**
1. Execute `SELECT ... FOR UPDATE` inside `BEGIN ... COMMIT`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> BEGIN;
> 
> -- Acquires explicit row lock immediately
> SELECT id, stock 
> FROM products 
> WHERE id = 1 
> FOR UPDATE;
> 
> UPDATE products 
> SET stock = stock - 1 
> WHERE id = 1;
> 
> COMMIT;
> ```
>
> #### Technical Explanation
>
> 1. Pessimistic locking assumes concurrent conflicts are likely and acquires an exclusive row lock at read time.
> 2. Other transactions attempting `SELECT FOR UPDATE` on the same row block until `COMMIT`.
> 3. Prevents lost update anomalies completely.

---

### Exercise 3: Trade-Off Analysis: Optimistic vs Pessimistic Locking

**Scenario:**
Formulate a technical selection matrix comparing Optimistic vs Pessimistic concurrency control.

**Requirements:**
1. Contrast lock duration, contention scalability, and implementation complexity.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Concurrency Control Selection Matrix:
> - Optimistic Control (Version Column): Zero DB lock duration, scales extremely well under high read/low update workloads (Web APIs), requires application retry logic.
> - Pessimistic Control (SELECT FOR UPDATE): Holds DB row locks during user thought time/API processing, causes connection blocking under high write contention, simple logic.
> Selection Rule: Use Optimistic for web APIs; use Pessimistic inside short database transactions for high-contention inventory.
> ```
>
> #### Technical Explanation
>
> 1. Optimistic control is ideal for stateless web servers where database transactions cannot remain open across HTTP requests.
> 2. Pessimistic control is ideal for short, high-contention backend transaction blocks (e.g. flash sales).
> 3. Align locking strategy with application architecture.

---



## 6. Related Terms
- [Locking (Row-level, Table-level)](locking.md) — The locking basics.
- [`SELECT ... FOR UPDATE`](select_for_update.md) — - Pessimistic implementation.

---

## 7. Key Takeaways
- Pessimistic locking prevents conflicts by locking data upfront before modifications.
- Optimistic locking allows concurrent edits and validates versions at save time.
- Pessimistic uses `SELECT ... FOR UPDATE`; locks rows and can block traffic.
- Optimistic uses a version column check; lock-free, preventing deadlocks.
- Use Pessimistic for fast machine writes (checkouts, balances).
- Use Optimistic for human-interaction edits (documents, profile settings).
