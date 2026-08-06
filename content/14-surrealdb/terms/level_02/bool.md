# `bool`

> **Level 2 — Data Types & Record Structure**
> The primitive boolean data type in SurrealDB that stores binary logical values, restricted strictly to the literals `true` or `false`.

---

## 1. Prerequisites

- [Data Types (Overview)](data_types.md) — The parent type system.

---

## 2. Term Category


**Data Type (boolean truth value type)**: - **Database Structure / Paradigm**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Boolean Flag Filtering and Defaults

**Scenario:**
You are defining a user account table where accounts must be inactive (`active = false`) by default until email verification is complete.

**Requirements:**
1. Define table `user` in `SCHEMAFULL` mode.
2. Define field `active` as `bool` with default value `false`.
3. Create user `user:u1` without specifying `active` to verify default behavior.
4. Select all active users using `WHERE active = true`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE user SCHEMAFULL;
> DEFINE FIELD active ON TABLE user TYPE bool DEFAULT false;
> 
> CREATE user:u1 SET email = "u1@example.com";
> 
> -- Select verified active users
> SELECT * FROM user WHERE active = true;
> ```
>
> #### Technical Explanation
>
> 1. `TYPE bool` restricts field values strictly to boolean `true` or `false`.
> 2. `DEFAULT false` automatically populates boolean flags when omitted from creation payloads.
> 3. Boolean conditions in `WHERE` clauses allow compact truthiness evaluation (`WHERE active`).
> 
---

### Exercise 2: Logical Operators and Truth Tables

**Scenario:**
A feature flag service determines feature visibility using boolean fields `is_beta_tester` and `has_paid_subscription`.

**Requirements:**
1. Create user `user:beta` with `is_beta_tester = true` and `has_paid_subscription = false`.
2. Query users who are either beta testers OR paid subscribers using boolean logical `OR`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE user:beta SET is_beta_tester = true, has_paid_subscription = false;
> 
> -- Filter users eligible for premium preview features
> SELECT * FROM user WHERE is_beta_tester = true OR has_paid_subscription = true;
> ```
>
> #### Technical Explanation
>
> 1. SurrealQL supports standard logical boolean operators (`AND`, `OR`, `NOT`).
> 2. Short-circuit evaluation short-circuits boolean expressions for optimized query execution.
> 3. Boolean flags simplify entitlement and feature gating query logic.
> 
---

### Exercise 3: Boolean Negation and Inverse Selection

**Scenario:**
An e-commerce cleanup task needs to find all unpublished or inactive product listings using boolean negation (`NOT` or `!= true`).

**Requirements:**
1. Insert product `product:draft` with `published = false`.
2. Write a query selecting all products where `published` is false using `NOT published`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE product:draft SET name = "Draft Item", published = false;
> 
> -- Select unpublished products using boolean negation
> SELECT * FROM product WHERE NOT published;
> ```
>
> #### Technical Explanation
>
> 1. `NOT` negates boolean truth values, evaluating `NOT false` to `true`.
> 2. `WHERE NOT published` is cleaner and equivalent to `WHERE published = false`.
> 3. Ensures unindexed boolean flags evaluate correctly without NULL coercions.
> 
---





## 6. Related Terms

- [Data Types (Overview)](data_types.md) — The parent type system.
- [Type Casting & Coercion](type_casting.md) — Converting between types.

---

## 7. Key Takeaways
- The `bool` type stores binary logical values (`true` or `false`).
- Direct NoSQL equivalent to PostgreSQL's `BOOLEAN` and MongoDB's Boolean BSON.
- Literals must be written in lowercase without quotes: `true` / `false`.
- Schema-full tables reject numbers (1/0) or strings ("true") in boolean fields.
- Use explicit casting (`<bool> 1`) if you need to coerce numbers to booleans.
- Shortcut queries can omit the `= true` operator (e.g. `WHERE active`).
- Minimizes database storage footprint and optimizes query logic checks.
