# Record ID (`table:id`)

> **Level 1 — What Is SurrealDB?**
> The unique identifier format in SurrealDB where a record's address fuses the table name and a unique ID string using a colon separator (e.g., `user:john`), serving as a first-class data type that enables direct data references without standard foreign keys.

---

## 1. Prerequisites
- [Record](record.md) — The fundamental unit identified.
- [Table](table.md) — The collection namespace.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Processed as a primitive data type `record` on the server. Used by client drivers to locate documents in the database indexing tree).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In other databases, unique identifiers are separate from table namespaces:
-   **PostgreSQL:** You define an `id` column. If a row has `id = 5`, you only know it is row 5 because you queried the `users` table. The value `5` itself has no context.
-   **MongoDB:** Every document has an `_id` field holding an `ObjectId` (like `ObjectId("60d...")`). The ID does not tell you which collection it belongs to.

If you store these references as foreign keys (e.g., saving `user_id = 5` inside an `orders` table), the database must perform a query search (JOIN) to connect the tables.

We designed the **Record ID (`table:id`)** to solve this mapping problem. 

In SurrealDB, the table name and the unique ID are **permanently fused** into a single value (such as `user:john` or `post:ulid()`). 

This fused ID is not a standard text string—it is a **First-Class Record Link Data Type**. 

Because the ID contains the table name, the database knows exactly where the document lives on disk. 

Storing `user:john` inside a post's `author` field creates a direct, validated relationship, allowing you to fetch the author's details instantly without JOIN queries.

---

### (2) The Record ID Formats
SurrealDB allows you to create record IDs in various formats depending on your needs:

-   **Human-Readable Strings:** `user:tobie`, `country:us` (excellent for static lookup records or clean developer testing).
-   **Time-Sortable Keys (ULID):** `post:ulid()` (generates a time-sortable random key like `post:01H7...` to keep indexes sorted by insertion order).
-   **Random Keys (UUID):** `user:uuid()` (generates a standard random UUID).
-   **Numbers:** `order:1001` (useful for sequential tracking).

---

### (3) Reality Metaphor (Locker Keys)
Imagine managing lockers in a sports club:
-   **PostgreSQL/MongoDB ID:** The physical locker key simply says **`45`**. 
    -   To open the locker, you must ask: *"Is this locker 45 in the Men's changing room, or locker 45 in the VIP locker room?"* (You must supply the table context).
-   **SurrealDB Record ID:** The key has the label permanently engraved: **`mens:45`** or **`vip:45`**. 
    -   The location and the locker number are fused. 
    -   You can walk directly to the correct room and open the locker without asking questions.

---

### (4) Code Examples

#### Creating Records with Different ID Formats
You define the ID directly after the table name during creation:

```sql
-- 1. Create a record with a human-readable text ID
CREATE user:tobie SET name = "Tobie";

-- 2. Create a record with a time-sortable ULID generator
-- (Generates something like post:01H5...)
CREATE post:ulid() SET title = "SurrealDB Release Notes";

-- 3. Create a record with a numerical ID
CREATE order:10055 SET total = 250.00;

-- 4. Query a specific record directly using its ID (no WHERE clause needed!)
SELECT * FROM user:tobie;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Treating a Record ID as a standard text string in query parameters or schema comparisons

**The mistake:** Writing a SurrealQL query like `SELECT * FROM user WHERE id = "user:john"` (quoting the ID as a string).

**Why it's wrong:** In SurrealDB, `user:john` is a primitive `record` data type, whereas `"user:john"` (with quotes) is a `string` data type. 

Because types do not match, the query evaluates to false and returns no records.

**Fix: Do not wrap Record IDs in quotes when writing SurrealQL queries. Write them as raw composite tokens:**

```sql
-- BAD
SELECT * FROM user WHERE id = "user:john";

-- GOOD: Raw record token
SELECT * FROM user:john;
-- OR
SELECT * FROM user WHERE id = user:john;
```

---



### Mistake 2: Quoting Record IDs as Plain Strings in SurrealQL Queries

**The mistake:** Writing `SELECT * FROM 'user:alice';` or `WHERE user = 'user:alice';` expecting record link matching.

**Why it's wrong:** Quoted `'user:alice'` is a plain string primitive! Unquoted `user:alice` or `r'user:alice'` is a structured Record ID. Comparing string to Record ID fails.

*Incorrect:*
```surrealql
-- Plain string lookup
SELECT * FROM user WHERE id = 'user:alice'; // ❌ String is not equal to Record ID!
```

*Fix:*
```surrealql
-- Structured Record ID lookup
SELECT * FROM user WHERE id = user:alice;
-- Or use explicit record casting: r'user:alice'
```

### Mistake 3: Using Special Characters in Custom Record ID Strings without Escaping

**The mistake:** Creating `user:alice@example.com` or `user:my-id` without bracket or backtick escaping.

**Why it's wrong:** Special characters like `@` or `-` in unescaped record IDs cause syntax parsing errors. Escape with brackets `user:[alice@example.com]` or `user:`my-id``.

*Incorrect:*
```surrealql
-- Syntax error due to un-escaped @ symbol
CREATE user:alice@example.com; // ❌ Parse error!
```

*Fix:*
```surrealql
-- Escaped complex record ID
CREATE user:`alice@example.com`;
-- Or bracket syntax
CREATE user:[alice@example.com];
```

## 6. Practice Exercises

### Exercise 1: ID Format Identification

**Problem:** You are auditing a database log. Identify the format strategy (e.g. **Custom String**, **ULID**, **UUID**, or **Numeric**) used for each Record ID:
1.  `product:88991`
2.  `user:01H7V4W0M5A5QY8K2W3B1Z6X9C`
3.  `customer:alice_smith`
4.  `session:b1a457f9-8c2d-4f10-b67c-5a1248cf9af4`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Numeric
> 2. ULID (Time-sortable random character string)
> 3. Custom String (Human-readable key)
> 4. UUID (Standard random hexadecimal hash)
> ```
> - Look for standard UUID hash patterns (dashes separating hex codes).
> - Analyze if the characters are human-readable words or random sorted codes.

---



### Exercise 2: Complex Escaped Record ID Creation

**Problem:** Create a record in `user` table using email `admin@domain.com` as record ID.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE user:[admin@domain.com] SET name = "Admin";
> ```
> ```surrealql
> CREATE user:[admin@domain.com] SET name = "Admin";
> ```
>
> **Explanation:** Brackets `[id]` allow arbitrary special characters inside Record IDs.

---

### Exercise 3: Built-in ID Generator Functions

**Problem:** Generate record IDs using `rand()`, `ulid()`, and `uuid()` in `CREATE user` statements.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE user:ulid(), CREATE user:uuid(), CREATE user:rand()
> ```
> ```surrealql
> CREATE user:ulid();
> CREATE user:uuid();
> CREATE user:rand();
> ```
>
> **Explanation:** Generator functions create cryptographically random, ULID, or UUID Record IDs.

## 7. Related Terms
- [Record](record.md) — The fundamental unit identified.
- [Table](table.md) — The collection namespace.

---

## 8. Key Takeaways
- Record IDs fuse the table name and unique ID value (e.g., `table:id`).
- Fused IDs serve as a first-class `record` data type, not standard strings.
- Eliminates the need for separate ID columns and table namespace arguments.
- Supports custom text strings, UUIDs, ULIDs, and numerical IDs.
- Storing a Record ID in a field automatically creates a validated record link.
- Query individual records directly using `SELECT * FROM table:id`.
- Do not wrap Record IDs in quotes inside SurrealQL query filters.
