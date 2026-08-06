# `$regex` (Regular Expressions)

> **Level 4 — Advanced Querying**
> The BSON query operator and syntax patterns used to execute string pattern matching searches in MongoDB, serving as the equivalent of SQL's `LIKE` and `ILIKE` clauses.

---

## 1. Prerequisites

- [Evaluation Query Operators (`$regex`, `$expr`, `$mod`)](evaluation_operators.md) — The evaluation context.
- [`find()` / `findOne()`](../level_03/find.md) — Pattern matching document string fields with regular expressions.

---

## 2. Term Category

**Query Operator** (Pattern Matching Regular Expressions): The $regex operator matches string field values against regular expression patterns within query filters.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Supported across NoSQL platforms. Uses Perl Compatible Regular Expressions (PCRE) to execute character-by-character string comparisons).

### (1) Design Motivation — "Why did we design this?"
Users rarely search for exact string matches in search inputs. 

If a user types `"smart"` in a product search bar, they expect to find `"Smartphone"`, `"Smartwatch"`, or `"smart tv"`.

In PostgreSQL, you handle these checks using wildcards:
`SELECT * FROM products WHERE name ILIKE '%smart%';`

We designed **`$regex`** to bring pattern matching to MongoDB. 

Because MongoDB is built on JavaScript rules, it supports native JavaScript regular expression patterns. 

This allows you to execute prefix, suffix, and case-insensitive checks without string parsing work in your backend code.

---

### (2) The Two Syntax Options

#### Option A: JavaScript Regex Literal (Recommended)
Cleanest format, preferred when writing queries in the shell or in Node.js backend files:
`db.products.find({ name: /smart/i })`

-   The slashes `/pattern/` declare the regex.
-   The trailing `i` flag makes the search **case-insensitive**.

#### Option B: Operator Object Syntax (JSON Standard)
Required when writing query configurations in strict JSON files where regex literals are forbidden:
`db.products.find({ name: { $regex: "smart", $options: "i" } })`

---

### (3) Critical Performance: Anchored vs. Unanchored Regex
Regular expressions can be slow. 

Whether a query uses an index depends on the anchor:

-   **Anchored Prefix Match (`/^pattern/`):** By using the starting anchor `^`, you tell MongoDB to search for strings that *begin* with the search term. The database engine can use a standard index to jump directly to the section matching the letters (similar to how a phone book is ordered).
-   **Unanchored Match (`/pattern/` or `/.*pattern.*/`):** If you search for letters anywhere in the string, MongoDB **cannot** use index boundaries. It must perform a **Full Collection Scan**, reading every single document from disk to check the string spelling, slowing down queries on large collections.

---

### (4) Reality Metaphor (The Phone Book Audit)
Imagine looking for names in a printed city phone book:
-   **Anchored Search (`/^Smith/`):** You flip directly to the **"S"** section, jump to **"Sm"**, and scan names starting with "Smith". (Fast, index lookup).
-   **Unanchored Search (`/smith/`):** You must read **every single page** of the phone book from start to finish, checking if the letters "smith" appear anywhere in any name (e.g. finding "Goldsmith" or "Smithson"). (Slow, collection scan).

---

### (5) Code Examples

#### Anchored vs. Unanchored Queries
Let's query a database containing these products:

```javascript
db.products.insertMany([
  { name: "Smartphone A" },
  { name: "Brand B Smartwatch" },
  { name: "Hammer tool" }
]);

// 1. Anchored Prefix Match: SUCCESS (Matches 'Smartphone A')
db.products.find({ name: /^Smart/i });

// 2. Unanchored Match: SUCCESS (Matches 'Smartphone A' and 'Brand B Smartwatch')
db.products.find({ name: /Smart/i }); // CPU-heavy! Scans all strings.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Implementing unanchored, case-insensitive regex queries as the primary search engine for massive collections

**The mistake:** Running the query `db.articles.find({ body: /mongodb/i })` on a collection containing 10 million blog posts.

**Why it's wrong:** Case-insensitive infix regex searches do not utilize indexes efficiently. 

This query forces the CPU to read and evaluate the text content of all 10 million articles, causing database memory lockups and server timeouts.

**Fix: For full-text search across large text documents, do not use regular expressions. Use MongoDB's native Text Indexes (`$text`) or Atlas Search, which compile search terms into optimized inverted index trees.**

---



### Mistake 2: Executing Un-Anchored Regex Queries on Large Collections (Full Collection Scan)

**The mistake:** Running `db.users.find({ email: { $regex: /gmail\.com/ } })` on 10M documents.

**Why it's wrong:** Un-anchored regex queries (missing `^`) cannot utilize standard B-Tree index prefix scans, forcing a full collection scan (`COLLSCAN`). Anchor regex with `^` when using prefix indexes.

*Incorrect:*
```javascript
db.users.find({ email: { $regex: /gmail\.com/ } }); // ❌ Full collection scan!
```

*Fix:*
```javascript
db.users.find({ email: { $regex: /^alice/ } }); // Index prefix scan utilizing B-Tree index
```

### Mistake 3: Using Regex for Text Search Instead of Dedicated Text Indexes (`$text` / Atlas Search)

**The mistake:** Executing complex fuzzy regex queries across multi-paragraph blog post body fields.

**Why it's wrong:** Regex queries over large text fields are extremely slow. Use MongoDB Text Indexes (`$text`) or Atlas Search for full-text search.

*Incorrect:*
```javascript
db.posts.find({ body: { $regex: /mongodb/i } }); // Slow regex text search
```

*Fix:*
```javascript
db.posts.find({ $text: { $search: "mongodb" } }); // Fast text index search
```

## 5. Practice Exercises

### Exercise 1: Case-Insensitive Prefix Matching with `$regex`

**Scenario:**
Find all users whose `name` begins with `"alice"` (case-insensitive).

**Requirements:**
1. Use `{ name: { $regex: "^alice", $options: "i" } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.find({
>   name: { $regex: "^alice", $options: "i" }
> });
> ```
>
> #### Technical Explanation
>
> 1. `$regex: "^prefix"` matches strings beginning with target characters.
> 2. `$options: "i"` enables case-insensitive matching.
> 3. Prefix regex queries (`^pattern`) can utilize standard indexes if collation matches.

---

### Exercise 2: Suffix Matching with `$regex`

**Scenario:**
Query documents where `email` ends with `@company.org`.

**Requirements:**
1. Use `{ email: { $regex: "@company\.org$" } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.users.find({
>   email: { $regex: "@company\.org$" }
> });
> ```
>
> #### Technical Explanation
>
> 1. `$regex: "pattern$"` matches string endings.
> 2. Escapes special characters (`\.`) to match literal dots.
> 3. Note: Unanchored or suffix regex queries require collection scans; consider text indexes for full-text search.

---

### Exercise 3: Validating Regex Index Execution with `explain()`

**Scenario:**
Inspect whether a regex query utilizes an index or forces a full collection scan using `explain()`.

**Requirements:**
1. Execute `db.users.find({ email: /^alice/ }).explain("executionStats")`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const plan = db.users.find({ email: /^alice/ }).explain("executionStats");
> console.log("Stage:", plan.executionStats.executionStages.stage);
> ```
>
> #### Technical Explanation
>
> 1. Anchored regex (`/^alice/`) allows the B-tree index to isolate matching prefix ranges (`IXSCAN`).
> 2. Unanchored regex (`/alice/`) forces an `COLLSCAN` across all collection documents.
> 3. Always test regex query performance with `explain()`.

---



## 6. Related Terms

- [Evaluation Query Operators (`$regex`, `$expr`, `$mod`)](evaluation_operators.md) — The parent context.
- [Text Search (`$text` / `$search`)](text_search.md) — Large text indexing alternatives.

---

## 7. Key Takeaways
- `$regex` provides regular expression pattern matching for text strings.
- Direct equivalent of SQL's `LIKE` and `ILIKE` pattern operations.
- Write queries using literals (`/pattern/i`) or object keys (`{ $regex: "...", $options: "..." }`).
- Suffixes like `i` make pattern checks case-insensitive.
- Anchored prefix patterns (`/^pattern/`) can utilize index scans.
- Unanchored patterns (`/pattern/`) force slow, CPU-intensive collection scans.
- Never use unanchored regexes as text search engines on large tables.
