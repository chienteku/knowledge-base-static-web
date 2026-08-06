# Search Index & `DEFINE ANALYZER`

> **Level 7 — Indexes, Full-Text Search & Performance**
> The full-text search engine architecture in SurrealDB, combining text processing rules (`DEFINE ANALYZER`) with specialized full-text search indexes (`DEFINE INDEX ... SEARCH`) to calculate BM25 relevance scores.

---

## 1. Prerequisites

- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The parent index context.
- [`SEARCH` Index (Full-Text Search)](../level_04/search_index.md) — Schema configuration overview.

---

## 2. Term Category


**Performance / Operations (full-text search text analyzer configuration)**: - **Database Command / Tool**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Custom Text Analyzer Definition

**Scenario:**
Define a custom text analyzer `snowball_en` using lowercase tokenization, English stemming, and snowball filtering.

**Requirements:**
1. Write `DEFINE ANALYZER snowball_en TOKENIZERS blank, class FILTERS lowercase, snowball(english)`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> -- Define custom full-text search analyzer
> DEFINE ANALYZER snowball_en 
>     TOKENIZERS blank, class 
>     FILTERS lowercase, snowball(english);
> ```
>
> #### Technical Explanation
>
> 1. `DEFINE ANALYZER` configures text processing pipelines for full-text search indexes.
> 2. `TOKENIZERS` breaks raw text into individual term tokens (e.g. `blank` splits on whitespace).
> 3. `FILTERS` normalizes tokens (e.g. `lowercase`, `snowball(english)` stemming).
> 
---

### Exercise 2: Attaching Custom Analyzers to Search Indexes

**Scenario:**
Create a full-text search index `idx_article_content` on table `article` using custom analyzer `snowball_en`.

**Requirements:**
1. Write `DEFINE INDEX idx_article_content ON TABLE article COLUMNS content SEARCH ANALYZER snowball_en BM25`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE INDEX idx_article_content ON TABLE article 
>     COLUMNS content 
>     SEARCH ANALYZER snowball_en BM25;
> ```
>
> #### Technical Explanation
>
> 1. `SEARCH ANALYZER <name>` binds custom text analyzers to search index definitions.
> 2. Processes document text through configured tokenizers and filters before storing search tokens.
> 3. Enables stemmed search matching (e.g. searching "running" matches "run").
> 
---

### Exercise 3: Testing Analyzer Tokenization Output

**Scenario:**
Test how custom analyzer `snowball_en` tokenizes raw string `"Running Databases Quickly"`.

**Requirements:**
1. Execute `SELECT * FROM parse::analyzer("snowball_en", "Running Databases Quickly")`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT * FROM parse::analyzer("snowball_en", "Running Databases Quickly");
> -- Output token array: ["run", "databas", "quickli"]
> ```
>
> #### Technical Explanation
>
> 1. `parse::analyzer(analyzer_name, text)` tests analyzer tokenization rules directly.
> 2. Displays generated search tokens after applying stemming and lowercase filters.
> 3. Helps developers debug full-text search tokenization pipelines.
> 
---



## 6. Related Terms

- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The parent index context.
- [`search::*` Functions & `@@` Operator](search_functions.md) — Querying full-text search.
- [`SEARCH` Index (Full-Text Search)](../level_04/search_index.md) — Related concept: `SEARCH` Index (Full-Text Search).

---

## 7. Key Takeaways
- `DEFINE ANALYZER` configures tokenizers and filters for text processing.
- `DEFINE INDEX ... SEARCH ANALYZER` builds inverted indexes for full-text search.
- Tokenizers (`class`, `blank`, `camel`) split text strings into word tokens.
- Filters (`lowercase`, `ascii`, `snowball`) clean tokens and reduce words to roots.
- BM25 algorithm automatically ranks matched records by relevance scores.
