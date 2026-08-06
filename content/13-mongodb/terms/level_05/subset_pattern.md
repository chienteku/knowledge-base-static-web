# The Subset Pattern

> **Level 5 — Data Modeling & Schema Design**
> The schema design pattern where a frequently accessed portion (subset) of related data is embedded directly inside the parent document for fast initial rendering, while the complete dataset is stored in a separate, referenced collection.

---

## 1. Prerequisites

- [Embedding vs. Referencing](embedding_vs_referencing.md) — The parent modeling rules.
- [Document Size Limit (16 MB)](document_size_limit.md) — The size constraint solved.

---

## 2. Term Category

**Data Modeling** (Working Set Reduction Pattern): The Subset Pattern splits large document arrays by keeping only the most recent N items in the main document while archiving full history in a secondary collection.



---

## 3. Explanation

### Environment Context
- **Universal Standard** (Applies conceptually across all NoSQL platforms. Resolves the classic "product vs reviews" performance bottleneck in e-commerce applications).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Implementing the Subset Pattern for Product Reviews

**Scenario:**
Model a product catalog where a `product` document embeds ONLY the 5 most recent reviews (`recentReviews`), while full review history is stored in collection `reviews`.

**Requirements:**
1. Store `recentReviews: [{ author, rating, comment }]` in `product` document.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> db.products.insertOne({
>   name: "Wireless Headphones",
>   price: 99.99,
>   averageRating: 4.8,
>   totalReviews: 1250,
>   recentReviews: [ // Subset Pattern: Only 5 most recent reviews embedded!
>     { author: "Alice", rating: 5, comment: "Awesome sound!", date: new Date() },
>     { author: "Bob", rating: 4, comment: "Good value.", date: new Date() }
>   ]
> });
> ```
>
> #### Technical Explanation
>
> 1. The Subset Pattern splits large document arrays into a small embedded subset and a full secondary collection.
> 2. Product detail pages load instantly with recent reviews in a single $O(1)$ read.
> 3. Full review history is loaded via pagination from `reviews` collection only when requested.

---

### Exercise 2: Updating Embedded Subsets during New Writes

**Scenario:**
Add a new review for a product, updating both the `reviews` collection and pushing to the product's `recentReviews` subset array.

**Requirements:**
1. Insert into `reviews` and update `products.recentReviews` using `$push` with `$slice: -5`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> const productId = new ObjectId("60c72b2f9b1d8b2c88888880");
> const newReview = { author: "Carol", rating: 5, comment: "Loved it!", date: new Date() };
> 
> // 1. Insert into full history collection
> db.reviews.insertOne({ productId: productId, ...newReview });
> 
> // 2. Update embedded subset array in product document
> db.products.updateOne(
>   { _id: productId },
>   {
>     $push: {
>       recentReviews: {
>         $each: [newReview],
>         $sort: { date: -1 },
>         $slice: 5
>       }
>     },
>     $inc: { totalReviews: 1 }
>   }
> );
> ```
>
> #### Technical Explanation
>
> 1. `$push` with `$slice: 5` maintains the embedded subset array at exactly 5 items automatically.
> 2. Keeps product documents small and predictable in RAM memory.
> 3. Eliminates document growth overhead.

---

### Exercise 3: Working Set Memory Optimization

**Scenario:**
Explain how the Subset Pattern improves WiredTiger RAM cache hit ratios for e-commerce platforms.

**Requirements:**
1. Contrast full array embedding RAM usage vs Subset Pattern RAM usage.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Working Set Memory Optimization:
> - Without Subset Pattern: 1,000 reviews embedded per product -> 500KB document -> Working set RAM exhausted quickly.
> - With Subset Pattern: 5 reviews embedded per product -> 2KB document -> 250x more product documents fit in RAM cache!
> ```
>
> #### Technical Explanation
>
> 1. Keeping document sizes small ensures high-frequency product data fits in WiredTiger RAM cache.
> 2. Reduces disk reads and increases server query throughput.
> 3. Standard architecture pattern for high-traffic applications.

---



## 6. Related Terms

- [Embedding vs. Referencing](embedding_vs_referencing.md) — The parent modeling rules.
- [Document Size Limit (16 MB)](document_size_limit.md) — The physical boundary constraint.

---

## 7. Key Takeaways
- The Subset Pattern balances read speed with document size limits.
- Embeds a small, frequently read array subset inside the parent document.
- Stores the complete, unbounded dataset in a separate, referenced collection.
- Optimized for standard user access patterns (e.g. page 1 of comments).
- Requires double writes (inserting to child, pushing & slicing parent subset).
- The embedded array must be strictly capped (e.g., using `$slice: -5`).
- Essential for high-traffic listing pages (e.g. e-commerce catalogs).
