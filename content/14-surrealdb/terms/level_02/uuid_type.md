# `uuid`

> **Level 2 — Data Types & Record Structure**
> The primitive data type in SurrealDB that stores 128-bit Universally Unique Identifiers (UUIDs) natively, providing efficient storage and indexing of unique hashes.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — The parent type system.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Stored internally as a 16-byte binary block, optimizing storage footprint compared to standard 36-character string representations).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: UUID Query Formatting

**Problem:** You are writing a query to search for a user by their tracking UUID. 
Explain the difference in execution behavior between these two SurrealQL queries:
1.  `SELECT * FROM user WHERE tracking_id = "d3b07384-d113-11e7-8beb-6814015c7e11";`
2.  `SELECT * FROM user WHERE tracking_id = <uuid> "d3b07384-d113-11e7-8beb-6814015c7e11";`
Assume `tracking_id` is defined as `TYPE uuid` on the table.

**Expected output:**
```text
- Query 1 will fail or return no results because `"d3b0... "` is a string type, which does not match the binary `uuid` type stored in `tracking_id`.
- Query 2 will succeed because the `<uuid>` casting operator converts the string literal into a native `uuid` type, allowing a binary comparison.
```

> [!check]- Answer
> - Check the type conversion operators in SurrealQL.
> - Consider if type mismatch filters block matches on schema-full tables.

---



### Exercise 2: Generating UUID v4 Values

**Problem:** Generate a new UUID v4 using `rand::uuid::v4()` or `rand::uuid()`.

**Expected output:**
```text
rand::uuid::v4()
```

> [!check]- Answer
> ```surrealql
> RETURN rand::uuid::v4();
> ```
>
> **Explanation:** `rand::uuid::v4()` generates random UUID v4 values.

### Exercise 3: UUID Field Schema Definition

**Problem:** Define field `session_id` on `user` table as native `TYPE uuid`.

**Expected output:**
```text
DEFINE FIELD session_id ON TABLE user TYPE uuid;
```

> [!check]- Answer
> ```surrealql
> DEFINE FIELD session_id ON TABLE user TYPE uuid;
> ```
>
> **Explanation:** `TYPE uuid` enforces binary 16-byte UUID field validation.

## 7. Related Terms
- [Data Types (Overview)](data_types.md) — The parent type system.
- [ID Generation Strategies](id_generation.md) — Generating Record IDs.

---

## 8. Key Takeaways
- The `uuid` type stores 128-bit Universally Unique Identifiers natively.
- Direct NoSQL equivalent to PostgreSQL's native `UUID` column type.
- Stored as a compressed 16-byte binary block on disk, saving index space.
- Displayed as a standard 36-character readable string in query results.
- Generate random UUIDs using the built-in function `rand::uuid()`.
- Convert string inputs to UUIDs using the `<uuid>` explicit casting operator.
- Avoid storing UUID hashes in `string` fields to prevent index bloat.
