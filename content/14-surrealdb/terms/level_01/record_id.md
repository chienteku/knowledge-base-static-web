# Record ID (`table:id`)

> **Level 1 — What Is SurrealDB?**
> The unique identifier format in SurrealDB where a record's address fuses the table name and a unique ID string using a colon separator (e.g., `user:john`), serving as a first-class data type that enables direct data references without standard foreign keys.

---

## 1. Prerequisites

- [Record](record.md) — The fundamental unit identified.
- [Table](table.md) — The collection namespace.

---

## 2. Term Category


**Core Concept (table-scoped record identifier syntax)**: - **Database Structure / Paradigm**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Record ID Generation Strategy Matrix

**Scenario:**
You are designing an e-commerce platform schema and must choose appropriate SurrealDB record ID generation strategies for different table types based on performance and audit requirements.

**Requirements:**
1. Choose an ID strategy for deterministic string-based user lookups (`user:john`).
2. Choose an ID strategy for high-throughput time-ordered transaction logs (`ulid()`).
3. Choose an ID strategy for cryptographically random session tokens (`rand::uuid()`).
4. Choose an ID strategy for complex composite product SKUs (`product:['electronics', 'laptop', 101]`).

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- 1. Deterministic String ID
> CREATE user:john SET name = "John Doe";
> 
> -- 2. ULID (Time-ordered, unique)
> CREATE log:ulid() SET event = "login_success";
> 
> -- 3. UUID (Cryptographically random)
> CREATE session:rand::uuid() SET user = user:john;
> 
> -- 4. Complex Array Composite ID
> CREATE product:['electronics', 'laptop', 101] SET stock = 50;
> ```
>
> #### Technical Explanation
>
> 1. Deterministic string IDs allow instant primary key lookup without secondary unique indexes.
> 2. `ulid()` generates lexicographically sortable, time-prefixed 128-bit IDs ideal for sequential B-tree/LSM insertions.
> 3. Composite array IDs `[category, type, sku]` allow multi-part primary keys natively in SurrealDB.

---

### Exercise 2: Special Character String ID Escaping

**Scenario:**
A system migration script imports legacy records containing email addresses and special characters as record IDs (e.g. `user:john.doe@example.com`).

**Requirements:**
1. Write the correctly escaped SurrealQL record ID syntax for an email identifier.
2. Demonstrate querying the record using bracket `⟨ ⟩` escaping syntax.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Record ID creation with bracket escaping
> CREATE user:⟨john.doe@example.com⟩ SET active = true;
> 
> -- Record lookup
> SELECT * FROM user:⟨john.doe@example.com⟩;
> ```
>
> #### Technical Explanation
>
> 1. Record IDs containing special characters (`@`, `.`, `-`) require bracket escaping `⟨...⟩` or string literals `user:'john.doe@example.com'`.
> 2. Unescaped special characters cause SurrealQL parser errors.
> 3. Bracket escaping allows any valid UTF-8 string to serve as a primary key.

---

### Exercise 3: Record ID Type Matching and Comparison

**Scenario:**
A developer is writing a query filter comparing record link pointers. They want to ensure they pass a typed record ID rather than a raw string.

**Requirements:**
1. Write a query creating a blog post `post:1` linked to `user:alice`.
2. Write a `SELECT` query searching for posts where `author = user:alice`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET name = "Alice";
> CREATE post:1 SET title = "SurrealDB Record IDs", author = user:alice;
> 
> -- Correct record ID pointer comparison
> SELECT * FROM post WHERE author = user:alice;
> ```
>
> #### Technical Explanation
>
> 1. `user:alice` is a typed `record` ID value in SurrealDB, not a string literal `"user:alice"`.
> 2. Comparing `author = "user:alice"` fails because typed record IDs do not equal raw strings.
> 3. Native record ID matching enables $O(1)$ pointer index resolution.

---



## 6. Related Terms

- [Record](record.md) — The fundamental unit identified.
- [Table](table.md) — The collection namespace.
- [Data Types (Overview)](../level_02/data_types.md) — Related concept: Data Types (Overview).
- [ID Generation Strategies (`ulid()`, `uuid()`, `rand::*`, String, Numeric)](../level_02/id_generation.md) — Related concept: ID Generation Strategies (`ulid()`, `uuid()`, `rand::*`, String, Numeric).
- [`record` (Record Link Type)](../level_02/record_link_type.md) — Related concept: `record` (Record Link Type).
- [Type Functions (`type::*`)](../level_06/type_functions.md) — Related concept: Type Functions (`type::*`).

---

## 7. Key Takeaways
- Record IDs fuse the table name and unique ID value (e.g., `table:id`).
- Fused IDs serve as a first-class `record` data type, not standard strings.
- Eliminates the need for separate ID columns and table namespace arguments.
- Supports custom text strings, UUIDs, ULIDs, and numerical IDs.
- Storing a Record ID in a field automatically creates a validated record link.
- Query individual records directly using `SELECT * FROM table:id`.
- Do not wrap Record IDs in quotes inside SurrealQL query filters.
