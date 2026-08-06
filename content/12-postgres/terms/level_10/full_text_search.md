# Full-Text Search (`tsvector`, `tsquery`)

> **Level 10 — Administration, Security & Production**
> PostgreSQL's built-in document search system that parses natural language text into search-optimized word lexemes (`tsvector`) and queries them using linguistic dictionaries and logical operators (`tsquery`).

---

## 1. Prerequisites
- [GIN Index](../level_07/gin_index.md) — The parent multi-value index type used to speed up text search.

---

## 2. Term Category

**Advanced Feature** (Native Lexical Full-Text Search): Full-Text Search (`tsvector`, `tsquery`, `to_tsvector()`) performs linguistic stemming, ranking, and search indexing natively.



---

## 3. Explanation

### Environment Context
- **PostgreSQL Core** (Fully supported. Includes built-in search parser dictionaries for over 15 languages, managing word stemming and stop-word filtering natively).

### (1) Design Motivation — "Why did we design this?"
Standard SQL uses wildcard searches to find text:
`WHERE description LIKE '%run%';`

While simple, `LIKE` wildcard searches carry three severe limitations:
1.  **Linguistic Blindness:** Searching for `'run'` will not find rows containing `'running'`, `'ran'`, or `'runs'`.
2.  **No Relevance Ranking:** You cannot rank search results by how many times the keyword appears or how close the words are to each other.
3.  **Performance lag:** Leading wildcards (`%keyword`) bypass B-tree indexes, forcing slow sequential table scans.

While you could deploy an external search engine (like Elasticsearch), doing so adds infrastructure complexity, cost, and database synchronization delay.

We designed the built-in **Full-Text Search (FTS)** engine in PostgreSQL to offer high-speed, linguistic document searches natively inside your SQL database.

---

### (2) The Core FTS Components

#### 1. `tsvector` (Text Search Vector)
A database type representing a parsed document. 

It splits text into words, removes common "useless" words (like *the, a, is*, called **stop words**), and reduces the remaining words to their base linguistic roots (called **stemming**).

For example:
`to_tsvector('english', 'The quick foxes jumped')` $\rightarrow$ `'fox':3 'jump':4 'quick':2`
-   *Note:* The stop-word *'The'* is deleted, *'foxes'* became *'fox'*, and *'jumped'* became *'jump'*.

#### 2. `tsquery` (Text Search Query)
A database type representing the search terms. 

Supports logical operators: `&` (AND), `|` (OR), and `!` (NOT).

For example:
`to_tsquery('english', 'jump & fox')`

#### 3. `@@` (Match Operator)
The boolean operator that checks if a `tsvector` matches a `tsquery`.

---

### (3) Reality Metaphor
Imagine managing a library catalog:
-   **Standard LIKE Search:** Opening a book and reading page-by-page, letter-by-letter, trying to find the exact spelling `"jumped"`.
-   **Full-Text Search:** You read the book, ignore connecting words, compile a **Tag Cloud** of root words (`['fox', 'jump']`), and print them alphabetically in the back-of-the-book **Index Appendix** (the GIN index). Searching takes seconds.

---

### (4) Code Examples

#### 1. Converting and Matching Strings
```sql
SELECT to_tsvector('english', 'I love coding SQL databases') 
       @@ to_tsquery('english', 'code & database') AS matches;
-- Returns: TRUE (because 'coding' stems to 'code' and matches)
```

#### 2. Indexing Full-Text Search
To make searches fast on millions of rows, you must build an **Expression GIN Index** on the `to_tsvector` calculation:

```sql
CREATE TABLE articles (
  id INT PRIMARY KEY,
  title VARCHAR(200),
  body TEXT
);

-- Build the GIN search index on body text (note the double parentheses)
CREATE INDEX idx_articles_search_gin 
ON articles USING gin(to_tsvector('english', body));
```

#### 3. Searching the Indexed Table
```sql
SELECT title 
FROM articles 
WHERE to_tsvector('english', body) @@ to_tsquery('english', 'database & !crash');
-- Finds articles containing 'database' but NOT containing 'crash' using GIN index!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Querying with 'to_tsvector' in WHERE filters without compiling an expression index first

**The mistake:** Running full-text search queries on a large table without building a GIN index on the matching `to_tsvector` expression.

**Why it's wrong:** If there is no GIN index on `to_tsvector('english', column)`, PostgreSQL is forced to run the parser, strip stop words, and stem text for every single row in the table during the query execution. This consumes massive CPU and is slower than a standard `LIKE` query.

**Fix: Always build a matching GIN expression index on the column's `to_tsvector` calculation before launching the FTS features in production.**

---



### Mistake 2: Using `LIKE '%query%'` Instead of Native `TSVECTOR` / `TSQUERY` Full-Text Search

**The mistake:** Running `SELECT * FROM articles WHERE content ILIKE '%database%';` on 10M rows.

**Why it's wrong:** `ILIKE '%text%'` scans every character in every row (`Seq Scan`). PostgreSQL native Full-Text Search converts text to `TSVECTOR` and uses GIN indexes for sub-millisecond document searching.

*Incorrect:*
```sql
SELECT * FROM articles WHERE content ILIKE '%database%'; -- ❌ Slow Seq Scan!
```

*Fix:*
```sql
SELECT * FROM articles WHERE to_tsvector('english', content) @@ to_tsquery('english', 'database');
```

### Mistake 3: Failing to Index `TSVECTOR` Expressions with GIN Indexes

**The mistake:** Executing `WHERE to_tsvector('english', body) @@ to_tsquery('english', 'sql')` without a GIN expression index.

**Why it's wrong:** Calling `to_tsvector()` on the fly per row forces an in-memory document parsing scan. Create a GIN expression index or a stored `TSVECTOR` column.

*Incorrect:*
```sql
// Querying to_tsvector() without a GIN expression index
```

*Fix:*
```sql
CREATE INDEX idx_fts ON articles USING GIN (to_tsvector('english', body));
```

## 5. Practice Exercises

### Exercise 1: Parsing Text into `tsvector` and Matching with `tsquery`

**Scenario:**
Perform a full-text search over `articles(body)` for terms `'postgresql & index'` using `to_tsvector()` and `to_tsquery()`.

**Requirements:**
1. Use `to_tsvector('english', body) @@ to_tsquery('english', 'postgresql & index')`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT id, title 
> FROM articles 
> WHERE to_tsvector('english', body) @@ to_tsquery('english', 'postgresql & index');
> ```
>
> #### Technical Explanation
>
> 1. `to_tsvector()` parses text into lexemes, removing stop words (`the`, `a`) and applying linguistic stemming (`indexing` -> `index`).
> 2. `@@` is the full-text search match operator.
> 3. `to_tsquery()` evaluates Boolean search expressions (`&` AND, `|` OR, `!` NOT).

---

### Exercise 2: Accelerating Full-Text Search with Generated `tsvector` Columns and GIN Indexes

**Scenario:**
Add a stored generated column `search_vector` to `articles` and index it with a GIN index.

**Requirements:**
1. Add `search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> ALTER TABLE articles 
> ADD COLUMN search_vector tsvector 
> GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED;
> 
> CREATE INDEX idx_articles_search_gin 
> ON articles 
> USING GIN (search_vector);
> 
> SELECT id, title 
> FROM articles 
> WHERE search_vector @@ to_tsquery('english', 'database');
> ```
>
> #### Technical Explanation
>
> 1. Stored generated `tsvector` columns pre-calculate lexemes during inserts/updates.
> 2. GIN index over `search_vector` enables sub-millisecond full-text search across millions of documents.
> 3. Eliminates managing external Elasticsearch sync infrastructure for basic text search.

---

### Exercise 3: Relevance Ranking with `ts_rank()`

**Scenario:**
Order full-text search results by relevance score using `ts_rank()`.

**Requirements:**
1. Execute `ORDER BY ts_rank(search_vector, query) DESC`.

> [!check]- Answer
>
> #### Implementation
>
> ```sql
> SELECT 
>   id, 
>   title, 
>   ts_rank(search_vector, to_tsquery('english', 'postgresql & performance')) AS relevance_score 
> FROM articles 
> WHERE search_vector @@ to_tsquery('english', 'postgresql & performance') 
> ORDER BY relevance_score DESC;
> ```
>
> #### Technical Explanation
>
> 1. `ts_rank()` calculates a relevance score based on term frequency and document density.
> 2. Orders output results by search relevance descending.
> 3. Production search feature.

---



## 6. Related Terms
- [GIN Index](../level_07/gin_index.md) — The parent performance index.
- [Expression Index (Functional Index)](../level_07/expression_index.md) — Indexing function calculations.

---

## 7. Key Takeaways
- Full-Text Search parses natural language text for optimized indexing.
- `tsvector` parses text documents into normalized root words (lexemes).
- `tsquery` defines the logical search terms using `&` (AND) and `|` (OR).
- Automatic **stemming** maps words like "running" and "ran" back to "run".
- Automatic **stop-word** filtering discards useless words like "the" or "is".
- Always pair FTS query filters with a matching expression GIN index.
- Serves as a high-speed, built-in alternative to external search engines.
