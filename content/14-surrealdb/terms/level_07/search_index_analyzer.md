# Search Index & `DEFINE ANALYZER`

> **Level 7 — Indexes, Full-Text Search & Performance**
> The full-text search engine architecture in SurrealDB, combining text processing rules (`DEFINE ANALYZER`) with specialized full-text search indexes (`DEFINE INDEX ... SEARCH`) to calculate BM25 relevance scores.

---

## 1. Prerequisites
- [DEFINE INDEX (Deep Dive)](define_index.md) — The parent index context.
- [SEARCH Index](../level_04/search_index.md) — Schema configuration overview.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed by the full-text search engine. Tokenizes, filters, and stems text streams before building inverted index tables on disk).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Searching human language text requires more than exact character matching:
- **Case Inconsistency:** Searching `"Database"` should match `"database"`.
- **Word Variations (Stemming):** Searching `"running"` should match documents containing `"run"` or `"runs"`.
- **Filler Words (Stopwords):** Words like `"the"`, `"is"`, and `"an"` pollute search indexes and should be filtered out.

In PostgreSQL, text search requires configuring `tsvector` dictionaries or using PostGIS/external tools. In MongoDB, text search relies on MongoDB Atlas Search.

We designed **Search Indexes & `DEFINE ANALYZER`** in SurrealDB to provide a complete built-in full-text search pipeline. `DEFINE ANALYZER` specifies how text is broken down and cleaned (tokenizers + filters), while `DEFINE INDEX ... SEARCH ANALYZER` applies that pipeline to fields, building inverted indexes that calculate BM25 relevance scores natively.

---

### (2) The Full-Text Pipeline Architecture

```text
Raw Text ➔ [TOKENIZER] ➔ [FILTERS] ➔ Inverted Index ➔ BM25 Scoring
```

1. **Tokenizers:** Breaks text into individual tokens/words.
   - `blank`: Splits on whitespace.
   - `class`: Splits on character class changes (punctuation, numbers, symbols).
   - `camel`: Splits camelCase words (e.g. `userProfile` $\rightarrow$ `user`, `Profile`).

2. **Filters:** Transforms tokens.
   - `lowercase`: Converts tokens to lowercase.
   - `ascii`: Strips accents and diacritics (`café` $\rightarrow$ `cafe`).
   - `snowball(language)`: Applies language-specific stemming (e.g. `snowball(english)` reduces `running` $\rightarrow$ `run`).

3. **BM25 Scoring:** Ranks search results by relevance based on term frequency and document frequency.

---

### (3) Reality Metaphor (The Document Shredder & Sorter)
Imagine preparing articles for a research index:
- **Raw Document:** A page containing: *"The quick brown foxes were running fast!"*
- **Tokenizer (`class`):** Shredding the page into individual word strips: `["The", "quick", "brown", "foxes", "were", "running", "fast"]`.
- **Filter (`lowercase` + `snowball`):** 
  - Converting everything to lowercase: `["the", "quick", "brown", "foxes", "were", "running", "fast"]`.
  - Stripping filler words and stemming root words: `["quick", "brown", "fox", "run", "fast"]`.
- **Inverted Index:** Storing these clean root words in alphabetical filing drawers for instant search matching.

---

### (4) Code Examples

#### Building Full-Text Search Schemas in SurrealQL

```sql
DEFINE TABLE article SCHEMAFULL;
DEFINE FIELD title ON article TYPE string;
DEFINE FIELD content ON article TYPE string;

-- 1. Define a reusable English text search analyzer
DEFINE ANALYZER english_search
  TOKENIZERS class
  FILTERS lowercase, ascii, snowball(english);

-- 2. Create the search index referencing the analyzer
DEFINE INDEX idx_article_search ON article COLUMNS title, content
  SEARCH ANALYZER english_search BM25 HIGHLIGHTS;

-- 3. Populate sample records
CREATE article SET title = "SurrealDB Full-Text Engine", content = "Learn how to build fast search applications in Rust.";
CREATE article SET title = "Database Systems", content = "Running databases with advanced indexing capabilities.";
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to define an analyzer before referencing it in a 'DEFINE INDEX ... SEARCH' statement

**The mistake:** Executing `DEFINE INDEX idx_search ON post COLUMNS content SEARCH ANALYZER my_analyzer;` without first running `DEFINE ANALYZER my_analyzer`.

**Why it's wrong:** The search index compiler requires the analyzer definition to exist in the database catalog. Referencing a missing analyzer throws a schema validation error.

**Fix: Always execute `DEFINE ANALYZER` prior to creating `SEARCH` indexes:**

```sql
-- CORRECT ORDER
DEFINE ANALYZER my_analyzer TOKENIZERS class FILTERS lowercase;
DEFINE INDEX idx_search ON post COLUMNS content SEARCH ANALYZER my_analyzer;
```

---



### Mistake 2: Omitting Stemming Analyzers when Multi-Language Full-Text Search is Required

**The mistake:** Defining search index without specifying stemming analyzers (`snowball(english)`).

**Why it's wrong:** Without stemming analyzers, full-text searches for `'running'` will not match document text containing `'run'`. Add `snowball(english)` stemming.

*Incorrect:*
```surrealql
DEFINE INDEX search_idx ON TABLE doc FIELDS body SEARCH BM25; // No stemming
```

*Fix:*
```surrealql
DEFINE INDEX search_idx ON TABLE doc FIELDS body SEARCH BM25 ANALYZER blank, snowball(english);
```

### Mistake 3: Confusing Tokenizers (`blank`, `class`, `camel`, `punct`) with Filters (`lowercase`, `ascii`)

**The mistake:** Listing filters before tokenizers in `ANALYZER` parameter definitions.

**Why it's wrong:** SurrealDB analyzers process tokenization first (`blank`, `punct`), followed by token filtering (`lowercase`, `ascii`, `snowball`).

*Incorrect:*
```surrealql
-- Misordered analyzer pipeline
```

*Fix:*
```surrealql
DEFINE ANALYZER custom_analyzer TOKENIZERS blank FILTERS lowercase, ascii;
```

## 6. Practice Exercises

### Exercise 1: Search Pipeline Configuration

**Problem:** Write the SurrealQL statements to:
1. Create an analyzer named `tech_analyzer` that uses `class` tokenizing, `lowercase` filtering, and `snowball(english)` stemming.
2. Create a search index named `idx_kb_search` on the `knowledge_base` table covering the `title` and `body` fields using `tech_analyzer` and `BM25`.

**Expected output:**
```sql
DEFINE ANALYZER tech_analyzer TOKENIZERS class FILTERS lowercase, snowball(english);
DEFINE INDEX idx_kb_search ON knowledge_base COLUMNS title, body SEARCH ANALYZER tech_analyzer BM25;
```

> [!check]- Answer
> - Define the analyzer first with `DEFINE ANALYZER`.
> - Include `SEARCH ANALYZER tech_analyzer BM25` inside `DEFINE INDEX`.

---



### Exercise 2: Defining Custom Search Analyzer

**Problem:** Define custom analyzer `my_analyzer` with `blank` tokenizer and `lowercase`, `ascii` filters.

**Expected output:**
```text
DEFINE ANALYZER my_analyzer TOKENIZERS blank FILTERS lowercase, ascii;
```

> [!check]- Answer
> ```surrealql
> DEFINE ANALYZER my_analyzer TOKENIZERS blank FILTERS lowercase, ascii;
> ```
>
> **Explanation:** `DEFINE ANALYZER` configures custom tokenizers and filters for text indexing.

### Exercise 3: Using Custom Analyzer in Search Index

**Problem:** Attach custom analyzer `my_analyzer` to search index `doc_search` on `doc` table.

**Expected output:**
```text
DEFINE INDEX doc_search ON TABLE doc FIELDS content SEARCH BM25 ANALYZER my_analyzer;
```

> [!check]- Answer
> ```surrealql
> DEFINE INDEX doc_search ON TABLE doc FIELDS content SEARCH BM25 ANALYZER my_analyzer;
> ```
>
> **Explanation:** Custom analyzers normalize text tokens before inserting into BM25 search indexes.

## 7. Related Terms
- [DEFINE INDEX (Deep Dive)](define_index.md) — The parent index context.
- [`search::*` Functions & `@@` Operator](search_functions.md) — Querying full-text search.

---

## 8. Key Takeaways
- `DEFINE ANALYZER` configures tokenizers and filters for text processing.
- `DEFINE INDEX ... SEARCH ANALYZER` builds inverted indexes for full-text search.
- Tokenizers (`class`, `blank`, `camel`) split text strings into word tokens.
- Filters (`lowercase`, `ascii`, `snowball`) clean tokens and reduce words to roots.
- BM25 algorithm automatically ranks matched records by relevance scores.
