# `DEFINE INDEX ... HNSW` (Approximate Vector Search)

> **Level 7 — Indexes, Full-Text Search & Performance**
> The high-performance approximate nearest neighbor (ANN) vector indexing algorithm in SurrealDB (Hierarchical Navigable Small World), designed to scale vector similarity searches across millions of records with sub-millisecond query latency.

---

## 1. Prerequisites

- [Vector Search Index (ML/AI)](vector_search.md) — Vector search fundamentals.
- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The parent index context.
- [Vector Index (Overview)](../level_04/vector_index.md) — Vector index architecture overview.

---

## 2. Term Category


**Performance / Operations (hierarchical navigable small world vector index)**: - **Database Command / Tool**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
As vector databases grow from thousands to millions of records, calculating exact vector distances (`MTREE`) across all vectors becomes slow:
- An exact search compares the query vector against candidate nodes across tree levels.
- For massive datasets (1,000,000+ high-dimensional vectors), exact distance calculations consume significant memory and CPU time.

To solve this scaling bottleneck, researchers developed **HNSW (Hierarchical Navigable Small World)** graphs:
- HNSW builds a multi-layer graph network where upper layers act as express highways and lower layers provide fine-grained local connections.
- Instead of computing 100% exact mathematical distances across all nodes, HNSW navigates the graph layers to return **Approximate Nearest Neighbors (ANN)** in sub-millisecond time with ~95%+ recall accuracy.

We implemented **`HNSW` Indexing** in SurrealDB to support large-scale AI applications. By choosing `HNSW` over `MTREE` in `DEFINE INDEX`, you trade a tiny fraction of mathematical precision for massive query speedups at scale.

---

### (2) Comparing MTREE vs. HNSW Algorithms

| Dimension | `MTREE` (Multi-Way Tree) | `HNSW` (Hierarchical Graph) |
| :--- | :--- | :--- |
| **Search Accuracy** | Exact 100% Nearest Neighbors. | Approximate (~95-99% Recall Accuracy). |
| **Query Latency** | Fast for small/medium datasets. | **Sub-millisecond** at multi-million scale. |
| **Memory Footprint** | Lower RAM consumption. | Higher RAM consumption (builds graph layers). |
| **Best Use Case** | Small-to-medium collections (< 100k items). | Large-scale production AI (1M+ vectors). |

---

### (3) Reality Metaphor (Highway Express Lanes)
Imagine navigating to a specific street address in a huge country:
- **`MTREE` (Local Roads Only):** Driving down local streets, stopping at every intersection to measure exact mileage to your destination. 
- **`HNSW` (Multi-Layer Highway System):**
  - **Top Layer (Express Highway):** You take the interstate highway across states, covering massive distances instantly.
  - **Middle Layer (Regional Highway):** You exit onto a regional highway near your target city.
  - **Bottom Layer (Local Neighborhood):** You pull onto local streets to find a house that is 99% guaranteed to be your target.

---

### (4) Code Examples

#### Creating HNSW Vector Indexes in SurrealQL

```sql
DEFINE TABLE embedding_store SCHEMAFULL;
DEFINE FIELD vector ON embedding_store TYPE array<float>;

-- 1. Define an HNSW Vector Index for 1536-dimensional embeddings
DEFINE INDEX idx_hnsw_vec ON embedding_store COLUMNS vector
  HNSW DIMENSION 1536 DISTANCE COSINE;

-- 2. Querying the HNSW index (Same vector distance query syntax!)
LET $query_vector = [0.01, 0.05, /* ... 1534 float values ... */];

SELECT 
  id,
  vector::distance::knn(vector, $query_vector) AS score
FROM embedding_store
ORDER BY score ASC
LIMIT 10;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using HNSW indexes for small datasets where RAM is restricted, wasting memory resources

**The mistake:** Configuring `HNSW` indexes on small lookup tables containing only 500 vectors.

**Why it's wrong:** HNSW constructs multi-layer graph node links in memory. For small datasets (< 50,000 vectors), the RAM overhead of HNSW graphs yields negligible speed improvements compared to `MTREE`.

**Fix: Use `MTREE` for small-to-medium datasets (< 100,000 items) and reserve `HNSW` for multi-million vector datasets:**

```sql
-- For small/medium datasets (< 100k vectors)
DEFINE INDEX idx_vec ON doc COLUMNS vector MTREE DIMENSION 1536 DISTANCE COSINE;

-- For large production datasets (1M+ vectors)
DEFINE INDEX idx_vec ON doc COLUMNS vector HNSW DIMENSION 1536 DISTANCE COSINE;
```

---



### Mistake 2: Creating HNSW Vector Indexes Without Specifying `DIMENSION`

**The mistake:** Defining `DEFINE INDEX vec_idx ON TABLE doc FIELDS embedding HNSW;` without dimension count.

**Why it's wrong:** HNSW vector indexes require explicit vector dimensions (e.g. `DIMENSION 1536`) to configure graph layer node buffers.

*Incorrect:*
```surrealql
DEFINE INDEX vec_idx ON TABLE doc FIELDS embedding HNSW; // ❌ Missing DIMENSION parameter!
```

*Fix:*
```surrealql
DEFINE INDEX vec_idx ON TABLE doc FIELDS embedding HNSW DIMENSION 1536 DIST COSINE;
```

### Mistake 3: Mismatched Distance Metric Specifications

**The mistake:** Configuring `DIST EUCLIDEAN` on embeddings generated by Cosine-based AI models.

**Why it's wrong:** Matching distance metrics (`COSINE`, `EUCLIDEAN`, `MANHATTAN`) to model specifications is essential for vector retrieval accuracy.

*Incorrect:*
```surrealql
DEFINE INDEX vec_idx ON TABLE doc FIELDS embedding HNSW DIMENSION 1536 DIST EUCLIDEAN;
```

*Fix:*
```surrealql
DEFINE INDEX vec_idx ON TABLE doc FIELDS embedding HNSW DIMENSION 1536 DIST COSINE;
```

## 5. Practice Exercises

### Exercise 1: Defining HNSW Vector Search Indexes

**Scenario:**
An AI knowledge base configures an HNSW vector index `idx_doc_vector` for 4-dimensional vector embeddings using Cosine similarity.

**Requirements:**
1. Define field `embedding` as `array<float>`.
2. Define index `idx_doc_vector ON TABLE doc COLUMNS embedding HNSW DIMENSION 4 DIST COSINE`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE TABLE doc SCHEMAFULL;
> DEFINE FIELD embedding ON TABLE doc TYPE array<float>;
> 
> -- Define HNSW vector index
> DEFINE INDEX idx_doc_vector ON TABLE doc COLUMNS embedding 
>     HNSW DIMENSION 4 DIST COSINE;
> ```
>
> #### Technical Explanation
>
> 1. `HNSW` (Hierarchical Navigable Small World) builds multi-layer graph structures for fast vector similarity searches.
> 2. `DIMENSION <n>` specifies vector embedding dimensionality.
> 3. `DIST COSINE` configures Cosine distance for text embedding comparisons.

---

### Exercise 2: Tuning HNSW Graph Search Parameters

**Scenario:**
Configure HNSW graph parameters `M` (max connections per node) and `EFC` (construction search depth) for higher search accuracy.

**Requirements:**
1. Define HNSW index setting `M 16 EFC 100`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> DEFINE INDEX idx_doc_vector ON TABLE doc COLUMNS embedding 
>     HNSW DIMENSION 4 DIST COSINE M 16 EFC 100;
> ```
>
> #### Technical Explanation
>
> 1. `M` controls the maximum number of bi-directional link connections per HNSW graph node.
> 2. `EFC` (efConstruction) controls candidate queue depth during index construction.
> 3. Higher `M` and `EFC` values increase search recall accuracy at the cost of higher index build time.

---

### Exercise 3: K-Nearest Neighbor Vector Queries

**Scenario:**
Query the top 3 documents most semantically similar to query vector `[0.1, 0.2, 0.3, 0.4]` using the KNN vector operator `<|3,COSINE|>`.

**Requirements:**
1. Execute `SELECT * FROM doc WHERE embedding <|3,COSINE|> [0.1, 0.2, 0.3, 0.4]`.

> [!check]- Answer
>
> #### Implementation
>
> ```surrealql
> SELECT *, vector::distance::knn() AS dist 
> FROM doc 
> WHERE embedding <|3,COSINE|> [0.1, 0.2, 0.3, 0.4];
> ```
>
> #### Technical Explanation
>
> 1. `<|k,DIST|>` executes fast K-Nearest Neighbor vector searches using HNSW graph indexes.
> 2. `vector::distance::knn()` projects calculated similarity distance values.
> 3. Enables RAG AI search applications directly inside SurrealDB.

---



## 6. Related Terms

- [Vector Search Index (ML/AI)](vector_search.md) — Vector search fundamentals.
- [`DEFINE INDEX` (Deep Dive)](define_index.md) — The parent index context.
- [Vector Index (Overview)](../level_04/vector_index.md) — Related concept: Vector Index (Overview).

---

## 7. Key Takeaways
- `HNSW` builds multi-layer navigable small world graphs for approximate vector search.
- Designed for scaling vector similarity queries across millions of records.
- Delivers sub-millisecond query latency by trading a tiny fraction of accuracy.
- `MTREE` provides exact nearest neighbors; `HNSW` provides high-speed approximate neighbors.
- Requires higher RAM memory overhead to maintain graph layers in memory.
- Identical query syntax (`vector::distance::knn()`) works across both index types.
