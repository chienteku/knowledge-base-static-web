# `bool`

> **Level 2 — Data Types & Record Structure**
> The primitive boolean data type in SurrealDB that stores binary logical values, restricted strictly to the literals `true` or `false`.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — The parent type system.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **SurrealDB Core** (Enforced at the parser level. Used by query optimization execution planners to resolve logical filters).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Applications frequently need to store simple, two-state flags:
-   Is this account verified? (`true` or `false`)
-   Is the product in stock? (`true` or `false`)
-   Has this email been sent? (`true` or `false`)

Historically, early database developers used integers (like `1` for yes, `0` for no) or characters (`Y` and `N`) to represent these flags. 

This led to inconsistent coding patterns and wasted storage space.

We designed the native **`bool`** type in SurrealDB to enforce standard binary logic. 

It holds exactly one of two values: `true` or `false`. 

Using a native boolean type improves query readability, optimizes index storage footprint, and ensures consistent logical checks in your backend application.

---

### (2) Boolean Logic
In SurrealQL, booleans are written in lowercase: `true` and `false`. 
-   They are used inside conditional statements (`IF/ELSE`) and query filter clauses.
-   **No Truthy/Falsy Coercion in Schema-Full:** If a field is typed as `bool` in a `SCHEMAFULL` table, SurrealDB will reject values like `"true"` (string), `1` (number), or empty arrays, forcing the application to pass exact boolean literals.

---

### (3) Reality Metaphor (The Light Switch)
Imagine a simple electrical toggle:
-   **`bool` Type:** A **Standard Wall Light Switch**. 
    -   It has exactly two physical resting positions: **ON** (true) or **OFF** (false). 
    -   There is no intermediate dimmer dial, and you cannot place a postcard in the slot. 
    -   It is a clean binary toggle.

---

### (4) Code Examples

#### Creating and Querying Boolean Fields
Let's model an email subscription flags schema:

```sql
DEFINE TABLE newsletter_subscription SCHEMAFULL;

-- 1. Enforce boolean type
DEFINE FIELD email ON newsletter_subscription TYPE string;
DEFINE FIELD active ON newsletter_subscription TYPE bool;

-- 2. Insert records using boolean literals (no quotes!)
CREATE newsletter_subscription:01 SET
  email = "user1@example.com",
  active = true;

CREATE newsletter_subscription:02 SET
  email = "user2@example.com",
  active = false;

-- 3. Query records using boolean filters
SELECT * FROM newsletter_subscription WHERE active = true;

-- Shortcut: Under SQL rules, you can omit '= true' for boolean fields:
SELECT * FROM newsletter_subscription WHERE active;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to insert integer codes (like 1 or 0) into fields defined as 'bool' in schema-full tables

**The mistake:** Running the insert statement `CREATE sub:01 SET active = 1;` expecting SurrealDB to automatically convert `1` to `true`.

**Why it's wrong:** Under strict `SCHEMAFULL` rules, SurrealDB's type-checker blocks mismatched types. 

An integer (`int`) is not a boolean (`bool`), so the write fails with a validation crash:
`Database validation error: Field 'active' expects type bool, got 1`

**Fix: Always pass the clean literal values `true` or `false` in your database query writes. If your application sends integer codes, cast them in your script: `active = <bool> 1`.**

---



### Mistake 2: Quoting Booleans as String Literals in SurrealQL Queries

**The mistake:** Writing `WHERE active = 'true'` in SurrealQL.

**Why it's wrong:** Quoted `'true'` is a string! Unquoted `true` is a boolean primitive. Comparing string `'true'` to boolean `true` returns false.

*Incorrect:*
```surrealql
SELECT * FROM user WHERE active = "true"; // ❌ String is not equal to boolean true!
```

*Fix:*
```surrealql
SELECT * FROM user WHERE active = true; // Unquoted boolean primitive
```

### Mistake 3: Expecting Truthiness Coercion on Empty Objects or Non-Zero Numbers

**The mistake:** Writing `WHERE settings` expecting empty object `{}` to evaluate to false.

**Why it's wrong:** SurrealQL evaluates strict boolean logic. Objects, non-empty strings, and numbers are not automatically coerced in boolean contexts without explicit type casting `type::bool()`.

*Incorrect:*
```surrealql
SELECT * FROM user WHERE settings; // Does not perform implicit JS-style truthiness check
```

*Fix:*
```surrealql
SELECT * FROM user WHERE type::bool(settings);
```

## 6. Practice Exercises

### Exercise 1: Boolean Filter Analysis

**Problem:** You have a `products` table where the `in_stock` field is defined as `TYPE bool`. 
Select the queries below that will execute successfully and return documents where `in_stock` is active:
1.  `SELECT * FROM products WHERE in_stock = "true";`
2.  `SELECT * FROM products WHERE in_stock = true;`
3.  `SELECT * FROM products WHERE in_stock;`

**Expected output:**
> [!check]- Answer
> ```text
> Queries 2 and 3 will execute successfully.
> - Query 1 fails to find matches because `"true"` is a string, not a boolean literal.
> - Query 2 is a standard boolean equality check.
> - Query 3 is a valid SQL shortcut that automatically filters for truthy boolean values.
> ```
> - Determine if string quotes change the data type of the filter value.
> - Recall the shortcut rules for evaluating boolean fields in SQL.

---



### Exercise 2: Boolean Field Assertion

**Problem:** Define field `is_admin` on `user` as boolean type defaulting to `false`.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE FIELD is_admin ON TABLE user TYPE bool DEFAULT false;
> ```
> ```surrealql
> DEFINE FIELD is_admin ON TABLE user TYPE bool DEFAULT false;
> ```
>
> **Explanation:** `TYPE bool DEFAULT false` sets boolean field constraints and default values.

---

### Exercise 3: Explicit Boolean Type Casting

**Problem:** Cast string `"true"` to boolean using `<bool>` or `type::bool()`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> ```
> ```surrealql
> RETURN <bool> "true";
> ```
>
> **Explanation:** Casting `<bool>` parses valid boolean representations into boolean primitives.

## 7. Related Terms
- [Data Types (Overview)](data_types.md) — The parent type system.
- [Type Casting & Coercion](type_casting.md) — Converting between types.

---

## 8. Key Takeaways
- The `bool` type stores binary logical values (`true` or `false`).
- Direct NoSQL equivalent to PostgreSQL's `BOOLEAN` and MongoDB's Boolean BSON.
- Literals must be written in lowercase without quotes: `true` / `false`.
- Schema-full tables reject numbers (1/0) or strings ("true") in boolean fields.
- Use explicit casting (`<bool> 1`) if you need to coerce numbers to booleans.
- Shortcut queries can omit the `= true` operator (e.g. `WHERE active`).
- Minimizes database storage footprint and optimizes query logic checks.
