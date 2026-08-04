# Row-Level Security (RLS)

> **Level 10 — Administration, Security & Production**
> A PostgreSQL security feature that evaluates user permissions on a row-by-row basis, automatically filtering which records a database role can read or write based on defined policies.

---

## 1. Prerequisites
- [Roles & Permissions (`CREATE ROLE`, `GRANT`, `REVOKE`)](roles_permissions.md) — The roles bound by security policies.

---

## 2. Term Category
- **Database Feature / Security**

---

## 3. Environment Context
- **PostgreSQL Core** (Fully supported natively. Handled at the query compiler layer, injecting security filters into incoming SELECT/DML queries before execution).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern Software-as-a-Service (SaaS) web applications, multiple companies (tenants) share the same database tables to save hosting costs:
-   A single `documents` table stores records for Company A and Company B.
-   Rows are separated only by a `tenant_id` column.

If a developer writes a backend query:
`SELECT * FROM documents;`

And forgets to append `WHERE tenant_id = 'company_a'`, the website will display Company B's private documents to Company A. 

This is a catastrophic multi-tenant security leak.

We designed **Row-Level Security (RLS)** to prevent these developer mistakes. 

Instead of relying on developers to write filtering logic in their backend application code, RLS moves the security filters into the database engine:
1.  You enable RLS on the table.
2.  You write a policy: *"Users can only access rows where tenant_id matches their login session variable."*
3.  Postgres automatically appends the filter to every incoming query behind the scenes. 

The developer writes `SELECT * FROM documents`, but Postgres translates it to `SELECT * FROM documents WHERE tenant_id = ...` before reading disk blocks, making data leaks impossible.

---

### (2) Step-by-Step RLS Configuration
RLS is inactive by default (tables return all rows to anyone with table-level permissions). To turn it on, you must:

1.  **Enable RLS:** `ALTER TABLE tab ENABLE ROW LEVEL SECURITY;`
2.  **Define a Policy:** Create rules using the `CREATE POLICY` command containing a `USING` filter expression.

---

### (3) Reality Metaphor
Imagine a large hotel:
-   **Table-Level Permissions:** Checking into the hotel lobby. Your reservation badge grants you access to enter the building.
-   **Row-Level Security (RLS):** Your electronic **Key Card**. 
    -   Although the hotel contains 500 rooms (rows in a table), your key card only unlocks Room `304`. 
    -   Even if you walk down the hallway and try to push open other doors (running `SELECT *`), the locks keep you out automatically.

---

### (4) Code Examples

#### Building a Tenant Isolation Policy
Let's build a secure task list table:

```sql
CREATE TABLE tasks (
  id INT PRIMARY KEY,
  owner_role VARCHAR(50),
  description TEXT
);

-- 1. Enable Row-Level Security on the table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy: rows are visible only if owner_role matches current database user
CREATE POLICY task_user_isolation ON tasks
USING (owner_role = current_user);
```

#### Testing RLS Visibility
Let's test the policy by switching database roles:

```sql
-- Insert mock records as admin/owner
INSERT INTO tasks VALUES (1, 'bob',   'Bob''s private draft');
INSERT INTO tasks VALUES (2, 'alice', 'Alice''s client notes');

-- Grant read access to the tables
GRANT SELECT ON tasks TO alice, bob;

-- Switch session role to Alice
SET ROLE alice;

-- Alice queries the table (Selects all rows)
SELECT * FROM tasks;
-- Output (RLS automatically filtered Bob's row!):
--  id | owner_role |      description      
-- ----+------------+-----------------------
--   2 | alice      | Alice's client notes
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Testing RLS policies using the database owner role or superuser account

**The mistake:** Testing your RLS filters while connected as the `postgres` superuser, and panicking because you can still see all rows for all tenants.

**Why it's wrong:** By default, the table owner role and the database superusers **bypass RLS policies entirely** to prevent administrators from locking themselves out of database maintenance.

**Fix: When testing RLS, always switch roles to a standard non-owner database user using `SET ROLE name;`, or explicitly force RLS for table owners using this DDL:**

```sql
-- Force RLS policies to apply to the table owner as well
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;
```

---



### Mistake 2: Creating RLS Policies Without Executing `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`

**The mistake:** Creating `CREATE POLICY user_policy ON documents FOR SELECT USING (user_id = current_setting('app.user_id')::INT);` without enabling RLS on the table.

**Why it's wrong:** Defining a policy does NOTHING until RLS is explicitly enabled on the table! Table rows remain visible to all users until `ALTER TABLE documents ENABLE ROW LEVEL SECURITY;` is executed.

*Incorrect:*
```sql
CREATE POLICY user_policy ON documents ...; -- ❌ Ineffective until RLS is enabled!
```

*Fix:*
```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_policy ON documents FOR SELECT USING (user_id = current_setting('app.user_id')::INT);
```

### Mistake 3: Testing RLS Policies Connected as Table Owner or Superuser Accounts

**The mistake:** Connecting as table owner and wondering why RLS policies are not filtering rows.

**Why it's wrong:** By default, table owners and superusers BYPASS Row Level Security policies! Test RLS policies connected as a non-owner application role or specify `FORCE ROW LEVEL SECURITY`.

*Incorrect:*
```sql
// Testing RLS policies while connected as superuser or table owner
```

*Fix:*
```sql
ALTER TABLE documents FORCE ROW LEVEL SECURITY; -- Enforces RLS on table owners
```

## 6. Practice Exercises

### Exercise 1: Personal Profile Policy

**Problem:** You have a `user_profiles` table (columns: `id`, `username`, `phone_number`). You want to ensure users can only select and edit their own profiles. 

Write the SQL DDL queries to:
1.  Enable Row-Level Security on the `user_profiles` table.
2.  Create a policy named `user_profile_policy` that permits access only if the `username` column matches the active `current_user` name.

**Expected output:**
> [!check]- Answer
> ```sql
> ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
> 
> CREATE POLICY user_profile_policy ON user_profiles
> USING (username = current_user);
> ```
> - Use the `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` syntax.
> - Reference the built-in PostgreSQL function `current_user` in the `USING` clause.

---



### Exercise 2: Tenant Isolation RLS Policy

**Problem:** Enable RLS on `documents` table and create policy isolating rows where `tenant_id = current_setting('app.current_tenant_id')::INT`.

**Expected output:**
> [!check]- Answer
> ```text
> ALTER TABLE documents ENABLE ROW LEVEL SECURITY; CREATE POLICY tenant_isolation_policy ON documents FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::INT);
> ```
> ```sql
> ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
> CREATE POLICY tenant_isolation_policy ON documents
> FOR ALL
> USING (tenant_id = current_setting('app.current_tenant_id')::INT);
> ```
>
> **Explanation:** RLS policies filter table rows dynamically based on session settings (`current_setting()`).

---

### Exercise 3: Bypassing RLS Attribute

**Problem:** What role attribute allows superusers to bypass RLS policies? (`BYPASSRLS`).

**Expected output:**
> [!check]- Answer
> ```text
> BYPASSRLS attribute
> ```
> ```text
> BYPASSRLS attribute
> ```
>
> **Explanation:** Superuser roles possess the `BYPASSRLS` attribute by default.

## 7. Related Terms
- [Roles & Permissions (`CREATE ROLE`, `GRANT`, `REVOKE`)](roles_permissions.md) — The roles bound.
- [View](../level_09/view.md) — Creating simple logical column masks.

---

## 8. Key Takeaways
- RLS restricts table row visibility based on the database role executing the query.
- Prevents multi-tenant data leaks by moving security filters to the DB engine.
- Must be explicitly activated using `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- Configured using `CREATE POLICY` statements containing conditional `USING` clauses.
- Table owners and superusers bypass RLS policies by default.
- Use `FORCE ROW LEVEL SECURITY` to apply policy filters to table owners.
- Best design practice for securing multi-tenant SaaS application databases.
