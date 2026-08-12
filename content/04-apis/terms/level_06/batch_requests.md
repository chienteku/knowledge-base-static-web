# Bulk / Batch Requests

> **Level 6 — Advanced API Concepts**
> Combining many operations into one call.

---

## 1. Prerequisites
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — The verbs describing request operations.
- [Pagination (Offset vs. Cursor)](pagination.md) — The concepts for navigating collection sets.

---

## 2. Term Category

**Architecture / Design (Universal: Applies to backend endpoint route design and frontend data synchronization.)**: Bulk / Batch Requests is a fundamental concept in this technology stack. **Level 6 — Advanced API Concepts**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In client applications, you often need to perform multiple operations at once—for example, synchronizing a local list of 50 offline changes, updating the prices of 100 products, or deleting 20 emails.

If the application fires individual HTTP requests for every single operation (e.g. 50 separate `POST` requests), it suffers severe performance penalties:
- **Latency Overhead:** Compounds network latency (50 round-trips!).
- **Rate Limiting:** Floods the server with requests, triggering `429 Too Many Requests` locks.
- **Resource Exhaustion:** Floods database connection pools and blocks server processing queues.

To execute multiple operations efficiently, APIs implement **Bulk** or **Batch** requests:
- **Bulk Requests:** Applying the **same operation** to multiple resources in one request (e.g. `POST /products/bulk` passing a JSON array of 50 new items).
- **Batch Requests:** Combining **different operations** (e.g. create a user, update an order, delete a comment) into a single HTTP request targeting a generic `/batch` router endpoint.

#### Transactional vs. Non-Transactional
- **Transactional Batching:** The server runs the entire batch inside a database transaction. If one operation fails, the database rolls back, and **none** of the changes are saved.
- **Non-Transactional Batching:** The server processes each sub-request independently. Successful operations are saved, and the response reports status codes for each item individually.

### (2) Reality Metaphor
Imagine mailing 50 separate letters to the post office.
- **Individual Requests** are like **driving to the post office 50 times**—taking one letter, driving 15 minutes, dropping it off, driving home, and repeating the cycle for every envelope. It is an extreme waste of fuel, time, and road capacity.
- **Batch Requests** are like putting all 50 envelopes into a **single cardboard shipping box**, driving to the post office once, and handing the box to the clerk.

---

### (3) Batch HTTP JSON Example

A client submits a list of sub-requests to a `/api/v1/batch` endpoint:

#### 1. Request Payload (`POST /api/v1/batch`)
```json
{
  "requests": [
    {
      "method": "POST",
      "path": "/products",
      "body": { "name": "Wireless Mouse", "price": 25.00 }
    },
    {
      "method": "PATCH",
      "path": "/users/42",
      "body": { "status": "active" }
    },
    {
      "method": "DELETE",
      "path": "/comments/999"
    }
  ]
}
```

#### 2. Server Response Payload
The server returns individual status codes and payloads matching the order of the requests array:
```json
{
  "responses": [
    {
      "status": 201,
      "body": { "id": 501, "name": "Wireless Mouse" }
    },
    {
      "status": 200,
      "body": { "id": 42, "status": "active" }
    },
    {
      "status": 404,
      "body": { "error": "Comment 999 not found" }
    }
  ]
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Permitting unbounded batch request payload sizes

**The mistake:** Creating a batch endpoint that allows clients to send an array containing an infinite number of items (e.g. uploading 10,000 catalog updates in a single call).

**Why it's wrong:** Processing thousands of operations in a single HTTP request exhausts server RAM, triggers database lock timeouts, and exceeds the maximum request body limit configured on proxies (like Nginx), crashing the service.

*Fix:* Always enforce a strict maximum limit on batch sizes (e.g. maximum of 100 items per request). If the client has 500 items, they must chunk them into 5 separate batch requests of 100.

---

### Mistake 2: Executing Un-Bounded Large Batch Operations (Payload Memory Spike)

**The mistake:** Accepting batch payloads containing 10,000 item operations in a single POST `/api/batch` request.

**Why it's wrong:** Processing massive batch payloads in a single request exhausts server RAM and causes database lock contention. Enforce maximum batch size limits (e.g. max 100 items per batch).

*Incorrect:*
```javascript
// Processing un-bounded batch payload
app.post('/api/batch', (req, res) => {
  // ❌ Accepts arrays of 10,000 items, crashing server RAM!
  req.body.items.forEach(processItem);
});
```

*Fix:*
```javascript
app.post('/api/batch', (req, res) => {
  if (req.body.items.length > 100) {
    return res.status(400).json({ error: 'Batch size limit exceeded (max 100 items)' });
  }
});
```

---

### Mistake 3: Failing to Provide Partial Success/Failure Reporting in Batch Responses

**The mistake:** Failing the ENTIRE batch response with 500 Server Error if item #42 out of 100 items fails.

**Why it's wrong:** In batch processing, individual items may fail due to validation errors. Return a 207 Multi-Status or a batch status report object detailing success/failure per item.

*Incorrect:*
```http
/* Returning 500 Server Error on 1 item failure inside a 100-item batch */
```

*Fix:*
```http
HTTP/1.1 207 Multi-Status
Content-Type: application/json

{
  "results": [
    { "id": 1, "status": 200 },
    { "id": 2, "status": 422, "error": "Validation failed" }
  ]
}
```


---

## 5. Practice Exercises

### Exercise 1: REST / JSON-RPC Batch Requests Processor

**Scenario:** An API gateway processes array batch requests in a single HTTP POST call, executing sub-requests and returning an array of response objects.

**Requirements:**
1. Write processBatchRequests(batchArray, endpointHandlers).
2. Process sub-requests.
3. Collect individual status codes and payloads.
4. Return array response.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function processBatchRequests(batchArray = [], endpointHandlers = {}) {
>   if (!Array.isArray(batchArray) || batchArray.length === 0) {
>     return { status: 400, body: { error: "Batch payload must be a non-empty array" } };
>   }
>
>   const responses = await Promise.all(
>     batchArray.map(async (req) => {
>       const { id, method, path, body } = req;
>       const handler = endpointHandlers[path];
>
>       if (!handler) {
>         return { id, status: 404, error: "Endpoint not found" };
>       }
>
>       try {
>         const result = await handler(method, body);
>         return { id, status: result.status || 200, data: result.data };
>       } catch (err) {
>         return { id, status: 500, error: err.message };
>       }
>     })
>   );
>
>   return { status: 200, body: responses };
> }
>
> // Verification tests
> const handlers = {
>   "/users": async (method, body) => ({ status: 200, data: { name: "Alice" } }),
>   "/orders": async (method, body) => ({ status: 201, data: { orderId: 99 } })
> };
>
> const batch = [
>   { id: "r1", method: "GET", path: "/users" },
>   { id: "r2", method: "POST", path: "/orders", body: { item: "book" } }
> ];
>
> processBatchRequests(batch, handlers).then(res => {
>   console.assert(res.status === 200, "Test 1 Failed");
>   console.assert(res.body.length === 2, "Test 2 Failed");
>   console.assert(res.body[0].data.name === "Alice", "Test 3 Failed");
>   console.assert(res.body[1].data.orderId === 99, "Test 4 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Batch Request Concept**: Combines multiple API operations into a single HTTP request payload to reduce network latency.
> 2. **HTTP Multi-Status Processing**: Sub-requests carry independent HTTP status codes (200, 201, 404) inside response envelopes.
> 3. **Correlation Identifiers**: Sub-requests use client-supplied id fields to correlate async responses to requests.
> 
---

### Exercise 2: Client-Side Request Buffer & Auto-Flush Queue

**Scenario:** A frontend data SDK buffers individual API requests over a 50ms window and dispatches them in a single batched HTTP request.

**Requirements:**
1. Write createBatchQueue(flushApiFn, delayMs).
2. Buffer requests.
3. Flush batch automatically on timer.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createBatchQueue(flushApiFn, delayMs = 50) {
>   let queue = [];
>   let timerId = null;
>
>   return function enqueue(requestItem) {
>     return new Promise((resolve, reject) => {
>       queue.push({ item: requestItem, resolve, reject });
>
>       if (!timerId) {
>         timerId = setTimeout(async () => {
>           const currentBatch = [...queue];
>           queue = [];
>           timerId = null;
>
>           try {
>             const items = currentBatch.map(b => b.item);
>             const results = await flushApiFn(items);
>             results.forEach((res, i) => currentBatch[i].resolve(res));
>           } catch (err) {
>             currentBatch.forEach(b => b.reject(err));
>           }
>         }, delayMs);
>       }
>     });
>   };
> }
>
> // Verification tests
> const mockFlush = async (items) => items.map(it => `Processed_${it}`);
> const queue = createBatchQueue(mockFlush, 20);
>
> const p1 = queue("req1");
> const p2 = queue("req2");
>
> Promise.all([p1, p2]).then(([r1, r2]) => {
>   console.assert(r1 === "Processed_req1", "Test 1 Failed");
>   console.assert(r2 === "Processed_req2", "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Request Coalescing**: Groups discrete UI component data requests dispatched within a short time window.
> 2. **Network Roundtrip Reduction**: Reduces N HTTP connection setups to 1 connection setup.
> 3. **Promise Deferred Pattern**: Returns individual promises to callers that settle when the batch response arrives.
> 
---

### Exercise 3: Partial Batch Failure Error Aggregator

**Scenario:** Processes batch mutations and separates successful items from failed operations for granular UI feedback.

**Requirements:**
1. Write summarizeBatchResults(batchResponseArray).
2. Separate succeeded and failed items.
3. Return summary report.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function summarizeBatchResults(batchResponseArray = []) {
>   const succeeded = [];
>   const failed = [];
>
>   for (const item of batchResponseArray) {
>     if (item.status >= 200 && item.status < 300) {
>       succeeded.push(item);
>     } else {
>       failed.push(item);
>     }
>   }
>
>   return {
>     total: batchResponseArray.length,
>     successCount: succeeded.length,
>     failureCount: failed.length,
>     succeeded,
>     failed
>   };
> }
>
> // Verification tests
> const responses = [
>   { id: "1", status: 200, data: "ok" },
>   { id: "2", status: 404, error: "Not Found" },
>   { id: "3", status: 201, data: "created" }
> ];
>
> const summary = summarizeBatchResults(responses);
> console.assert(summary.successCount === 2 && summary.failureCount === 1, "Test 1 Failed");
> console.assert(summary.failed[0].id === "2", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Partial Batch Success**: Batch endpoints should allow valid operations to succeed even if individual items fail.
> 2. **Granular UI Error Reporting**: Enables UI to highlight specific failing rows in bulk data tables.
> 3. **Atomicity Options**: Transactional batching rolls back everything; non-transactional batching allows partial completion.
---

## 6. Related Terms
- [Rate Limiting (429 Too Many Requests)](rate_limiting.md) — The protection policies that batch requests help avoid triggering.
- [JSON Methods (parse / stringify)](../level_07/json_methods.md) — The utility methods used to construct and parse batch payloads.

---

## 7. Key Takeaways
- Bulk / Batch requests consolidate multiple network operations into a single HTTP round-trip.
- They optimize latency, conserve database connections, and avoid rate-limiting blocks.
- Bulk requests execute the same method on a collection; Batch requests route different methods to different sub-paths.
- Transactional batching uses database transactions to guarantee all-or-nothing execution.
- Always configure strict batch size limits on the server to prevent memory exhaust crashes.
