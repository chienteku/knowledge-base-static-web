# `VALUE` / `DEFAULT` / `READONLY` Clause

> **Level 4 — Schema Definition & Constraints**
> The three schema modifiers in SurrealDB field definitions that control property values: setting creation fallbacks (`DEFAULT`), computing values dynamically (`VALUE`), or blocking modifications (`READONLY`).

---

## 1. Prerequisites
- [`DEFINE FIELD`](define_field.md) — The parent schema context.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed during the write transaction pipeline. Field modifiers are executed in memory by the engine before serialization).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Behavior Prediction

**Problem:** You have a `user` table with this schema:
```sql
DEFINE FIELD points ON user TYPE int DEFAULT 100;
DEFINE FIELD tier ON user TYPE string VALUE IF points >= 200 { "VIP" } ELSE { "Basic" };
```
Predict the values stored in `points` and `tier` for these write actions:
1.  `CREATE user:01;`
2.  `CREATE user:02 SET points = 250;`

**Expected output:**
```text
1. `points` = 100 (uses DEFAULT), `tier` = "Basic" (calculated using VALUE because points < 200).
2. `points` = 250 (overrides DEFAULT), `tier` = "VIP" (calculated using VALUE because points >= 200).
```

> [!check]- Answer
> - Identify when the `DEFAULT` clause is executed.
> - Recall that `VALUE` recalculates its expression on every insert, reading the active field values.

---



### Exercise 2: Configuring Readonly Timestamp

**Problem:** Define field `created_at` on `post` as `datetime` defaulting to `time::now()` and marked `READONLY`.

**Expected output:**
```text
DEFINE FIELD created_at ON TABLE post TYPE datetime DEFAULT time::now() READONLY;
```

> [!check]- Answer
> ```surrealql
> DEFINE FIELD created_at ON TABLE post TYPE datetime DEFAULT time::now() READONLY;
> ```
>
> **Explanation:** Combining `DEFAULT` and `READONLY` freezes creation timestamps at record instantiation time.

### Exercise 3: Dynamic Future Field Attribute

**Problem:** Define field `total` computing `count * price` dynamically on every query using `VALUE <future>`.

**Expected output:**
```text
DEFINE FIELD total ON TABLE invoice VALUE <future> { count * price };
```

> [!check]- Answer
> ```surrealql
> DEFINE FIELD total ON TABLE invoice VALUE <future> { count * price };
> ```
>
> **Explanation:** `VALUE <future>` computes dynamic expressions on demand when records are queried.

## 7. Related Terms
- [`DEFINE FIELD`](define_field.md) — The field declaration context.
- [Assertions (`ASSERT`)](field_assertions.md) — Field-level validation rules.

---

## 8. Key Takeaways
- `DEFAULT` sets creation fallbacks; `VALUE` computes values dynamically on every write.
- `READONLY` prevents fields from being modified after record creation.
- `DEFAULT` only runs on creation and allows client overrides.
- `VALUE` runs on both creates and updates, overriding client inputs.
- Use `$value` inside a `VALUE` expression to reference the user's submitted input.
- Combine `DEFAULT` and `READONLY` for immutable timestamps (`created_at`).
- Use `VALUE` to automate audit fields like `updated_at`.
