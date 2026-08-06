# Vector Search Index (ML/AI)

> **Level 7 — Indexes, Full-Text Search & Performance**
> The native vector database capability in SurrealDB that stores multi-dimensional numerical embeddings (`array<float>`) and indexes them using spatial algorithms (`MTREE` / `HNSW`) for AI, semantic search, and RAG applications.

---

## 1. Prerequisites

- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The parent index context.
- [Vector Index (Overview)](../level_04/vector_index.md) — Schema configuration overview.

---

## 2. Term Category


**Query Feature (K-nearest neighbors vector similarity search)**: - **Database Structure / Paradigm**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Traditional keyword search cannot capture meaning or semantic context:
- Searching for `"automobile"` will not match a document containing `"car"` unless explicit synonym rules are configured.
- Modern AI applications (LLMs, Retrieval-Augmented Generation / RAG, recommendation engines) convert text, images, and audio into high-dimensional numerical vectors (embeddings) where concepts with similar meanings sit close together in space.

In PostgreSQL, developers install `pgvector`. In MongoDB, developers use Atlas Vector Search.

We designed **Vector Search Indexing** in SurrealDB to provide built-in vector database functionality inside a multi-model engine. You store vector arrays directly inside standard record fields (`array<float>`) and index them using spatial tree algorithms (`MTREE`). You can run vector similarity searches right alongside graph traversals, document queries, and relational joins in a single database.

---

### (2) Vector Distance Formulas

SurrealDB supports three standard vector distance metrics:

1. **`COSINE` (Cosine Distance):** Measures the angle between two vectors. Standard choice for text embeddings (e.g. OpenAI, Cohere). Range: 0 (identical direction) to 2.
2. **`EUCLIDEAN` (L2 / Straight-Line Distance):** Measures the straight-line distance between two points in multi-dimensional space.
3. **`MANHATTAN` (L1 / Grid Distance):** Measures total distance along grid axes.

---

### (3) Reality Metaphor (The Multi-Dimensional Constellation)
Imagine stars mapped in space:
- **Keyword Search:** Searching stars by their catalog names ("Alpha Centauri").
- **Vector Search:** Mapping stars by 3D coordinates `[x, y, z]`.
  - Stars belonging to the same galaxy cluster sit close together in space.
  - When you discover a new star (search query vector), you calculate which existing stars sit closest to it in space, identifying its galaxy cluster instantly.

---

### (4) Code Examples

#### Building Vector Search Schemas in SurrealQL

```sql
DEFINE TABLE document SCHEMAFULL;
DEFINE FIELD title ON document TYPE string;
-- 1. Store embeddings as array of floats (e.g. 4-dimensional vector)
DEFINE FIELD embedding ON document TYPE array<float>;

-- 2. Define MTREE vector index with COSINE distance
DEFINE INDEX idx_doc_vector ON document COLUMNS embedding
  MTREE DIMENSION 4 DISTANCE COSINE;

-- 3. Insert records with vector embeddings
CREATE document SET title = "AI Systems", embedding = [0.1, 0.8, 0.2, 0.0];
CREATE document SET title = "Gardening Tips", embedding = [0.9, 0.1, 0.0, 0.8];

-- 4. Calculate vector distance against a query embedding
LET $search_vector = [0.12, 0.79, 0.21, 0.05];

SELECT 
  title,
  vector::distance::knn(embedding, $search_vector) AS distance
FROM document
ORDER BY distance ASC
LIMIT 5;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Inserting embedding arrays whose dimension length does not match the index DIMENSION parameter

**The mistake:** Defining `MTREE DIMENSION 1536` for OpenAI embeddings, but attempting to insert a 768-dimension vector from a smaller model.

**Why it's wrong:** Vector spatial indexing requires all coordinate arrays to have the exact same number of dimensions. Mismatched array lengths cause the write validator to reject the record insert.

**Fix: Ensure your embedding generation model output dimension matches the `DIMENSION` value specified in `DEFINE INDEX`:**

```sql
-- MUST MATCH MODEL OUTPUT (e.g. 1536 for OpenAI text-embedding-3-small)
DEFINE INDEX idx_vector ON doc COLUMNS embedding MTREE DIMENSION 1536 DISTANCE COSINE;
```

---



### Mistake 2: Querying Vector Search Without Index Dimension Matching

**The mistake:** Passing 1536-dimension embeddings into a vector search query on an index defined for 768 dimensions.

**Why it's wrong:** Vector similarity functions and indexes require matching vector dimensions. Mismatched dimension counts throw query evaluation errors.

*Incorrect:*
```surrealql
DEFINE INDEX vec_idx ON TABLE doc FIELDS embedding MTREE DIMENSION 768;
SELECT * FROM doc WHERE embedding <~10,1536~> $vec; // ❌ Dimension mismatch!
```

*Fix:*
```surrealql
DEFINE INDEX vec_idx ON TABLE doc FIELDS embedding MTREE DIMENSION 1536;
SELECT * FROM doc WHERE embedding <~10,1536~> $vec;
```

### Mistake 3: Confusing Vector Cosine Distance with Vector Dot Product Distance

**The mistake:** Using `vector::similarity::dot()` on un-normalized embeddings expecting cosine similarity results.

**Why it's wrong:** Dot product similarity matches cosine similarity ONLY when input vectors are normalized to unit length ($L_2 = 1$). Use `vector::similarity::cosine()` for general embeddings.

*Incorrect:*
```surrealql
SELECT *, vector::similarity::dot(embedding, $q) FROM doc; // Un-normalized vectors yield incorrect ranking
```

*Fix:*
```surrealql
SELECT *, vector::similarity::cosine(embedding, $q) AS score FROM doc ORDER BY score DESC;
```

## 5. Practice Exercises

### Exercise 1: HNSW Vector Index Creation

**Scenario:**
An AI application configures an HNSW vector index `idx_embedding` on table `document` for 4-dimensional embeddings using Cosine distance.

**Requirements:**
1. Define field `embedding` as `array<float>`.
2. Define index `idx_embedding ON TABLE document COLUMNS embedding HNSW DIMENSION 4 DIST COSINE`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE document SCHEMAFULL;
> DEFINE FIELD embedding ON TABLE document TYPE array<float>;
> 
> -- Define HNSW vector index
> DEFINE INDEX idx_embedding ON TABLE document COLUMNS embedding 
>     HNSW DIMENSION 4 DIST COSINE;
> ```
>
> #### Technical Explanation
>
> 1. `HNSW` (Hierarchical Navigable Small World) builds multi-layer graph structures for fast vector similarity searches.
> 2. `DIMENSION <n>` specifies vector embedding dimensionality.
> 3. `DIST COSINE` configures Cosine distance for text embedding comparisons.
> 
---

### Exercise 2: Executing KNN Vector Similarity Queries

**Scenario:**
Query the top 2 documents most semantically similar to query vector `[0.1, 0.2, 0.3, 0.4]` using vector search.

**Requirements:**
1. Execute `SELECT * FROM document WHERE embedding <|2,COSINE|> [0.1, 0.2, 0.3, 0.4]`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> CREATE document:d1 SET embedding = [0.1, 0.2, 0.3, 0.4];
> CREATE document:d2 SET embedding = [0.9, 0.8, 0.7, 0.6];
> 
> -- Vector K-Nearest Neighbor similarity search
> SELECT *, vector::distance::knn() AS dist 
> FROM document 
> WHERE embedding <|2,COSINE|> [0.1, 0.2, 0.3, 0.4];
> ```
>
> #### Technical Explanation
>
> 1. `<|k,DIST|>` executes fast K-Nearest Neighbor vector searches using HNSW graph indexes.
> 2. `vector::distance::knn()` projects calculated similarity distance values.
> 3. Enables RAG AI search applications directly inside SurrealDB.
> 
---

### Exercise 3: Filtering Vector Searches with Metadata Conditions

**Scenario:**
Combine vector similarity search with metadata filter `WHERE category = "tech"`.

**Requirements:**
1. Add `AND category = "tech"` to vector search query.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT * FROM document 
> WHERE embedding <|2,COSINE|> [0.1, 0.2, 0.3, 0.4] 
>   AND category = "tech";
> ```
>
> #### Technical Explanation
>
> 1. Combines HNSW vector graph searches with standard metadata column filters.
> 2. Prunes vector search candidates failing metadata conditions.
> 3. Provides hybrid AI search capabilities inside a single database query.
> 
---



## 6. Related Terms

- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The parent index context.
- [`DEFINE INDEX ... HNSW` (Approximate Vector Search)](hnsw_index.md) — HNSW algorithm.
- [Vector Index (Overview)](../level_04/vector_index.md) — Related concept: Vector Index (Overview).

---

## 7. Key Takeaways
- Vector search index enables AI semantic search, recommendations, and RAG in SurrealDB.
- Replaces dedicated vector databases (Pinecone, Weaviate) or PostgreSQL's `pgvector`.
- Embeddings are stored in standard `array<float>` fields.
- Index algorithms include `MTREE` (exact) and `HNSW` (approximate).
- Distance metrics include `COSINE`, `EUCLIDEAN`, and `MANHATTAN`.
- Order vector similarity queries by distance ascending (`ASC`) to get top matches.
