# `JSON` / `JSONB` Type

> **Level 6 — Schema Design & Normalization**
> The PostgreSQL data types used to store semi-structured JSON documents inside a relational table, with `JSON` storing raw text copies and `JSONB` storing optimized binary formats that support indexing.

---

## 1. Prerequisites
- [Data Types (Overview)](../level_02/data_types.md) — The parent database typing system.

---

## 2. Term Category
- **PostgreSQL Data Type**

---

## 3. Environment Context
- **PostgreSQL Specific** (A highly popular database extension. Bypasses strict relational schemas, turning PostgreSQL into a hybrid SQL/NoSQL document database).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern web development, applications frequently deal with dynamic, semi-structured data:
-   **API Payloads:** Storing raw response logs from payment gateways (like Stripe or PayPal) that change structures depending on the card type or country.
-   **Product Metadata:** Storing varying product specifications (e.g. a laptop has a `cpu_speed` key; a shirt has a `fabric_type` key).
-   **User Settings:** Storing arbitrary user dashboard UI coordinates.

If you forced this data into a strict relational model, you would have to run database migrations to add new columns every time a third-party API adds a field.

PostgreSQL designed the **`JSON`** and **`JSONB`** types to resolve this. 

They allow you to store complete JSON objects, arrays, and values inside a single column cell, combining the safety of relational SQL with the flexibility of NoSQL document databases (like MongoDB).

---

### (2) JSON vs. JSONB (When to use what)

Postgres provides two separate formats, but **you should almost always default to `JSONB`**:

-   **`JSON` (Text Storage):** Stores a literal text copy of the JSON string.
    -   *Pros:* Fast to write (no parsing overhead).
    -   *Cons:* Slow to query (Postgres must re-parse the string for every row checked). Does not support indexing.
-   **`JSONB` (Binary Storage):** Deconstructs the JSON text into a binary format during insert. It automatically strips useless whitespace, removes duplicate keys, and sorts keys.
    -   *Pros:* Fast to query. **Supports GIN (Generalized Inverted) indexing**, allowing instant lookup of nested keys.
    -   *Cons:* Slightly slower to write due to parsing overhead.

---

### (3) Key Extraction Operators
To read values out of a JSONB document in SQL, Postgres defines two operators:
-   **`->` (Extract JSON):** Returns the extracted value as a **JSON object**. (Used if you want to chain keys: `metadata -> 'shipping' -> 'zip'`).
-   **`->>` (Extract Text):** Returns the extracted value as a **raw text string**. (Used if you want to compare values in `WHERE` filters).

---

### (4) Reality Metaphor
Imagine storing a modular toy set:
-   **`JSON`** is like storing the toy inside its original wrapped, cardboard box. It is fast to slide onto the shelf (fast insert). But if you want to inspect a small block inside the box, you must unwrap and unpack the entire box (slow read parsing).
-   **`JSONB`** is like unpacking the toy and placing the individual blocks in a custom-fitted foam drawer organizer. It takes a second to set up (slower insert), but you can reach and inspect any specific block instantly (fast binary index scans).

---

### (5) Code Examples

#### Creating and Inserting JSONB
```sql
CREATE TABLE client_logs (
  id INT PRIMARY KEY,
  event_name VARCHAR(100),
  payload JSONB -- Binary JSON storage
);

-- Insert nested JSON objects
INSERT INTO client_logs VALUES (
  1, 
  'payment_completed', 
  '{"customer": "Alice", "amount": 99.50, "billing": {"country": "US"}}'
);
```

#### Extracting Nested JSON Values
```sql
-- Use -> to drill down, and ->> to extract the final value as text
SELECT 
  event_name,
  payload ->> 'customer' AS buyer_name,
  payload -> 'billing' ->> 'country' AS billing_country
FROM client_logs;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Comparing values extracted with `->` instead of `->>` in WHERE clauses

**The mistake:** Writing `WHERE payload -> 'customer' = 'Alice'` and getting zero matching rows:

```sql
-- BAD: Fails to find Alice!
SELECT event_name FROM client_logs WHERE payload -> 'customer' = 'Alice';
```

**Why it's wrong:** The operator `->` returns a **JSON object**. 

For the string `'Alice'`, it returns the value enclosed in JSON quotes: `'"Alice"'` (including the literal double quotes). 

The query tries to compare the JSON string `'"Alice"'` to the SQL text `'Alice'`, which do not match.

**Fix: Always use the `->>` operator when extracting values for comparisons, filters, or sorting.**

```sql
-- CORRECT (returns 'Alice' as raw SQL text)
SELECT event_name FROM client_logs WHERE payload ->> 'customer' = 'Alice';
```

---



### Mistake 2: Using `JSON` Data Type Instead of `JSONB` for Indexed Production Querying

**The mistake:** Defining document column as `data JSON` instead of `data JSONB`.

**Why it's wrong:** `JSON` stores raw un-parsed text (requiring re-parsing on every query) and CANNOT be indexed by GIN indexes. `JSONB` stores decomposed binary JSON, supporting fast GIN indexing and operators.

*Incorrect:*
```sql
data JSON -- ❌ Un-indexed raw text JSON storage!
```

*Fix:*
```sql
data JSONB -- Binary JSON supporting GIN indexing
```

### Mistake 3: Confusing Text Extraction Operator `->>` with Object Extraction Operator `->`

**The mistake:** Querying `WHERE data->'age' = 30` expecting text scalar output.

**Why it's wrong:** `->` returns a `JSONB` object element, while `->>` extracts field values as plain `TEXT` primitives.

*Incorrect:*
```sql
SELECT * FROM t WHERE data->'age' = 30; -- ❌ Comparing jsonb object to number!
```

*Fix:*
```sql
SELECT * FROM t WHERE (data->>'age')::INT = 30; -- Extract text and cast to int
```

## 6. Practice Exercises

### Exercise 1: Metadata Filter Query

**Problem:** You have a `devices` table with columns `serial_number` and `specs` (a `JSONB` column). The `specs` JSON contains a nested key structure: `{"hardware": {"ram_gb": 16}}`. Write a SQL query to select the `serial_number` of all devices that have exactly `'16'` GB of RAM.

**Expected output:**
```sql
SELECT serial_number 
FROM devices 
WHERE specs -> 'hardware' ->> 'ram_gb' = '16';
```

> [!check]- Answer
> - Chain the `->` operator to drill down into the `'hardware'` object.
> - Use the final `->>` operator to extract the `'ram_gb'` value as a text string for comparison.

---



### Exercise 2: Indexing JSONB Field with GIN Index

**Problem:** Create GIN index on `payload` JSONB column of `events` table.

**Expected output:**
```text
CREATE INDEX idx_events_payload ON events USING GIN (payload);
```

> [!check]- Answer
> ```sql
> CREATE INDEX idx_events_payload ON events USING GIN (payload);
> ```
>
> **Explanation:** GIN indexes on JSONB columns accelerate `@>` containment queries.

### Exercise 3: JSONB Containment Query with `@>`

**Problem:** Query users where `metadata` JSONB contains `{ "role": "admin" }` using `@>` operator.

**Expected output:**
```text
SELECT * FROM users WHERE metadata @> '{"role": "admin"}';
```

> [!check]- Answer
> ```sql
> SELECT * FROM users WHERE metadata @> '{"role": "admin"}';
> ```
>
> **Explanation:** `JSONB @> JSONB` tests if LHS JSONB document contains RHS JSONB structure.

## 7. Related Terms
- [Data Types (Overview)](../level_02/data_types.md) — The parent typing system.
- [`ARRAY` Type](array_type.md) — Storing flat text arrays.

---

## 8. Key Takeaways
- `JSON` and `JSONB` store semi-structured JSON documents in SQL columns.
- `JSON` stores exact text strings; `JSONB` stores parsed binary objects.
- Always default to `JSONB` for performance and GIN search index compatibility.
- Use `->` to extract values as JSON; use `->>` to extract values as raw text.
- Do not compare JSON-typed extracts (`->`) directly to SQL strings.
- Excellent for external API payload logging, user settings, and metadata fields.
