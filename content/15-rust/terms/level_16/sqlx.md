# `sqlx`

> **Level 16 — Ecosystem & Tooling**
> The popular async-first SQL database driver framework in Rust — featuring compile-time checked SQL queries (`query!`), pure Rust database drivers (PostgreSQL, MySQL, SQLite, MSSQL), connection pooling, and built-in database migration support.

---

## 1. Prerequisites


- [`tokio`](tokio.md) — Asynchronous runtime powering `sqlx`.
- [`serde`](serde.md) — Used for JSON column mappings and struct conversions.
- [`async` / `.await`](../level_09/async_await.md) — Asynchronous database query execution.

---

## 2. Term Category



**Rust Ecosystem Crate (compile-time SQL query validator & async ORM)**: `sqlx` is an asynchronous SQL library for Rust that connects directly to relational databases. Unlike traditional Object-Relational Mappers (ORMs) that hide SQL behind custom query builder methods, `sqlx` lets you write raw SQL statements while using the Rust compiler to validate SQL syntax, table schemas, and column types **at compile time**.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional languages, SQL queries are plain strings parsed at runtime:
```python
# Python/JS runtime SQL error: Typo in column name 'usrname' fails at runtime!
cursor.execute("SELECT usrname FROM users WHERE id = %s", [user_id])
```
If a developer makes a typo in a column name or changes a database column from integer to string, the code compiles fine and crashes in production when the query runs.

ORMs (like Hibernate or Entity Framework) avoid raw string errors by wrapping database tables in complex OOP classes, but generate inefficient SQL queries and hide the power of native database features.

`sqlx` introduces **Compile-Time Checked Raw SQL (`query!`)**:
1. During `cargo build`, the `query!` macro connects to a live development database (or an offline schema cache `.sqlx/`).
2. It parses the raw SQL query, checks table names, validates column data types against database schemas, and verifies nullability.
3. If you type a wrong column name (`usrname`), **`cargo build` fails instantly** before any code is deployed to production!

### (2) Code Examples

#### Compile-Time Checked PostgreSQL Query with `sqlx`

```rust
use sqlx::{PgPool, FromRow};

#[derive(Debug, FromRow)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub email: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Connect to PostgreSQL database pool
    let db_url = "postgres://postgres:password@localhost/mydb";
    let pool = PgPool::connect(db_url).await?;

    let target_id = 42i64;

    // 2. Compile-Time Checked Query Macro!
    // `query_as!` validates `users` table schema, column names, and types at compile time!
    let user = sqlx::query_as!(
        User,
        r#"
        SELECT id, username, email
        FROM users
        WHERE id = $1
        "#,
        target_id
    )
    .fetch_optional(&pool)
    .await?;

    match user {
        Some(u) => println!("Found user: {} ({})", u.username, u.email),
        None => println!("User not found"),
    }

    Ok(())
}
```

---

## 4. Common Mistakes & Pitfalls
### Mistake 2: Forgetting Transaction Commitment (`tx.commit().await`) Before Out of Scope Drop

**The mistake:** Executing queries inside `pool.begin().await` without calling `tx.commit().await`.

**Why it's wrong:** Dropping an uncommitted transaction automatically triggers a SQL `ROLLBACK`, discarding all database mutations silently.

*Fix:* Always end database transaction blocks with `tx.commit().await?`.

### Mistake 3: Querying Nullable Database Columns Without Wrapping Rust Struct Fields in `Option<T>`

**The mistake:** Mapping a nullable SQL column (e.g. `TEXT NULL`) to a non-optional Rust field `String`.

**Why it's wrong:** When a `NULL` row is fetched, `sqlx` raises a runtime decoding error (`DecodeError`).

*Fix:* Wrap nullable SQL column fields in `Option<T>` (e.g., `Option<String>`).


### Mistake 1: Forgetting `DATABASE_URL` during Compile-Time Build

**The mistake:** Running `cargo build` on code using `sqlx::query!` without specifying a `DATABASE_URL` environment variable or offline metadata cache (`.sqlx`).

**Why it's wrong:** The `query!` macro needs to inspect a live database schema or cached schema JSON file at compile time to validate query types.

*Fix:*
```bash
# Set DATABASE_URL or use sqlx-cli offline mode:
export DATABASE_URL="postgres://postgres:password@localhost/mydb"
cargo build
```

---

## 5. Practice Exercises

### Exercise 1: Transactional Financial Ledger & Programmatic Schema Migrations

**Scenario:**
In financial backend services, balance transfers between user accounts must be atomic, isolated, and safe against partial runtime failures. Furthermore, applications need programmatic database migrations to set up schemas dynamically.

Implement an async Rust module using `sqlx` and SQLite (`SqlitePool`) that:
1. Programmatically applies database schema migrations to create an `accounts` table with check constraints (`balance_cents >= 0`).
2. Executes an atomic balance transfer between two accounts inside an `sqlx::Transaction`.
3. Returns a custom `TransferError::InsufficientFunds` and automatically rolls back the transaction if the sender's balance is inadequate.
4. Includes complete `#[tokio::test]` unit tests verifying successful transfers, updated balances, and transactional rollback on insufficient funds.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use sqlx::{sqlite::SqlitePoolOptions, FromRow, SqlitePool, Transaction, Sqlite};
> use std::error::Error;
>
> #[derive(Debug, FromRow, PartialEq, Eq)]
> pub struct Account {
>     pub id: i64,
>     pub owner: String,
>     pub balance_cents: i64,
> }
>
> #[derive(Debug, PartialEq, Eq)]
> pub enum TransferError {
>     AccountNotFound(i64),
>     InsufficientFunds { account_id: i64, balance: i64, required: i64 },
>     DatabaseError(String),
> }
>
> impl std::fmt::Display for TransferError {
>     fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
>         match self {
>             TransferError::AccountNotFound(id) => write!(f, "Account {} not found", id),
>             TransferError::InsufficientFunds { account_id, balance, required } => {
>                 write!(f, "Account {} balance {} insufficient for required {}", account_id, balance, required)
>             }
>             TransferError::DatabaseError(msg) => write!(f, "Database error: {}", msg),
>         }
>     }
> }
>
> impl Error for TransferError {}
>
> pub async fn setup_database() -> Result<SqlitePool, sqlx::Error> {
>     let pool = SqlitePoolOptions::new()
>         .max_connections(5)
>         .connect("sqlite::memory:")
>         .await?;
>
>     // Apply initial schema migration
>     sqlx::query(
>         r#"
>         CREATE TABLE accounts (
>             id INTEGER PRIMARY KEY AUTOINCREMENT,
>             owner TEXT NOT NULL,
>             balance_cents INTEGER NOT NULL CHECK (balance_cents >= 0)
>         );
>         "#,
>     )
>     .execute(&pool)
>     .await?;
>
>     Ok(pool)
> }
>
> pub async fn create_account(pool: &SqlitePool, owner: &str, initial_balance: i64) -> Result<i64, sqlx::Error> {
>     let id = sqlx::query_scalar::<_, i64>(
>         "INSERT INTO accounts (owner, balance_cents) VALUES (?, ?) RETURNING id"
>     )
>     .bind(owner)
>     .bind(initial_balance)
>     .fetch_one(pool)
>     .await?;
>
>     Ok(id)
> }
>
> pub async fn get_account(pool: &SqlitePool, id: i64) -> Result<Option<Account>, sqlx::Error> {
>     sqlx::query_as::<_, Account>(
>         "SELECT id, owner, balance_cents FROM accounts WHERE id = ?"
>     )
>     .bind(id)
>     .fetch_optional(pool)
>     .await
> }
>
> pub async fn transfer_funds(
>     pool: &SqlitePool,
>     from_id: i64,
>     to_id: i64,
>     amount_cents: i64,
> ) -> Result<(), TransferError> {
>     if amount_cents <= 0 {
>         return Err(TransferError::DatabaseError("Transfer amount must be positive".into()));
>     }
>
>     let mut tx: Transaction<'_, Sqlite> = pool
>         .begin()
>         .await
>         .map_err(|e| TransferError::DatabaseError(e.to_string()))?;
>
>     // 1. Fetch sender balance inside transaction scope
>     let sender = sqlx::query_as::<_, Account>(
>         "SELECT id, owner, balance_cents FROM accounts WHERE id = ?"
>     )
>     .bind(from_id)
>     .fetch_optional(&mut *tx)
>     .await
>     .map_err(|e| TransferError::DatabaseError(e.to_string()))?
>     .ok_or(TransferError::AccountNotFound(from_id))?;
>
>     if sender.balance_cents < amount_cents {
>         // Returning an error early drops `tx` without calling `.commit()`,
>         // automatically triggering a ROLLBACK on the underlying SQLite connection.
>         return Err(TransferError::InsufficientFunds {
>             account_id: from_id,
>             balance: sender.balance_cents,
>             required: amount_cents,
>         });
>     }
>
>     // 2. Verify receiver exists
>     let _receiver = sqlx::query_as::<_, Account>(
>         "SELECT id, owner, balance_cents FROM accounts WHERE id = ?"
>     )
>     .bind(to_id)
>     .fetch_optional(&mut *tx)
>     .await
>     .map_err(|e| TransferError::DatabaseError(e.to_string()))?
>     .ok_or(TransferError::AccountNotFound(to_id))?;
>
>     // 3. Deduct from sender
>     sqlx::query("UPDATE accounts SET balance_cents = balance_cents - ? WHERE id = ?")
>         .bind(amount_cents)
>         .bind(from_id)
>         .execute(&mut *tx)
>         .await
>         .map_err(|e| TransferError::DatabaseError(e.to_string()))?;
>
>     // 4. Credit receiver
>     sqlx::query("UPDATE accounts SET balance_cents = balance_cents + ? WHERE id = ?")
>         .bind(amount_cents)
>         .bind(to_id)
>         .execute(&mut *tx)
>         .await
>         .map_err(|e| TransferError::DatabaseError(e.to_string()))?;
>
>     // 5. Commit transaction atomically
>     tx.commit()
>         .await
>         .map_err(|e| TransferError::DatabaseError(e.to_string()))?;
>
>     Ok(())
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[tokio::test]
>     async fn test_successful_fund_transfer() {
>         let pool = setup_database().await.expect("Database setup failed");
>         let alice_id = create_account(&pool, "Alice", 1000).await.unwrap();
>         let bob_id = create_account(&pool, "Bob", 500).await.unwrap();
>
>         let result = transfer_funds(&pool, alice_id, bob_id, 300).await;
>         assert!(result.is_ok(), "Transfer should succeed");
>
>         let alice = get_account(&pool, alice_id).await.unwrap().unwrap();
>         let bob = get_account(&pool, bob_id).await.unwrap().unwrap();
>
>         assert_eq!(alice.balance_cents, 700);
>         assert_eq!(bob.balance_cents, 800);
>     }
>
>     #[tokio::test]
>     async fn test_insufficient_funds_rollback() {
>         let pool = setup_database().await.expect("Database setup failed");
>         let alice_id = create_account(&pool, "Alice", 200).await.unwrap();
>         let bob_id = create_account(&pool, "Bob", 500).await.unwrap();
>
>         let result = transfer_funds(&pool, alice_id, bob_id, 500).await;
>         assert!(
>             matches!(result, Err(TransferError::InsufficientFunds { .. })),
>             "Expected InsufficientFunds error"
>         );
>
>         // Verify balances remain untouched due to transaction rollback
>         let alice = get_account(&pool, alice_id).await.unwrap().unwrap();
>         let bob = get_account(&pool, bob_id).await.unwrap().unwrap();
>
>         assert_eq!(alice.balance_cents, 200);
>         assert_eq!(bob.balance_cents, 500);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Connection Pooling & Migrations (`SqlitePool`):** `SqlitePoolOptions` manages a pool of non-blocking database connections. Executing `CREATE TABLE` queries programmatically on initialization guarantees schema presence.
> 2. **Transaction Scoping (`pool.begin()`):** `pool.begin().await` starts an isolated SQL transaction. By passing `&mut *tx` as an executor to `fetch_optional` or `execute`, queries execute strictly within that transaction boundary.
> 3. **Automatic RAII Rollback:** If an error occurs (such as insufficient balance) and `tx.commit()` is never called, Rust's `Drop` implementation on `Transaction` automatically issues an SQL `ROLLBACK` when `tx` goes out of scope.
> 4. **Row Mapping (`sqlx::FromRow`):** Automatically maps SQL column names to struct field names, eliminating boilerplate deserialization logic.
> 
---

### Exercise 2: Custom Domain Enums and Serde JSON Payload Columns

**Scenario:**
Modern web backends store state machine enums as string columns and nested payload data (e.g., shopping cart items) as JSON/JSONB text columns. Manual conversion between raw strings/JSON text and strongly typed Rust data structures creates boilerplate and risks parsing errors.

Implement an order management repository in Rust using `sqlx` and SQLite that:
1. Defines an `OrderStatus` enum (`Pending`, `Processing`, `Shipped`, `Cancelled`) annotated with `#[derive(sqlx::Type, Serialize, Deserialize)]`.
2. Defines an `OrderItem` struct and an `Order` struct containing `items: sqlx::types::Json<Vec<OrderItem>>`.
3. Implements async functions to create new orders and retrieve orders by `OrderStatus`.
4. Writes unit tests using `#[tokio::test]` asserting that complex Rust types serialize into SQLite TEXT columns and deserialize back into strongly typed Rust models.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use serde::{Deserialize, Serialize};
> use sqlx::{sqlite::SqlitePoolOptions, types::Json, FromRow, SqlitePool};
>
> #[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
> #[sqlx(type_name = "TEXT", rename_all = "snake_case")]
> pub enum OrderStatus {
>     Pending,
>     Processing,
>     Shipped,
>     Cancelled,
> }
>
> #[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
> pub struct OrderItem {
>     pub product_id: String,
>     pub quantity: u32,
>     pub price_cents: u64,
> }
>
> #[derive(Debug, Clone, FromRow, PartialEq, Eq)]
> pub struct Order {
>     pub id: i64,
>     pub customer_email: String,
>     pub status: OrderStatus,
>     pub items: Json<Vec<OrderItem>>,
>     pub created_at: String,
> }
>
> pub async fn setup_order_db() -> Result<SqlitePool, sqlx::Error> {
>     let pool = SqlitePoolOptions::new()
>         .connect("sqlite::memory:")
>         .await?;
>
>     sqlx::query(
>         r#"
>         CREATE TABLE orders (
>             id INTEGER PRIMARY KEY AUTOINCREMENT,
>             customer_email TEXT NOT NULL,
>             status TEXT NOT NULL,
>             items TEXT NOT NULL,
>             created_at TEXT NOT NULL
>         );
>         "#,
>     )
>     .execute(&pool)
>     .await?;
>
>     Ok(pool)
> }
>
> pub async fn create_order(
>     pool: &SqlitePool,
>     email: &str,
>     items: Vec<OrderItem>,
> ) -> Result<Order, sqlx::Error> {
>     let status = OrderStatus::Pending;
>     let items_json = Json(items);
>     let created_at = "2026-07-30T17:00:00Z".to_string();
>
>     let id = sqlx::query_scalar::<_, i64>(
>         r#"
>         INSERT INTO orders (customer_email, status, items, created_at)
>         VALUES (?, ?, ?, ?)
>         RETURNING id
>         "#,
>     )
>     .bind(email)
>     .bind(&status)
>     .bind(&items_json)
>     .bind(&created_at)
>     .fetch_one(pool)
>     .await?;
>
>     Ok(Order {
>         id,
>         customer_email: email.to_string(),
>         status,
>         items: items_json,
>         created_at,
>     })
> }
>
> pub async fn get_orders_by_status(
>     pool: &SqlitePool,
>     status: OrderStatus,
> ) -> Result<Vec<Order>, sqlx::Error> {
>     sqlx::query_as::<_, Order>(
>         "SELECT id, customer_email, status, items, created_at FROM orders WHERE status = ?"
>     )
>     .bind(status)
>     .fetch_all(pool)
>     .await
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[tokio::test]
>     async fn test_enum_and_json_mapping() {
>         let pool = setup_order_db().await.expect("DB setup failed");
>
>         let items = vec![
>             OrderItem {
>                 product_id: "RUST-BOOK-001".into(),
>                 quantity: 2,
>                 price_cents: 4500,
>             },
>             OrderItem {
>                 product_id: "KEYBOARD-MK2".into(),
>                 quantity: 1,
>                 price_cents: 12000,
>             },
>         ];
>
>         let order = create_order(&pool, "dev@example.com", items.clone())
>             .await
>             .expect("Failed to create order");
>
>         assert_eq!(order.status, OrderStatus::Pending);
>         assert_eq!(order.items.len(), 2);
>         assert_eq!(order.items[0].product_id, "RUST-BOOK-001");
>
>         let pending_orders = get_orders_by_status(&pool, OrderStatus::Pending)
>             .await
>             .expect("Query failed");
>
>         assert_eq!(pending_orders.len(), 1);
>         assert_eq!(pending_orders[0].id, order.id);
>         assert_eq!(pending_orders[0].items.0, items);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Custom Enum Type Mapping (`#[derive(sqlx::Type)]`):** Automatically maps the Rust `OrderStatus` enum to string representations in the database (`"pending"`, `"processing"`, etc.), allowing direct binding in SQL queries without manual `.to_string()` or `match` blocks.
> 2. **JSON Column Wrapper (`sqlx::types::Json<T>`):** Wraps any Serde-serializable type (`Vec<OrderItem>`) to serialize it directly to JSON text when writing to the database, and automatically parse JSON text back into Rust structs when reading query results.
> 3. **Type Safety:** Ensures that invalid enum values or corrupted JSON strings trigger type decoding errors during database fetch operations instead of silently corrupting domain data.
> 
---

### Exercise 3: Dynamic SQL Query Construction using `sqlx::QueryBuilder`

**Scenario:**
While `sqlx::query!` macro enforces compile-time SQL validation, real-world REST search APIs require building dynamic SQL queries based on optional user filters (`role`, `is_active`, substring pattern, and `LIMIT`/`OFFSET` pagination). String concatenation leads to SQL injection security flaws.

Implement an async user search service using `sqlx::QueryBuilder` in Rust for SQLite that:
1. Defines a `User` entity and a `UserFilter` struct with optional fields (`role`, `is_active`, `name_contains`, `limit`, `offset`).
2. Dynamically builds parameterized SQL queries using `sqlx::QueryBuilder` without vulnerable string interpolation.
3. Executes the query and returns `Vec<User>`.
4. Writes unit tests verifying multi-condition filtering and pagination with `assert_eq!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use sqlx::{sqlite::SqlitePoolOptions, FromRow, QueryBuilder, Sqlite, SqlitePool};
>
> #[derive(Debug, Clone, FromRow, PartialEq, Eq)]
> pub struct User {
>     pub id: i64,
>     pub username: String,
>     pub role: String,
>     pub is_active: bool,
> }
>
> #[derive(Debug, Default)]
> pub struct UserFilter {
>     pub role: Option<String>,
>     pub is_active: Option<bool>,
>     pub name_contains: Option<String>,
>     pub limit: Option<i64>,
>     pub offset: Option<i64>,
> }
>
> pub async fn find_users(
>     pool: &SqlitePool,
>     filter: UserFilter,
> ) -> Result<Vec<User>, sqlx::Error> {
>     let mut builder: QueryBuilder<Sqlite> =
>         QueryBuilder::new("SELECT id, username, role, is_active FROM users WHERE 1=1");
>
>     if let Some(role) = &filter.role {
>         builder.push(" AND role = ").push_bind(role);
>     }
>
>     if let Some(is_active) = filter.is_active {
>         builder.push(" AND is_active = ").push_bind(is_active);
>     }
>
>     if let Some(pattern) = &filter.name_contains {
>         let search_pattern = format!("%{}%", pattern);
>         builder.push(" AND username LIKE ").push_bind(search_pattern);
>     }
>
>     builder.push(" ORDER BY id ASC");
>
>     if let Some(limit) = filter.limit {
>         builder.push(" LIMIT ").push_bind(limit);
>     }
>
>     if let Some(offset) = filter.offset {
>         builder.push(" OFFSET ").push_bind(offset);
>     }
>
>     let query = builder.build_query_as::<User>();
>     query.fetch_all(pool).await
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[tokio::test]
>     async fn test_dynamic_user_search() {
>         let pool = SqlitePoolOptions::new()
>             .connect("sqlite::memory:")
>             .await
>             .unwrap();
>
>         sqlx::query(
>             r#"
>             CREATE TABLE users (
>                 id INTEGER PRIMARY KEY AUTOINCREMENT,
>                 username TEXT NOT NULL,
>                 role TEXT NOT NULL,
>                 is_active BOOLEAN NOT NULL
>             );
>             "#,
>         )
>         .execute(&pool)
>         .await
>         .unwrap();
>
>         sqlx::query(
>             "INSERT INTO users (username, role, is_active) VALUES 
>              ('alice_dev', 'admin', 1),
>              ('bob_qa', 'user', 1),
>              ('charlie_dev', 'user', 0),
>              ('david_admin', 'admin', 1)",
>         )
>         .execute(&pool)
>         .await
>         .unwrap();
>
>         // Test 1: Filter active admins
>         let active_admins = find_users(
>             &pool,
>             UserFilter {
>                 role: Some("admin".into()),
>                 is_active: Some(true),
>                 ..Default::default()
>             },
>         )
>         .await
>         .unwrap();
>
>         assert_eq!(active_admins.len(), 2);
>         assert_eq!(active_admins[0].username, "alice_dev");
>         assert_eq!(active_admins[1].username, "david_admin");
>
>         // Test 2: Search name substring with limit
>         let dev_users = find_users(
>             &pool,
>             UserFilter {
>                 name_contains: Some("dev".into()),
>                 limit: Some(1),
>                 ..Default::default()
>             },
>         )
>         .await
>         .unwrap();
>
>         assert_eq!(dev_users.len(), 1);
>         assert_eq!(dev_users[0].username, "alice_dev");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Safe Dynamic SQL (`QueryBuilder`):** Allows appending dynamic SQL clauses while preserving binding parameter placeholders (`push_bind`). This ensures that user inputs are safely escaped and separated from the SQL execution plan, preventing SQL injection vulnerabilities.
> 2. **Type-Safe Dynamic Mapping (`build_query_as::<User>()`):** Automatically maps dynamically generated SQL result columns into the target `User` struct using `sqlx::FromRow`.
> 3. **Dynamic Pagination & Filtering:** Demonstrates how production APIs handle optional URL parameters seamlessly without requiring complex ORM query DSLs.
> 
---


## 6. Related Terms

- None!

---

## 7. Key Takeaways

- `sqlx` is an async-first SQL library supporting PostgreSQL, MySQL, SQLite, and MSSQL.
- The `query!` and `query_as!` macros validate raw SQL queries against actual database schemas at compile time.
- Operates asynchronously with connection pooling (`PgPool`, `SqlitePool`).
- Eliminates runtime SQL syntax and type mismatch bugs before deployment.
