# Pagination (Offset vs. Cursor)

> **Level 6 — Advanced API Concepts**
> The strategy of dividing a massive dataset into smaller, manageable "pages" so the API doesn't crash trying to send millions of records at once.

---

## 1. Prerequisites
- [Query Parameters](../level_02/query_params.md) — Pagination is almost exclusively handled via query parameters.

---

## 2. Term Category
- **API Design / Data Management**

---

## 3. Environment Context
- **Backend Architecture & Frontend UI**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Which Pagination?

**Problem:** You are building an internal company dashboard to display a list of 500 employees. Users want to click buttons at the bottom that say `[1] [2] [3] [4] [5]`. Which pagination strategy should you use?

**Expected output:**
```text
Offset Pagination. 
Cursor pagination does not support specific page numbers (you can't jump directly to Page 4 using a cursor without knowing the ID of the last item on Page 3). Because the dataset is small (500 items) and doesn't update every millisecond, Offset is perfect here.
```

> [!check]- Answer
> - Does the user want infinite scroll, or explicit page numbers?

---

### Exercise 2: Cursor vs Offset Pagination Comparison

**Problem:** Compare Offset-Based vs Cursor-Based Pagination on:
1. Deep page query performance
2. Ability to jump directly to page 50
3. Resistance to item duplication during live writes

**Expected output:**
```text
1. Offset degrades on deep pages; Cursor maintains constant O(1) performance
2. Offset supports arbitrary page jumping; Cursor does not
3. Offset suffers page drift; Cursor is immune to page drift
```

> [!check]- Answer
> ```text
> 1. Deep Page Speed -> Offset: Slow O(N), Cursor: Fast O(1)
> 2. Direct Page Jump -> Offset: Supported, Cursor: Not supported
> 3. Live Write Safety -> Offset: Vulnerable to page drift, Cursor: Immune
> ```
> - **Explanation:** Cursor pagination optimizes performance; Offset pagination permits random page access.
---

### Exercise 3: Standard Pagination Link Envelope

**Problem:** Write standard JSON pagination metadata envelope containing `data`, `next_cursor`, `has_more`.

**Expected output:**
```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6MTAwfQ==",
    "has_more": true
  }
}
```

> [!check]- Answer
> ```json
> {
> "data": [ { "id": 101, "title": "Post 101" } ],
> "pagination": {
> "next_cursor": "eyJpZCI6MTAwfQ==",
> "has_more": true
> }
> }
> ```
> - **Explanation:** Pagination metadata envelopes supply cursor tokens for fetching subsequent pages.
---

## 7. Related Terms
- [Query Parameters](../level_02/query_params.md) — Where the `limit` and `offset` variables are placed.
- [REST](../level_03/rest.md) — Designing standard URLs.

---

## 8. Key Takeaways
- **Pagination** prevents servers and browsers from crashing due to massive data loads.
- **Offset/Limit** is great for static lists with explicit page numbers (`[1] [2] [3]`).
- **Cursor** is the modern standard for fast, real-time "Infinite Scroll" feeds.
