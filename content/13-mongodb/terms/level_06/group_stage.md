# `$group` Stage

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stage that groups input documents by a specified identifier key and applies accumulator operations to compute aggregate summaries, serving as the direct equivalent of SQL's `GROUP BY` clause.

---

## 1. Prerequisites

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.

---

## 2. Term Category

**Aggregation** (Key Reduction & Grouping Stage): The $group stage reduces document streams into distinct groups by a specified group key expression and computes accumulated metrics for each group.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Executes in memory. Capped by a strict **100MB limit** per stage. If the grouped data footprint exceeds 100MB, you must enable the `{ allowDiskUse: true }` option to allow temporary files spillover).

### (1) Design Motivation — "Why did we design this?"
Basic queries retrieve individual documents. 

However, business reports require summaries:
-   *"What is our total revenue per country?"*
-   *"How many items do we have in each warehouse?"*
-   *"What is the average rating for each product?"*

In PostgreSQL, you group rows using the `GROUP BY` clause:
`SELECT category, SUM(stock) FROM products GROUP BY category;`

We designed the **`$group`** stage in MongoDB to provide this grouping capability. 

It takes the incoming stream of individual documents, partitions them into separate groups based on a key you define, and computes summary statistics (like sums or averages) for each group, outputting one consolidated document per group.

---

### (2) The Structure of `$group`
The `$group` stage has a strict JSON structure:

```javascript
{
  $group: {
    _id: <grouping_key_expression>, // MANDATORY: Defines the group boundary
    <output_field_1>: { <accumulator_operator>: <field_expression> }
  }
}
```

#### Rule 1: The Grouping Identifier (`_id`)
You **must** specify the `_id` field. This tells MongoDB which field values define a group.
-   **Group by field:** `_id: "$category"` (Finds unique values of the `category` field. Note the **`$`** prefix!).
-   **Group all together:** `_id: null` (Groups all incoming documents into a single global group. Useful for calculating database-wide averages or sums, equivalent to running `SELECT SUM(amount) FROM orders` in SQL).

#### Rule 2: Field Path Dollar Prefixes
To reference a field's value in the grouping key or calculations, you **must prefix it with `$`** (e.g. `"$price"`). Omitting the `$` prefix treats the word as a literal string constant, grouping all documents under the same string value.

---

### (3) Reality Metaphor (Pigeonhole Mail Sorting)
Imagine a mail carrier sorting incoming letters:
-   **`$group` Stage:** A wall containing labeled **Pigeonhole Slots**.
    -   The mail carrier picks up a letter, reads the postal city key (`_id: "$city"`), and slides the letter into the slot labeled `"Boston"` or `"New York"`.
    -   If they are tracking metrics (like counting letters), they click a mechanical tally clicker (`$sum: 1`) attached to that specific slot.
    -   Once finished sorting, each pigeonhole slot represents one group bundle containing the aggregated count.

---

### (4) Code Examples

#### Grouping and Summing
Group products by category and calculate total stock levels:

```javascript
db.products.aggregate([
  {
    $group: {
      _id: "$category", // Group by the 'category' field values
      total_stock: { $sum: "$stock" } // Accumulator: sum the 'stock' field values
    }
  }
]);
// Output:
// { "_id": "Electronics", "total_stock": 450 }
// { "_id": "Clothing",    "total_stock": 1200 }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omitting the '$' prefix on the grouping key field path inside the '_id' declaration

**The mistake:** Writing the group stage as `{ $group: { _id: "category", count: { $sum: 1 } } }` to count products.

**Why it's wrong:** Without the `$` prefix, the query compiler treats the characters `"category"` as a literal string word. 

It groups all documents under the identical key value `"category"`. 

The output will display only one single group with a count of all items, rather than splitting them by individual categories.

**Fix: Always prefix the target grouping field path with a dollar sign: `_id: "$category"`.**

---



### Mistake 2: Grouping Entire Collections Without Specifying `_id: null` in `$group` Stage

**The mistake:** Writing `db.sales.aggregate([{ $group: { totalRevenue: { $sum: "$amount" } } }])` without `_id`.

**Why it's wrong:** The `_id` field is MANDATORY in `$group` stages! To calculate a single global aggregate across all documents, set `_id: null`.

*Incorrect:*
```javascript
db.sales.aggregate([{ $group: { totalRevenue: { $sum: "$amount" } } }]); // ❌ Missing _id field!
```

*Fix:*
```javascript
db.sales.aggregate([{ $group: { _id: null, totalRevenue: { $sum: "$amount" } } }]); // Global total
```

### Mistake 3: Using Non-Accumulator Expressions Directly inside `$group` Output Fields

**The mistake:** Writing `{ $group: { _id: "$category", name: "$name" } }`.

**Why it's wrong:** Output fields inside `$group` MUST use accumulator operators (e.g. `$first`, `$last`, `$push`, `$sum`). Direct field paths like `name: "$name"` are invalid.

*Incorrect:*
```javascript
db.sales.aggregate([{ $group: { _id: "$category", name: "$name" } }]); // ❌ Missing accumulator!
```

*Fix:*
```javascript
db.sales.aggregate([{ $group: { _id: "$category", firstName: { $first: "$name" } } }]);
```

## 5. Practice Exercises

### Exercise 1: Basic Grouping and Document Counting

**Scenario:**
Group documents in collection `users` by `role` and calculate total user count per role.

**Requirements:**
1. Use `$group: { _id: "$role", userCount: { $sum: 1 } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.aggregate([
>   {
>     $group: {
>       _id: "$role",
>       userCount: { $sum: 1 }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$group` collapses documents sharing the same `_id` group expression.
> 2. `{ $sum: 1 }` increments the accumulator counter by 1 for each document in the group.
> 3. Foundation stage for analytical summary reports.

---

### Exercise 2: Multi-Field Compound Group Keys

**Scenario:**
Group sales orders by BOTH `year` and `status` to analyze regional sales breakdowns.

**Requirements:**
1. Group by compound `_id: { year: { $year: "$createdAt" }, status: "$status" }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.aggregate([
>   {
>     $group: {
>       _id: {
>         year: { $year: "$createdAt" },
>         status: "$status"
>       },
>       totalRevenue: { $sum: "$totalAmount" }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. Compound group keys (`_id: { k1: v1, k2: v2 }`) group document streams across multiple dimensions.
> 2. Evaluates date extraction expressions directly inside the group key.
> 3. Enables multi-dimensional pivot reporting.

---

### Exercise 3: Global Single-Document Aggregation

**Scenario:**
Calculate the total revenue (`$sum`) and average discount (`$avg`) across ALL orders in the collection without splitting by category.

**Requirements:**
1. Use `_id: null` in `$group`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.aggregate([
>   {
>     $group: {
>       _id: null,
>       grandTotalRevenue: { $sum: "$totalAmount" },
>       averageDiscount: { $avg: "$discount" }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. Setting `_id: null` collapses the ENTIRE document stream into a single global summary output document.
> 2. Computes collection-wide KPI totals.
> 3. Returns a single document response payload.

---



## 6. Related Terms

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Accumulator Operators (`$sum`, `$avg`, `$min`, `$max`, `$count`, `$push`, `$addToSet`)](accumulator_operators.md) — The calculation operators.
- [`$match` Stage](match_stage.md) — Related concept: `$match` Stage.

---

## 7. Key Takeaways
- `$group` aggregates documents by a specified field key.
- Direct NoSQL equivalent to SQL's `GROUP BY` statement.
- The `_id` field is mandatory and defines the grouping key.
- Set `_id: null` to calculate a single global sum or average.
- Always prefix grouping and calculation fields with `$` (e.g. `"$price"`).
- Runs in memory; requires `{ allowDiskUse: true }` if data exceeds 100MB.
- Outputs a single consolidated document per unique grouping key.
