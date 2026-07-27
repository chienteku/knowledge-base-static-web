# `search::*` Functions & `@@` Operator

> **Level 7 — Indexes, Full-Text Search & Performance**
> The SurrealQL query operator (`@<id>@` / `@@`) and standard library module (`search::score()`, `search::highlight()`) used to execute full-text search queries and format relevance search results.

---

## 1. Prerequisites
- [Search Index & `DEFINE ANALYZER`](search_index_analyzer.md) — Full-text search architecture.
- [Operators in SurrealQL](../level_03/operators.md) — Query operators.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Evaluated by the full-text search engine. Scans inverted index tables and calculates BM25 relevance scores during query execution).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Once a full-text search index is defined, developers need expressive query syntax to:
- Search indexed fields for keywords (`WHERE content @1@ "search term"`).
- Retrieve the numerical relevance score calculated by the BM25 algorithm to sort results.
- Extract highlighted snippet strings surrounding the matched terms for display in user interfaces.

In SQL (PostgreSQL), full-text searching uses the `@@` operator and `ts_rank()` / `ts_headline()` functions. In MongoDB, search uses `$text` or `$search` aggregation stages.

We designed the **`@` Operator & `search::*` Functions** in SurrealQL to provide a clean search query interface. The `@<index_id>@` operator matches terms against specified search indexes, while `search::score()` and `search::highlight()` allow you to sort and format search hits in standard `SELECT` projections.

---

### (2) Key Search Syntax & Functions

1. **The Match Operator (`@<index_id>@` / `@@`):**
   Matches terms against the search index.
   - `WHERE title @1@ "database rust"`: Searches using search index #1.
   - `WHERE title @@ "database rust"`: Shortcut matching default search index.

2. **Relevance Scoring (`search::score(index_id)`):**
   Returns the float BM25 relevance score for each matching record.
   - Example: `SELECT title, search::score(1) AS score FROM article WHERE content @1@ "rust" ORDER BY score DESC;`

3. **Hit Highlighting (`search::highlight(prefix, suffix, index_id)`):**
   Wraps matched terms inside snippet text with custom HTML tags (e.g. `<b>rust</b>`).
   - Example: `SELECT search::highlight("<b>", "</b>", 1) AS snippet FROM article WHERE content @1@ "rust";`

---

### (3) Reality Metaphor (Highlighter & Score Card)
Imagine searching research papers in an archive:
- **`@` Match Operator:** A detector wand that beeps whenever a paper contains your search terms.
- **`search::score`:** A **Relevance Score Card** stamped on each paper (e.g. "Relevance: 9.8/10"), telling you how closely the paper matches your topic.
- **`search::highlight`:** Taking a **Yellow Fluorescent Highlighter Pen** and drawing bright boxes around every matching term on the page so your eyes spot them instantly.

---

### (4) Code Examples

#### Executing Full-Text Search Queries in SurrealQL

```sql
-- Assume index created: DEFINE INDEX article_search ON article COLUMNS title, content SEARCH ANALYZER english_search BM25 HIGHLIGHTS;

-- 1. Simple search query using the @@ operator
SELECT title FROM article WHERE content @@ "database rust";

-- 2. Search query retrieving BM25 relevance scores and sorting by relevance
SELECT 
  title,
  search::score(1) AS relevance
FROM article
WHERE content @1@ "database rust"
ORDER BY relevance DESC;

-- 3. Search query with HTML highlighting snippet generation
SELECT 
  title,
  search::score(1) AS relevance,
  search::highlight("<b>", "</b>", 1) AS snippet
FROM article
WHERE content @1@ "database rust"
ORDER BY relevance DESC;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to sort full-text search results without ordering by 'search::score() DESC', returning arbitrary un-ranked records

**The mistake:** Running `SELECT * FROM article WHERE content @@ "search term";` expecting the most relevant articles to be listed first automatically.

**Why it's wrong:** Without an explicit `ORDER BY search::score() DESC` clause, SurrealDB returns matching records in storage insertion order rather than relevance order.

**Fix: Always select `search::score(id)` and order by it descending:**

```sql
-- BAD (returns un-ranked records)
SELECT * FROM article WHERE content @@ "database";

-- GOOD (sorts by BM25 relevance score)
SELECT title, search::score(1) AS score FROM article WHERE content @1@ "database" ORDER BY score DESC;
```

---



### Mistake 2: Using `search::score()` Outside Full-Text Search Queries

**The mistake:** Executing `SELECT *, search::score(0) FROM article;` without a `WHERE ... SEARCH ...` clause.

**Why it's wrong:** `search::score(index_id)` extracts relevance scores for full-text search queries. Calling it on standard non-search queries throws an evaluation error.

*Incorrect:*
```surrealql
SELECT *, search::score(0) FROM article; // ❌ No SEARCH clause present!
```

*Fix:*
```surrealql
SELECT *, search::score(0) AS score FROM article WHERE body SEARCH "surrealdb" ORDER BY score DESC;
```

### Mistake 3: Passing Incorrect Index Identifiers to `search::score()`

**The mistake:** Passing index identifier `search::score(1)` when only one search index `0` was queried.

**Why it's wrong:** `search::score(N)` references the 0-indexed search clause in the query. Pass `0` for the first `SEARCH` clause.

*Incorrect:*
```surrealql
SELECT *, search::score(1) FROM article WHERE body SEARCH "test"; // ❌ Index identifier out of bounds!
```

*Fix:*
```surrealql
SELECT *, search::score(0) AS score FROM article WHERE body SEARCH "test";
```

## 6. Practice Exercises

### Exercise 1: Search Query Formulation

**Problem:** You have a `documents` table with search index #1 configured.
Write the SurrealQL query to:
1. Search `documents` where the index matches `"machine learning"`.
2. Select the `title` and the relevance score aliased as `rank`.
3. Order results by `rank` descending.

**Expected output:**
```sql
SELECT 
  title, 
  search::score(1) AS rank 
FROM documents 
WHERE title @1@ "machine learning" 
ORDER BY rank DESC;
```

> [!check]- Answer
> - Match terms using `@1@ "machine learning"`.
> - Retrieve scores using `search::score(1)`.

---



### Exercise 2: Full-Text Search Relevance Score Projection

**Problem:** Project `search::score(0)` as `relevance` searching `article` for `'rust'`.

**Expected output:**
```text
SELECT *, search::score(0) AS relevance FROM article WHERE title SEARCH 'rust' ORDER BY relevance DESC;
```

> [!check]- Answer
> ```surrealql
> SELECT *, search::score(0) AS relevance FROM article WHERE title SEARCH 'rust' ORDER BY relevance DESC;
> ```
>
> **Explanation:** `search::score(0)` returns BM25 full-text search relevance scores.

### Exercise 3: Full-Text Highlight Snippets

**Problem:** Extract highlighted text snippets using search highlight functions.

**Expected output:**
```text
SELECT search::highlight('<b>', '</b>', 0) AS snippet FROM article WHERE body SEARCH 'database';
```

> [!check]- Answer
> ```surrealql
> SELECT search::highlight('<b>', '</b>', 0) AS snippet FROM article WHERE body SEARCH 'database';
> ```
>
> **Explanation:** `search::highlight()` wraps matched search terms in HTML highlight tags.

## 7. Related Terms
- [Search Index & `DEFINE ANALYZER`](search_index_analyzer.md) — Search architecture.
- [Operators in SurrealQL](../level_03/operators.md) — Query operators.

---

## 8. Key Takeaways
- The `@` operator matches text against configured `SEARCH` indexes.
- `search::score(index_id)` returns the floating-point BM25 relevance score.
- `search::highlight(start_tag, end_tag, index_id)` generates text snippets with highlighted matches.
- Always order full-text search queries by `search::score() DESC` to rank top matches first.
- Search index ID (e.g. `@1@`, `search::score(1)`) references the target index position.
