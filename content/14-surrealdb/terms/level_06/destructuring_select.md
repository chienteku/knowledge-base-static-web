# Destructuring & Object Notation in SELECT

> **Level 6 — Advanced Querying & Functions**
> The SurrealQL syntax pattern that allows selecting specific sub-properties from nested objects using destructuring bracket notation (`SELECT object.{field1, field2}`), eliminating repetitive dot-notation path references.

---

## 1. Prerequisites
- [SELECT](../level_03/select.md) — The query statement.
- [Object Type](../level_02/object_type.md) — Nested structures.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Parsed during the query projection phase. Extracts listed keys from nested memory objects into the output stream).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Destructuring Query Formulation

**Problem:** You have a `company` table with a nested `contact` object (`contact: { phone: "555-0199", email: "info@corp.com", fax: "555-0100" }`).
Write the SurrealQL query to retrieve the company `name` along with only the `phone` and `email` properties from the `contact` object using destructuring notation.

**Expected output:**
```sql
SELECT name, contact.{phone, email} FROM company;
```

> [!check]- Answer
> - Attach the brace list directly to `contact.`.
> - Include `phone` and `email` inside `{}`.

---



### Exercise 2: Nested Path Destructuring

**Problem:** Select `street` and `city` from nested `address` object using destructuring syntax `address.{ street, city }`.

**Expected output:**
```text
SELECT address.{ street, city } FROM user;
```

> [!check]- Answer
> ```surrealql
> SELECT address.{ street, city } FROM user;
> ```
>
> **Explanation:** `path.{ f1, f2 }` unwraps specified nested fields into top-level projections.

### Exercise 3: Multi-Level Object Destructuring

**Problem:** Select `profile.name` and `settings.theme` using multi-path projection.

**Expected output:**
```text
SELECT profile.name, settings.theme FROM user;
```

> [!check]- Answer
> ```surrealql
> SELECT profile.name, settings.theme FROM user;
> ```
>
> **Explanation:** Dot-notation path projection extracts specific properties across nested objects.

## 7. Related Terms
- [SELECT](../level_03/select.md) — The query statement.
- [Object Type](../level_02/object_type.md) — Nested structures.

---

## 8. Key Takeaways
- Object destructuring uses `object.{field1, field2}` syntax.
- Eliminates repetitive dot-notation path references in `SELECT` projections.
- Matches modern JavaScript object destructuring mental models.
- Works on nested JSON objects, record links, and sub-queries.
- Syntax requires no spaces between field name, dot, and braces.
