# Bulk / Batch Requests

> **Level 6 — Advanced API Concepts**
> Combining many operations into one call.

---

## 1. Prerequisites
- [HTTP Methods (Verbs)](../level_02/http_methods.md) — The verbs describing request operations.
- [Pagination (Offset vs. Cursor)](./pagination.md) — The concepts for navigating collection sets.

---

## 2. Term Category
- **Architecture / Design**

---

## 3. Environment Context
- **Universal**: Applies to backend endpoint route design and frontend data synchronization.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Transaction Assessor

**Problem:** You are building an e-commerce checkout batch endpoint that handles:
- **Action A:** Charging a user's credit card.
- **Action B:** Generating a shipping label database entry.

Should this batch endpoint be configured as **Transactional** (all or nothing) or **Non-Transactional** (independent)?

> [!check]- Answer
> - **Transactional.** If the credit card charge succeeds but generating the shipping label fails, you must roll back the transaction so the user is not charged for an item that cannot be shipped.


---

### Exercise 2: Batch API Status Code

**Problem:** Which WebDAV-extended HTTP status code specifically represents partial success across multiple batch sub-requests?

**Expected output:**
```text
HTTP 207 Multi-Status
```

> [!check]- Answer
> ```http
> HTTP/1.1 207 Multi-Status
> ```
> - **Explanation:** 207 Multi-Status conveys separate status codes for individual items in batch operations.
---

### Exercise 3: Batching vs Parallel Individual Requests

**Problem:** When is creating a dedicated Batch API endpoint preferred over executing parallel HTTP requests?

**Expected output:**
```text
When HTTP connection setup overhead, network RTT latency, or mobile bandwidth constraints make sending multiple separate HTTP requests too costly.
```

> [!check]- Answer
> ```text
> When HTTP connection setup overhead, network RTT latency, or mobile bandwidth constraints make sending multiple separate HTTP requests too costly.
> ```
> - **Explanation:** Batching combines multiple operations into a single HTTP RTT payload.
---

## 7. Related Terms
- [Rate Limiting (429 Too Many Requests)](./rate_limiting.md) — The protection policies that batch requests help avoid triggering.
- [JSON Methods (parse / stringify)](../level_07/json_methods.md) — The utility methods used to construct and parse batch payloads.

---

## 8. Key Takeaways
- Bulk / Batch requests consolidate multiple network operations into a single HTTP round-trip.
- They optimize latency, conserve database connections, and avoid rate-limiting blocks.
- Bulk requests execute the same method on a collection; Batch requests route different methods to different sub-paths.
- Transactional batching uses database transactions to guarantee all-or-nothing execution.
- Always configure strict batch size limits on the server to prevent memory exhaust crashes.
