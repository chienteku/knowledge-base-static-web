# Logical Query Operators (`$and`, `$or`, `$not`, `$nor`)

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The BSON logical operators used to combine multiple query filters, serving as the direct equivalents of SQL's `AND`, `OR`, `NOT` conditions.

---

## 1. Prerequisites
- [Query Filter (Filter Document)](query_filter.md) — The parent filter parameter structure.
- [Implicit `$eq` & Combining Conditions](implicit_eq_combining.md) — Differentiating implicit ANDs from explicit ones.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **Universal Standard** (Supported conceptually by all database query engines. Controls the query executor's logical branching during collection scans).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational database development, you combine filters using logical operators:
-   `WHERE role = 'admin' OR status = 'pending'`
-   `WHERE NOT (age < 18)`

Because MongoDB queries are JSON objects, we need operators to join multiple criteria. 

We designed the **Logical Query Operators** (prefixed with `$`) to act as the logical gates.

Three of these operators (`$and`, `$or`, `$nor`) accept a **JavaScript Array of query objects** as their value. 

The query engine evaluates each object in the array, combining the results.

---

### (2) The Four Logical Operators

#### 1. `$and` (All conditions must match)
Returns documents where all conditions in the array are true. 
-   *Note:* Usually handled implicitly by MongoDB unless duplicate keys are required.

#### 2. `$or` (At least one must match)
Returns documents where at least one condition in the array is true. 
-   *Syntax:* `{ $or: [ { condition1 }, { condition2 } ] }`

#### 3. `$not` (Invert condition)
Inverts the effect of a query operator expression. 
-   *Syntax:* `{ field: { $not: { $gt: 50 } } }` (Matches documents where field is less than or equal to 50, or does not exist).

#### 4. `$nor` (None of the conditions must match)
Returns documents that fail all conditions in the array (Neither this nor that).

---

### (3) Reality Metaphor (Security Checkpoints)
-   **`$and`:** A **Double-Lock Bank Vault**. To open the door, Key A must be turned AND Key B must be turned at the same time. If either key is missing, the door stays locked.
-   **`$or`:** A **Twin-Door Lobby**. A visitor can enter through the Left Door OR the Right Door. Both doors lead to the same reception desk.
-   **`$not`:** A **No-Admittance Sign**. Anyone is allowed to enter, EXCEPT users wearing red shirts (inverts the match).

---

### (4) Code Examples

#### 1. Basic OR Query
Find users who are either based in Paris or have the administrator role:

```javascript
db.users.find({
  $or: [
    { city: "Paris" },
    { role: "admin" }
  ]
});
```

#### 2. Inverting Regex Checks with NOT
Find products where the SKU does not start with `"TEMP-"`:

```javascript
db.products.find({
  sku: { $not: /^TEMP-/ }
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Writing explicit '$and' operators for simple queries that can be combined implicitly

**The mistake:** Writing a verbose query like this:

```javascript
// BAD: Unnecessarily complex and hard to read!
db.users.find({
  $and: [
    { status: "active" },
    { age: { $gte: 21 } }
  ]
});
```

**Why it's wrong:** As learned in `implicit_eq_combining.md`, MongoDB already treats comma-separated fields at the top level as an implicit AND check. 

Writing an explicit `$and` array adds visual clutter and wastes memory parsing overhead.

**Fix: Only use the explicit `$and` operator when you have duplicate keys targeting the same field (like range checks) or when combining nested `$or` blocks. For simple checks, default to implicit combining:**

```javascript
// CORRECT (Implicit AND)
db.users.find({ status: "active", age: { $gte: 21 } });
```

---



### Mistake 2: Overusing Explicit `$and` Operators for Simple Field Equality Checks

**The mistake:** Writing `db.users.find({ $and: [{ a: 1 }, { b: 2 }] })`.

**Why it's wrong:** MongoDB implicitly combines top-level fields with AND logic! Use `{ a: 1, b: 2 }` for cleaner queries.

*Incorrect:*
```javascript
db.users.find({ $and: [{ a: 1 }, { b: 2 }] });
```

*Fix:*
```javascript
db.users.find({ a: 1, b: 2 }); // Idiomatic implicit AND syntax
```

### Mistake 3: Confusing `$nor` with `$not` Operator Evaluation Scope

**The mistake:** Using `$not` on top-level query objects `{ $not: { status: "active" } }`.

**Why it's wrong:** `$not` applies to specific field expressions `{ status: { $not: { $eq: "active" } } }`. For multi-field negation, use `$nor`.

*Incorrect:*
```javascript
db.users.find({ $not: { status: "active" } }); // ❌ Invalid $not syntax!
```

*Fix:*
```javascript
db.users.find({ status: { $ne: "active" } });
-- Or:
db.users.find({ $nor: [{ status: "active" }] });
```



### Mistake 4: Overusing Explicit `$and` Operators for Simple Field Equality Checks

**The mistake:** Writing `db.users.find({ $and: [{ a: 1 }, { b: 2 }] })`.

**Why it's wrong:** MongoDB implicitly combines top-level fields with AND logic! Use `{ a: 1, b: 2 }` for cleaner queries.

*Incorrect:*
```javascript
db.users.find({ $and: [{ a: 1 }, { b: 2 }] });
```

*Fix:*
```javascript
db.users.find({ a: 1, b: 2 }); // Idiomatic implicit AND syntax
```

### Mistake 5: Confusing `$nor` with `$not` Operator Evaluation Scope

**The mistake:** Using `$not` on top-level query objects `{ $not: { status: "active" } }`.

**Why it's wrong:** `$not` applies to specific field expressions `{ status: { $not: { $eq: "active" } } }`. For multi-field negation, use `$nor`.

*Incorrect:*
```javascript
db.users.find({ $not: { status: "active" } }); // ❌ Invalid $not syntax!
```

*Fix:*
```javascript
db.users.find({ status: { $ne: "active" } });
-- Or:
db.users.find({ $nor: [{ status: "active" }] });
```

## 6. Practice Exercises

### Exercise 1: Logical Query Translation

**Problem:** Translate this SQL query into a valid MongoDB query filter:
`SELECT * FROM tickets WHERE status = 'open' AND (urgency = 'high' OR customer = 'VIP');`

**Expected output:**
```javascript
db.tickets.find({
  status: "open",
  $or: [
    { urgency: "high" },
    { customer: "VIP" }
  ]
});
```

> [!check]- Answer
> - The top-level status condition is combined implicitly with the `$or` block.
> - The `$or` operator expects an array of filter objects.

---



### Exercise 2: Multi-Branch Disjunction Query with `$or`

**Problem:** Query users where `role` is `"admin"` OR `permissions` contains `"all"`.

**Expected output:**
```text
db.users.find({ $or: [{ role: "admin" }, { permissions: "all" }] });
```

> [!check]- Answer
> ```javascript
> db.users.find({
>   $or: [{ role: "admin" }, { permissions: "all" }]
> });
> ```
>
> **Explanation:** `$or: [ { cond1 }, { cond2 } ]` matches documents satisfying any condition branch.

### Exercise 3: Negation Query with `$nor`

**Problem:** Query users who are neither `inactive` nor `banned` using `$nor`.

**Expected output:**
```text
db.users.find({ $nor: [{ status: "inactive" }, { status: "banned" }] });
```

> [!check]- Answer
> ```javascript
> db.users.find({
>   $nor: [{ status: "inactive" }, { status: "banned" }]
> });
> ```
>
> **Explanation:** `$nor: [ ... ]` matches documents failing all specified clause conditions.



### Exercise 4: Multi-Branch Disjunction Query with `$or`

**Problem:** Query users where `role` is `"admin"` OR `permissions` contains `"all"`.

**Expected output:**
```text
db.users.find({ $or: [{ role: "admin" }, { permissions: "all" }] });
```

> [!check]- Answer
> ```javascript
> db.users.find({
>   $or: [{ role: "admin" }, { permissions: "all" }]
> });
> ```
>
> **Explanation:** `$or: [ { cond1 }, { cond2 } ]` matches documents satisfying any condition branch.

### Exercise 5: Negation Query with `$nor`

**Problem:** Query users who are neither `inactive` nor `banned` using `$nor`.

**Expected output:**
```text
db.users.find({ $nor: [{ status: "inactive" }, { status: "banned" }] });
```

> [!check]- Answer
> ```javascript
> db.users.find({
>   $nor: [{ status: "inactive" }, { status: "banned" }]
> });
> ```
>
> **Explanation:** `$nor: [ ... ]` matches documents failing all specified clause conditions.

## 7. Related Terms
- [Query Filter (Filter Document)](query_filter.md) — The parent filter layout.
- [Implicit `$eq` & Combining Conditions](implicit_eq_combining.md) — Shorthand logic.

---

## 8. Key Takeaways
- Logical query operators join multiple filter clauses.
- Direct equivalents of SQL's `AND`, `OR`, `NOT` logic controls.
- `$and`, `$or`, and `$nor` take a JavaScript array `[]` of filter objects.
- `$not` inverts the logic of subdocument operator expressions.
- Avoid explicit `$and` arrays for simple checks; default to implicit combining.
- Essential for designing complex branch routing filters.
