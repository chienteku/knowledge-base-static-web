# SDK CRUD Methods (`.select()` / `.create()` / `.update()` / `.delete()`)

> **Level 10 — SDKs, Deployment & Production**
> Ergonomic, type-safe client SDK methods that execute standard Create, Read, Update, and Delete operations without needing manual SurrealQL string formatting.

---

## 1. Prerequisites

- [JavaScript / TypeScript SDK](js_sdk.md) — The `surrealdb` client package.
- [SDK Connection Lifecycle (`connect` / `use` / `signin` / `close`)](sdk_connection.md) — Connection setup sequence.

---

## 2. Term Category


**Integration / Ecosystem (SDK type-safe CRUD operation API)**: - **SDK Methods & API**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: SDK Record Creation and Selection

**Scenario:**
Use the JavaScript SDK to create a new user record with `db.create()` and fetch it with `db.select()`.

**Requirements:**
1. Execute `db.create("user:alice", { name: "Alice" })`.
2. Execute `db.select("user:alice")`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface User {
>   id: string;
>   name: string;
> }
> 
> // Create record
> const alice = await db.create<User>("user:alice", { name: "Alice Smith" });
> 
> // Select record by primary key
> const record = await db.select<User>("user:alice");
> console.log("Fetched user:", record?.name);
> ```
> 
> #### Technical Explanation
>
> 1. `db.create(id, content)` inserts a new record and returns the created document object.
> 2. `db.select(id)` fetches a single record by ID in $O(1)$ constant time.
> 3. Returns typed TypeScript objects.
> 
---

### Exercise 2: Partial Document Merging with `db.merge()`

**Scenario:**
Update user `user:alice`'s email address using `db.merge()` without erasing existing name properties.

**Requirements:**
1. Execute `db.merge("user:alice", { email: "alice@example.com" })`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const updated = await db.merge<User>("user:alice", {
>   email: "alice@example.com"
> });
> ```
>
> #### Technical Explanation
>
> 1. `db.merge(id, patch)` performs a non-destructive shallow merge on target records.
> 2. Updates specified keys while preserving unmentioned record properties.
> 3. Prevents full-document overwrites.
> 
---

### Exercise 3: Deleting Records with `db.delete()`

**Scenario:**
Delete record `user:alice` using `db.delete()`.

**Requirements:**
1. Execute `await db.delete("user:alice")`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const deleted = await db.delete("user:alice");
> console.log("Deleted record payload:", deleted);
> ```
>
> #### Technical Explanation
>
> 1. `db.delete(id)` deletes the specified record by primary key.
> 2. Returns the deleted record document state.
> 3. Removes the record permanently from persistent storage.
> 
---





## 6. Related Terms

- [JavaScript / TypeScript SDK](js_sdk.md) — SDK package overview.
- [SDK `.query()` with Parameters](sdk_query.md) — Executing complex raw queries.
- [`UPDATE` Strategies (`SET` / `CONTENT` / `MERGE` / `PATCH`)](../level_03/update_strategies.md) — Update operations semantics.

---

## 7. Key Takeaways
- SDK CRUD methods (`select`, `create`, `update`, `merge`, `delete`) provide high-level abstractions over SurrealQL statements.
- Support TypeScript generics (`db.select<T>()`) for compile-time type safety.
- Ideal for standard data operations in web and mobile applications.
