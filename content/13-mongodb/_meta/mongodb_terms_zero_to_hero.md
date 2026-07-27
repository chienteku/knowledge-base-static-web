# MongoDB Terms: Zero to Hero

A comprehensive, progressive curriculum for mastering MongoDB, structured from absolute beginner concepts (what _is_ a document database?) to advanced production architecture (sharding, change streams, Atlas Search). Designed for a junior full-stack developer who has completed the PostgreSQL curriculum and now needs to understand the document-oriented paradigm.

---

## Level 1 — What Is a Document Database?

> The foundations: why document databases exist, how MongoDB differs from PostgreSQL, and the core vocabulary.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 1 | **NoSQL Databases (Overview)** | `nosql_databases.md` | A category of databases that store data in formats other than traditional relational tables — including document, key-value, column-family, and graph databases. |
| 2 | **MongoDB** | `mongodb.md` | An open-source, document-oriented NoSQL database that stores data as flexible JSON-like documents (BSON), designed for scalability, developer productivity, and modern application architectures. |
| 3 | **Document** | `document.md` | The fundamental unit of data in MongoDB — a JSON-like object of field-value pairs (analogous to a "row" in PostgreSQL, but with nested structure and flexible schema). |
| 4 | **Collection** | `collection.md` | A grouping of related documents in MongoDB — analogous to a "table" in PostgreSQL, but without a fixed schema enforced by default. |
| 5 | **Flexible Schema (Schema-on-Read)** | `flexible_schema.md` | The paradigm where MongoDB does not enforce a fixed document structure at write time — any document can have any shape, and structure is interpreted when the application reads the data. This is the single most important conceptual shift from PostgreSQL's schema-on-write model, where column types and constraints are enforced before data enters the table. |
| 6 | **Database (MongoDB Context)** | `database_context.md` | A logical container that groups related collections together, providing namespace isolation and access control. |
| 7 | **Field** | `field.md` | A key-value pair within a document — analogous to a "column" in PostgreSQL, but fields can hold nested documents, arrays, and vary between documents in the same collection. |
| 8 | **`_id` Field & ObjectId** | `objectid.md` | The mandatory, immutable unique identifier for every document. MongoDB auto-generates a 12-byte `ObjectId` if you don't provide one. |
| 9 | **BSON (Binary JSON)** | `bson.md` | MongoDB's binary-encoded serialization format for storing documents — extends JSON with additional data types like `Date`, `ObjectId`, `Decimal128`, and `Binary`. |
| 10 | **JSON vs BSON** | `json_vs_bson.md` | The relationship between standard JSON (human-readable, text-based) and BSON (machine-optimized, binary, type-rich) — why MongoDB uses BSON internally but exposes JSON externally. |
| 11 | **`mongod` (MongoDB Server Daemon)** | `mongod.md` | The primary server process that runs in the background, listens for connections, and manages all data storage and retrieval — understanding that MongoDB is a client-server architecture (like PostgreSQL) where `mongod` is the server, and shells/drivers are clients, is prerequisite to using any MongoDB tool. |
| 12 | **mongosh (MongoDB Shell)** | `mongosh.md` | The official MongoDB interactive command-line interface for running queries, managing databases, and inspecting data using JavaScript syntax. |
| 13 | **MongoDB Compass** | `compass.md` | MongoDB's official graphical user interface (GUI) for visually exploring data, building queries, analyzing schema, and managing indexes without writing shell commands. |
| 14 | **MongoDB Atlas** | `atlas.md` | MongoDB's fully managed cloud database platform — handles provisioning, backups, scaling, security, and monitoring, available on AWS, Azure, and GCP. |
| 15 | **Document vs Relational Model** | `document_vs_relational.md` | A direct comparison of the two paradigms: documents (MongoDB) embed related data together for read performance; relational tables (PostgreSQL) normalize data to eliminate redundancy. |

---

## Level 2 — BSON Data Types & Document Structure

> The building blocks: what types of data MongoDB documents can hold, and how they differ from PostgreSQL column types.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 16 | **BSON Data Types (Overview)** | `bson_data_types.md` | The complete type system available in BSON: String, Number (Int32, Int64, Double, Decimal128), Boolean, Date, ObjectId, Array, Embedded Document, Null, Binary, and more. |
| 17 | **String** | `string.md` | UTF-8 encoded text data — the most common BSON type, equivalent to PostgreSQL's `TEXT`/`VARCHAR`. |
| 18 | **Number Types (`Int32`, `Int64` / `Long`, `Double`, `Decimal128`)** | `number_types.md` | Numeric BSON types for integers and decimals, with `Decimal128` providing exact precision for financial calculations (equivalent to PostgreSQL's `NUMERIC`). |
| 19 | **Boolean** | `boolean_type.md` | A `true` or `false` value — identical in concept to PostgreSQL's `BOOLEAN`. |
| 20 | **Date** | `date_type.md` | A BSON type storing a 64-bit integer representing milliseconds since the Unix epoch — always stored as UTC internally (equivalent to PostgreSQL's `TIMESTAMPTZ`). |
| 21 | **`null`** | `null_type.md` | A BSON type representing the absence of a value — similar to SQL `NULL` but with different querying behavior in MongoDB. |
| 22 | **Embedded Document (Subdocument)** | `embedded_document.md` | A document nested inside another document as a field value — the core structural feature that distinguishes document databases from relational databases. |
| 23 | **Array** | `array_type.md` | An ordered list of values (of any BSON type, including other documents and arrays) stored as a single field — enables one-to-many relationships without JOINs. |
| 24 | **`ObjectId` as a Manual Reference** | `objectid_reference.md` | The practice of storing another document's `ObjectId` as a field value to create a relationship between documents — MongoDB's equivalent of a PostgreSQL foreign key, but with **no** automatic referential integrity enforcement. Understanding this pattern is prerequisite to the Embedding vs Referencing design decision and `$lookup` JOINs. |
| 25 | **`Decimal128`** | `decimal128.md` | A high-precision decimal type for exact arithmetic — essential for financial/monetary data where floating-point errors are unacceptable. |
| 26 | **`Binary` Data** | `binary_data.md` | A BSON type for storing raw binary data (e.g., encrypted values, small files) — rarely used directly; large files should use GridFS instead. |
| 27 | **`Timestamp` vs `Date`** | `timestamp_vs_date.md` | Two similar but distinct BSON types: `Date` is for application use; `Timestamp` is an internal type used by MongoDB's replication system (oplog). |

---

## Level 3 — CRUD Operations (Create, Read, Update, Delete)

> The everyday MongoDB commands every developer must master — the document-oriented equivalents of SQL's INSERT, SELECT, UPDATE, DELETE.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 28 | **`insertOne()` / `insertMany()`** | `insert.md` | Methods to add one or multiple new documents to a collection — equivalent to PostgreSQL's `INSERT INTO`. |
| 29 | **`find()` / `findOne()`** | `find.md` | Methods to retrieve documents from a collection using a query filter — equivalent to PostgreSQL's `SELECT ... WHERE`. |
| 30 | **Query Filter (Filter Document)** | `query_filter.md` | A JSON object that specifies which documents to match — MongoDB's equivalent of the `WHERE` clause, using field-value pairs and operators. |
| 31 | **Implicit `$eq` & Combining Conditions** | `implicit_eq_combining.md` | The rule that `{ age: 25 }` is shorthand for `{ age: { $eq: 25 } }`, and that multiple fields at the top level are implicitly `$and`-ed — so `{ name: "Alice", age: 25 }` is actually `{ $and: [{ name: "Alice" }, { age: 25 }] }`. This implicit behavior is unique to MongoDB and confusing for developers coming from SQL's explicit `WHERE ... AND ...` syntax. |
| 32 | **Projection** | `projection.md` | A specification of which fields to include or exclude in query results — equivalent to listing specific columns in a PostgreSQL `SELECT`. |
| 33 | **Comparison Query Operators (`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`)** | `comparison_operators.md` | Operators used in query filters to compare field values — equivalent to SQL's `=`, `<>`, `>`, `>=`, `<`, `<=`, `IN`, `NOT IN`. |
| 34 | **Logical Query Operators (`$and`, `$or`, `$not`, `$nor`)** | `logical_operators.md` | Operators that combine multiple conditions in a query filter — equivalent to SQL's `AND`, `OR`, `NOT`. |
| 35 | **Element Query Operators (`$exists`, `$type`)** | `element_operators.md` | Operators that match documents based on field existence or BSON type — unique to document databases where fields can be absent or polymorphic. |
| 36 | **Cursor** | `cursor.md` | A pointer to the result set of a `find()` query — supports iteration, sorting, limiting, and skipping, similar to a database cursor in PostgreSQL. |
| 37 | **`sort()` / `limit()` / `skip()`** | `sort_limit_skip.md` | Cursor methods for ordering results, restricting the number of results, and implementing pagination — equivalent to PostgreSQL's `ORDER BY`, `LIMIT`, `OFFSET`. |
| 38 | **`countDocuments()` / `estimatedDocumentCount()`** | `count_documents.md` | Methods to count matching or total documents in a collection — equivalent to `SELECT COUNT(*)`. |
| 39 | **`updateOne()` / `updateMany()`** | `update.md` | Methods to modify existing documents using update operators — equivalent to PostgreSQL's `UPDATE ... SET ... WHERE`. |
| 40 | **Update Operators (`$set`, `$unset`, `$inc`, `$rename`, `$currentDate`)** | `update_operators.md` | Operators that specify _how_ to modify document fields: set values, remove fields, increment numbers, rename fields, and set timestamps. |
| 41 | **`$set` vs Whole-Document Replacement** | `set_vs_replace.md` | The critical distinction that `updateOne()` **requires** update operators (like `$set`) and rejects a plain document, while `replaceOne()` expects a full replacement document **without** operators — confusing these is the #1 beginner mistake and produces an immediate error. |
| 42 | **Array Update Operators (`$push`, `$pull`, `$addToSet`, `$pop`, `$each`)** | `array_update_operators.md` | Operators specifically for modifying array fields: add elements, remove elements, add unique values, and batch operations. |
| 43 | **`replaceOne()`** | `replace_one.md` | A method that completely replaces a document's content (except `_id`) with a new document — unlike `updateOne()` which modifies specific fields. |
| 44 | **`deleteOne()` / `deleteMany()`** | `delete.md` | Methods to remove one or multiple documents from a collection — equivalent to PostgreSQL's `DELETE ... WHERE`. |
| 45 | **Write Result Objects (`insertedId`, `modifiedCount`, `acknowledged`)** | `write_results.md` | The result objects returned by every write method — containing fields like `insertedId`, `matchedCount`, `modifiedCount`, `deletedCount`, and `acknowledged` that tell you exactly what happened. Without reading these, a developer can't verify whether their write actually succeeded or affected the expected number of documents. |
| 46 | **`findOneAndUpdate()` / `findOneAndDelete()` / `findOneAndReplace()`** | `find_and_modify.md` | Atomic methods that find a document and modify/delete/replace it in a single operation, returning the original or modified document — equivalent to PostgreSQL's `UPDATE ... RETURNING`. |
| 47 | **`bulkWrite()`** | `bulk_write.md` | A method that executes multiple write operations (inserts, updates, deletes) in a single command for maximum efficiency — equivalent to PostgreSQL's batch operations. |
| 48 | **Upsert (`upsert: true`)** | `upsert.md` | An option on update operations that inserts a new document if no matching document exists — equivalent to PostgreSQL's `ON CONFLICT ... DO UPDATE` (UPSERT). |

---

## Level 4 — Advanced Querying

> Beyond basic CRUD: querying nested documents, arrays, regular expressions, and text.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 49 | **Dot Notation** | `dot_notation.md` | The syntax for accessing nested fields within embedded documents and arrays using dots (e.g., `"address.city"`) — MongoDB's path to deeply nested data. |
| 50 | **Querying Embedded Documents** | `querying_embedded.md` | Techniques for filtering documents based on field values within nested subdocuments — using dot notation and exact subdocument matching. |
| 51 | **Querying Arrays** | `querying_arrays.md` | Techniques for filtering documents based on array contents: matching any element, matching all elements, matching by array size. |
| 52 | **Array Query Operators (`$elemMatch`, `$all`, `$size`)** | `array_query_operators.md` | Operators for complex array queries: `$elemMatch` matches elements meeting multiple conditions; `$all` requires all specified elements; `$size` matches by array length. |
| 53 | **Positional Operators (`$`, `$[]`, `$[<identifier>]`)** | `positional_operators.md` | Operators that target specific array elements during updates: `$` updates the first matched element, `$[]` updates all elements, and `$[<identifier>]` with `arrayFilters` targets elements matching a condition — the essential bridge between array querying and array updating that enables "update the matched element" operations. |
| 54 | **`arrayFilters` Option** | `array_filters.md` | An option passed to update methods that specifies conditions for the filtered positional operator `$[<identifier>]` — enabling conditional array element updates like "set all scores above 80 to 100" without modifying other elements. |
| 55 | **Querying `null` and Missing Fields** | `querying_null_missing.md` | The confusing MongoDB behavior where `{ field: null }` matches *both* documents where the field is explicitly `null` AND documents where the field doesn't exist at all — to match only explicit null requires `{ field: { $eq: null, $exists: true } }`. This directly parallels PostgreSQL's `IS NULL` gotcha and trips up every beginner. |
| 56 | **Evaluation Query Operators (`$regex`, `$expr`, `$mod`)** | `evaluation_operators.md` | Operators for pattern matching (regex), cross-field comparisons (`$expr`), and modulo arithmetic — equivalent to PostgreSQL's `LIKE`/`~`, column comparisons, and `%`. |
| 57 | **`$regex` (Regular Expressions)** | `regex.md` | Pattern matching on string fields using regular expressions — equivalent to PostgreSQL's `LIKE`, `ILIKE`, and `~` operators. |
| 58 | **Text Search (`$text` / `$search`)** | `text_search.md` | MongoDB's built-in text search capability using text indexes — supports stemming, stop words, and relevance scoring (equivalent to PostgreSQL's `tsvector`/`tsquery`). |
| 59 | **Geospatial Queries (`$near`, `$geoWithin`, `2dsphere`)** | `geospatial_queries.md` | Querying documents by geographic location using GeoJSON data and geospatial indexes — finding nearby points, points within areas, etc. |

---

## Level 5 — Data Modeling & Schema Design

> The heart of MongoDB: designing document schemas, choosing between embedding and referencing, and handling relationships.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 60 | **Schema Design (Document Modeling)** | `schema_design.md` | The practice of structuring documents and collections based on application access patterns — the most important skill in MongoDB development. |
| 61 | **Embedding vs Referencing** | `embedding_vs_referencing.md` | The fundamental schema design decision: embed related data within a single document (denormalize) or store references (`ObjectId`) to separate collections (normalize). |
| 62 | **One-to-One Relationship (Embedding)** | `one_to_one.md` | Modeling a one-to-one relationship by embedding one document inside another — preferred when the related data is always accessed together. |
| 63 | **One-to-Many Relationship (Embedding vs Referencing)** | `one_to_many.md` | Modeling a one-to-many relationship: embed the "many" as an array of subdocuments when bounded, or reference via `ObjectId` when unbounded or independently accessed. |
| 64 | **Many-to-Many Relationship** | `many_to_many.md` | Modeling a many-to-many relationship using arrays of references in one or both collections — MongoDB's alternative to PostgreSQL's junction tables. |
| 65 | **The Subset Pattern** | `subset_pattern.md` | A schema design pattern where a document embeds only the most frequently accessed subset of related data, with the full dataset stored in a separate collection — balancing read speed and document size. |
| 66 | **The Bucket Pattern** | `bucket_pattern.md` | A schema design pattern that groups related time-series or event data into fixed-size "bucket" documents — reducing document count and improving query performance for IoT/logging data. |
| 67 | **The Polymorphic Pattern** | `polymorphic_pattern.md` | Storing documents with different structures in the same collection, using a discriminator field (e.g., `type`) — leveraging MongoDB's schema flexibility for inheritance-like modeling. |
| 68 | **The Extended Reference Pattern** | `extended_reference_pattern.md` | Embedding a partial copy of frequently accessed fields from a referenced document to avoid the cost of a `$lookup` (JOIN) — a controlled form of denormalization. |
| 69 | **The Attribute Pattern** | `attribute_pattern.md` | Converting a wide, sparse set of fields into an array of key-value pair subdocuments — enabling efficient indexing and querying across variable attributes (e.g., product specifications). |
| 70 | **The Outlier Pattern** | `outlier_pattern.md` | A schema design pattern for handling the rare documents that grow beyond normal bounds (e.g., a celebrity with millions of followers) — by moving overflow data into separate "overflow" documents linked by reference, keeping 99% of documents fast while accommodating the 1% that would hit the 16 MB limit. |
| 71 | **Data Lifecycle & TTL Strategies** | `data_lifecycle.md` | The design decision of how to handle data that shouldn't live forever — choosing between TTL indexes (automatic expiry), capped collections (fixed-size circular buffers), archival to cold storage, or manual cleanup. This bridges schema design thinking with Level 7's TTL indexes and Level 10's capped collections. |
| 72 | **Schema Validation (`$jsonSchema`)** | `schema_validation.md` | MongoDB's built-in mechanism to enforce document structure rules on a collection using JSON Schema — ensuring required fields, types, and value constraints at the database level. |
| 73 | **Document Size Limit (16 MB)** | `document_size_limit.md` | MongoDB's hard limit of 16 megabytes per document — a critical constraint that drives schema design decisions around embedding vs referencing and the subset pattern. |
| 74 | **Anti-Patterns in Schema Design** | `anti_patterns.md` | Common schema design mistakes: massive arrays, unbounded growth, unnecessary normalization, missing indexes — and how to avoid them. |

---

## Level 6 — Aggregation Framework

> MongoDB's most powerful feature: transforming, grouping, reshaping, and analyzing data through a sequence of pipeline stages.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 75 | **Aggregation Pipeline (Concept)** | `aggregation_pipeline.md` | A framework for processing documents through a sequence of stages — each stage transforms the data and passes results to the next. MongoDB's equivalent of SQL's `GROUP BY`, `JOIN`, subqueries, and window functions combined. |
| 76 | **`$match` Stage** | `match_stage.md` | Filters documents in the pipeline — equivalent to `WHERE` in SQL. Should always be placed early for index utilization and performance. |
| 77 | **`$group` Stage** | `group_stage.md` | Groups documents by a specified key and computes aggregate values (sum, count, average, etc.) — equivalent to SQL's `GROUP BY` with aggregate functions. |
| 78 | **Accumulator Operators (`$sum`, `$avg`, `$min`, `$max`, `$count`, `$push`, `$addToSet`)** | `accumulator_operators.md` | Operators used within `$group` to compute aggregate values across grouped documents — equivalent to SQL's `SUM()`, `AVG()`, `MIN()`, `MAX()`, `COUNT()`. |
| 79 | **`$project` / `$addFields` Stages** | `project_addfields.md` | Stages that reshape documents: `$project` selects/excludes/renames fields; `$addFields` adds new computed fields without removing existing ones. |
| 80 | **`$set` / `$unset` Pipeline Stages** | `set_unset_stages.md` | Aliases for `$addFields` and `$project` (field removal) introduced in MongoDB 4.2 — `$set` as a *pipeline stage* adds/overwrites fields (identical to `$addFields`), while `$unset` removes fields. **Critical distinction:** `$set` as a pipeline stage is completely different from `$set` as an update operator (#40). Recognizing this prevents a major source of confusion when reading aggregation examples. |
| 81 | **`$sort` / `$limit` / `$skip` Stages** | `sort_limit_skip_stages.md` | Pipeline stages for ordering, limiting, and paginating results — equivalent to SQL's `ORDER BY`, `LIMIT`, `OFFSET`. |
| 82 | **`$unwind` Stage** | `unwind_stage.md` | Deconstructs an array field, creating one output document per array element — essential for aggregating over array data (no direct SQL equivalent). |
| 83 | **Aggregation Variables (`$$ROOT`, `$$CURRENT`, `$$NOW`, `let`)** | `aggregation_variables.md` | System variables available inside aggregation expressions: `$$ROOT` refers to the entire current document, `$$CURRENT` refers to the document at the current pipeline stage, `$$NOW` returns the current timestamp, and `let` defines custom variables in `$lookup` sub-pipelines. Understanding these is prerequisite to using `$replaceRoot` and sub-pipeline `$lookup`. |
| 84 | **`$lookup` Stage** | `lookup_stage.md` | Performs a left outer join with another collection — MongoDB's equivalent of SQL's `LEFT JOIN`. The primary way to combine data from multiple collections in a query. |
| 85 | **`$graphLookup` Stage** | `graph_lookup.md` | Performs a recursive lookup on a collection — traversing hierarchical or graph-structured data (org charts, category trees, social networks) in a single pipeline stage. Equivalent to PostgreSQL's Recursive CTE (`WITH RECURSIVE`), which the learner already knows. |
| 86 | **`$out` / `$merge` Stages** | `out_merge_stages.md` | Stages that write aggregation results to a collection: `$out` replaces the target collection; `$merge` upserts into it — equivalent to PostgreSQL's `CREATE TABLE AS` or `INSERT ... ON CONFLICT`. |
| 87 | **`$facet` Stage** | `facet_stage.md` | Runs multiple aggregation sub-pipelines in parallel on the same input documents, returning each result as a separate field — used for multi-faceted search results (e.g., results + counts + categories). |
| 88 | **`$bucket` / `$bucketAuto` Stages** | `bucket_stages.md` | Stages that group documents into specified value ranges (buckets) — useful for histograms, price ranges, and statistical distributions. |
| 89 | **`$replaceRoot` / `$replaceWith` Stages** | `replace_root.md` | Stages that promote an embedded document or computed expression to be the top-level document — useful for reshaping deeply nested structures. |
| 90 | **Expression Operators in Aggregation (`$cond`, `$ifNull`, `$switch`, `$concat`, `$dateToString`)** | `expression_operators.md` | Operators used within pipeline stages for conditional logic, null handling, string manipulation, and date formatting — equivalent to SQL's `CASE`, `COALESCE`, `CONCAT`, date functions. |

---

## Level 7 — Indexes & Query Performance

> Making queries fast: how MongoDB indexes work, how to read execution plans, and when optimization matters.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 91 | **Index (Concept in MongoDB)** | `index_concept.md` | A data structure that stores a sorted subset of collection data to speed up queries — without indexes, MongoDB must scan every document (collection scan). |
| 92 | **Index Selectivity & Cardinality** | `index_selectivity.md` | The principle that indexes are most effective on fields with **high cardinality** (many unique values, like `email`) and least effective on fields with **low cardinality** (few unique values, like `gender` or `status`). Understanding selectivity is the prerequisite to making smart indexing decisions rather than blindly creating indexes on every queried field. |
| 93 | **`createIndex()` / `dropIndex()`** | `create_drop_index.md` | Methods to create or remove indexes on a collection. |
| 94 | **Background / Rolling Index Builds** | `index_builds.md` | How index creation affects a running system: in MongoDB 4.2+, indexes build in the background by default but still consume resources and briefly hold an exclusive lock at start and end. On large collections, index builds can take minutes to hours — understanding this prevents accidental production outages when running `createIndex()`. |
| 95 | **Single-Field Index** | `single_field_index.md` | The simplest index type, built on a single field — supports equality matches, range queries, and sort operations on that field. |
| 96 | **Compound Index** | `compound_index.md` | An index built on two or more fields, where field order matters (ESR rule: Equality, Sort, Range) — optimizes queries that filter/sort by multiple fields. |
| 97 | **Multikey Index** | `multikey_index.md` | An index automatically created on array fields, indexing each array element separately — enables efficient querying of array contents. |
| 98 | **Text Index** | `text_index.md` | A special index type for full-text search across string fields — supports stemming, stop words, and weighted fields. |
| 99 | **Geospatial Index (`2dsphere` / `2d`)** | `geospatial_index.md` | Index types for efficient geospatial queries — `2dsphere` for Earth-like spherical geometry; `2d` for flat Euclidean geometry. |
| 100 | **Unique Index** | `unique_index.md` | An index that enforces uniqueness on the indexed field(s) — equivalent to PostgreSQL's `UNIQUE` constraint. |
| 101 | **Sparse Index** | `sparse_index.md` | An index that only includes documents where the indexed field exists — skipping documents where the field is absent. Functionally similar to partial indexes but less flexible (predates them). Understanding sparse indexes is necessary when working with legacy MongoDB codebases or documentation. |
| 102 | **Partial Index** | `partial_index.md` | An index that only covers documents matching a filter expression — saves space and improves performance by excluding irrelevant documents. |
| 103 | **TTL (Time-To-Live) Index** | `ttl_index.md` | A special index that automatically deletes documents after a specified time period — used for session data, logs, and temporary data without manual cleanup. |
| 104 | **`explain()` Method** | `explain.md` | A method that reveals the query execution plan — showing whether indexes are used, how many documents were scanned, and execution timing (equivalent to PostgreSQL's `EXPLAIN ANALYZE`). |
| 105 | **Collection Scan vs Index Scan** | `collection_scan_vs_index.md` | The two primary ways MongoDB reads data: scanning every document (COLLSCAN) vs using an index to jump directly to matching documents (IXSCAN). |
| 106 | **Covered Query** | `covered_query.md` | A query where all requested fields are contained in the index itself, allowing MongoDB to return results without ever reading the actual documents — the fastest possible query. |
| 107 | **The ESR Rule (Equality, Sort, Range)** | `esr_rule.md` | A guideline for ordering fields in compound indexes: Equality matches first, then Sort fields, then Range filters — for optimal index utilization. |
| 108 | **Index Intersection** | `index_intersection.md` | MongoDB's ability to combine multiple single-field indexes to satisfy a query — usually less efficient than a proper compound index. |
| 109 | **Wildcard Index** | `wildcard_index.md` | An index that covers all fields (or a subset) matching a wildcard path pattern — useful for collections with highly variable document structures. |

---

## Level 8 — Transactions, Consistency & Durability

> Ensuring data correctness: transactions, write concerns, read concerns, and how MongoDB handles consistency differently from PostgreSQL.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 110 | **Atomicity in MongoDB** | `atomicity.md` | MongoDB guarantees atomicity at the single-document level by default — a single `updateOne()` is always atomic, even across embedded subdocuments and arrays. |
| 111 | **Multi-Document Transaction** | `multi_document_transaction.md` | A feature (since MongoDB 4.0) that provides ACID guarantees across multiple documents and collections — equivalent to PostgreSQL's `BEGIN`/`COMMIT`/`ROLLBACK`. |
| 112 | **Snapshot Isolation** | `snapshot_isolation.md` | The isolation mechanism used by MongoDB's multi-document transactions — each transaction sees a consistent snapshot of data from the moment it starts, unaffected by concurrent writes. This is equivalent to PostgreSQL's `REPEATABLE READ` isolation level, which the learner already understands. |
| 113 | **`startSession()` / `session.withTransaction()`** | `session_transaction.md` | The API for executing multi-document transactions in MongoDB — wrapping multiple operations in a session with automatic retry logic. |
| 114 | **Write Concern** | `write_concern.md` | A setting that controls the level of acknowledgment MongoDB requires before confirming a write operation — from "fire and forget" (`w: 0`) to "majority of replica set" (`w: "majority"`). |
| 115 | **Read Concern** | `read_concern.md` | A setting that controls what data a read operation can return based on durability guarantees — from `"local"` (latest data, possibly rolled back) to `"majority"` (durably committed data). |
| 116 | **Read Preference** | `read_preference.md` | A setting that controls which replica set member(s) a read operation is routed to — `primary`, `secondary`, `nearest`, etc. for balancing consistency vs latency. |
| 117 | **Causal Consistency** | `causal_consistency.md` | A consistency guarantee that ensures a client's operations are seen in causal order — your own writes are always visible to your own subsequent reads, even across replica set members. This is achieved through **sessions** and explains *why* sessions exist beyond just multi-document transactions. Bridges sessions (#113) with read concern (#115) and read preference (#116). |
| 118 | **`WriteConcernError` / `WriteError`** | `write_errors.md` | Error types returned when write operations fail due to constraint violations (duplicate keys, validation errors) or insufficient write concern acknowledgment. |
| 119 | **Retryable Writes / Retryable Reads** | `retryable_operations.md` | MongoDB's built-in mechanism to automatically retry certain operations after transient network errors — enabled by default in modern drivers. |
| 120 | **ACID vs BASE** | `acid_vs_base.md` | A comparison of consistency models: ACID (Atomicity, Consistency, Isolation, Durability — PostgreSQL's default) vs BASE (Basically Available, Soft state, Eventual consistency — MongoDB's historical default, though MongoDB now supports ACID for multi-document transactions). |

---

## Level 9 — Replica Sets & Sharding

> Scaling and high availability: how MongoDB distributes data across multiple servers for reliability and performance.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 121 | **Replica Set** | `replica_set.md` | A group of MongoDB servers (typically 3+) that maintain identical copies of data — providing automatic failover, high availability, and read scaling. |
| 122 | **Primary / Secondary / Arbiter** | `primary_secondary_arbiter.md` | The three roles in a replica set: `Primary` handles all writes; `Secondary` replicates data and can serve reads; `Arbiter` participates in elections but holds no data. |
| 123 | **Automatic Failover & Elections** | `failover_elections.md` | The process by which a replica set automatically elects a new primary when the current primary becomes unavailable — ensuring continuous operation without manual intervention. |
| 124 | **Oplog (Operations Log)** | `oplog.md` | A capped collection on the primary that records all write operations — secondaries replay the oplog to stay synchronized. |
| 125 | **Replication Lag** | `replication_lag.md` | The delay between when a write is applied on the primary and when it becomes visible on secondaries — caused by network latency, secondary load, or oplog throughput limits. Understanding replication lag is critical because a developer using `readPreference: "secondary"` will read **stale data** proportional to this lag, and must design their application accordingly. |
| 126 | **Sharding (Horizontal Scaling)** | `sharding.md` | The process of distributing data across multiple servers (shards) to handle datasets and query loads that exceed the capacity of a single machine. |
| 127 | **Shard Key** | `shard_key.md` | The field (or compound fields) used to determine how documents are distributed across shards — the most critical decision in a sharded architecture. |
| 128 | **Chunks & Balancing** | `chunks_balancing.md` | The units of data distribution in a sharded cluster: data is split into chunks based on shard key ranges, and the balancer automatically redistributes chunks across shards. |
| 129 | **Config Servers & `mongos` Router** | `config_servers_mongos.md` | Infrastructure components of a sharded cluster: `Config Servers` store metadata about data distribution; `mongos` routes client queries to the correct shard(s). |
| 130 | **Targeted vs Scatter-Gather Queries** | `targeted_vs_scatter.md` | The two query routing modes in a sharded cluster: when a query includes the shard key, `mongos` routes to a **single** shard (targeted = fast); without the shard key, `mongos` broadcasts to **all** shards and merges results (scatter-gather = slow). This is the *reason* shard key selection is the most critical decision — a bad shard key forces every query to scatter-gather. |
| 131 | **Hashed vs Ranged Sharding** | `hashed_vs_ranged.md` | Two strategies for distributing data: ranged sharding preserves sort order but can create hotspots; hashed sharding distributes evenly but loses range query efficiency. |

---

## Level 10 — Administration, Security & Advanced Features

> Production-ready MongoDB: security, backups, change streams, Atlas Search, and connecting from application code.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 132 | **Authentication & Authorization (SCRAM, RBAC)** | `auth.md` | MongoDB's security model: authentication verifies identity (SCRAM-SHA-256); role-based access control (RBAC) restricts what users can do. |
| 133 | **NoSQL Injection** | `nosql_injection.md` | A security vulnerability where untrusted user input is injected into MongoDB query operators, allowing attackers to bypass authentication or extract data — and how to prevent it. |
| 134 | **Connection String URI** | `connection_string.md` | The standardized URI format for connecting to MongoDB (`mongodb://` or `mongodb+srv://`) — including host, credentials, database, and connection options. |
| 135 | **Connection Pooling** | `connection_pooling.md` | The driver-level technique of reusing a pool of open database connections instead of creating new ones per request — critical for application performance. |
| 136 | **MongoDB Node.js Driver** | `node_driver.md` | The official low-level driver (`mongodb` npm package) for connecting to MongoDB from Node.js — provides direct access to all MongoDB features using async/await. |
| 137 | **Mongoose (ODM)** | `mongoose.md` | The most popular Object-Document Mapper for MongoDB and Node.js — provides schema definitions, validation, middleware, and a higher-level API (equivalent to an ORM in the relational world). |
| 138 | **Mongoose Schema & Model** | `mongoose_schema_model.md` | The two core Mongoose concepts: a `Schema` defines the structure and validation rules for documents; a `Model` provides the CRUD API for a collection. |
| 139 | **Mongoose Middleware (Hooks)** | `mongoose_middleware.md` | Pre and post hooks that execute logic before or after Mongoose operations (e.g., hashing a password before `save`, logging after `find`) — equivalent to PostgreSQL triggers. |
| 140 | **`mongodump` / `mongorestore` (Backups)** | `mongodump_restore.md` | Command-line tools for creating logical backups of a MongoDB database and restoring them — essential disaster recovery (equivalent to PostgreSQL's `pg_dump`/`pg_restore`). |
| 141 | **`serverStatus` / `currentOp` / `db.stats()`** | `server_diagnostics.md` | Diagnostic commands for monitoring a MongoDB deployment: `db.serverStatus()` shows server health metrics, `db.currentOp()` reveals currently running operations, and `db.stats()` provides collection/database size and count statistics — equivalent to PostgreSQL's `pg_stat_statements` and system views. |
| 142 | **MongoDB Profiler (`db.setProfilingLevel()`)** | `profiler.md` | A built-in tool that captures all operations exceeding a configurable time threshold (e.g., queries slower than 100ms) into the `system.profile` collection — essential for finding performance bottlenecks in production. While `explain()` analyzes a single query, the profiler passively captures *all* slow queries over time. Equivalent to PostgreSQL's `log_min_duration_statement`. |
| 143 | **Change Streams** | `change_streams.md` | A real-time event stream that notifies your application whenever documents in a collection are inserted, updated, or deleted — enabling reactive architectures without polling (equivalent to PostgreSQL's `LISTEN`/`NOTIFY`). |
| 144 | **Atlas Search** | `atlas_search.md` | MongoDB Atlas's built-in full-text search engine powered by Apache Lucene — provides relevance scoring, fuzzy matching, facets, and autocomplete without a separate search service (equivalent to Elasticsearch). |
| 145 | **Time-Series Collections** | `time_series.md` | A specialized collection type optimized for storing and querying time-stamped data (IoT, metrics, logs) — with automatic bucketing and compression. |
| 146 | **Capped Collections** | `capped_collections.md` | Fixed-size collections that automatically overwrite the oldest documents when the size limit is reached — used for logs, caches, and circular buffers. |
| 147 | **GridFS** | `gridfs.md` | A specification for storing files larger than the 16 MB document limit by splitting them into chunks stored across two collections — used for images, videos, and large binary data. |
| 148 | **Views** | `views.md` | Named, read-only aggregation pipelines stored as virtual collections — equivalent to PostgreSQL's views, providing a reusable abstraction layer over queries. |
| 149 | **Database Migrations (MongoDB)** | `database_migrations.md` | Strategies for evolving MongoDB schemas in production: lazy migration (update on read), eager migration (batch update), and migration tools (migrate-mongo). |
| 150 | **MongoDB vs PostgreSQL — When to Choose Which** | `mongodb_vs_postgresql.md` | A comprehensive decision guide: when document databases excel (flexible schemas, rapid prototyping, horizontal scaling) vs when relational databases are better (complex transactions, strict integrity, heavy JOINs). |

---

> **Total: 150 terms** (127 original + 23 gap terms) covering MongoDB from "what is a document database?" to production-ready architecture, designed for progressive learning by a junior full-stack developer who has already completed the PostgreSQL curriculum.
