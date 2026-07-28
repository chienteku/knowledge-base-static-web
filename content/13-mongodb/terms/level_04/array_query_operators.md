# Array Query Operators (`$elemMatch`, `$all`, `$size`)

> **Level 4 — Advanced Querying**
> The BSON query operators used to construct complex array filter conditions, specifically matching elements that satisfy multiple conditions together (`$elemMatch`), checking set inclusion (`$all`), and matching array lengths (`$size`).

---

## 1. Prerequisites
- [Array](../level_02/array_type.md) — The parent list structures.
- [Querying Arrays](querying_arrays.md) — Standard array matching behaviors.

---

## 2. Term Category
- **Database Command / Query Syntax**

---

## 3. Environment Context
- **Universal Standard** (Supported across document NoSQL platforms. Handled by the query compiler to restrict search logic parameters).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Querying arrays of primitive values (like `["shoes", "sale"]`) is simple. 

But what if you have an array containing **nested subdocuments**?
```json
{
  "username": "alice",
  "grades": [
    { "subject": "Math", "score": 50 },
    { "subject": "History", "score": 90 }
  ]
}
```

Suppose you want to query: *"Find users who scored 80 or higher in Math."*

If you try to write a standard flat query using dot notation:
```javascript
// BAD: Triggers logical leakage!
db.users.find({ "grades.subject": "Math", "grades.score": { $gte: 80 } })
```

MongoDB will evaluate the query constraints **independently across the entire array**:
-   It checks if *any* element in the array has the subject `"Math"` (True, index 0).
-   It checks if *any* element in the array has a score $\ge 80$ (True, index 1).
-   Because both conditions are met by different items in the array, **Alice matches the query**, even though her Math score was actually a failing 50.

We designed the **`$elemMatch`** operator to solve this logical leakage. 

It instructs MongoDB to scan the array elements one-by-one, requiring that **a single, individual array element must satisfy all listed conditions.**

---

### (2) The Three Advanced Array Operators

#### 1. `$elemMatch` (Element Condition Match)
Matches documents containing an array field with at least one element that satisfies all specified query criteria. (Essential for arrays of subdocuments).

#### 2. `$all` (All Values Present)
Matches arrays containing all the specified search terms, regardless of list order.

#### 3. `$size` (Strict Array Length)
Matches arrays that have an exact number of elements.
-   *Constraint:* `$size` only accepts exact integers; you cannot query ranges (like `$size > 2`) natively using it.

---

### (3) Reality Metaphor (School Report Cards)
-   **Flat Dot-Notation Query (Leakage):** A parent checks a student's report card: *"Do they take Math? Yes. Do they have an 'A' grade anywhere on this sheet? Yes (in PE)."* The parent mistakenly thinks the student got an A in Math.
-   **`$elemMatch` Query:** The parent scans the card line-by-line: *"Is there **a single line entry** where the class is Math AND the grade is A? No (Math has a C)."* The conditions are locked to the same line.

---

### (4) Code Examples

#### Resolving Array Logic Leakage (elemMatch)
Using the same Alice dataset, let's write the correct query:

```javascript
// SECURE: Finds users who scored >= 80 in Math
db.users.find({
  grades: {
    $elemMatch: { subject: "Math", score: { $gte: 80 } }
  }
});
// Alice is ignored, as no single array item meets both conditions!
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Overusing '$elemMatch' for simple queries on arrays of primitive values

**The mistake:** Writing `db.posts.find({ tags: { $elemMatch: { $eq: "news" } } })` to search for a tag.

**Why it's wrong:** For simple flat arrays of strings or numbers, `$elemMatch` is redundant. 

It adds unnecessary complexity to your JSON query and wastes processing cycles.

**Fix: For flat arrays, use implicit matching. Only use `$elemMatch` when you have multiple conditions targeting the same array element (like range checks on numbers or matches on subdocument properties).**

```javascript
// CORRECT (Simpler, faster!)
db.posts.find({ tags: "news" });
```

---



### Mistake 2: Expecting Multiple Field Predicates in Find Queries to Match the Same Array Element Without `$elemMatch`

**The mistake:** Querying `db.posts.find({ "comments.user": "alice", "comments.score": { $gt: 5 } })` without `$elemMatch`.

**Why it's wrong:** Without `$elemMatch`, MongoDB returns documents where `comments` contains ONE comment by `alice` and ANOTHER DIFFERENT comment with score `> 5`. Use `$elemMatch` to force matching the SAME element.

*Incorrect:*
```javascript
db.posts.find({ "comments.user": "alice", "comments.score": { $gt: 5 } }); // ❌ Matches across DIFFERENT array items!
```

*Fix:*
```javascript
db.posts.find({ comments: { $elemMatch: { user: "alice", score: { $gt: 5 } } } }); // Matches SAME array item
```

### Mistake 3: Confusing `$all` (Array Subset Match) with Exact Array Equality Matching

**The mistake:** Querying `{ tags: { $all: ["tech", "news"] } }` expecting to match ONLY documents with array `["tech", "news"]`.

**Why it's wrong:** `$all` matches documents containing all listed elements regardless of array order or extra elements. For exact array match, use direct array equality `{ tags: ["tech", "news"] }`.

*Incorrect:*
```javascript
// Expecting exact array length and ordering
```

*Fix:*
```javascript
Use $all to check if an array contains a set of required elements
```

## 6. Practice Exercises

### Exercise 1: Subdocument Array Query

**Problem:** You have a `companies` collection. Each company document contains an array of nested documents named `employees` (containing fields: `role` and `salary`). 
Write the MongoDB query to select all companies that employ **at least one employee** whose `role` is exactly `"engineer"` AND whose `salary` is greater than or equal to `100000`.

**Expected output:**
> [!check]- Answer
> ```javascript
> db.companies.find({
>   employees: {
>     $elemMatch: {
>       role: "engineer",
>       salary: { $gte: 100000 }
>     }
>   }
> });
> ```
> - The search targets multiple conditions locked to the same nested employee object.
> - Use the `$elemMatch` operator wrapping the target properties.

---



### Exercise 2: Matching Same Array Element with `$elemMatch`

**Problem:** Query students possessing a grade sub-document matching `{ mean: { $gt: 80 }, grade: "A" }` using `$elemMatch`.

**Expected output:**
> [!check]- Answer
> ```text
> db.students.find({ grades: { $elemMatch: { mean: { $gt: 80 }, grade: "A" } } });
> ```
> ```javascript
> db.students.find({
>   grades: { $elemMatch: { mean: { $gt: 80 }, grade: "A" } }
> });
> ```
>
> **Explanation:** `$elemMatch` enforces that all specified query conditions match the SAME array element.

---

### Exercise 3: Matching Subset of Array Elements with `$all`

**Problem:** Query posts containing both tags `"mongodb"` and `"nosql"` using `$all`.

**Expected output:**
> [!check]- Answer
> ```text
> db.posts.find({ tags: { $all: ["mongodb", "nosql"] } });
> ```
> ```javascript
> db.posts.find({ tags: { $all: ["mongodb", "nosql"] } });
> ```
>
> **Explanation:** `$all` matches documents whose array contains all specified list items.

## 7. Related Terms
- [Array](../level_02/array_type.md) — The data structure.
- [Querying Arrays](querying_arrays.md) — The parent array querying.

---

## 8. Key Takeaways
- Array query operators build advanced filters for list properties.
- `$elemMatch` locks multiple search filters to a single array element.
- Crucial for querying arrays of nested subdocuments to prevent logic leakage.
- Flat dot-notation filters match independently across different array elements.
- `$all` requires all listed terms to exist in the array, ignoring order.
- `$size` matches arrays by exact length; does not support ranges.
- Avoid `$elemMatch` for simple flat arrays of primitives; default to implicit match.
