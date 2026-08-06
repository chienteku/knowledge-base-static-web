# SDK Error Handling & Retry Patterns

> **Level 10 — SDKs, Deployment & Production**
> Resilience patterns and error handling strategies for SurrealDB client SDKs: managing WebSocket connection drops, automatic reconnection, transaction conflict retries, and authentication expiry.

---

## 1. Prerequisites

- [JavaScript / TypeScript SDK](js_sdk.md) — Client SDK package.
- [Transaction Isolation & Atomicity Semantics](../level_09/transaction_isolation.md) — Write conflicts in snapshot isolation.
- [SDK Connection Lifecycle (`connect` / `use` / `signin` / `close`)](sdk_connection.md) — Handling network and query errors in SDKs.

---

## 2. Term Category


**Integration / Ecosystem (SDK error catching and exception handling)**: - **Production & Resilience**



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In production environments, network connections drop, mobile devices switch between Wi-Fi and cellular data, databases fail over, and concurrent write transactions encounter optimistic lock conflicts. If an application crashes every time a temporary network drop or write conflict occurs, user experience suffers.

SurrealDB client SDKs provide built-in event listeners (`disconnected`, `reconnecting`, `connected`) and automatic WebSocket reconnection mechanisms. Application developers combine these SDK features with robust retry wrapper patterns (exponential backoff) to handle transient errors, write conflicts, and token refreshes gracefully.

### (2) Reality Metaphor
Think of an automatic redial feature on a smartphone:
- When a phone call drops while driving through a tunnel, instead of throwing away your phone, the phone automatically detects the signal drop, displays "Reconnecting...", and redials the recipient with exponential backoff until the call re-establishes.

### (3) Code Examples

#### Short Snippet
```typescript
// Listening to connection state events on the Surreal client
db.on('disconnected', () => console.warn('WebSocket connection lost! Reconnecting...'));
db.on('connected', () => console.log('Re-established connection to SurrealDB!'));
```

#### Fuller Example
```typescript
import { Surreal } from 'surrealdb';

// Generic Exponential Backoff Retry Wrapper for Transactions & Queries
async function executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 5,
    initialDelayMs: number = 100
): Promise<T> {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        } catch (err: any) {
            attempt++;
            // Check if error is a transient write conflict or network glitch
            const isConflict = err?.message?.includes('conflict') || err?.message?.includes('Transaction');
            if (!isConflict || attempt >= maxRetries) {
                console.error(`Execution failed permanently after ${attempt} attempts:`, err);
                throw err;
            }

            const delay = initialDelayMs * Math.pow(2, attempt - 1);
            console.warn(`Transient transaction conflict (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Usage: Execute a transfer transaction with automatic conflict retry
await executeWithRetry(async () => {
    await db.query(`
        BEGIN TRANSACTION;
            UPDATE account:alice SET balance -= 50;
            UPDATE account:bob SET balance += 50;
        COMMIT TRANSACTION;
    `);
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Treating Transient Transaction Conflicts as Fatal Application Errors

**The mistake:** Catching a write conflict error (`Transaction conflict`) and immediately displaying an error message to the user without attempting an automatic retry.

**Why it's wrong:** Under SurrealDB's Snapshot Isolation (MVCC), write conflicts under high concurrency are expected. Retrying the transaction immediately afterwards almost always succeeds.

*Incorrect:*
```typescript
try {
    await executeTransaction();
} catch (err) {
    showFatalError('Database failure!'); // Don't crash on transient conflicts!
}
```

*Fix:*
```typescript
try {
    await executeWithRetry(() => executeTransaction()); // Auto-retry transient conflicts!
} catch (err) {
    showFatalError('Operation failed after retries.');
}
```

---



### Mistake 2: Swallowing Exceptions Returned by `db.query()` Invocation Results

**The mistake:** Calling `const res = await db.query(...)` without checking result status codes or catching exceptions.

**Why it's wrong:** Multi-statement batch queries in `db.query()` return array response objects. Individual statements inside batches may contain error objects.

*Incorrect:*
```surrealql
const res = await db.query("SELECT * FROM invalid_table"); // Result array contains error!
```

*Fix:*
```surrealql
const [res] = await db.query("SELECT * FROM user"); if (res.status === 'ERR') throw res.result;
```

### Mistake 3: Failing to Handle WebSocket Disconnection Errors in Production Node.js Services

**The mistake:** Deploying background services without listening for SDK connection error events.

**Why it's wrong:** Un-handled connection errors in background workers can cause process crashes or un-handled promise rejections.

*Incorrect:*
```surrealql
-- No connection error listener
```

*Fix:*
```surrealql
db.on('error', (err) => console.error('SurrealDB Connection Error:', err));
```





## 5. Practice Exercises

### Exercise 1: Try-Catch Exception Handling for SDK Queries

**Scenario:**
Wrap SDK query calls in a try-catch block to catch and handle write assertion failures gracefully.

**Requirements:**
1. Execute `db.create()` inside try-catch block.
2. Catch and log error messages.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> try {
>   await db.create("user", {
>     email: "invalid-email-format"
>   });
> } catch (err: any) {
>   console.error("Database operation failed:", err.message);
> }
> ```
>
> #### Technical Explanation
>
> 1. SDK query methods throw exceptions when database errors occur (assertion failures, primary key conflicts, syntax errors).
> 2. `err.message` contains descriptive error strings returned by SurrealDB.
> 3. Prevents unhandled promise rejections in Node.js apps.

---

### Exercise 2: Handling Specific Record Conflict Errors

**Scenario:**
Detect primary key conflict errors when creating duplicate records.

**Requirements:**
1. Catch collision exceptions and check error message strings.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> try {
>   await db.create("user:alice", { name: "Alice" });
> } catch (err: any) {
>   if (err.message.includes("already exists")) {
>     console.warn("User already exists, switching to update...");
>     await db.merge("user:alice", { name: "Alice Updated" });
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. Inspecting error messages allows application code to execute fallback strategies.
> 2. Differentiates primary key collisions from connection failures.
> 3. Improves application error resilience.

---

### Exercise 3: Handling Authentication Failures

**Scenario:**
Catch authentication error exceptions thrown during `db.signin()` when invalid credentials are provided.

**Requirements:**
1. Handle invalid password login failures.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> try {
>   await db.signin({
>     access: "user_access",
>     ns: "main",
>     db: "app",
>     username: "alice",
>     pass: "WrongPass"
>   });
> } catch (err: any) {
>   console.error("Authentication failed: Invalid username or password.");
> }
> ```
>
> #### Technical Explanation
>
> 1. Failed signin attempts throw authentication exceptions.
> 2. Protects application endpoints by preventing token issuance on invalid credentials.
> 3. Provides clean error feedback to login UI components.

---





## 6. Related Terms

- [Transaction Isolation & Atomicity Semantics](../level_09/transaction_isolation.md) — Snapshot isolation semantics.
- [JavaScript / TypeScript SDK](js_sdk.md) — Client package overview.
- [WebSocket vs HTTP Connection](websocket_vs_http.md) — Transport resilience.

---

## 7. Key Takeaways
- Use SDK connection event listeners (`disconnected`, `connected`) to monitor WebSocket health.
- Wrap multi-statement transactions in exponential backoff retry loops to handle optimistic write conflicts.
- Distinguish between fatal schema errors and transient network/concurrency errors.
