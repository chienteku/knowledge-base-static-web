# Array Update Operators (`$push`, `$pull`, `$addToSet`, `$pop`, `$each`)

> **Level 3 — CRUD Operations (Create, Read, Update, Delete)**
> The BSON update operators used to modify array fields inside documents, supporting element insertion (`$push`), deduplication (`$addToSet`), and element removal (`$pull`).

---

## 1. Prerequisites

- [Array](../level_02/array_type.md) — The target list fields modified.
- [Update Operators (`$set`, `$unset`, `$inc`, `$rename`, `$currentDate`)](update_operators.md) — The parent update operator context.

---

## 2. Term Category

**Query Operator** (Array Mutation Operators): Array Update Operators ($push, $pull, $addToSet, $pop, $position) modify embedded array fields within MongoDB documents atomically.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported across NoSQL document platforms. Executes atomic modifications directly on the server to prevent race conditions during concurrent list updates).

### (1) Design Motivation — "Why did we design this?"
As learned in `array_type.md`, MongoDB documents natively support Array (list) fields. 

If your backend code wants to append a new tag to a product's tag list:
-   **The slow, unsafe way:** You fetch the document over the network, push the tag into the JavaScript array in your server's memory, and write the entire document back to disk. 
    -   *The Danger:* If two users try to add tags simultaneously, their changes will conflict and overwrite each other.

We designed the **Array Update Operators** to perform high-speed, atomic updates **directly on the database server.** 

Instead of reading the document, the application sends a single command: *"Add this element to the list."* 

MongoDB modifies the array bytes in place on disk, ensuring concurrent writes are processed safely without conflicts.

---

### (2) The Core Array Update Operators

#### 1. `$push` (Append Element)
Appends a specified value to the end of an array.
-   *Syntax:* `{ $push: { tags: "sale" } }`

#### 2. `$addToSet` (Append Unique Element)
Appends a value to an array **only if the value does not already exist** in the list, preventing duplicates. (Treats the array as a mathematical Set).
-   *Syntax:* `{ $addToSet: { tags: "sale" } }`

#### 3. `$pull` (Remove matching elements)
Removes all array elements that match a specified value or query condition.
-   *Syntax:* `{ $pull: { tags: "promo" } }`

#### 4. `$pop` (Remove by Index boundaries)
Removes the first (`-1`) or last (`1`) element of an array.
-   *Syntax:* `{ $pop: { tags: 1 } }`

#### 5. `$each` (Batch modifier)
Used alongside `$push` or `$addToSet` to add multiple elements inside a single update query.
-   *Syntax:* `{ $push: { tags: { $each: ["new", "summer"] } } }`

---

### (3) Reality Metaphor (Clipboard Todo List)
Imagine a todo list written on a physical clipboard:
-   **`$push`:** Scribbling a new chore at the bottom of the paper list. You write it down even if it is a duplicate of a chore already written.
-   **`$addToSet`:** You read the list from top to bottom: *"Is 'Wash Car' already written here? No."* You write it down. If it was already there, you do nothing.
-   **`$pull`:** Running a red pen through the list, **crossing off every line** that contains the word *"Clean"*.

---

### (4) Code Examples

#### Adding and Removing Tags (push and pull)
Let's manage category tags on an e-commerce product:

```javascript
db.products.insertOne({
  _id: 10,
  name: "Sneakers",
  tags: ["shoes", "clothing"]
});

// 1. Add 'on_sale' to the array (duplicates allowed)
db.products.updateOne(
  { _id: 10 },
  { $push: { tags: "on_sale" } }
);

// 2. Add multiple tags uniquely (skips duplicates)
db.products.updateOne(
  { _id: 10 },
  { $addToSet: { tags: { $each: ["shoes", "clearance"] } } }
  // 'shoes' is skipped because it exists; 'clearance' is added!
);

// 3. Remove 'clothing' from the array
db.products.updateOne(
  { _id: 10 },
  { $pull: { tags: "clothing" } }
);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Utilizing '$push' for unique items, leading to duplicate values in array fields

**The mistake:** Running `$push` to assign user roles (like `"admin"`), resulting in arrays containing `["admin", "admin", "user", "admin"]` after multiple update runs.

**Why it's wrong:** `$push` is a simple append operator; it does not check existing elements. 

This causes array bloat and introduces logic bugs in authorization checks.

**Fix: If an array must contain unique values only, always use `$addToSet` instead of `$push`.**

---





### Mistake 2: Using Direct Field Replacement Instead of `$push` or `$addToSet` to Modify Array Fields

**The mistake:** Executing `db.users.updateOne({ _id: id }, { $set: { tags: ["new_tag"] } })` expecting to append an item.

**Why it's wrong:** Using `$set` on an array field overwrites the entire array object with the new single-element array! Use `$push` (append) or `$addToSet` (append unique).

*Incorrect:*
```javascript
db.users.updateOne({ _id: id }, { $set: { tags: ["new_tag"] } }); // ❌ Overwrites existing array!
```

*Fix:*
```javascript
db.users.updateOne({ _id: id }, { $addToSet: { tags: "new_tag" } }); // Appends unique element
```



### Mistake 3: Pushing Arrays of Items Without Using `$each` Operator

**The mistake:** Executing `db.users.updateOne({ _id: id }, { $push: { tags: ["tag1", "tag2"] } })`.

**Why it's wrong:** Without `$push: { field: { $each: [...] } }`, MongoDB pushes the ENTIRE array as a single nested array element `[["tag1", "tag2"]]`.

*Incorrect:*
```javascript
db.users.updateOne({ _id: id }, { $push: { tags: ["tag1", "tag2"] } }); // Pushes nested array!
```

*Fix:*
```javascript
db.users.updateOne({ _id: id }, { $push: { tags: { $each: ["tag1", "tag2"] } } });
```



## 5. Practice Exercises

### Exercise 1: Appending Array Items with `$push` and `$slice`

**Scenario:**
Append a new log entry to a user's `recentActivity` array while capping the maximum array length to the 5 most recent entries.

**Requirements:**
1. Use `$push` with `$each`, `$sort`, and `$slice: -5`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.updateOne(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   {
>     $push: {
>       recentActivity: {
>         $each: [{ action: "login", timestamp: new Date() }],
>         $sort: { timestamp: -1 },
>         $slice: -5
>       }
>     }
>   }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$push` appends elements to array fields atomically.
> 2. `$slice: -5` caps the array length, keeping only the 5 newest elements.
> 3. Maintains array size bounds directly at the storage engine tier.
> 
---

### Exercise 2: Removing Specific Array Items with `$pull`

**Scenario:**
Remove tag `"deprecated"` from all product `tags` arrays across the entire collection.

**Requirements:**
1. Use `updateMany()` with `$pull: { tags: "deprecated" }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.updateMany(
>   { tags: "deprecated" },
>   { $pull: { tags: "deprecated" } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$pull` removes all instances of a matching value from array fields.
> 2. Operates across single values or complex object filter criteria.
> 3. Eliminates client-side array manipulation.
> 
---

### Exercise 3: Deduplicated Insertion with `$addToSet`

**Scenario:**
Add category `"electronics"` to a product's `categories` array without creating duplicate entries.

**Requirements:**
1. Use `$addToSet`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.updateOne(
>   { _id: new ObjectId("60c72b2f9b1d8b2c88888880") },
>   { $addToSet: { categories: "electronics" } }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$addToSet` treats arrays as sets, ignoring duplicates.
> 2. Guarantees unique array elements without client-side checking.
> 3. Fast atomic array updates.
> 
---



## 6. Related Terms

- [Array](../level_02/array_type.md) — The data structure.
- [Update Operators (`$set`, `$unset`, `$inc`, `$rename`, `$currentDate`)](update_operators.md) — The parent update operators.

---

## 7. Key Takeaways
- Array update operators modify list fields atomically on the database server.
- Prevents concurrent overwrite conflicts when editing arrays.
- `$push` appends elements to arrays; permits duplicate values.
- `$addToSet` appends elements uniquely, filtering out existing duplicates.
- `$pull` removes all array elements matching a value or query condition.
- Combine `$each` with `$push` or `$addToSet` to write multiple elements.
- `$pop` removes elements from array boundaries (first/last).
