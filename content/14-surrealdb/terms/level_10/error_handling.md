# Error Handling & Debugging

> **Level 10 — SDKs, Deployment & Production**
> Systematic approaches for interpreting SurrealDB error messages, diagnosing query syntax errors, troubleshooting permission failures, and debugging issues using the SurrealDB CLI.

---

## 1. Prerequisites

- [SurrealDB CLI (`surreal sql`)](../level_01/surreal_cli.md) — Interactive CLI console.
- [`PERMISSIONS` Clause (Table & Field Level)](../level_08/permissions_clause.md) — Permission errors.
- [`ASSERT` Clause](../level_04/assert_clause.md) — Field constraint assertions.

---

## 2. Term Category


**SurrealQL Command (database transaction error handling mechanisms)**: - **Troubleshooting & Diagnostics**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
During application development and database maintenance, queries fail for various reasons: syntax typos, record constraint failures (`ASSERT`), unauthorized permission checks (`PERMISSIONS`), connection drops, or write transaction conflicts.

To troubleshoot effectively, developers need a systematic understanding of SurrealDB error categories and diagnostic tools:
1. **Syntax & Parsing Errors**: Occur when SurrealQL statements violate language grammar.
2. **Assertion & Constraint Failures**: Occur when incoming data violates `ASSERT` conditions or strict `SCHEMAFULL` field types.
3. **Authorization & Permission Denied Errors**: Occur when a Record Access user attempts an operation rejected by table `PERMISSIONS`.
4. **Interactive CLI Debugging (`surreal sql`)**: Running queries directly in the CLI with `--log trace` to inspect detailed execution traces and server logs.

### (2) Diagnostic Flowchart

```
                          ┌────────────────────────────┐
                          │   Query Execution Failed   │
                          └─────────────┬──────────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
┌─────────────────────────┐                             ┌─────────────────────────┐
│   Syntax Error          │                             │ Runtime Error           │
│   "Found invalid token" │                             │ "Permission Denied"     │
└────────────┬────────────┘                             └──────────┬──────────────┘
             │                                                     │
             ▼                                                     ▼
┌─────────────────────────┐                             ┌─────────────────────────┐
│ Fix SurrealQL typos or  │                             │ Check $auth context and │
│ run `surreal validate`  │                             │ table PERMISSIONS rules │
└─────────────────────────┘                             └─────────────────────────┘
```

### (3) Code Examples

#### Short Snippet
```bash
# Start SurrealDB CLI with trace-level debug logging enabled for troubleshooting
surreal start --log trace --user root --pass root surrealkv://data/db.db
```

#### Fuller Example (Handling Common Error Codes in JavaScript SDK)
```typescript
import { Surreal } from 'surrealdb';
const db = new Surreal();

async function safeQueryExecution() {
    try {
        await db.connect('ws://localhost:8000/rpc');
        await db.use({ namespace: 'app', database: 'prod' });

        // Intentional constraint violation to trigger assertion error
        await db.create('user', { email: 'invalid-email-string' });

    } catch (err: any) {
        console.error('Captured SurrealDB Error:', err.message);

        if (err.message.includes('ASSERT')) {
            console.warn('Field validation failed! Check ASSERT rules for string formatting.');
        } else if (err.message.includes('Permissions')) {
            console.warn('Access denied! Verify $auth record identity and table PERMISSIONS.');
        } else if (err.message.includes('No namespace')) {
            console.warn('Scope missing! Ensure db.use({ namespace, database }) was called.');
        }
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing "Record Not Found" with "Permission Denied" in Record Auth Queries

**The mistake:** Assuming a empty result `[]` returned from `SELECT * FROM post` means no posts exist in the database.

**Why it's wrong:** Under Record Access, if table `PERMISSIONS` restrict reads (`FOR select WHERE published = true`), SurrealDB silently filters out unauthorized records. To the user, it looks like 0 records exist, even if 100 unpublished posts are stored in the table.

*Diagnostic Check:*
Test the exact same query using Root superuser credentials in `surreal sql`. If records appear for Root but return `[]` for Record users, the issue is a `PERMISSIONS` policy check.

---



### Mistake 2: Swallowing Query Execution Errors in Client Application Code

**The mistake:** Wrapping database calls in empty `try { ... } catch {}` blocks without logging or retrying.

**Why it's wrong:** Swallowing errors masks permission failures, unique constraint violations, and transaction conflicts, making root-cause debugging impossible.

*Incorrect:*
```surrealql
try { await db.create('user', data); } catch (e) {} // ❌ Swallows errors silently!
```

*Fix:*
```surrealql
try { await db.create('user', data); } catch (err) { console.error('SurrealDB Error:', err); throw err; }
```

### Mistake 3: Ignoring Transaction Conflict Aborts in Distributed Clusters

**The mistake:** Executing concurrent transactions without retry mechanisms on conflict errors.

**Why it's wrong:** Optimistic concurrency control in distributed storage engines throws transaction conflicts under concurrent writes. Catch conflict errors and retry transactions.

*Incorrect:*
```surrealql
// Un-handled OCC transaction conflict
```

*Fix:*
```surrealql
Implement exponential backoff retry loops for transactional operations
```





## 5. Practice Exercises

### Exercise 1: Custom Exception Throwing in Transactions

**Scenario:**
Check an account balance inside a transaction script. If balance is less than withdrawal amount, throw a custom exception using `THROW`.

**Requirements:**
1. Declare `LET $balance = 50.00dec;`.
2. Check `IF $balance < $withdrawal THEN THROW "Insufficient funds!" END;`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> LET $balance = 50.00dec;
> LET $withdrawal = 100.00dec;
> 
> BEGIN TRANSACTION;
> 
> IF $balance < $withdrawal THEN (
>     THROW "Insufficient funds! Current balance: " + <string> $balance
> ) END;
> 
> UPDATE account:a1 SET balance -= $withdrawal;
> 
> COMMIT TRANSACTION;
> ```
>
> #### Technical Explanation
>
> 1. `THROW` aborts transaction execution immediately and returns a custom error exception payload.
> 2. Automatically rolls back all uncommitted mutations inside the active transaction block.
> 3. Enforces domain validation rules at the database tier.
> 
---

### Exercise 2: Catching Errors in Field Assertions

**Scenario:**
Catch assertion write errors when inserting an invalid email address into table `user`.

**Requirements:**
1. Define field `email` with `ASSERT string::is::email($value)`.
2. Demonstrate write failure on invalid string.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE user SCHEMAFULL;
> DEFINE FIELD email ON TABLE user TYPE string 
>     ASSERT string::is::email($value) OR THROW "Invalid email address format!";
> 
> -- Fails with custom assertion error!
> CREATE user:u1 SET email = "not-an-email";
> ```
>
> #### Technical Explanation
>
> 1. Combining `ASSERT` with `OR THROW` customizes field validation error messages.
> 2. Returns clear error descriptions to SDK callers.
> 3. Prevents invalid data insertion.
> 
---

### Exercise 3: Handling Primary Key Collision Errors

**Scenario:**
Handle primary key collision errors when creating a record `user:alice` that already exists.

**Requirements:**
1. Execute `CREATE user:alice` twice to demonstrate primary key conflict error.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET name = "Alice";
> 
> -- Second execution fails with record conflict error:
> -- "Database record 'user:alice' already exists"
> CREATE user:alice SET name = "Alice Duplicate";
> ```
>
> #### Technical Explanation
>
> 1. `CREATE` throws a primary key collision exception if the record ID already exists.
> 2. Use `UPSERT` or `INSERT ON DUPLICATE KEY UPDATE` if collision updates are desired.
> 3. Guarantees primary key uniqueness.
> 
---





## 6. Related Terms

- [SurrealDB CLI (`surreal sql`)](../level_01/surreal_cli.md) — Interactive CLI console.
- [`surreal validate` (Query Validation)](surreal_validate.md) — Pre-flight syntax validation.
- [`PERMISSIONS` Clause (Table & Field Level)](../level_08/permissions_clause.md) — Table security permissions.
- [`SLEEP` Statement](sleep.md) — Related concept: `SLEEP` Statement.

---

## 7. Key Takeaways
- Use `surreal validate` to catch static syntax typos in `.surql` files.
- Enable `--log trace` on the server CLI to inspect detailed execution logs.
- Test queries as Root superuser vs Record user to isolate `PERMISSIONS` issues from missing data.
