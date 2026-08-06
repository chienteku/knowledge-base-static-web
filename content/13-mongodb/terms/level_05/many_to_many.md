# Many-to-Many Relationship

> **Level 5 — Data Modeling & Schema Design**
> The design pattern of modeling N:M relationships in MongoDB by storing arrays of references within the documents themselves, eliminating the relational requirement for junction tables.

---

## 1. Prerequisites

- [One-to-Many Relationship (Embedding vs. Referencing)](one_to_many.md) — The parent cardinality models.
- [Array Query Operators (`$elemMatch`, `$all`, `$size`)](../level_04/array_query_operators.md) — Querying reference lists.

---

## 2. Term Category

**Data Modeling** (N-to-N Relationship Patterns): Many-to-Many Relationships model N-to-N associations between collections using array references on one or both sides of the relationship.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Applies to all NoSQL document architectures. Optimizes read pathways by resolving associations without table index merges).

### (1) Design Motivation — "Why did we design this?"
In relational database design, you cannot link tables directly in a Many-to-Many (N:M) relationship. 

Suppose you have `books` and `tags`:
-   A book can have multiple tags (e.g. `"fiction"`, `"bestseller"`).
-   A tag can belong to thousands of books.

In SQL, you **must** create a third table called a **Junction Table** (or Join Table / Association Table):
-   `book_tags` table: `[ book_id, tag_id ]`.
-   To find all tags for a book, you must write a query joining three tables together.

In a document database, **creating a junction collection is an anti-pattern.** 

Because MongoDB documents support arrays, we can store links directly. 

We model Many-to-Many relationships by storing an **Array of Reference IDs** directly inside the document. 

This eliminates the junction table, reducing collection counts and allowing you to fetch associations with simple index lookups.

---

### (2) Implementation Patterns for N:M

#### Pattern A: Single-Side Referencing (Recommended)
Store the array of references in the entity that is queried most often or has the smaller cardinality.
-   *Example:* Store an array of `category_ids` inside the `products` document.
-   *To find categories of a product:* Load the product document; read the `category_ids` array.
-   *To find all products in a category:* Query `{ category_ids: categoryId }` (utilizes Multi-key Indexes to search instantly).

#### Pattern B: Two-Side Referencing (Bi-Directional)
Store arrays of references in both collections (e.g. students store `class_ids`, and classes store `student_ids`).
-   *Constraint:* Only use this if both arrays are bounded and small (e.g. a student takes up to 6 classes, and a class has up to 30 students). 
-   *Warning:* Your application must manage updating both collections simultaneously, which introduces data sync risks.

---

### (3) Reality Metaphor (Visas and Passports)
Imagine verifying international travel clearance:
-   **SQL Junction Table:** A government filing office. 
    -   To check if Bob can enter Brazil, the border guard calls a central clerk. 
    -   The clerk opens a master filing cabinet labeled `"Visas"`, finds the card linking Bob's ID to Brazil's ID, and confirms. (Takes time, requires a central query bridge).
-   **MongoDB Reference Array:** Bob's physical **Passport Booklet**. 
    -   Inside Bob's passport, he has an array of **Visa Stamps**: `visas: ["Brazil", "Japan", "UK"]`. 
    -   The guard opens the passport and reads the stamps directly. No calls or central lookups are needed.

---

### (4) Code Examples

#### Modeling Products and Categories (Single-Side Referencing)
We store the category references inside the products:

```javascript
// Collection: categories
db.categories.insertMany([
  { _id: ObjectId("60c72b2f9b1d8b2e88a8d111"), name: "Footwear" },
  { _id: ObjectId("60c72b2f9b1d8b2e88a8d222"), name: "Athletic Gear" }
]);

// Collection: products
db.products.insertOne({
  name: "Air Running Shoes",
  price: NumberDecimal("120.00"),
  // Array of Category References (Many-to-Many Link!)
  category_ids: [
    ObjectId("60c72b2f9b1d8b2e88a8d111"),
    ObjectId("60c72b2f9b1d8b2e88a8d222")
  ]
});

// Query: Find all products belonging to the 'Footwear' category
db.products.find({
  category_ids: ObjectId("60c72b2f9b1d8b2e88a8d111")
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Creating a dedicated junction collection in MongoDB to link two collections

**The mistake:** Creating a collection named `student_classes` to store documents like `{ student_id: 10, class_id: 200 }` to map enrollments.

**Why it's wrong:** This forces your application to run slow, nested `$lookup` operations or execute multiple database queries to find a student's classes. 

It imports SQL limitations into a document database, bypassing NoSQL's speed benefits.

**Fix: Store the reference array directly in one of the collections. Store `class_ids: [200, 201]` directly inside the `student` document.**

---



### Mistake 2: Creating Relational SQL Junction Collections for Many-to-Many Relationships

**The mistake:** Creating a `student_course_junction` collection storing `{ studentId, courseId }` rows.

**Why it's wrong:** Junction collections force 2-stage `$lookup` joins. In MongoDB, store arrays of ObjectIds in one or both sides (`student.courseIds: [ id1, id2 ]`).

*Incorrect:*
```javascript
db.student_courses.insertOne({ studentId: sId, courseId: cId }); // ❌ SQL junction collection!
```

*Fix:*
```javascript
db.students.updateOne({ _id: sId }, { $addToSet: { courseIds: cId } }); // Array of references
```

### Mistake 3: Embedding Unbounded Many-to-Many References in Both Directions

**The mistake:** Storing arrays of 100,000 user IDs on `group.userIds` AND group IDs on `user.groupIds`.

**Why it's wrong:** Dual unbounded array references bloat documents on both sides and create heavy multi-document update synchronization overhead. Store references on the side with smaller cardinality.

*Incorrect:*
```javascript
// Storing 100k array references bidirectionally
```

*Fix:*
```javascript
Store array references on the side with smaller cardinality (e.g. user.groupIds)
```

## 5. Practice Exercises

### Exercise 1: Modeling N-to-N Relationships with Array References

**Scenario:**
Model a Many-to-Many relationship between `students` and `courses` by embedding an array of `courseIds` inside `student` documents.

**Requirements:**
1. Store `courseIds: [ObjectId(...), ObjectId(...)]` in `students`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const courseA = new ObjectId("60c72b2f9b1d8b2c88888881");
> const courseB = new ObjectId("60c72b2f9b1d8b2c88888882");
> 
> db.students.insertOne({
>   name: "Alice Smith",
>   email: "alice@university.edu",
>   courseIds: [courseA, courseB]
> });
> 
> db.students.createIndex({ courseIds: 1 });
> ```
>
> #### Technical Explanation
>
> 1. N-to-N relationships can be modeled by storing arrays of target ObjectIds on one side of the relationship.
> 2. Multikey index `{ courseIds: 1 }` allows querying all students enrolled in a specific course in $O(\log N)$ time.
> 3. Eliminates relational join tables (`student_courses`).
> 
---

### Exercise 2: Bi-Directional N-to-N Array Referencing

**Scenario:**
Model bi-directional references between `authors` (`bookIds: [...]`) and `books` (`authorIds: [...]`).

**Requirements:**
1. Store arrays of references on both entities.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const authorId = new ObjectId("60c72b2f9b1d8b2c88888880");
> const bookId = new ObjectId("60c72b2f9b1d8b2c88888899");
> 
> db.authors.insertOne({ _id: authorId, name: "C.J. Date", bookIds: [bookId] });
> db.books.insertOne({ _id: bookId, title: "Database Systems", authorIds: [authorId] });
> ```
>
> #### Technical Explanation
>
> 1. Bi-directional references allow fast lookups starting from either side of the relationship.
> 2. Requires application code to maintain reference synchronization when links are added or removed.
> 3. Ideal when both read directions occur with high frequency.
> 
---

### Exercise 3: Resolving N-to-N Links with `$lookup`

**Scenario:**
Execute an aggregation pipeline joining `students` with `courses` using `$lookup` over array references.

**Requirements:**
1. Execute `$lookup` over `courseIds` array field.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.students.aggregate([
>   {
>     $lookup: {
>       from: "courses",
>       localField: "courseIds",
>       foreignField: "_id",
>       as: "enrolledCourses"
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$lookup` automatically resolves arrays of foreign ObjectIds (`courseIds`) against target `_id` fields.
> 2. Returns an array of matching course documents for each student.
> 3. Efficiently evaluates multi-document joins.
> 
---



## 6. Related Terms

- [One-to-Many Relationship (Embedding vs. Referencing)](one_to_many.md) — The cardinality context.
- [Embedding vs. Referencing](embedding_vs_referencing.md) — The parent modeling rules.

---

## 7. Key Takeaways
- Many-to-Many relationships are modeled using Arrays of References.
- Eliminates the relational requirement for third-party junction collections.
- Single-side referencing stores ID lists on the primary read-path target.
- Bi-directional referencing stores ID lists on both sides (bounded only).
- Querying matches inside arrays is resolved instantly using Multikey indexes.
- Creating junction collections in NoSQL degrades performance and adds complexity.
- Ensure reference arrays are bounded to prevent document size warnings.
