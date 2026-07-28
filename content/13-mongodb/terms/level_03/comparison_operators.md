# Comparison Query Operators (`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`)

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The BSON comparison operators used in query filters to evaluate document values, serving as the direct equivalents of SQL's relational symbols (`=`, `<>`, `>`, `>=`, `<`, `<=`, `IN`, `NOT IN`).

---

## 1. Prerequisites
- [Query Filter (Filter Document)](query_filter.md) — The parent filter parameter structure.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **Universal Standard** (Supported natively by all document NoSQL platforms. Handled by the index scanner engine to perform ranged indexes queries).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When filtering data, we rarely look for exact matches:
-   An e-commerce store needs to find items priced **under $50**.
-   A booking app needs to find flights departing **on or after** a specific date.
-   An admin dashboard needs to find orders that are **not** cancelled.

In PostgreSQL, you use standard mathematical symbols:
`SELECT * FROM products WHERE price >= 100.00 AND category IN ('shoes', 'books');`

Because MongoDB filters are JSON objects, we cannot use loose characters like `>=` or `IN` as operators directly in keys. 

We designed the **Comparison Operators** (prefixed with `$`) to allow you to express mathematical comparisons as clean JSON sub-documents, enabling the database compiler to map them directly to BSON index ranges.

---

### (2) SQL to BSON Operator Mapping

| SQL Symbol | BSON Operator | Description | Example Query |
| :--- | :--- | :--- | :--- |
| `=` | **`$eq`** | Equal to. | `{ status: { $eq: "active" } }` |
| `<>` / `!=` | **`$ne`** | Not equal to. | `{ role: { $ne: "admin" } }` |
| `>` | **`$gt`** | Greater than. | `{ age: { $gt: 21 } }` |
| `>=` | **`$gte`** | Greater than or equal to. | `{ score: { $gte: 80 } }` |
| `<` | **`$lt`** | Less than. | `{ price: { $lt: NumberDecimal("5.00") } }` |
| `<=` | **`$lte`** | Less than or equal to. | `{ qty: { $lte: 5 } }` |
| `IN` | **`$in`** | Matches any value in list. | `{ tags: { $in: ["shoes", "gear"] } }` |
| `NOT IN` | **`$nin`** | Matches no values in list. | `{ status: { $nin: ["failed", "hold"] } }` |

---

### (3) Reality Metaphor
Imagine a quality control inspector checking metal parts on a conveyor belt:
-   **`$gt` / `$lt`:** A physical **Go/No-Go Gauge**. 
    -   The inspector has a metal caliper set to exactly 10mm. 
    -   If a part is larger than the gap (`$gt`), it passes through the checkpoint. 
    -   If it's smaller, it falls off the belt.
-   **`$in`:** A checklist board of **Authorized Part Numbers**. 
    -   If the incoming box label matches any serial number written on the board, it is approved. 
    -   Otherwise, it is rejected.

---

### (4) Code Examples

#### Range Filtering (gt and lte)
```javascript
// Find all products priced between 10.00 and 50.00 (inclusive)
db.products.find({
  price: { 
    $gte: NumberDecimal("10.00"), 
    $lte: NumberDecimal("50.00") 
  }
});
```

#### List Filtering (in and ne)
```javascript
// Find active users who are NOT administrators and are in the sales or support teams
db.users.find({
  role: { $ne: "admin" },
  team: { $in: ["sales", "support"] }
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to nest the comparison operator inside a subdocument wrapper

**The mistake:** Writing the query `{ age: $gt: 25 }` or `{ age: $gt 25 }` in your database query filters.

**Why it's wrong:** This is invalid JSON syntax. 

The parser expects a key-value structure. 

The operator must be the key of a nested subdocument object.

**Fix: Always wrap comparison operators inside curly braces under the field key: `{ field: { $operator: value } }`.**

```javascript
// CORRECT
db.users.find({ age: { $gt: 25 } });
```

---



### Mistake 2: Using String Numbers in Numeric Comparison Operators (`$gt`, `$lt`)

**The mistake:** Querying `{ age: { $gt: "18" } }` when `age` is stored as BSON integer number `18`.

**Why it's wrong:** MongoDB compares string `"18"` against number `18` using BSON Type Comparison Order. Strings sort higher than numbers, returning unexpected query results.

*Incorrect:*
```javascript
db.users.find({ age: { $gt: "18" } }); // ❌ String comparison against number field!
```

*Fix:*
```javascript
db.users.find({ age: { $gt: 18 } }); // Numeric comparison
```

### Mistake 3: Confusing `$in` Array Values with Single Element Predicates

**The mistake:** Writing `{ status: { $in: "active" } }` passing a scalar string.

**Why it's wrong:** `$in` strictly expects an array of values `{ status: { $in: ["active", "pending"] } }`.

*Incorrect:*
```javascript
db.users.find({ status: { $in: "active" } }); // ❌ Expected array!
```

*Fix:*
```javascript
db.users.find({ status: { $in: ["active", "pending"] } });
```



### Mistake 4: Using String Numbers in Numeric Comparison Operators (`$gt`, `$lt`)

**The mistake:** Querying `{ age: { $gt: "18" } }` when `age` is stored as BSON integer number `18`.

**Why it's wrong:** MongoDB compares string `"18"` against number `18` using BSON Type Comparison Order. Strings sort higher than numbers, returning unexpected query results.

*Incorrect:*
```javascript
db.users.find({ age: { $gt: "18" } }); // ❌ String comparison against number field!
```

*Fix:*
```javascript
db.users.find({ age: { $gt: 18 } }); // Numeric comparison
```

### Mistake 5: Confusing `$in` Array Values with Single Element Predicates

**The mistake:** Writing `{ status: { $in: "active" } }` passing a scalar string.

**Why it's wrong:** `$in` strictly expects an array of values `{ status: { $in: ["active", "pending"] } }`.

*Incorrect:*
```javascript
db.users.find({ status: { $in: "active" } }); // ❌ Expected array!
```

*Fix:*
```javascript
db.users.find({ status: { $in: ["active", "pending"] } });
```

## 6. Practice Exercises

### Exercise 1: Range Query Translation

**Problem:** Translate this SQL query into a valid MongoDB query:
`SELECT * FROM inventory WHERE status = 'low' AND qty <= 5;`

**Expected output:**
```javascript
db.inventory.find({ status: "low", qty: { $lte: 5 } });
```

> [!check]- Answer
> - Combine the status and quantity conditions inside a single JSON object.
> - Map the SQL `<=` symbol to the BSON `$lte` operator.

---



### Exercise 2: Range Predicate Query with `$gte` and `$lte`

**Problem:** Query products with `price` between 20 and 50 inclusive using `$gte` and `$lte`.

**Expected output:**
```text
db.products.find({ price: { $gte: 20, $lte: 50 } });
```

> [!check]- Answer
> ```javascript
> db.products.find({
>   price: { $gte: 20, $lte: 50 }
> });
> ```
>
> **Explanation:** Combining `$gte` and `$lte` filters documents within numeric range boundaries.

### Exercise 3: Excluding Values with `$nin`

**Problem:** Query users whose `role` is neither `"admin"` nor `"manager"` using `$nin`.

**Expected output:**
```text
db.users.find({ role: { $nin: ["admin", "manager"] } });
```

> [!check]- Answer
> ```javascript
> db.users.find({
>   role: { $nin: ["admin", "manager"] }
> });
> ```
>
> **Explanation:** `$nin` matches documents whose field value is not contained in the specified array.

## 7. Related Terms
- [Query Filter (Filter Document)](query_filter.md) — The parent filter layout.
- [Logical Query Operators (`$and`, `$or`, etc.)](logical_operators.md) -- Combining filters.

---

## 8. Key Takeaways
- BSON comparison query operators evaluate field values mathematically.
- Direct equivalents of SQL relational symbols (`=`, `>`, `<=`, `IN`).
- Written nested under the field key: `{ field: { $operator: value } }`.
- `$in` matches if a field value matches any element in a list array.
- `$nin` matches if a field value matches none of the elements in a list.
- Combine range operators targeting one field inside a single nested object.
- Utilizing comparison operators allows index scans to resolve range queries.
