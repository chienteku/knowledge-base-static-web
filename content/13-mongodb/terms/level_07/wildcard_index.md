# Wildcard Index

> **Level 7 — Indexes & Query Performance**
> The database index type designed to automatically index all fields (or a subset of fields) nested inside a target path namespace using the `$**` specifier, supporting highly variable dynamic schemas without database migrations.

---

## 1. Prerequisites

- [`createIndex()` / `dropIndex()`](create_drop_index.md) — The index creation triggers.
- [The Attribute Pattern](../level_05/attribute_pattern.md) — The schema pattern alternative.

---

## 2. Term Category

**Index / Performance** (Dynamic Attribute Subdocument Indexing): A Wildcard Index ($**) indexes arbitrary, unpredictable key-value paths inside embedded subdocuments or arrays.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Introduced in MongoDB 4.2. Automatically monitors updates inside the target path, writing index keys for newly added nested fields at runtime).

### (1) Design Motivation — "Why did we design this?"
As learned in `attribute_pattern.md`, e-commerce catalogs carry highly variable, sparse specifications (e.g. a shirt has size/color; a laptop has CPU/RAM). 

While the Attribute Pattern solves this by mapping values to a key-value array (`[ { k, v } ]`), it forces developers to write complex application logic to translate documents.

What if you want to keep the natural, nested document structure:
`{ name: "Laptop", specs: { cpu: "i7", ram: "16GB" } }`

And still build a single index that covers all fields inside the `specs` subdocument dynamically?

We designed the **Wildcard Index** to solve this. 

By using the **`$**`** wildcard specifier, you tell MongoDB to index every nested field, subdocument, and array inside a specific path namespace. 

If you add a new specification tomorrow (e.g. `specs.gpu: "RTX"`), MongoDB indexes it automatically, eliminating index schema migrations.

---

### (2) Wildcard Index Syntax
You target the subdocument and append `.$**`:

`db.products.createIndex({ "specs.$**": 1 })`

This single command indexes:
-   `specs.cpu`
-   `specs.ram`
-   Any future field added to the `specs` object.

---

### (3) Wildcard Index vs. Attribute Pattern
-   **Wildcard Index:** Keeps document structure clean and natural, but has a larger disk/RAM storage footprint and higher write overhead.
-   **Attribute Pattern:** Requires mapping data to arrays, but uses less index storage and executes faster on complex queries.

---

### (4) Reality Metaphor (The Room Scanner)
Imagine organizing a warehouse storage room:
-   **Standard Index:** You only index the specific shelf marked **"Computers"**.
-   **Wildcard Index:** You install an **Automated Overhead Camera Scanner** in a specific room. 
    -   No matter what items workers place in the room (laptops, chairs, books), the camera automatically scans the barcodes and catalogs them in the database logs. 
    -   You don't need to configure new rules when new item types are brought in.

---

### (5) Code Examples

#### Creating a Wildcard Index on Subdocuments
Let's index dynamic product specifications:

```javascript
db.products.insertMany([
  {
    name: "Cotton Shirt",
    specs: { color: "red", size: "XL" } // Subdocument specs
  },
  {
    name: "Developer Laptop",
    specs: { ram: "16GB", cpu: "i7", storage: "512GB" }
  }
]);

// Build wildcard index on specs path
db.products.createIndex({ "specs.$**": 1 });

// Query: Matches and uses the wildcard index!
db.products.find({ "specs.ram": "16GB" });
db.products.find({ "specs.color": "red" });
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Building a collection-wide wildcard index ({ "$**": 1 }) on a database collection that experiences high-volume write traffic

**The mistake:** Running `db.users.createIndex({ "$**": 1 })` on a high-throughput transaction table to make "every possible query fast."

**Why it's wrong:** A collection-wide wildcard index indexes **every single field** in every document (excluding `_id`). 

This creates a massive index file on disk, consumes all available server RAM cache, and causes severe write bottlenecks as every insert or update must rewrite dozens of index keys.

**Fix: Only build wildcard indexes on specific, nested subdocument namespaces (e.g. `{ "specs.$**": 1 }`) where fields are highly variable and write volumes are moderate.**

---





### Mistake 2: Creating Wildcard Indexes `"$**"` on All Fields in High-Throughput Write Collections

**The mistake:** Creating `db.products.createIndex({ "$**": 1 })` on a 50M document write-heavy collection.

**Why it's wrong:** Indexing `$**` indexes EVERY field key and value in every document, severely degrading write performance and consuming massive RAM.

*Incorrect:*
```javascript
db.products.createIndex({ "$**": 1 }); // ❌ Heavy write overhead across all fields!
```

*Fix:*
```javascript
Target specific dynamic sub-document paths: db.products.createIndex({ "attributes.$**": 1 });
```



### Mistake 3: Expecting Wildcard Indexes to Support Compound ESR Sort Operations

**The mistake:** Expecting Wildcard Index `{ "$**": 1 }` to cover compound sorts `.sort({ category: 1, price: -1 })`.

**Why it's wrong:** Wildcard indexes index single field paths individually. They cannot satisfy compound multi-field sort orders.

*Incorrect:*
```javascript
// Expecting wildcard index to cover multi-field compound sort
```

*Fix:*
```javascript
Use explicit compound indexes for multi-field sort queries
```



## 5. Practice Exercises

### Exercise 1: Indexing Dynamic Subdocument Properties with Wildcard Index

**Scenario:**
Create a wildcard index on embedded subdocument `userAttributes.$**` in collection `users` to index all arbitrary key-value paths.

**Requirements:**
1. Execute `createIndex({ "userAttributes.$**": 1 })`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.createIndex({ "userAttributes.$**": 1 });
> ```
>
> #### Technical Explanation
>
> 1. Wildcard indexes (`$**`) automatically index all dynamic scalar fields inside embedded subdocuments.
> 2. Eliminates creating hundreds of individual secondary indexes for arbitrary key-value properties.
> 3. Accelerates queries on unpredictable user-defined attributes.
> 
---

### Exercise 2: Querying Wildcard Indexed Subfields

**Scenario:**
Query collection `users` filtering by dynamic path `userAttributes.customColor: "Blue"`.

**Requirements:**
1. Filter `{ "userAttributes.customColor": "Blue" }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.find({
>   "userAttributes.customColor": "Blue"
> });
> ```
>
> #### Technical Explanation
>
> 1. Queries targeting any subfield inside `userAttributes` utilize the `$**` wildcard index (`IXSCAN`).
> 2. Evaluates equality and range queries on dynamic keys.
> 3. Flexible schema indexing solution.
> 
---

### Exercise 3: Restricting Wildcard Index Scope with `wildcardProjection`

**Scenario:**
Create a collection-wide wildcard index excluding sensitive fields `internalNotes` and `salary` from index key creation.

**Requirements:**
1. Use `$**` with `wildcardProjection`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.createIndex(
>   { "$**": 1 },
>   {
>     wildcardProjection: {
>       internalNotes: 0,
>       salary: 0
>     }
>   }
> );
> ```
>
> #### Technical Explanation
>
> 1. `wildcardProjection` specifies field inclusion or exclusion rules for collection-wide wildcard indexes.
> 2. Prevents indexing unneeded or large fields, conserving RAM cache.
> 3. Bounds wildcard index memory growth.
> 
---



## 6. Related Terms

- [`createIndex()` / `dropIndex()`](create_drop_index.md) — Index management.
- [The Attribute Pattern](../level_05/attribute_pattern.md) — The schema design alternative.

---

## 7. Key Takeaways
- Wildcard indexes cover all fields nested inside a target path namespace.
- Declared using the `$**` path suffix (e.g., `{ "specs.$**": 1 }`).
- Eliminates the need for database migrations when adding new nested fields.
- Supports querying variable characteristics without restructuring schemas.
- Do not build collection-wide wildcard indexes `{ "$**": 1 }` on write-heavy tables.
- Wildcard indexes consume more disk space and write overhead than target compound indexes.
- Useful for dynamic user-defined specifications and metadata subdocuments.
