# Destructuring & Object Notation in SELECT

> **Level 6 — Advanced Querying & Functions**
> The SurrealQL syntax pattern that allows selecting specific sub-properties from nested objects using destructuring bracket notation (`SELECT object.{field1, field2}`), eliminating repetitive dot-notation path references.

---

## 1. Prerequisites

- [`SELECT`](../level_03/select.md) — The query statement.
- [`object`](../level_02/object_type.md) — Nested structures.

---

## 2. Term Category


**Query Feature (nested field destructuring expression)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In document-oriented databases, records frequently store deeply nested objects (e.g. `address: { street: "123 Main", city: "London", country: "UK", zip: "EC1A" }`).
If you want to project multiple fields from that nested object:
- Standard SQL requires repetitive dot notation: `SELECT address.street, address.city, address.country FROM user;`
- This makes query projections long and tedious to write.

We designed **Destructuring & Object Notation** in SurrealQL to match JavaScript-style destructuring. By writing `SELECT address.{city, country} FROM user`, you extract multiple nested fields in a single, concise expression. SurrealDB returns a clean object containing only those requested sub-fields.

---

### (2) Syntax Variants

1. **Destructuring Sub-fields:**
   `SELECT address.{city, zip} FROM user;`
   - Returns: `[ { "address": { "city": "London", "zip": "EC1A" } } ]`

2. **Aliasing Destructured Paths:**
   `SELECT address.city AS city, address.zip AS zip FROM user;`
   - Flattens destructured values to root properties.

3. **Wildcard Object Extraction:**
   `SELECT address.* FROM user;`
   - Extracts all properties of the `address` object.

---

### (3) Reality Metaphor (Custom Gift Baskets)
Imagine selecting items from a large hamper:
- **Repetitive Dot Notation:** Asking for: *"The hamper's apples, the hamper's oranges, and the hamper's grapes."*
- **Destructuring Notation (`object.{...}`):** Pointing at the hamper and saying: *"From the fruit basket, give me `{apples, oranges, grapes}`."* It is a single, clear request.

---

### (4) Code Examples

#### Using Destructuring in SurrealQL

```sql
-- 1. Extract multiple sub-properties from a nested object
SELECT name, address.{street, city} FROM user;

-- 2. Destructure multiple nested objects in one query
SELECT 
  id,
  profile.{first_name, last_name},
  settings.{theme, notifications}
FROM account;

-- 3. Combine destructuring with record link fields
SELECT title, author.{name, email} FROM post FETCH author;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Placing spaces between the object name and the dot-bracket syntax, causing parser errors

**The mistake:** Writing `SELECT address . {city, zip} FROM user;` or `SELECT address {city, zip} FROM user;`.

**Why it's wrong:** The destructuring operator must be attached directly to the parent field name via a dot (`object.{...}`). Leaving spaces or omitting the dot causes a syntax parser failure.

**Fix: Write the dot and braces immediately after the object field name:**

```sql
-- BAD
SELECT address {city, zip} FROM user;

-- GOOD
SELECT address.{city, zip} FROM user;
```

---



### Mistake 2: Attempting Object Destructuring on Non-Existent Nested Keys

**The mistake:** Writing `SELECT address.{ street, zip } FROM user;` when `address` is `NONE`.

**Why it's wrong:** Destructuring `NONE` fields returns `NONE` for extracted keys. Use `WHERE address IS NOT NONE` to guard destructuring.

*Incorrect:*
```surrealql
SELECT address.{ street, zip } FROM user; // Evaluates to NONE if address key is absent
```

*Fix:*
```surrealql
SELECT address.{ street, zip } FROM user WHERE address IS NOT NONE;
```

### Mistake 3: Confusing Object Destructuring Syntax `{ field1, field2 }` with JSON Object Creation

**The mistake:** Writing `SELECT { name: name, age: age } FROM user;` when `field.{ ... }` path destructuring was intended.

**Why it's wrong:** `path.{ f1, f2 }` unwraps nested keys from `path`. `{ k: v }` constructs a new JSON object.

*Incorrect:*
```surrealql
-- Expecting nested unwrapping
SELECT { theme: settings.theme } FROM user;
```

*Fix:*
```surrealql
SELECT settings.{ theme, mode } FROM user; // Path destructuring syntax
```

## 5. Practice Exercises

### Exercise 1: Destructuring Nested Object Properties

**Scenario:**
An API endpoint selects user `user:alice` and unpacks nested object `profile` directly into top-level result fields (`first_name`, `last_name`).

**Requirements:**
1. Create `user:alice` with nested object `profile = { first_name: "Alice", last_name: "Smith" }`.
2. Write a `SELECT` query destructuring `profile.*`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:alice SET profile = { first_name: "Alice", last_name: "Smith" };
> 
> -- Destructure nested profile object fields to top-level
> SELECT profile.* FROM user:alice;
> ```
>
> #### Technical Explanation
>
> 1. `SELECT object.*` unpacks nested object properties into top-level result JSON keys.
> 2. Eliminates manual field aliasing (`profile.first_name AS first_name`).
> 3. Simplifies REST API response payload structuring.
> 
---

### Exercise 2: Selective Destructuring with Aliases

**Scenario:**
Destructure specific nested fields from `address` while renaming `street` to `street_address`.

**Requirements:**
1. Select `address.street AS street_address` and `address.city`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:bob SET address = { street: "123 Main St", city: "Austin" };
> 
> -- Selective field destructuring with alias
> SELECT address.street AS street_address, address.city FROM user:bob;
> ```
>
> #### Technical Explanation
>
> 1. Dot-notation projection extracts specific nested properties cleanly.
> 2. Aliasing (`AS street_address`) renames output properties.
> 3. Prevents fetching unneeded object properties.
> 
---

### Exercise 3: Destructuring Fetched Record Link Documents

**Scenario:**
Fetch linked `company` record on `user:alice` and destructure the company's fields directly into the output.

**Requirements:**
1. Fetch `company` and project `company.name` and `company.industry`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE company:acme SET name = "Acme Corp", industry = "Tech";
> CREATE user:alice SET company = company:acme;
> 
> SELECT company.name, company.industry FROM user:alice FETCH company;
> ```
>
> #### Technical Explanation
>
> 1. Combines `FETCH` pointer resolution with property destructuring.
> 2. Unpacks foreign record fields inline.
> 3. Avoids multi-stage join queries.
> 
---



## 6. Related Terms

- [`SELECT`](../level_03/select.md) — The query statement.
- [`object`](../level_02/object_type.md) — Nested structures.

---

## 7. Key Takeaways
- Object destructuring uses `object.{field1, field2}` syntax.
- Eliminates repetitive dot-notation path references in `SELECT` projections.
- Matches modern JavaScript object destructuring mental models.
- Works on nested JSON objects, record links, and sub-queries.
- Syntax requires no spaces between field name, dot, and braces.
