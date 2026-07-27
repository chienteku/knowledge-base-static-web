# SDK `.query()` with Parameters

> **Level 10 — SDKs, Deployment & Production**
> Executing raw SurrealQL query strings through client SDKs using parameterized variable maps (`$param`) for complex queries, transactions, and multi-statement execution.

---

## 1. Prerequisites
- [JavaScript / TypeScript SDK](js_sdk.md) — The `surrealdb` client package.
- [SurrealQL Injection Prevention](../level_08/injection_prevention.md) — Parameterized query security.
- [Parameters (`$param`)](../level_06/parameters.md) — Parameter binding syntax.

---

## 2. Term Category
- **SDK Methods & Querying**

---

## 3. Environment Context
- **Client Application Code** (Used when executing complex analytical queries, graph traversals, subqueries, or multi-statement transactions).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While high-level CRUD methods (`.select()`, `.create()`) handle simple single-table operations, real-world applications frequently require advanced SurrealQL features: graph traversals (`->wrote->post`), record link fetching (`FETCH`), aggregation (`GROUP BY`), conditional blocks (`IF/ELSE`), or multi-statement transactions (`BEGIN ... COMMIT`).

The SDK `.query()` method allows developers to execute arbitrary raw SurrealQL strings. To maintain security, `.query()` accepts a second parameter: a key-value object containing query variables. SurrealDB binds these variables safely on the server, guaranteeing complete immunity against SurrealQL injection attacks.

### (2) Reality Metaphor
Think of an online banking form:
- You fill out a pre-structured transfer template by supplying inputs in designated fields (`Account Number`, `Amount`). The banking backend treats your input strictly as data parameters, refusing to process any arbitrary malicious system instructions pasted into the `Amount` box.

### (3) Code Examples

#### Short Snippet
```typescript
// Executing a raw SurrealQL query with parameterized bindings
const [results] = await db.query<[User[]]>(
    'SELECT * FROM user WHERE age >= $min_age AND active = $status',
    { min_age: 21, status: true }
);
```

#### Fuller Example
```typescript
import { Surreal, RecordId } from 'surrealdb';

interface PostDetails {
    id: RecordId<'post'>;
    title: string;
    author: {
        id: RecordId<'user'>;
        name: string;
    };
}

async function fetchUserPosts(db: Surreal, authorId: RecordId<'user'>) {
    // 1. Raw SurrealQL string with FETCH and parameter binding
    const query = `
        SELECT
            id,
            title,
            author
        FROM post
        WHERE author = $author_id AND published = true
        FETCH author;
    `;

    // 2. Execute query safely with variables map
    const [posts] = await db.query<[PostDetails[]]>(query, {
        author_id: authorId
    });

    console.log('Fetched author posts with inline resolved data:', posts);
    return posts;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that `.query()` Returns an Array of Result Sets

**The mistake:** Expecting `await db.query(...)` to return a single array of records directly.

**Why it's wrong:** A SurrealQL query string can contain *multiple* statements separated by semicolons (`SELECT * FROM a; SELECT * FROM b;`). Therefore, `.query()` returns an array of result objects (one per statement). Destructuring `const [result] = await db.query(...)` extracts the first statement's result.

*Incorrect:*
```typescript
// Error! db.query returns [ [records] ], not [records]
const users = await db.query('SELECT * FROM user');
console.log(users.map(u => u.name)); // TypeError!
```

*Fix:*
```typescript
// Destructure the first statement result set
const [users] = await db.query<[User[]]>('SELECT * FROM user');
console.log(users.map(u => u.name)); // Works!
```

---



### Mistake 2: Concatenating Untrusted Client Variables into `db.query()` Strings

**The mistake:** Calling `db.query('SELECT * FROM user WHERE name = "' + name + '"')`.

**Why it's wrong:** String concatenation introduces SQL injection vulnerabilities. Always pass parameters using `$var` placeholders and parameter objects.

*Incorrect:*
```surrealql
await db.query(`SELECT * FROM user WHERE name = '${input}'`); // ❌ Injection risk!
```

*Fix:*
```surrealql
await db.query('SELECT * FROM user WHERE name = $name', { name: input }); // Safe parameter binding
```

### Mistake 3: Expecting `db.query()` to Return a Single Unwrapped Record Result directly

**The mistake:** Expecting `const user = await db.query('SELECT * FROM user:alice')` to return `{ id: user:alice }`.

**Why it's wrong:** `db.query()` returns an array of response objects `[{ status: 'OK', result: [...] }]`. Un-array the batch response array.

*Incorrect:*
```surrealql
const user = await db.query('SELECT * FROM user:alice'); // ❌ Returns response array, not user object!
```

*Fix:*
```surrealql
const [res] = await db.query('SELECT * FROM user:alice'); const user = res.result[0];
```



### Mistake 4: Concatenating Untrusted Client Variables into `db.query()` Strings

**The mistake:** Calling `db.query('SELECT * FROM user WHERE name = "' + name + '"')`.

**Why it's wrong:** String concatenation introduces SQL injection vulnerabilities. Always pass parameters using `$var` placeholders and parameter objects.

*Incorrect:*
```surrealql
await db.query(`SELECT * FROM user WHERE name = '${input}'`); // ❌ Injection risk!
```

*Fix:*
```surrealql
await db.query('SELECT * FROM user WHERE name = $name', { name: input }); // Safe parameter binding
```

### Mistake 5: Expecting `db.query()` to Return a Single Unwrapped Record Result directly

**The mistake:** Expecting `const user = await db.query('SELECT * FROM user:alice')` to return `{ id: user:alice }`.

**Why it's wrong:** `db.query()` returns an array of response objects `[{ status: 'OK', result: [...] }]`. Un-array the batch response array.

*Incorrect:*
```surrealql
const user = await db.query('SELECT * FROM user:alice'); // ❌ Returns response array, not user object!
```

*Fix:*
```surrealql
const [res] = await db.query('SELECT * FROM user:alice'); const user = res.result[0];
```

## 6. Practice Exercises

### Exercise 1: Write Parameterized SDK Query
Write a `.query()` call that fetches all records from table `invoice` where `amount > $min_val` and `status = $status`, passing `$min_val = 500` and `$status = 'unpaid'`.

> [!check]- Answer
> - Pass SQL string with `$min_val` and `$status`.
> - Pass `{ min_val: 500, status: 'unpaid' }` as 2nd parameter.

---



### Exercise 2: Parameterized SDK Batch Query

**Problem:** Execute batch query setting `$u` and selecting user with parameter `{ id: "user:alice" }`.

**Expected output:**
```text
await db.query('LET $u = $id; SELECT * FROM $u;', { id: "user:alice" });
```

> [!check]- Answer
> ```javascript
> const [letRes, selectRes] = await db.query(
>   'LET $u = $id; SELECT * FROM $u;',
>   { id: "user:alice" }
> );
> ```
>
> **Explanation:** `db.query(sql, params)` executes multi-statement SurrealQL scripts safely.

### Exercise 3: Destructuring Multi-Statement Batch Query Responses

**Problem:** Destructure response array from `db.query('SELECT * FROM user; SELECT * FROM product;')`.

**Expected output:**
```text
const [usersRes, productsRes] = await db.query(...);
```

> [!check]- Answer
> ```javascript
> const [usersRes, productsRes] = await db.query(
>   'SELECT * FROM user; SELECT * FROM product;'
> );
> const users = usersRes.result;
> const products = productsRes.result;
> ```
>
> **Explanation:** `db.query()` returns array elements corresponding to each semicolon-separated statement.



### Exercise 4: Parameterized SDK Batch Query

**Problem:** Execute batch query setting `$u` and selecting user with parameter `{ id: "user:alice" }`.

**Expected output:**
```text
await db.query('LET $u = $id; SELECT * FROM $u;', { id: "user:alice" });
```

> [!check]- Answer
> ```javascript
> const [letRes, selectRes] = await db.query(
>   'LET $u = $id; SELECT * FROM $u;',
>   { id: "user:alice" }
> );
> ```
>
> **Explanation:** `db.query(sql, params)` executes multi-statement SurrealQL scripts safely.

### Exercise 5: Destructuring Multi-Statement Batch Query Responses

**Problem:** Destructure response array from `db.query('SELECT * FROM user; SELECT * FROM product;')`.

**Expected output:**
```text
const [usersRes, productsRes] = await db.query(...);
```

> [!check]- Answer
> ```javascript
> const [usersRes, productsRes] = await db.query(
>   'SELECT * FROM user; SELECT * FROM product;'
> );
> const users = usersRes.result;
> const products = productsRes.result;
> ```
>
> **Explanation:** `db.query()` returns array elements corresponding to each semicolon-separated statement.

## 7. Related Terms
- [SurrealQL Injection Prevention](../level_08/injection_prevention.md) — Security protections.
- [SDK CRUD Methods (`.select()` / `.create()` / `.update()` / `.delete()`)](sdk_crud.md) — High-level CRUD alternative.
- [Parameters (`$param`)](../level_06/parameters.md) — Parameter syntax details.

---

## 8. Key Takeaways
- `db.query()` executes raw SurrealQL query strings with variable parameter maps.
- Always use the second parameter object `{ key: value }` for dynamic input to prevent injection attacks.
- Destructure return values (`const [result] = await db.query(...)`) to access individual statement result sets.
