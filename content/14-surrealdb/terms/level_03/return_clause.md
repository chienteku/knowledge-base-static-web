# `RETURN` Clause (`RETURN NONE / BEFORE / AFTER / DIFF`)

> **Level 3 — CRUD Operations in SurrealQL**
> The SurrealQL clause appended to write statements (`CREATE`, `UPDATE`, `DELETE`, `UPSERT`, `INSERT`) that controls what data is returned to the client, choosing between returning no data (`NONE`), the pre-write record (`BEFORE`), the post-write record (`AFTER`), or a JSON Patch diff (`DIFF`).

---

## 1. Prerequisites
- [`UPDATE`](update.md) — The write context.
- [`DELETE`](delete.md) — The delete context.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed at the final query projection phase. Evaluates differences between the memory state buffer and the storage layer to compile output arrays).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Return Strategy Selection

**Problem:** Select the optimal `RETURN` clause keyword (**NONE**, **BEFORE**, **AFTER**, or **DIFF**) for these application operations:
1.  A synchronization script that needs to know exactly which array indexes were updated to push a sync patch list to a mobile client.
2.  A password update query where you need to check if the user's password hash changed, but you don't want the new hash sent back to the admin logs.
3.  An analytics logging API that writes 1,000 metrics per second and discards return payloads.
4.  A profile edit form that needs to display the updated profile data on screen immediately.

**Expected output:**
```text
1. RETURN DIFF (returns the exact changes in JSON Patch format)
2. RETURN BEFORE (returns the old state, ensuring the new password is not exposed in the result)
3. RETURN NONE (prevents network payload bloat)
4. RETURN AFTER (returns the updated document state to display on the UI)
```

> [!check]- Answer
> - Determine if the application needs the old state, the new state, or just the list of changes.
> - Consider which option minimizes network overhead.

---



### Exercise 2: Inspecting Record Differences with `RETURN DIFF`

**Problem:** Update `user:alice` setting `status = "active"` returning JSON Patch differences using `RETURN DIFF`.

**Expected output:**
```text
UPDATE user:alice SET status = "active" RETURN DIFF;
```

> [!check]- Answer
> ```surrealql
> UPDATE user:alice SET status = "active" RETURN DIFF;
> ```
>
> **Explanation:** `RETURN DIFF` returns JSON Patch operations detailing changes made during updates.

### Exercise 3: Returning Specific Field Projection

**Problem:** Create user returning ONLY the generated `id` field using `RETURN id`.

**Expected output:**
```text
CREATE user SET name = "Alice" RETURN id;
```

> [!check]- Answer
> ```surrealql
> CREATE user SET name = "Alice" RETURN id;
> ```
>
> **Explanation:** `RETURN field` projects specific fields from created or updated records.

## 7. Related Terms
- [`UPDATE`](update.md) — The write context.
- [`DELETE`](delete.md) — The delete context.

---

## 8. Key Takeaways
- The `RETURN` clause controls the output returned by database write statements.
- `RETURN NONE` returns an empty array, saving network bandwidth.
- `RETURN BEFORE` returns the record document before the write occurred.
- `RETURN AFTER` returns the record document after the write (default behavior).
- `RETURN DIFF` returns a JSON Patch (RFC 6902) showing exact modifications.
- Default behaviors: `CREATE`/`UPDATE` default to `AFTER`; `DELETE` defaults to `BEFORE`.
- Always append `RETURN NONE` inside bulk background writing scripts.
