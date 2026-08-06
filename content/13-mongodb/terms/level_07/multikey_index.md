# Multikey Index

> **Level 7 — Indexes & Query Performance**
> The database index type automatically created by MongoDB when indexing an array field, which writes separate index keys for each individual element in the array to enable fast element lookups.

---

## 1. Prerequisites

- [Array](../level_02/array_type.md) — The array structures indexed.
- [Compound Index](compound_index.md) — Multi-field index parameters.

---

## 2. Term Category

**Index / Performance** (Array Element B-Tree Indexing): A Multikey Index automatically creates separate index entries for every individual element in an array field.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Automatically triggered when the query planner detects array values in the target path. Increases index size on disk proportional to array lengths).

### (1) Design Motivation — "Why did we design this?"
In document databases, fields natively store arrays (lists):
-   A blog post has tags: `["news", "tech"]`.
-   A user has a list of roles: `["editor", "admin"]`.

If you search for posts tagged `"tech"` without a specialized index, the database engine must scan every document to inspect array elements.

We designed the **Multikey Index** to optimize array queries. 

When you create an index on an array field:
`db.posts.createIndex({ tags: 1 })`

MongoDB detects the array and automatically builds a Multikey Index. 

Instead of writing a single index key for the array, **it writes a separate index key for every individual element in the array.** 

This allows the search engine to find the document instantly, whether you query for `"news"` or `"tech"`.

---

### (2) The Parallel Array Constraint (CRITICAL)
Because multikey indexes write separate keys for each array element, they carry a strict constraint: **You cannot create a compound index where more than one field is an array.**

Suppose you have a document:
`{ tags: ["A", "B"], sizes: [1, 2] }`

If you try to create a compound index:
`db.collection.createIndex({ tags: 1, sizes: 1 })`

To build this index, MongoDB would have to index every possible combination (Cartesian Product) of elements:
-   `"A"` with `1`, `"A"` with `2`, `"B"` with `1`, `"B"` with `2` (4 keys for just one document).
-   If arrays grow, the index size explodes, degrading performance.
-   **MongoDB blocks this build, throwing the error: `cannot index parallel arrays`.**

---

### (3) Reality Metaphor (Inventory Carton Labels)
Imagine storing items in shipping boxes:
-   **Standard Single-Field Index:** A box contains a laptop. You paste one barcode label on the box cover.
-   **Multikey Index:** A shipping box contains a **Laptop, a Charger, and a Mouse** (an array). 
    -   You print **3 separate inventory labels** (one for Laptop, one for Charger, one for Mouse) and stick all 3 labels on the box cover. 
    -   Anyone walking down the aisle looking for "Mouse" finds the box instantly.
-   **Parallel Arrays (Forbidden):** A box containing an array of items `["Laptop", "Phone"]` AND an array of colors `["Red", "Blue"]`. 
    -   Trying to print labels for every possible combination (Red Laptop, Blue Laptop, Red Phone, Blue Phone) would cover the box in stickers.

---

### (4) Code Examples

#### Blocked Parallel Array Builds
Let's see what index builds succeed and fail:

```javascript
db.inventory.insertOne({
  item: "widgets",
  tags: ["new", "clearance"],
  warehouses: ["East", "West"]
});

// SUCCESS: Building on a single array field (Multikey Index)
db.inventory.createIndex({ tags: 1 });

// SUCCESS: Building compound index where only ONE field is an array
db.inventory.createIndex({ item: 1, tags: 1 });

// CRASH: Fails to build because both fields are arrays (Parallel Arrays!)
db.inventory.createIndex({ tags: 1, warehouses: 1 });
// Output Error: "cannot index parallel arrays"
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing parallel arrays in your document schema when your application queries require indexing both fields

**The mistake:** Designing a product schema with `{ tags: [...], colors: [...] }` and expecting to run fast compound queries on both tags and colors using a single index.

**Why it's wrong:** As shown in the code examples, MongoDB will block the compound index build. 

Your queries will be forced to run slow collection scans, or utilize index intersection which is inefficient.

**Fix: If you need to index variable attributes together, do not use parallel arrays. Restructure your schema using the Attribute Pattern to store attributes in a single key-value array: `attrs: [ { k: "tag", v: "new" }, { k: "color", v: "red" } ]`. Since there is only one array field, you can index it safely using a single compound index: `{ "attrs.k": 1, "attrs.v": 1 }`.**

---





### Mistake 2: Attempting to Index Multiple Array Fields in a Single Compound Index (Parallel Multikey Error)

**The mistake:** Creating compound index `{ tags: 1, categories: 1 }` where both `tags` and `categories` are arrays.

**Why it's wrong:** MongoDB strictly forbids indexing parallel arrays in a single compound index! Creating index `{ array1: 1, array2: 1 }` throws error `cannot index parallel arrays`.

*Incorrect:*
```javascript
db.posts.createIndex({ tags: 1, categories: 1 }); // ❌ Error: cannot index parallel arrays!
```

*Fix:*
```javascript
Ensure at most ONE field in a compound index contains array data
```



### Mistake 3: Expecting Covered Query Optimizations on Multikey Array Indexes

**The mistake:** Expecting index `{ tags: 1 }` to cover query `.find({ tags: 'tech' }, { tags: 1, _id: 0 })`.

**Why it's wrong:** Multikey indexes on array fields CANNOT cover queries because array bounds require inspecting the actual document on disk.

*Incorrect:*
```javascript
// Expecting covered query on array multikey index
```

*Fix:*
```javascript
Covered queries require scalar non-array fields
```



## 5. Practice Exercises

### Exercise 1: Creating Multikey Indexes over Array Fields

**Scenario:**
Create a multikey index on array field `tags` in collection `products` to speed up tag queries.

**Requirements:**
1. Execute `createIndex({ tags: 1 })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.createIndex({ tags: 1 });
> ```
>
> #### Technical Explanation
>
> 1. When an indexed field contains an array, MongoDB automatically flags the index as a Multikey Index.
> 2. Creates a separate B-tree index entry for every individual element in the array.
> 3. Accelerates queries matching array elements.

---

### Exercise 2: Multikey Index Bounds and Constraints

**Scenario:**
Explain why a compound multikey index CANNOT index more than ONE array field per document.

**Requirements:**
1. Explain single-array constraint on compound multikey indexes.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // ❌ Illegal Compound Multikey Index (throws error if both fields are arrays):
> // Document: { tags: ["a", "b"], categories: ["x", "y"] }
> // Creating index on { tags: 1, categories: 1 } throws MongoServerError!
> ```
>
> #### Technical Explanation
>
> 1. MongoDB prohibits compound multikey indexes from covering more than one array field per document.
> 2. Indexing two arrays with $M$ and $N$ elements would create Cartesian product $M 	imes N$ index keys per document, causing severe index bloat.
> 3. Restricts compound multikey indexes to at most one array field.

---

### Exercise 3: Optimizing Array Query Bounds with `$elemMatch`

**Scenario:**
Use `$elemMatch` to optimize multikey index bound scanning over arrays of embedded documents.

**Requirements:**
1. Query `{ ratings: { $elemMatch: { score: { $gte: 8 }, reviewer: "Alice" } } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.createIndex({ "ratings.score": 1, "ratings.reviewer": 1 });
> 
> db.products.find({
>   ratings: {
>     $elemMatch: {
>       score: { $gte: 8 },
>       reviewer: "Alice"
>     }
>   }
> });
> ```
>
> #### Technical Explanation
>
> 1. `$elemMatch` bounds multikey index scans so both conditions evaluate over the same array element.
> 2. Narrows index scan ranges significantly compared to non-elemMatch array queries.
> 3. Essential for indexing arrays of embedded objects.

---



## 6. Related Terms

- [Array](../level_02/array_type.md) — The data structure.
- [Compound Index](compound_index.md) — Multi-field index parameters.

---

## 7. Key Takeaways
- Multikey indexes are created automatically when indexing BSON array fields.
- Indexes each array element separately, writing multiple keys per document.
- Enables high-speed element-matching searches inside arrays.
- You cannot create a compound index containing more than one array field.
- Creating compound indexes on parallel arrays throws "cannot index parallel arrays".
- Restructure parallel arrays using the Attribute Pattern to bypass index limits.
- Increases index disk storage requirements proportional to array lengths.
