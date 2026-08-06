# Array Query Operators (`$elemMatch`, `$all`, `$size`)

> **Level 4 — Advanced Querying**
> The BSON query operators used to construct complex array filter conditions, specifically matching elements that satisfy multiple conditions together (`$elemMatch`), checking set inclusion (`$all`), and matching array lengths (`$size`).

---

## 1. Prerequisites

- [Array](../level_02/array_type.md) — The parent list structures.
- [Querying Arrays](querying_arrays.md) — Standard array matching behaviors.

---

## 2. Term Category

**Query Operator** (Array Query Selection Operators): Array Query Operators ($all, $elemMatch, $size) match documents based on array element values and structural criteria.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported across document NoSQL platforms. Handled by the query compiler to restrict search logic parameters).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Multi-Criterion Array Matching with `$elemMatch`

**Scenario:**
Query collection `orders` for documents where at least ONE item in the `items` array has `name: "laptop"` AND `price: { $gt: 500 }`.

**Requirements:**
1. Use `$elemMatch: { name: "laptop", price: { $gt: 500 } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.find({
>   items: {
>     $elemMatch: {
>       name: "laptop",
>       price: { $gt: 500 }
>     }
>   }
> });
> ```
>
> #### Technical Explanation
>
> 1. `$elemMatch` requires a SINGLE array element to satisfy ALL specified query conditions.
> 2. Prevents false positive matches where condition A matches element 1 and condition B matches element 2.
> 3. Essential operator for querying arrays of embedded documents.

---

### Exercise 2: Matching All Array Elements with `$all`

**Scenario:**
Query collection `products` for items containing BOTH `"electronics"` and `"wireless"` in `tags`.

**Requirements:**
1. Use `tags: { $all: ["electronics", "wireless"] }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.find({
>   tags: { $all: ["electronics", "wireless"] }
> });
> ```
>
> #### Technical Explanation
>
> 1. `$all` matches documents where the array contains every listed item.
> 2. Order of elements in `$all` array is ignored.
> 3. Leverages multikey indexes on `tags`.

---

### Exercise 3: Filtering by Exact Array Length with `$size`

**Scenario:**
Query user documents where array `roles` contains exactly 3 assigned roles.

**Requirements:**
1. Use `{ roles: { $size: 3 } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.find({
>   roles: { $size: 3 }
> });
> ```
>
> #### Technical Explanation
>
> 1. `$size` matches documents where the array field length equals the specified integer.
> 2. Evaluates array size directly in the database engine.
> 3. Useful for structural array validation checks.

---



## 6. Related Terms

- [Array](../level_02/array_type.md) — The data structure.
- [Querying Arrays](querying_arrays.md) — The parent array querying.
- [The Attribute Pattern](../level_05/attribute_pattern.md) — Related concept: The Attribute Pattern.

---

## 7. Key Takeaways
- Array query operators build advanced filters for list properties.
- `$elemMatch` locks multiple search filters to a single array element.
- Crucial for querying arrays of nested subdocuments to prevent logic leakage.
- Flat dot-notation filters match independently across different array elements.
- `$all` requires all listed terms to exist in the array, ignoring order.
- `$size` matches arrays by exact length; does not support ranges.
- Avoid `$elemMatch` for simple flat arrays of primitives; default to implicit match.
