# `$replaceRoot` / `$replaceWith` Stages

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stages used to promote a nested subdocument or calculated object expression to become the new top-level root document, discarding all other fields.

---

## 1. Prerequisites
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Aggregation Variables (`$$ROOT`, `$$CURRENT`, etc.)](aggregation_variables.md) — Utilizing document pointers.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Executed in memory. Alters the output BSON document stream structure before passing items to the client driver serializer).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
During complex pipeline calculations (such as running `$lookup` joins followed by `$unwind` arrays):
-   Your target data often becomes nested inside a subdocument key (e.g. `{ _id: 10, order_details: { price: 100, item: "Hammer" } }`).
-   If your frontend application expects the order details fields to be at the **root level** (e.g. `{ price: 100, item: "Hammer" }`), you must reshape the document.
-   While you could use `$project` to map every field manually (`{ price: "$order_details.price", ... }`), this is verbose and hard to write if the nested document contains dozens of fields.

We designed **`$replaceRoot`** and **`$replaceWith`** to solve this nesting promotion problem. 

They act as an unboxing tool. 

You tell the database: *"Throw away the parent document wrapper, and make this nested subdocument the new root."* 

MongoDB replaces the document structure, promoting the nested keys to the top level in a single pipeline step.

---

### (2) `$replaceRoot` vs. `$replaceWith`

#### 1. `$replaceRoot` (Standard syntax)
Requires wrapping the path inside a `newRoot` property:
```javascript
{ $replaceRoot: { newRoot: "$nested_field" } }
```

#### 2. `$replaceWith` (Modern alias - MongoDB 4.2+)
Allows passing the subdocument path directly as a string parameter, simplifying queries:
```javascript
{ $replaceWith: "$nested_field" }
```

---

### (3) Reality Metaphor (Unboxing Deliveries)
Imagine receiving a package in the mail:
-   **Input Document:** A large cardboard **Shipping Box** containing bubble wrap, invoice slips, and a smaller, premium **Smartphone Box** inside.
-   **`$replaceRoot` Stage:** You open the shipping box, pull out the **Smartphone Box**, and throw the outer shipping box, invoice sheets, and bubble wrap into the trash. 
    -   You place the smartphone box on the desk. 
    -   It is now the primary object in front of you.

---

### (4) Code Examples

#### Promoting a Joined Subdocument to Root
Let's join profiles and promote the nested details:

```javascript
db.users.insertOne({
  _id: 1,
  username: "alice_dev",
  profile: { first_name: "Alice", last_name: "Smith", age: 28 } // Nested
});

db.users.aggregate([
  // Promote the nested 'profile' subdocument to the top level
  {
    $replaceWith: "$profile" // Note the '$' prefix!
  }
]);

// Output: Wipes 'username' and '_id: 1', making 'profile' the root!
// { "first_name": "Alice", "last_name": "Smith", "age": 28 }
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to replace the root with a field that does not resolve to a valid BSON document object

**The mistake:** Running `{ $replaceWith: "$username" }` where `username` is a simple string string value.

**Why it's wrong:** The root of a MongoDB document must be a valid BSON document object (a set of key-value pairs). 

If you try to replace the root with a string, integer, or array, the query engine will throw a validation error and fail:
`ERROR: newRoot target must evaluate to an object, found string.`

**Fix: Ensure the path passed to `$replaceRoot` or `$replaceWith` targets a nested object subdocument. If you want to promote a string, you must wrap it in an object constructor first: `{ $replaceWith: { name: "$username" } }`.**

---



### Mistake 2: Passing Non-Object Expressions to `$replaceRoot` `newRoot` Argument

**The mistake:** Writing `$replaceRoot: { newRoot: "$tags" }` where `tags` is an array or string scalar.

**Why it's wrong:** `$replaceRoot` `newRoot` MUST evaluate to a valid BSON sub-document object. Passing primitive scalars or arrays throws a pipeline execution error.

*Incorrect:*
```javascript
db.posts.aggregate([{ $replaceRoot: { newRoot: "$tags" } }]); // ❌ tags is an array, not object!
```

*Fix:*
```javascript
db.posts.aggregate([{ $replaceRoot: { newRoot: "$metadata" } }]); // metadata is sub-document object
```

### Mistake 3: Confusing `$replaceRoot` with `$replaceWith`

**The mistake:** Writing `$replaceRoot: "$subdoc"` using simplified syntax.

**Why it's wrong:** `$replaceRoot` requires wrapper object `{ newRoot: expression }`. For simplified string path syntax `$replaceWith: "$subdoc"`, use `$replaceWith` alias stage.

*Incorrect:*
```javascript
db.users.aggregate([{ $replaceRoot: "$profile" }]); // ❌ Missing newRoot wrapper!
```

*Fix:*
```javascript
db.users.aggregate([{ $replaceWith: "$profile" }]); // Alias syntax
```

## 6. Practice Exercises

### Exercise 1: Subdocument Promotion

**Problem:** You have a `companies` collection. Each company contains a nested subdocument named `address`:
`{ _id: 10, name: "DevCorp", address: { city: "Boston", zip: "02108" } }`
Write the aggregation pipeline containing a single `$replaceWith` stage to promote the `address` fields to the top level.

**Expected output:**
```javascript
[
  {
    $replaceWith: "$address"
  }
]
```

> [!check]- Answer
> - Prefix the target subdocument field path with the dollar sign `$`.
> - Use the `$replaceWith` stage operator to execute the promotion.

---



### Exercise 2: Promoting Sub-Document to Top-Level Document

**Problem:** Promote embedded sub-document `address` to become the top-level document using `$replaceRoot`.

**Expected output:**
```text
db.users.aggregate([{ $replaceRoot: { newRoot: "$address" } }]);
```

> [!check]- Answer
> ```javascript
> db.users.aggregate([
>   { $replaceRoot: { newRoot: "$address" } }
> ]);
> ```
>
> **Explanation:** `$replaceRoot` replaces top-level documents with specified sub-document objects.

### Exercise 3: Using Simplified `$replaceWith` Alias

**Problem:** Promote joined object `userInfo` using `$replaceWith: "$userInfo"`.

**Expected output:**
```text
db.orders.aggregate([{ $replaceWith: "$userInfo" }]);
```

> [!check]- Answer
> ```javascript
> db.orders.aggregate([
>   { $replaceWith: "$userInfo" }
> ]);
> ```
>
> **Explanation:** `$replaceWith` is a convenient alias stage for `$replaceRoot: { newRoot: expr }`.

## 7. Related Terms
- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [`$project` / `$addFields` Stages](project_addfields.md) — Reshaping alternatives.

---

## 8. Key Takeaways
- `$replaceRoot` and `$replaceWith` promote nested objects to root documents.
- Discards all other fields in the parent document, including the original `_id`.
- `$replaceWith` is a modern, simpler alias for `$replaceRoot: { newRoot: "..." }`.
- The target of the promotion must evaluate to a valid BSON document object.
- Attempting to promote strings, numbers, or arrays directly triggers query crashes.
- Essential for flattening subdocuments retrieved via `$lookup` joins.
- Streamlines database API payloads before sending data to client applications.
