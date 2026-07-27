# String

> **Level 2 — BSON Data Types & Document Structure**
> The BSON data type used to store UTF-8 encoded text characters, serving as the document-oriented equivalent of PostgreSQL's `VARCHAR` and `TEXT` types.

---

## 1. Prerequisites
- [BSON Data Types (Overview)](bson_data_types.md) — The parent BSON type system.

---

## 2. Term Category
- **Database Structure / Data Type**

---

## 3. Environment Context
- **Universal Standard** (Strings are UTF-8 encoded and null-terminated inside the compiled binary BSON format, matching string types in all modern programming languages).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Text is the most common data type in application development: usernames, email addresses, blog posts, and shipping addresses are all text.

In PostgreSQL, you must select between different text types:
-   `CHAR(2)`: Fixed length (pads spaces).
-   `VARCHAR(100)`: Capped variable length.
-   `TEXT`: Uncapped variable length.

We designed the **BSON String** type to simplify text storage. 

In MongoDB, **there is no distinction between Char, Varchar, or Text.** 

All text values are stored as a single, dynamic `String` type. 

The string automatically grows to fit the input text, up to the maximum limit of the document itself (16MB). 

All BSON strings are UTF-8 encoded, meaning they natively support international symbols, emojis, and foreign characters without special configurations.

---

### (2) String Querying and Indexing
Because strings are dynamic, MongoDB indexes them using standard B-trees. 

You can search strings using:
-   Exact matches: `db.users.find({ email: "alice@company.com" })`
-   Regular expressions (pattern matching): `db.users.find({ email: /@company\.com$/ })`

---

### (3) Reality Metaphor
Imagine writing labels on inventory boxes:
-   **PostgreSQL Column Types:** You have a selection of physical label sticker templates: a small 2-character template, a medium 100-character template, and a giant notepad. You must select the right template before labeling the shelves.
-   **BSON String:** A roll of **Label Maker Tape**. 
    -   You write the text, and the label machine prints the tape and cuts it exactly where the text ends. 
    -   Whether the text is a 3-character SKU (`"BOX"`) or a 5-page essay, it uses the same tape roll, cut to fit.

---

### (4) Code Examples

#### Inserting and Querying String Data
```javascript
// Insert documents carrying strings
db.users.insertOne({
  username: "coder_bob",               // Standard string
  country: "DE",                       // Short string
  bio: "Hello! I am a software dev."   // Long text string
});

// Query using case-insensitive regex pattern
db.users.find({ bio: /software/i });
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Storing numbers or date values as strings in your documents

**The mistake:** Saving a price as `{ price: "49.99" }` or a birthdate as `{ dob: "1998-05-12" }` to save time during imports.

**Why it's wrong:** If you store numbers or dates as strings, **range query filters and sorting will fail.** 

Strings sort alphabetically, not numerically:
-   The string `"10"` is sorted **before** `"2"` (because `"1"` comes before `"2"`).
-   You cannot run arithmetic aggregates (like `$sum` or `$avg`) on string fields.
-   You cannot run date math comparisons (like finding users registered in the last 7 days).

**Fix: Always convert inputs to correct BSON types at the application boundary before inserting. Store prices as `Decimal128` or `Double`, and dates as `Date`.**

---



### Mistake 2: Storing ISO Date Strings Instead of Native BSON Date Objects

**The mistake:** Storing `createdAt: "2026-01-01T00:00:00Z"` as a text string.

**Why it's wrong:** Text date strings prevent using native date aggregation expressions (`$year`, `$dayOfWeek`) and date arithmetic operators.

*Incorrect:*
```javascript
db.users.insertOne({ createdAt: "2026-01-01T00:00:00Z" }); // Plain text string date!
```

*Fix:*
```javascript
db.users.insertOne({ createdAt: new Date("2026-01-01T00:00:00Z") }); // Native BSON Date
```

### Mistake 3: Case-Sensitive String Queries Failing on Mixed Case User Inputs

**The mistake:** Querying `db.users.find({ email: "ALICE@EXAMPLE.COM" })` when stored email is `"alice@example.com"`.

**Why it's wrong:** MongoDB string equality queries are case-sensitive by default. Use lowercase normalization or Collation with `strength: 2`.

*Incorrect:*
```javascript
db.users.find({ email: "ALICE@EXAMPLE.COM" }); // ❌ Fails case-sensitive match!
```

*Fix:*
```javascript
db.users.find({ email: "alice@example.com" }); // Normalize inputs to lowercase
```

## 6. Practice Exercises

### Exercise 1: Regex String Query

**Problem:** You have a `products` collection containing a string field named `sku`. 
Write the MongoDB query using a regular expression to find all products where the `sku` starts with the uppercase prefix `"BIKE-"`.

**Expected output:**
```javascript
db.products.find({ sku: /^BIKE-/ });
```

> [!check]- Answer
> - The regex symbol `^` asserts the start of a string.
> - Wrap the pattern inside forward slashes `/pattern/` to define a regular expression literal in `mongosh`.

---



### Exercise 2: Case-Insensitive Collation Query

**Problem:** Query user email `"Alice@Example.com"` case-insensitively using collation `{ locale: "en", strength: 2 }`.

**Expected output:**
```text
db.users.find({ email: "Alice@Example.com" }).collation({ locale: "en", strength: 2 });
```

> [!check]- Answer
> ```javascript
> db.users.find({ email: "Alice@Example.com" }).collation({
>   locale: "en",
>   strength: 2
> });
> ```
>
> **Explanation:** Collation `strength: 2` performs case-insensitive string matching.

### Exercise 3: String Regex Substring Matching

**Problem:** Query users whose `name` starts with `"A"` using regex `^A`.

**Expected output:**
```text
db.users.find({ name: { $regex: "^A" } });
```

> [!check]- Answer
> ```javascript
> db.users.find({ name: { $regex: "^A" } });
> ```
>
> **Explanation:** `$regex` performs pattern matching on string fields.

## 7. Related Terms
- [BSON Data Types (Overview)](bson_data_types.md) — The parent types.
- [Number Types (`Int32`, `Int64` / `Long`, `Double`, `Decimal128`)](number_types.md) — Non-text alternatives.

---

## 8. Key Takeaways
- The BSON String stores UTF-8 character sequences.
- Serves as the MongoDB equivalent to SQL `VARCHAR` and `TEXT`.
- MongoDB has no length limit checks on text fields besides the 16MB document cap.
- Supports international characters and emojis out-of-the-box.
- Allows pattern matching searches using native Regular Expressions.
- **Rule of Thumb:** Never store prices, quantities, or dates as string fields.
