# Querying `null` and Missing Fields

> **Level 4 — Advanced Querying**
> The query behavior in MongoDB where matching a field to `null` retrieves both documents containing an explicit BSON `null` value and documents where the field is completely missing, and the patterns used to isolate these states.

---

## 1. Prerequisites
- [Null Type](../level_02/null_type.md) — The representation of null.
- [Element Query Operators (`$exists`, `$type`)](../../level_03/element_operators.md) — The metadata operators used.

---

## 2. Term Category
- **Database Command / Query Syntax**

---

## 3. Environment Context
- **MongoDB Core** (Parsed by the query engine. Matches both values in index scans; separating them requires evaluating exists rules on the matching index nodes).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In SQL, columns must be declared in the schema:
`SELECT * FROM users WHERE phone IS NULL;`
This retrieves rows where the column exists but holds a `NULL` marker.

In MongoDB, because of the flexible schema paradigm, a field can be absent or present:
1.  **Explicit Null:** The field key is present, but its value is BSON null: `{ phone: null }`.
2.  **Missing Field:** The field key is completely absent from the document disk space.

If you run a simple equality check:
`db.users.find({ phone: null })`

**MongoDB will return BOTH types of documents.** 

This behavior was designed to simplify basic queries (since in both cases, the user has "no phone number"), but it creates a major pitfall for developers who need to audit document structures or clean up database schemas.

---

### (2) How to Isolate Null vs. Missing

To separate these two states, you must combine equality with element checks:

#### Scenario A: Match Both (Default)
`db.users.find({ phone: null })`
-   Matches: `{ phone: null }` and `{}` (missing).

#### Scenario B: Match Only Explicit Null
Ensure the field is present, and check that its type is BSON null:
`db.users.find({ phone: { $type: "null" } })`
-   Alternatively: `db.users.find({ phone: { $eq: null, $exists: true } })`

#### Scenario C: Match Only Missing Fields
`db.users.find({ phone: { $exists: false } })`

---

### (3) Reality Metaphor
Imagine auditing physical registration forms:
-   **Match Both:** *"Show me any user who doesn't have an active phone number."* This matches forms where the line is written as **"N/A"** (explicit null) AND old forms where the "Phone" question was never printed on the sheet (missing).
-   **Explicit Null Check:** *"Find forms containing the 'Phone' question, where the user has written **'None'** inside the box."*
-   **Missing Check:** *"Find old forms where the 'Phone' question was **completely left off** the printed page."*

---

### (4) Code Examples

#### Isolating Null and Missing states
Let's query this collection:

```javascript
db.users.insertMany([
  { name: "Alice", phone: null },         // Explicit Null
  { name: "Bob" }                         // Missing field
]);

// 1. Match Both (returns Alice and Bob)
db.users.find({ phone: null });

// 2. Match ONLY Explicit Null (returns Alice)
db.users.find({ phone: { $type: "null" } });

// 3. Match ONLY Missing Field (returns Bob)
db.users.find({ phone: { $exists: false } });
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming '{ field: null }' only selects documents where the field physically exists with a null value

**The mistake:** Running `db.users.updateMany({ phone: null }, { $set: { phone: "Unspecified" } })` in an attempt to populate explicit null entries, accidentally adding the field to users who never had it.

**Why it's wrong:** Because `{ phone: null }` matches missing fields, your update will write the phone field to Bob's document as well, altering Bob's schema structure when you only intended to clean up Alice's records.

**Fix: When updating or querying explicit null values, always use `$type: "null"` or combine the check with `$exists: true` to prevent altering missing fields.**

```javascript
// CORRECT (Only updates Alice!)
db.users.updateMany({ phone: { $type: "null" } }, { $set: { phone: "Unspecified" } });
```

---



### Mistake 2: Expecting `{ field: null }` Queries to Exclude Documents Where Field Is Absent

**The mistake:** Querying `db.users.find({ middleName: null })` expecting to match ONLY explicit `null` fields.

**Why it's wrong:** In MongoDB, `{ field: null }` matches documents where `field` is assigned `null` AND documents where `field` key is missing (`$exists: false`).

*Incorrect:*
```javascript
// Matches explicit null AND missing field documents
db.users.find({ middleName: null });
```

*Fix:*
```javascript
db.users.find({ middleName: { $type: "null" } }); // Matches ONLY explicit BSON null values
```

### Mistake 3: Confusing `{ field: { $exists: false } }` with `{ field: null }`

**The mistake:** Using `{ field: null }` when querying for absent fields specifically.

**Why it's wrong:** If a document has `field: null`, `{ field: { $exists: false } }` correctly returns `false` (since the field key exists). Use `{ $exists: false }` for absent field checks.

*Incorrect:*
```javascript
db.users.find({ middleName: null }); // ❌ Matches explicit nulls too!
```

*Fix:*
```javascript
db.users.find({ middleName: { $exists: false } }); // Matches absent keys only
```

## 6. Practice Exercises

### Exercise 1: Cleanup Query Construction

**Problem:** You are running data migration on an `inventory` collection. Some products have a `discount_code` field set to `null`, while others don't have the field. 
Write the query to find all products where the `discount_code` field is **physically present in the document** with an **explicit null value**.

**Expected output:**
```javascript
db.inventory.find({ discount_code: { $type: "null" } });
```

> [!check]- Answer
> - Choose the element operator `$type` to evaluate the data type.
> - Pass the target type alias string `"null"`.

---



### Exercise 2: Matching Missing Fields with `$exists`

**Problem:** Query users where `deletedAt` field does not exist (`$exists: false`).

**Expected output:**
```text
db.users.find({ deletedAt: { $exists: false } });
```

> [!check]- Answer
> ```javascript
> db.users.find({ deletedAt: { $exists: false } });
> ```
>
> **Explanation:** `{ $exists: false }` matches documents where the specified key is absent.

### Exercise 3: Matching Explicit BSON Null Values

**Problem:** Query users where `middleName` is explicitly set to BSON `null` using `$type`.

**Expected output:**
```text
db.users.find({ middleName: { $type: "null" } });
```

> [!check]- Answer
> ```javascript
> db.users.find({ middleName: { $type: "null" } });
> ```
>
> **Explanation:** `{ $type: "null" }` matches explicit null field values while ignoring missing fields.

## 7. Related Terms
- [Null Type](../level_02/null_type.md) — The data structure.
- [Element Query Operators (`$exists`, `$type`)](../../level_03/element_operators.md) — The checks operators.

---

## 8. Key Takeaways
- `{ field: null }` matches both explicit nulls and missing fields.
- Designed to capture all forms of "empty" values under one simple query.
- Explicit null represents a field key written on disk with a BSON null value.
- Missing field represents the complete absence of the field key on disk.
- Query explicit nulls only using `{ field: { $type: "null" } }`.
- Query missing fields only using `{ field: { $exists: false } }`.
- Always check schema states before running bulk updates on null filters.
