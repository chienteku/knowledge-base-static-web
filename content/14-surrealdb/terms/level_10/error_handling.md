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
- **Troubleshooting & Diagnostics**

---

## 3. Environment Context
- **Development & Operations** (Applied when troubleshooting failed queries, rejected permissions, or connection issues in production or local environments).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Swallowing Query Execution Errors in Client Application Code

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

### Mistake 5: Ignoring Transaction Conflict Aborts in Distributed Clusters

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

## 6. Practice Exercises

### Exercise 1: Diagnostic Step
If a query fails with `"Found invalid token 'SELEKT'"`, what tool should you use to validate script syntax before executing?
a. `surreal validate`
b. `surreal import`
c. `surreal export`

> [!check]- Answer
> - Static syntax validation is performed by `surreal validate`. Answer: a.

---



### Exercise 2: Catching SDK Connection Errors

**Problem:** Write JavaScript `try / catch` block handling SDK connection failures.

**Expected output:**
> [!check]- Answer
> ```text
> try { await db.connect(uri); } catch (err) { console.error("Connection failed:", err); }
> ```
> ```javascript
> try {
>   await db.connect(uri);
> } catch (err) {
>   console.error("Connection failed:", err);
> }
> ```
>
> **Explanation:** `try / catch` handles network and RPC connection exceptions.

---

### Exercise 3: SurrealDB RPC Error Code Parsing

**Problem:** Inspect error code properties on SDK exception objects (`err.code`, `err.message`).

**Expected output:**
> [!check]- Answer
> ```text
> err.code, err.message
> ```
> ```javascript
> console.log(err.code, err.message);
> ```
>
> **Explanation:** SDK error objects expose JSON-RPC error codes and detailed diagnostic strings.

## 7. Related Terms

- [SurrealDB CLI (`surreal sql`)](../level_01/surreal_cli.md) — Interactive CLI console.
- [`surreal validate` (Query Validation)](surreal_validate.md) — Pre-flight syntax validation.
- [`PERMISSIONS` Clause (Table & Field Level)](../level_08/permissions_clause.md) — Table security permissions.
- [`SLEEP` Statement](sleep.md) — Related concept: `SLEEP` Statement.

---

## 8. Key Takeaways
- Use `surreal validate` to catch static syntax typos in `.surql` files.
- Enable `--log trace` on the server CLI to inspect detailed execution logs.
- Test queries as Root superuser vs Record user to isolate `PERMISSIONS` issues from missing data.
