# Pagination

> **Level 9 — REST APIs & Best Practices**
> The practice of dividing massive datasets into smaller, manageable "pages" before sending them to the client, preventing the API from sending millions of rows of data at once.

---

## 1. Prerequisites
- [REST API Design](rest_api.md) — This is a standard requirement for all production GET requests.
- [ORMs & ODMs](../level_08/orms_odms.md) — You use these tools to enforce the pagination on the database level.

---

## 2. Term Category

**API Architecture / Performance (Database Queries / API Responses)**: Pagination is a fundamental concept in this technology stack. **Level 9 — REST APIs & Best Practices**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Offset-Based Limit/Offset Pagination Pager

**Scenario:** Constructs SQL offset pagination parameters and metadata (`totalCount`, `page`, `limit`, `totalPages`).

**Requirements:**
1. Write calculateOffsetPagination(totalCount, pageInput, limitInput).
2. Calculate totalPages, offset, hasNext, hasPrev.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function calculateOffsetPagination(totalCount = 0, pageInput = 1, limitInput = 20) {
>   const page = Math.max(1, parseInt(pageInput, 10) || 1);
>   const limit = Math.max(1, Math.min(100, parseInt(limitInput, 10) || 20));
>
>   const totalPages = Math.ceil(totalCount / limit) || 1;
>   const offset = (page - 1) * limit;
>
>   return {
>     pagination: {
>       currentPage: page,
>       limit,
>       totalCount,
>       totalPages,
>       hasNextPage: page < totalPages,
>       hasPrevPage: page > 1
>     },
>     query: { limit, offset }
>   };
> }
>
> // Verification tests
> const p = calculateOffsetPagination(95, 2, 20);
> console.assert(p.pagination.totalPages === 5, "Test 1 Failed: 95 items / 20 = 5 pages");
> console.assert(p.query.offset === 20, "Test 2 Failed: Page 2 offset is 20");
> console.assert(p.pagination.hasNextPage === true, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Offset Pagination**: Standard pagination method using `LIMIT limit OFFSET offset` SQL queries.
> 2. **Performance Degradation at Depth**: As `OFFSET` increases (e.g. `OFFSET 100000`), SQL engines must scan and discard thousands of rows.
> 3. **Page Drift Hazard**: Inserting new records while paginating causes duplicate or skipped records between page requests.
> 
---

### Exercise 2: Cursor-Based Pagination Token Encoder/Decoder

**Scenario:** Implements high-performance cursor-based pagination using base64 encoded cursor tokens (`created_at` + `id`).

**Requirements:**
1. Write encodeCursor(record, field).
2. Write decodeCursor(cursorToken).
3. Generate cursor query filter.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function encodeCursor(record, field = "id") {
>   const val = record[field];
>   const payload = JSON.stringify({ field, val });
>   return Buffer.from(payload).toString("base64url");
> }
>
> function decodeCursor(cursorToken) {
>   if (!cursorToken) return null;
>   try {
>     const json = Buffer.from(cursorToken, "base64url").toString("utf-8");
>     return JSON.parse(json);
>   } catch (err) {
>     return null;
>   }
> }
>
> // Verification tests
> const token = encodeCursor({ id: 105, createdAt: "2026-08-12" }, "id");
> const decoded = decodeCursor(token);
>
> console.assert(decoded.field === "id" && decoded.val === 105, "Test 1 Failed: Decoded base64url cursor");
> ```
>
> #### Technical Explanation
>
> 1. **Cursor-Based (Keyset) Pagination**: Paginates using index comparisons (`WHERE id > last_seen_id LIMIT 20`) instead of `OFFSET`.
> 2. **Consistent Performance**: Execution speed stays O(1) regardless of page depth because it utilizes database index lookups.
> 3. **No Page Drift**: New record insertions do not distort pagination cursors.
> 
---

### Exercise 3: RFC 5988 Link Header Pagination Generator

**Scenario:** Constructs standard HTTP `Link` headers containing `first`, `prev`, `next`, and `last` pagination URIs.

**Requirements:**
1. Write buildPaginationLinkHeader(baseUrl, currentPage, totalPages, limit).
2. Format RFC 5988 Link header string.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildPaginationLinkHeader(baseUrl, currentPage, totalPages, limit) {
>   const links = [];
>
>   const makeUrl = (p) => `<${baseUrl}?page=${p}&limit=${limit}>`;
>
>   if (currentPage < totalPages) {
>     links.push(`${makeUrl(currentPage + 1)}; rel="next"`);
>   }
>   if (currentPage > 1) {
>     links.push(`${makeUrl(currentPage - 1)}; rel="prev"`);
>   }
>   links.push(`${makeUrl(1)}; rel="first"`);
>   links.push(`${makeUrl(totalPages)}; rel="last"`);
>
>   return links.join(", ");
> }
>
> // Verification tests
> const header = buildPaginationLinkHeader("https://api.com/users", 2, 5, 20);
> console.assert(header.includes('rel="next"'), "Test 1 Failed");
> console.assert(header.includes('rel="prev"'), "Test 2 Failed");
> console.assert(header.includes('rel="first"'), "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **RFC 5988 Web Linking Standard**: Standardized HTTP header for communicating relation links in Web APIs.
> 2. **HATEOAS Compliance**: Allows API clients to navigate paginated datasets without hardcoding pagination URL structures.
> 3. **GitHub REST API Pattern**: GitHub and Stripe APIs rely heavily on `Link` headers for pagination navigation.
## 6. Related Terms
- [ORMs & ODMs](../level_08/orms_odms.md) — The tools that execute the `take` and `skip` commands.
- [The req & res Objects](../level_07/req_res.md) — You extract the page numbers from `req.query`.

---

## 7. Key Takeaways
- **Pagination** prevents servers from crashing when returning massive datasets.
- **Offset Pagination** uses `page` and `limit` to calculate how many items to skip in the database.
- **Cursor Pagination** uses a specific ID/timestamp to grab the next set of items (perfect for Infinite Scrolling).
- ALWAYS execute pagination at the Database level, never in Node.js memory.
