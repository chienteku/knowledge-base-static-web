# `VALUE` / `DEFAULT` / `READONLY` Clause

> **Level 4 — Schema Definition & Constraints**
> The three schema modifiers in SurrealDB field definitions that control property values: setting creation fallbacks (`DEFAULT`), computing values dynamically (`VALUE`), or blocking modifications (`READONLY`).

---

## 1. Prerequisites

- [`DEFINE FIELD`](define_field.md) — The parent schema context.

---

## 2. Term Category


**Schema & Modeling (field default and value attributes)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing applications, you need tools to maintain data integrity and automate calculations:
-   **Timestamps:** When creating a record, you want to set `created_at` automatically to the current time, but prevent clients from modifying it later.
-   **Computed Fields:** You want a field `fullname` to always combine `first_name` and `last_name`, without forcing your application code to calculate it on every write.
-   **Default Settings:** A user table should set `active = true` by default, but allow custom overrides during signup.

In standard SQL, you manage this using separate concepts: triggers, default values, and column constraints.

We designed the **`DEFAULT`**, **`VALUE`**, and **`READONLY`** clauses inside `DEFINE FIELD` to unify these rules in a single statement.

---

### (2) Modifiers Compared

#### 1. `DEFAULT <expression>`
Assigns a fallback value **only** if the field is omitted when the record is created. 
-   If the client passes a custom value, the default is skipped.
-   *Syntax:* `DEFAULT time::now()`

#### 2. `VALUE <expression>`
Forces the field to evaluate to the specified expression on **every write** (create and update). 
-   **KEY DIFFERENCE:** It ignores and overwrites whatever value the client submitted. 
-   Ideal for computed fields (e.g. `VALUE string::lowercase(email)`).
-   Use `$value` to reference the value the user submitted.

#### 3. `READONLY`
Locks the field's value after the record is created. 
-   Any subsequent update queries attempting to modify this field are blocked.
-   *Syntax:* `DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now() READONLY;`

---

### (3) Reality Metaphor (Checkpoint Stampers)
Imagine boxes entering a secure warehouse:
-   **`DEFAULT` Modifier:** An **Audit Assistant**. 
    -   If a box arrives with a missing "Date stamp", the assistant looks at the wall clock, stamps the current date, and lets it pass. 
    -   If you already wrote a date, they leave it alone.
-   **`VALUE` Modifier:** A **Stamping Machine Press**. 
    -   Even if you write "10" on the label, the machine wipes it, calculates a formula (e.g., box weight * rate), and stamps the computed price on it, overriding your input.
-   **`READONLY` Modifier:** An **Indelible Engraving**. 
    -   Once the serial number is engraved on the metal box during creation, any attempt to scratch it off or repaint it is rejected by security.

---

### (4) Code Examples

#### Applying Field Attributes in SurrealQL
Let's build a safe user profile schema:

```sql
DEFINE TABLE user SCHEMAFULL;

-- 1. Use DEFAULT to set a creation fallback (allows overrides)
DEFINE FIELD active ON user TYPE bool DEFAULT true;

-- 2. Use VALUE to enforce case normalization (Computed field!)
-- Overwrites input to make emails lowercase, regardless of client casing!
DEFINE FIELD email ON user TYPE string VALUE string::lowercase($value);

-- 3. Use VALUE to construct a full name from other fields
DEFINE FIELD fullname ON user TYPE string VALUE name.first + " " + name.last;

-- 4. Use DEFAULT and READONLY together for immutable timestamps
DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now() READONLY;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using 'DEFAULT' instead of 'VALUE' for computed fields, expecting the database to recalculate values during updates

**The mistake:** Defining a field as `DEFINE FIELD updated_at ON user TYPE datetime DEFAULT time::now();` and expecting it to refresh automatically when the user's name is updated.

**Why it's wrong:** The `DEFAULT` clause only executes once—when the record is created. 

Subsequent updates ignore `DEFAULT` and preserve the existing timestamp.

**Fix: Use the `VALUE` clause to ensure the field recalculates on every write transaction:**

```sql
-- CORRECT (Refreshes timestamp on every update!)
DEFINE FIELD updated_at ON user TYPE datetime VALUE time::now();
```

---



### Mistake 2: Confusing `VALUE` Initializers with `DEFAULT` Value Clauses

**The mistake:** Using `DEFAULT` expecting a field value to update dynamically upon every record mutation.

**Why it's wrong:** `DEFAULT` assigns a value ONLY when the field is omitted during record creation. `VALUE` re-evaluates the field expression on EVERY creation and update.

*Incorrect:*
```surrealql
-- Expecting updated_at to refresh on UPDATE automatically:
DEFINE FIELD updated_at ON TABLE user TYPE datetime DEFAULT time::now(); // ❌ Only runs on CREATE!
```

*Fix:*
```surrealql
DEFINE FIELD updated_at ON TABLE user TYPE datetime VALUE time::now(); // Runs on every CREATE & UPDATE
```

### Mistake 3: Marking Modifiable Fields as `READONLY`

**The mistake:** Adding `READONLY` to fields that need to be updated later by application code.

**Why it's wrong:** `READONLY` permits writing the field value ONLY during initial record `CREATE`. Subsequent `UPDATE` statements modifying `READONLY` fields throw an error.

*Incorrect:*
```surrealql
DEFINE FIELD status ON TABLE user TYPE string READONLY;
UPDATE user:1 SET status = "active"; // ❌ Cannot modify READONLY field!
```

*Fix:*
```surrealql
DEFINE FIELD created_at ON TABLE user TYPE datetime READONLY; // Ideal for creation timestamps
```

## 5. Practice Exercises

### Exercise 1: Readonly Audit Timestamps

**Scenario:**
Configure an immutable `created_at` field on table `order` that defaults to `time::now()` and cannot be modified after creation.

**Requirements:**
1. Define field `created_at` on table `order` as `datetime`.
2. Apply `DEFAULT time::now()` and `READONLY`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE order SCHEMAFULL;
> DEFINE FIELD created_at ON TABLE order TYPE datetime 
>     DEFAULT time::now() 
>     READONLY;
> 
> CREATE order:o1;
> ```
>
> #### Technical Explanation
>
> 1. `READONLY` locks field values against subsequent updates.
> 2. `DEFAULT time::now()` populates creation timestamps automatically.
> 3. Guarantees audit trail immutability.

---

### Exercise 2: Calculated Fields with `VALUE` Attributes

**Scenario:**
Define a dynamically calculated field `full_name` on table `user` that automatically concatenates `first_name` and `last_name`.

**Requirements:**
1. Define field `full_name` on table `user` as `string`.
2. Apply `VALUE string::join(" ", $parent.first_name, $parent.last_name)`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE user SCHEMAFULL;
> DEFINE FIELD first_name ON TABLE user TYPE string;
> DEFINE FIELD last_name ON TABLE user TYPE string;
> DEFINE FIELD full_name ON TABLE user TYPE string 
>     VALUE string::join(" ", $parent.first_name, $parent.last_name);
> 
> CREATE user:u1 SET first_name = "Jane", last_name = "Doe";
> ```
>
> #### Technical Explanation
>
> 1. `VALUE <expr>` evaluates calculated field expressions automatically during writes.
> 2. `$parent` accesses sibling fields on the current record object.
> 3. Replaces SQL generated columns and computed properties.

---

### Exercise 3: Field-Level Row Security with `PERMISSIONS`

**Scenario:**
Restrict access to a user's `ssn` (Social Security Number) field so that only the account owner (`id = $auth.id`) can view it.

**Requirements:**
1. Define field `ssn` on table `user` with `PERMISSIONS FOR select WHERE id = $auth.id`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE FIELD ssn ON TABLE user TYPE string 
>     PERMISSIONS FOR select WHERE id = $auth.id;
> ```
>
> #### Technical Explanation
>
> 1. `PERMISSIONS` clauses enforce row and field-level security directly in database queries.
> 2. `$auth.id` checks active client session authentication tokens.
> 3. Redacts unauthorized fields automatically from query result payloads.

---



## 6. Related Terms

- [`DEFINE FIELD`](define_field.md) — The field declaration context.
- [Assertions (`ASSERT`)](field_assertions.md) — Field-level validation rules.

---

## 7. Key Takeaways
- `DEFAULT` sets creation fallbacks; `VALUE` computes values dynamically on every write.
- `READONLY` prevents fields from being modified after record creation.
- `DEFAULT` only runs on creation and allows client overrides.
- `VALUE` runs on both creates and updates, overriding client inputs.
- Use `$value` inside a `VALUE` expression to reference the user's submitted input.
- Combine `DEFAULT` and `READONLY` for immutable timestamps (`created_at`).
- Use `VALUE` to automate audit fields like `updated_at`.
