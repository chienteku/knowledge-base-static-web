# PostgreSQL Terms: Zero to Hero

A comprehensive, progressive curriculum for mastering PostgreSQL, structured from absolute beginner concepts (what _is_ a database?) to advanced production architecture (replication, partitioning, full-text search). Designed for a junior full-stack developer who has experience with JavaScript/TypeScript but zero database knowledge.

---

## Level 1 — What Is a Database?

> The absolute foundations: why databases exist, what PostgreSQL is, and the relational model.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 1 | **Database** | `database.md` | A structured, organized collection of data stored electronically, designed for efficient retrieval and manipulation. |
| 2 | **PostgreSQL (Postgres)** | `postgresql.md` | An open-source, enterprise-grade relational database management system (RDBMS) known for standards compliance, extensibility, and data integrity. |
| 3 | **Relational Database** | `relational_database.md` | A database that organizes data into structured tables (relations) with rows and columns, and enforces relationships between them. |
| 4 | **Table (Relation)** | `table.md` | A structured collection of related data organized into rows (records) and columns (fields), the fundamental storage unit in a relational database. |
| 5 | **Row (Record / Tuple)** | `row.md` | A single horizontal entry in a table representing one complete set of related data (e.g., one user, one product). |
| 6 | **Column (Field / Attribute)** | `column.md` | A vertical category in a table that defines a specific piece of data every row must have (e.g., `name`, `email`, `age`). |
| 7 | **SQL (Structured Query Language)** | `sql.md` | The standard programming language used to communicate with relational databases — to create, read, update, and delete data. |
| 8 | **Schema** | `schema.md` | A logical namespace that groups related database objects (tables, views, functions) together, providing organization and access control. |
| 9 | **Client-Server Model (in Databases)** | `client_server_model.md` | PostgreSQL runs as a server process that listens for connections; tools like `psql` and `pgAdmin` are clients that connect to it over a network or local socket — understanding this architecture is prerequisite to using any database tool. |
| 10 | **psql (Interactive Terminal)** | `psql.md` | The official PostgreSQL command-line interface for writing SQL queries, managing databases, and inspecting schema. |
| 11 | **pgAdmin & GUI Tools** | `pgadmin.md` | Graphical tools for visually managing PostgreSQL databases, writing queries, and inspecting data without the command line. |
| 12 | **Connection String / DSN** | `connection_string.md` | The URI format (`postgresql://user:password@host:port/dbname`) used by every client tool and application library to locate and authenticate with a PostgreSQL server — the bridge between "I installed Postgres" and "I'm writing SQL." |
| 13 | **`CREATE DATABASE` / `DROP DATABASE`** | `create_drop_database.md` | SQL commands to create a new database or permanently destroy an existing one. |
| 14 | **`CREATE TABLE` / `DROP TABLE`** | `create_drop_table.md` | SQL commands to define a new table's structure (columns and types) or permanently destroy a table and all its data. |

---

## Level 2 — Core Data Types & Constraints

> The building blocks: what types of data PostgreSQL can store, and how to enforce data quality.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 15 | **Data Types (Overview)** | `data_types.md` | The system of categories (integer, text, boolean, date, etc.) that defines what kind of data each column can hold. |
| 16 | **`INTEGER` / `BIGINT` / `SMALLINT`** | `integer_types.md` | Numeric data types for storing whole numbers of varying sizes. |
| 17 | **`TEXT` / `VARCHAR` / `CHAR`** | `text_types.md` | String data types for storing text data, with different length constraints and storage behaviors. |
| 18 | **`BOOLEAN`** | `boolean.md` | A data type that stores `TRUE`, `FALSE`, or `NULL` — used for yes/no flags and conditional logic. |
| 19 | **`DATE` / `TIME` / `TIMESTAMP` / `TIMESTAMPTZ`** | `date_time_types.md` | Data types for storing dates, times, and timestamps, with or without timezone awareness. |
| 20 | **`NUMERIC` / `DECIMAL` / `REAL` / `DOUBLE PRECISION`** | `numeric_types.md` | Data types for storing decimal numbers — exact precision (`NUMERIC`) vs approximate floating-point (`REAL`/`DOUBLE`). |
| 21 | **`NUMERIC` Precision & Scale** | `numeric_precision_scale.md` | The `NUMERIC(precision, scale)` syntax that controls how many total digits and decimal places a number can have (e.g., `NUMERIC(10,2)` for monetary values) — makes the `NUMERIC` type practical for real-world use. |
| 22 | **`SERIAL` / `GENERATED ALWAYS AS IDENTITY`** | `serial_identity.md` | Auto-incrementing integer columns used to generate unique IDs for each new row, with `IDENTITY` being the modern standard. |
| 23 | **`NULL`** | `null.md` | A special marker indicating that a value is missing, unknown, or not applicable — not the same as zero or an empty string. |
| 24 | **`NOT NULL` Constraint** | `not_null.md` | A column-level rule that prevents a column from ever containing `NULL`, ensuring every row has a value for that field. |
| 25 | **`DEFAULT` Value** | `default_value.md` | A predefined value that is automatically inserted into a column when no explicit value is provided during an `INSERT`. |
| 26 | **`PRIMARY KEY`** | `primary_key.md` | A constraint that uniquely identifies each row in a table — combines `NOT NULL` and `UNIQUE`. Every table should have one. |
| 27 | **`UNIQUE` Constraint** | `unique_constraint.md` | A constraint that ensures all values in a column (or combination of columns) are distinct — no duplicates allowed. |
| 28 | **`CHECK` Constraint** | `check_constraint.md` | A constraint that enforces a custom boolean condition on column values (e.g., `CHECK (age >= 0)`). |

---

## Level 3 — CRUD Operations (The Four Pillars of SQL)

> Create, Read, Update, Delete — the everyday SQL commands every developer must master.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 29 | **`INSERT INTO`** | `insert_into.md` | The SQL command to add one or more new rows of data into a table. |
| 30 | **Multi-row `INSERT` / `INSERT ... SELECT`** | `multi_row_insert.md` | Inserting multiple rows in a single statement (`VALUES (...), (...), (...)`) or inserting rows derived from a query (`INSERT INTO ... SELECT ...`) — essential for bulk data operations that every developer encounters immediately after learning single-row inserts. |
| 31 | **`SELECT`** | `select.md` | The SQL command to retrieve data from one or more tables — the most frequently used SQL statement. |
| 32 | **`SELECT *` vs Column List** | `select_star_vs_columns.md` | The critical distinction between `SELECT *` (all columns, convenient for exploration) and explicitly listing columns (`SELECT name, email`) — understanding why `SELECT *` is harmful in production code (performance, fragility, security) is one of the first best practices every developer must learn. |
| 33 | **`WHERE` Clause** | `where.md` | A filter clause used with `SELECT`, `UPDATE`, and `DELETE` to specify which rows to act upon based on conditions. |
| 34 | **Comparison & Logical Operators (`=`, `<>`, `AND`, `OR`, `NOT`, `BETWEEN`, `IN`, `LIKE`)** | `operators.md` | Operators used in `WHERE` clauses to build conditions for filtering rows. |
| 35 | **`IS NULL` / `IS NOT NULL`** | `is_null.md` | The only correct way to test for `NULL` values in a `WHERE` clause — `WHERE column = NULL` does **not** work because `NULL` is not equal to anything, not even itself. Bridges the `NULL` concept with `WHERE` filtering. |
| 36 | **`ORDER BY`** | `order_by.md` | A clause that sorts query results by one or more columns in ascending (`ASC`) or descending (`DESC`) order. |
| 37 | **`LIMIT` / `OFFSET`** | `limit_offset.md` | Clauses that restrict the number of rows returned and skip a specified number of rows — essential for pagination. |
| 38 | **`UPDATE`** | `update.md` | The SQL command to modify existing data in a table, changing values in one or more columns for rows matching a `WHERE` condition. |
| 39 | **`DELETE`** | `delete.md` | The SQL command to remove rows from a table. Without a `WHERE` clause, it deletes ALL rows (dangerous!). |
| 40 | **`TRUNCATE`** | `truncate.md` | A fast command to remove ALL rows from a table without logging individual row deletions — faster than `DELETE` but irreversible. |
| 41 | **`RETURNING` Clause** | `returning.md` | A PostgreSQL-specific clause that returns the affected rows after an `INSERT`, `UPDATE`, or `DELETE`, eliminating the need for a separate `SELECT`. |
| 42 | **`UPSERT` (`ON CONFLICT`)** | `upsert.md` | A PostgreSQL feature that inserts a row if it doesn't exist, or updates it if a conflict (e.g., duplicate key) occurs — atomic insert-or-update. |

---

## Level 4 — Querying & Data Retrieval (Intermediate SQL)

> Beyond basic CRUD: aggregation, grouping, subqueries, and working with sets.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 43 | **`DISTINCT`** | `distinct.md` | A keyword that removes duplicate rows from query results, returning only unique values. |
| 44 | **Aliases (`AS`)** | `aliases.md` | Temporary names assigned to columns or tables in a query to improve readability and enable self-joins. |
| 45 | **Aggregate Functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)** | `aggregate_functions.md` | Functions that perform calculations across multiple rows and return a single summary value. |
| 46 | **`NULL` Behavior in Expressions & Aggregates** | `null_in_aggregates.md` | How `NULL` silently affects calculations: any arithmetic with `NULL` yields `NULL` (`5 + NULL = NULL`), `COUNT(column)` excludes NULLs while `COUNT(*)` counts all rows, and `SUM`/`AVG` ignore NULLs entirely — the #1 source of subtle data bugs that bridges the `NULL` concept with aggregate functions. |
| 47 | **`GROUP BY`** | `group_by.md` | A clause that groups rows with identical values in specified columns, allowing aggregate functions to compute per-group summaries. |
| 48 | **`HAVING`** | `having.md` | A filter clause applied _after_ `GROUP BY` aggregation, used to filter groups (unlike `WHERE`, which filters individual rows). |
| 49 | **`LIKE` / `ILIKE` Pattern Matching** | `like_ilike.md` | SQL's text search operators using wildcards (`%` for any characters, `_` for one character) — `LIKE` is case-sensitive while PostgreSQL's `ILIKE` is case-insensitive — essential for building any search feature. |
| 50 | **Subquery (Nested Query)** | `subquery.md` | A `SELECT` statement embedded inside another SQL statement, used to compute intermediate results or filter data dynamically. |
| 51 | **`EXISTS` / `NOT EXISTS`** | `exists.md` | A condition that tests whether a subquery returns any rows — commonly used for checking the existence of related data. |
| 52 | **`CASE` Expression** | `case_expression.md` | SQL's conditional logic (like `if/else` in JavaScript) that returns different values based on conditions within a query. |
| 53 | **`COALESCE` / `NULLIF`** | `coalesce_nullif.md` | Functions for handling `NULL` values: `COALESCE` returns the first non-NULL argument; `NULLIF` returns `NULL` if two values are equal. |
| 54 | **Type Casting (`CAST` / `::`)** | `type_casting.md` | Converting a value from one data type to another, using either `CAST(x AS type)` or PostgreSQL's shorthand `x::type` syntax. |
| 55 | **String Functions (`CONCAT`, `LENGTH`, `UPPER`, `LOWER`, `TRIM`, `SUBSTRING`, `REPLACE`)** | `string_functions.md` | Built-in functions for manipulating text data within SQL queries. |
| 56 | **Date/Time Functions (`NOW()`, `CURRENT_DATE`, `AGE()`, `EXTRACT`, `DATE_TRUNC`, `INTERVAL`)** | `date_time_functions.md` | Functions for working with dates, times, and intervals — calculating age, extracting parts, and performing date arithmetic. |

---

## Level 5 — Table Relationships & JOINs

> The heart of relational databases: connecting tables together and maintaining referential integrity.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 57 | **Referential Integrity** | `referential_integrity.md` | The guarantee that every foreign key value in a child table points to a valid, existing row in the parent table — the fundamental *reason* foreign keys exist, ensuring the database never contains orphaned references. |
| 58 | **`FOREIGN KEY`** | `foreign_key.md` | A constraint that creates a link between two tables by referencing the `PRIMARY KEY` of another table, enforcing referential integrity. |
| 59 | **One-to-Many Relationship** | `one_to_many.md` | The most common relationship pattern: one row in Table A relates to many rows in Table B (e.g., one user has many orders). |
| 60 | **One-to-One Relationship** | `one_to_one.md` | A relationship where one row in Table A relates to exactly one row in Table B (e.g., one user has one profile). |
| 61 | **Many-to-Many Relationship** | `many_to_many.md` | A relationship requiring a junction (bridge) table because rows in both tables can relate to multiple rows in the other (e.g., students ↔ courses). |
| 62 | **Junction Table (Bridge / Pivot Table)** | `junction_table.md` | An intermediary table that resolves a many-to-many relationship by holding foreign keys from both related tables. |
| 63 | **Natural Key vs Surrogate Key** | `natural_vs_surrogate_key.md` | The fundamental design choice between using a meaningful business value (email, ISBN, SSN) vs an arbitrary generated identifier (`SERIAL`, `UUID`) as a table's primary key — affects uniqueness guarantees, JOIN performance, and schema evolution. |
| 64 | **`ON DELETE` / `ON UPDATE` Actions (`CASCADE`, `SET NULL`, `RESTRICT`)** | `on_delete_update.md` | Rules that define what happens to child rows when the referenced parent row is deleted or updated. |
| 65 | **`JOIN` (Concept)** | `join_concept.md` | The SQL operation that combines rows from two or more tables based on a related column, enabling queries across relationships. |
| 66 | **`INNER JOIN`** | `inner_join.md` | Returns only the rows where there is a matching value in _both_ tables — the most common type of join. |
| 67 | **`LEFT JOIN` (`LEFT OUTER JOIN`)** | `left_join.md` | Returns all rows from the left table, plus matching rows from the right table. Unmatched right-side rows are filled with `NULL`. |
| 68 | **`RIGHT JOIN` / `FULL OUTER JOIN`** | `right_full_join.md` | `RIGHT JOIN` returns all right-table rows; `FULL OUTER JOIN` returns all rows from both tables, filling `NULL` where there's no match. |
| 69 | **`CROSS JOIN`** | `cross_join.md` | Returns the Cartesian product of two tables — every row from Table A paired with every row from Table B. Rarely used, but important to understand. |
| 70 | **Self-Join** | `self_join.md` | A join where a table is joined with itself, typically using aliases — useful for hierarchical or comparative queries (e.g., employees and their managers). |

---

## Level 6 — Schema Design & Normalization

> Designing tables properly: eliminating duplication, planning relationships, and building maintainable schemas.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 71 | **Entity-Relationship Diagram (ERD)** | `erd.md` | A visual blueprint that maps out the tables (entities), their columns (attributes), and the relationships between them before writing any SQL. |
| 72 | **Normalization** | `normalization.md` | The process of organizing database tables to eliminate data redundancy and prevent anomalies (insertion, update, deletion anomalies). |
| 73 | **Functional Dependency** | `functional_dependency.md` | The relationship where the value of one column (or set of columns) uniquely determines the value of another column — e.g., `student_id → student_name`. Understanding functional dependencies is the prerequisite to understanding all normal forms. |
| 74 | **First Normal Form (1NF)** | `first_normal_form.md` | Each column holds atomic (indivisible) values, and each row is unique — no repeating groups or arrays in a single cell. |
| 75 | **Second Normal Form (2NF)** | `second_normal_form.md` | Meets 1NF, plus every non-key column depends on the _entire_ primary key, not just part of it (eliminates partial dependencies). |
| 76 | **Third Normal Form (3NF)** | `third_normal_form.md` | Meets 2NF, plus every non-key column depends directly on the primary key and nothing else (eliminates transitive dependencies). |
| 77 | **Composite Key** | `composite_key.md` | A primary key composed of two or more columns that together uniquely identify a row (e.g., `PRIMARY KEY (student_id, course_id)` in a junction table) — prerequisite to understanding junction tables and partial dependencies in 2NF. |
| 78 | **Denormalization** | `denormalization.md` | The intentional introduction of redundancy into a schema for performance gains — a calculated trade-off done _after_ proper normalization. |
| 79 | **`ALTER TABLE`** | `alter_table.md` | The SQL command to modify an existing table's structure: add/drop/rename columns, add/drop constraints, change data types. |
| 80 | **`ENUM` Type** | `enum_type.md` | A custom data type that restricts a column to a predefined set of string values (e.g., `'pending'`, `'active'`, `'archived'`). |
| 81 | **`UUID` Type** | `uuid_type.md` | A Universally Unique Identifier data type — a 128-bit random ID used as an alternative to auto-incrementing integers for primary keys. |
| 82 | **`ARRAY` Type** | `array_type.md` | A PostgreSQL-specific data type that stores an ordered list of values of the same type in a single column (e.g., `TEXT[]`). |
| 83 | **`JSON` / `JSONB` Type** | `json_jsonb.md` | Data types for storing JSON documents. `JSONB` stores data in a binary format that supports indexing and efficient querying. |

---

## Level 7 — Indexes & Query Performance

> Making queries fast: how indexes work, how to read query plans, and when optimization matters.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 84 | **Index (Concept)** | `index_concept.md` | A separate data structure that the database maintains alongside a table to dramatically speed up data retrieval — like a book's index. |
| 85 | **`CREATE INDEX` / `DROP INDEX`** | `create_drop_index.md` | SQL commands to create or remove an index on one or more columns of a table. |
| 86 | **B-tree Index** | `btree_index.md` | The default index type in PostgreSQL — a balanced tree structure optimized for equality and range queries (`=`, `<`, `>`, `BETWEEN`). |
| 87 | **Unique Index** | `unique_index.md` | An index that also enforces uniqueness on the indexed column(s) — functionally equivalent to a `UNIQUE` constraint but explicit. |
| 88 | **Composite Index (Multi-column)** | `composite_index.md` | An index built on two or more columns, where column order matters — optimized for queries that filter or sort by those columns together. |
| 89 | **Partial Index** | `partial_index.md` | An index that only covers rows matching a `WHERE` condition (e.g., `CREATE INDEX ... WHERE active = TRUE`), saving space and improving speed. |
| 90 | **Expression Index (Functional Index)** | `expression_index.md` | An index built on the result of an expression or function (e.g., `CREATE INDEX ... ON users (LOWER(email))`) — critical for case-insensitive lookups and indexing into JSONB fields (`(data->>'name')`). |
| 91 | **GIN Index** | `gin_index.md` | Generalized Inverted Index — optimized for multi-valued data types like `ARRAY`, `JSONB`, and full-text search (`tsvector`). |
| 92 | **`EXPLAIN` / `EXPLAIN ANALYZE`** | `explain_analyze.md` | Commands that show the query planner's execution plan — revealing how PostgreSQL will (or did) execute a query, including costs, row estimates, and timing. |
| 93 | **Sequential Scan vs Index Scan** | `seq_scan_vs_index_scan.md` | The two primary ways PostgreSQL reads data: scanning every row in order (Seq Scan) vs using an index to jump directly to matching rows (Index Scan). |
| 94 | **Index-Only Scan (Covering Index)** | `index_only_scan.md` | A scan type where PostgreSQL retrieves all required data directly from the index without touching the table heap — the fastest possible read path, visible in `EXPLAIN` output and achieved when all selected columns are included in the index. |
| 95 | **Query Planner / Optimizer** | `query_planner.md` | PostgreSQL's internal engine that analyzes a SQL query and chooses the most efficient execution strategy (join order, index usage, scan type). |
| 96 | **`VACUUM` / `ANALYZE`** | `vacuum_analyze.md` | Maintenance commands: `VACUUM` reclaims storage from dead rows (due to MVCC); `ANALYZE` updates table statistics for the query planner. |
| 97 | **`REINDEX`** | `reindex.md` | A maintenance command that rebuilds one or more indexes — used when indexes become bloated from heavy updates/deletes or corrupted, connecting index creation with ongoing maintenance. |

---

## Level 8 — Transactions, Concurrency & Data Integrity

> Ensuring data correctness: ACID properties, transactions, locking, and concurrent access.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 98 | **Transaction** | `transaction.md` | A sequence of SQL operations treated as a single, indivisible unit of work — either ALL succeed, or ALL are rolled back. |
| 99 | **`BEGIN` / `COMMIT` / `ROLLBACK`** | `begin_commit_rollback.md` | SQL commands to start a transaction, permanently apply its changes, or undo all changes made within it. |
| 100 | **ACID Properties** | `acid.md` | The four guarantees of a reliable transaction: **A**tomicity, **C**onsistency, **I**solation, **D**urability. |
| 101 | **`SAVEPOINT` / `ROLLBACK TO`** | `savepoint.md` | Intermediate checkpoints within a transaction that allow partial rollback without aborting the entire transaction. |
| 102 | **MVCC (Multi-Version Concurrency Control)** | `mvcc.md` | PostgreSQL's concurrency model where each transaction sees a snapshot of the data, allowing readers and writers to operate simultaneously without blocking each other. |
| 103 | **Dirty Read / Non-Repeatable Read / Phantom Read** | `concurrency_anomalies.md` | The three concurrency anomalies that occur when transactions run simultaneously: seeing uncommitted changes (dirty read), getting different results re-reading the same row (non-repeatable read), or seeing new rows appear in a repeated query (phantom read) — understanding these is prerequisite to choosing the correct isolation level. |
| 104 | **Transaction Isolation Levels** | `isolation_levels.md` | Settings that control how much a transaction can see changes made by other concurrent transactions: `READ COMMITTED` (default), `REPEATABLE READ`, `SERIALIZABLE`. |
| 105 | **Locking (Row-level, Table-level)** | `locking.md` | Mechanisms that prevent multiple transactions from conflicting when modifying the same data — PostgreSQL uses row-level locks by default. |
| 106 | **Deadlock** | `deadlock.md` | A situation where two or more transactions are waiting for each other to release locks, causing all of them to freeze — PostgreSQL detects and resolves these automatically. |
| 107 | **`SELECT ... FOR UPDATE`** | `select_for_update.md` | A locking query that locks the selected rows, preventing other transactions from modifying or locking them until the current transaction completes. |
| 108 | **Advisory Locks** | `advisory_locks.md` | Application-level locks managed by PostgreSQL (`pg_advisory_lock` / `pg_try_advisory_lock`) that don't lock any actual rows or tables — used by application code for distributed locking scenarios like preventing duplicate cron jobs or serializing access to external resources. |
| 109 | **Optimistic vs Pessimistic Locking** | `optimistic_pessimistic.md` | Two strategies for handling concurrent access: assume conflicts are rare and detect them (optimistic) vs prevent conflicts by locking upfront (pessimistic). |

---

## Level 9 — Views, Functions & Advanced SQL

> Reusable SQL abstractions: views, stored functions, CTEs, window functions, and advanced query patterns.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 110 | **View** | `view.md` | A virtual table defined by a saved `SELECT` query — provides a reusable, named abstraction layer over complex queries. |
| 111 | **Materialized View** | `materialized_view.md` | A view that physically stores its query results on disk, trading freshness for query speed — must be manually refreshed. |
| 112 | **Common Table Expression (CTE / `WITH`)** | `cte.md` | A temporary, named result set defined within a query using the `WITH` keyword, improving readability of complex queries. |
| 113 | **Recursive CTE** | `recursive_cte.md` | A CTE that references itself, enabling queries on hierarchical or tree-structured data (e.g., org charts, category trees, threaded comments). |
| 114 | **`OVER()` / `PARTITION BY` / `ORDER BY` (Window Clause)** | `window_clause.md` | The syntax that defines the "window" of rows a window function operates on — `OVER()` activates window mode, `PARTITION BY` divides rows into groups, and `ORDER BY` sets the row order within each group. This is the prerequisite syntax for all window functions. |
| 115 | **Window Function** | `window_function.md` | A function that performs a calculation across a set of rows related to the current row _without_ collapsing them into a single result (unlike aggregates). |
| 116 | **`ROW_NUMBER()` / `RANK()` / `DENSE_RANK()`** | `row_number_rank.md` | Window functions that assign sequential numbers or rankings to rows within a partition — used for pagination, top-N queries, and deduplication. |
| 117 | **`LAG()` / `LEAD()`** | `lag_lead.md` | Window functions that access data from a previous (`LAG`) or subsequent (`LEAD`) row within a partition — used for calculating differences and trends. |
| 118 | **Stored Function (`CREATE FUNCTION`)** | `stored_function.md` | A reusable block of SQL (or PL/pgSQL) logic stored in the database, callable from queries like a built-in function. |
| 119 | **Stored Procedure (`CREATE PROCEDURE` / `CALL`)** | `stored_procedure.md` | A reusable block of server-side logic (introduced in PostgreSQL 11) that, unlike functions, can manage its own transactions (`COMMIT`/`ROLLBACK` inside the body) and is invoked with `CALL` instead of within a query — the right choice for multi-step operations that need transaction control. |
| 120 | **PL/pgSQL** | `plpgsql.md` | PostgreSQL's built-in procedural language that extends SQL with variables, loops, conditionals, and error handling inside functions and triggers. |
| 121 | **`DO` Block (Anonymous Code Block)** | `do_block.md` | A `DO $$ ... $$` statement that executes a block of PL/pgSQL code without creating a stored function — used for one-off scripting, data migrations, and testing PL/pgSQL logic interactively. |
| 122 | **Trigger** | `trigger.md` | A database object that automatically executes a function in response to specific table events (`INSERT`, `UPDATE`, `DELETE`). |
| 123 | **`UNION` / `UNION ALL` / `INTERSECT` / `EXCEPT`** | `set_operations.md` | Set operations that combine results from multiple `SELECT` queries: merge (`UNION`), keep duplicates (`UNION ALL`), intersect, or subtract. |
| 124 | **`LATERAL` Join** | `lateral_join.md` | A join where each row from the left table is passed as input to the right-side subquery, enabling row-by-row correlated lookups. |

---

## Level 10 — Administration, Security & Production

> Production-ready PostgreSQL: roles, security, backups, replication, partitioning, and advanced features.

| # | Term | Filename | Description |
|---|------|----------|-------------|
| 125 | **Roles & Permissions (`CREATE ROLE`, `GRANT`, `REVOKE`)** | `roles_permissions.md` | PostgreSQL's access control system for managing who can connect, read, write, or administer database objects. |
| 126 | **`pg_hba.conf` (Host-Based Authentication)** | `pg_hba_conf.md` | PostgreSQL's authentication configuration file that controls *which* users can connect, from *which* hosts, to *which* databases, and using *which* authentication method (password, certificate, etc.) — the first file a developer must understand when deploying PostgreSQL for remote access. |
| 127 | **Row-Level Security (RLS)** | `row_level_security.md` | A PostgreSQL feature that restricts which rows individual users can see or modify, enforced at the database level — essential for multi-tenant applications. |
| 128 | **SQL Injection** | `sql_injection.md` | A critical security vulnerability where untrusted user input is inserted directly into SQL queries, allowing attackers to read, modify, or destroy data. |
| 129 | **Parameterized Queries / Prepared Statements** | `parameterized_queries.md` | The practice of separating SQL logic from user-supplied values, sending values as parameters — the definitive defense against SQL injection. |
| 130 | **Connection Pooling** | `connection_pooling.md` | A technique that reuses a pool of open database connections instead of creating a new one for every request — critical for application performance. |
| 131 | **`postgresql.conf` (Server Configuration)** | `postgresql_conf.md` | PostgreSQL's central configuration file where key server settings are tuned — `shared_buffers` (memory), `work_mem` (per-query memory), `max_connections`, logging, and checkpoint settings — essential knowledge for production deployment and performance tuning. |
| 132 | **`pg_dump` / `pg_restore` (Backups)** | `pg_dump_restore.md` | Command-line tools for creating logical backups of a PostgreSQL database and restoring them — essential disaster recovery. |
| 133 | **WAL (Write-Ahead Log)** | `wal.md` | A sequential log file where PostgreSQL records every data change *before* applying it to the actual data files — the mechanism that makes crash recovery, replication, and point-in-time recovery possible. Understanding WAL is prerequisite to understanding how replication works. |
| 134 | **Point-in-Time Recovery (PITR)** | `pitr.md` | The ability to restore a database to any specific moment in time by combining a base backup with WAL archives — PostgreSQL's most powerful disaster recovery strategy, going far beyond what `pg_dump` alone can offer. |
| 135 | **Table Partitioning** | `table_partitioning.md` | Splitting a large table into smaller, more manageable physical pieces (partitions) based on a column value (e.g., date ranges), improving query performance. |
| 136 | **Full-Text Search (`tsvector`, `tsquery`)** | `full_text_search.md` | PostgreSQL's built-in system for searching natural language text — tokenizing, stemming, ranking, and indexing documents without external tools. |
| 137 | **Extensions (`CREATE EXTENSION`)** | `extensions.md` | Installable modules that add functionality to PostgreSQL — from UUID generation (`uuid-ossp`/`pgcrypto`) to geospatial data (`PostGIS`) to fuzzy matching (`pg_trgm`). |
| 138 | **Replication (Streaming / Logical)** | `replication.md` | The process of copying data from a primary PostgreSQL server to one or more replica servers for high availability, disaster recovery, or read scaling. |
| 139 | **`LISTEN` / `NOTIFY`** | `listen_notify.md` | PostgreSQL's built-in pub/sub messaging system that allows database connections to send and receive real-time event notifications. |
| 140 | **Foreign Data Wrappers (`postgres_fdw`)** | `foreign_data_wrappers.md` | A mechanism to query external data sources (other PostgreSQL instances, MySQL, CSV files, APIs) as if they were local tables. |
| 141 | **Database Migrations** | `database_migrations.md` | The practice of version-controlling database schema changes using sequential migration files, enabling reproducible and reversible schema evolution. |
| 142 | **ORM vs Query Builder vs Raw SQL** | `orm_vs_raw.md` | The three approaches to writing database queries from application code: Object-Relational Mappers (Prisma, TypeORM), query builders (Drizzle, Knex), and raw SQL. |
| 143 | **`pg_stat_statements` / Monitoring** | `monitoring.md` | Extensions and system views for tracking query performance, identifying slow queries, and monitoring database health in production. |
| 144 | **Managed PostgreSQL Services (Supabase, Neon, AWS RDS)** | `managed_services.md` | Cloud-hosted PostgreSQL platforms that handle server provisioning, backups, scaling, and maintenance, letting developers focus on building applications. |

---

> **Total: 144 terms** (120 original + 24 gap terms) covering PostgreSQL from "what is a database?" to production-ready architecture, designed for progressive learning by a junior full-stack developer.
