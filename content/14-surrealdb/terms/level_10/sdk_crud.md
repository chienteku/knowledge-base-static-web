# SDK CRUD Methods (`.select()` / `.create()` / `.update()` / `.delete()`)

> **Level 10 — SDKs, Deployment & Production**
> Ergonomic, type-safe client SDK methods that execute standard Create, Read, Update, and Delete operations without needing manual SurrealQL string formatting.

---

## 1. Prerequisites
- [JavaScript / TypeScript SDK](js_sdk.md) — The `surrealdb` client package.
- [SDK Connection Lifecycle](sdk_connection.md) — Connection setup sequence.

---

## 2. Term Category
- **SDK Methods & API**

---

## 3. Environment Context
- **Client Application Code** (Invoked directly in frontend components or backend services for standard data operations).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While the SDK allows executing raw SurrealQL string queries via `.query()`, writing raw query strings for routine CRUD operations (`SELECT * FROM user`, `CREATE user:tobie SET ...`) introduces redundant boilerplate and reduces TypeScript type safety.

SurrealDB's SDK provides high-level CRUD convenience methods:
- **`db.select<T>(target)`**: Fetches all records from a table or a specific record by ID.
- **`db.create<T>(table, data)`**: Inserts a new record into a table.
- **`db.update<T>(target, data)`**: Updates existing record(s).
- **`db.merge<T>(target, data)`**: Deep-merges partial fields into existing record(s).
- **`db.delete<T>(target)`**: Deletes a specific record or table contents.

These methods accept TypeScript generic parameters (e.g. `db.select<User>('user')`), providing full type inference and autocompletion in IDEs.

### (2) Reality Metaphor
Think of driving an automatic vs manual transmission car:
- **`db.query()` (Manual)**: Manually working the clutch and gear stick (writing raw SurrealQL syntax) for full low-level control.
- **SDK CRUD Methods (Automatic)**: Putting the car in Drive (`db.select('user')`) and letting the SDK automatically shift into the correct SurrealQL queries under the hood.

### (3) Code Examples

#### Short Snippet
```typescript
// Fetch all records from 'product' table with type safety
interface Product { id: RecordId<'product'>; title: string; price: number; }
const products = await db.select<Product>('product');
```

#### Fuller Example
```typescript
import { Surreal, RecordId } from 'surrealdb';

interface User {
    id?: RecordId<'user'>;
    name: string;
    email: string;
    active: boolean;
}

async function runCrudExamples(db: Surreal) {
    // 1. CREATE: Insert a new record
    const newUser = await db.create<User>('user', {
        name: 'Alice Smith',
        email: 'alice@example.com',
        active: true
    });
    console.log('Created user:', newUser);

    // 2. SELECT: Fetch a specific record by ID
    const fetchedUser = await db.select<User>(newUser.id);
    console.log('Fetched user:', fetchedUser);

    // 3. MERGE: Update only specified fields
    const updatedUser = await db.merge<User>(newUser.id, {
        active: false
    });
    console.log('Merged user:', updatedUser);

    // 4. DELETE: Remove the record
    await db.delete(newUser.id);
    console.log('Deleted record successfully.');
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Passing Table Names as Raw Strings without Proper Types

**The mistake:** Calling `db.select('user')` without supplying a TypeScript interface generic, returning `unknown[]` types.

**Why it's wrong:** Omitting the generic parameter loses TypeScript's compile-time type checking and autocompletion capabilities.

*Incorrect:*
```typescript
// Returns unknown[]; no property autocompletion!
const users = await db.select('user');
console.log(users[0].email); // TypeScript lint warning!
```

*Fix:*
```typescript
interface User { name: string; email: string; }
const users = await db.select<User>('user');
console.log(users[0].email); // Fully typed!
```

---



### Mistake 2: Confusing `db.create()` with `db.upsert()` in SDK Data Mutations

**The mistake:** Calling `db.create('user:alice', data)` when `user:alice` already exists in the database.

**Why it's wrong:** `db.create()` throws an error on primary key collisions. Use `db.upsert()` or `db.merge()` if overwriting or updating existing records is intended.

*Incorrect:*
```surrealql
await db.create("user:alice", { name: "Alice" }); // ❌ Fails if user:alice exists!
```

*Fix:*
```surrealql
await db.upsert("user:alice", { name: "Alice" }); // Safely creates or updates
```

### Mistake 3: Passing Raw Object Input directly into `db.select()` instead of Record ID Strings

**The mistake:** Calling `db.select({ id: 'user:alice' })` (TypeError).

**Why it's wrong:** `db.select()` expects a table string (`'user'`) or a specific Record ID string (`'user:alice'`).

*Incorrect:*
```surrealql
await db.select({ id: "user:alice" }); // ❌ Invalid argument format!
```

*Fix:*
```surrealql
await db.select("user:alice"); // Valid Record ID string
```



### Mistake 4: Confusing `db.create()` with `db.upsert()` in SDK Data Mutations

**The mistake:** Calling `db.create('user:alice', data)` when `user:alice` already exists in the database.

**Why it's wrong:** `db.create()` throws an error on primary key collisions. Use `db.upsert()` or `db.merge()` if overwriting or updating existing records is intended.

*Incorrect:*
```surrealql
await db.create("user:alice", { name: "Alice" }); // ❌ Fails if user:alice exists!
```

*Fix:*
```surrealql
await db.upsert("user:alice", { name: "Alice" }); // Safely creates or updates
```

### Mistake 5: Passing Raw Object Input directly into `db.select()` instead of Record ID Strings

**The mistake:** Calling `db.select({ id: 'user:alice' })` (TypeError).

**Why it's wrong:** `db.select()` expects a table string (`'user'`) or a specific Record ID string (`'user:alice'`).

*Incorrect:*
```surrealql
await db.select({ id: "user:alice" }); // ❌ Invalid argument format!
```

*Fix:*
```surrealql
await db.select("user:alice"); // Valid Record ID string
```

## 6. Practice Exercises

### Exercise 1: Identify Method for Partial Update
Which SDK method should you use to update *only* a user's `email` field without overwriting the entire record?
a. `db.query()`
b. `db.merge()`
c. `db.create()`

> [!check]- Answer
> - `db.merge()` performs partial updates (similar to `UPDATE ... MERGE`).

---



### Exercise 2: SDK CRUD Methods Overview

**Problem:** List JS SDK methods for: 1. Select all records (`db.select`), 2. Create record (`db.create`), 3. Update fields (`db.merge`), 4. Delete (`db.delete`).

**Expected output:**
```text
db.select, db.create, db.merge, db.delete
```

> [!check]- Answer
> ```text
> db.select, db.create, db.merge, db.delete
> ```
>
> **Explanation:** SDK CRUD methods wrap SurrealQL statements into simple asynchronous JS calls.

### Exercise 3: Merging Fields with SDK `db.merge`

**Problem:** Update `user:alice` setting `age = 31` without overwriting other fields using `db.merge()`.

**Expected output:**
```text
await db.merge("user:alice", { age: 31 });
```

> [!check]- Answer
> ```javascript
> await db.merge("user:alice", { age: 31 });
> ```
>
> **Explanation:** `db.merge(id, patch)` performs shallow object merging without replacing records.



### Exercise 4: SDK CRUD Methods Overview

**Problem:** List JS SDK methods for: 1. Select all records (`db.select`), 2. Create record (`db.create`), 3. Update fields (`db.merge`), 4. Delete (`db.delete`).

**Expected output:**
```text
db.select, db.create, db.merge, db.delete
```

> [!check]- Answer
> ```text
> db.select, db.create, db.merge, db.delete
> ```
>
> **Explanation:** SDK CRUD methods wrap SurrealQL statements into simple asynchronous JS calls.

### Exercise 5: Merging Fields with SDK `db.merge`

**Problem:** Update `user:alice` setting `age = 31` without overwriting other fields using `db.merge()`.

**Expected output:**
```text
await db.merge("user:alice", { age: 31 });
```

> [!check]- Answer
> ```javascript
> await db.merge("user:alice", { age: 31 });
> ```
>
> **Explanation:** `db.merge(id, patch)` performs shallow object merging without replacing records.

## 7. Related Terms
- [JavaScript / TypeScript SDK](js_sdk.md) — SDK package overview.
- [SDK `.query()` with Parameters](sdk_query.md) — Executing complex raw queries.
- [`UPDATE` Strategies (`SET` / `CONTENT` / `MERGE` / `PATCH`)](../level_03/update_strategies.md) — Update operations semantics.

---

## 8. Key Takeaways
- SDK CRUD methods (`select`, `create`, `update`, `merge`, `delete`) provide high-level abstractions over SurrealQL statements.
- Support TypeScript generics (`db.select<T>()`) for compile-time type safety.
- Ideal for standard data operations in web and mobile applications.
