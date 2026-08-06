# `ENUM` Type

> **Level 6 — Schema Design & Normalization**
> A custom PostgreSQL User-Defined Type (UDT) that restricts a column's values to a static, predefined list of text labels, enforcing strict data validation.

---

## 1. Prerequisites
- [Data Types (Overview)](../level_02/data_types.md) — The parent database typing standard.

---

## 2. Term Category

**Data Type** (Custom Enumerated Data Type): `CREATE TYPE ... AS ENUM` defines a custom static enumerated data type containing a fixed set of allowed string label values.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Specific** (A custom User-Defined Type (UDT). Standard SQL supports enums via CHECK constraints, but Postgres stores enums as highly optimized 4-byte internal binary keys).

### (1) Design Motivation — "Why did we design this?"
In database schemas, columns often represent a fixed set of options:
-   An order's status: `'pending'`, `'shipped'`, `'delivered'`, `'cancelled'`.
-   A user's role: `'admin'`, `'manager'`, `'employee'`.

If you store these as simple text columns (`VARCHAR`):
-   **No validation:** A developer can write typos (e.g. `'shippped'` with three 'p's, or `'Delivered'` with a capital 'D'), which corrupts reports.
-   **Wasted space:** Storing the string `'cancelled'` millions of times consumes significant disk sectors.

You could use a lookup table (e.g. joining a `roles` table), but that requires running slow `JOIN` queries every time you load user lists.

PostgreSQL designed the **`ENUM`** (Enumerated) type to solve this:
1.  You define the list of valid choices once at the database level.
2.  Postgres translates the strings to 4-byte integer keys on disk, saving storage space.
3.  When querying, Postgres automatically displays the values as clean strings.
4.  If a client tries to write a value outside the enum list, the transaction is rejected.

---

### (2) Volatile vs. Static Lists
Enums are excellent, but they are **static**. 

Adding a new option to an enum requires a database schema migration query (`ALTER TYPE ... ADD VALUE`). 

Removing an option is extremely difficult.
-   **Use Enums** for lists that almost never change (e.g. roles, order statuses, transaction classes).
-   **Do NOT use Enums** for lists that grow or change frequently (e.g. product categories, country codes). Use a standard lookup table with foreign keys instead.

---

### (3) Reality Metaphor
Imagine a fan speed controller switch:
-   The switch has exactly 4 physical click notches: `[Off, Low, Medium, High]`.
-   You cannot twist the dial to `Super Fast` because the physical slot does not exist. The mechanical notches prevent mistakes.
-   However, if you want to add a `Turbo` speed in the future, you have to buy a new switch box and rewrite the home electrical cables (the database migration).

---

### (4) Code Examples

#### Creating and Using ENUMs
Creating an enum is a two-step process:

```sql
-- Step 1: Create the custom User-Defined Type (UDT)
CREATE TYPE order_status AS ENUM ('pending', 'shipped', 'delivered');

-- Step 2: Use the new type inside your table schema
CREATE TABLE orders (
  id INT PRIMARY KEY,
  amount NUMERIC(10,2),
  status order_status NOT NULL DEFAULT 'pending' -- Enum column
);
```

#### Typo Validation Rejection
Let's see the type safety in action:

```sql
-- Success: matches 'shipped' exactly
INSERT INTO orders VALUES (1, 45.00, 'shipped');

-- Fails: 'SHIPPED' (uppercase) is not in the enum list!
INSERT INTO orders VALUES (2, 20.00, 'SHIPPED');
-- ERROR: invalid input value for enum order_status: "SHIPPED"
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using ENUMs for volatile datasets that change frequently

**The mistake:** Creating an enum for product categories: `CREATE TYPE category AS ENUM ('books', 'electronics');` and adding values as your store expands.

**Why it's wrong:** Every time your company adds a product type (e.g. 'groceries'), you must run a DDL migration `ALTER TYPE category ADD VALUE 'groceries';`. 

More importantly, **Postgres does not support deleting values from an enum**. 

If you discontinue the 'books' category, you cannot delete the enum slot without dropping and recreating the entire database type, which is highly complex.

**Fix: For lists that change regularly, use a standard parent table `categories` and link tables using foreign keys.**

---



### Mistake 2: Attempting to Remove Values from Custom PostgreSQL ENUM Types Directly

**The mistake:** Executing `ALTER TYPE status_enum DROP VALUE 'deprecated';`.

**Why it's wrong:** PostgreSQL does NOT support dropping values from custom ENUM types directly! Removing an ENUM value requires creating a new type, altering table columns, and dropping the old type.

*Incorrect:*
```sql
ALTER TYPE status_enum DROP VALUE 'deprecated'; -- ❌ Error: dropping enum values unsupported!
```

*Fix:*
```sql
Use check constraints CHECK (status IN ('active', 'pending')) for dynamic status lists
```

### Mistake 3: Using ENUM Types for Frequently Changing Dynamic Domain Lists

**The mistake:** Using `CREATE TYPE country_enum AS ENUM (...)` for country lists updated monthly.

**Why it's wrong:** ENUM types are stored in system catalogs. Frequently altering ENUM types requires catalog lock acquisitions. Use a separate `countries` lookup table with foreign keys for dynamic lists.

*Incorrect:*
```sql
// Using custom ENUM for monthly updated status types
```

*Fix:*
```sql
Use a lookup table with foreign key reference for dynamic category lists
```

## 5. Practice Exercises

### Exercise 1: Creating Custom Enumerated Types (`CREATE TYPE ... AS ENUM`)

**Scenario:**
Create a custom enum type `order_status` with values `'pending'`, `'processing'`, `'shipped'`, `'delivered'`, `'cancelled'`.

**Requirements:**
1. Execute `CREATE TYPE order_status AS ENUM (...)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TYPE order_status AS ENUM (
>   'pending', 
>   'processing', 
>   'shipped', 
>   'delivered', 
>   'cancelled'
> );
> 
> CREATE TABLE orders (
>   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
>   status order_status NOT NULL DEFAULT 'pending'
> );
> ```
>
> #### Technical Explanation
>
> 1. `CREATE TYPE ... AS ENUM` defines a strongly-typed static set of allowed string labels.
> 2. Stores enum values internally as 4-byte OID integers, saving disk space compared to raw `TEXT`.
> 3. Automatically rejects invalid status strings at the database boundary.

---

### Exercise 2: Altering ENUM Types to Add New Values

**Scenario:**
Add a new enum value `'refunded'` to `order_status` after `'delivered'`.

**Requirements:**
1. Execute `ALTER TYPE order_status ADD VALUE 'refunded' AFTER 'delivered'`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> ALTER TYPE order_status 
> ADD VALUE 'refunded' AFTER 'delivered';
> ```
>
> #### Technical Explanation
>
> 1. `ALTER TYPE ... ADD VALUE` adds new labels to existing enum types online.
> 2. Does NOT require rewriting underlying table heap pages.
> 3. Fast schema alteration.

---

### Exercise 3: Trade-Off Analysis: ENUM Types vs Foreign Key Lookup Tables

**Scenario:**
Compare PostgreSQL `ENUM` types vs a lookup table `statuses` with a foreign key constraint.

**Requirements:**
1. Contrast flexibility, migration speed, and dynamic status addition.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Status Representation Selection Matrix:
> - ENUM Type: High performance (4 bytes), type-safe, BUT removing/renaming values requires complex DDL.
> - Lookup Table + FK: Highly flexible (add/remove statuses via simple INSERT/DELETE DML), BUT requires JOINs for queries.
> Recommendation: Use ENUM for fixed domain states; use Lookup Tables for user-managed dynamic categories.
> ```
>
> #### Technical Explanation
>
> 1. ENUM types are ideal for static application constants (e.g. user roles: `'admin'`, `'user'`).
> 2. Foreign key lookup tables are ideal for categories managed by application admins via UI dashboards.
> 3. Match implementation to domain lifecycle.

---



## 6. Related Terms
- [Data Types (Overview)](../level_02/data_types.md) — The parent typing system.
- [`ALTER TABLE`](alter_table.md) — Editing schemas.

---

## 7. Key Takeaways
- `ENUM` is a custom PostgreSQL data type containing a static list of text labels.
- Enforces strict type validation, blocking database typos.
- Stores values on disk as 4-byte keys, optimizing storage sizes.
- Displays values automatically as clean strings, eliminating the need for lookup joins.
- Use only for static lists; avoid enums for volatile lists that change regularly.
- Adding enum values requires migrations; deleting enum values is not supported.
