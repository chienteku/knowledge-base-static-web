# `UNIQUE` Index

> **Level 4 — Schema Definition & Constraints**
> The index modifier in SurrealDB that enforces data uniqueness constraints, preventing duplicate values from being inserted into specified columns or paths across a table.

---

## 1. Prerequisites
- [DEFINE INDEX](define_index.md) — The parent index context.

---

## 2. Term Category


**Performance / Operations (unique value constraint index)**: - **Database Structure / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Certain data points in an application must be globally unique within the system:
-   **Security Credentials:** No two users can register with the same `email` address.
-   **Logins:** No two users can claim the same `username`.
-   **Identifiers:** A `tax_id` must be unique to a single company.

If you don't enforce this at the database layer:
-   A race condition in your application code could allow two users to register the same username simultaneously.
-   This leads to corrupted session auth tokens and security breaches.

In SQL, you write `CREATE UNIQUE INDEX`. 

In MongoDB, you call `createIndex({ email: 1 }, { unique: true })`.

We designed the **`UNIQUE`** index modifier in SurrealQL to guarantee this integrity. 

By appending `UNIQUE` to your index definition, you instruct the database engine to reject any insert or update query that would result in duplicate values, acting as a final shield against data corruption.

---

### (2) Composite Uniqueness
You can enforce unique combinations across multiple columns:
`DEFINE INDEX unique_full_name ON user COLUMNS name.first, name.last UNIQUE;`
-   *Rule:* Two users can be named "John", and two can be named "Smith". However, you cannot have two users named "John Smith".

---

### (3) Reality Metaphor (Hotel Room Bookings)
Imagine booking rooms in a hotel:
-   **Standard Index:** A hotel key drawer. Multiple keys might be tagged with room "101" by mistake. (Duplicates allowed, causing sorting errors).
-   **`UNIQUE` Index:** The **Hotel Booking System Grid**. 
    -   Once room "101" is assigned to a guest for Tuesday night, the slot is locked. 
    -   If another receptionist tries to book room "101" for a different guest on the same night, the system flashes red, sounds an alarm, and blocks the booking. (Guarantees exclusivity).

---

### (4) Code Examples

#### Enforcing Uniqueness in SurrealQL
Let's build a secure user directory schema:

```sql
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD email ON user TYPE string;

-- 1. Define a unique index on the email column
DEFINE INDEX user_email ON user COLUMNS email UNIQUE;

-- 2. Insert the first user (Succeeds!)
CREATE user:alice SET email = "alice@example.com";

-- 3. Attempt to insert a second user with the same email (FAILS!)
CREATE user:bob SET email = "alice@example.com";
-- Error: "Database index/validation error: Unique index constraint violation..."
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to create a unique index on a table that already contains duplicate values, causing the index generation to fail and abort

**The mistake:** Running `DEFINE INDEX user_email ON user COLUMNS email UNIQUE;` on a database table that already stores two different users sharing the email `"test@mail.com"`.

**Why it's wrong:** When you define a unique index, SurrealDB scans the existing table data to build the index tree. 

If it detects duplicate values, the build process crashes with a unique constraint violation error, leaving the index uncreated.

**Fix: Clean up or merge duplicate records in your database tables before running unique index schema definitions.**

---



### Mistake 2: Creating `UNIQUE` Indexes on Fields Containing Duplicate Nullish `NONE` Values in Non-Sparse Indexes

**The mistake:** Creating a `UNIQUE` index on an optional field where multiple records have `NONE` or `NULL` values.

**Why it's wrong:** In non-sparse unique indexes, multiple `NULL` or `NONE` values collide as duplicate entries, throwing constraint violation errors when inserting a second record with no value.

*Incorrect:*
```surrealql
DEFINE FIELD code ON TABLE user TYPE option<string>;
DEFINE INDEX code_idx ON TABLE user FIELDS code UNIQUE; // ❌ Collides on multiple NONE values!
```

*Fix:*
```surrealql
DEFINE FIELD code ON TABLE user TYPE option<string>;
-- Use conditional index or handle unique non-none values
```

### Mistake 3: Ignoring Unique Constraint Violations in Bulk Import Pipelines

**The mistake:** Running bulk `CREATE` or `INSERT` statements without handling unique index collision errors.

**Why it's wrong:** Unique index violations abort un-handled bulk insert transactions.

*Incorrect:*
```surrealql
INSERT INTO user [ { email: "a@b.com" }, { email: "a@b.com" } ]; // ❌ Aborts batch!
```

*Fix:*
```surrealql
INSERT INTO user [ { email: "a@b.com" } ] ON DUPLICATE KEY UPDATE email = $input.email;
```

## 5. Practice Exercises

### Exercise 1: Defining Single-Column Unique Indexes

**Scenario:**
Ensure no two users can register with the same `username` in table `user`.

**Requirements:**
1. Write `DEFINE INDEX user_username ON TABLE user COLUMNS username UNIQUE`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE user SCHEMAFULL;
> DEFINE FIELD username ON TABLE user TYPE string;
> 
> DEFINE INDEX user_username ON TABLE user COLUMNS username UNIQUE;
> ```
>
> #### Technical Explanation
>
> 1. `UNIQUE` index constraints enforce uniqueness at write time.
> 2. Aborts write transactions attempting to insert duplicate indexed values.
> 3. Accelerates single-record lookups.

---

### Exercise 2: Defining Multi-Column Unique Indexes

**Scenario:**
Enforce that a product SKU is unique within each `vendor` in table `product`.

**Requirements:**
1. Write `DEFINE INDEX product_vendor_sku ON TABLE product COLUMNS vendor, sku UNIQUE`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE INDEX product_vendor_sku ON TABLE product COLUMNS vendor, sku UNIQUE;
> ```
>
> #### Technical Explanation
>
> 1. Multi-column unique indexes enforce uniqueness across field combinations.
> 2. Permits duplicate SKUs across different vendors, but blocks duplicates for the same vendor.
> 3. Implements complex uniqueness invariants declaratively.

---

### Exercise 3: Handling Unique Constraint Violations

**Scenario:**
Attempt to insert a duplicate username and capture the unique index violation error.

**Requirements:**
1. Insert `user:u1` with `username = "alice"`.
2. Attempt inserting `user:u2` with `username = "alice"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:u1 SET username = "alice";
> 
> -- Fails with unique index conflict error!
> CREATE user:u2 SET username = "alice";
> ```
>
> #### Technical Explanation
>
> 1. Rejects duplicate insertion attempts with an index conflict exception.
> 2. Guarantees data integrity under high-concurrency writes.
> 3. Eliminates race conditions in registration endpoints.

---



## 6. Related Terms
- [DEFINE INDEX](define_index.md) — The parent index context.
- [Idempotent Migration Scripts](idempotent_migrations.md) — Defining schemas safely.

---

## 7. Key Takeaways
- A `UNIQUE` index blocks duplicate values from being written to a table.
- Relational equivalent to unique constraints; NoSQL equivalent to unique indexes.
- Prevents database collisions and data duplication at the storage layer.
- Composite unique indexes enforce unique combinations of multiple fields.
- Attempting to index columns containing duplicate values will fail.
- Unique index failures roll back write transactions automatically.
- Essential for securing emails, usernames, and transaction IDs.
