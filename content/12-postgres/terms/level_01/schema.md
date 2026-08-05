# Schema

> **Level 1 — What Is a Database?**
> A logical namespace within a database used to group, organize, and manage access permissions for related database objects (like tables, views, and functions).

---

## 1. Prerequisites
- [Relational Database](relational_database.md) — The parent system housing tables.
- [Table (Relation)](table.md) — The database objects grouped by schemas.
---

## 2. Term Category
- **Logical Namespace**

---

## 3. Environment Context
- **Universal Standard** (Supported natively in PostgreSQL. Every database defaults to using a standard namespace named `public`).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When you create a fresh database, you might only start with 5 or 10 tables. 

But as your application scales, the number of tables can grow to hundreds. If you dump all these tables into a single global space:

1.  **Naming Collisions:** If your billing team wants a table named `transactions` and your log analytics team also wants a table named `transactions`, they will clash. You cannot have two tables with the exact same name in the same namespace.
2.  **Lack of Organization:** Finding a specific table becomes difficult when scrolling through a massive list of hundreds of tables.
3.  **Security Risks:** You might want to grant your API server access to user tables, but completely block it from viewing financial ledger tables. Managing permissions table-by-table is tedious and error-prone.

A **Schema** solves this by acting as a namespace (like a directory folder). 

You can group billing tables into a `billing` schema, and user authentication tables into an `auth` schema. This isolates tables, prevents naming conflicts, and allows you to grant security access permissions to entire schemas at once.

---

### (2) Default Schema: `public`
In PostgreSQL, if you do not specify a schema when creating a table, Postgres automatically places it inside a default schema named **`public`**. 

When you query `SELECT * FROM users;`, Postgres internally resolves the path to `public.users`.

---

### (3) Reality Metaphor
Imagine a computer's hard drive partition:
-   The entire hard drive partition is your **Database**.
-   **Schemas** are folders on that hard drive (e.g. `/Billing`, `/Inventory`, `/Analytics`).
-   Inside the `/Billing` folder, you create a spreadsheet file named `logs.xlsx` (a table).
-   Inside the `/Analytics` folder, you can *also* create a spreadsheet named `logs.xlsx` without any conflicts because they live in separate folders.

---

### (4) Code Examples

#### Creating and Referencing Schemas
In SQL, we use dot-notation (`schema_name.table_name`) to reference specific namespaces:

```sql
-- 1. Create separate schemas for organization
CREATE SCHEMA billing;
CREATE SCHEMA inventory;

-- 2. Create tables inside specific schemas
CREATE TABLE billing.transactions (
  id INTEGER PRIMARY KEY,
  amount NUMERIC(10,2)
);

CREATE TABLE inventory.transactions (
  id INTEGER PRIMARY KEY,
  item_sku VARCHAR(50)
);
```

#### Querying Across Schemas
You can query and join tables residing in different schemas inside the same query:

```sql
SELECT b.amount, i.item_sku
FROM billing.transactions b
JOIN inventory.transactions i ON b.id = i.id;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Believing different schemas are separate physical databases

**The mistake:** Assuming that because tables live in different schemas (like `billing.orders` and `public.users`), you cannot query them together or join them.

**Why it's wrong:** Schemas are purely logical folders *inside* a single database. They share the same server resources, disk space, and memory. You can run joins across them instantly. They are not isolated like separate databases.

**Fix: Reference the schemas using dot-notation (`billing.orders JOIN public.users`) to combine their data in queries.**

---



### Mistake 2: Confusing PostgreSQL Schemas with Database Catalog Instances

**The mistake:** Thinking a PostgreSQL Schema is a separate database instance requiring different connection credentials.

**Why it's wrong:** In PostgreSQL, a Schema is a namespace inside a single database holding tables and views. Queries can join tables across schemas inside the same database.

*Incorrect:*
```sql
// Attempting to open separate DB connection per schema
```

*Fix:*
```sql
Set search_path or prefix table names: SELECT * FROM tenant_a.users JOIN tenant_b.orders;
```

### Mistake 3: Overwriting Default `public` Schema Tables Accidental Namespace Conflicts

**The mistake:** Creating all application tables directly in `public` schema in multi-tenant or multi-domain applications.

**Why it's wrong:** Putting all domain tables in `public` causes name collisions. Group modules into custom schemas (`CREATE SCHEMA auth;`, `CREATE SCHEMA billing;`).

*Incorrect:*
```sql
CREATE TABLE users (...); -- Created in public schema by default
```

*Fix:*
```sql
CREATE SCHEMA auth; CREATE TABLE auth.users (...);
```

## 6. Practice Exercises

### Exercise 1: Namespace Resolution

**Problem:** You have created a custom schema named `security` containing a table named `tokens`. If you run the query:
`SELECT * FROM tokens;`
Postgres returns an error saying "relation 'tokens' does not exist." Why did this happen, and how do you fix it?

**Expected output:**
> [!check]- Answer
> ```text
> It happened because Postgres defaulted to looking for the table inside the `public` schema (`public.tokens`). Since `tokens` was created inside the `security` schema, Postgres cannot find it. 
> To fix this, you must explicitly specify the schema path in the query: `SELECT * FROM security.tokens;`.
> ```
> - Remember that Postgres falls back to the `public` namespace unless instructed otherwise.
> - Look up the search path concept or explicit schema referencing.

---



### Exercise 2: Setting Search Path to Custom Schema

**Problem:** Set active connection `search_path` to custom schema `app_schema`.

**Expected output:**
> [!check]- Answer
> ```text
> SET search_path TO app_schema, public;
> ```
> ```sql
> SET search_path TO app_schema, public;
> ```
>
> **Explanation:** `search_path` specifies ordered schema namespaces for un-qualified table references.

---

### Exercise 3: Creating Custom Schema

**Problem:** Create custom schema `inventory` if it does not exist.

**Expected output:**
> [!check]- Answer
> ```text
> CREATE SCHEMA IF NOT EXISTS inventory;
> ```
> ```sql
> CREATE SCHEMA IF NOT EXISTS inventory;
> ```
>
> **Explanation:** `CREATE SCHEMA IF NOT EXISTS` creates schema namespaces safely.

## 7. Related Terms
- [Database](database.md) — The parent container.
- [Table (Relation)](table.md) — The child object.
---

## 8. Key Takeaways
- A schema is a logical namespace (folder) inside a database.
- Every database starts with a default schema named `public`.
- Schemas prevent naming collisions by letting tables share the same name in different folders.
- You reference tables in non-public schemas using dot-notation (`schema.table`).
- You can easily run joins across tables in different schemas within the same database.
