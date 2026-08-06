# `DEFAULT` Value

> **Level 2 — Core Data Types & Constraints**
> A column configuration rule that automatically assigns a predefined fallback value (static or dynamic) to a cell if an insert query does not explicitly specify one.

---

## 1. Prerequisites
- [Data Types (Overview)](data_types.md) — Understanding database column typing.

---

## 2. Term Category

**Constraint** (Automatic Fallback Value): A `DEFAULT` clause assigns a static value or dynamic expression to a column when an `INSERT` statement omits explicit column values.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Evaluated by the query parser during insert translation. Dynamic functions like `NOW()` resolve to the transaction time offset).

### (1) Design Motivation — "Why did we design this?"
When writing software applications, you often want new records to start with standardized baseline details:
-   A new user account should start with `is_active` set to `TRUE`.
-   The registration timestamp `created_at` should automatically record the exact moment the user registered.
-   A new product stock count should start at `0`.

If you do not use defaults, you force your application developers to write these variables into every single `INSERT` script in their backend code:

```javascript
// Redundant app logic forcing defaults
const query = 'INSERT INTO users (username, is_active, created_at) VALUES ($1, true, NOW())';
```

If a developer forgets to include `is_active: true`, the database writes `NULL`, causing application errors.

We designed the **`DEFAULT`** constraint to handle this. By storing the default rules directly in the database schema:
-   You guarantee data consistency across all applications sharing the database.
-   You simplify application write queries.
-   You can evaluate dynamic variables (like the current server date) at the absolute moment the database receives the record.

---

### (2) Static vs. Dynamic Defaults
-   **Static Defaults:** Hardcoded constants that do not change (e.g. `DEFAULT 0`, `DEFAULT 'pending'`).
-   **Dynamic Defaults:** Functions evaluated on-the-fly for every write (e.g. `DEFAULT NOW()`, `DEFAULT CURRENT_DATE`).

---

### (3) Reality Metaphor
Imagine booking an airline flight:
-   When filling out the checkout screen, the dropdown box for "Meal Preference" starts selected as `Standard (No Preference)`.
-   If you do not click the dropdown or change the option, the booking system uses that default.
-   The default saves you time and ensures that everyone gets a meal, even if they completely ignored the checkbox options.

---

### (4) Code Examples

#### Enforcing Defaults
In SQL, you write the `DEFAULT` keyword after the data type definition:

```sql
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'available', -- Static default
  created_at TIMESTAMPTZ DEFAULT NOW()     -- Dynamic default (current time)
);
```

#### Triggering Defaults via Omission
To trigger a default, simply leave the column name and value out of your `INSERT` query parameters:

```sql
-- We only provide id and event_name
INSERT INTO tickets (id, event_name) 
VALUES (1, 'Rock Concert');

SELECT * FROM tickets;
-- Output:
-- id |  event_name  |  status   |          created_at          
-- ---+--------------+-----------+------------------------------
-- 1  | Rock Concert | available | 2026-07-21 18:35:00+00
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting defaults to overwrite explicit NULL inserts

**The mistake:** Explicitly passing `NULL` to a column and expecting the database to replace it with the defined `DEFAULT` value:

```sql
-- This inserts NULL, completely bypassing the default value 'available'!
INSERT INTO tickets (id, event_name, status) 
VALUES (2, 'Jazz Festival', NULL);

SELECT * FROM tickets WHERE id = 2;
-- Output shows status is NULL, not 'available'!
```

**Why it's wrong:** The `DEFAULT` rule only runs if a column is **completely missing** from the `INSERT` query. If you specify `status` in the column list and pass `NULL` as the value, the database obeys your explicit instruction and writes `NULL`.

**Fix: To prevent this, combine the `DEFAULT` rule with a `NOT NULL` constraint. This forces the database to reject explicit `NULL` writes while still allowing default fallback behavior for omitted columns.**

```sql
/* Correct approach */
status VARCHAR(20) DEFAULT 'available' NOT NULL
```

---



### Mistake 2: Expecting `DEFAULT` Expressions to Replace Explicit `NULL` Insert Inputs

**The mistake:** Executing `INSERT INTO users (name, status) VALUES ('Alice', NULL);` expecting `status` default `'active'`. 

**Why it's wrong:** In SQL, inserting explicit `NULL` assigns `NULL` to the column, bypassing default expressions! Defaults apply ONLY when the column key is omitted from insertion statements.

*Incorrect:*
```sql
INSERT INTO users (name, status) VALUES ('Alice', NULL); -- Sets status = NULL!
```

*Fix:*
```sql
INSERT INTO users (name) VALUES ('Alice'); -- Omits column to trigger DEFAULT 'active'
```

### Mistake 3: Using Volatile Functions Without Understanding Dynamic Execution in DEFAULTs

**The mistake:** Expecting `DEFAULT gen_random_uuid()` to compute static values at table creation time.

**Why it's wrong:** Dynamic functions inside `DEFAULT` clauses (like `gen_random_uuid()` or `NOW()`) evaluate dynamically on EVERY row insertion.

*Incorrect:*
```sql
-- Expecting default to be evaluated once at table creation time
```

*Fix:*
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid() -- Generates new UUID per row
```

## 5. Practice Exercises

### Exercise 1: Assigning Static and Dynamic Defaults

**Scenario:**
Create a `user_preferences` table with static default `theme = 'light'` and dynamic default `updated_at = CURRENT_TIMESTAMP`.

**Requirements:**
1. Execute `CREATE TABLE user_preferences (...)`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> CREATE TABLE user_preferences (
>   user_id INTEGER PRIMARY KEY,
>   theme TEXT NOT NULL DEFAULT 'light',
>   notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
>   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
> );
> ```
>
> #### Technical Explanation
>
> 1. Static defaults (`DEFAULT 'light'`) assign hardcoded fallback values when `INSERT` omits the column.
> 2. Dynamic defaults (`DEFAULT CURRENT_TIMESTAMP`) evaluate runtime SQL functions during row creation.
> 3. Ensures mandatory non-null fields are populated automatically.
> 
---

### Exercise 2: Altering Default Column Values

**Scenario:**
Change the default theme preference from `'light'` to `'dark'` for future row insertions.

**Requirements:**
1. Execute `ALTER TABLE user_preferences ALTER COLUMN theme SET DEFAULT 'dark'`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> ALTER TABLE user_preferences 
> ALTER COLUMN theme SET DEFAULT 'dark';
> ```
>
> #### Technical Explanation
>
> 1. `ALTER COLUMN ... SET DEFAULT` changes the default expression for future row inserts.
> 2. Does NOT retroactively modify values in existing rows.
> 3. Executes instantly without requiring table rewrites.
> 
---

### Exercise 3: Overriding Column Defaults with Explicit Values

**Scenario:**
Demonstrate inserting a row relying on defaults vs providing explicit column values.

**Requirements:**
1. Code `INSERT` using `DEFAULT` keywords.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> -- Relying on defaults
> INSERT INTO user_preferences (user_id) VALUES (101);
> 
> -- Overriding defaults explicitly
> INSERT INTO user_preferences (user_id, theme, notifications_enabled) 
> VALUES (102, 'custom_blue', FALSE);
> ```
>
> #### Technical Explanation
>
> 1. Omitting a column in `INSERT INTO` causes PostgreSQL to apply its `DEFAULT` expression.
> 2. Explicitly supplying values overrides default assignments.
> 3. Provides clean fallback semantics for client API requests.
> 
---



## 6. Related Terms
- [Data Types (Overview)](data_types.md) — The typing foundation.
- [`NOT NULL` Constraint](not_null.md) — Often paired with defaults.

---

## 7. Key Takeaways
- The `DEFAULT` constraint automatically fills columns when they are omitted during inserts.
- Supports static defaults (like `'pending'`, `0`) and dynamic defaults (like `NOW()`).
- Storing default rules in the database guarantees consistency across different applications.
- Passing an explicit `NULL` value bypasses the default rule, writing `NULL`.
- Combine `DEFAULT` with `NOT NULL` to block custom `NULL` writes while keeping fallbacks.
