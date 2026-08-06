# `PERMISSIONS` Clause (Table & Field Level)

> **Level 8 — Authentication, Permissions & Security**
> Declarative access control rules defined on tables and fields that restrict `select`, `create`, `update`, and `delete` operations based on user identity (`$auth`) and session state (`$session`).

---

## 1. Prerequisites

- [`DEFINE TABLE`](../level_04/define_table.md) — Table definition context.
- [`DEFINE FIELD`](../level_04/define_field.md) — Field definition context.
- [Authentication Architecture (Root, Namespace, Database, Record)](auth_architecture.md) — The 4-tier security hierarchy.

---

## 2. Term Category


**Authentication & Permissions (table and field row-level security PERMISSIONS clause)**: - **Security & Authorization**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: Table-Level Row Security Configuration

**Scenario:**
Configure table `post` with CRUD permissions: anyone can `select` published posts, but only the `author` can `update` or `delete`.

**Requirements:**
1. Apply `PERMISSIONS FOR select WHERE published = true OR author = $auth.id`.
2. Apply `PERMISSIONS FOR update, delete WHERE author = $auth.id`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE post SCHEMAFULL
>     PERMISSIONS 
>         FOR select WHERE published = true OR author = $auth.id,
>         FOR create WHERE author = $auth.id,
>         FOR update, delete WHERE author = $auth.id;
> ```
>
> #### Technical Explanation
>
> 1. `PERMISSIONS` clauses define granular row-level security rules per operation (`select`, `create`, `update`, `delete`).
> 2. Evaluates boolean filter expressions for every candidate record.
> 3. Automatically filters out unauthorized records from query result arrays.

---

### Exercise 2: Field-Level Read Permissions

**Scenario:**
Restrict field `salary` on table `employee` so that only managers (`$auth.role = "manager"`) or the employee themselves (`id = $auth.id`) can view it.

**Requirements:**
1. Apply `PERMISSIONS FOR select WHERE id = $auth.id OR $auth.role = "manager"` to field `salary`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE FIELD salary ON TABLE employee TYPE decimal 
>     PERMISSIONS FOR select WHERE id = $auth.id OR $auth.role = "manager";
> ```
>
> #### Technical Explanation
>
> 1. Field-level `PERMISSIONS` restrict visibility for specific record properties.
> 2. Redacts unauthorized fields (`salary: NONE`) while allowing access to non-sensitive fields.
> 3. Enforces field privacy at the database tier.

---

### Exercise 3: Complete Access Blockage with `NONE`

**Scenario:**
Block all client `delete` operations on table `audit_log` by specifying `PERMISSIONS FOR delete NONE`.

**Requirements:**
1. Apply `PERMISSIONS FOR delete NONE` to table `audit_log`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE audit_log SCHEMAFULL
>     PERMISSIONS FOR delete NONE;
> ```
>
> #### Technical Explanation
>
> 1. `PERMISSIONS FOR delete NONE` blocks deletion attempts across all scoped client sessions.
> 2. Guarantees append-only audit trail immutability.
> 3. Root/admin connections bypass RLS permissions.

---





## 6. Related Terms

- [`$auth` Variable](auth_variable.md) — The bound context user variable.
- [`$auth.id` vs `$auth.*` (Accessing Auth Record Fields)](auth_record_fields.md) — Using record properties in permissions.
- [Direct Browser-to-Database Architecture](browser_to_db.md) — Client connectivity with row-level security.
- [SurrealQL Injection Prevention](injection_prevention.md) — Related concept: SurrealQL Injection Prevention.
- [Error Handling & Debugging](../level_10/error_handling.md) — Related concept: Error Handling & Debugging.

---

## 7. Key Takeaways
- `PERMISSIONS` provides declarative Row-Level Security (RLS) and Field-Level Security directly in SurrealQL.
- Supports granular operation scoping: `FOR select`, `FOR create`, `FOR update`, `FOR delete`, and `FOR full`.
- System users (`ROOT`, `NAMESPACE`, `DATABASE`) bypass permissions; `RECORD` access users are governed strictly by permissions.
