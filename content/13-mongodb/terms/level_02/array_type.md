# Array

> **Level 2 — BSON Data Types & Document Structure**
> The BSON data type representing an ordered list of values (primitives, subdocuments, or other arrays) stored in a single field, resolving one-to-many relationships without child tables.

---

## 1. Prerequisites
- [BSON Data Types (Overview)](bson_data_types.md) — The parent BSON type lists.
- [Embedded Document (Subdocument)](embedded_document.md) — Arrays frequently hold nested subdocuments.

---

## 2. Term Category
- **Database Structure / Data Type**

---

## 3. Environment Context
- **Universal Standard** (Supported natively in JSON, JavaScript, and BSON. Query engines parse array indexes using Multi-key indexes under the hood).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational database theory, one-to-many relationships (like a blog post having multiple category tags) must be normalized:
-   You cannot store a list inside a standard cell.
-   You must create a separate `tags` table and a `post_tags` junction table.
-   To fetch tags, you run complex queries across three tables.

We designed the **BSON Array** type to handle lists natively. 

An array is an ordered list of values stored directly inside a document field. 

It allows you to represent one-to-many lists (e.g. `{ tags: ["tech", "databases", "nosql"] }`) in a single record. 

This matches how arrays are used in programming code, saving developers from writing junction tables.

---

### (2) Built-In Array Query Magic
MongoDB simplifies array searches:
If a field `tags` contains an array, querying:
`db.posts.find({ tags: "databases" })`

MongoDB automatically inspects the list. 

If any element in the array matches `"databases"`, it returns the document. 

This is called **Implicit Array Unwrapping**.

---

### (3) Types of Arrays
-   **Primitive Array:** A list of strings, numbers, or dates (e.g. `[1, 2, 3]`).
-   **Subdocument Array:** A list of nested objects (e.g. `[{ item: "mouse", qty: 2 }]`). (Crucial for e-commerce orders).

---

### (4) Reality Metaphor (Egg Carton)
-   **Normalized SQL:** Storing 6 eggs by placing each egg on a separate shelf in a giant pantry cabinet, writing a label on each egg linking it to the owner. (Fragmented, hard to retrieve).
-   **BSON Array:** Storing the eggs inside a single **Egg Carton**. 
    -   The carton holds all 6 eggs in order. 
    -   When you need eggs, you grab the carton. 
    -   You can store different colored eggs (dynamic types) in the same carton.

---

### (5) Code Examples

#### Storing Arrays of Subdocuments
Let's store a user containing an array of social media profiles:

```javascript
db.users.insertOne({
  username: "alice_dev",
  profiles: [                               // Array of subdocuments
    { site: "github", handle: "aliceg" },
    { site: "twitter", handle: "alicedev" }
  ]
});
```

#### Querying Arrays with $elemMatch
If you need to query array elements where **a single subdocument** matches multiple conditions (e.g. site is `'github'` and handle is `'aliceg'`), use **`$elemMatch`**:

```javascript
db.users.find({
  profiles: { 
    $elemMatch: { site: "github", handle: "aliceg" } 
  }
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Permitting arrays to grow infinitely without bounds

**The mistake:** Creating an array named `logins` that appends a timestamp every time a user logs into your website.

**Why it's wrong:** If a user logs in 100,000 times, the array will grow massive, eventually hitting MongoDB's maximum document size limit of **`16MB`**. 

This crashes write operations. 

Furthermore, searching or updating huge arrays consumes high CPU and memory resources.

**Fix: Only use arrays for bounded data (e.g., tags, roles, or order items). If the list can grow infinitely (like login logs or tracking events), store them as separate documents in a dedicated `logins` collection, referencing the user's ID.**

---



### Mistake 2: Assuming 1-Based Indexing for Array Element Lookups in MongoDB Queries

**The mistake:** Querying array element positions with 1-based indexing `"tags.1"` expecting the first item.

**Why it's wrong:** MongoDB array dot-notation uses 0-based indexing! `"tags.0"` accesses the first array element.

*Incorrect:*
```javascript
db.posts.find({ "tags.1": "tech" }); // ❌ Accesses 2nd array item, NOT 1st!
```

*Fix:*
```javascript
db.posts.find({ "tags.0": "tech" }); // Correct 0-based first item index
```

### Mistake 3: Using Direct Equality on Array Fields expecting Match on Any Array Element

**The mistake:** Querying `db.posts.find({ tags: ["tech"] })` expecting to match documents containing `"tech"` among other tags.

**Why it's wrong:** Direct array equality `tags: ["tech"]` matches ONLY documents where `tags` is an exact single-element array `["tech"]`. To match elements within an array, pass scalar `{ tags: "tech" }` or `{ tags: { $in: ["tech"] } }`.

*Incorrect:*
```javascript
db.posts.find({ tags: ["tech"] }); // ❌ Matches exact array ["tech"] only!
```

*Fix:*
```javascript
db.posts.find({ tags: "tech" }); // Matches any array containing "tech"
```

## 6. Practice Exercises

### Exercise 1: Implicit Array Search

**Problem:** You have a `products` collection. Each product has a `categories` array field (e.g. `["electronics", "accessories"]`). 
Write the MongoDB query to select all products that belong to the `'electronics'` category.

**Expected output:**
```javascript
db.products.find({ categories: "electronics" });
```

> [!check]- Answer
> - You do not need special array search operators for basic element matching.
> - Direct matching triggers implicit unwrapping searches.

---



### Exercise 2: Matching Any Array Element

**Problem:** Query all documents in `posts` collection containing tag `"mongodb"` inside `tags` array.

**Expected output:**
```text
db.posts.find({ tags: "mongodb" });
```

> [!check]- Answer
> ```javascript
> db.posts.find({ tags: "mongodb" });
> ```
>
> **Explanation:** Passing a scalar value to an array field queries if any array element matches.

### Exercise 3: Querying Array Size with `$size`

**Problem:** Query posts where `tags` array contains exactly 3 items using `$size`.

**Expected output:**
```text
db.posts.find({ tags: { $size: 3 } });
```

> [!check]- Answer
> ```javascript
> db.posts.find({ tags: { $size: 3 } });
> ```
>
> **Explanation:** `{ $size: N }` matches documents where array length equals N.

## 7. Related Terms
- [Embedded Document (Subdocument)](embedded_document.md) — Nested document lists.
- [`ObjectId` as a Manual Reference](objectid_reference.md) — Referencing alternatives.

---

## 8. Key Takeaways
- BSON Array stores ordered lists of values in a single document field.
- Resolves one-to-many relationships without requiring relational junction tables.
- Supports storing primitive datatypes, nested subdocuments, or nested arrays.
- Features implicit unwrapping to make searching list elements simple.
- Use `$elemMatch` to search for subdocuments matching multiple criteria.
- **Rule of Thumb:** Keep arrays bounded to prevent hitting the 16MB document cap.
