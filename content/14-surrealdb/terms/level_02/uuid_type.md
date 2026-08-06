# `uuid`

> **Level 2 — Data Types & Record Structure**
> The primitive data type in SurrealDB that stores 128-bit Universally Unique Identifiers (UUIDs) natively, providing efficient storage and indexing of unique hashes.

---

## 1. Prerequisites

- [Data Types (Overview)](data_types.md) — The parent type system.

---

## 2. Term Category


**Data Type (universally unique identifier type)**: - **Database Structure / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern web applications, you need unique identifiers that cannot be guessed:
-   If you use sequential IDs (like order `1`, `2`, `3`), an attacker can guess IDs and download other users' invoices.
-   If you run a distributed database, sequential IDs trigger sync collisions because two nodes might write order `4` simultaneously.

To solve this, developers use **UUIDs (Universally Unique Identifiers)**: 128-bit numbers that are globally unique.

In PostgreSQL, UUIDs are supported natively. 

In MongoDB, they are often saved as binary strings (`BinData`), which are difficult to read in shell consoles.

We designed the native **`uuid`** data type in SurrealDB to provide first-class support. 

It stores UUID values as efficient 16-byte binary blocks on disk, keeping index sizes small. 

At the same time, it prints them in standard readable text formats in queries and provides built-in generation functions (like `rand::uuid()`), simplifying ID management.

---

### (2) Built-In Generation
SurrealDB provides standard functions to handle UUIDs:
-   **`rand::uuid()`:** Generates a new cryptographically random UUID (Version 4).
-   **Explicit Casting:** You can convert a valid UUID string into a native `uuid` type using the `<uuid>` casting operator: `<uuid> "b1a457f9-8c2d-4f10-b67c-5a1248cf9af4"`.

---

### (3) Reality Metaphor (Global Barcode Stickers)
Imagine tagging shipping containers:
-   **Sequential IDs:** Writing numbers `1`, `2`, `3` with a marker. It is easy, but if another warehouse uses the same numbers, the tracking system breaks during mergers.
-   **`uuid` Type:** Stamping every container with a **Global Barcode Sticker**. 
    -   The barcode has a complex, 128-bit pattern of lines. 
    -   No other container in any port worldwide will ever have the exact same barcode. 
    -   It doesn't represent date or location; it simply guarantees the item is unique.

---

### (4) Code Examples

#### Creating and Using UUID Fields
Let's model a device token registration schema:

```sql
DEFINE TABLE device SCHEMAFULL;

-- 1. Enforce UUID type
DEFINE FIELD device_id ON device TYPE uuid;
DEFINE FIELD token ON device TYPE string;

-- 2. Insert records using built-in generator functions
CREATE device SET
  device_id = rand::uuid(), // Generates a random v4 UUID
  token = "some_apns_token";

-- 3. Query using a UUID literal (SurrealDB parses it as uuid type!)
SELECT * FROM device WHERE device_id = <uuid> "b1a457f9-8c2d-4f10-b67c-5a1248cf9af4";
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing UUID values as standard text strings, wasting index storage and CPU RAM cache space

**The mistake:** Defining a UUID tracking field as `TYPE string` and saving the 36-character string representation into it.

**Why it's wrong:** Storing a UUID as a string takes 36 bytes of storage space (one byte per character). 

Declaring it as `TYPE uuid` tells the database to store it as a compressed 16-byte binary block. 

Under millions of records, using strings increases your index storage footprint by over 100%, causing index scans to consume more server memory.

**Fix: Always define unique hash fields as `TYPE uuid` to trigger binary storage compression.**

---



### Mistake 2: Storing UUIDs as Plain Text Strings instead of Native UUID Primitives

**The mistake:** Storing `"f47ac10b-58cc-4372-a567-0e02b2c3d479"` in fields defined as `TYPE string`.

**Why it's wrong:** Plain strings occupy 36 bytes of text storage. Native `TYPE uuid` stores UUIDs in binary 16-byte format, saving storage and indexing space.

*Incorrect:*
```surrealql
DEFINE FIELD id_code ON TABLE log TYPE string; // ❌ 36 bytes text overhead
```

*Fix:*
```surrealql
DEFINE FIELD id_code ON TABLE log TYPE uuid; // Efficient 16-byte binary UUID
```

### Mistake 3: Passing Invalid UUID Formatting Strings to `<uuid>` Casts

**The mistake:** Casting `<uuid> "invalid-uuid-string"`.

**Why it's wrong:** SurrealDB validates 8-4-4-4-12 hex formatting. Passing invalid strings throws a casting error.

*Incorrect:*
```surrealql
RETURN <uuid> "12345"; // ❌ Invalid UUID string format
```

*Fix:*
```surrealql
RETURN <uuid> "f47ac10b-58cc-4372-a567-0e02b2c3d479"; // Valid 36-char UUID string
```

## 5. Practice Exercises

### Exercise 1: UUID Field Definition and Generation

**Scenario:**
A microservice architecture requires globally unique UUID identifiers for distributed order tracking.

**Requirements:**
1. Define table `orders` in `SCHEMAFULL` mode.
2. Define field `tracking_id` as `uuid` defaulting to `rand::uuid()`.
3. Create an order record `orders:o1`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE orders SCHEMAFULL;
> DEFINE FIELD tracking_id ON TABLE orders TYPE uuid DEFAULT rand::uuid();
> 
> CREATE orders:o1 SET amount = 250.00dec;
> 
> SELECT * FROM orders:o1;
> ```
>
> #### Technical Explanation
>
> 1. `TYPE uuid` restricts field values strictly to valid 128-bit UUID bytes/strings.
> 2. `rand::uuid()` generates cryptographically random UUID v4 values automatically.
> 3. Guarantees global identifier uniqueness across distributed database clusters.
> 
---

### Exercise 2: UUID Record Primary Key Creation

**Scenario:**
Create a record in table `session` where the primary key itself is a generated UUID (`session:uuid()`).

**Requirements:**
1. Write the `CREATE` statement using `session:uuid()`.
2. Inspect the returned primary key.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE session:uuid() SET user = user:alice, logged_in = time::now();
> ```
>
> #### Technical Explanation
>
> 1. `session:uuid()` uses SurrealDB's built-in UUID primary key generator function.
> 2. Generates record IDs in the format `session:u'018c4e6a-7b3f-7123-89ab-cdef01234567'`.
> 3. Provides unique, unguessable primary keys for sensitive authentication sessions.
> 
---

### Exercise 3: Parsing and Validating UUID Strings

**Scenario:**
Verify whether a given string is a valid UUID before storing it in a `uuid` field using `is::uuid()`.

**Requirements:**
1. Test validity of string `"018c4e6a-7b3f-7123-89ab-cdef01234567"` using `string::is::uuid()`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT string::is::uuid("018c4e6a-7b3f-7123-89ab-cdef01234567") AS valid_uuid;
> -- Output: { valid_uuid: true }
> ```
>
> #### Technical Explanation
>
> 1. `string::is::uuid(str)` validates whether a string matches standard 36-character UUID formatting.
> 2. Used inside field `ASSERT` clauses to sanitize incoming string parameters.
> 3. Prevents invalid UUID strings from reaching application logic.
> 
---



## 6. Related Terms

- [Data Types (Overview)](data_types.md) — The parent type system.
- [ID Generation Strategies (`ulid()`, `uuid()`, `rand::*`, String, Numeric)](id_generation.md) — Generating Record IDs.

---

## 7. Key Takeaways
- The `uuid` type stores 128-bit Universally Unique Identifiers natively.
- Direct NoSQL equivalent to PostgreSQL's native `UUID` column type.
- Stored as a compressed 16-byte binary block on disk, saving index space.
- Displayed as a standard 36-character readable string in query results.
- Generate random UUIDs using the built-in function `rand::uuid()`.
- Convert string inputs to UUIDs using the `<uuid>` explicit casting operator.
- Avoid storing UUID hashes in `string` fields to prevent index bloat.
