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
- **Production & Resilience**

---

## 3. Environment Context
- **Production Client & Server Services** (Executed in Node.js backends or browser frontends to ensure uninterrupted operation during network or database events).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Swallowing Exceptions Returned by `db.query()` Invocation Results

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

### Mistake 5: Failing to Handle WebSocket Disconnection Errors in Production Node.js Services

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

## 6. Practice Exercises

### Exercise 1: Identify Exponential Backoff Delays
If initial delay is `100ms` and multiplier is `2`, calculate the delay duration for attempts 1, 2, and 3.

> [!check]- Answer
> - Attempt 1: 100ms.
> - Attempt 2: 200ms.
> - Attempt 3: 400ms.

---



### Exercise 2: Safely Parsing `db.query` Response Batches

**Problem:** Write JS helper checking `res.status === 'OK'` on `db.query()` response arrays.

**Expected output:**
> [!check]- Answer
> ```text
> const [res] = await db.query(sql); if (res.status === 'OK') return res.result;
> ```
> ```javascript
> const [res] = await db.query(sql);
> if (res.status === 'OK') {
>   return res.result;
> } else {
>   throw new Error(res.result);
> }
> ```
>
> **Explanation:** `db.query()` returns arrays of response objects containing `status` and `result` fields.

---

### Exercise 3: Handling Permission Denied Exceptions

**Problem:** Catch `PERMISSIONS` denied exception when running unauthorized SDK queries.

**Expected output:**
> [!check]- Answer
> ```text
> try { await db.select('secret'); } catch (err) { console.error('Access Denied:', err); }
> ```
> ```javascript
> try {
>   await db.select('secret');
> } catch (err) {
>   console.error('Access Denied:', err);
> }
> ```
>
> **Explanation:** Unauthorized query executions throw access permission error exceptions.

## 7. Related Terms

- [Transaction Isolation & Atomicity Semantics](../level_09/transaction_isolation.md) — Snapshot isolation semantics.
- [JavaScript / TypeScript SDK](js_sdk.md) — Client package overview.
- [WebSocket vs HTTP Connection](websocket_vs_http.md) — Transport resilience.

---

## 8. Key Takeaways
- Use SDK connection event listeners (`disconnected`, `connected`) to monitor WebSocket health.
- Wrap multi-statement transactions in exponential backoff retry loops to handle optimistic write conflicts.
- Distinguish between fatal schema errors and transient network/concurrency errors.
