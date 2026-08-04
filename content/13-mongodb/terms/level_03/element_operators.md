# Element Query Operators (`$exists`, `$type`)

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The BSON query operators used to filter documents based on field existence (`$exists`) or specific data types (`$type`), essential for querying flexible and polymorphic document schemas.

---

## 1. Prerequisites
- [Query Filter (Filter Document)](query_filter.md) — The parent filter parameter structure.
- [Flexible Schema (Schema-on-Read)](../level_01/flexible_schema.md) — The dynamic context requiring structure queries.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Evaluated directly by the query execution planner. Checking field existence can use sparse indexes to optimize lookups).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Confusing `{ field: null }` Queries with `{ field: { $exists: false } }`

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

### Mistake 5: Using Number Codes for `$type` Queries Instead of Human-Readable String Aliases

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

## 6. Practice Exercises

### Exercise 1: Structural Audit

**Problem:** You have a `products` collection. Over time, some developers stored the `price` field as a `string` (e.g. `"19.99"`), while others stored it as a `decimal` or `double`. 
Write the query to locate all products where the `price` field is stored as the incorrect BSON `string` type.

**Expected output:**
> [!check]- Answer
> ```javascript
> db.products.find({ price: { $type: "string" } });
> ```
> - Choose the element operator `$type`.
> - Pass the target type alias `"string"` inside the operator subdocument.

---



### Exercise 2: Checking Field Existence with `$exists`

**Problem:** Query documents in `users` possessing optional field `middleName`.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.find({ middleName: { $exists: true } });
> ```
> ```javascript
> db.users.find({ middleName: { $exists: true } });
> ```
>
> **Explanation:** `{ $exists: true }` matches documents containing the specified field key.

---

### Exercise 3: Filtering Array BSON Types with `$type`

**Problem:** Query documents where `tags` field is typed as BSON array (`"array"`).

**Expected output:**
> [!check]- Answer
> ```text
> db.posts.find({ tags: { $type: "array" } });
> ```
> ```javascript
> db.posts.find({ tags: { $type: "array" } });
> ```
>
> **Explanation:** `$type: "array"` checks if a field contains BSON array data.

## 7. Related Terms
- [Flexible Schema (Schema-on-Read)](../level_01/flexible_schema.md) — The paradigm.
- [`null`](../level_02/null_type.md) — The null indicator difference.

---

## 8. Key Takeaways
- Element operators query document structures and metadata types.
- Essential for managing and auditing flexible schema databases.
- `$exists` checks if a field key is present (`true`) or absent (`false`) on disk.
- `$type` matches values based on BSON data type aliases (e.g. `"number"`, `"date"`).
- Comma-separated type checks support filtering polymorphic values.
- Do not use `{ field: null }` for existence checks; use `{ field: { $exists: false } }`.
- Useful for locating and repairing corrupted data formats in collections.
