# Querying Arrays

> **Level 4 — Advanced Querying**
> The techniques and matching behaviors used to filter collections based on array contents, contrasting implicit element searches with exact list matches, element containment (`$all`), and size limits (`$size`).

---

## 1. Prerequisites

- [Array](../level_02/array_type.md) — The parent list data type.
- [Query Filter (Filter Document)](../level_03/query_filter.md) — The parent query filters context.

---

## 2. Term Category
- **Database Command / Query Syntax**

---

## 3. Environment Context
- **MongoDB Core** (Parsed by the query planner. Queries on arrays automatically utilize Multi-key Indexes to search elements without scanning full collections).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In document databases, fields frequently store lists (arrays) of values:
-   A user has a list of roles: `["editor", "moderator"]`.
-   A product has a list of tags: `["shoes", "clearance", "summer"]`.

When querying these list fields, developers need different lookup logic:
-   **Scenario A:** Finding records where the list contains a specific value (e.g. tag is `"shoes"`).
-   **Scenario B:** Finding records where the list contains *multiple* specific values, regardless of their position in the array (e.g. tags contain both `"shoes"` and `"clearance"`).
-   **Scenario C:** Finding records where the list has a specific count of items (e.g. users with exactly 2 roles).

We designed **Array Querying** syntax to handle these checks natively in JSON, bypassing the need for complex SQL join queries.

---

### (2) The Four Array Matching Patterns

#### 1. Implicit Element Match (The Default)
Finds documents where the array contains the target element.
-   *Syntax:* `{ tags: "shoes" }`
-   *Matches:* `["shoes", "summer"]`, `["sports", "shoes"]`.

#### 2. Exact Array Match (Fragile)
Finds documents where the array matches the query list **exactly** in length and order.
-   *Syntax:* `{ tags: ["shoes", "clearance"] }`
-   *Will NOT Match:* `["clearance", "shoes"]` (keys reversed), or `["shoes", "clearance", "summer"]` (extra element).

#### 3. Subset Containment (`$all`)
Finds documents where the array contains **all** of the specified elements, regardless of order or other items.
-   *Syntax:* `{ tags: { $all: ["shoes", "clearance"] } }`

#### 4. Array Length (`$size`)
Finds documents where the array contains exactly `N` elements.
-   *Syntax:* `{ tags: { $size: 2 } }`

---

### (3) Reality Metaphor
Imagine inspecting shipping boxes in a warehouse:
-   **Implicit Match:** *"Find me any box that contains a **hammer**."* You check inside. If there is a hammer (even next to nails and drills), you select the box.
-   **Exact Match:** *"Find me a box containing **exactly one hammer and one screwdriver in that order**, with nothing else in the box."* (Very restrictive).
-   **`$all` Match:** *"Find me any box containing **both** a hammer and a screwdriver. I don't care how they are ordered, or what other tools are inside."*

---

### (4) Code Examples

#### Inserting and Querying Array Data
Let's filter products using different array search rules:

```javascript
db.products.insertMany([
  { name: "Runners", tags: ["shoes", "sale"] },
  { name: "Loafers", tags: ["sale", "shoes"] },
  { name: "Boots",   tags: ["shoes", "sale", "leather"] }
]);

// 1. Exact Match: Matches ONLY 'Runners' (Bob's tags are reversed, Boots has extra)
db.products.find({ tags: ["shoes", "sale"] });

// 2. Contains All ($all): Matches ALL THREE documents!
db.products.find({ tags: { $all: ["shoes", "sale"] } });

// 3. Array Size ($size): Matches Runners and Loafers (length is 2)
db.products.find({ tags: { $size: 2 } });
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Utilizing exact list queries ({ tags: ["A", "B"] }) when you actually want to check if the document contains both tags

**The mistake:** Running `{ tags: ["shoes", "sale"] }` in your search filter, assuming it checks for list membership.

**Why it's wrong:** As shown in the Code Examples above, if a document stores the tags in a different order (`["sale", "shoes"]`), the exact match query will ignore it. 

This leads to incomplete search results on your website.

**Fix: Always use the `$all` operator when checking if an array contains multiple target values: `{ tags: { $all: ["shoes", "sale"] } }`.**

---



### Mistake 2: Confusing Multi-Element Query Filter Matching with `$elemMatch`

**The mistake:** Querying `{ "tags.name": "tech", "tags.score": { $gt: 5 } }` expecting single-element match.

**Why it's wrong:** Without `$elemMatch`, MongoDB returns documents where `tags` contains one element with `name: "tech"` and another element with `score > 5`. Use `$elemMatch` to match both criteria on the same element.

*Incorrect:*
```javascript
db.posts.find({ "tags.name": "tech", "tags.score": { $gt: 5 } }); // ❌ Matches across DIFFERENT array items!
```

*Fix:*
```javascript
db.posts.find({ tags: { $elemMatch: { name: "tech", score: { $gt: 5 } } } });
```

### Mistake 3: Direct Array Equality Matching when Element Search Is Intended

**The mistake:** Querying `{ tags: ["tech"] }` expecting to match documents containing `"tech"` among other tags.

**Why it's wrong:** `{ tags: ["tech"] }` matches ONLY documents where `tags` is an exact single-element array `["tech"]`.

*Incorrect:*
```javascript
db.posts.find({ tags: ["tech"] }); // ❌ Exact single-element array match only!
```

*Fix:*
```javascript
db.posts.find({ tags: "tech" }); // Matches any array containing string "tech"
```

## 6. Practice Exercises

### Exercise 1: Array Query Translation

**Problem:** You have a `users` collection. Each user has an array field named `roles` (e.g. `["admin", "billing"]`). 
Write the MongoDB queries to:
1.  Find all users who have the `"admin"` role.
2.  Find all users who have exactly 3 roles.
3.  Find all users who carry both the `"admin"` role and the `"billing"` role.

**Expected output:**
> [!check]- Answer
> ```javascript
> // 1. Implicit element search
> db.users.find({ roles: "admin" });
> 
> // 2. Array length search
> db.users.find({ roles: { $size: 3 } });
> 
> // 3. Array membership subset search
> db.users.find({ roles: { $all: ["admin", "billing"] } });
> ```
> - Simple element searches do not require BSON operators.
> - Use `$size` for length checks and `$all` for multi-value checks.

---



### Exercise 2: Querying Scalar Array Membership

**Problem:** Query posts containing tag `"mongodb"` in `tags` array.

**Expected output:**
> [!check]- Answer
> ```text
> db.posts.find({ tags: "mongodb" });
> ```
> ```javascript
> db.posts.find({ tags: "mongodb" });
> ```
>
> **Explanation:** Passing a scalar value to an array field checks if the array contains that element.

---

### Exercise 3: Exact Array Element Count Query

**Problem:** Query documents where `comments` array has exactly 5 elements using `$size`.

**Expected output:**
> [!check]- Answer
> ```text
> db.posts.find({ comments: { $size: 5 } });
> ```
> ```javascript
> db.posts.find({ comments: { $size: 5 } });
> ```
>
> **Explanation:** `{ $size: N }` matches documents where array length equals N.

## 7. Related Terms

- [Array](../level_02/array_type.md) — The data structure.
- [Array Query Operators (`$elemMatch`, `$all`, `$size`)](array_query_operators.md) — Complex array filters.

---

## 8. Key Takeaways
- Querying arrays supports element checks, exact matches, containment, and size.
- Implicit element matching checks if a value is present anywhere in the array.
- Exact array matching requires byte-perfect order and length matches (fragile).
- Use `$all` to find documents containing multiple elements, regardless of order.
- Use `$size` to query documents by the exact length of their array fields.
- Arrays utilize Multi-key Indexes to ensure queries remain fast.
