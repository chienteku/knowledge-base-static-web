# `$replaceRoot` / `$replaceWith` Stages

> **Level 6 — Aggregation Framework**
> The aggregation pipeline stages used to promote a nested subdocument or calculated object expression to become the new top-level root document, discarding all other fields.

---

## 1. Prerequisites

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [Aggregation Variables (`$$ROOT`, `$$CURRENT`, `$$NOW`, `let`)](aggregation_variables.md) — Utilizing document pointers.

---

## 2. Term Category

**Aggregation** (Document Root Subdocument Promotion Stage): The $replaceRoot stage (and $replaceWith) replaces the top-level document structure with a specified embedded subdocument object.



---

## 3. Explanation

### Environment Context
- **MongoDB Core** (Executed in memory. Alters the output BSON document stream structure before passing items to the client driver serializer).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Promoting Embedded Subdocuments to Top-Level

**Scenario:**
Promote embedded `address` subdocument (`{ user: "Alice", address: { city: "Austin", state: "TX" } }`) to become the top-level document root.

**Requirements:**
1. Use `$replaceRoot: { newRoot: "$address" }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.aggregate([
>   { $match: { "address.city": "Austin" } },
>   { $replaceRoot: { newRoot: "$address" } }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$replaceRoot` replaces the existing root document structure with a target embedded subdocument object.
> 2. All original top-level fields outside `address` are discarded.
> 3. Re-shapes document outputs cleanly.
> 
---

### Exercise 2: Merging Root Documents with Subdocuments using `$mergeObjects`

**Scenario:**
Merge document default settings with user-customized settings to produce a unified root document.

**Requirements:**
1. Use `$replaceRoot` with `newRoot: { $mergeObjects: [defaultObj, "$customSettings"] }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.user_configs.aggregate([
>   {
>     $replaceRoot: {
>       newRoot: {
>         $mergeObjects: [
>           { theme: "light", notifications: true },
>           "$customSettings"
>         ]
>       }
>     }
>   }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$mergeObjects` combines key-value pairs from multiple objects, with rightmost objects overwriting duplicates.
> 2. Replaces the document root with the merged object.
> 3. Ideal for default-override settings inheritance patterns.
> 
---

### Exercise 3: Simplifying Promotion with `$replaceWith`

**Scenario:**
Demonstrate using `$replaceWith` as a clean alias for `$replaceRoot`.

**Requirements:**
1. Use `$replaceWith: "$subdoc"`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.documents.aggregate([
>   { $replaceWith: "$metadata" }
> ]);
> ```
>
> #### Technical Explanation
>
> 1. `$replaceWith` is a convenient syntactic alias for `$replaceRoot: { newRoot: ... }`.
> 2. Promotes target subdocuments directly.
> 3. Concise pipeline syntax.
> 
---



## 6. Related Terms

- [Aggregation Pipeline (Concept)](aggregation_pipeline.md) — The parent pipeline framework.
- [`$project` / `$addFields` Stages](project_addfields.md) — Reshaping alternatives.

---

## 7. Key Takeaways
- `$replaceRoot` and `$replaceWith` promote nested objects to root documents.
- Discards all other fields in the parent document, including the original `_id`.
- `$replaceWith` is a modern, simpler alias for `$replaceRoot: { newRoot: "..." }`.
- The target of the promotion must evaluate to a valid BSON document object.
- Attempting to promote strings, numbers, or arrays directly triggers query crashes.
- Essential for flattening subdocuments retrieved via `$lookup` joins.
- Streamlines database API payloads before sending data to client applications.
