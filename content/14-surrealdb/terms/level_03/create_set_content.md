# `CREATE` with Content (`SET` vs `CONTENT`)

> **Level 3 — CRUD Operations in SurrealQL**
> The two syntax styles for inserting record fields in SurrealDB: the SQL-like key-value assignments (`SET`) and the NoSQL JSON object payload wrapper (`CONTENT`).

---

## 1. Prerequisites
- [`CREATE`](create.md) — The parent write statement.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Evaluated by the database query parser. Bypasses intermediate translations when compiling raw `CONTENT` JSON arrays directly to binary format).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing database queries, the shape of your input data varies:
-   **Manual Scripting:** When writing quick command-line tests, you want a SQL-like format where you list fields one by one.
-   **API Controllers:** In a Node.js web server, you receive a JSON request payload (`req.body`) containing a complex nested document. Parsing it to write a SQL `SET` string is tedious and requires writing parser boilerplate.

We designed the **`SET`** and **`CONTENT`** keywords inside the `CREATE` statement to support both workflows natively. 

`SET` uses SQL-like assignments (e.g. `SET age = 30`). 

`CONTENT` accepts a raw JSON-like object directly (e.g. `CONTENT { age: 30 }`). 

This allows your application to pass client request payloads directly to the database with zero parsing overhead, merging SQL and NoSQL programming patterns.

---

### (2) SET vs. CONTENT Contrast
-   **`SET` Style (SQL-like):**
    -   *Syntax:* `SET key = value, key2 = value2` (uses equals sign `=` and commas).
    -   *Best For:* Simple records, math calculations (like `balance = balance + 10`), or referencing parameters.
-   **`CONTENT` Style (NoSQL-like):**
    -   *Syntax:* `CONTENT { key: value, key2: value2 }` (uses colon `:` and standard JSON brackets).
    -   *Best For:* Inserting deeply nested objects, arrays of objects, or passing raw JSON bodies directly from application controllers.

---

### (3) Reality Metaphor (Clipboard forms vs. Stickers)
Imagine writing customer records into folders:
-   **`SET` Style:** A **Clipboard Form**. You write details line-by-line: *"Name equals John, Age equals 30."* It is structured, and you write each field manually.
-   **`CONTENT` Style:** A **Pre-Printed Adhesive Label**. You print a complete JSON block onto a sticker sheet. 
    -   You walk to the folder, peel off the sticker, and slap it directly onto the page. 
    -   You don't need to rewrite the lines.

---

### (4) Code Examples

#### SET vs. CONTENT Queries
Both of these queries insert identical data:

```sql
-- 1. Using the SET style (SQL-like, uses '=' and commas)
CREATE user:tobie SET
  name = "Tobie",
  age = 30,
  settings = {
    theme: "dark",
    notifications: true
  };

-- 2. Using the CONTENT style (JSON-like, uses ':' and colons)
CREATE user:tobie CONTENT {
  name: "Tobie",
  age: 30,
  settings: {
    theme: "dark",
    notifications: true
  }
};
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using SQL-style equals '=' operators instead of JSON-style colons ':' inside the 'CONTENT' block object

**The mistake:** Writing `CREATE user CONTENT { name = "Tobie", age = 30 };` to insert JSON data.

**Why it's wrong:** The `CONTENT` block expects a valid JSON/BSON object representation. 

Using equals signs (`=`) instead of colons (`:`) violates JSON rules, causing the query parser to throw syntax parsing errors.

**Fix: Verify that `SET` queries use equals signs (`=`) and `CONTENT` queries use colons (`:`):**

```sql
-- BAD
CREATE user CONTENT { name = "Tobie" };

-- GOOD
CREATE user CONTENT { name: "Tobie" };
```

---



### Mistake 2: Combining `SET` and `CONTENT` Clauses in a Single `CREATE` Statement

**The mistake:** Writing `CREATE user SET name = 'Alice' CONTENT { age: 30 };` (SyntaxError).

**Why it's wrong:** `SET` and `CONTENT` are mutually exclusive clauses in `CREATE` / `UPDATE` statements. Use either `SET` or `CONTENT` or `MERGE`.

*Incorrect:*
```surrealql
-- Cannot combine SET and CONTENT
CREATE user SET name = "Alice" CONTENT { age: 30 }; // ❌ Syntax error!
```

*Fix:*
```surrealql
CREATE user CONTENT { name: "Alice", age: 30 };
-- Or:
CREATE user SET name = "Alice", age = 30;
```

### Mistake 3: Overwriting Entire Record Objects when Using `CONTENT` instead of `MERGE` or `SET`

**The mistake:** Using `UPDATE user:alice CONTENT { age: 31 };` expecting `name` field to be preserved.

**Why it's wrong:** `CONTENT` completely replaces the existing record object with the new object! `name` field is deleted. Use `MERGE` or `SET` to update specific fields.

*Incorrect:*
```surrealql
-- Overwrites entire record, deleting existing fields!
UPDATE user:alice CONTENT { age: 31 }; // ❌ Name field is lost!
```

*Fix:*
```surrealql
UPDATE user:alice MERGE { age: 31 }; // Merges new fields without overwriting
```

## 6. Practice Exercises

### Exercise 1: Query Translation

**Problem:** You have a `SET` query:
`CREATE product:pro SET title = "Phone", specs = { color: "black", memory: "128GB" };`
Write the equivalent query using the `CONTENT` syntax style.

**Expected output:**
> [!check]- Answer
> ```sql
> CREATE product:pro CONTENT {
>   title: "Phone",
>   specs: {
>     color: "black",
>     memory: "128GB"
>   }
> };
> ```
> - Replace the `SET` keyword with `CONTENT`.
> - Convert the key-value sequence into a single enclosed JSON object block using colons (`:`).

---



### Exercise 2: Using `SET` vs `CONTENT` vs `MERGE`

**Problem:** Match clauses: 1. Assign individual fields (`SET`), 2. Replace entire record (`CONTENT`), 3. Shallow merge object (`MERGE`).

**Expected output:**
> [!check]- Answer
> ```text
> 1. SET, 2. CONTENT, 3. MERGE
> ```
> ```text
> 1. SET, 2. CONTENT, 3. MERGE
> ```
>
> **Explanation:** `SET` modifies individual fields; `CONTENT` replaces records; `MERGE` updates nested fields.

---

### Exercise 3: Patch Updates with `PATCH`

**Problem:** Update `user:alice` using JSON Patch syntax `PATCH [{ op: "replace", path: "/age", value: 31 }]`.

**Expected output:**
> [!check]- Answer
> ```text
> UPDATE user:alice PATCH [{ op: "replace", path: "/age", value: 31 }];
> ```
> ```surrealql
> UPDATE user:alice PATCH [{ op: "replace", path: "/age", value: 31 }];
> ```
>
> **Explanation:** `PATCH` executes standard RFC 6902 JSON Patch operations.

## 7. Related Terms
- [`CREATE`](create.md) — The parent write statement.
- [`UPDATE` Strategies](update_strategies.md) — Updating records content.

---

## 8. Key Takeaways
- `SET` uses SQL assignments (`=`); `CONTENT` uses JSON objects (`:`).
- Both styles insert identical record structures into SurrealDB tables.
- Use `SET` for simple updates or operations requiring arithmetic (`+=`).
- Use `CONTENT` to insert complex, deeply nested JSON objects.
- `CONTENT` maps directly to application payload bodies (`req.body`).
- Do not mix equals signs (`=`) inside a `CONTENT` object block.
- Both options return the fully compiled record back to the client.
