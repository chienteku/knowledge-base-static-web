# `UPDATE` Strategies (`SET` / `CONTENT` / `MERGE` / `PATCH`)

> **Level 3 — CRUD Operations in SurrealQL**
> The four payload modification strategies in SurrealDB updates: modifying specific fields (`SET`), replacing the entire record (`CONTENT`), merging JSON objects (`MERGE`), or applying surgical operations (`PATCH`—using RFC 6902 JSON Patch specifications).

---

## 1. Prerequisites

- [`UPDATE`](update.md) — The parent modification statement.

---

## 2. Term Category


**SurrealQL Command (MERGE vs CONTENT update strategies)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When updating records in a NoSQL database, you have different modification needs:
-   **Field Update:** You only want to change a user's password, leaving their profile intact.
-   **Full Replacement:** You want to overwrite a document configuration entirely, deleting legacy settings keys.
-   **JSON Merge:** You want to send a dictionary update from a web form and merge it with existing properties.
-   **Surgical Array Edits:** You want to add or remove an item at index `2` of a nested array without downloading the array first.

In MongoDB, these are managed using different update operators (`$set`, `$unset`, `$push`, or raw document replacements).

We designed the **four update strategies** in SurrealDB (`SET`, `CONTENT`, `MERGE`, and `PATCH`) to provide a clean, standardized interface for these operations directly inside the `UPDATE` statement.

---

### (2) The Four Strategies Compared

#### 1. `SET` (SQL-like)
Modifies only the specified fields. Any un-referenced fields in the record remain unchanged.
-   *Syntax:* `UPDATE user:john SET email = "new@mail.com"`

#### 2. `CONTENT` (Replace)
Replaces the **entire** record contents with the provided JSON object. 
-   **CRITICAL WARNING:** Any existing fields on the record that are **not** present in the new `CONTENT` object are **permanently deleted**.
-   *Syntax:* `UPDATE user:john CONTENT { email: "new@mail.com" }`

#### 3. `MERGE` (NoSQL-like)
Merges the new JSON object properties with the existing record properties. 
Unlike `CONTENT`, it **preserves** existing fields that are not in the update payload.
-   *Syntax:* `UPDATE user:john MERGE { email: "new@mail.com" }`

#### 4. `PATCH` (JSON Patch - RFC 6902)
Applies a surgical array of operations (add, remove, replace, move, copy, test) to specific property paths inside the document.
-   *Syntax:* `UPDATE user:john PATCH [ { op: "replace", path: "/email", value: "new@mail.com" } ]`

---

### (3) Reality Metaphor (Filing Edits)
Imagine modifying page details inside a customer's folder:
-   **`SET` Strategy:** Erasing a single line and writing the new value. (Surgical text swap).
-   **`CONTENT` Strategy:** Tearing the entire page out, throwing it in the trash, and replacing it with a new, blank sheet containing only the new details. (Deletes everything else!).
-   **`MERGE` Strategy:** Sticking a Post-it note on the page. 
    -   If the note overlaps a line, it covers it. 
    -   Otherwise, the original text around the note remains visible. (Preserves other fields).
-   **`PATCH` Strategy:** Handing a **red-pen correction script** to the clerk: *"Step 1: Delete line 3. Step 2: Append 'vip' to the tags list."*

---

### (4) Code Examples

#### Applying Update Strategies in SurrealQL
Let's see how they affect a starting record: `{ name: "Tobie", age: 30, theme: "dark" }`

```sql
-- Initial record exists: user:tobie

-- 1. Using SET (updates age, 'name' and 'theme' remain unchanged)
UPDATE user:tobie SET age = 31;
-- Result: { name: "Tobie", age: 31, theme: "dark" }

-- 2. Using MERGE (merges 'theme', 'name' and 'age' remain unchanged)
UPDATE user:tobie MERGE { theme: "light" };
-- Result: { name: "Tobie", age: 31, theme: "light" }

-- 3. Using CONTENT (WARNING: replaces everything! 'name' and 'theme' are DELETED!)
UPDATE user:tobie CONTENT { age: 35 };
-- Result: { age: 35 } (name and theme are lost!)

-- 4. Using PATCH (JSON Patch array to append to arrays or delete keys)
-- Let's restore the name and remove the age:
UPDATE user:tobie PATCH [
  { op: "add", path: "/name", value: "Tobie" },
  { op: "remove", path: "/age" }
];
-- Result: { name: "Tobie" }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using 'CONTENT' instead of 'MERGE' to update a nested profile dictionary, accidentally wiping out all other fields in the record

**The mistake:** Executing `UPDATE user:john CONTENT { theme: "dark" };` to update a user's preference, expecting the database to preserve their username and password.

**Why it's wrong:** The `CONTENT` strategy executes a full document replacement. 

SurrealDB wipes the existing record and writes only `{ theme: "dark" }`, permanently deleting the user's name, password, and security roles.

**Fix: Use `MERGE` or `SET` when you want to update specific fields while preserving existing document data:**

```sql
-- BAD (Deletes other fields)
UPDATE user:john CONTENT { theme: "dark" };

-- GOOD (Preserves other fields)
UPDATE user:john MERGE { theme: "dark" };
```

---



### Mistake 2: Confusing `MERGE` (Deep Object Merge) with `CONTENT` (Full Replacement)

**The mistake:** Using `CONTENT` for partial patch updates.

**Why it's wrong:** `CONTENT` overwrites the entire target record with the provided object. `MERGE` performs shallow/deep object merging.

*Incorrect:*
```surrealql
UPDATE config:1 CONTENT { port: 8080 }; // Wipes host field!
```

*Fix:*
```surrealql
UPDATE config:1 MERGE { port: 8080 }; // Retains existing fields
```

### Mistake 3: Attempting Invalid RFC 6902 Syntax in `PATCH` Updates

**The mistake:** Passing raw objects `{ age: 30 }` into `PATCH` statement clauses.

**Why it's wrong:** `PATCH` expects an array of JSON Patch operations `[{ op: "replace", path: "/age", value: 30 }]`.

*Incorrect:*
```surrealql
-- Invalid PATCH payload format
UPDATE user:alice PATCH { age: 30 }; // ❌ Syntax error!
```

*Fix:*
```surrealql
UPDATE user:alice PATCH [{ op: "replace", path: "/age", value: 30 }];
```

## 5. Practice Exercises

### Exercise 1: Comparing `SET`, `MERGE`, and `CONTENT` Update Strategies

**Scenario:**
Demonstrate the fundamental behavioral differences between `SET`, `MERGE`, and `CONTENT` update clauses when mutating an existing record `user:u1`.

**Requirements:**
1. Create `user:u1` with fields `name = "Alice"`, `role = "admin"`, `theme = "light"`.
2. Demonstrate modifying a single field using `SET`.
3. Demonstrate adding a field using `MERGE`.
4. Demonstrate complete document replacement using `CONTENT`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:u1 SET name = "Alice", role = "admin", theme = "light";
> 
> -- 1. SET: Mutates targeted field explicitly
> UPDATE user:u1 SET theme = "dark";
> 
> -- 2. MERGE: Performs shallow merge, adding new fields safely
> UPDATE user:u1 MERGE { verified: true };
> 
> -- 3. CONTENT: Replaces entire document payload completely
> UPDATE user:u1 CONTENT { name: "Alice Updated", role: "user" };
> -- (Note: 'theme' and 'verified' fields are erased by CONTENT!)
> ```
>
> #### Technical Explanation
>
> 1. `SET` mutates specific target fields explicitly without affecting sibling properties.
> 2. `MERGE` merges JSON key-value pairs into existing documents safely.
> 3. `CONTENT` completely replaces the record object payload, removing any omitted fields.

---

### Exercise 2: Atomic Array Element Appending with `+=`

**Scenario:**
Append a new tag `"rust"` to an article's `tags` array using the `+=` array modification operator in a `SET` statement.

**Requirements:**
1. Create `article:a1` with `tags = ["database"]`.
2. Update `article:a1` using `SET tags += "rust"`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE article:a1 SET tags = ["database"];
> 
> -- Atomic array element append
> UPDATE article:a1 SET tags += "rust";
> ```
>
> #### Technical Explanation
>
> 1. `SET array_field += item` appends elements to array fields atomically at the database engine level.
> 2. Avoids race conditions inherent to fetch-modify-replace application logic.
> 3. Preserves array element ordering.

---

### Exercise 3: Incremental Numeric Counter Mutations

**Scenario:**
Increment a product's `views` counter by 1 using the `+=` arithmetic operator in `UPDATE`.

**Requirements:**
1. Create product `product:p1` with `views = 100`.
2. Update `product:p1` using `SET views += 1`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE product:p1 SET views = 100;
> 
> -- Atomic numeric counter increment
> UPDATE product:p1 SET views += 1;
> ```
>
> #### Technical Explanation
>
> 1. `SET numeric_field += value` performs atomic numeric addition.
> 2. Ensures thread-safe counter increments across concurrent application traffic.
> 3. Eliminates lost update anomalies in multi-client environments.

---



## 6. Related Terms

- [`UPDATE`](update.md) — The parent modification statement.
- [Operators in SurrealQL](operators.md) — The assignment operators.
- [`CREATE` with Content (`SET` vs `CONTENT`)](create_set_content.md) — Related concept: `CREATE` with Content (`SET` vs `CONTENT`).
- [Data Migrations in SurrealDB](../level_10/data_migrations.md) — Related concept: Data Migrations in SurrealDB.
- [SDK CRUD Methods (`.select()` / `.create()` / `.update()` / `.delete()`)](../level_10/sdk_crud.md) — Related concept: SDK CRUD Methods (`.select()` / `.create()` / `.update()` / `.delete()`).

---

## 7. Key Takeaways
- `SET` updates individual properties; `CONTENT` replaces the entire record.
- `MERGE` merges JSON key-value updates while preserving other fields.
- `PATCH` applies surgical JSON Patch adjustments (RFC 6902 specification).
- Using `CONTENT` deletes all existing fields not specified in the payload.
- Use `PATCH` to insert or remove items at specific array index positions.
- Use `SET` or `MERGE` for standard, non-destructive document updates.
- All strategies return the modified record back to the application client.
