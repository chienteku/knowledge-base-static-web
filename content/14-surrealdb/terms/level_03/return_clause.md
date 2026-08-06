# `RETURN` Clause (`RETURN NONE / BEFORE / AFTER / DIFF`)

> **Level 3 — CRUD Operations in SurrealQL**
> The SurrealQL clause appended to write statements (`CREATE`, `UPDATE`, `DELETE`, `UPSERT`, `INSERT`) that controls what data is returned to the client, choosing between returning no data (`NONE`), the pre-write record (`BEFORE`), the post-write record (`AFTER`), or a JSON Patch diff (`DIFF`).

---

## 1. Prerequisites

- [`UPDATE`](update.md) — The write context.
- [`DELETE`](delete.md) — The delete context.

---

## 2. Term Category


**SurrealQL Command (query return value modifier)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, database write operations have fixed return behaviors:
-   SQL `INSERT` queries typically return a count of rows affected. 
    -   To see what was inserted, you must add `RETURNING *` (PostgreSQL) or run a secondary query.
-   MongoDB returns update status objects (like `{ acknowledged: true, modifiedCount: 1 }`).

Sometimes, your application has specific bandwidth or tracking needs:
-   **High-Volume Syncs:** You are logging telemetry data. You do not need to read the written records; sending them back wastes network bandwidth.
-   **Audit Logs:** You want to record exactly what fields a user changed during an account update. Calculating this in backend code requires downloading the old record, comparing it with the new payload, and diffing them manually.

We designed the **`RETURN`** clause in SurrealQL to give you complete control over database outputs. 

By appending `RETURN NONE`, `RETURN BEFORE`, `RETURN AFTER`, or the powerful `RETURN DIFF` to any write query, you instruct SurrealDB to format the response payload to match your application's requirements, saving network resources and processing overhead.

---

### (2) The Four Return Targets

-   **`RETURN NONE`:** Returns an empty array. Bypasses document serialization to save network bandwidth.
-   **`RETURN BEFORE`:** Returns the record document as it existed *before* the query was executed.
-   **`RETURN AFTER`:** Returns the record document as it exists *after* the query is executed. (Default for `CREATE` and `UPDATE`).
-   **`RETURN DIFF`:** Returns a JSON Patch array (RFC 6902) showing the exact property changes (additions, modifications, deletions) between the old and new states.

---

### (3) Reality Metaphor (Car Mechanic Reports)
Imagine taking your car to a repair shop for an oil change:
-   **`RETURN NONE`:** The mechanic completes the service, waves, and says: *"All done!"* You get no paperwork; you just drive away.
-   **`RETURN BEFORE`:** The mechanic hands you a photo of your dirty engine before they started the work.
-   **`RETURN AFTER`:** The mechanic hands you a photo of the clean, serviced engine after the job is complete.
-   **`RETURN DIFF` (Audit Receipt):** The mechanic hands you a **Detailed Invoice Receipt** listing exactly what changed: *"+1 clean oil filter, -4 quarts dirty oil."*

---

### (4) Code Examples

#### Customizing Query Returns in SurrealQL
Observe how the `RETURN` keyword changes outputs:

```sql
-- 1. Save bandwidth when inserting logs (returns empty array)
CREATE logs:ulid() SET msg = "Heartbeat ok" RETURN NONE;

-- 2. See the old state of a record during updates
-- (Returns John's document BEFORE his email was updated)
UPDATE user:john SET email = "new_email@mail.com" RETURN BEFORE;

-- 3. Get a precise list of changes made during an update!
-- Returns: [ { op: "replace", path: "/email", value: "new_email@mail.com" } ]
UPDATE user:john SET email = "new_email@mail.com" RETURN DIFF;

-- 4. Get the record details during a deletion
-- (Returns the document as it was before being deleted)
DELETE user:john RETURN BEFORE; // Same as default delete
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to use 'RETURN NONE' in high-frequency background worker writes, causing network bandwidth bloat

**The mistake:** Running automated queue sync scripts executing `CREATE` or `UPDATE` thousands of times per minute, without specifying a return clause.

**Why it's wrong:** By default, `CREATE` and `UPDATE` serialize and return the entire modified document back to the client. 

If your background worker script only writes data and never reads the return payloads, you are wasting server memory and network bandwidth transferring duplicate documents back and forth.

**Fix: Always append `RETURN NONE` to write queries inside worker scripts where the return values are ignored:**

```sql
-- CORRECT (Saves bandwidth)
UPDATE stats:hourly SET counter += 1 RETURN NONE;
```

---



### Mistake 2: Using Invalid Modifiers in `RETURN` Clauses

**The mistake:** Writing `UPDATE user:alice SET age = 30 RETURN ALL;`.

**Why it's wrong:** SurrealQL `RETURN` clause options are: `RETURN NONE`, `RETURN BEFORE`, `RETURN AFTER`, `RETURN DIFF`, or `RETURN field_name` / `expression`.

*Incorrect:*
```surrealql
UPDATE user:alice SET age = 30 RETURN ALL; // ❌ Invalid RETURN modifier!
```

*Fix:*
```surrealql
UPDATE user:alice SET age = 30 RETURN AFTER; // Returns updated record state
```

### Mistake 3: Expecting `RETURN NONE` to Return Affected Record Counts

**The mistake:** Expecting `DELETE user WHERE active = false RETURN NONE;` to return deleted record count numbers.

**Why it's wrong:** `RETURN NONE` returns an empty array `[]` explicitly to save network bandwidth.

*Incorrect:*
```surrealql
DELETE user WHERE active = false RETURN NONE; // Returns [] explicitly
```

*Fix:*
```surrealql
DELETE user WHERE active = false RETURN BEFORE; // Returns array of deleted records
```

## 5. Practice Exercises

### Exercise 1: Suppressing Mutation Payloads with `RETURN NONE`

**Scenario:**
A high-throughput telemetry ingestion batch inserts thousands of records per second into table `metric`. Suppress return payloads using `RETURN NONE` to save network bandwidth.

**Requirements:**
1. Write a `CREATE` query inserting `metric:m1`.
2. Add `RETURN NONE` to suppress output.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE metric:m1 SET temp = 22.5, timestamp = time::now() RETURN NONE;
> ```
>
> #### Technical Explanation
>
> 1. `RETURN NONE` suppresses mutation result payloads, returning an empty result array `[]`.
> 2. Saves serialization CPU cycles and network bandwidth in high-volume write pipelines.
> 3. Ideal for background ingestion tasks where confirmation of execution suffices.

---

### Exercise 2: Inspecting Mutations with `RETURN DIFF`

**Scenario:**
An audit service updates user permissions and requests a JSON Patch delta (`RETURN DIFF`) showing exactly which fields were changed during the update.

**Requirements:**
1. Update `user:alice` setting `role = "super_admin"`.
2. Add `RETURN DIFF` to output JSON Patch operations.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET role = "admin", active = true;
> 
> -- Update and return JSON Patch delta
> UPDATE user:alice SET role = "super_admin" RETURN DIFF;
> 
> -- Output payload contains JSON Patch ops:
> -- [ { op: "replace", path: "/role", value: "super_admin" } ]
> ```
>
> #### Technical Explanation
>
> 1. `RETURN DIFF` outputs standard RFC 6902 JSON Patch operations detailing exact document modifications.
> 2. Allows client applications to react to precise field changes without diffing full objects.
> 3. Used in collaborative editing and version-tracking applications.

---

### Exercise 3: Single Field Projection with `RETURN <field>`

**Scenario:**
An authentication endpoint registers a new user `user:carol` and requests only the generated JWT token string or ID using `RETURN id`.

**Requirements:**
1. Write a `CREATE` query for `user:carol`.
2. Add `RETURN id` to output only the record ID value.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:carol SET name = "Carol", email = "carol@example.com" RETURN id;
> 
> -- Output: [ { id: user:carol } ]
> ```
>
> #### Technical Explanation
>
> 1. `RETURN <field_name>` projects specific fields from the mutated record payload.
> 2. `RETURN AFTER` (default for `CREATE`/`UPDATE`) returns the complete updated record object.
> 3. `RETURN BEFORE` returns the original record document state prior to mutation.

---



## 6. Related Terms

- [`UPDATE`](update.md) — The write context.
- [`DELETE`](delete.md) — The delete context.
- [`RETURN` Statement (in Functions / Blocks)](../level_06/return_statement.md) — Related concept: `RETURN` Statement (in Functions / Blocks).

---

## 7. Key Takeaways
- The `RETURN` clause controls the output returned by database write statements.
- `RETURN NONE` returns an empty array, saving network bandwidth.
- `RETURN BEFORE` returns the record document before the write occurred.
- `RETURN AFTER` returns the record document after the write (default behavior).
- `RETURN DIFF` returns a JSON Patch (RFC 6902) showing exact modifications.
- Default behaviors: `CREATE`/`UPDATE` default to `AFTER`; `DELETE` defaults to `BEFORE`.
- Always append `RETURN NONE` inside bulk background writing scripts.
