# SurrealDB Terms: Zero to Hero

A comprehensive, progressive curriculum for mastering SurrealDB, structured from foundational concepts (what _is_ a multi-model database?) to advanced production architecture (graph traversal, live queries, built-in auth, deployment). Designed for a junior full-stack developer who has already completed the PostgreSQL and MongoDB curricula and is ready to learn a database that unifies both paradigms.

---

## Level 1 — What Is SurrealDB?

> The foundations: why SurrealDB exists, how it differs from PostgreSQL and MongoDB, and the core vocabulary.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 1 | **Multi-Model Database** | `multi_model_database.md` | A database that natively supports multiple data models (relational, document, graph, key-value) within a single engine — eliminating the need to run separate databases for different data patterns. |
| 2 | **SurrealDB** | `surrealdb.md` | An open-source, multi-model database written in Rust that combines the structured querying of SQL (PostgreSQL), the schema flexibility of document stores (MongoDB), and the relationship traversal of graph databases (Neo4j) into a single system with its own query language (SurrealQL). |
| 3 | **SurrealQL** | `surrealql.md` | SurrealDB's query language — intentionally SQL-like for familiarity, but extended with document nesting, record links, graph traversal operators, and real-time subscriptions that have no equivalent in standard SQL. |
| 4 | **Record** | `record.md` | The fundamental unit of data in SurrealDB — equivalent to a "row" in PostgreSQL or a "document" in MongoDB, but uniquely identified by a `table:id` composite key (e.g., `user:tobie`). |
| 5 | **Table** | `table.md` | A collection of records in SurrealDB — similar to a PostgreSQL table or MongoDB collection, but supports both strict schema enforcement (`SCHEMAFULL`) and flexible schemas (`SCHEMALESS`). |
| 6 | **Record ID (`table:id`)** | `record_id.md` | SurrealDB's unique identifier format where every record is addressed as `table:id` (e.g., `user:john`, `post:ulid()`). Unlike PostgreSQL's separate `id` column or MongoDB's `_id` field, the table name and ID are fused into a single, globally unique reference. |
| 7 | **Namespace & Database** | `namespace_database.md` | SurrealDB's two-level organizational hierarchy: a **Namespace** groups related databases (multi-tenant isolation), and a **Database** groups related tables — equivalent to PostgreSQL's cluster → database → schema hierarchy. |
| 8 | **`SCHEMAFULL` vs `SCHEMALESS`** | `schemafull_schemaless.md` | The table-level toggle that controls schema enforcement: `SCHEMAFULL` rejects any field not explicitly defined (like PostgreSQL), while `SCHEMALESS` accepts any field structure (like MongoDB). This is set per-table, so you can mix both modes in the same database. |
| 9 | **SurrealDB Server (`surreal start`)** | `surreal_start.md` | The SurrealDB server process and CLI command to start it — supporting multiple storage backends (in-memory, file-based RocksDB, TiKV for distributed) and connection modes (HTTP, WebSocket). |
| 10 | **Connection URI & Protocols (`ws://`, `wss://`, `http://`)** | `connection_uri.md` | The URI format used to connect to a SurrealDB instance: `ws://localhost:8000/rpc` for WebSocket (persistent, required for live queries) or `http://localhost:8000` for HTTP (stateless). Equivalent to PostgreSQL's `postgresql://` connection string and MongoDB's `mongodb://` URI — understanding this is prerequisite to using any client tool or SDK. |
| 11 | **Surrealist (Web IDE)** | `surrealist.md` | SurrealDB's official web-based IDE for writing SurrealQL queries, exploring data, designing schemas, and managing databases visually — serves both as a learning tool (like pgAdmin) and a production management interface. |
| 12 | **SurrealDB CLI (`surreal sql`)** | `surreal_cli.md` | The command-line interface for connecting to a SurrealDB instance and executing SurrealQL queries interactively — equivalent to PostgreSQL's `psql` or MongoDB's `mongosh`. |
| 13 | **Connection Credentials (`USE NS ... DB ...`)** | `connection_credentials.md` | The SurrealQL commands and connection parameters (`namespace`, `database`, `username`, `password`) required to authenticate and select a target namespace/database — equivalent to PostgreSQL's connection string or MongoDB's connection URI. |
| 14 | **SurrealDB vs PostgreSQL vs MongoDB** | `surrealdb_vs_postgres_mongo.md` | A direct three-way comparison: when SurrealDB's multi-model approach excels (rapid prototyping, graph relationships, real-time apps, direct browser queries), when PostgreSQL is better (complex transactions, mature ecosystem, enterprise compliance), and when MongoDB is better (massive horizontal scaling, established document patterns, Atlas ecosystem). |
| 15 | **Storage Backends (Memory, RocksDB, TiKV)** | `storage_backends.md` | SurrealDB's pluggable storage engines: `memory` for testing (data lost on restart), `rocksdb` / `surrealkv` for single-node persistence, and `tikv` for distributed, horizontally-scalable production deployments — choosing the right backend is the first deployment decision. |

---

## Level 2 — Data Types & Record Structure

> The building blocks: what types of data SurrealDB records can hold, and how they compare to PostgreSQL and MongoDB types.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 16 | **Data Types (Overview)** | `data_types.md` | SurrealDB's type system: `string`, `int`, `float`, `decimal`, `bool`, `datetime`, `duration`, `object`, `array`, `set`, `record`, `geometry`, `bytes`, `uuid`, `null`, `none` — a superset that combines PostgreSQL's strict typing with MongoDB's flexible structures. |
| 17 | **`string`** | `string.md` | UTF-8 text data — equivalent to PostgreSQL's `TEXT` and MongoDB's String BSON type. |
| 18 | **`int` / `float` / `decimal`** | `number_types.md` | Numeric types: `int` for 64-bit integers, `float` for 64-bit IEEE 754 doubles, `decimal` for arbitrary-precision exact decimals — equivalent to PostgreSQL's `BIGINT` / `DOUBLE PRECISION` / `NUMERIC` and MongoDB's `Int64` / `Double` / `Decimal128`. |
| 19 | **`bool`** | `bool.md` | A `true` or `false` value — identical to PostgreSQL's `BOOLEAN` and MongoDB's Boolean. |
| 20 | **`datetime` / `duration`** | `datetime_duration.md` | `datetime` stores ISO 8601 timestamps with timezone awareness; `duration` stores time spans (e.g., `1h30m`, `7d`). Duration arithmetic is built-in — `datetime + duration` returns a new datetime. No PostgreSQL `INTERVAL` parsing headaches. |
| 21 | **`null` vs `NONE`** | `null_none.md` | SurrealDB distinguishes between `null` (field exists with no value — like SQL `NULL`) and `NONE` (field does not exist at all — like a missing field in MongoDB). This distinction solves the "is it null or is it missing?" ambiguity that plagues both PostgreSQL (`NULL`) and MongoDB (`null` vs absent field). To declare a field that can hold `NONE`, use the `option<T>` type wrapper (covered in Level 4). |
| 22 | **`object`** | `object_type.md` | A nested key-value structure within a record — equivalent to a JSONB object in PostgreSQL or an embedded document in MongoDB. Enables document-style nesting within SurrealDB's relational framework. |
| 23 | **`array`** | `array_type.md` | An ordered list of values of any type — equivalent to PostgreSQL's `ARRAY` type or MongoDB's Array BSON type. Supports nested arrays and arrays of objects. |
| 24 | **`set`** | `set_type.md` | An unordered collection of **unique** values — unlike `array` which allows duplicates and preserves order. `set<string>` guarantees uniqueness automatically (equivalent to MongoDB's `$addToSet` behavior, but as a native type). Unique to SurrealDB — neither PostgreSQL nor MongoDB has a native `set` type. |
| 25 | **`record` (Record Link Type)** | `record_link_type.md` | A data type that stores a reference to another record using the `table:id` syntax (e.g., `record<user>`) — SurrealDB's replacement for PostgreSQL's foreign keys and MongoDB's ObjectId references. Record links are automatically validated and can be directly traversed in queries without JOINs. |
| 26 | **`geometry` (GeoJSON)** | `geometry_type.md` | A data type for storing geographic data (Point, LineString, Polygon, MultiPoint, etc.) in GeoJSON format — with built-in geospatial functions and indexing (equivalent to PostGIS in PostgreSQL or `2dsphere` in MongoDB). |
| 27 | **`uuid`** | `uuid_type.md` | A data type for storing UUIDs — can be generated with `uuid()` or `rand::uuid()`, commonly used as record IDs for globally unique identification. |
| 28 | **ID Generation Strategies (`ulid()`, `uuid()`, `rand::*`, String, Numeric)** | `id_generation.md` | The different ways to generate record IDs in SurrealDB: human-readable strings (`user:tobie`), auto-incrementing-like numerics, ULIDs (`ulid()` — time-sortable), UUIDs (`uuid()`), and random values — each with different trade-offs for readability, sortability, and uniqueness. |
| 29 | **Type Casting & Coercion** | `type_casting.md` | How SurrealDB converts between types: explicit casting with `<type>` syntax (e.g., `<int> "42"`), implicit coercion rules, and the `type::*` family of conversion functions — equivalent to PostgreSQL's `CAST`/`::` and MongoDB's type casting in aggregation. |

---

## Level 3 — CRUD Operations in SurrealQL

> Create, Read, Update, Delete — using SurrealDB's SQL-like syntax with document and record link extensions.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 30 | **`CREATE`** | `create.md` | The SurrealQL statement to insert new records — equivalent to PostgreSQL's `INSERT INTO`, but with the unique ability to set the record ID inline (`CREATE user:tobie SET name = 'Tobie'`). |
| 31 | **`CREATE` with Content (`SET` vs `CONTENT`)** | `create_set_content.md` | Two syntax styles for creating records: `SET` assigns fields individually (SQL-like: `SET name = 'Tobie', age = 30`), while `CONTENT` accepts a full JSON object (`CONTENT { name: 'Tobie', age: 30 }`) — choose `SET` for simple records, `CONTENT` for complex nested structures. |
| 32 | **`INSERT`** | `insert.md` | SurrealDB's PostgreSQL-compatible insert syntax (`INSERT INTO user (name, age) VALUES ('Tobie', 30)`) — supports multi-row inserts and `ON DUPLICATE KEY UPDATE` for upserts. Exists alongside `CREATE` for SQL familiarity. |
| 33 | **`INSERT ... ON DUPLICATE KEY UPDATE`** | `insert_on_duplicate.md` | The upsert syntax on `INSERT` that updates specified fields when a record with the same ID already exists — `INSERT INTO user { id: user:tobie, name: 'Tobie', login_count: 1 } ON DUPLICATE KEY UPDATE login_count += 1`. This is SurrealDB's SQL-compatible upsert (like PostgreSQL's `ON CONFLICT`), distinct from the standalone `UPSERT` statement which is SurrealDB-native. |
| 34 | **`SELECT`** | `select.md` | The SurrealQL statement to retrieve records — familiar SQL syntax (`SELECT * FROM user WHERE age > 18`) extended with record link traversal, nested field access, and graph operators. |
| 35 | **`SELECT VALUE` (Single Field Extraction)** | `select_value.md` | A `SELECT` variant that returns a flat array of values instead of an array of objects — `SELECT VALUE name FROM user` returns `['Alice', 'Bob']` instead of `[{name: 'Alice'}, {name: 'Bob'}]`. Essential for extracting a single field's values for use in subqueries, `IN` clauses, or application logic. |
| 36 | **`SELECT` with Record Link Fetching (`FETCH`)** | `select_fetch.md` | The `FETCH` clause that automatically resolves record links into their full record data inline — SurrealDB's alternative to JOINs (PostgreSQL) and `$lookup` (MongoDB). Instead of a manual JOIN, you just fetch the linked record. |
| 37 | **`WHERE` Clause** | `where.md` | A filter clause using familiar SQL syntax with extensions — supports dot notation into nested objects (`WHERE address.city = 'London'`), array contains operations, and type-aware comparisons. |
| 38 | **Operators in SurrealQL** | `operators.md` | Comparison (`=`, `!=`, `>`, `<`, `>=`, `<=`), logical (`AND`, `OR`, `NOT`), containment (`CONTAINS`, `CONTAINSALL`, `CONTAINSANY`, `CONTAINSNONE`, `INSIDE`), string matching (`~` fuzzy, `?~` regex), and mathematical operators — a superset of both SQL and MongoDB operators. |
| 39 | **`ORDER BY` / `LIMIT` / `START`** | `order_limit_start.md` | Clauses for sorting, limiting, and paginating results — `ORDER BY` and `LIMIT` are identical to PostgreSQL; `START` replaces `OFFSET` (e.g., `LIMIT 10 START 20`). |
| 40 | **`GROUP BY` / `GROUP ALL`** | `group_by.md` | Grouping clauses for aggregation: `GROUP BY` works like PostgreSQL's `GROUP BY`; `GROUP ALL` groups the entire result set into a single aggregate row (equivalent to omitting `GROUP BY` in SQL, but explicit). |
| 41 | **Aggregate Functions (`count()`, `math::sum()`, `math::mean()`, `math::min()`, `math::max()`, `array::group()`)** | `aggregate_functions.md` | Built-in functions for aggregation — `count()` counts records, `math::*` functions compute numeric aggregates, `array::group()` collects values into an array (like MongoDB's `$push` accumulator). |
| 42 | **`UPDATE`** | `update.md` | The SurrealQL statement to modify existing records — supports `SET` (modify specific fields), `CONTENT` (replace entire record), `MERGE` (deep-merge an object), and `PATCH` (JSON Patch operations). |
| 43 | **`UPDATE` Strategies (`SET` / `CONTENT` / `MERGE` / `PATCH`)** | `update_strategies.md` | The four update modes: `SET` modifies individual fields (like PostgreSQL's `UPDATE SET`), `CONTENT` replaces the full record (like MongoDB's `replaceOne`), `MERGE` **deep-merges** a partial object recursively into the existing record (deeper than MongoDB's `$set` which only does shallow merges), and `PATCH` applies JSON Patch operations (RFC 6902) — the most flexible update system of any database. |
| 44 | **`DELETE`** | `delete.md` | The SurrealQL statement to remove records — supports `WHERE` filtering and `RETURN BEFORE` to see what was deleted (equivalent to PostgreSQL's `DELETE ... RETURNING`). |
| 45 | **`RETURN` Clause (`RETURN NONE / BEFORE / AFTER / DIFF`)** | `return_clause.md` | A clause available on `CREATE`, `UPDATE`, and `DELETE` that controls what the statement returns: `NONE` (nothing), `BEFORE` (pre-change state), `AFTER` (post-change state, default), `DIFF` (JSON Patch diff) — far more flexible than PostgreSQL's `RETURNING` or MongoDB's `findOneAndUpdate({ returnDocument })`. |
| 46 | **`UPSERT`** | `upsert.md` | The SurrealQL statement that creates a record if it doesn't exist or updates it if it does — a first-class keyword (not a modifier like PostgreSQL's `ON CONFLICT` or MongoDB's `upsert: true`). |
| 47 | **`IF NOT EXISTS` / `IF EXISTS`** | `if_not_exists.md` | Conditional creation/deletion guards: `CREATE user:tobie IF NOT EXISTS` prevents duplicate creation errors; `DELETE user:tobie IF EXISTS` prevents "not found" errors — eliminating the need for existence-checking queries before writes. |
| 48 | **`INFO FOR` (Introspection)** | `info_for.md` | SurrealQL commands to inspect database structure: `INFO FOR NS`, `INFO FOR DB`, `INFO FOR TABLE user` — equivalent to PostgreSQL's `\d` psql commands or MongoDB's `db.collection.getIndexes()`. Shows table definitions, fields, indexes, and permissions. |

---

## Level 4 — Schema Definition & Field Constraints

> Defining table structure, field types, constraints, and computed fields — SurrealDB's approach to data integrity.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 49 | **`DEFINE TABLE`** | `define_table.md` | The SurrealQL statement to create and configure a table — sets schema mode (`SCHEMAFULL`/`SCHEMALESS`), permissions, and changefeeds. |
| 50 | **`DEFINE FIELD`** | `define_field.md` | The SurrealQL statement to define a field on a table — specifying type, default value, assertions, and permissions. |
| 51 | **Field Assertions (`ASSERT`)** | `field_assertions.md` | Inline constraints that evaluate field values on write (e.g. `ASSERT $value != NONE`). |
| 52 | **Field Attributes (`DEFAULT`, `READONLY`, `VALUE`)** | `field_attributes.md` | Attribute clauses for defaults, computed values, and immutability. |
| 53 | **`REMOVE` Statement** | `remove_statement.md` | The SurrealQL statement to remove schema objects (`REMOVE TABLE`, `REMOVE FIELD`, `REMOVE INDEX`). |
| 54 | **Schemafull Validation** | `schemafull_validation.md` | Strict schema mode enforcement in SurrealDB. |
| 55 | **`option<T>` (Optional Fields)** | `option_type.md` | Nullable type wrapper marking fields as optional. |
| 56 | **Idempotent Migrations** | `idempotent_migrations.md` | Writing idempotent setup and migration scripts using `OVERWRITE`. |
| 57 | **`DEFINE INDEX`** | `define_index.md` | Creating indexes for query acceleration. |
| 58 | **Unique Index** | `unique_index.md` | Enforcing unique field constraints via indexes. |
| 59 | **Search Index** | `search_index.md` | Full-text search indexing in SurrealDB. |
| 60 | **Vector Index** | `vector_index.md` | HNSW vector indexing for similarity search. |
| 61 | **`DEFINE SCOPE`** | `define_scope.md` | Scope authentication definitions. |
| 62 | **`DEFINE EVENT`** | `define_event.md` | Event handlers triggered on database changes. |
| 63 | **`SHOW CHANGES`** | `show_changes.md` | Inspecting changefeeds and event logs. |

---

## Level 5 — Record Links & Relationships

> SurrealDB's killer feature: native record links that replace foreign keys, ObjectId references, AND junction tables.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 64 | **Record Link Concept** | `record_link_concept.md` | Storing record references directly using record IDs (`table:id`). |
| 65 | **`RELATE` Statement** | `relate.md` | Creating graph edges between records in SurrealQL. |
| 66 | **Graph Overview** | `graph_overview.md` | Introduction to SurrealDB graph capabilities. |
| 67 | **Edge Properties** | `edge_properties.md` | Storing metadata attributes directly on graph edges. |
| 68 | **Graph Arrows (`->`, `<-`, `<->`)** | `graph_arrows.md` | Directional graph traversal operators in queries. |
| 69 | **Graph Filtering** | `graph_filtering.md` | Filtering graph traversals with conditional `WHERE` clauses. |
| 70 | **Deep Graph Traversal** | `deep_graph_traversal.md` | Multi-hop graph relationship traversals. |
| 71 | **Bidirectional Queries** | `bidirectional_queries.md` | Querying graph relationships in both incoming and outgoing directions. |
| 72 | **Parallel Edge Traversals** | `parallel_edge_traversals.md` | Navigating multiple edge paths concurrently. |
| 73 | **Graph vs Joins** | `graph_vs_joins.md` | Comparing graph traversal performance against SQL JOINs. |

---

## Level 6 — Advanced Querying

> Beyond basic CRUD: subqueries, parameters, built-in functions, and SurrealDB-specific query features.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 76 | **Subqueries** | `subqueries.md` | Embedding a `SELECT` inside another query — `SELECT * FROM user WHERE id IN (SELECT author FROM post WHERE published = true)`. Works like PostgreSQL subqueries but also supports record-link-aware expressions. |
| 77 | **Parameters (`$param`)** | `parameters.md` | Named placeholders for values in SurrealQL queries — `LET $min_age = 18; SELECT * FROM user WHERE age >= $min_age`. Essential for reusable queries, security (preventing injection), and SDK integration. |
| 78 | **`LET` Statement** | `let_statement.md` | Defining query-scoped variables — `LET $admin = (SELECT * FROM user WHERE role = 'admin' LIMIT 1)`. Variables persist for the duration of the query session (or transaction) and can be used in subsequent statements. |
| 79 | **`SPLIT` Clause** | `split_clause.md` | A clause that deconstructs an array field into multiple output rows — `SELECT * FROM user SPLIT tags` creates one row per tag. Equivalent to MongoDB's `$unwind` aggregation stage, which the learner already knows. Essential for flattening arrays before aggregation or grouping. |
| 80 | **Destructuring & Object Notation in SELECT** | `destructuring_select.md` | SurrealDB's support for destructuring nested objects in `SELECT` — `SELECT address.{city, zip} FROM user` returns only the `city` and `zip` fields from the `address` object. A natural syntax for JavaScript developers, enabling precise field selection from deeply nested structures without verbose dot notation per field. |
| 81 | **Built-in Functions Overview** | `builtin_functions.md` | SurrealDB's extensive standard library of functions: `string::*`, `array::*`, `math::*`, `time::*`, `type::*`, `crypto::*`, `geo::*`, `rand::*`, `http::*`, `parse::*`, `search::*` — far more built-in functions than PostgreSQL or MongoDB, reducing the need for application-layer logic. |
| 82 | **String Functions (`string::*`)** | `string_functions.md` | Functions for text manipulation: `string::len()`, `string::uppercase()`, `string::lowercase()`, `string::trim()`, `string::slug()`, `string::concat()`, `string::contains()`, `string::split()`, `string::replace()` — equivalent to PostgreSQL's string functions and MongoDB's `$concat`, `$toLower`, etc. |
| 83 | **Array Functions (`array::*`)** | `array_functions.md` | Functions for array manipulation: `array::len()`, `array::append()`, `array::remove()`, `array::flatten()`, `array::distinct()`, `array::union()`, `array::intersect()`, `array::sort()`, `array::filter()`, `array::map()` — more functional than PostgreSQL's array functions, similar to JavaScript's array methods. |
| 84 | **Time Functions (`time::*`)** | `time_functions.md` | Functions for date/time operations: `time::now()`, `time::day()`, `time::month()`, `time::year()`, `time::floor()`, `time::round()`, `time::format()` — equivalent to PostgreSQL's `EXTRACT`, `DATE_TRUNC`, `NOW()` and MongoDB's `$dateToString`. |
| 85 | **Math Functions (`math::*`)** | `math_functions.md` | Functions for mathematical operations: `math::sum()`, `math::mean()`, `math::median()`, `math::min()`, `math::max()`, `math::abs()`, `math::ceil()`, `math::floor()`, `math::round()`, `math::sqrt()` — used both in aggregate queries and scalar expressions. |
| 86 | **Type Functions (`type::*`)** | `type_functions.md` | Functions for type introspection and conversion: `type::is::string()`, `type::is::number()`, `type::thing()` (construct a record ID from table + id), `type::table()`, `type::field()` — essential for dynamic queries and runtime type checking. |
| 87 | **`IF` / `ELSE` Expressions** | `if_else.md` | Inline conditional logic within SurrealQL — `IF age >= 18 THEN 'adult' ELSE 'minor' END`. Equivalent to PostgreSQL's `CASE` expression and MongoDB's `$cond` / `$switch`. |
| 88 | **`RETURN` Statement (in Functions / Blocks)** | `return_statement.md` | The `RETURN` statement used inside `DEFINE FUNCTION` bodies, `IF/ELSE` blocks, and `FOR` loops to return a value — `RETURN string::concat($first, ' ', $last)`. Distinct from the `RETURN` *clause* on CRUD statements (#45), this is a flow-control statement for procedural SurrealQL. Prerequisite to writing custom functions. |
| 89 | **`FOR` Expression** | `for_expression.md` | A looping expression that iterates over arrays or ranges — `FOR $item IN $items { CREATE log SET message = $item }`. Enables batch processing within a single SurrealQL session without application-layer loops. |
| 90 | **`THROW` Expression** | `throw_expression.md` | Explicitly raising an error within a SurrealQL query or function — `IF $value < 0 { THROW 'Value must be non-negative' }`. Enables custom validation logic with clear error messages. |
| 91 | **`ONLY` Keyword** | `only_keyword.md` | A suffix that forces a query to return a single value instead of an array — `SELECT * FROM ONLY user:tobie` returns the record directly (or an error if not found), not a single-element array. Simplifies application code that expects exactly one result. |
| 92 | **`PARALLEL` Keyword** | `parallel_keyword.md` | A suffix that instructs SurrealDB to execute the query in parallel across records — `UPDATE user SET verified = true WHERE signup_date < '2024-01-01' PARALLEL`. This can significantly speed up bulk operations on large datasets. A SurrealDB-unique performance feature with no direct equivalent in PostgreSQL or MongoDB. |

---

## Level 7 — Indexes, Full-Text Search & Performance

> Making queries fast: how SurrealDB indexes work, full-text search with analyzers, and query optimization.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 93 | **`DEFINE INDEX`** | `define_index.md` | The SurrealQL statement to create an index on one or more fields — `DEFINE INDEX idx_user_email ON user FIELDS email UNIQUE`. Equivalent to PostgreSQL's `CREATE INDEX` and MongoDB's `createIndex()`. |
| 94 | **Unique Index** | `unique_index.md` | An index with the `UNIQUE` keyword that enforces uniqueness on the indexed field(s) — equivalent to PostgreSQL's `UNIQUE` constraint and MongoDB's unique index. The primary way to enforce uniqueness beyond the record ID. |
| 95 | **Composite Index** | `composite_index.md` | An index built on multiple fields — `DEFINE INDEX idx_name ON user FIELDS first_name, last_name`. Field order matters for query optimization, following the same prefix rules as PostgreSQL and MongoDB compound indexes. |
| 96 | **Indexing Record Link Fields** | `indexing_record_links.md` | Creating indexes on fields that hold record links — `DEFINE INDEX idx_post_author ON post FIELDS author`. Without this index, filtering posts by author (`WHERE author = user:tobie`) requires a full table scan. Essential for any relationship-heavy schema where you query by the linked record. |
| 97 | **Search Index & `DEFINE ANALYZER`** | `search_index_analyzer.md` | SurrealDB's built-in full-text search system: `DEFINE ANALYZER` creates tokenizers and filters (equivalent to PostgreSQL's text search configurations or MongoDB Atlas Search analyzers), and `DEFINE INDEX ... SEARCH ANALYZER` creates a full-text search index on a field. |
| 98 | **`search::*` Functions & `@@` Operator** | `search_functions.md` | Functions and operators for full-text search queries: the `@@` operator matches documents (`WHERE content @@ 'search term'`), `search::score()` returns relevance scores, and `search::highlight()` returns highlighted snippets — equivalent to PostgreSQL's `@@` tsquery operator and MongoDB's `$text`/`$search`. |
| 99 | **Vector Search Index (ML/AI)** | `vector_search.md` | SurrealDB's support for storing vector embeddings and performing nearest-neighbor similarity searches — `DEFINE INDEX ... MTREE DIMENSION 1536` creates a vector index for AI/ML applications (semantic search, recommendation engines). Equivalent to `pgvector` in PostgreSQL. |
| 100 | **`DEFINE INDEX ... HNSW` (Approximate Vector Search)** | `hnsw_index.md` | An alternative vector index type using the Hierarchical Navigable Small World algorithm — faster than MTREE for large datasets but returns approximate (not exact) nearest neighbors. Choose `MTREE` for precision, `HNSW` for speed at scale. Understanding this trade-off is critical for AI/ML applications. |
| 101 | **Geospatial Index** | `geospatial_index.md` | An index on `geometry` type fields for efficient spatial queries (nearest point, within area) — automatically supports GeoJSON data with no configuration beyond `DEFINE INDEX ... ON ... FIELDS location`. |
| 102 | **Query Explanation** | `query_explanation.md` | Techniques for understanding query performance in SurrealDB — currently less mature than PostgreSQL's `EXPLAIN ANALYZE` or MongoDB's `explain()`, but improving. Covers index utilization, profiling, and optimization strategies. |

---

## Level 8 — Authentication, Permissions & Security

> SurrealDB's built-in auth system: a radical departure from traditional database access patterns where the database can be queried directly from the browser.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 103 | **Authentication Architecture (Root, Namespace, Database, Record)** | `auth_architecture.md` | SurrealDB's four-tier authentication hierarchy: **Root** (superuser), **Namespace** (manages all DBs in a namespace), **Database** (manages a single DB), and **Record** (end-user authenticated as a specific record) — the Record level is unique to SurrealDB and enables direct browser-to-database queries. |
| 104 | **System Users (`DEFINE USER`)** | `define_user.md` | Creating administrative users at the Root, Namespace, or Database level — equivalent to PostgreSQL's `CREATE ROLE` and MongoDB's `db.createUser()`. Used for backend services and administrative access. |
| 105 | **Record Access (`DEFINE ACCESS ... TYPE RECORD`)** | `define_access_record.md` | SurrealDB's end-user authentication system where users sign up/in as records in a table (e.g., `user:tobie`) and receive a JWT token — enabling direct browser-to-database queries without a backend API layer. Replaces traditional signup/login backend routes. |
| 106 | **`DEFINE ACCESS ... TYPE JWT` (External Auth Providers)** | `define_access_jwt.md` | Integrating external identity providers (Auth0, Supabase Auth, Firebase Auth, Clerk) by accepting their JWT tokens — `DEFINE ACCESS auth_provider ON DATABASE TYPE JWT ALGORITHM RS256 URL 'https://provider/.well-known/jwks.json'`. In production, many apps authenticate users externally and pass JWTs to SurrealDB rather than using SurrealDB's built-in signup/signin. Bridges record access (#105) with real-world auth architecture. |
| 107 | **`SIGNUP` / `SIGNIN` Clauses** | `signup_signin.md` | The SurrealQL expressions executed during record access authentication — `SIGNUP` defines what happens when a new user registers (e.g., creating a user record with hashed password), `SIGNIN` defines what happens on login (e.g., validating credentials). |
| 108 | **`PERMISSIONS` Clause (Table & Field Level)** | `permissions_clause.md` | Fine-grained access control on tables and individual fields — `PERMISSIONS FOR select WHERE author = $auth.id` restricts reads to only records owned by the authenticated user. Equivalent to PostgreSQL's Row-Level Security (RLS) but declarative and per-table/per-field. |
| 109 | **`$auth` Variable** | `auth_variable.md` | A built-in SurrealQL variable that contains the currently authenticated record — available in `PERMISSIONS`, `VALUE`, `ASSERT`, and query contexts. Enables record-level access control like `WHERE owner = $auth.id`. |
| 110 | **`$auth.id` vs `$auth.*` (Accessing Auth Record Fields)** | `auth_record_fields.md` | The fact that `$auth` exposes **all fields** on the authenticated user's record, not just the ID — `$auth.team`, `$auth.role`, `$auth.plan` are all accessible in permissions and queries. This enables rich, field-based access control like `PERMISSIONS FOR select WHERE team = $auth.team` without additional lookups. |
| 111 | **`$session` / `$token` Variables** | `session_token_variables.md` | Built-in variables containing session metadata (`$session`) and JWT token claims (`$token`) — used in advanced permission logic, audit trails, and multi-tenant access patterns. |
| 112 | **JWT Token-Based Auth** | `jwt_auth.md` | How SurrealDB issues and validates JSON Web Tokens for record access — the token contains the user's record ID and claims, enabling stateless authentication identical to what developers build manually with JWT libraries in Node.js/Express. |
| 113 | **SurrealQL Injection Prevention** | `injection_prevention.md` | How SurrealDB's parameter system (`$param`) and SDK binding prevent injection attacks — contrasting with SQL injection (PostgreSQL) and NoSQL injection (MongoDB), plus SurrealDB-specific risks when using string interpolation. |
| 114 | **Direct Browser-to-Database Architecture** | `browser_to_db.md` | The architectural pattern where the browser connects directly to SurrealDB via WebSocket, authenticated as a record user with row-level permissions — eliminating the traditional backend API layer for simple CRUD operations. When this works well, when it doesn't, and how to decide. |

---

## Level 9 — Real-Time Features, Events & Functions

> SurrealDB's built-in real-time capabilities, server-side logic, and reactive programming features.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 115 | **`LIVE SELECT` (Live Queries)** | `live_select.md` | SurrealQL's real-time subscription feature — `LIVE SELECT * FROM post WHERE author = user:tobie` sends push notifications over WebSocket whenever matching records are created, updated, or deleted. Replaces polling, PostgreSQL's `LISTEN`/`NOTIFY`, and MongoDB's change streams. |
| 116 | **`KILL` (Stopping Live Queries)** | `kill_live_query.md` | The SurrealQL command to stop a live query subscription — `KILL $live_query_id`. Essential for cleanup when a user navigates away or a component unmounts. |
| 117 | **Changefeed (`DEFINE TABLE ... CHANGEFEED`)** | `changefeed.md` | A table-level setting that records all changes to a table over a configurable time window — `DEFINE TABLE user CHANGEFEED 7d`. Enables replaying historical changes, building audit logs, and event sourcing patterns. |
| 118 | **`SHOW CHANGES FOR TABLE ... SINCE ...`** | `show_changes.md` | A SurrealQL statement that retrieves recorded changes from a table's changefeed since a specific timestamp or version — used for synchronization, audit trails, and catch-up after reconnection. |
| 119 | **`DEFINE EVENT`** | `define_event.md` | Server-side triggers that execute SurrealQL logic when records are created, updated, or deleted — `DEFINE EVENT email_on_signup ON user WHEN $event = 'CREATE' THEN (CREATE notification SET ...)`. Equivalent to PostgreSQL triggers and MongoDB change stream handlers, but defined declaratively in SurrealQL. |
| 120 | **`$before` / `$after` / `$event` / `$value` Variables (in Events)** | `event_variables.md` | Built-in variables available inside `DEFINE EVENT` handlers: `$before` (previous record state), `$after` (new record state), `$event` (operation type: `CREATE`/`UPDATE`/`DELETE`), and `$value` (current field value in field definitions) — enabling complex event logic. |
| 121 | **`DEFINE FUNCTION`** | `define_function.md` | Creating reusable, server-side SurrealQL functions — `DEFINE FUNCTION fn::full_name($first: string, $last: string) { RETURN string::concat($first, ' ', $last) }`. Equivalent to PostgreSQL's `CREATE FUNCTION` and MongoDB's stored JavaScript functions, but written in SurrealQL. |
| 122 | **`DEFINE PARAM`** | `define_param.md` | Creating database-scoped global parameters that persist across sessions — `DEFINE PARAM $config VALUE { max_retries: 3, feature_flags: { dark_mode: true } }`. Unlike `LET` (query-scoped, lost after session ends), `DEFINE PARAM` values are stored in the database and available to all queries and functions. Used for application configuration, feature flags, and shared constants. |
| 123 | **Transactions (`BEGIN` / `COMMIT` / `CANCEL`)** | `transactions.md` | SurrealDB's transaction support for grouping multiple operations into an atomic unit — `BEGIN TRANSACTION; ... COMMIT TRANSACTION;` or `CANCEL TRANSACTION;` to rollback. Equivalent to PostgreSQL's `BEGIN`/`COMMIT`/`ROLLBACK`. |
| 124 | **Transaction Isolation & Atomicity Semantics** | `transaction_isolation.md` | SurrealDB uses **snapshot isolation** — each transaction sees a consistent snapshot of data from when it started, unaffected by concurrent writes (equivalent to PostgreSQL's `REPEATABLE READ`). Write conflicts between concurrent transactions are detected and one transaction is retried or cancelled. Understanding this is essential for developers who learned PostgreSQL's isolation levels and MongoDB's snapshot isolation. |

---

## Level 10 — SDKs, Deployment & Production

> Connecting from application code, deployment strategies, and production-ready SurrealDB.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 125 | **JavaScript / TypeScript SDK** | `js_sdk.md` | The official SurrealDB SDK for Node.js and browser environments (`surrealdb` npm package) — providing connection management, authentication, typed queries, and live query subscriptions over WebSocket. |
| 126 | **SDK Connection Lifecycle (`connect` / `use` / `signin` / `close`)** | `sdk_connection.md` | The standard connection flow for the JavaScript SDK: `new Surreal()` → `.connect(url)` → `.use({ namespace, database })` → `.signin(credentials)` → `.query()` / `.select()` / `.create()` → `.close()`. |
| 127 | **SDK CRUD Methods (`.select()` / `.create()` / `.update()` / `.delete()`)** | `sdk_crud.md` | The SDK's typed CRUD methods that map directly to SurrealQL statements — providing a more ergonomic TypeScript API than raw `.query()` strings, with full type inference on return values. |
| 128 | **SDK `.query()` with Parameters** | `sdk_query.md` | Executing raw SurrealQL queries through the SDK with parameter binding — `await db.query('SELECT * FROM user WHERE age > $min_age', { min_age: 18 })`. Essential for complex queries that go beyond the CRUD convenience methods. |
| 129 | **SDK Live Query Subscriptions** | `sdk_live_queries.md` | Using the SDK to subscribe to live queries — `await db.live('post', callback)` or `await db.subscribeLive(queryUuid, callback)`. The callback fires on every create/update/delete matching the query, enabling real-time UIs without polling. |
| 130 | **SDK Error Handling & Retry Patterns** | `sdk_error_handling.md` | Handling SDK-specific errors in production applications: connection drops (WebSocket reconnection with exponential backoff), transaction conflicts (automatic retry), query timeouts, and authentication expiry. Extends general error handling (#138) with application-layer resilience patterns essential for building reliable apps. |
| 131 | **WebSocket vs HTTP Connection** | `websocket_vs_http.md` | The two connection protocols: **WebSocket** (persistent, bidirectional — required for live queries and real-time features) vs **HTTP** (stateless, request-response — simpler for serverless/edge functions). When to use each. |
| 132 | **SurrealDB Cloud** | `surrealdb_cloud.md` | SurrealDB's managed cloud platform — handles provisioning, scaling, backups, and monitoring. Equivalent to MongoDB Atlas or managed PostgreSQL services (Supabase, Neon, AWS RDS). |
| 133 | **Docker Deployment** | `docker_deployment.md` | Running SurrealDB in Docker containers for local development and production — `docker run surrealdb/surrealdb:latest start` with volume mounts for persistence. |
| 134 | **TiKV Backend (Distributed Mode)** | `tikv_backend.md` | Using TiKV as SurrealDB's storage backend for distributed, horizontally-scalable production deployments — providing automatic data replication, sharding, and high availability. |
| 135 | **`surreal export` / `surreal import` (Backups)** | `export_import.md` | CLI commands for creating and restoring logical backups of a SurrealDB database — equivalent to PostgreSQL's `pg_dump`/`pg_restore` and MongoDB's `mongodump`/`mongorestore`. |
| 136 | **`surreal validate` (Query Validation)** | `surreal_validate.md` | A CLI command that checks SurrealQL files for syntax errors without executing them — `surreal validate my_migration.surql`. Essential for CI/CD pipelines where migration scripts and schema definitions need validation before deployment, catching errors before they reach production. |
| 137 | **Data Migrations in SurrealDB** | `data_migrations.md` | Strategies for evolving SurrealDB schemas in production: using `DEFINE FIELD ... VALUE` for backfill, `UPDATE ... SET` for data transformations, and migration tooling — contrasting with PostgreSQL's sequential migration files and MongoDB's lazy/eager migration patterns. |
| 138 | **Embedding SurrealDB (Rust / WASM)** | `embedding.md` | Running SurrealDB embedded within an application (no separate server process) via the Rust crate or WebAssembly SDK — enabling offline-capable apps, edge computing, and zero-infrastructure development. A capability unique to SurrealDB among the databases in this curriculum. |
| 139 | **`SLEEP` Statement** | `sleep.md` | A SurrealQL statement that pauses execution for a specified duration — `SLEEP 500ms`. Primarily used for testing, simulating latency, and debugging timing-dependent logic like live queries and events. |
| 140 | **Error Handling & Debugging** | `error_handling.md` | Understanding SurrealDB's error messages, common failure modes, and debugging strategies — query syntax errors, permission denied errors, type mismatches, and connection issues. Includes SDK-level try/catch patterns and SurrealDB server log analysis. |
| 141 | **SurrealDB Ecosystem & Community** | `surrealdb_cloud.md` | The current state of SurrealDB's ecosystem: official SDKs (Rust, JavaScript, Python, Go, Java, .NET), community tools, ORMs/query builders (Cirql, Surreal-ORM), learning resources, and the project's roadmap — providing honest context about maturity vs PostgreSQL (35+ years) and MongoDB (15+ years). |

---

> **Total: 141 terms** (120 original + 21 gap terms) covering SurrealDB from "what is a multi-model database?" to production-ready deployment, designed for progressive learning by a junior full-stack developer who has already completed the PostgreSQL and MongoDB curricula.
