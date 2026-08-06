# Unique Index

> **Level 7 — Indexes, Full-Text Search & Performance**
> The index constraint modifier in SurrealDB (`DEFINE INDEX ... UNIQUE`) that enforces global data uniqueness across one or more fields, preventing duplicate entries at the database storage layer.

---

## 1. Prerequisites

- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The parent index context.
- [Assertions (`ASSERT`)](../level_04/field_assertions.md) — Field-level validation rules.

---

## 2. Term Category


**Performance / Operations (unique value constraint index)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Certain properties in an application must never contain duplicate values:
- User email addresses, usernames, and national tax IDs.
- External payment transaction IDs and OAuth provider identifiers.

If uniqueness is only enforced in application code (e.g. checking `SELECT * FROM user WHERE email = $email` before inserting), concurrent web requests can trigger race conditions, allowing two identical emails to be created simultaneously.

In SQL (PostgreSQL), developers create `UNIQUE` indexes. In MongoDB, developers set `{ unique: true }`.

We designed **Unique Indexes** in SurrealDB to provide strict storage-level uniqueness guarantees. By appending `UNIQUE` to a `DEFINE INDEX` statement, SurrealDB locks the value inside the B-Tree index structure. Any write attempt that introduces a duplicate value is automatically blocked, rolling back the transaction and keeping data clean.

---

### (2) Single-Column vs. Composite Uniqueness
- **Single-Column Unique Index:** Enforces uniqueness on one field across all table records (e.g. `COLUMNS email UNIQUE`).
- **Composite Unique Index:** Enforces uniqueness on the **combination** of multiple fields (e.g. `COLUMNS tenant_id, username UNIQUE`).

---

### (3) Reality Metaphor (The Serial Number Registry)
Imagine manufacturing electronic devices:
- **Non-Unique Index:** A barcode sticker printed on a box. Multiple boxes might accidentally receive the same barcode.
- **Unique Index (`UNIQUE`):** A **National Serial Number Registry**.
  - Before a new device is stamped with a serial number, the machine checks the master registry database.
  - If the serial number already exists, the machine refuses to stamp the device, ejects the un-stamped item, and sounds a warning chime.

---

### (4) Code Examples

#### Enforcing Unique Indexes in SurrealQL

```sql
DEFINE TABLE account SCHEMAFULL;
DEFINE FIELD email ON account TYPE string;
DEFINE FIELD tenant ON account TYPE record<tenant>;
DEFINE FIELD username ON account TYPE string;

-- 1. Single-column unique index (Global email uniqueness)
DEFINE INDEX idx_account_email ON account COLUMNS email UNIQUE;

-- 2. Composite unique index (Username must be unique WITHIN a tenant)
DEFINE INDEX idx_tenant_username ON account COLUMNS tenant, username UNIQUE;

-- 3. Testing uniqueness enforcement
CREATE account SET email = "alice@example.com", tenant = tenant:firm_a, username = "alice";

-- FAILS (Duplicate email globally!):
CREATE account SET email = "alice@example.com", tenant = tenant:firm_b, username = "alice2";
-- Error: "Database index/validation error: Unique index constraint violation..."
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to define a unique index on a table that already contains duplicate records

**The mistake:** Running `DEFINE INDEX idx_email ON user COLUMNS email UNIQUE;` on an existing table that already stores two users with `"alice@example.com"`.

**Why it's wrong:** SurrealDB scans existing records when building the index. Finding duplicate entries causes the index creation process to crash and fail.

**Fix: Clean up or deduplicate existing table records prior to applying the unique index definition:**

```sql
-- Remove duplicates first, then apply unique index
DEFINE INDEX idx_email ON user COLUMNS email UNIQUE;
```

---



### Mistake 2: Creating `UNIQUE` Indexes on Optional Fields Containing Multiple `NONE` Values

**The mistake:** Creating a `UNIQUE` index on an optional field where multiple records have `NONE` values.

**Why it's wrong:** Multiple `NONE` values collide in non-sparse unique indexes, raising a duplicate value constraint violation error on inserting a second record with no value.

*Incorrect:*
```surrealql
DEFINE FIELD sku ON TABLE product TYPE option<string>;
DEFINE INDEX sku_idx ON TABLE product FIELDS sku UNIQUE; // ❌ Collides on multiple NONE values!
```

*Fix:*
```surrealql
DEFINE FIELD sku ON TABLE product TYPE option<string>;
-- Handle unique non-none values
```

### Mistake 3: Ignoring Unique Constraint Violation Errors in Bulk Imports

**The mistake:** Executing bulk `INSERT` statements without duplicate handling.

**Why it's wrong:** A single unique index violation aborts the entire bulk insert transaction. Use `ON DUPLICATE KEY UPDATE`.

*Incorrect:*
```surrealql
INSERT INTO user [ { email: "a@b.com" }, { email: "a@b.com" } ]; // ❌ Aborts transaction!
```

*Fix:*
```surrealql
INSERT INTO user [ { email: "a@b.com" } ] ON DUPLICATE KEY UPDATE email = $input.email;
```

## 5. Practice Exercises

### Exercise 1: Single-Column Unique Index Definition

**Scenario:**
Enforce that no two users can share the same `email` address in table `user`.

**Requirements:**
1. Define index `idx_unique_email ON TABLE user COLUMNS email UNIQUE`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE user SCHEMAFULL;
> DEFINE FIELD email ON TABLE user TYPE string;
> 
> DEFINE INDEX idx_unique_email ON TABLE user COLUMNS email UNIQUE;
> ```
>
> #### Technical Explanation
>
> 1. `UNIQUE` index constraints enforce uniqueness at write time.
> 2. Aborts write transactions attempting to insert duplicate indexed values.
> 3. Accelerates single-record lookups.

---

### Exercise 2: Multi-Column Unique Index Constraints

**Scenario:**
Enforce that a product SKU is unique within each `vendor` in table `product`.

**Requirements:**
1. Write `DEFINE INDEX idx_unique_vendor_sku ON TABLE product COLUMNS vendor, sku UNIQUE`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE INDEX idx_unique_vendor_sku ON TABLE product COLUMNS vendor, sku UNIQUE;
> ```
>
> #### Technical Explanation
>
> 1. Multi-column unique indexes enforce uniqueness across field combinations.
> 2. Permits duplicate SKUs across different vendors, but blocks duplicates for the same vendor.
> 3. Implements complex uniqueness invariants declaratively.

---

### Exercise 3: Unique Index Conflict Exception Handling

**Scenario:**
Attempt to insert a duplicate email address and capture the unique index violation error.

**Requirements:**
1. Insert `user:u1` with `email = "alice@example.com"`.
2. Attempt inserting `user:u2` with `email = "alice@example.com"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:u1 SET email = "alice@example.com";
> 
> -- Fails with unique index conflict error!
> CREATE user:u2 SET email = "alice@example.com";
> ```
>
> #### Technical Explanation
>
> 1. Rejects duplicate insertion attempts with an index conflict exception.
> 2. Guarantees data integrity under high-concurrency writes.
> 3. Eliminates race conditions in registration endpoints.

---



## 6. Related Terms

- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The parent index context.
- [Composite Index](composite_index.md) — Multi-column indexes.

---

## 7. Key Takeaways
- `UNIQUE` indexes block duplicate values at the database storage layer.
- Eliminates race-condition duplicate bugs during concurrent API requests.
- Single-column unique indexes guarantee global value uniqueness.
- Composite unique indexes guarantee unique combinations of multiple fields.
- Duplicate key collisions trigger automatic write transaction rollbacks.
