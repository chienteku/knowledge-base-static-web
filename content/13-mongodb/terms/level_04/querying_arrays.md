# Querying Arrays

> **Level 4 — Advanced Querying**
> The techniques and matching behaviors used to filter collections based on array contents, contrasting implicit element searches with exact list matches, element containment (`$all`), and size limits (`$size`).

---

## 1. Prerequisites

- [Array](../level_02/array_type.md) — The parent list data type.
- [Query Filter (Filter Document)](../level_03/query_filter.md) — The parent query filters context.

---

## 2. Term Category

**CRUD Operation** (Array Query Patterns): Querying Arrays covers patterns for matching exact arrays, subset elements, and element combinations in document array fields.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Parsed by the query planner. Queries on arrays automatically utilize Multi-key Indexes to search elements without scanning full collections).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Matching Exact Array Equality

**Scenario:**
Query collection `products` for documents where `tags` equals the exact array `["electronics", "gadgets"]` in exact order.

**Requirements:**
1. Filter `{ tags: ["electronics", "gadgets"] }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.find({
>   tags: ["electronics", "gadgets"]
> });
> ```
>
> #### Technical Explanation
>
> 1. Passing a raw array (`tags: [...]`) matches exact array equality (same elements, same order).
> 2. Does not match documents where `tags` contains additional items or different order.
> 3. Use `$all` or `$in` when order-independent element matching is desired.

---

### Exercise 2: Matching Single Array Element Values

**Scenario:**
Query `products` where `tags` array contains element `"electronics"`.

**Requirements:**
1. Filter `{ tags: "electronics" }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.find({
>   tags: "electronics"
> });
> ```
>
> #### Technical Explanation
>
> 1. Target field equality (`tags: "electronics"`) automatically matches if any element in the array equals the scalar value.
> 2. Transparently handles both scalar fields and array fields.
> 3. Uses multikey indexes on `tags`.

---

### Exercise 3: Querying Arrays of Embedded Documents with `$elemMatch`

**Scenario:**
Query `orders` for documents where at least one item in `items` array has `qty >= 5` AND `price <= 20.00`.

**Requirements:**
1. Use `$elemMatch`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.orders.find({
>   items: {
>     $elemMatch: {
>       qty: { $gte: 5 },
>       price: { $lte: 20.00 }
>     }
>   }
> });
> ```
>
> #### Technical Explanation
>
> 1. `$elemMatch` ensures both `qty` and `price` conditions match on the SAME embedded subdocument.
> 2. Prevents false positive matches across different array items.
> 3. Essential for subdocument array querying.

---



## 6. Related Terms

- [Array](../level_02/array_type.md) — The data structure.
- [Array Query Operators (`$elemMatch`, `$all`, `$size`)](array_query_operators.md) — Complex array filters.

---

## 7. Key Takeaways
- Querying arrays supports element checks, exact matches, containment, and size.
- Implicit element matching checks if a value is present anywhere in the array.
- Exact array matching requires byte-perfect order and length matches (fragile).
- Use `$all` to find documents containing multiple elements, regardless of order.
- Use `$size` to query documents by the exact length of their array fields.
- Arrays utilize Multi-key Indexes to ensure queries remain fast.
