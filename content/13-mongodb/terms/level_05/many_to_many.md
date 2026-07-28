# Many-to-Many Relationship

> **Level 5 — Data Modeling & Schema Design**
> The design pattern of modeling N:M relationships in MongoDB by storing arrays of references within the documents themselves, eliminating the relational requirement for junction tables.

---

## 1. Prerequisites
- [One-to-Many Relationship (Embedding vs Referencing)](one_to_many.md) — The parent cardinality models.
- [Array Query Operators (`$elemMatch`, `$all`, `$size`)](../../level_04/array_query_operators.md) — Querying reference lists.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Applies to all NoSQL document architectures. Optimizes read pathways by resolving associations without table index merges).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Many-to-Many Schema Design

**Problem:** You are designing a movie database. A movie can have multiple actors. An actor can star in multiple movies. A movie typically has less than 50 actors. An actor typically stars in less than 100 movies.
1.  Define where the array of references should be stored (Movie collection, Actor collection, or both).
2.  Write a sample movie document referencing its actors.

**Expected output:**
> [!check]- Answer
> ```text
> 1. The array of references can be stored on the Movie collection (storing `actor_ids`). Since movies are queried most often to see their cast list, storing the references in the movie document optimizes the primary read path. (Alternatively, storing them on both sides is acceptable because both arrays are small and bounded).
> ```
> - Assess the primary read queries of a movie database.
> - Avoid creating a third collection. Store references inside array fields.

---



### Exercise 2: Modeling Student and Course Many-to-Many

**Problem:** Model `student` document referencing array of enrolled `courseIds`.

**Expected output:**
> [!check]- Answer
> ```text
> { name: "Alice", courseIds: [ ObjectId("..."), ObjectId("...") ] }
> ```
> ```javascript
> const student = {
>   _id: new ObjectId(),
>   name: "Alice",
>   courseIds: [
>     new ObjectId("60d5ecb8b5c9c22b9c8b4567"),
>     new ObjectId("60d5ecb8b5c9c22b9c8b4568")
>   ]
> };
> ```
>
> **Explanation:** Storing arrays of ObjectIds models Many-to-Many relationships cleanly.

---

### Exercise 3: Querying Many-to-Many Array References

**Problem:** Query students enrolled in course `courseId` using direct array element match.

**Expected output:**
> [!check]- Answer
> ```text
> db.students.find({ courseIds: courseId });
> ```
> ```javascript
> db.students.find({ courseIds: courseId });
> ```
>
> **Explanation:** Passing a scalar ObjectId queries if the ID exists inside the `courseIds` array.

## 7. Related Terms
- [One-to-Many Relationship (Embedding vs Referencing)](one_to_many.md) — The cardinality context.
- [Embedding vs Referencing](embedding_vs_referencing.md) — The parent modeling rules.

---

## 8. Key Takeaways
- Many-to-Many relationships are modeled using Arrays of References.
- Eliminates the relational requirement for third-party junction collections.
- Single-side referencing stores ID lists on the primary read-path target.
- Bi-directional referencing stores ID lists on both sides (bounded only).
- Querying matches inside arrays is resolved instantly using Multikey indexes.
- Creating junction collections in NoSQL degrades performance and adds complexity.
- Ensure reference arrays are bounded to prevent document size warnings.
