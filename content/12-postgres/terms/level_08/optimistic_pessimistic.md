# Optimistic vs. Pessimistic Locking

> **Level 8 — Transactions, Concurrency & Data Integrity**
> The two primary design strategies for handling multi-user write conflicts: preventing conflicts by locking upfront (`Pessimistic`) versus allowing free edits and validating consistency at the moment of saving (`Optimistic`).

---

## 1. Prerequisites
- [Locking (Row-level, Table-level)](locking.md) — The locking basics.
- [`SELECT ... FOR UPDATE`](select_for_update.md) — The SQL tool for pessimistic locking.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Pessimistic locking relies on built-in database row locks. Optimistic locking is implemented at the application code layer using version columns).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Strategy Selection

**Problem:** Choose the correct locking strategy (**Optimistic** or **Pessimistic**) for the following application features:
1.  A blog post edit screen where writers draft updates.
2.  An inventory warehouse system where robots check out physical boxes from shelves.
3.  A user settings page to change profile avatars.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Optimistic Locking: Writing a blog post takes minutes. Locking the database during drafting would block other processes. If two editors write simultaneously, show a merge warning.
> 2. Pessimistic Locking: Warehouse checkout is a high-conflict machine process. You must lock the shelf box immediately to prevent two robots from grabbing the same physical box.
> 3. Optimistic Locking: Setting adjustments are low-conflict. Two users changing an avatar at the same millisecond is rare, so version validation at save is sufficient.
> ```
> - Identify if the task involves human editing delays.
> - Evaluate the cost and frequency of concurrent conflicts.

---



### Exercise 2: Optimistic Locking Update Pattern

**Problem:** Write SQL statement implementing optimistic locking update on `products` checking `version = 3`.

**Expected output:**
> [!check]- Answer
> ```text
> UPDATE products SET price = 29.99, version = version + 1 WHERE id = 1 AND version = 3;
> ```
> ```sql
> UPDATE products
> SET price = 29.99, version = version + 1
> WHERE id = 1 AND version = 3;
> ```
>
> **Explanation:** Optimistic locking fails safely if `version` was mutated by another concurrent request.

---

### Exercise 3: Optimistic vs Pessimistic Locking Choice

**Problem:** Select locking strategy: 1. Low contention web applications (Optimistic Locking); 2. High contention automated financial queue processing (Pessimistic Locking `SELECT FOR UPDATE`).

**Expected output:**
> [!check]- Answer
> ```text
> 1. Optimistic Locking, 2. Pessimistic Locking
> ```
> ```text
> 1. Optimistic Locking, 2. Pessimistic Locking
> ```
>
> **Explanation:** Choose locking strategies based on collision frequency and transaction duration.

## 7. Related Terms
- [Locking (Row-level, Table-level)](locking.md) — The locking basics.
- [`SELECT ... FOR UPDATE`](select_for_update.md) -- Pessimistic implementation.

---

## 8. Key Takeaways
- Pessimistic locking prevents conflicts by locking data upfront before modifications.
- Optimistic locking allows concurrent edits and validates versions at save time.
- Pessimistic uses `SELECT ... FOR UPDATE`; locks rows and can block traffic.
- Optimistic uses a version column check; lock-free, preventing deadlocks.
- Use Pessimistic for fast machine writes (checkouts, balances).
- Use Optimistic for human-interaction edits (documents, profile settings).
