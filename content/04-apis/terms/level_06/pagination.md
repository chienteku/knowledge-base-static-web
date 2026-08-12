# Pagination (Offset vs. Cursor)

> **Level 6 — Advanced API Concepts**
> The strategy of dividing a massive dataset into smaller, manageable "pages" so the API doesn't crash trying to send millions of records at once.

---

## 1. Prerequisites
- [Query Parameters & Path Variables](../level_02/query_params.md) — Pagination is almost exclusively handled via query parameters.

---

## 2. Term Category

**API Design / Data Management (Backend Architecture & Frontend UI)**: Pagination (Offset vs. Cursor) is a fundamental concept in this technology stack. **Level 6 — Advanced API Concepts**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you are building Twitter. If a user makes a `GET` request to `/api/tweets`, and your database contains 5 billion tweets, what happens? 
Your backend server tries to load 5 billion strings into RAM, runs out of memory, and crashes. If it somehow succeeds, it tries to send a 500GB JSON file over the network, crashing the user's browser.
To solve this, APIs must use **Pagination**. The API refuses to send all the data. Instead, it only sends a tiny slice (e.g., 20 tweets). If the user scrolls down, the frontend makes a second request for the *next* 20 tweets.

### (2) The Two Types of Pagination

**1. Offset/Limit Pagination (The "Page Number" approach)**
This is the oldest and most common method. You tell the server how many items you want (`limit`), and how many items to skip (`offset`).
- `GET /api/tweets?limit=20&offset=0` (Gets tweets 1 to 20).
- `GET /api/tweets?limit=20&offset=20` (Skips the first 20, gets tweets 21 to 40).
*The Problem:* It gets extremely slow on massive databases. If you ask a database to `offset=1000000`, the database has to manually count 1 million rows before it can start sending data!

**2. Cursor Pagination (The "Infinite Scroll" approach)**
This is the modern method used by Facebook, Twitter, and Slack. Instead of page numbers, the API returns a unique ID (a "Cursor") pointing to the very last item in the list. To get the next page, you just pass that ID back to the server.
- `GET /api/tweets?limit=20` $\rightarrow$ Server returns 20 tweets, and `nextCursor: "tweet_8849"`.
- `GET /api/tweets?limit=20&after=tweet_8849` $\rightarrow$ Server instantly finds `tweet_8849` in the database and grabs the next 20.
*The Benefit:* It is blazing fast, no matter how deep into the list you scroll.

### (3) Reality Metaphor
**Offset:** Reading a physical book. "Skip 50 pages, then read the next 2 pages." (You have to physically flip through 50 pages to get there).
**Cursor:** Using a bookmark. "Start reading exactly from where this bookmark is placed." (Instant access).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: The "New Item" Offset Bug

**The mistake:** A user is on Page 1 of an Offset-paginated API (`offset=0`, viewing items 1-10). While they are reading, a completely new item is added to the top of the database. The user clicks "Page 2" (`offset=10`). 

**Why it's wrong:** Because a new item was pushed to the top, item #10 was pushed down to position #11. When the user requests `offset=10` (skip the first 10), the API will return item #11. The user will see the exact same item they just saw at the bottom of Page 1!
**Golden Rule:** If your data updates frequently in real-time (like a social media feed), you MUST use Cursor pagination, not Offset pagination.

---

### Mistake 2: Using Offset-Based Pagination (`OFFSET 100000`) on Large SQL Datasets (Performance Collapse)

**The mistake:** Executing SQL query `SELECT * FROM posts ORDER BY id LIMIT 20 OFFSET 100000`.

**Why it's wrong:** SQL `OFFSET` forces the database to read and discard 100,000 rows before returning 20 rows, causing query performance to degrade exponentially on deep pages. Use **Cursor-Based Pagination**.

*Incorrect:*
```sql
-- Deep offset pagination query scanning 100,000 discarded rows
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 100000; -- ❌ High IO disk scan!
```

*Fix:*
```sql
-- Cursor-based pagination using indexed comparison:
SELECT * FROM posts WHERE id < 100000 ORDER BY id DESC LIMIT 20; -- Uses index lookup
```

---

### Mistake 3: Experiencing "Page Drift" (Missing/Duplicate Items) During Offset Pagination

**The mistake:** Using offset-based pagination on live feeds where new items are inserted frequently.

**Why it's wrong:** If 5 new items are inserted into page 1 while user is viewing page 1, fetching page 2 with `OFFSET 20` shifts rows down, causing the user to see page 1 items duplicated.

*Incorrect:*
```http
/* Page 2 fetch returns duplicate items from Page 1 due to row insertions */
```

*Fix:*
```http
/* Use Cursor-Based pagination (opaque cursor string) for real-time item feeds */
```


---

## 5. Practice Exercises

### Exercise 1: Cursor-Based API Pagination Evaluator

**Scenario:** An API endpoint implements high-performance Cursor-Based Pagination over a collection of item records.

**Requirements:**
1. Write fetchCursorPage(itemsArray, cursor, limit).
2. Find item matching cursor.
3. Slice next limit items.
4. Return { data, nextCursor, hasMore }.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function fetchCursorPage(itemsArray = [], cursor = null, limit = 2) {
>   let startIndex = 0;
>
>   if (cursor) {
>     const foundIdx = itemsArray.findIndex(item => item.id === cursor);
>     if (foundIdx !== -1) {
>       startIndex = foundIdx + 1;
>     }
>   }
>
>   const sliced = itemsArray.slice(startIndex, startIndex + limit);
>   const nextCursor = sliced.length > 0 ? sliced[sliced.length - 1].id : null;
>   const hasMore = startIndex + limit < itemsArray.length;
>
>   return {
>     data: sliced,
>     nextCursor: hasMore ? nextCursor : null,
>     hasMore
>   };
> }
>
> // Verification tests
> const items = [{ id: "i1" }, { id: "i2" }, { id: "i3" }, { id: "i4" }];
>
> const page1 = fetchCursorPage(items, null, 2);
> console.assert(page1.data.length === 2 && page1.nextCursor === "i2", "Test 1 Failed");
>
> const page2 = fetchCursorPage(items, page1.nextCursor, 2);
> console.assert(page2.data[0].id === "i3" && page2.hasMore === false, "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Cursor Pagination Advantage**: O(1) constant database lookup using indexed ID pointer; immune to offset performance degradation.
> 2. **Data Stability**: Prevents duplicate or skipped items when new records are inserted while user is paginating.
> 3. **Opaque Cursors**: Cursors are base64-encoded entity pointers passed in query strings (?cursor=eyJpZCI6MTB9).
> 
---

### Exercise 2: Offset-Based vs Cursor-Based Performance Calculator

**Scenario:** An API performance calculator demonstrates how SQL `OFFSET` performance degrades as page depth increases.

**Requirements:**
1. Write calculateQueryCost(paginationType, pageNumber, limit).
2. Offset cost = pageNumber * limit (scans previous rows); Cursor cost = constant 1.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function calculateQueryCost(paginationType, pageNumber, limit = 20) {
>   if (paginationType === "OFFSET") {
>     // SQL OFFSET must read and discard (pageNumber - 1) * limit rows
>     const rowsScanned = (pageNumber - 1) * limit + limit;
>     return { type: "OFFSET", rowsScanned, complexity: `O(${rowsScanned})` };
>   }
>
>   if (paginationType === "CURSOR") {
>     // Indexed WHERE id > cursor directly seeks target row
>     return { type: "CURSOR", rowsScanned: limit, complexity: `O(${limit})` };
>   }
>
>   throw new Error("Invalid pagination type");
> }
>
> // Verification tests
> const offsetCost = calculateQueryCost("OFFSET", 100, 20); // Page 100
> console.assert(offsetCost.rowsScanned === 2000, "Test 1 Failed: Scans 2000 rows");
>
> const cursorCost = calculateQueryCost("CURSOR", 100, 20);
> console.assert(cursorCost.rowsScanned === 20, "Test 2 Failed: Constant 20 rows scanned");
> ```
>
> #### Technical Explanation
>
> 1. **SQL OFFSET Flaw**: OFFSET N forces database engine to fetch and discard N rows before returning results.
> 2. **Deep Page Performance**: Offset pagination becomes exponentially slow on deep pages (Page 1000+).
> 3. **When to Use Offset**: Offset pagination is acceptable ONLY for small fixed datasets requiring UI page numbers [1, 2, 3].
> 
---

### Exercise 3: RFC 8288 Link Header Pagination Builder

**Scenario:** A REST API serializer builds RFC 8288 standard `Link` HTTP headers for paginated API responses.

**Requirements:**
1. Write buildPaginationLinkHeader(baseUrl, page, totalPages).
2. Generate links for first, prev, next, last.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function buildPaginationLinkHeader(baseUrl, page, totalPages) {
>   const links = [];
>
>   if (page > 1) {
>     links.push(`<${baseUrl}?page=1>; rel="first"`);
>     links.push(`<${baseUrl}?page=${page - 1}>; rel="prev"`);
>   }
>
>   if (page < totalPages) {
>     links.push(`<${baseUrl}?page=${page + 1}>; rel="next"`);
>     links.push(`<${baseUrl}?page=${totalPages}>; rel="last"`);
>   }
>
>   return links.join(", ");
> }
>
> // Verification tests
> const header = buildPaginationLinkHeader("https://api.com/users", 2, 5);
> console.assert(header.includes('rel="first"'), "Test 1 Failed");
> console.assert(header.includes('rel="prev"'), "Test 2 Failed");
> console.assert(header.includes('rel="next"'), "Test 3 Failed");
> console.assert(header.includes('rel="last"'), "Test 4 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **RFC 8288 Web Linking**: Standard specification for conveying pagination hypermedia links in HTTP headers.
> 2. **Standard Link Relations**: rel='next', rel='prev', rel='first', rel='last' guide REST clients.
> 3. **Header Pagination Standard**: GitHub API and modern REST APIs use Link headers for clean pagination navigation.
---

## 6. Related Terms
- [Query Parameters & Path Variables](../level_02/query_params.md) — Where the `limit` and `offset` variables are placed.
- [REST (Representational State Transfer)](../level_03/rest.md) — Designing standard URLs.
- [Latency & Bandwidth](../level_01/latency_bandwidth.md) — Related concept: Latency & Bandwidth.
- [Over-fetching vs Under-fetching](../level_07/overfetching_underfetching.md) — Related concept: Over-fetching vs Under-fetching.

---

## 7. Key Takeaways
- **Pagination** prevents servers and browsers from crashing due to massive data loads.
- **Offset/Limit** is great for static lists with explicit page numbers (`[1] [2] [3]`).
- **Cursor** is the modern standard for fast, real-time "Infinite Scroll" feeds.
