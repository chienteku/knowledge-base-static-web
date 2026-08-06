# Aggregation Variables (`$$ROOT`, `$$CURRENT`, `$$NOW`, `let`)

> **Level 6 — Aggregation Framework**
> The system and user-defined variables accessible inside aggregation expressions, prefixed with a double dollar sign (`$$`), used to reference documents, timestamps, and parameters.

---

## 1. Prerequisites

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.

---

## 2. Term Category

**Aggregation** (Pipeline System Variables): Aggregation System Variables ($$ROOT, $$CURRENT, $$REMOVE, $$DESCEND, $$NOW) reference document context and runtime state within aggregation pipeline expressions.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Managed in the aggregation compiler scope. System variables are resolved in memory at runtime during document processing iterations).

### (1) Design Motivation — "Why did we design this?"
During complex document transformations inside a pipeline, you often need to access context outside the current field:
-   **Nesting a document:** Grouping documents by a category, but keeping the *entire original document structure* nested inside a `details` field.
-   **Consistent Timestamping:** Marking all documents processed in a nightly script with the exact same date-time stamp.
-   **Cross-Collection Joins:** Defining a variable in a parent document and passing it down to a sub-query inside a `$lookup` stage.

To support these contexts, MongoDB uses **Aggregation Variables**. 

To distinguish system and user-defined variables from standard document field paths (which use a single `$`), variables are **prefixed with a double dollar sign (`$$`)**.

---

### (2) The Core Aggregation Variables

#### 1. `$$ROOT` (System Variable)
References the top-level document as it originally entered the aggregation pipeline.
-   *Usage:* Moving the entire document inside a sub-key.

#### 2. `$$CURRENT` (System Variable)
References the document at the current evaluation step. 
-   *Usage:* Often identical to `$$ROOT`, but changes when evaluating inside nested loops (like `$map` or `$filter` array operators).

#### 3. `$$NOW` (System Variable)
Returns the current BSON Date timestamp on the database server.
-   *Benefit:* It is resolved once per aggregation batch. Every single document processed in the query will receive the **exact same timestamp**, preventing time-drift errors.

#### 4. `let` (User Variable Constructor)
A block used in stages like `$lookup` to define variables from the parent document (e.g. `let: { parentId: "$_id" }`), which are then referenced as `$$parentId` in sub-queries.

---

### (3) Reality Metaphor (Security Camera Angles)
Imagine auditing a theater performance:
-   **`$$ROOT`:** The **Ceiling Wide-Angle Camera**. No matter where an actor walks on the stage, this camera captures the entire building and cast.
-   **`$$CURRENT`:** A **Bodycam** strapped to the lead actor's chest. When they walk into a small changing closet (a nested array), the camera view narrows to show only the inside of that closet.
-   **`$$NOW`:** The **Stadium Wall Clock**. Every actor, guard, and camera reads the exact same time simultaneously.

---

### (4) Code Examples

#### Nesting Documents using $$ROOT
Let's group products by category and nested the entire original product document inside a `products_list` array:

```javascript
db.products.aggregate([
  {
    $group: {
      _id: "$category",
      // Use $$ROOT to push the entire original document into the list
      products_list: { $push: "$$ROOT" } 
    }
  }
]);

// Output:
// {
//   "_id": "Electronics",
//   "products_list": [
//     { "_id": 1, "name": "Laptop", "price": 1000, "category": "Electronics" },
//     { "_id": 2, "name": "Phone",  "price": 500,  "category": "Electronics" }
//   ]
// }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Utilizing a single dollar sign prefix ($ROOT) instead of a double dollar sign ($$ROOT) when referencing system variables

**The mistake:** Writing the aggregate stage as `{ $push: "$ROOT" }` to grab the document.

**Why it's wrong:** A single dollar sign tells MongoDB to look for a document field key named `"ROOT"`. 

Since your document does not contain a field named `"ROOT"`, the pipeline will append `null` values to your list.

**Fix: Always use double dollar signs (`$$`) to call system variables (`$$ROOT`, `$$CURRENT`, `$$NOW`) or variables defined in `let` blocks.**

```javascript
// CORRECT
{ $push: "$$ROOT" }
```

---



### Mistake 2: Confusing Variable References `$$var` with Field Paths `$field`

**The mistake:** Referencing aggregation variables with single `$` prefix (`$item` instead of `$$item`).

**Why it's wrong:** In MongoDB aggregations, `$field` references document field paths, whereas `$$var` references system variables (`$$NOW`, `$$ROOT`) or user-defined variables (`$$item` in `$map` / `$filter`).

*Incorrect:*
```javascript
db.users.aggregate([{ $project: { activeTags: { $filter: { input: "$tags", as: "tag", cond: { $eq: ["$tag", "tech"] } } } } }]); // ❌ Single $tag!
```

*Fix:*
```javascript
db.users.aggregate([{ $project: { activeTags: { $filter: { input: "$tags", as: "tag", cond: { $eq: ["$$tag", "tech"] } } } } }]); // Correct $$tag
```

### Mistake 3: Modifying System System Variables like `$$NOW` or `$$ROOT`

**The mistake:** Attempting to reassign `$$NOW` in `$let` blocks.

**Why it's wrong:** System variables (`$$NOW`, `$$CLUSTER_TIME`, `$$ROOT`, `$$REMOVE`) are read-only system constants.

*Incorrect:*
```javascript
{ $let: { vars: { NOW: new Date() }, ... } }
```

*Fix:*
```javascript
Use user-defined variable names without system prefixes in $let blocks
```

## 5. Practice Exercises

### Exercise 1: Accessing Root Documents with `$$ROOT`

**Scenario:**
Inside a `$group` stage, collect the entire original input document into an array using system variable `$$ROOT`.

**Requirements:**
1. Use `$push: "$$ROOT"`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.aggregate([
>   {
>     $group: {
>       _id: "$status",
>       allOrders: { $push: "$$ROOT" }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$$ROOT` references the top-level document currently being processed in the pipeline stage.
> 2. Preserves all original document fields inside group arrays.
> 3. Useful for document grouping and hierarchical restructuring.

---

### Exercise 2: Conditionally Omitting Fields with `$$REMOVE`

**Scenario:**
Project customer documents, dynamically omitting field `middleName` if it is null or empty using `$$REMOVE`.

**Requirements:**
1. Use `$cond` returning `"$middleName"` or `$$REMOVE`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.aggregate([
>   {
>     $project: {
>       name: 1,
>       middleName: {
>         $cond: {
>           if: { $eq: ["$middleName", null] },
>           then: "$$REMOVE",
>           else: "$middleName"
>         }
>       }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. Returning `$$REMOVE` in an expression causes MongoDB to omit the field key completely from output documents.
> 2. Avoids outputting `middleName: null` fields in clean API responses.
> 3. Dynamic schema cleanup.

---

### Exercise 3: Accessing Pipeline Execution Time with `$$NOW`

**Scenario:**
Calculate document age in days by comparing `createdAt` against system variable `$$NOW`.

**Requirements:**
1. Use `$$NOW` inside `$dateDiff`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.posts.aggregate([
>   {
>     $project: {
>       title: 1,
>       ageDays: {
>         $dateDiff: {
>           startDate: "$createdAt",
>           endDate: "$$NOW",
>           unit: "day"
>         }
>       }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$$NOW` returns the exact datetime timestamp at which the pipeline execution started.
> 2. Guarantees consistent time comparisons across all documents in a multi-second aggregation run.
> 3. Built-in system variable.

---



## 6. Related Terms

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [`$lookup` Stage](lookup_stage.md) — The join stage using `let`.

---

## 7. Key Takeaways
- Aggregation variables access system state and user parameters in expressions.
- Always prefixed with double dollar signs (`$$`) to separate them from fields.
- `$$ROOT` references the top-level document entering the pipeline.
- `$$CURRENT` references the document at the current evaluation boundary.
- `$$NOW` logs a single, synchronized database timestamp across a query batch.
- Single `$` references document keys; double `$$` references compiler variables.
- Use `let` blocks in `$lookup` stages to pass parameters to sub-pipelines.
