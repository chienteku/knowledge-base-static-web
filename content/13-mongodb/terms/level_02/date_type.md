# Date

> **Level 2 — BSON Data Types & Document Structure**
> The BSON data type that stores a 64-bit integer representing milliseconds since the Unix epoch, always stored in UTC format, equivalent to PostgreSQL's `TIMESTAMPTZ` type.

---

## 1. Prerequisites
- [BSON Data Types (Overview)](bson_data_types.md) — The parent BSON type catalog.

---

## 2. Term Category
- **Database Structure / Data Type**

---

## 3. Environment Context
- **MongoDB Core** (Stored internally as a 64-bit signed integer. The MongoDB shell (`mongosh`) wraps this type in a helper output function called `ISODate()`).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Tracking time is essential in application database design:
-   When did a user register?
-   At what second was a credit card charged?
-   When does a promotion discount expire?

Because standard **JSON** lacks a native Date type, web developers are forced to write dates as strings: `"2026-07-21T15:00:00Z"`. 

This introduces problems:
-   **Slow range queries:** Comparing if a string date is earlier or later than another string requires alphabetical string parses, which is slow.
-   **No date operations:** You cannot easily extract the "month" or calculate timezone offsets on raw strings.

We designed the **BSON Date** type to store timestamps efficiently. 

Under the hood, MongoDB stores dates as a single **64-bit integer counting milliseconds since January 1, 1970** (the Unix Epoch). 

This makes date math instant: checking if a date is between two times is a simple integer comparison. 

MongoDB **always stores dates in UTC internally**, ensuring timezone consistency across distributed database nodes.

---

### (2) ISODate() in mongosh
When you query MongoDB, you see date fields wrapped in `ISODate()`:
`ISODate("2026-07-21T15:00:00Z")`

This is a helper wrapper. 

The database outputs the raw UTC integer, and the shell formats it into a human-readable ISO-8601 string so you can read it easily.

---

### (3) Reality Metaphor
Imagine tracking deadlines:
-   **String Date:** Writing `"July 21, 2026"` on a paper index card. It is human-readable, but to calculate `"14 days later"`, you must run complex calendar logic (remembering how many days are in July).
-   **BSON Date:** A digital **Millisecond Stop-watch**. 
    -   It reads a big integer: `1784649600000`. 
    -   To add 14 days, the CPU simply runs basic math: `1784649600000 + (14 * 24 * 60 * 60 * 1000)`. 
    -   The calculation finishes in a single CPU cycle.

---

### (4) Code Examples

#### Inserting and Range Querying Dates
To write a real BSON Date, always use the JavaScript constructor `new Date()`:

```javascript
// 1. Insert documents with Date types
db.logs.insertMany([
  { event: "login", created_at: new Date("2026-07-20T10:00:00Z") },
  { event: "logout", created_at: new Date("2026-07-21T12:00:00Z") }
]);

// 2. Query for logs created after July 20th
db.logs.find({
  created_at: { $gt: new Date("2026-07-20T23:59:59Z") }
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Calling 'Date()' without the 'new' keyword when inserting timestamps in mongosh

**The mistake:** Running the write query `db.logs.insertOne({ time: Date() })`, assuming it saves a BSON Date object.

**Why it's wrong:** In JavaScript and the MongoDB shell, calling `Date()` as a raw function (without `new`) returns the date as a **String representation** (e.g. `"Tue Jul 21 2026 23:00:00 GMT+0800"`), not an object. 

MongoDB will save it as a BSON String type. 

You lose range sorting indexing and date math capabilities.

**Fix: Always use the `new` keyword constructor: `new Date()` or `ISODate()` to guarantee you are writing a real BSON Date object.**

```javascript
// CORRECT: Both save real BSON Date types
db.logs.insertOne({ time: new Date() });
db.logs.insertOne({ time: ISODate() });
```

---



### Mistake 2: Passing ISO Date Strings instead of BSON Date Objects to Date Queries

**The mistake:** Querying `db.logs.find({ createdAt: { $gt: "2026-01-01T00:00:00Z" } })`.

**Why it's wrong:** Un-parsed string `"2026-01-01..."` is a string primitive! Comparing string to BSON Date uses BSON Type Comparison Order, which sorts strings higher than Date objects.

*Incorrect:*
```javascript
db.logs.find({ createdAt: { $gt: "2026-01-01T00:00:00Z" } }); // ❌ String comparison!
```

*Fix:*
```javascript
db.logs.find({ createdAt: { $gt: new Date("2026-01-01T00:00:00Z") } }); // BSON Date object
```

### Mistake 3: Expecting BSON Date Primitives to Retain Local Timezone Offsets

**The mistake:** Expecting BSON Date objects to preserve local UTC+8 timezone offset information.

**Why it's wrong:** BSON `Date` objects store 64-bit UTC epoch milliseconds. Timezone offsets are not stored in BSON Dates and must be handled by application code.

*Incorrect:*
```javascript
// Expecting BSON Date to store timezone offset +08:00
```

*Fix:*
```javascript
Store timezone string in separate field: { date: new Date(), tz: "Asia/Taipei" }
```

## 6. Practice Exercises

### Exercise 1: Date Range Query

**Problem:** You have a `transactions` collection. Write the query to select all transactions created between Jan 1, 2026 (inclusive) and Jan 2, 2026 (exclusive).

**Expected output:**
```javascript
db.transactions.find({
  created_at: {
    $gte: new Date("2026-01-01T00:00:00Z"),
    $lt: new Date("2026-01-02T00:00:00Z")
  }
});
```

> [!check]- Answer
> - Combine the greater-than-or-equal `$gte` and less-than `$lt` operators in a single filter sub-document.
> - Instantiate two date constructors wrapping ISO strings.

---



### Exercise 2: Date Range Query

**Problem:** Query logs created after `2026-01-01T00:00:00Z` using `ISODate()` or `new Date()`.

**Expected output:**
```text
db.logs.find({ createdAt: { $gte: ISODate("2026-01-01T00:00:00Z") } });
```

> [!check]- Answer
> ```javascript
> db.logs.find({ createdAt: { $gte: ISODate("2026-01-01T00:00:00Z") } });
> ```
>
> **Explanation:** `ISODate()` constructs BSON Date objects from ISO 8601 strings in mongosh.

### Exercise 3: Current Timestamp Date Insertion

**Problem:** Insert user document with `createdAt` field set to current date timestamp (`new Date()`).

**Expected output:**
```text
db.users.insertOne({ name: "Alice", createdAt: new Date() });
```

> [!check]- Answer
> ```javascript
> db.users.insertOne({ name: "Alice", createdAt: new Date() });
> ```
>
> **Explanation:** `new Date()` captures current UTC timestamp as a BSON Date primitive.

## 7. Related Terms
- [BSON Data Types (Overview)](bson_data_types.md) — The parent types.
- [Timestamp vs. Date](timestamp_vs_date.md) — Internal logging difference.

---

## 8. Key Takeaways
- The BSON Date type stores calendar timestamps as 64-bit UTC integers.
- Serves as the MongoDB equivalent to PostgreSQL's `TIMESTAMPTZ` type.
- Always stored in UTC format internally; drivers translate timezone offsets.
- Always use `new Date()` or `ISODate()` constructors to ensure correct typing.
- Calling `Date()` without `new` writes a string, breaking range queries.
- Faster to index and compare than text-based string dates.
