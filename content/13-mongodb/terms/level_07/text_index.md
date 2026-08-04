# Text Index

> **Level 7 — Indexes & Query Performance**
> The specialized database index type built on string fields to support full-text search, featuring word tokenization, stop-words filtering, relevance priority weights, and wildcard text indexing.

---

## 1. Prerequisites
- [Text Search (`$text` / `$search`)](../level_04/text_search.md) — The parent query operation.
- [`createIndex()` / `dropIndex()`](create_drop_index.md) — The index creation triggers.

---

## 2. Term Category
- **Database Structure / Paradigm**

---

## 3. Environment Context
- **MongoDB Core** (Calculated on the database engine. String values are tokenized and stemmed using language dictionaries (like Snowball stemmers) before being written to the index files).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
As learned in `text_search.md`, regular expressions cannot handle advanced full-text search patterns (stemming, stop words, or relevance scoring).

We designed the **Text Index** to enable high-performance text searches natively in MongoDB. 

Instead of treating a string as a single value, a Text Index splits the string into individual words (tokenization), stems them to their root forms, discards noise words (like `"the"`), and catalog-indexes the remaining terms. 

This allows fast lookups on large text bodies.

---

### (2) Text Index Rules & Parameters

#### Rule 1: One Text Index per Collection
A collection can only have **one** text index. 

If you try to build a second text index, MongoDB will throw an error. 

However, your single text index can be **composite** (cover multiple fields at the same time).

#### Rule 2: Search Weights
When indexing multiple fields (like `title` and `body`), you can assign **Weights** to specify relevance priority. 

For example, a keyword match in the `title` field is usually more important than a match in the `body` text. 

MongoDB uses these weights to calculate the relevance score (`textScore`).

#### Rule 3: Wildcard Text Indexing
If your documents contain dynamic, unknown fields (such as user-submitted product specifications) and you want to search all string fields, you can use the wildcard specifier:
`db.collection.createIndex({ "$**": "text" })`

---

### (3) Reality Metaphor (Book Index Glossaries)
-   **Text Index:** The index glossary at the back of a library book. Every entry is a unique root word (e.g. `"gravity"`), followed by a list of pages where it is mentioned.
-   **Weights:** A **Gold Star** system. 
    -   If the word `"gravity"` appears in the book's Title, the index gives the book 10 points (Gold Star). 
    -   If it only appears in the Bibliography, it gets 1 point (Silver Star). 
    -   Books with higher scores are placed at the front of the display case.

---

### (4) Code Examples

#### Creating a Weighted Text Index
Let's build a text index on articles, prioritizing title matches over body text:

```javascript
db.articles.createIndex(
  {
    title: "text", // String 'text' declares the index type
    body: "text"
  },
  {
    // Assign weights (relevance priority)
    weights: {
      title: 10, // Title matches are 5x more important than body!
      body: 2
    },
    name: "article_text_search" // Custom name for management
  }
);
```

To search all string fields dynamically:

```javascript
db.products.createIndex({ "$**": "text" }); // Wildcard text index
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to create a second text index on a collection without dropping the old one first

**The mistake:** Running `db.articles.createIndex({ description: "text" })` when the collection already contains an index built on `title: "text"`.

**Why it's wrong:** MongoDB limits collections to exactly one text index. 

The build command will fail immediately, throwing a database error.

**Fix: If you need to change the fields covered by your text search, you must first drop the existing text index using its name, and then build a new, compound text index containing all the fields you want to search:**

```javascript
// CORRECT
db.articles.dropIndex("article_text_search"); // Drop old index
db.articles.createIndex({ title: "text", description: "text" }); // Build new composite index
```

---



### Mistake 2: Creating Multiple Text Indexes on a Single Collection

**The mistake:** Attempting to create two separate text indexes on `title` and `description`.

**Why it's wrong:** MongoDB permits at most ONE Text Index per collection! Combine fields into a single compound text index `{ title: "text", description: "text" }`.

*Incorrect:*
```javascript
db.posts.createIndex({ title: "text" }); db.posts.createIndex({ description: "text" }); // ❌ Multiple text index error!
```

*Fix:*
```javascript
db.posts.createIndex({ title: "text", description: "text" });
```

### Mistake 3: Using `$text` Indexes for Real-Time Wildcard Prefix Substring Search

**The mistake:** Using `$text` for real-time `"admin*"` autocomplete search.

**Why it's wrong:** `$text` indexes tokenize words using language stemmers, making substring autocomplete slow. Use Wildcard Indexes or Atlas Search for autocomplete.

*Incorrect:*
```javascript
// Using $text for real-time search box autocomplete
```

*Fix:*
```javascript
Use Atlas Search edgeGram analyzer or Wildcard Indexes for autocomplete
```



### Mistake 4: Creating Multiple Text Indexes on a Single Collection

**The mistake:** Attempting to create two separate text indexes on `title` and `description`.

**Why it's wrong:** MongoDB permits at most ONE Text Index per collection! Combine fields into a single compound text index `{ title: "text", description: "text" }`.

*Incorrect:*
```javascript
db.posts.createIndex({ title: "text" }); db.posts.createIndex({ description: "text" }); // ❌ Multiple text index error!
```

*Fix:*
```javascript
db.posts.createIndex({ title: "text", description: "text" });
```

### Mistake 5: Using `$text` Indexes for Real-Time Wildcard Prefix Substring Search

**The mistake:** Using `$text` for real-time `"admin*"` autocomplete search.

**Why it's wrong:** `$text` indexes tokenize words using language stemmers, making substring autocomplete slow. Use Wildcard Indexes or Atlas Search for autocomplete.

*Incorrect:*
```javascript
// Using $text for real-time search box autocomplete
```

*Fix:*
```javascript
Use Atlas Search edgeGram analyzer or Wildcard Indexes for autocomplete
```

## 6. Practice Exercises

### Exercise 1: Weighted Index Creation

**Problem:** You have a `products` collection containing `name`, `summary`, and `details` fields. 
Write the MongoDB command to create a text index on all three fields, assigning weights:
-   `name`: weight `15`
-   `summary`: weight `5`
-   `details`: weight `1`

**Expected output:**
> [!check]- Answer
> ```javascript
> db.products.createIndex(
>   {
>     name: "text",
>     summary: "text",
>     details: "text"
>   },
>   {
>     weights: {
>       name: 15,
>       summary: 5,
>       details: 1
>     }
>   }
> );
> ```
> - The keys object maps the target fields to the string value `"text"`.
> - Specify the weights configuration inside the second options object.

---



### Exercise 2: Creating Multi-Field Text Index with Weights

**Problem:** Create text index on `title` (weight 10) and `body` (weight 1).

**Expected output:**
> [!check]- Answer
> ```text
> db.posts.createIndex({ title: "text", body: "text" }, { weights: { title: 10, body: 1 } });
> ```
> ```javascript
> db.posts.createIndex(
>   { title: "text", body: "text" },
>   { weights: { title: 10, body: 1 } }
> );
> ```
>
> **Explanation:** `weights` assigns higher relevance scores to matches in specified fields.

---

### Exercise 3: Full-Text Search Phrase Match

**Problem:** Query `$text` search matching exact phrase `"database index"` in quotes.

**Expected output:**
> [!check]- Answer
> ```text
> db.posts.find({ $text: { $search: "\"database index\"" } });
> ```
> ```javascript
> db.posts.find({ $text: { $search: "\"database index\"" } });
> ```
>
> **Explanation:** Escaped quotes `"\"phrase\""` perform exact phrase full-text searches.

## 7. Related Terms
- [Text Search (`$text` / `$search`)](../level_04/text_search.md) — The query command.
- [`createIndex()` / `dropIndex()`](create_drop_index.md) — The DDL triggers.

---

## 8. Key Takeaways
- Text Indexes tokenize, stem, and filter string values for full-text search.
- Only one text index is allowed per collection.
- Text indexes can cover multiple fields at the same time (composite text index).
- Set `weights` to prioritize relevance scores for specific fields (e.g. title).
- Build a wildcard text index (`{ "$**": "text" }`) to search all fields.
- Writing to text indexes is CPU-heavy because strings must be parsed and stemmed.
- Drop old text indexes first before attempting to build new ones.
