# Pagination

> **Level 9 — REST APIs & Best Practices**
> The practice of dividing massive datasets into smaller, manageable "pages" before sending them to the client, preventing the API from sending millions of rows of data at once.

---

## 1. Prerequisites
- [REST API Design](rest_api.md) — This is a standard requirement for all production GET requests.
- [ORMs & ODMs](../level_08/orms_odms.md) — You use these tools to enforce the pagination on the database level.
---

## 2. Term Category
- **API Architecture / Performance**

---

## 3. Environment Context
- **Database Queries / API Responses**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you build Twitter. A user asks for the global timeline: `GET /tweets`.
If you execute `SELECT * FROM tweets`, the database will attempt to grab 5 Billion tweets. The database will crash. If it somehow survives, Node.js will try to put 5 Billion tweets into a JSON object, crashing the server's RAM.
To fix this, you use **Pagination**. The client asks for a specific "Page" of data, and the API only returns a tiny slice (e.g., 20 tweets at a time).

### (2) Offset Pagination (The Classic Method)
The client provides two URL Query Parameters:
- `page`: Which page number they want.
- `limit`: How many items per page.
Example URL: `GET /users?page=2&limit=50`

In your Node.js code, you translate these into SQL commands (or ORM commands) using **`LIMIT`** (how many to grab) and **`OFFSET`** (how many to skip).
```javascript
app.get('/users', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20; // Default to 20
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit; // If page 2, skip the first 20.

  // Prisma ORM Example
  const users = await prisma.user.findMany({
    skip: skip,
    take: limit
  });
  
  res.json(users);
});
```

### (3) Cursor Pagination (The Modern Method)
Offset pagination has a fatal flaw: if new items are added to the database while the user is clicking "Next Page," the items shift, and the user might see the exact same item twice!
Modern apps (like Infinite Scrolling feeds on Instagram) use **Cursor Pagination**. Instead of saying "Give me Page 2", the client says "Give me 20 items that were created *after* the ID `99482`". It is much faster and prevents duplicates, though slightly harder to code.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Paginating in Node.js instead of the Database

**The mistake:** A developer writes a route to get 10 users. They fetch *all* users from the database into a JavaScript array, and then use `.slice()` to grab the 10 they want.
```javascript
// HORRIBLE CODE!
const allUsers = await prisma.user.findMany(); // Gets 1 million users
const page1 = allUsers.slice(0, 10); // Throws 999,990 users in the garbage
res.json(page1);
```

**Why it's wrong:** You just transferred 1 million rows of data across the network and loaded it into RAM, only to throw 99% of it away. Your server will run out of memory and crash.
**Golden Rule:** Pagination MUST happen at the Database level (using `skip`/`take` or `LIMIT`/`OFFSET`). The database should only ever send exactly what the user asked for.

---



### Mistake 2: Using High Offset Pagination (`OFFSET 1000000`) for Massive Datasets (Performance Degradation)

**The mistake:** Using `LIMIT 20 OFFSET 1000000` to paginate million-row SQL tables.

**Why it's wrong:** Offset pagination requires the database to scan and discard 1,000,000 rows before returning 20 rows, making deep page queries extremely slow. Use Cursor-Based (Keyset) pagination (`WHERE id > last_seen_id`).

*Incorrect:*
```javascript
SELECT * FROM logs ORDER BY id LIMIT 20 OFFSET 1000000; // ❌ Slow table scan!
```

*Fix:*
```javascript
SELECT * FROM logs WHERE id > 1000000 ORDER BY id LIMIT 20; // Fast cursor index lookup
```

### Mistake 3: Failing to Validate and Sanitize `page` and `limit` Query Parameters

**The mistake:** Passing `req.query.limit` directly to database query without bounds checking.

**Why it's wrong:** An attacker can pass `?limit=10000000` to load millions of rows into memory, crashing the database and Node server. Clamp `limit` to a max value (e.g. max 100).

*Incorrect:*
```javascript
const limit = req.query.limit; // ❌ Could be 10000000!
```

*Fix:*
```javascript
const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100); // Clamp to max 100
```



### Mistake 4: Using High Offset Pagination (`OFFSET 1000000`) for Massive Datasets (Performance Degradation)

**The mistake:** Using `LIMIT 20 OFFSET 1000000` to paginate million-row SQL tables.

**Why it's wrong:** Offset pagination requires the database to scan and discard 1,000,000 rows before returning 20 rows, making deep page queries extremely slow. Use Cursor-Based (Keyset) pagination (`WHERE id > last_seen_id`).

*Incorrect:*
```javascript
SELECT * FROM logs ORDER BY id LIMIT 20 OFFSET 1000000; // ❌ Slow table scan!
```

*Fix:*
```javascript
SELECT * FROM logs WHERE id > 1000000 ORDER BY id LIMIT 20; // Fast cursor index lookup
```

### Mistake 5: Failing to Validate and Sanitize `page` and `limit` Query Parameters

**The mistake:** Passing `req.query.limit` directly to database query without bounds checking.

**Why it's wrong:** An attacker can pass `?limit=10000000` to load millions of rows into memory, crashing the database and Node server. Clamp `limit` to a max value (e.g. max 100).

*Incorrect:*
```javascript
const limit = req.query.limit; // ❌ Could be 10000000!
```

*Fix:*
```javascript
const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100); // Clamp to max 100
```



### Mistake 6: Using High Offset Pagination (`OFFSET 1000000`) for Massive Datasets (Performance Degradation)

**The mistake:** Using `LIMIT 20 OFFSET 1000000` to paginate million-row SQL tables.

**Why it's wrong:** Offset pagination requires the database to scan and discard 1,000,000 rows before returning 20 rows, making deep page queries extremely slow. Use Cursor-Based (Keyset) pagination (`WHERE id > last_seen_id`).

*Incorrect:*
```javascript
SELECT * FROM logs ORDER BY id LIMIT 20 OFFSET 1000000; // ❌ Slow table scan!
```

*Fix:*
```javascript
SELECT * FROM logs WHERE id > 1000000 ORDER BY id LIMIT 20; // Fast cursor index lookup
```

### Mistake 7: Failing to Validate and Sanitize `page` and `limit` Query Parameters

**The mistake:** Passing `req.query.limit` directly to database query without bounds checking.

**Why it's wrong:** An attacker can pass `?limit=10000000` to load millions of rows into memory, crashing the database and Node server. Clamp `limit` to a max value (e.g. max 100).

*Incorrect:*
```javascript
const limit = req.query.limit; // ❌ Could be 10000000!
```

*Fix:*
```javascript
const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100); // Clamp to max 100
```

## 6. Practice Exercises

### Exercise 1: The Math

**Problem:** A user visits `GET /products?page=4&limit=10`. 
How many items should the database `take` (LIMIT)?
How many items should the database `skip` (OFFSET)?

**Expected output:**
> [!check]- Answer
> ```text
> Take (LIMIT): 10 items.
> Skip (OFFSET): 30 items.
> (Explanation: They want page 4. That means they already saw Page 1, 2, and 3. Since each page has 10 items, 3 pages * 10 items = 30 skipped items).
> ```
> - The formula is `(page - 1) * limit`.

---



### Exercise 2: Calculating SQL OFFSET for Page Number

**Problem:** Write formula to calculate SQL `offset` given 1-based `page` number and `limit` size.

**Expected output:**
> [!check]- Answer
> ```text
> const offset = (page - 1) * limit;
> ```
> ```javascript
> const offset = (page - 1) * limit;
> ```
>
> **Explanation:** Standard offset formula skips `(page - 1) * limit` rows.

---

### Exercise 3: Cursor-Based vs Offset Pagination Tradeoff

**Problem:** Which pagination method supports jumping directly to arbitrary page 50? (Offset pagination). Which method handles real-time data insertions without duplicate item bugs? (Cursor-based pagination).

**Expected output:**
> [!check]- Answer
> ```text
> Arbitrary page jump: Offset pagination; Real-time insertions: Cursor-based pagination.
> ```
> ```text
> Arbitrary page jump: Offset pagination
> Real-time insertions: Cursor-based pagination
> ```
>
> **Explanation:** Offset allows arbitrary page skipping; Cursor guarantees stable pagination across real-time list inserts.

## 7. Related Terms
- [ORMs & ODMs](../level_08/orms_odms.md) — The tools that execute the `take` and `skip` commands.
- [The req & res Objects](../level_07/req_res.md) — You extract the page numbers from `req.query`.
---

## 8. Key Takeaways
- **Pagination** prevents servers from crashing when returning massive datasets.
- **Offset Pagination** uses `page` and `limit` to calculate how many items to skip in the database.
- **Cursor Pagination** uses a specific ID/timestamp to grab the next set of items (perfect for Infinite Scrolling).
- ALWAYS execute pagination at the Database level, never in Node.js memory.
