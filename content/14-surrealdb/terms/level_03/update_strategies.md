# `UPDATE` Strategies (`SET` / `CONTENT` / `MERGE` / `PATCH`)

> **Level 3 — CRUD Operations in SurrealQL**
> The four payload modification strategies in SurrealDB updates: modifying specific fields (`SET`), replacing the entire record (`CONTENT`), merging JSON objects (`MERGE`), or applying surgical operations (`PATCH`—using RFC 6902 JSON Patch specifications).

---

## 1. Prerequisites
- [`UPDATE`](update.md) — The parent modification statement.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed at the document compilation phase. Governs whether SurrealDB merges binary BSON trees on disk or overwrites blocks entirely).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Strategy Selector

**Problem:** Select the optimal update strategy (**SET**, **CONTENT**, **MERGE**, or **PATCH**) for these application operations:
1.  Replacing an entire system settings JSON document with a new upload, discarding any old custom settings keys.
2.  Adding a tag `"news"` to index position `0` of an array of tag strings inside a post record.
3.  Merging a user-submitted registration form object containing `phone` and `city` fields into their profile.
4.  Incrementing a user's loyalty points by `10`.

**Expected output:**
```text
1. CONTENT (replaces the entire document, discarding old parameters)
2. PATCH (allows specific array index insertions via JSON Patch operations)
3. MERGE (merges object keys without deleting surrounding profile values)
4. SET (ideal for direct field assignments and mathematical increments: `SET points += 10`)
```

> [!check]- Answer
> - Check if the operation replaces the document or target specific properties.
> - Consider if array index manipulations are required.

---



### Exercise 2: Selecting Strategy: SET vs MERGE vs CONTENT vs PATCH

**Problem:** Match strategy: 1. Modify single field (`SET`), 2. JSON Patch operations (`PATCH`), 3. Replace object (`CONTENT`).

**Expected output:**
```text
1. SET, 2. PATCH, 3. CONTENT
```

> [!check]- Answer
> ```text
> 1. SET, 2. PATCH, 3. CONTENT
> ```
>
> **Explanation:** SurrealDB offers SET, MERGE, CONTENT, and PATCH update strategies.

### Exercise 3: Array Element Removal Strategy

**Problem:** Remove item `"guest"` from `roles` array field using `-=` operator.

**Expected output:**
```text
UPDATE user:alice SET roles -= "guest";
```

> [!check]- Answer
> ```surrealql
> UPDATE user:alice SET roles -= "guest";
> ```
>
> **Explanation:** `-=` operator removes specified items from array or set fields.

## 7. Related Terms
- [`UPDATE`](update.md) — The parent modification statement.
- [Operators in SurrealQL](operators.md) — The assignment operators.

---

## 8. Key Takeaways
- `SET` updates individual properties; `CONTENT` replaces the entire record.
- `MERGE` merges JSON key-value updates while preserving other fields.
- `PATCH` applies surgical JSON Patch adjustments (RFC 6902 specification).
- Using `CONTENT` deletes all existing fields not specified in the payload.
- Use `PATCH` to insert or remove items at specific array index positions.
- Use `SET` or `MERGE` for standard, non-destructive document updates.
- All strategies return the modified record back to the application client.
