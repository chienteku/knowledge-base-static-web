# `search::*` Functions & `@@` Operator

> **Level 7 — Indexes, Full-Text Search & Performance**
> The SurrealQL query operator (`@<id>@` / `@@`) and standard library module (`search::score()`, `search::highlight()`) used to execute full-text search queries and format relevance search results.

---

## 1. Prerequisites

- [Search Index & `DEFINE ANALYZER`](search_index_analyzer.md) — Full-text search architecture.
- [Operators in SurrealQL](../level_03/operators.md) — Query operators.

---

## 2. Term Category


**Query Feature (full-text search query functions)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: BM25 Relevance Score Extraction

**Scenario:**
A full-text search query searches table `article` for term `"SurrealDB"` and projects calculated BM25 relevance scores using `search::score()`.

**Requirements:**
1. Execute `SELECT title, search::score(0) AS score FROM article WHERE title @@ "SurrealDB" ORDER BY score DESC`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE article:a1 SET title = "SurrealDB Full Text Search";
> CREATE article:a2 SET title = "Introduction to Databases";
> 
> -- Full-text search with BM25 relevance scoring
> SELECT title, search::score(0) AS score 
> FROM article 
> WHERE title @@ "SurrealDB" 
> ORDER BY score DESC;
> ```
>
> #### Technical Explanation
>
> 1. `search::score(index_idx)` returns the calculated Okapi BM25 relevance score for matching records.
> 2. Ordering by `score DESC` ranks the most relevant text matches at the top of query results.
> 3. Enables native search engine result ranking inside SurrealDB.
> 
---

### Exercise 2: Term Offset Extraction with `search::offsets()`

**Scenario:**
Retrieve character byte offsets where matching search terms appear within document text using `search::offsets()`.

**Requirements:**
1. Project `search::offsets(0)` in a full-text search query.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT title, search::offsets(0) AS term_offsets 
> FROM article 
> WHERE title @@ "SurrealDB";
> ```
>
> #### Technical Explanation
>
> 1. `search::offsets(index_idx)` returns array byte offsets indicating where matched terms occur in text.
> 2. Used by frontend client UIs to highlight search keywords in search result snippets.
> 3. Avoids re-parsing text strings on application backend servers.
> 
---

### Exercise 3: Full-Text Substring Highlight Snippets

**Scenario:**
Combine search functions to return document search results ordered by relevance.

**Requirements:**
1. Filter `WHERE title @@ "search"` and sort by `search::score(0) DESC`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT title, search::score(0) AS score 
> FROM article 
> WHERE title @@ "search" 
> ORDER BY score DESC;
> ```
>
> #### Technical Explanation
>
> 1. Full-text search operators (`@@`) match tokenized terms generated by text analyzers.
> 2. Integrates full-text search directly with SQL projection and ordering syntax.
> 3. Eliminates dedicated external search server dependencies.
> 
---



## 6. Related Terms

- [Search Index & `DEFINE ANALYZER`](search_index_analyzer.md) — Search architecture.
- [Operators in SurrealQL](../level_03/operators.md) — Query operators.
- [`SEARCH` Index (Full-Text Search)](../level_04/search_index.md) — Related concept: `SEARCH` Index (Full-Text Search).

---

## 7. Key Takeaways
- The `@` operator matches text against configured `SEARCH` indexes.
- `search::score(index_id)` returns the floating-point BM25 relevance score.
- `search::highlight(start_tag, end_tag, index_id)` generates text snippets with highlighted matches.
- Always order full-text search queries by `search::score() DESC` to rank top matches first.
- Search index ID (e.g. `@1@`, `search::score(1)`) references the target index position.
