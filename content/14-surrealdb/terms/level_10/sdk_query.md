# SDK `.query()` with Parameters

> **Level 10 — SDKs, Deployment & Production**
> Executing raw SurrealQL query strings through client SDKs using parameterized variable maps (`$param`) for complex queries, transactions, and multi-statement execution.

---

## 1. Prerequisites

- [JavaScript / TypeScript SDK](js_sdk.md) — The `surrealdb` client package.
- [SurrealQL Injection Prevention](../level_08/injection_prevention.md) — Parameterized query security.
- [Parameters (`$param`)](../level_06/parameters.md) — Parameter binding syntax.
- [SDK Connection Lifecycle (`connect` / `use` / `signin` / `close`)](sdk_connection.md) — Executing raw SurrealQL queries via SDKs.

---

## 2. Term Category


**Integration / Ecosystem (SDK raw SurrealQL query execution & parameter binding)**: - **SDK Methods & Querying**



---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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





## 5. Practice Exercises

### Exercise 1: Raw SurrealQL Execution with `db.query()`

**Scenario:**
Execute a multi-statement raw SurrealQL script containing parameter bindings using `db.query()`.

**Requirements:**
1. Execute `db.query()` passing SurrealQL string and parameter map.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const [users, orders] = await db.query<[User[], Order[]]>(
>   "SELECT * FROM user WHERE active = $active; SELECT * FROM order;",
>   { active: true }
> );
> 
> console.log("Active users count:", users.length);
> ```
>
> #### Technical Explanation
>
> 1. `db.query(surrealql, params)` executes raw multi-statement SurrealQL scripts.
> 2. Parameter map (`{ active: true }`) binds parameter variables safely, preventing SQL injection.
> 3. Returns a tuple array containing results of each statement in order.

---

### Exercise 2: Type-Safe Tuple Result Destructuring

**Scenario:**
Destructure multi-statement query results into strongly-typed TypeScript array variables.

**Requirements:**
1. Type output tuple array `[User[], Product[]]`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const [userList, productList] = await db.query<[User[], Product[]]>(`
>   SELECT * FROM user;
>   SELECT * FROM product;
> `);
> ```
>
> #### Technical Explanation
>
> 1. Generic tuple types (`<[User[], Product[]]>`) enforce strict typing on multi-statement returns.
> 2. Unpacks array results cleanly.
> 3. Combines raw query flexibility with TypeScript type safety.

---

### Exercise 3: Passing Dynamic Parameters to `db.query()`

**Scenario:**
Pass complex parameters (like record links and datetimes) safely to `db.query()`.

**Requirements:**
1. Pass `{ targetUser: "user:alice", minDate: new Date() }`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const results = await db.query(
>   "SELECT * FROM post WHERE author = $targetUser AND created_at > $minDate;",
>   {
>     targetUser: "user:alice",
>     minDate: new Date().toISOString()
>   }
> );
> ```
>
> #### Technical Explanation
>
> 1. Parameter maps accept strings, numbers, booleans, arrays, and ISO date strings.
> 2. Encodes parameter types safely before transmission over WebSockets.
> 3. Provides secure parameter binding for dynamic queries.

---





## 6. Related Terms

- [SurrealQL Injection Prevention](../level_08/injection_prevention.md) — Security protections.
- [SDK CRUD Methods (`.select()` / `.create()` / `.update()` / `.delete()`)](sdk_crud.md) — High-level CRUD alternative.
- [Parameters (`$param`)](../level_06/parameters.md) — Parameter syntax details.

---

## 7. Key Takeaways
- `db.query()` executes raw SurrealQL query strings with variable parameter maps.
- Always use the second parameter object `{ key: value }` for dynamic input to prevent injection attacks.
- Destructure return values (`const [result] = await db.query(...)`) to access individual statement result sets.
