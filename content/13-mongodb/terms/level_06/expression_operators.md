# Expression Operators in Aggregation (`$cond`, `$ifNull`, `$switch`, `$concat`, `$dateToString`)

> **Level 6 — Aggregation Framework**
> The BSON expression operators used inside pipeline stages to execute conditional logic (`$cond`, `$switch`), handle null values (`$ifNull`), format strings (`$concat`), and format dates (`$dateToString`).

---

## 1. Prerequisites

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [`$project` / `$addFields` Stages](project_addfields.md) — The stages where expressions execute.

---

## 2. Term Category

**Aggregation** (Field Transformation Functions): Expression Operators evaluate string, math, date, and logical transformation functions on document fields within aggregation pipeline stages.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Evaluated in memory on the database server. Extends pipeline processing capabilities, allowing complex calculations to run near the data).

### (1) Design Motivation — "Why did we design this?"
Raw fields stored on disk are rarely formatted exactly as your front-end UI needs them. 

You need a way to transform values during query execution:
-   **Conditional Logic:** Flagging orders as `"Big Spender"` if they exceed $500.
-   **Null Fallbacks:** Replacing missing email values with a `"no-email@domain.com"` placeholder.
-   **String Concatenation:** Merging first and last names together.
-   **Date Formatting:** Converting a BSON Date object to a clean `"YYYY-MM-DD"` text string.

In SQL, you write custom query functions:
`SELECT CONCAT(first, ' ', last) AS name, COALESCE(phone, 'N/A') AS tel FROM users;`

We designed the **BSON Expression Operators** to provide this formatting logic inside MongoDB aggregation pipelines. 

They allow you to execute calculations, string formatting, and date formatting directly on the database server, reducing the formatting work required in your backend application code.

---

### (2) The Five Core Expression Operators

#### 1. `$cond` (Ternary Conditional Check)
Evaluates a boolean condition and returns one of two expressions (if/then/else).
-   *Syntax:* `{ $cond: { if: { $gte: [ "$score", 50 ] }, then: "pass", else: "fail" } }`

#### 2. `$ifNull` (Null Fallback)
Evaluates an expression. If it is null or missing, it returns a replacement default value. (Equivalent to SQL `COALESCE`).
-   *Syntax:* `{ $ifNull: [ "$phone", "No Phone Provided" ] }`

#### 3. `$switch` (Multi-branch conditional evaluation)
Evaluates a list of cases (if/then, if/then, else). (Equivalent to SQL `CASE WHEN`).

#### 4. `$concat` (String Merging)
Concatenates multiple string fields together into a single string.
-   *Syntax:* `{ $concat: [ "$first_name", " ", "$last_name" ] }`

#### 5. `$dateToString` (Date Formatting)
Converts a BSON Date object into a formatted string based on a specifier template (e.g. `%Y-%m-%d`).
-   *Syntax:* `{ $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }`

---

### (3) Reality Metaphor
Imagine a clerk checking forms:
-   **`$ifNull`:** The clerk checks the "Phone Number" box on a form. If the box is blank, they stamp **"No Phone Provided"** inside it before filing it.
-   **`$cond`:** The clerk checks the exam score. If the number is $\ge 50$, they stamp **"Pass"** on the header; if not, they stamp **"Fail"**.

---

### (4) Code Examples

#### Formatting Fields mid-pipeline
Let's format profiles and handle null fields:

```javascript
db.users.aggregate([
  {
    $set: {
      // 1. Concatenate strings
      fullname: { $concat: [ "$first_name", " ", "$last_name" ] },
      
      // 2. Handle null/missing fields
      phone_contact: { $ifNull: [ "$phone", "N/A" ] },
      
      // 3. Conditional categorization
      tier: {
        $cond: {
          if: { $gte: [ "$purchase_count", 10 ] },
          then: "VIP",
          else: "Standard"
        }
      },
      
      // 4. Format dates
      registered_date: { 
        $dateToString: { format: "%Y-%m-%d", date: "$joined_at" } 
      }
    }
  }
]);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to use aggregation expression operators (like $concat) directly inside a standard find() query filter

**The mistake:** Running the query `db.users.find({ fullname: { $concat: [ "$first_name", " ", "$last_name" ] } })`.

**Why it's wrong:** The `find()` method query filter only understands search comparison operators (like `$eq`, `$gt`). 

It cannot process expression transformations like `$concat` natively.

**Fix: If you need to evaluate expressions in query filters, you must wrap them inside the `$expr` operator: `db.users.find({ $expr: { $eq: [ "$fullname", { $concat: [ "$first_name", " ", "$last_name" ] } ] } })`. Alternatively, run them inside aggregation pipeline stages.**

---



### Mistake 2: Forgetting `$` Prefixes on Document Field Arguments in Aggregation Expressions

**The mistake:** Writing `{ $concat: ["firstName", " ", "lastName"] }`.

**Why it's wrong:** Un-prefixed strings `"firstName"` are parsed as literal text strings! Field path arguments MUST be prefixed with `$` (`"$firstName"`, `"$lastName"`).

*Incorrect:*
```javascript
{ $concat: ["firstName", " ", "lastName"] } // ❌ Evaluates to literal text "firstName lastName"!
```

*Fix:*
```javascript
{ $concat: ["$firstName", " ", "$lastName"] } // Evaluates field values
```

### Mistake 3: Using Invalid Data Types in Mathematical Expressions

**The mistake:** Executing `{ $multiply: ["$price", "$qty"] }` when `price` contains string values `"19.99"`.

**Why it's wrong:** Math expressions require numeric BSON types (`int`, `long`, `double`, `decimal`). Passing strings causes expression failure. Convert using `$toDouble` or `$toInt` first.

*Incorrect:*
```javascript
{ $multiply: ["$price", "$qty"] } // ❌ Fails if price is string!
```

*Fix:*
```javascript
{ $multiply: [{ $toDouble: "$price" }, "$qty"] }
```

## 5. Practice Exercises

### Exercise 1: String Trimming and Lowercasing

**Scenario:**
Sanitize user email input in an aggregation stage by converting to lowercase and removing surrounding whitespace.

**Requirements:**
1. Use `$toLower` and `$trim`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.aggregate([
>   {
>     $project: {
>       cleanEmail: {
>         $toLower: {
>           $trim: { input: "$email" }
>         }
>       }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$trim` strips leading/trailing spaces.
> 2. `$toLower` normalizes string characters to lowercase UTF-8.
> 3. Standard string sanitization operator combination.

---

### Exercise 2: Conditional Logic Branching with `$switch`

**Scenario:**
Assign customer tier labels (`"VIP"`, `"Gold"`, `"Standard"`) based on `totalSpent` thresholds using `$switch`.

**Requirements:**
1. Use `$switch` with `branches` array.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.customers.aggregate([
>   {
>     $project: {
>       name: 1,
>       tier: {
>         $switch: {
>           branches: [
>             { case: { $gte: ["$totalSpent", 10000] }, then: "VIP" },
>             { case: { $gte: ["$totalSpent", 2500] }, then: "Gold" }
>           ],
>           default: "Standard"
>         }
>       }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$switch` evaluates a series of case expressions sequentially.
> 2. Returns the `then` value of the first matching case.
> 3. Replaces nested `$cond` expressions for clean multi-branch logic.

---

### Exercise 3: Array Mapping and Filtering with `$map` and `$filter`

**Scenario:**
Filter an order's `items` array to include ONLY items costing > `$20`, and double their `price` in output.

**Requirements:**
1. Combine `$map` and `$filter`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.aggregate([
>   {
>     $project: {
>       discountedItems: {
>         $map: {
>           input: {
>             $filter: {
>               input: "$items",
>               as: "item",
>               cond: { $gt: ["$$item.price", 20] }
>             }
>           },
>           as: "filteredItem",
>           in: {
>             name: "$$filteredItem.name",
>             newPrice: { $multiply: ["$$filteredItem.price", 0.5] }
>           }
>         }
>       }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$filter` selects elements from an input array satisfying a condition.
> 2. `$map` applies an expression to each item in an array to output a transformed array.
> 3. Functional array processing directly inside aggregation pipelines.

---



## 6. Related Terms

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [`$project` / `$addFields` Stages](project_addfields.md) — The executing stages.

---

## 7. Key Takeaways
- Expression operators transform field values inside aggregation stages.
- `$cond` executes ternary if/then/else logical checks.
- `$ifNull` handles missing or null values (equivalent to SQL `COALESCE`).
- `$switch` evaluates multiple conditional branches (equivalent to SQL `CASE`).
- `$concat` merges string fields; `$dateToString` formats BSON Date objects.
- Fields referenced inside expressions must be prefixed with `$` (e.g. `"$score"`).
- Expression operators cannot be used directly in standard `find()` filters.
- Offloads formatting logic from application servers to the database server.
