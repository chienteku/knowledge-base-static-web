# `arrayFilters` Option

> **Level 4 — Advanced Querying**
> The options configuration array passed to MongoDB update methods to specify conditions for the filtered positional operator `$[<identifier>]`, enabling conditional modifications of multiple array elements.

---

## 1. Prerequisites

- [Positional Operators (`$`, `$[]`, `$[<identifier>]`)](positional_operators.md) — Array positional update operators ($[]).
- [Querying Arrays](querying_arrays.md) — Querying array elements.

---

## 2. Term Category

**Query Operator** (Array Update Filter Matching): arrayFilters specifies conditions determining which array elements to modify during update operations on embedded array fields.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Passed inside the options argument (the third parameter) of update queries. Compiled on the server to lock modifications to specific array indexes).

### (1) Design Motivation — "Why did we design this?"
We have learned how to update arrays:
-   `$` updates the **first** element that matches.
-   `$[]` updates **every** element in the array.

But what if you want to perform a **selective, bulk update** inside an array?
-   *Scenario:* A student has a list of test grades. You want to add 10 points to **every grade that is currently below 60**. 
    -   `$` is wrong because it will only fix the *first* failing grade.
    -   `$[]` is wrong because it will add 10 points to *every* grade, including those who already scored 100.

We designed the **`arrayFilters`** option to solve this conditional bulk-update problem. 

It acts as a filter screen. 

You write a placeholder variable name inside the update path (like `"grades.$[failing].score"`), and define the filter conditions for that variable in a separate options block. 

MongoDB scans the array, maps the variable to all matching elements, and executes the updates in a single query.

---

### (2) Syntax Mechanics
1.  **Define the Identifier:** Write a custom tag inside square brackets in the update path: `$[myVar]`.
2.  **Define the Filters:** Pass an array of condition objects in the options block:
    `{ arrayFilters: [ { "myVar.field": { $lt: 60 } } ] }`

---

### (3) Reality Metaphor (Robot Inspectors)
Imagine a warehouse conveyor belt containing boxes:
-   **Matched Positional (`$`):** A worker finds the first broken box, stamps it "Damaged", and stops working.
-   **All Positional (`$[]`):** A worker stamps "Damaged" on every single box on the belt.
-   **Filtered Positional (`$[box]` + `arrayFilters`):** A robotic scanner is programmed: **"Match rule: weight < 5kg"** (`arrayFilters`). 
    -   The robot inspects all boxes. 
    -   It paste a **"Lightweight"** sticker (`$[box]`) ONLY on the boxes that weigh less than 5kg.

---

### (4) Code Examples

#### Conditional Update on Arrays of Subdocuments
Let's add 10 points to Alice's failing grades (score < 60):

```javascript
db.users.insertOne({
  _id: 1,
  name: "Alice",
  grades: [
    { subject: "Math", score: 50 },
    { subject: "English", score: 55 },
    { subject: "History", score: 90 }
  ]
});

// Run conditional update
db.users.updateOne(
  { _id: 1 },                                     // 1. Query Filter
  { $inc: { "grades.$[failing].score": 10 } },    // 2. Update Path (identifier is 'failing')
  {
    arrayFilters: [ { "failing.score": { $lt: 60 } } ] // 3. ArrayFilters Option
  }
);

db.users.find({ _id: 1 });
// Output (Math and English are incremented; History stays 90):
// grades: [ { Math: 60 }, { English: 65 }, { History: 90 } ]
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misaligning the variable name used in the update path with the identifier defined in arrayFilters

**The mistake:** Writing the query like this:

```javascript
// BAD: Identifier name mismatch!
db.users.updateOne(
  { _id: 1 },
  { $set: { "grades.$[failing].status": "fail" } },
  { arrayFilters: [ { "fail_grade.score": { $lt: 60 } } ] } // Mismatch!
);
```

**Why it's wrong:** The update path uses `$[failing]`, but the `arrayFilters` option describes `fail_grade.score`. 

Because the names do not match, the query engine cannot resolve what `failing` represents. 

MongoDB will abort the query, throwing a `QueryParseException`.

**Fix: Always ensure the string placeholder used in the update path (`$[varName]`) matches the key prefix inside the `arrayFilters` condition object exactly.**

---



### Mistake 2: Mismatched Identifier Names Between Array Positional `$[elem]` and `arrayFilters`

**The mistake:** Writing `"grades.$[elem].score": 90` with `arrayFilters: [{ "item.score": 80 }]`.

**Why it's wrong:** The identifier tag in `$[elem]` MUST match the field identifier defined in `arrayFilters` (`elem.score` vs `item.score`). Mismatched identifiers throw error `No matching filter for element identifier`.

*Incorrect:*
```javascript
db.users.updateOne({ _id: 1 }, { $set: { "grades.$[elem].score": 90 } }, { arrayFilters: [{ "item.score": 80 }] }); // ❌ Identifier mismatch!
```

*Fix:*
```javascript
db.users.updateOne({ _id: 1 }, { $set: { "grades.$[elem].score": 90 } }, { arrayFilters: [{ "elem.score": 80 }] });
```

### Mistake 3: Omitting `arrayFilters` Option Argument when Using `$[elem]` Positional Operator

**The mistake:** Calling `updateOne()` with `$[elem]` syntax without passing `{ arrayFilters: [...] }` options.

**Why it's wrong:** Using `$[elem]` requires specifying the filtering criteria in the `arrayFilters` options parameter.

*Incorrect:*
```javascript
db.users.updateOne({ _id: 1 }, { $set: { "grades.$[elem].score": 90 } }); // ❌ Missing arrayFilters option!
```

*Fix:*
```javascript
db.users.updateOne({ _id: 1 }, { $set: { "grades.$[elem].score": 90 } }, { arrayFilters: [{ "elem.score": { $lt: 60 } }] });
```

## 5. Practice Exercises

### Exercise 1: Filtering Specific Array Elements During Updates

**Scenario:**
Update the `score` to `100` ONLY for grades >= 90 inside a student's `grades` array.

**Requirements:**
1. Use `arrayFilters: [{ "elem.grade": { $gte: 90 } }]` with positional `$[elem]`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.students.updateOne(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   { $set: { "grades.$[elem].score": 100 } },
>   { arrayFilters: [{ "elem.grade": { $gte: 90 } }] }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$[elem]` acts as an array element placeholder in the update path (`"grades.$[elem].score"`).
> 2. `arrayFilters` specifies condition matching rules for the `elem` placeholder.
> 3. Modifies matching array items selectively in a single atomic update.
> 
---

### Exercise 2: Updating Multiple Filtered Array Subdocuments

**Scenario:**
Set `status: "processed"` for all items in an order's `items` array where `qty > 5`.

**Requirements:**
1. Apply `arrayFilters` matching `qty > 5`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.updateMany(
>   { "items.qty": { $gt: 5 } },
>   { $set: { "items.$[item].status": "processed" } },
>   { arrayFilters: [{ "item.qty": { $gt: 5 } }] }
> );
> ```
>
> #### Technical Explanation
>
> 1. Target positional identifier (`$[item]`) correlates directly with array filter conditions.
> 2. Updates multiple array elements matching criteria simultaneously.
> 3. Eliminates whole-array replacement operations.
> 
---

### Exercise 3: Updating All Array Elements with `$[]`

**Scenario:**
Increment all items' `retryCount` by 1 across all array elements in `tasks` array using global `$%5B%5D`.

**Requirements:**
1. Use `$inc: { "tasks.$[].retryCount": 1 }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.jobs.updateOne(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   { $inc: { "tasks.$[].retryCount": 1 } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$[]` applies the update operator unconditionally to EVERY element in the array.
> 2. Increments subfields across all array items in a single pass.
> 3. Fast atomic array transformation.
> 
---



## 6. Related Terms

- [Update Operators (`$set`, `$unset`, `$inc`, `$rename`, `$currentDate`)](../level_03/update_operators.md) — Array update operators.

---

## 7. Key Takeaways
- `arrayFilters` defines conditions for the filtered positional operator `$[id]`.
- Enables conditional, bulk updates of multiple array elements.
- The placeholder identifier (e.g., `$[item]`) acts as a dynamic index variable.
- Pass conditions inside a JSON array inside the query options argument.
- Ensures only elements matching the filter are modified on disk.
- Variable names in the path and filters must match exactly.
- Prevents expensive application-side loops when modifying nested arrays.
