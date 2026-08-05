# `UUID` Type

> **Level 6 — Schema Design & Normalization**
> A 128-bit data type representing a Universally Unique Identifier, displayed as a 36-character hexadecimal string, commonly used as an alternative to sequential integer primary keys.

---

## 1. Prerequisites
- [Data Types (Overview)](../level_02/data_types.md) — The parent database typing system.
- [Natural Key vs. Surrogate Key](../level_05/natural_vs_surrogate_key.md) — Primary key design choices.
---

## 2. Term Category
- **PostgreSQL Data Type**

---

## 3. Environment Context
- **PostgreSQL Core** (Stored internally as highly optimized 16-byte raw binary blocks. Modern Postgres versions (13+) include the built-in `gen_random_uuid()` function without requiring external extensions).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In Level 2 (`serial_identity.md`), we learned to use sequential integers (like `1, 2, 3`) as surrogate primary keys. 

While fast and simple, sequential keys have three major drawbacks in modern web applications:

1.  **Security Leaks (ID Enumeration):** If a user registers and sees their profile URL is `company.com/users/45`, they can easily guess that user `46` and `44` exist. Malicious crawlers can write simple scripts to scrape your entire customer database by looping through integers.
2.  **Collisions in Distributed Systems:** If your application is massive and splits data across multiple database shards, Shard A and Shard B will both generate ID `105` for different users. Merging their data later causes key collisions.
3.  **Offline Key Generation:** A mobile app working offline cannot create new records because it doesn't know the "next" integer ID in the central database.

We designed the **`UUID`** (Universally Unique Identifier) type to solve this. 

A UUID is a 128-bit number generated randomly:
`a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`

The number of possible UUID combinations is so astronomically large ($2^{128}$ or $3.4 \times 10^{38}$) that you could generate billions of UUIDs every second for a century, and the chance of generating a duplicate is virtually zero. 

This allows you to generate keys anywhere, safely, without talking to a central coordinator.

---

### (2) The Performance Cost
UUIDs are not free:
-   **Size:** A standard `INTEGER` is 4 bytes. A `BIGINT` is 8 bytes. A `UUID` is **16 bytes**.
-   **Index Bloat:** Because UUIDs are random, they do not write sequentially to disk. Inserting rows forces the database to rearrange its B-Tree index structure continuously (index page splits), slowing down insert speeds on large tables.

---

### (3) Reality Metaphor
Imagine assigning license plates to cars:
-   **Integer ID:** A central department issues sequential numbers: `Plate 1`, `Plate 2`, `Plate 3`. If you want a plate, you must stand in line and ask the department for the next number.
-   **UUID:** The department tells everyone: *"Create a plate by choosing 36 random letters and numbers."* (A digital snowflake). You write it down yourself in your garage. You are guaranteed that no one else in the world will pick your exact sequence, saving you the trip to the licensing office.

---

### (4) Code Examples

#### Creating a UUID-Keyed Table
```sql
CREATE TABLE client_accounts (
  -- Automatically generate random v4 UUID on insert
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(100) NOT NULL
);

-- Insert records without specifying ID
INSERT INTO client_accounts (company_name) VALUES ('Acme Corp');
INSERT INTO client_accounts (company_name) VALUES ('Globex Corp');

SELECT * FROM client_accounts;
-- Output:
--                   id                  | company_name 
-- --------------------------------------+--------------
--  c0471b05-df3c-44bf-8e6d-639a6bb9a12c | Acme Corp
--  7b51f0c2-9e2e-4b45-a92c-55c3c0a5951d | Globex Corp
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using UUIDs blindly as primary keys for all tables in your database

**The mistake:** Using UUIDs for small, internal tables (like categories or logs) that are never exposed to the public.

**Why it's wrong:** As explained, UUIDs consume 16 bytes on disk and slow down index sorting. If you have multiple child tables joining on small lookup categories, using UUIDs bloats your foreign keys, consumes double the RAM, and slows down database join searches.

**Fix: Default to standard sequential integers (`INT GENERATED ALWAYS AS IDENTITY`) for internal lookup tables. Reserve UUIDs for public-facing tables (like users, orders, and tickets) where security and distributed generation are required.**

---



### Mistake 2: Storing UUIDs as Plain `VARCHAR(36)` Strings Instead of Native `UUID` Data Type

**The mistake:** Defining UUID primary key columns as `VARCHAR(36)` text columns.

**Why it's wrong:** Plain text `VARCHAR(36)` occupies 36 bytes per row! Native PostgreSQL `UUID` type occupies only 16 bytes (over 50% storage saving) and optimizes index comparisons.

*Incorrect:*
```sql
id VARCHAR(36) PRIMARY KEY -- ❌ Wastes 36 bytes per row!
```

*Fix:*
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid() -- Native 16-byte UUID
```

### Mistake 3: Using `uuid_generate_v4()` Without Enabling `ossp-uuid` Extension when Native `gen_random_uuid()` Exists

**The mistake:** Calling `uuid_generate_v4()` in PostgreSQL 13+ without installing `uuid-ossp` extension.

**Why it's wrong:** PostgreSQL 13+ includes built-in native function `gen_random_uuid()` without requiring external extensions.

*Incorrect:*
```sql
id UUID DEFAULT uuid_generate_v4() -- ❌ Error if extension missing!
```

*Fix:*
```sql
id UUID DEFAULT gen_random_uuid() -- Built-in native function in Postgres 13+
```

## 6. Practice Exercises

### Exercise 1: UUID Schema Migration

**Problem:** You are building a secure medical database. Write the SQL `CREATE TABLE` query for a table named `medical_records` containing:
1.  A primary key column `record_id` of type `UUID` that automatically generates random IDs on insert.
2.  A patient ID integer `patient_id` (required).
3.  A text column `diagnosis` (required).

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE TABLE medical_records (
>   record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>   patient_id INT NOT NULL,
>   diagnosis TEXT NOT NULL
> );
> ```
> - Use the `UUID` keyword for the data type.
> - Set the generator default using the built-in function `gen_random_uuid()`.

---



### Exercise 2: Generating UUID Primary Key

**Problem:** Create table `tokens` with UUID primary key defaulting to `gen_random_uuid()`.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE TABLE tokens ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), token_str TEXT NOT NULL );
> ```
> ```sql
> CREATE TABLE tokens (
>   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>   token_str TEXT NOT NULL
> );
> ```
>
> **Explanation:** `gen_random_uuid()` generates v4 cryptographically secure 128-bit UUIDs.

---

### Exercise 3: UUID Storage Size

**Problem:** What is the byte storage size of native PostgreSQL `UUID` data type? (16 bytes).

**Expected output:**
> [!check]- Answer
> ```text
> 16 bytes
> ```
> ```text
> 16 bytes
> ```
>
> **Explanation:** Native `UUID` stores 128 bits in 16 bytes of compact binary storage.

## 7. Related Terms
- [Data Types (Overview)](../level_02/data_types.md) — The parent typing standard.
- [Natural Key vs. Surrogate Key](../level_05/natural_vs_surrogate_key.md) — Key design patterns.
- [Extensions (`CREATE EXTENSION`)](../level_10/extensions.md) — Related concept: Extensions (`CREATE EXTENSION`).
---

## 8. Key Takeaways
- `UUID` stores a 128-bit universally unique, random hexadecimal identifier.
- Solves security leaks (enumeration attacks) by making IDs unpredictable.
- Enables safe, collision-free key generation across distributed database shards.
- Generated on the server using modern PostgreSQL's `gen_random_uuid()`.
- Wastes index RAM and slows insert speeds compared to integer keys.
- Use UUIDs for public entities; use integers for internal category tables.
