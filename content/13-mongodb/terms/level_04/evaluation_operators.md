# Evaluation Query Operators (`$regex`, `$expr`, `$mod`)

> **Level 4 — Advanced Querying**
> The BSON query operators used to perform calculations or logic checks during query execution, specifically string pattern matching (`$regex`), comparing fields within the same document (`$expr`), and modulo math (`$mod`).

---

## 1. Prerequisites

- [Query Filter (Filter Document)](../level_03/query_filter.md) — The parent query filters context.
- [`find()` / `findOne()`](../level_03/find.md) — Evaluating complex query expression operators.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Evaluated in memory. Aggregation expressions inside `$expr` require parsing by the document projection engine, making these operations CPU-intensive compared to simple indexes lookups).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard query filters evaluate a field against a static, constant value:
`db.products.find({ price: { $gt: 50 } })`

However, some queries require dynamic logic:
-   **Regex Search:** Finding users whose names start with `"Al"` or contain `"smith"`.
-   **Cross-Field Comparison:** Finding orders where the `amount_paid` is **less than** the `total_bill` inside the *same* document.
-   **Arithmetic Modulo:** Distributing tasks across workers by matching documents where the `id` is divisible by 4.

In PostgreSQL, cross-field checks are simple:
`SELECT * FROM orders WHERE amount_paid < total_bill;`

We designed the **Evaluation Operators** in MongoDB to support these calculations. 

Because MongoDB's standard filter syntax is strictly key-value based, we use operators like **`$expr`** to unlock aggregation expression syntax inside query filters, allowing you to run cross-field math.

---

### (2) The Three Evaluation Operators

#### 1. `$regex` (Regular Expression)
Performs string pattern matching queries. (We will explore `$regex` in Term #57).

#### 2. `$expr` (Aggregation Expressions)
Enables comparing fields within the same document or executing aggregation functions in the query filter.
-   *Syntax:* `{ $expr: { $lt: [ "$amount_paid", "$total_bill" ] } }`
-   *Field Prefixes:* Inside `$expr`, you **must prefix field names with `$`** (e.g. `"$amount_paid"`) to tell the compiler to evaluate the field's value rather than treating the string as a literal text label.

#### 3. `$mod` (Modulo Arithmetic)
Finds documents where a numeric field modulo a divisor equals a remainder.
-   *Syntax:* `{ field: { $mod: [ divisor, remainder ] } }`
-   *Example:* `{ qty: { $mod: [ 2, 0 ] } }` (Finds even quantities).

---

### (3) Reality Metaphor (The Clerk's Calculator)
-   **Standard Query:** A warehouse checker looks at a box label and checks: *"Is the price tag > 50?"* (Fast, simple check).
-   **`$expr` Query:** The checker pulls out a **Scientific Calculator**. 
    -   They read the value in Box A, read the value in Box B, subtract them, and check if the difference is positive. 
    -   This takes more mental effort (CPU cycles) and slows down the inspection line, but lets them perform complex logic.

---

### (4) Code Examples

#### 1. Comparing Two Fields in a Document ($expr)
Find all orders where users paid less than their total balance:

```javascript
db.orders.insertOne({
  _id: 1,
  total_bill: NumberDecimal("100.00"),
  amount_paid: NumberDecimal("80.00")
});

db.orders.find({
  $expr: { $lt: [ "$amount_paid", "$total_bill" ] } // Uses aggregation math
});
```

#### 2. Filtering Even Numbers ($mod)
Select items that fit exactly into groups of 3:

```javascript
db.products.find({
  stock: { $mod: [ 3, 0 ] } // Matches stock 3, 6, 9, 12, etc.
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Omitting the '$' prefix on field paths inside the '$expr' operator array

**The mistake:** Writing `{ $expr: { $lt: [ "amount_paid", "total_bill" ] } }` to compare the two fields.

**Why it's wrong:** Without the `$` prefix, MongoDB treats `"amount_paid"` and `"total_bill"` as literal text strings. 

It compares the spelling of the string words alphabetically. 

Since `"amount_paid"` is alphabetically less than `"total_bill"`, this query will evaluate to `true` for **every document in the collection**, returning incorrect data.

**Fix: Always prefix the field keys with `$` inside aggregation expressions to instruct the compiler to read the field value.**

```javascript
// CORRECT
{ $expr: { $lt: [ "$amount_paid", "$total_bill" ] } }
```

---



### Mistake 2: Using `$where` or `$expr` Expressions That Prevent Index Usage on Large Collections

**The mistake:** Running `db.orders.find({ $where: "this.price > this.cost" })` on 10M documents.

**Why it's wrong:** `$where` executes JavaScript evaluation code per document in a single-threaded engine, bypassing B-Tree indexes and causing severe CPU degradation. Use `$expr` with indexes where possible.

*Incorrect:*
```javascript
db.orders.find({ $where: "this.price > this.cost" }); // ❌ Slow single-threaded JS evaluation!
```

*Fix:*
```javascript
db.orders.find({ $expr: { $gt: ["$price", "$cost"] } }); // Native BSON expression evaluation
```

### Mistake 3: Confusing Document Field Paths `$field` inside `$expr` with Plain Field Names

**The mistake:** Writing `db.orders.find({ $expr: { $gt: ["price", "cost"] } })` without `$` prefixes.

**Why it's wrong:** Inside `$expr` aggregation expressions, field paths MUST be prefixed with `$` (e.g. `"$price"`, `"$cost"`). Un-prefixed `"price"` is parsed as a literal string.

*Incorrect:*
```javascript
db.orders.find({ $expr: { $gt: ["price", "cost"] } }); // ❌ Compares literal strings "price" and "cost"!
```

*Fix:*
```javascript
db.orders.find({ $expr: { $gt: ["$price", "$cost"] } }); // Compares document field values
```

## 6. Practice Exercises

### Exercise 1: Cross-Field Comparison Query

**Problem:** You have a `users` collection. Each document contains `monthly_budget` and `monthly_spending` fields. 
Write the query to locate all users who have exceeded their budget (where `monthly_spending` is strictly greater than `monthly_budget`).

**Expected output:**
> [!check]- Answer
> ```javascript
> db.users.find({
>   $expr: { $gt: [ "$monthly_spending", "$monthly_budget" ] }
> });
> ```
> - The query compares two fields in the same document, requiring the `$expr` operator.
> - Prefix both fields with the dollar sign `$` inside the comparison array.

---



### Exercise 2: Comparing Two Fields in Same Document with `$expr`

**Problem:** Query orders where `spent` amount exceeds `budget` field using `$expr`.

**Expected output:**
> [!check]- Answer
> ```text
> db.orders.find({ $expr: { $gt: ["$spent", "$budget"] } });
> ```
> ```javascript
> db.orders.find({
>   $expr: { $gt: ["$spent", "$budget"] }
> });
> ```
>
> **Explanation:** `$expr` allows using aggregation expressions inside standard `find()` query filters.

---

### Exercise 3: Modulus Evaluation with `$mod`

**Problem:** Query documents where `qty` is divisible by 5 using `$mod: [5, 0]`.

**Expected output:**
> [!check]- Answer
> ```text
> db.inventory.find({ qty: { $mod: [5, 0] } });
> ```
> ```javascript
> db.inventory.find({ qty: { $mod: [5, 0] } });
> ```
>
> **Explanation:** `{ field: { $mod: [divisor, remainder] } }` evaluates modulo arithmetic operations.

## 7. Related Terms

- [`$regex` (Regular Expressions)](regex.md) — String matching.

---

## 8. Key Takeaways
- Evaluation operators execute calculations or logic checks during queries.
- `$expr` allows the comparison of two fields within the same document.
- Fields inside `$expr` must be prefixed with `$` to read their values.
- `$mod` performs modulo calculations on numbers (e.g. finding even numbers).
- Aggregation functions and `$expr` bypass index optimization; use them carefully.
- Limit evaluation queries on large datasets to prevent collection scans.
