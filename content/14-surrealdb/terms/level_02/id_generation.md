# ID Generation Strategies (`ulid()`, `uuid()`, `rand::*`, String, Numeric)

> **Level 2 — Data Types & Record Structure**
> The built-in identifier generation strategies in SurrealDB, comparing custom text, numbers, standard UUIDs, time-sortable ULIDs (`ulid()`), and random strings, explaining how each impacts database index performance.

---

## 1. Prerequisites

- [Record ID (`table:id`)](../level_01/record_id.md) — The composite identifier format.
- [`uuid`](uuid_type.md) — The binary unique hash.

---

## 2. Term Category


**Core Concept (record identifier generation functions)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In SQL databases, you default to auto-incrementing integer IDs (`1`, `2`, `3`). 

While this is fast and sortable, it crashes in distributed databases because different servers will generate the same ID simultaneously.

In MongoDB, you default to `ObjectId`. 

While unique and time-prefix based, it is restricted to BSON formats.

We designed a pluggable set of **ID Generation Strategies** in SurrealDB to support any deployment model. 

When you insert a record, you can specify custom strings, numbers, random UUIDs, or time-sortable **ULIDs**. 

If you omit the ID entirely, SurrealDB automatically generates a random alphanumeric string. 

Choosing the correct strategy is critical to balance readability against database index write performance.

---

### (2) The Five ID Strategies

#### 1. Custom Strings
-   *Syntax:* `user:tobie`
-   *Use Case:* Static collections (like country codes `country:us`) or unique master usernames.

#### 2. Numeric Keys
-   *Syntax:* `order:1001`
-   *Use Case:* Legacy billing system migrations. (SurrealDB does **not** auto-increment these; you must supply them).

#### 3. UUID (`uuid()`)
-   *Syntax:* `user:uuid()`
-   *Use Case:* Standard distributed unique keys. (Not sortable).

#### 4. ULID (`ulid()`)
-   *Syntax:* `post:ulid()`
-   *What it is:* Universally Unique Lexicographically Sortable Identifier.
-   *Why it is awesome:* It is unique like a UUID, but **starts with a timestamp**. 
-   This means new records are naturally sorted chronologically on disk, preventing index fragmentation and allowing you to sort records by time using the ID alone.

#### 5. Random Strings (`rand::string()`)
-   *Syntax:* `user:rand(10)` or omitting the ID.
-   *Use Case:* Default keys. Generates random alphanumeric strings (e.g. `user:a9f8g7h6j5`).

---

### (3) Reality Metaphor (Cloakroom Ticket Labels)
Imagine tagging coats at a guest event:
-   **Numeric (1, 2, 3):** Writing numbers sequentially. (Easy, but if you open a second coat check rack, you get number collisions).
-   **UUID (Random):** Drawing a complex random code card from a deck: `"x98f-z44"`. (Guarantees no duplicates, but coats are hung randomly, making them hard to sort by arrival time).
-   **ULID (Time-sortable):** Stamping the ticket with the **Arrival Hour:Minute + a random code** (`1030_a9f`). 
    -   The ticket is globally unique, and you can instantly sort the coats by when the guests arrived.

---

### (4) Code Examples

#### Creating Records with Different Generation Strategies
Observe the different syntax generators in SurrealQL:

```sql
-- 1. Default (Generates a random string ID, e.g. user:t5y8u2...)
CREATE user SET name = "Alice";

-- 2. Explicit UUID generation (not sortable)
CREATE user:uuid() SET name = "Bob";

-- 3. Explicit ULID generation (time-sortable, recommended for logs/posts)
CREATE post:ulid() SET title = "SurrealDB Index Performance";

-- 4. Custom String ID
CREATE country:us SET name = "United States";

-- 5. Random alphanumeric string of length 15
CREATE logs:rand(15) SET msg = "Connection established";
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting SurrealDB to automatically auto-increment numerical record IDs (like SQL serial columns) when omitting the ID parameter

**The mistake:** Running `CREATE order SET total = 100;` and expecting the generated IDs to be sequential integers (`order:1`, `order:2`), rather than random strings.

**Why it's wrong:** SurrealDB does not have an auto-incrementing integer key generator. 

If you omit the ID, SurrealDB defaults to generating a random alphanumeric string (like `order:a8g9f...`).

**Fix: If you require time-sortable sequential keys, use the `ulid()` generator. If you must have sequential integers, you must manage the counter in your application code or database triggers.**

---



### Mistake 2: Relying on Sequential Auto-Increment Integers in Distributed Clusters

**The mistake:** Attempting auto-incrementing integer IDs (`1, 2, 3`) in multi-node SurrealDB TiKV clusters.

**Why it's wrong:** Sequential auto-increment IDs require global locks across nodes, creating extreme latency bottlenecks. Use `ulid()`, `uuid()`, or `rand()` for distributed ID generation.

*Incorrect:*
```surrealql
-- Auto-increment anti-pattern in distributed DB
CREATE user:1; CREATE user:2;
```

*Fix:*
```surrealql
CREATE user:ulid(); // Distributed sortable unique ID
```

### Mistake 3: Using `uuid()` when Time-Ordered Index Insertion Locality is Required

**The mistake:** Using random `uuid()` for high-throughput primary keys when sequential B-Tree index cache locality is critical.

**Why it's wrong:** Random UUIDs cause B-Tree index page splitting and cache misses. `ulid()` generates time-ordered lexicographically sortable IDs for optimal index insertion performance.

*Incorrect:*
```surrealql
CREATE log:uuid(); // Random insertion location in index
```

*Fix:*
```surrealql
CREATE log:ulid(); // Time-ordered sequential insertion in index
```

## 5. Practice Exercises

### Exercise 1: ID Generation Strategy Matrix

**Scenario:**
You are designing an e-commerce platform and selecting ID generation strategies for different entities (`user`, `order`, `session`, `product_sku`).

**Requirements:**
1. Use deterministic string IDs for predictable user lookups (`user:john`).
2. Use `ulid()` for time-ordered sequential order IDs (`order:ulid()`).
3. Use `rand::uuid()` for cryptographically random session tokens (`session:rand::uuid()`).
4. Use array composite IDs for multi-part product SKUs (`product:['electronics', 'laptop', 101]`).

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- 1. Deterministic String ID
> CREATE user:john SET name = "John Doe";
> 
> -- 2. ULID (Time-sortable, unique)
> CREATE order:ulid() SET amount = 149.99dec;
> 
> -- 3. UUID (Cryptographically random)
> CREATE session:rand::uuid() SET user = user:john;
> 
> -- 4. Composite Array ID
> CREATE product:['electronics', 'laptop', 101] SET stock = 50;
> ```
>
> #### Technical Explanation
>
> 1. Deterministic string IDs allow instant primary key lookup without secondary unique indexes.
> 2. `ulid()` generates 128-bit lexicographically sortable IDs, optimizing B-tree index page insertions.
> 3. Composite array IDs `[category, type, sku]` represent multi-column primary keys natively.
> 
---

### Exercise 2: Special Character ID Escaping

**Scenario:**
A migration script imports legacy records containing email addresses as primary keys (e.g. `user:john.doe@example.com`).

**Requirements:**
1. Write the correctly escaped SurrealQL record creation statement for an email ID.
2. Write a `SELECT` query retrieving the record using bracket `⟨ ⟩` escaping.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Record ID creation with bracket escaping
> CREATE user:⟨john.doe@example.com⟩ SET active = true;
> 
> -- Record retrieval
> SELECT * FROM user:⟨john.doe@example.com⟩;
> ```
>
> #### Technical Explanation
>
> 1. Record IDs containing special characters (`@`, `.`, `-`) require bracket escaping `⟨...⟩`.
> 2. Unescaped special characters trigger syntax parser errors.
> 3. Bracket escaping allows any valid UTF-8 string to serve as a primary key.
> 
---

### Exercise 3: Automatic Random Numeric ID Generation

**Scenario:**
When no ID is specified in a `CREATE` statement, SurrealDB generates a random alphanumeric record ID automatically. Demonstrate this behavior.

**Requirements:**
1. Execute `CREATE user SET name = "Anonymous User";` without specifying an ID.
2. Inspect the generated record ID returned in the result payload.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Generate automatic random ID
> CREATE user SET name = "Anonymous User";
> 
> -- Output payload contains an auto-generated random ID:
> -- [ { id: user:a7x9q2m..., name: "Anonymous User" } ]
> ```
>
> #### Technical Explanation
>
> 1. Omitting the record ID in `CREATE table` causes SurrealDB to generate a unique random string ID automatically.
> 2. Prevents ID collisions in high-concurrency insert workloads.
> 3. Provides NoSQL-style auto-generated document identifiers out of the box.
> 
---



## 6. Related Terms

- [Record ID (`table:id`)](../level_01/record_id.md) — The composite identifier format.
- [`uuid`](uuid_type.md) — The binary unique hash.

---

## 7. Key Takeaways
- SurrealDB supports custom strings, numbers, UUIDs, ULIDs, and random IDs.
- Omitting the ID defaults to generating a random alphanumeric string.
- SurrealDB does not support auto-incrementing serial integers natively.
- UUID (`uuid()`) provides globally unique, non-sortable identifiers.
- ULID (`ulid()`) provides globally unique, time-sortable identifiers.
- Use ULIDs for log tables to prevent database index page fragmentation.
- Custom string IDs are ideal for static, readable lookup tables.
