# `DEFINE TABLE`

> **Level 4 — Schema Definition & Constraints**
> The DDL (Data Definition Language) statement in SurrealDB used to explicitly configure table schemas, set validation constraints (`SCHEMAFULL`/`SCHEMALESS`), define graph relationships (`TYPE RELATION`), and enforce row-level security permissions.

---

## 1. Prerequisites
- [Table](../level_01/table.md) — The basic collection container.
- [`SCHEMAFULL` vs `SCHEMALESS`](../level_01/schemafull_schemaless.md) — The validation modes.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Executed by the database administrator. Updates database system configuration catalog tables instantly on the server).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational databases (PostgreSQL), creating a table requires defining a fixed layout of columns and constraints inside a `CREATE TABLE` query. 

In MongoDB, collections are created implicitly, and schema validation must be written inside separate JSON schema configurations.

We designed the **`DEFINE TABLE`** statement in SurrealQL to act as a unified schema generator. 

It handles four critical design needs in a single DDL interface:
1.  **Schema Strictness:** Choose whether the table is locked (`SCHEMAFULL`) or dynamic (`SCHEMALESS`).
2.  **Graph Rules:** Define the table as a **Relation Table** (graph edge) to specify which nodes it is allowed to connect (e.g. only connecting `user` records to `post` records).
3.  **Permissions (Row-Level Security):** Write conditional queries directly on the table schema to check who can select, write, edit, or delete records.
4.  **Change Feeds:** Activate historical tracking logs for the table.

---

### (2) Key Configurations

#### 1. Relation Tables (`TYPE RELATION`)
In SurrealDB, graph edges are records stored inside tables. 
-   To prevent a user from connecting a `user` to a `product` using a `likes` edge, you define the `likes` table as `TYPE RELATION` and specify its bounds:
`DEFINE TABLE likes TYPE RELATION FROM user TO post;`

#### 2. Row-Level Security (RLS)
You can append access rules using the `PERMISSIONS` clause:
`PERMISSIONS FOR select WHERE id = $auth.id;` (users can only read their own profile!).

---

### (3) Reality Metaphor (Building Storage Rooms)
Imagine dividing a storage warehouse:
-   **`DEFINE TABLE`:** Framing and installing a **Dedicated Room** in the warehouse.
    -   **`SCHEMAFULL` Room:** A room filled with pre-sized storage slots. You can only deposit items that match the slot dimensions.
    -   **`SCHEMALESS` Room:** A wide open workspace where you can pile items in any shape.
    -   **`TYPE RELATION` Room:** A **Bridge Corridor** built specifically to connect Building A (users) to Building B (posts). The doors lock if you try to drag items from Building C.
    -   **Permissions:** A **Security Keypad** on the door checking badges. Only managers are allowed inside the storage bins (row-level security).

---

### (4) Code Examples

#### Creating Custom Table Configurations in SurrealQL
Observe the different table styles:

```sql
-- 1. Define a strict user profile table with row-level security
-- Users can read any profile, but can only edit their own!
DEFINE TABLE user SCHEMAFULL
  PERMISSIONS FOR select FULL,
              FOR update WHERE id = $auth.id;

-- 2. Define a flexible schema-less logging table (no permissions restriction)
DEFINE TABLE logs SCHEMALESS;

-- 3. Define a graph relation table (edge)
-- Restricts this edge to ONLY connect 'user' nodes to 'post' nodes!
DEFINE TABLE likes TYPE RELATION FROM user TO post;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to relate records using 'RELATE' in schema-full mode before explicitly defining the relation table, causing query failures

**The mistake:** Running the query `RELATE user:john->likes->post:first;` in a strict production environment, getting unrecognized table errors.

**Why it's wrong:** Under strict database rules, if a database is configured schema-full, SurrealDB rejects writes to any table that has not been defined. 

Because graph edges are tables, trying to create a relation record without running `DEFINE TABLE likes` first will trigger write validation failures.

**Fix: Always write the table schema definition queries for your graph relation tables before attempting to execute `RELATE` commands:**

```sql
-- CORRECT SEQUENCE
DEFINE TABLE likes TYPE RELATION FROM user TO post;
RELATE user:john->likes->post:first;
```

---



### Mistake 2: Declaring Graph Edge Tables as `TYPE NORMAL` instead of `TYPE RELATION`

**The mistake:** Defining a graph relation table like `wrote` without specifying `TYPE RELATION`.

**Why it's wrong:** Graph edge tables used with `RELATE` must be declared as `TYPE RELATION` or `TYPE RELATION IN user OUT post` to enforce graph edge constraints.

*Incorrect:*
```surrealql
DEFINE TABLE wrote; // Defaults to normal table without graph edge constraints
```

*Fix:*
```surrealql
DEFINE TABLE wrote TYPE RELATION IN user OUT post; // Enforces graph edge constraints
```

### Mistake 3: Overriding Table Permissions with Open Access in Production

**The mistake:** Setting `PERMISSIONS FULL` on sensitive production tables without row-level rules.

**Why it's wrong:** `PERMISSIONS FULL` grants unrestricted read/write access to any client connected to the scope. Define row-level conditions like `PERMISSIONS FOR select WHERE id = $auth.id`.

*Incorrect:*
```surrealql
DEFINE TABLE user PERMISSIONS FULL; // ❌ Public access!
```

*Fix:*
```surrealql
DEFINE TABLE user PERMISSIONS FOR select WHERE id = $auth.id OR $auth.role = 'admin';
```

## 6. Practice Exercises

### Exercise 1: Table Definition Assembly

**Problem:** Write the SurrealQL statements to:
1.  Define a table named `comments` in `SCHEMAFULL` mode.
2.  Define a relation table named `wrote` that connects only `user` records to `comments` records.

**Expected output:**
> [!check]- Answer
> ```sql
> DEFINE TABLE comments SCHEMAFULL;
> DEFINE TABLE wrote TYPE RELATION FROM user TO comments;
> ```
> - The graph connection table requires `TYPE RELATION` configurations.
> - Specify the source (`FROM`) and target (`TO`) boundaries.

---



### Exercise 2: Defining Strict Relation Table

**Problem:** Define graph relation table `likes` enforcing `IN user` and `OUT article`.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE TABLE likes TYPE RELATION IN user OUT article;
> ```
> ```surrealql
> DEFINE TABLE likes TYPE RELATION IN user OUT article;
> ```
>
> **Explanation:** `TYPE RELATION IN in_table OUT out_table` constrains graph edge targets.

---

### Exercise 3: Table Drop Removal

**Problem:** Command to drop table definition `old_table` from database.

**Expected output:**
> [!check]- Answer
> ```text
> REMOVE TABLE old_table;
> ```
> ```surrealql
> REMOVE TABLE old_table;
> ```
>
> **Explanation:** `REMOVE TABLE` drops specified table definitions and schema metadata.

## 7. Related Terms
- [Table](../level_01/table.md) — The basic collection container.
- [`SCHEMAFULL` vs `SCHEMALESS`](../level_01/schemafull_schemaless.md) — The validation modes.
- [`DEFINE FIELD`](define_field.md) — Creating fields.

---

## 8. Key Takeaways
- `DEFINE TABLE` explicitly configures table schemas and properties.
- Relational equivalent to `CREATE TABLE`; NoSQL equivalent to validation rules.
- Supports RLS (Row-Level Security) using the `PERMISSIONS` query clause.
- `TYPE RELATION` configures graph edge tables, mapping connection boundaries.
- Schema-full databases require all tables and relations to be defined first.
- Bypassing relation schema declarations blocks graph query creations.
- Tables are defined at the active database scope level (`USE NS ... DB ...`).
