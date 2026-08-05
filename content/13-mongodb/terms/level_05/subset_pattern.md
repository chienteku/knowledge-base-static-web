# The Subset Pattern

> **Level 5 — Data Modeling & Schema Design**
> The schema design pattern where a frequently accessed portion (subset) of related data is embedded directly inside the parent document for fast initial rendering, while the complete dataset is stored in a separate, referenced collection.

---

## 1. Prerequisites

- [Embedding vs. Referencing](embedding_vs_referencing.md) — The parent modeling rules.
- [Document Size Limit (16 MB)](document_size_limit.md) — The size constraint solved.

---

## 2. Term Category
- **Database Theory / Design Pattern**

---

## 3. Environment Context
- **Universal Standard** (Applies conceptually across all NoSQL platforms. Resolves the classic "product vs reviews" performance bottleneck in e-commerce applications).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When modeling a One-to-Many relationship (like products and reviews, or blog posts and comments), developers face a difficult trade-off:
-   **If you embed all reviews:** You get fast reads when loading the product page (1 query fetches everything). 
    -   *The Problem:* If a product gets 10,000 reviews, the document bloats. Fetching a list of products will pull megabytes of reviews into RAM, slowing down your server, and eventually crashing when hitting the 16MB limit.
-   **If you reference all reviews:** You keep the product document small.
    -   *The Problem:* To display a product page, your app must now run a slow join (`$lookup`) or execute a second database query to fetch the reviews.

We designed **The Subset Pattern** to solve this dilemma.

It is based on a real-world user access pattern: **90% of users only look at the first few reviews when loading a product page.** 

Instead of choosing between embedding and referencing, you do both:
1.  **Embed a small subset** (e.g. the 5 most recent reviews) directly inside the product document.
2.  **Store the full list** of reviews in a separate `reviews` collection.

When a user loads the page, your app displays the product and the 5 embedded reviews instantly in 1 query. 

If they click `"Show all reviews"`, your app queries the separate collection for the rest.

---

### (2) Read vs. Write Trade-off
-   **Read Path:** Optimized to the absolute limit. A single query loads the homepage/product detail page immediately.
-   **Write Path:** Slightly more complex. When a user writes review #6, the application must:
    -   Insert the full review into the `reviews` collection.
    -   Update the product's `recent_reviews` array, pushing the new review, sorting, and slicing the array to keep only the top 5 (discarding the oldest one from the subset).

---

### (3) Reality Metaphor (Magazine Previews)
Imagine reading a print magazine:
-   **Full Embedding:** Binding a 500-page novel inside a thin weekly gossip magazine. The magazine becomes too heavy to carry or read.
-   **Full Referencing:** Printing a line in the magazine saying: *"We interviewed Bob. Read his interview at the main library."* (Frustrating for readers).
-   **Subset Pattern:** Printing a **1-page Teaser Summary** of Bob's interview in the magazine (the subset), with a link at the bottom: *"Read the full 50-page transcript on our website"* (the referenced collection).

---

### (4) Code Examples

#### Implementing the Subset Pattern (Product & Reviews)
The product document contains a small list of the latest reviews:

```javascript
// Collection: products
{
  _id: ObjectId("60c72b2f9b1d8b2e88a8d111"),
  name: "Air Running Shoes",
  price: NumberDecimal("120.00"),
  
  // Embedded Subset: Only store the 3 most recent reviews!
  recent_reviews: [
    { reviewer: "Alice", score: 5, comment: "Awesome fit!" },
    { reviewer: "Bob", score: 4, comment: "Very comfortable." },
    { reviewer: "Charlie", score: 5, comment: "Fast shipping." }
  ]
}

// Collection: reviews (Stores every review ever written)
{
  _id: ObjectId("65fc71239b1d8b2e88a8d222"),
  product_id: ObjectId("60c72b2f9b1d8b2e88a8d111"),
  reviewer: "Alice",
  score: 5,
  comment: "Awesome fit!",
  created_at: new Date()
}
// (This collection holds thousands of records, which are queried only on demand).
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Failing to keep the embedded subset array capped, allowing it to grow indefinitely

**The mistake:** Implementing the subset pattern but forgetting to slice or limit the embedded array during updates, allowing `recent_reviews` to grow to 1,000 entries.

**Why it's wrong:** If the array grows without limits, you lose all benefits of the pattern. 

The document bloats, RAM cache is wasted, and you will eventually hit the 16MB document size ceiling.

**Fix: When adding new items to the subset, always use the `$slice` modifier inside your `$push` update query to lock the array size (e.g. keeping only the top 5 elements).**

```javascript
// CORRECT (Pushes a review, sorts by date, and caps the array size at 5)
db.products.updateOne(
  { _id: 101 },
  {
    $push: {
      recent_reviews: {
        $each: [ { reviewer: "Dave", score: 5, comment: "Nice!" } ],
        $slice: -5 // Keep only the last 5 elements
      }
    }
  }
);
```

---



### Mistake 2: Embedding 10,000 Items in Primary Documents When Only 5 Recent Items Are Ever Displayed

**The mistake:** Embedding 10,000 reviews inside `product.reviews` when UI product pages display only the top 5 recent reviews.

**Why it's wrong:** Loading 10,000 reviews on every product page view bloats network payloads and WiredTiger RAM. Subset Pattern embeds top 5 recent reviews in `product.recentReviews` and offloads all 10,000 to `reviews` collection.

*Incorrect:*
```javascript
{ name: "Product", reviews: [ ... 10,000 items ] } // ❌ Bloats every product view!
```

*Fix:*
```javascript
{ name: "Product", recentReviews: [ ... 5 items ] } // Offload full reviews to separate collection
```

### Mistake 3: Forgetting to Sync Recent Subset Arrays When Adding New Items

**The mistake:** Adding a new review to `reviews` collection without updating `product.recentReviews` subset array.

**Why it's wrong:** Application code must keep the recent subset array updated (e.g. `$push: { recentReviews: { $each: [newReview], $slice: -5 } }`).

*Incorrect:*
```javascript
// Inserting review to reviews collection only without updating product subset
```

*Fix:*
```javascript
db.products.updateOne({ _id: pId }, { $push: { recentReviews: { $each: [newReview], $slice: -5 } } });
```

## 6. Practice Exercises

### Exercise 1: Subset Schema Design

**Problem:** You are designing a news website. The article view page displays the article text and the **3 most popular comments** at the bottom. The article has thousands of comments. 
1.  Explain how you would apply the Subset Pattern to this schema.
2.  Sketch the resulting article document outline.

**Expected output:**
> [!check]- Answer
> ```text
> 1. I would embed an array named `top_comments` containing only the top 3 comments (storing fields: author, text, and likes) directly inside the article document. All other comments are saved as individual documents in a separate `comments` collection, referenced by `article_id`.
> ```
> - Only the fields needed for the initial render should be inside the subset.
> - Ensure the embedded array has a strict size boundary in the concept description.

---



### Exercise 2: Subset Pattern Array Capping with `$slice`

**Problem:** Push new review into `recentReviews` keeping ONLY the 5 most recent reviews using `$slice: -5`.

**Expected output:**
> [!check]- Answer
> ```text
> db.products.updateOne({ _id: 1 }, { $push: { recentReviews: { $each: [newReview], $slice: -5 } } });
> ```
> ```javascript
> db.products.updateOne(
>   { _id: 1 },
>   { $push: { recentReviews: { $each: [newReview], $slice: -5 } } }
> );
> ```
>
> **Explanation:** `$slice: -N` caps array fields to the N most recent items, implementing Subset Pattern caching.

---

### Exercise 3: Subset Pattern Benefit

**Problem:** What is the primary performance benefit of the Subset Pattern? (Reduces document size and memory working set while satisfying primary UI read queries in a single read).

**Expected output:**
> [!check]- Answer
> ```text
> Reduces document size and memory working set while satisfying primary UI read queries
> ```
> ```text
> Reduces document size and memory working set while satisfying primary UI read queries
> ```
>
> **Explanation:** Subset Pattern optimizes working set RAM by storing only frequently accessed subset data.

## 7. Related Terms

- [Embedding vs. Referencing](embedding_vs_referencing.md) — The parent modeling rules.
- [Document Size Limit (16 MB)](document_size_limit.md) — The physical boundary constraint.

---

## 8. Key Takeaways
- The Subset Pattern balances read speed with document size limits.
- Embeds a small, frequently read array subset inside the parent document.
- Stores the complete, unbounded dataset in a separate, referenced collection.
- Optimized for standard user access patterns (e.g. page 1 of comments).
- Requires double writes (inserting to child, pushing & slicing parent subset).
- The embedded array must be strictly capped (e.g., using `$slice: -5`).
- Essential for high-traffic listing pages (e.g. e-commerce catalogs).
