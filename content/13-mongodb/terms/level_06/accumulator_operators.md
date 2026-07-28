# Accumulator Operators (`$sum`, `$avg`, `$min`, `$max`, `$count`, `$push`, `$addToSet`)

> **Level 6 — Aggregation Framework**
> The specialized aggregation operators used within `$group` stages to compute statistical summaries or collect values into arrays across grouped documents.

---

## 1. Prerequisites
- [`$group` Stage](group_stage.md) — The pipeline stage where accumulators execute.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **Universal Standard** (Supported across all document database platforms. Processes data sequentially in the database memory engine).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Grouping documents is only the first step. 

Once documents are sorted into bins (e.g. grouping sales by month), you must compute stats on those bins:
-   Adding up the sales amounts.
-   Finding the average temperature.
-   Gathering a list of all product names sold in each country.

In PostgreSQL, you use aggregate functions:
`SELECT SUM(price), AVG(price), MIN(price) FROM products GROUP BY category;`

We designed the **BSON Accumulator Operators** to run these calculations in MongoDB. 

In addition to standard math functions, MongoDB includes NoSQL-specific accumulators (like `$push` and `$addToSet`) that allow you to **gather values into arrays**, enabling you to reshape hierarchical data during grouping rather than simply squashing it into single numbers.

---

### (2) The Core Accumulator Operators

| BSON Operator | SQL Equivalent | Description | Example Syntax |
| :--- | :--- | :--- | :--- |
| **`$sum`** | `SUM()` | Adds up numeric values. | `{ $sum: "$price" }` |
| **`$avg`** | `AVG()` | Calculates the mathematical average. | `{ $avg: "$price" }` |
| **`$min`** | `MIN()` | Returns the lowest value. | `{ $min: "$price" }` |
| **`$max`** | `MAX()` | Returns the highest value. | `{ $max: "$price" }` |
| **`$count`** | `COUNT(*)` | Counts matching documents. | `{ $count: {} }` *(or `$sum: 1`)* |
| **`$push`** | *None* | Appends all values to a list array. | `{ $push: "$username" }` |
| **`$addToSet`**| *None* | Appends values to a list, **skipping duplicates**. | `{ $addToSet: "$status" }` |

---

### (3) Reality Metaphor
Imagine a clerk audit box folders of event registrations:
-   **`$sum`:** Reading the ticket fee paid on each sheet and adding the numbers into a running **Calculator**.
-   **`$push`:** Taking the business card from each folder and dropping them all into a physical **Envelope** (the array) labeled with that company's name. (You collect all cards).
-   **`$addToSet`:** Checking the envelope first: *"Do we already have a card for 'Sales'? Yes."* You throw the duplicate away, keeping only unique cards.

---

### (4) Code Examples

#### Aggregating Sales and Building customer ID Lists
Let's group order records by category. We calculate sales statistics and collect a deduplicated list of customer IDs:

```javascript
db.orders.aggregate([
  {
    $group: {
      _id: "$category",
      
      // 1. Math Aggregates
      total_revenue: { $sum: "$amount" },
      avg_sale_price: { $avg: "$amount" },
      highest_sale: { $max: "$amount" },
      order_count: { $sum: 1 }, // Adds 1 for each document
      
      // 2. NoSQL Array Aggregates
      customer_list: { $addToSet: "$customer_id" } // Deduplicated list of buyers!
    }
  }
]);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use accumulator operators inside standard find() query projections

**The mistake:** Running the query `db.products.find({}, { total: { $sum: "$price" } })` to add up items.

**Why it's wrong:** Accumulator operators require the context of an aggregation stage (like `$group`) to determine *which* documents to aggregate over. 

Running them inside a standard `find()` query projection will trigger syntax and parser validation errors.

**Fix: Always execute aggregates inside the `$group` stage array of `aggregate()` queries.**

---



### Mistake 2: Using Accumulators Outside of `$group` or `$project` Stages

**The mistake:** Using `$sum` accumulator expressions directly inside `$match` stage queries.

**Why it's wrong:** Accumulators (`$sum`, `$avg`, `$push`, `$addToSet`) calculate state across documents and are valid ONLY inside `$group`, `$project`, `$set`, or windowing stages.

*Incorrect:*
```javascript
db.sales.aggregate([{ $match: { total: { $sum: "$items.price" } } }]); // ❌ Accumulator in $match stage!
```

*Fix:*
```javascript
db.sales.aggregate([{ $group: { _id: "$category", totalSales: { $sum: "$price" } } }]);
```

### Mistake 3: Confusing Accumulator `$sum: 1` (Count) with `$sum: '$field'` (Value Sum)

**The mistake:** Writing `{ $sum: "$amount" }` expecting it to count the number of documents.

**Why it's wrong:** `$sum: 1` increments the counter by 1 per document (counting documents). `$sum: "$amount"` sums the numeric values of the `amount` field across documents.

*Incorrect:*
```javascript
{ $group: { _id: "$status", count: { $sum: "$price" } } }; // ❌ Sums prices instead of counting documents!
```

*Fix:*
```javascript
{ $group: { _id: "$status", count: { $sum: 1 } } }; // Correct count
```

## 6. Practice Exercises

### Exercise 1: Multi-Accumulator Query

**Problem:** You have a `students` collection containing `class_name` and `score` fields. 
Write the aggregation pipeline containing a single `$group` stage that groups students by `class_name`, returning:
1.  The average score under the field name `average_score`.
2.  An array of all student scores in that class under the field name `all_scores` (duplicates allowed).

**Expected output:**
> [!check]- Answer
> ```javascript
> [
>   {
>     $group: {
>       _id: "$class_name",
>       average_score: { $avg: "$score" },
>       all_scores: { $push: "$score" }
>     }
>   }
> ]
> ```
> - The grouping key is `"class_name"`.
> - Use `$avg` for the average math score.
> - Use `$push` to compile all scores into the array field `all_scores`.

---



### Exercise 2: Grouping and Summing Totals

**Problem:** Group sales by `category` and calculate total revenue sum using `$sum: "$amount"`.

**Expected output:**
> [!check]- Answer
> ```text
> db.sales.aggregate([{ $group: { _id: "$category", totalRevenue: { $sum: "$amount" } } }]);
> ```
> ```javascript
> db.sales.aggregate([
>   { $group: { _id: "$category", totalRevenue: { $sum: "$amount" } } }
> ]);
> ```
>
> **Explanation:** `{ $sum: "$field" }` accumulates total field values within group buckets.

---

### Exercise 3: Collecting Unique Values with `$addToSet`

**Problem:** Group users by `country` collecting array of unique `roles` using `$addToSet`.

**Expected output:**
> [!check]- Answer
> ```text
> db.users.aggregate([{ $group: { _id: "$country", roles: { $addToSet: "$role" } } }]);
> ```
> ```javascript
> db.users.aggregate([
>   { $group: { _id: "$country", roles: { $addToSet: "$role" } } }
> ]);
> ```
>
> **Explanation:** `$addToSet` collects unique field values into an array within each group.

## 7. Related Terms
- [`$group` Stage](group_stage.md) — The parent pipeline stage.

---

## 8. Key Takeaways
- Accumulators perform calculations across grouped document streams.
- Direct equivalents to SQL aggregate functions (`SUM`, `AVG`, `MIN`, `MAX`, `COUNT`).
- `{ $sum: 1 }` counts documents; equivalent to the BSON `$count` stage.
- `$push` gathers values from grouped documents into a standard list array.
- `$addToSet` gathers values into a list array while skipping duplicate values.
- Accumulators are strictly resolved on the database server during aggregate loops.
- Do not use accumulator operators outside aggregation `$group` stages.
