# Positional Operators (`$`, `$[]`, `$[<identifier>]`)

> **Level 4 — Advanced Querying**
> The BSON positional operators used inside update queries to identify and modify specific array elements (first match `$`, all elements `$[]`, or filtered elements `$[<identifier>]`) without rewriting the entire array.

---

## 1. Prerequisites

- [Array Update Operators (`$push`, `$pull`, `$addToSet`, `$pop`, `$each`)](../level_03/array_update_operators.md) — The parent array update operations.
- [Querying Arrays](querying_arrays.md) — Updating array elements using positional operators.

---

## 2. Term Category

**Query Operator** (Array Index Matching Operators): Positional Operators ($, $[]) identify specific array elements to target during update operations.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Parsed during query analysis. Evaluates array indices dynamically on the server to update BSON data blocks in place).

### (1) Design Motivation — "Why did we design this?"
Updating an array by adding (`$push`) or removing (`$pull`) elements is simple. 

But what if you need to **modify an existing value inside the array**?
-   Changing the score of *only the Math class* inside a user's grade list.
-   Incrementing the quantity of *all items* in a shopping cart.
-   Changing the status to `"shipped"` for *only the items in a list that cost more than $100*.

If you try to write this by reading the document, looping in JavaScript, and rewriting, you face race conditions and high network overhead.

We designed the **Positional Operators** to allow you to perform inline array updates directly on the server:
-   They act as **variable index placeholders** inside your update path (e.g. `"grades.$.score"`).
-   MongoDB resolves the correct index offset dynamically on disk, updating only the target element.

---

### (2) The Three Positional Operators

#### 1. Matched Positional Operator (`$`)
Targets the **first** element in the array that matches the query filter.
-   *Syntax:* `{ $set: { "grades.$.grade": "A" } }`
-   *Requirement:* The array field **must** be present in the query filter.

#### 2. All Positional Operator (`$[]`)
Targets **all** elements in the specified array field.
-   *Syntax:* `{ $inc: { "grades.$[]": 5 } }` (Increments every element in the array).

#### 3. Filtered Positional Operator (`$[<identifier>]`)
Targets only elements that match custom conditions defined in the `arrayFilters` option parameter (which we will learn in the next term).
-   *Syntax:* `{ $set: { "grades.$[elem].status": "pass" } }`

---

### (3) Reality Metaphor (Filing Cabinet Shelves)
Imagine updating boxes stored on shelves:
-   **Matched Positional (`$`):** *"Search the shelves from top to bottom. Find **the first shelf** holding a blue box, and write 'Discount' on its price tag."*
-   **All Positional (`$[]`):** *"Walk down the rack and write 'Taxed' on **every single** box on the shelves."*
-   **Filtered Positional (`$[item]`):** *"Walk down the rack. For **any box that weighs more than 10kg** (`arrayFilters`), write 'Heavy' on its side label."*

---

### (4) Code Examples

#### 1. Updating the Matched Element ($)
Let's update Alice's Math score to 95. We must include the array in the filter:

```javascript
db.users.updateOne(
  { _id: 1, "grades.subject": "Math" },   // Query filter LOCATES the index
  { $set: { "grades.$.score": 95 } }      // '$' holds the matched index
);
```

#### 2. Updating All Elements ($[])
Add 5 bonus points to every grade:

```javascript
db.users.updateOne(
  { _id: 1 },
  { $inc: { "grades.$[].score": 5 } }     // '$[]' matches all indices
);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to use the matched positional operator ($) in the update parameter without listing the array in the query filter

**The mistake:** Running the query `db.users.updateOne({ _id: 1 }, { $set: { "grades.$.score": 95 } })`.

**Why it's wrong:** The matched positional operator `$` is a placeholder that represents the index of the matching query element. 

If the query filter only checks `{ _id: 1 }` and doesn't inspect the array, the query engine has no idea which array element matched. 

MongoDB will throw an immediate error:
`ERROR: The positional operator did not find the match needed from the query.`

**Fix: Always ensure the array field and its query conditions are present inside the query filter argument when using `$`.**

---



### Mistake 2: Using the Positional Operator `$` Without Including the Array Field in Query Filter

**The mistake:** Executing `db.users.updateOne({ _id: 1 }, { $set: { "grades.$.score": 100 } })` without `grades` in filter.

**Why it's wrong:** The positional `$` operator references the FIRST array element that matched the query filter. If the array field is missing from the filter, `$` has no target element.

*Incorrect:*
```javascript
db.users.updateOne({ _id: 1 }, { $set: { "grades.$.score": 100 } }); // ❌ Missing grades in query filter!
```

*Fix:*
```javascript
db.users.updateOne({ _id: 1, "grades.score": { $lt: 60 } }, { $set: { "grades.$.score": 100 } });
```

### Mistake 3: Expecting Positional `$` to Update ALL Matching Array Elements Instead of the First Match

**The mistake:** Expecting `"grades.$.score": 100` to update 5 matching low grades in a single document.

**Why it's wrong:** The positional `$` operator updates ONLY the FIRST matching array element in each document. To update ALL matching array elements, use filtered array positional operator `$[elem]` with `arrayFilters`.

*Incorrect:*
```javascript
// Expecting $ to update all low grades in document
```

*Fix:*
```javascript
db.users.updateOne({ _id: 1 }, { $set: { "grades.$[elem].score": 100 } }, { arrayFilters: [{ "elem.score": { $lt: 60 } }] });
```

## 5. Practice Exercises

### Exercise 1: Updating First Matched Array Element with `$`

**Scenario:**
Update the `status` to `"confirmed"` for the first item in an order's `items` array matching `itemId: "ITEM-101"`.

**Requirements:**
1. Filter on `"items.itemId": "ITEM-101"`.
2. Update `$set: { "items.$.status": "confirmed" }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.updateOne(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880"), "items.itemId": "ITEM-101" },
>   { $set: { "items.$.status": "confirmed" } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$` acts as a positional placeholder representing the index of the FIRST array element matching the query filter.
> 2. `"items.$.status"` updates that specific matched array index.
> 3. Requires the target array field to be present in the query filter.

---

### Exercise 2: Updating All Array Elements with `$[]`

**Scenario:**
Reset `loginAttempts` to 0 for ALL elements in a user's `deviceTokens` array.

**Requirements:**
1. Use `$set: { "deviceTokens.$[].loginAttempts": 0 }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.updateOne(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   { $set: { "deviceTokens.$[].loginAttempts": 0 } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$[]` applies the update modification to EVERY element in the array unconditionally.
> 2. Eliminates procedural loops when resetting array subfields.
> 3. Fast atomic bulk array update.

---

### Exercise 3: Filtered Positional Updating with `$[identifier]`

**Scenario:**
Increment `qty` by 10 ONLY for items in `inventory` array where `price < 15`.

**Requirements:**
1. Use `$[item]` with `arrayFilters: [{ "item.price": { $lt: 15 } }]`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.stores.updateOne(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   { $inc: { "inventory.$[item].qty": 10 } },
>   { arrayFilters: [{ "item.price": { $lt: 15 } }] }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$[identifier]` dynamically matches array elements satisfying `arrayFilters` conditions.
> 2. Updates multiple specific array items selectively.
> 3. Powerful pattern for nested document array manipulation.

---



## 6. Related Terms

- [Array Update Operators (`$push`, `$pull`, `$addToSet`, `$pop`, `$each`)](../level_03/array_update_operators.md) — The parent update operators.
- [`arrayFilters` Option](array_filters.md) — Custom filtered updates.

---

## 7. Key Takeaways
- Positional operators target elements inside BSON arrays for updates.
- Eliminates the need to read and rewrite entire array documents.
- Matched operator `$` updates the first element matching the query filter.
- Using `$` requires listing the array query filters in the first argument.
- All operator `$[]` updates every element in the array simultaneously.
- Filtered operator `$[id]` targets custom elements using `arrayFilters`.
- Prevents database write race conditions during concurrent array edits.
