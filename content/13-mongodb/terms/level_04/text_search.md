# Text Search (`$text` / `$search`)

> **Level 4 — Advanced Querying**
> MongoDB's built-in full-text search capability that utilizes specialized Text Indexes to support tokenization, stop-word filtering, word stemming, and relevance scoring, equivalent to PostgreSQL's `tsvector`/`tsquery` search engine.

---

## 1. Prerequisites
- [`$regex` (Regular Expressions)](regex.md) — The string search alternative.

---

## 2. Term Category
- **Database Command / DML Operator**

---

## 3. Environment Context
- **MongoDB Core** (Requires creating a dedicated `text` index on target fields. Matches terms using language-specific dictionaries to normalize words).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you build a blog or product review site, users expect a Google-like search bar:
-   Searching for `"fishes"` should match documents containing `"fish"` or `"fishing"` (word stemming).
-   Common words like `"the"`, `"and"`, or `"a"` (stop words) should be ignored to avoid false matches.
-   Results should be sorted so that documents containing the search term multiple times appear at the top (relevance scoring).

As learned in `regex.md`, trying to handle this using regular expressions is slow and cannot calculate relevance scores or handle word stems.

We designed **Text Search** to solve this problem natively in MongoDB. 

By building a **Text Index** on your string fields, MongoDB compiles your text into an inverted index tree. 

You query this index using the **`$text`** and **`$search`** operators, allowing high-speed, dictionary-based text searches.

---

### (2) How Text Search Works
1.  **Stop Words Filtering:** MongoDB ignores common noise words (e.g. `"the"`, `"is"`, `"at"`) based on the database language configuration.
2.  **Stemming:** Words are reduced to their root form. For example, `"running"` and `"runs"` are both indexed as the root word `"run"`.
3.  **Relevance Score Calculation:** For every matched document, MongoDB calculates a numeric score (`textScore`) reflecting how well the document matches the search terms.

---

### (3) Reality Metaphor
Imagine searching for a topic inside a 500-page science textbook:
-   **Regex Search:** Flipping through the book page-by-page, reading every paragraph to find the word `"gravity"`. (Takes hours).
-   **Text Search:** Flipping to the **Alphabetical Index Glossary** at the back of the book. 
    -   You locate the word `"gravity"` in 2 seconds. 
    -   It lists pages 45, 102, and 200. 
    -   Under the entry, it also links related words like `"gravitational"` (stemming).

---

### (4) Code Examples

#### 1. Creating the Text Index
You must create a text index before running text queries. A collection can only have **one** text index, but the index can cover multiple fields:

```javascript
db.articles.createIndex({ title: "text", content: "text" });
```

#### 2. Querying and Sorting by Relevance Score
Use the `$text` operator to search. Project and sort by the calculated `textScore` to show the best matches first:

```javascript
db.articles.find(
  { $text: { $search: "database tutorial" } },             // 1. Text Search Filter
  { score: { $meta: "textScore" } }                        // 2. Project Relevance Score
)
.sort({ score: { $meta: "textScore" } });                  // 3. Sort highest score first
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to run a '$text' query on a collection without first building a text index on the target fields

**The mistake:** Running the query `db.articles.find({ $text: { $search: "NoSQL" } })` on a newly created collection without configuring index schemas.

**Why it's wrong:** Unlike `$regex` which runs collection scans on raw fields, the `$text` operator relies entirely on a pre-compiled text index. 

If no text index is present, the query will immediately crash with a database error:
`ERROR: text index required for $text query.`

**Fix: Always execute `createIndex()` to build a text index on your fields before deploying text search queries in your backend scripts.**

---



### Mistake 2: Executing `$text` Queries Without Creating a Text Index First

**The mistake:** Executing `db.posts.find({ $text: { $search: "mongodb" } })` on an un-indexed collection.

**Why it's wrong:** `$text` query operator REQUIRES a Text Index (e.g. `db.posts.createIndex({ body: "text" })`). Executing `$text` without a text index throws a query execution error.

*Incorrect:*
```javascript
db.posts.find({ $text: { $search: "mongodb" } }); // ❌ Fails without text index!
```

*Fix:*
```javascript
db.posts.createIndex({ body: "text" });
db.posts.find({ $text: { $search: "mongodb" } });
```

### Mistake 3: Creating Multiple Text Indexes on a Single Collection

**The mistake:** Executing `db.posts.createIndex({ title: "text" })` followed by `db.posts.createIndex({ body: "text" })`.

**Why it's wrong:** MongoDB permits at most ONE Text Index per collection! To index multiple fields, create a single compound text index `db.posts.createIndex({ title: "text", body: "text" })`.

*Incorrect:*
```javascript
db.posts.createIndex({ title: "text" });
db.posts.createIndex({ body: "text" }); // ❌ Error: Collection already has a text index!
```

*Fix:*
```javascript
db.posts.createIndex({ title: "text", body: "text" }); // Single multi-field text index
```

## 6. Practice Exercises

### Exercise 1: Article Search Formulation

**Problem:** You have a `posts` collection containing `subject` and `body` fields.
1.  Write the query to create a text index covering both fields.
2.  Write the search query to find all documents matching the term `"javascript guide"`, sorted by relevance score (highest first).

**Expected output:**
> [!check]- Answer
> ```javascript
> // 1. Create text index
> db.posts.createIndex({ subject: "text", body: "text" });
> 
> // 2. Execute text search
> db.posts.find(
>   { $text: { $search: "javascript guide" } },
>   { score: { $meta: "textScore" } }
> )
> .sort({ score: { $meta: "textScore" } });
> ```
> - The index declaration specifies the string `"text"` as the index type.
> - Use the projection helper `$meta: "textScore"` to expose the scoring column.

---



### Exercise 2: Creating Multi-Field Text Index

**Problem:** Create text index `post_text_idx` on `title` and `body` fields of `posts` collection.

**Expected output:**
> [!check]- Answer
> ```text
> db.posts.createIndex({ title: "text", body: "text" }, { name: "post_text_idx" });
> ```
> ```javascript
> db.posts.createIndex(
>   { title: "text", body: "text" },
>   { name: "post_text_idx" }
> );
> ```
>
> **Explanation:** Creating a compound text index indexes multiple string fields for `$text` search.

---

### Exercise 3: Text Search with Relevance Score Ordering

**Problem:** Query `$text` search for `"nosql database"` returning `textScore` meta projection ordered by score descending.

**Expected output:**
> [!check]- Answer
> ```text
> db.posts.find({ $text: { $search: "nosql database" } }, { projection: { score: { $meta: "textScore" } } }).sort({ score: { $meta: "textScore" } });
> ```
> ```javascript
> db.posts.find(
>   { $text: { $search: "nosql database" } },
>   { projection: { score: { $meta: "textScore" } } }
> ).sort({ score: { $meta: "textScore" } });
> ```
>
> **Explanation:** `{ $meta: "textScore" }` projects and sorts search results by full-text relevance score.

## 7. Related Terms
- [`$regex` (Regular Expressions)](regex.md) — Pattern searches.

---

## 8. Key Takeaways
- Text Search provides full-text dictionary searches on collections.
- Direct equivalent to PostgreSQL's `tsvector` and `tsquery` tools.
- Requires building a dedicated text index (`createIndex({ field: "text" })`).
- Only one text index is allowed per collection (can be composite).
- Natively filters stop words and applies language stemming rules.
- Calculate and sort results using the relevance score metadata (`textScore`).
- Drastically faster and more feature-rich than unanchored regex searches.
