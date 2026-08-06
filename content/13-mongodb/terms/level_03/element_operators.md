# Element Query Operators (`$exists`, `$type`)

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The BSON query operators used to filter documents based on field existence (`$exists`) or specific data types (`$type`), essential for querying flexible and polymorphic document schemas.

---

## 1. Prerequisites

- [Query Filter (Filter Document)](query_filter.md) — The parent filter parameter structure.
- [Flexible Schema (Schema-on-Read)](../level_01/flexible_schema.md) — The dynamic context requiring structure queries.

---

## 2. Term Category

**Query Operator** (Field Existence & Type Operators): Element Operators ($exists, $type) filter documents based on field presence or BSON data type classification.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Evaluated directly by the query execution planner. Checking field existence can use sparse indexes to optimize lookups).

### (1) Design Motivation — "Why did we design this?"
In PostgreSQL, you never need to query the database saying: *"Find rows where the column `phone` exists."* 

Every single row in the table contains that column by definition, even if it is filled with a `NULL` marker. 

Similarly, you don't need to check if a column holds a string or a number; the column type is locked in the table schema.

In MongoDB, because of the **Flexible Schema** paradigm:
1.  **Field Absence:** Documents can completely omit fields. E.g. User A has a `phone` field, but User B does not.
2.  **Type Variation (Polymorphism):** A field can store different BSON types across documents. E.g. one document stores phone as a `String` (`"555-1234"`), and another stores it as an `Integer` (`5551234`).

We designed the **Element Operators** (`$exists` and `$type`) to allow developers to query the **structure and metadata** of documents.

---

### (2) The Two Element Operators

#### 1. `$exists` (Checking Existence)
Matches documents based on whether a target field key exists in the document.
-   `{ field: { $exists: true } }`: Matches if the key is present (even if its value is `null`).
-   `{ field: { $exists: false } }`: Matches if the key is completely missing.

#### 2. `$type` (Checking Data Types)
Matches documents where the field's value matches a specified BSON type.
-   Supports type alias strings (e.g. `"string"`, `"number"`, `"date"`, `"array"`) or BSON type numbers.
-   Can accept an array of types to find polymorphic values: `{ status: { $type: ["string", "int"] } }`.

---

### (3) Reality Metaphor
Imagine auditing patient medical files in a clinic cabinet:
-   **`$exists: true`:** You flip through folder tabs to check: *"Does this folder contain an **'Allergies' sheet paper divider tab**?"* You don't read what is written on the page yet; you only check if the physical page is present.
-   **`$type: "string"`:** You pull out the Allergies sheet and check its format: *"Is the record written as **handwritten text** (String), a **printed photograph** (Binary), or a **list of checkboxes** (Array)?"*

---

### (4) Code Examples

#### Locating Structural Anomalies
Let's find dirty data or profile completion metrics:

```javascript
db.users.insertMany([
  { name: "Alice", phone: "555-1234" },
  { name: "Bob", phone: NumberInt(5559999) }, // Saved as number (Polymorphic)
  { name: "Charlie" }                          // Missing phone field
]);

// 1. Find users who have a phone field (matches Alice and Bob)
db.users.find({ phone: { $exists: true } });

// 2. Find users who are missing the phone field completely (matches Charlie)
db.users.find({ phone: { $exists: false } });

// 3. Find users where phone is stored as a number (matches Bob)
db.users.find({ phone: { $type: "number" } });
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on '{ field: null }' to find only documents that are missing a field

**The mistake:** Running `db.users.find({ phone: null })` assuming it will only return Charlie (who is missing the field).

**Why it's wrong:** As learned in `null_type.md`, the query `{ phone: null }` matches both documents that are missing the key AND documents where the key is explicitly set to `null` (like `{ name: "Dave", phone: null }`). 

This can lead to data classification bugs in your application.

**Fix: To target only documents where a field is missing, use the explicit exists operator:**

```javascript
// CORRECT
db.users.find({ phone: { $exists: false } });
```

---





### Mistake 2: Confusing `{ field: null }` Queries with `{ field: { $exists: false } }`

**The mistake:** Querying `{ bio: null }` expecting to exclude explicit `null` values.

**Why it's wrong:** `{ bio: null }` matches both documents where `bio` is explicitly assigned `null` AND documents where `bio` is missing (`$exists: false`).

*Incorrect:*
```javascript
db.users.find({ bio: null }); // Returns explicit null AND missing field docs
```

*Fix:*
```javascript
db.users.find({ bio: { $exists: false } }); // Matches ONLY missing field docs
```



### Mistake 3: Using Number Codes for `$type` Queries Instead of Human-Readable String Aliases

**The mistake:** Querying `{ age: { $type: 16 } }`.

**Why it's wrong:** Number BSON type codes are difficult to read and maintain. Use string aliases like `{ age: { $type: "int" } }`.

*Incorrect:*
```javascript
db.users.find({ age: { $type: 16 } });
```

*Fix:*
```javascript
db.users.find({ age: { $type: "int" } }); // Readable BSON type alias
```



## 5. Practice Exercises

### Exercise 1: Querying Optional Field Existence with `$exists`

**Scenario:**
Find all customer documents where optional field `taxId` exists and is present.

**Requirements:**
1. Use `{ taxId: { $exists: true } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.customers.find({
>   taxId: { $exists: true }
> });
> ```
>
> #### Technical Explanation
>
> 1. `$exists: true` matches documents containing the specified field key (even if value is `null`).
> 2. `$exists: false` matches documents where the key is missing.
> 3. Enables filtering flexible schema documents.
> 
---

### Exercise 2: Auditing Field Data Types with `$type`

**Scenario:**
Find all documents in `orders` where field `phone` was stored as BSON `Int32` instead of `String`.

**Requirements:**
1. Use `{ phone: { $type: "int" } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.find({
>   phone: { $type: "int" }
> });
> ```
>
> #### Technical Explanation
>
> 1. `$type` matches documents where field values conform to specified BSON data types.
> 2. Accepts string type names (`"int"`, `"string"`, `"decimal"`) or BSON type numbers.
> 3. Identifies data type corruption across collection records.
> 
---

### Exercise 3: Combining `$exists` and `$ne` Null Checks

**Scenario:**
Query documents where `middleName` exists AND is not equal to `null`.

**Requirements:**
1. Combine `{ middleName: { $exists: true, $ne: null } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.find({
>   middleName: { $exists: true, $ne: null }
> });
> ```
>
> #### Technical Explanation
>
> 1. Combining `$exists: true` with `$ne: null` filters out both missing fields and explicit null values.
> 2. Ensures only valid, populated string values are matched.
> 3. Standard pattern for mandatory value checks in flexible schemas.
> 
---



## 6. Related Terms

- [Flexible Schema (Schema-on-Read)](../level_01/flexible_schema.md) — The paradigm.
- [`null`](../level_02/null_type.md) — The null indicator difference.
- [Querying `null` and Missing Fields](../level_04/querying_null_missing.md) — Related concept: Querying `null` and Missing Fields.
- [The Polymorphic Pattern](../level_05/polymorphic_pattern.md) — Related concept: The Polymorphic Pattern.

---

## 7. Key Takeaways
- Element operators query document structures and metadata types.
- Essential for managing and auditing flexible schema databases.
- `$exists` checks if a field key is present (`true`) or absent (`false`) on disk.
- `$type` matches values based on BSON data type aliases (e.g. `"number"`, `"date"`).
- Comma-separated type checks support filtering polymorphic values.
- Do not use `{ field: null }` for existence checks; use `{ field: { $exists: false } }`.
- Useful for locating and repairing corrupted data formats in collections.
