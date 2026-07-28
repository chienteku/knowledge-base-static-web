# `DEFINE INDEX ... HNSW` (Approximate Vector Search)

> **Level 7 — Indexes, Full-Text Search & Performance**
> The high-performance approximate nearest neighbor (ANN) vector indexing algorithm in SurrealDB (Hierarchical Navigable Small World), designed to scale vector similarity searches across millions of records with sub-millisecond query latency.

---

## 1. Prerequisites
- [Vector Search Index (ML/AI)](vector_search.md) — Vector search fundamentals.
- [DEFINE INDEX (Deep Dive)](define_index.md) — The parent index context.

---

## 2. Term Category
- **Database Command / Tool**

---

## 3. Environment Context
- **SurrealDB Core** (Processed by the HNSW graph engine. Constructs multi-layer proximity graphs in memory to route nearest-neighbor queries efficiently).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Algorithm Trade-off Audit

**Problem:** You are building an enterprise AI search system containing 5,000,000 document embeddings.
Queries must respond in under 5 milliseconds.
Write the SurrealQL statement to define an `HNSW` vector index named `idx_large_search` on table `docs`, field `vec`, using `1536` dimensions and `COSINE` distance.

**Expected output:**
> [!check]- Answer
> ```sql
> DEFINE INDEX idx_large_search ON docs COLUMNS vec HNSW DIMENSION 1536 DISTANCE COSINE;
> ```
> - Replace `MTREE` with `HNSW` in the definition.
> - Specify dimensions (`1536`) and distance metric (`COSINE`).

---



### Exercise 2: Defining HNSW Vector Index

**Problem:** Define HNSW index `vector_idx` on `article` for 768-dim `embedding` field using `COSINE` distance.

**Expected output:**
> [!check]- Answer
> ```text
> DEFINE INDEX vector_idx ON TABLE article FIELDS embedding HNSW DIMENSION 768 DIST COSINE;
> ```
> ```surrealql
> DEFINE INDEX vector_idx ON TABLE article FIELDS embedding HNSW DIMENSION 768 DIST COSINE;
> ```
>
> **Explanation:** `HNSW` vector indexing powers fast approximate k-nearest neighbor (k-NN) vector searches.

---

### Exercise 3: HNSW Distance Metric Options

**Problem:** List 3 vector distance metrics supported in SurrealDB (`COSINE`, `EUCLIDEAN`, `MANHATTAN`).

**Expected output:**
> [!check]- Answer
> ```text
> COSINE, EUCLIDEAN, MANHATTAN
> ```
> ```text
> COSINE, EUCLIDEAN, MANHATTAN
> ```
>
> **Explanation:** Vector distance metrics specify similarity scoring algorithms.

## 7. Related Terms
- [Vector Search Index (ML/AI)](vector_search.md) — Vector search fundamentals.
- [DEFINE INDEX (Deep Dive)](define_index.md) — The parent index context.

---

## 8. Key Takeaways
- `HNSW` builds multi-layer navigable small world graphs for approximate vector search.
- Designed for scaling vector similarity queries across millions of records.
- Delivers sub-millisecond query latency by trading a tiny fraction of accuracy.
- `MTREE` provides exact nearest neighbors; `HNSW` provides high-speed approximate neighbors.
- Requires higher RAM memory overhead to maintain graph layers in memory.
- Identical query syntax (`vector::distance::knn()`) works across both index types.
