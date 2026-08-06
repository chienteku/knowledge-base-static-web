# `null`

> **Level 2 — BSON Data Types & Document Structure**
> The BSON data type used to represent empty or missing values, carry distinct query behaviors when differentiating explicit nulls from omitted fields.

---

## 1. Prerequisites

- [BSON Data Types (Overview)](bson_data_types.md) — The parent BSON type system.
- [Flexible Schema (Schema-on-Read)](../level_01/flexible_schema.md) — The context of omitted fields.

---

## 2. Term Category

**Core Concept** (Missing/Empty Value BSON Type): The Null BSON data type represents missing, unassigned, or explicitly empty field values within MongoDB documents.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported natively in JSON, JavaScript, and BSON. Query engines parse nulls using index filters, but carry specialized rules for field existence).

### (1) Design Motivation — "Why did we design this?"
In relational databases, when a row has no data for an attribute:
-   The column must exist.
-   The database writes a `NULL` placeholder in that cell slot.

In MongoDB, because schemas are flexible, there are **two ways** to represent a missing value:
1.  **Explicit Null:** You write a field and set its value to `null`: `{ middle_name: null }`.
2.  **Implicit Absence (Omission):** You completely leave the field out of the document: `{ first_name: "Alice" }` (there is no `middle_name` key at all).

We designed the **BSON Null** type to allow developers to explicitly state that a field has been evaluated and is intentionally empty, while still supporting schema flexibility where non-existent attributes are omitted to save storage.

---

### (2) The Query Traps of Null
Because there are two ways to represent missing values, querying in MongoDB can be tricky:

If you run a simple match filter:
`db.users.find({ middle_name: null })`

MongoDB will return **both** states:
-   Documents where `middle_name` is explicitly set to `null`.
-   Documents where the `middle_name` field does not exist at all.

To target only one state, you must use helper operators like `$exists` or `$type`.

---

### (3) Reality Metaphor
Imagine a doctor's patient folder:
-   **Explicit Null:** The patient's folder contains a paper page labeled **"Allergies"**. In the input box, the nurse has drawn a straight horizontal line or written **"None"** (explicit blank indicator).
-   **Implicit Absence (Omission):** The patient's folder has **no "Allergies" page inside it at all**. The page was never printed or stapled into the folder.

---

### (4) Code Examples

#### Differentiating Explicit Nulls from Missing Fields
Let's see how queries behave on these three documents:

```javascript
db.users.insertMany([
  { name: "Alice", middle_name: "Jane" },
  { name: "Bob", middle_name: null },      // Explicit Null
  { name: "Charlie" }                      // Implicit Absence (Omitted)
]);

// 1. Generic Match: Returns Bob and Charlie!
db.users.find({ middle_name: null });

// 2. Target ONLY Explicit Null (by checking type)
db.users.find({ middle_name: { $type: "null" } });
// Returns only: Bob

// 3. Target ONLY Omitted Fields (checking existence)
db.users.find({ middle_name: { $exists: false } });
// Returns only: Charlie
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing explicit 'null' fields in documents out of SQL habit

**The mistake:** Writing application logic that inserts `{ age: null, phone: null, bio: null }` for new users who haven't completed their profiles.

**Why it's wrong:** In SQL, you are forced to write `NULL` because the columns are fixed. 

In MongoDB, this is a waste of resources. 

Storing explicit `null` fields writes unnecessary keys (`"age"`, `"phone"`, `"bio"`) to the disk block, bloating the document size and wasting RAM buffers during index scans.

**Fix: If a field has no value, simply omit the field entirely from the document. Only store explicit `null` values if your application must differentiate between "value evaluated and set to empty" and "value never set."**

---



### Mistake 2: Expecting `{ field: null }` Queries to Exclude Documents Where the Field Is Absent

**The mistake:** Querying `db.users.find({ middleName: null })` expecting to match ONLY documents where `middleName` was explicitly set to null.

**Why it's wrong:** In MongoDB, `{ field: null }` matches documents where `field` is assigned `null` AND documents where `field` key is completely missing (`$exists: false`).

*Incorrect:*
```javascript
// Expecting only explicit null values
db.users.find({ middleName: null }); // Returns explicit null AND missing field docs!
```

*Fix:*
```javascript
db.users.find({ middleName: { $type: "null" } }); // Matches ONLY explicit BSON null values
```

### Mistake 3: Inserting `null` Values in Fields That Should Be Omitted for Optionality

**The mistake:** Inserting `{ name: "Alice", middleName: null }` across millions of documents.

**Why it's wrong:** Storing explicit `null` fields consumes BSON byte space across documents. If a field is optional, omit the field key entirely.

*Incorrect:*
```javascript
{ name: "Alice", middleName: null } // Explicit null key storage
```

*Fix:*
```javascript
{ name: "Alice" } // Omit optional keys to save BSON space
```

## 5. Practice Exercises

### Exercise 1: Querying Null vs Missing Fields

**Scenario:**
Query collection `users` for documents where field `middleName` is explicitly set to `null`.

**Requirements:**
1. Use `$type: "null"` to distinguish explicit `null` from missing fields.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.find({
>   middleName: { $type: "null" }
> });
> ```
>
> #### Technical Explanation
>
> 1. `{ middleName: null }` matches BOTH documents where `middleName` is `null` AND documents where `middleName` does not exist.
> 2. `{ middleName: { $type: "null" } }` strictly matches documents with explicit `null` values.
> 3. Essential distinction in flexible schema query modeling.
> 
---

### Exercise 2: Finding Missing Fields with `$exists`

**Scenario:**
Query documents where optional field `phoneNumber` is completely missing from the document.

**Requirements:**
1. Use `{ phoneNumber: { $exists: false } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.find({
>   phoneNumber: { $exists: false }
> });
> ```
>
> #### Technical Explanation
>
> 1. `$exists: false` matches documents where the key is absent.
> 2. Ignores documents containing `phoneNumber: null`.
> 3. Used to find legacy documents missing newly added schema properties.
> 
---

### Exercise 3: Setting Fields to Null with `$set`

**Scenario:**
Set a user's `temporaryCode` field to `null` to indicate the code has expired.

**Requirements:**
1. Execute `updateOne()` with `$set: { temporaryCode: null }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.updateOne(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   { $set: { temporaryCode: null } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$set: { field: null }` explicitly writes a BSON Null type (Type 10).
> 2. Preserves field key existence while marking value as empty.
> 3. Contrast with `$unset` which completely deletes the field key.
> 
---



## 6. Related Terms

- [BSON Data Types (Overview)](bson_data_types.md) — The parent BSON types.
- [Flexible Schema (Schema-on-Read)](../level_01/flexible_schema.md) — The concept of dynamic layouts.
- [Element Query Operators (`$exists`, `$type`)](../level_03/element_operators.md) — Related concept: Element Query Operators (`$exists`, `$type`).
- [Querying `null` and Missing Fields](../level_04/querying_null_missing.md) — Related concept: Querying `null` and Missing Fields.

---

## 7. Key Takeaways
- BSON Null represents an intentionally empty value.
- SQL requires NULL placeholders; MongoDB allows omitting fields entirely.
- Defaulting to field omission saves disk space and simplifies documents.
- Querying `{ field: null }` returns both explicit nulls and missing fields.
- Use `{ field: { $type: "null" } }` to select only explicit null documents.
- Use `{ field: { $exists: false } }` to select only documents missing the key.
- Avoid writing default null fields to collections out of SQL schema habits.
