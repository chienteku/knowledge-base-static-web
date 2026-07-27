# `PERMISSIONS` Clause (Table & Field Level)

> **Level 8 — Authentication, Permissions & Security**
> Declarative access control rules defined on tables and fields that restrict `select`, `create`, `update`, and `delete` operations based on user identity (`$auth`) and session state (`$session`).

---

## 1. Prerequisites
- [`DEFINE TABLE`](../level_04/define_table.md) — Table definition context.
- [`DEFINE FIELD`](../level_04/define_field.md) — Field definition context.
- [Authentication Architecture](auth_architecture.md) — The 4-tier security hierarchy.

---

## 2. Term Category
- **Security & Authorization**

---

## 3. Environment Context
- **SurrealDB Core Engine** (Evaluated automatically on every CRUD statement executed by record-level users or client SDKs).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional database design, authorization rules (who can read or write which rows) are enforced inside backend application code (e.g., Express middleware checks `if (req.user.id !== post.author_id) throw 403`). In PostgreSQL, Row-Level Security (RLS) policies exist but require complex SQL policies and session variable management.

SurrealDB integrates row-level and field-level authorization directly into table definitions using the `PERMISSIONS` clause. You specify declarative rules for individual operations (`FOR select`, `FOR create`, `FOR update`, `FOR delete`, or `FOR full`). When a browser or client SDK queries SurrealDB, the engine automatically filters out unauthorized records or rejects unauthorized writes.

### (2) Reality Metaphor
Imagine a shared document archive in a law firm:
- **`PERMISSIONS FOR select`**: Anyone in the firm can read public case files, but confidential client files can only be read if `client_id = $auth.client_id`.
- **`PERMISSIONS FOR update`**: Attorneys can edit case summaries, but only the case owner (`author = $auth.id`) can sign and archive a file.
- **`PERMISSIONS FOR delete`**: Deletion is restricted to firm partners (`WHERE $auth.role = 'partner'`).

### (3) Code Examples

#### Short Snippet
```surrealql
-- Restrict post updates to the post author
DEFINE TABLE post PERMISSIONS
    FOR select WHERE published = true OR author = $auth.id
    FOR create, update WHERE author = $auth.id
    FOR delete WHERE $auth.role = 'admin';
```

#### Fuller Example
```surrealql
-- 1. Table-level permissions for a multi-tenant SaaS document table
DEFINE TABLE document SCHEMAFULL
    PERMISSIONS
        FOR select WHERE tenant_id = $auth.tenant_id
        FOR create WHERE tenant_id = $auth.tenant_id AND author = $auth.id
        FOR update WHERE tenant_id = $auth.tenant_id AND (author = $auth.id OR $auth.role = 'admin')
        FOR delete WHERE tenant_id = $auth.tenant_id AND $auth.role = 'admin';

-- 2. Field-level permission hiding sensitive fields
DEFINE FIELD salary ON employee TYPE number
    PERMISSIONS
        FOR select WHERE id = $auth.id OR $auth.role = 'hr_manager';
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Leaving Table PERMISSIONS Empty in Public Record Auth Apps

**The mistake:** Enabling `DEFINE ACCESS ... TYPE RECORD` on a database but failing to add `PERMISSIONS` clauses on user-facing tables.

**Why it's wrong:** By default, if no `PERMISSIONS` clause is specified on a table, all authenticated record users have full read and write access to all records in that table.

*Incorrect:*
```surrealql
-- No PERMISSIONS defined; all record users can read/modify/delete all user records!
DEFINE TABLE user SCHEMAFULL;
```

*Fix:*
```surrealql
-- Restrict access so users can only view public profiles and edit their own record
DEFINE TABLE user SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR update, delete WHERE id = $auth.id;
```

---



### Mistake 2: Setting `PERMISSIONS FULL` on Production Tables Exposing Private Data

**The mistake:** Defining `DEFINE TABLE user PERMISSIONS FULL;` in web-facing databases.

**Why it's wrong:** `PERMISSIONS FULL` allows ANY connected scope client to read, modify, or delete any record in the table.

*Incorrect:*
```surrealql
DEFINE TABLE user PERMISSIONS FULL; // ❌ Unrestricted open permissions!
```

*Fix:*
```surrealql
DEFINE TABLE user PERMISSIONS FOR select WHERE id = $auth.id, FOR update WHERE id = $auth.id;
```

### Mistake 3: Confusing Table Level `PERMISSIONS` with Field Level `PERMISSIONS`

**The mistake:** Expecting table-level `PERMISSIONS` to hide sensitive fields like `password_hash` automatically.

**Why it's wrong:** Table permissions grant or deny access to whole records. To hide specific fields within records, define field-level `PERMISSIONS` (e.g. `DEFINE FIELD pass ON TABLE user PERMISSIONS NONE;`).

*Incorrect:*
```surrealql
-- Sensitive field exposed in record reads if table permission passes
```

*Fix:*
```surrealql
DEFINE FIELD pass ON TABLE user PERMISSIONS NONE; // Field hidden from select queries
```



### Mistake 4: Setting `PERMISSIONS FULL` on Production Tables Exposing Private Data

**The mistake:** Defining `DEFINE TABLE user PERMISSIONS FULL;` in web-facing databases.

**Why it's wrong:** `PERMISSIONS FULL` allows ANY connected scope client to read, modify, or delete any record in the table.

*Incorrect:*
```surrealql
DEFINE TABLE user PERMISSIONS FULL; // ❌ Unrestricted open permissions!
```

*Fix:*
```surrealql
DEFINE TABLE user PERMISSIONS FOR select WHERE id = $auth.id, FOR update WHERE id = $auth.id;
```

### Mistake 5: Confusing Table Level `PERMISSIONS` with Field Level `PERMISSIONS`

**The mistake:** Expecting table-level `PERMISSIONS` to hide sensitive fields like `password_hash` automatically.

**Why it's wrong:** Table permissions grant or deny access to whole records. To hide specific fields within records, define field-level `PERMISSIONS` (e.g. `DEFINE FIELD pass ON TABLE user PERMISSIONS NONE;`).

*Incorrect:*
```surrealql
-- Sensitive field exposed in record reads if table permission passes
```

*Fix:*
```surrealql
DEFINE FIELD pass ON TABLE user PERMISSIONS NONE; // Field hidden from select queries
```

## 6. Practice Exercises

### Exercise 1: Define Own-Record Update Rule
Write a `PERMISSIONS` clause for a `profile` table allowing any authenticated user to `select` any profile, but restricting `update` and `delete` to only when `id = $auth.id`.

> [!check]- Answer
> - Use `FOR select FULL`.
> - Use `FOR update, delete WHERE id = $auth.id`.

---



### Exercise 2: Row-Level Security Rule Definition

**Problem:** Define `article` table permissions allowing `select` and `update` ONLY if `author = $auth.id`.

**Expected output:**
```text
DEFINE TABLE article PERMISSIONS FOR select, update WHERE author = $auth.id;
```

> [!check]- Answer
> ```surrealql
> DEFINE TABLE article PERMISSIONS FOR select, update WHERE author = $auth.id;
> ```
>
> **Explanation:** `PERMISSIONS FOR statement WHERE condition` enforces fine-grained row-level security.

### Exercise 3: Hiding Sensitive Field with PERMISSIONS NONE

**Problem:** Hide field `password_hash` on `user` table from all read queries using `PERMISSIONS NONE`.

**Expected output:**
```text
DEFINE FIELD password_hash ON TABLE user PERMISSIONS NONE;
```

> [!check]- Answer
> ```surrealql
> DEFINE FIELD password_hash ON TABLE user PERMISSIONS NONE;
> ```
>
> **Explanation:** `PERMISSIONS NONE` on a field prevents it from being exposed in projection outputs.



### Exercise 4: Row-Level Security Rule Definition

**Problem:** Define `article` table permissions allowing `select` and `update` ONLY if `author = $auth.id`.

**Expected output:**
```text
DEFINE TABLE article PERMISSIONS FOR select, update WHERE author = $auth.id;
```

> [!check]- Answer
> ```surrealql
> DEFINE TABLE article PERMISSIONS FOR select, update WHERE author = $auth.id;
> ```
>
> **Explanation:** `PERMISSIONS FOR statement WHERE condition` enforces fine-grained row-level security.

### Exercise 5: Hiding Sensitive Field with PERMISSIONS NONE

**Problem:** Hide field `password_hash` on `user` table from all read queries using `PERMISSIONS NONE`.

**Expected output:**
```text
DEFINE FIELD password_hash ON TABLE user PERMISSIONS NONE;
```

> [!check]- Answer
> ```surrealql
> DEFINE FIELD password_hash ON TABLE user PERMISSIONS NONE;
> ```
>
> **Explanation:** `PERMISSIONS NONE` on a field prevents it from being exposed in projection outputs.

## 7. Related Terms
- [`$auth` Variable](auth_variable.md) — The bound context user variable.
- [`$auth.id` vs `$auth.*`](auth_record_fields.md) — Using record properties in permissions.
- [Direct Browser-to-Database Architecture](browser_to_db.md) — Client connectivity with row-level security.

---

## 8. Key Takeaways
- `PERMISSIONS` provides declarative Row-Level Security (RLS) and Field-Level Security directly in SurrealQL.
- Supports granular operation scoping: `FOR select`, `FOR create`, `FOR update`, `FOR delete`, and `FOR full`.
- System users (`ROOT`, `NAMESPACE`, `DATABASE`) bypass permissions; `RECORD` access users are governed strictly by permissions.
