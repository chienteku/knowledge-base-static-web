# Dot Notation

> **Level 4 — Advanced Querying**
> The path syntax used to navigate, query, and update nested fields inside BSON embedded documents and array elements by separating keys with a period (`.`).

---

## 1. Prerequisites
- [Embedded Document (Subdocument)](../level_02/embedded_document.md) — The nested data traversed.
- [Array](../level_02/array_type.md) — The ordered lists navigated.

---

## 2. Term Category
- **Database Command / Query Syntax**

---

## 3. Environment Context
- **MongoDB Core** (Case-sensitive and whitespace-sensitive. Parsed by the query optimizer to route path searches directly into indexes).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In relational database structures, table schemas are flat. You query a column directly by name: `SELECT city FROM users;`.

In MongoDB, documents carry hierarchical nested structures:
```json
{
  "name": "Alice",
  "address": { "city": "London", "zip": "EC1" }
}
```

If you try to query this nested data using standard object matching:
`db.users.find({ address: { city: "London" } })`

MongoDB executes an **Exact Document Comparison**:
-   It will **only** match if the `address` field contains *only* the `city` key.
-   Because Alice's address also contains the `zip` key, the exact match comparison **fails**, returning zero results.

We designed **Dot Notation** to solve this nesting access problem. 

By separating keys with a dot (`"address.city"`), you create a path traversal. 

It instructs MongoDB to navigate down into the subdocument and filter strictly on the target key, ignoring sibling fields like `zip`.

---

### (2) Rules of Dot Notation
1.  **Quotation Marks Constraint:** In all MongoDB queries and update commands, dot-notation keys **must be wrapped in quotation marks** (e.g. `"address.city"`). Omitting quotes throws a JavaScript parser syntax error.
2.  **Array Index Navigation:** You can target specific elements in an array using integer index keys (zero-indexed). E.g. `"tags.0"` targets the first element of the `tags` array.

---

### (3) Reality Metaphor
Imagine a postal delivery address:
-   If you mail a letter labeled only `"Bob's Desk"`, the postman has no idea where to go.
-   Instead, you write a routing path: **`[Building] . [Floor] . [Office] . [Desk]`**
-   The postman reads the dots: they enter the Building, take the elevator to the Floor, walk to the Office, and find the Desk. 
-   The dots guide them step-by-step through the structure.

---

### (4) Code Examples

#### Traversing Nested Fields
Let's search inside embedded objects and arrays:

```javascript
db.users.insertMany([
  {
    name: "Alice",
    address: { city: "London", zip: "EC1" },
    favorites: ["coding", "chess"]
  },
  {
    name: "Bob",
    address: { city: "Paris", zip: "75001" },
    favorites: ["music", "cycling"]
  }
]);

// 1. Query nested subdocument (matches Alice)
db.users.find({ "address.city": "London" }); // Note the quotes!

// 2. Query specific array index: find users whose 1st favorite is 'coding'
db.users.find({ "favorites.0": "coding" }); // Matches Alice
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Omitting quotation marks around dot-notation keys inside query objects

**The mistake:** Writing the query `db.users.find({ address.city: "London" })` in the shell or application code.

**Why it's wrong:** In JavaScript object literals, a key name containing a period (like `address.city`) is interpreted as a dot-property access operator on a variable, rather than a string key. 

The parser will crash immediately with a `SyntaxError: Unexpected token '.'`.

**Fix: Always wrap dot-notation paths in string quotes: `db.users.find({ "address.city": "London" })`.**

---



### Mistake 2: Forgetting SQS/Quotes Around Dot-Notation Paths in JavaScript Objects

**The mistake:** Writing `db.users.find({ address.city: "NY" })` without quotes (SyntaxError).

**Why it's wrong:** In JavaScript, object key names containing dot notation MUST be enclosed in quotation marks (`"address.city"`).

*Incorrect:*
```javascript
db.users.find({ address.city: "NY" }); // ❌ JS SyntaxError: unexpected token '.'!
```

*Fix:*
```javascript
db.users.find({ "address.city": "NY" }); // Correct quoted dot-notation key
```

### Mistake 3: Overwriting Parent Sub-Documents when Setting Dot-Notation Fields

**The mistake:** Writing `{ $set: { address: { city: "NY" } } }` instead of `{ $set: { "address.city": "NY" } }`.

**Why it's wrong:** Setting `{ address: { city: "NY" } }` replaces the entire `address` sub-document, deleting all other sibling fields (`zip`, `street`).

*Incorrect:*
```javascript
db.users.updateOne({ _id: id }, { $set: { address: { city: "NY" } } }); // ❌ Deletes address.zip!
```

*Fix:*
```javascript
db.users.updateOne({ _id: id }, { $set: { "address.city": "NY" } }); // Preserves address.zip
```

## 6. Practice Exercises

### Exercise 1: Dot Path Formulation

**Problem:** You have a `companies` collection. Each document contains an array of nested documents named `employees` (e.g. `[ { name: "Bob", role: "admin" } ]`). 
Write the query path string (wrapped in quotes) using dot notation to target:
1.  The `role` field of the **second** employee in the array (hint: arrays are zero-indexed, so the second index is `1`).

**Expected output:**
```javascript
"employees.1.role"
```

> [!check]- Answer
> - The array index acts as a key in the path traversal.
> - Separate the collection key, index number, and field key with dots.

---



### Exercise 2: Nested Object Field Query with Dot-Notation

**Problem:** Query users where nested `contact.phone.mobile` equals `"555-1234"`.

**Expected output:**
```text
db.users.find({ "contact.phone.mobile": "555-1234" });
```

> [!check]- Answer
> ```javascript
> db.users.find({ "contact.phone.mobile": "555-1234" });
> ```
>
> **Explanation:** Dot-notation in quotes `"a.b.c"` traverses deeply nested sub-documents.

### Exercise 3: Positional Array Dot-Notation Query

**Problem:** Query posts where 2nd comment author `"comments.1.author"` equals `"alice"`.

**Expected output:**
```text
db.posts.find({ "comments.1.author": "alice" });
```

> [!check]- Answer
> ```javascript
> db.posts.find({ "comments.1.author": "alice" });
> ```
>
> **Explanation:** `"array.index.field"` indexes specific positional array elements.

## 7. Related Terms
- [Embedded Document (Subdocument)](../level_02/embedded_document.md) — The nested data.
- [Querying Embedded Documents](querying_embedded.md) — Dynamic nested filtering.

---

## 8. Key Takeaways
- Dot Notation traverses BSON subdocuments and arrays using periods (`.`).
- Bypasses exact document matches to query specific nested keys.
- Always wrap dot-notation keys in quotation marks (e.g., `"parent.child"`).
- Target array elements by passing index integers (e.g., `"array.0.key"`).
- Case-sensitive and whitespace-sensitive path evaluations.
- Enables high-speed index lookups on nested properties.
- Crucial for updating nested arrays and using positional operators.
