# `<article>` and `<section>`

> **Level 6 — Semantic HTML5**
> Semantic tags used to break up large blocks of content into logical pieces.

---

## 1. Prerequisites
- [Semantic HTML](semantic_html.md) — Understanding that these replace generic `<div>` elements.
- [`<main>`](main.md) — These tags are almost always placed inside the `<main>` container.
- [Nesting](../level_01/nesting.md) — Since sections and nested articles represent structural hierarchies.

---

## 2. Term Category

**Semantic Tag (Universal Browser Support)**: `<article>` and `<section>` is a fundamental concept in this technology stack. **Level 6 — Semantic HTML5**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Once you define your `<main>` content area, you need to organize it. If a page has 5,000 words, dumping it all into paragraphs is messy. 
Before HTML5, developers used `<div class="post">` and `<div class="chapter">`. The W3C introduced `<article>` and `<section>` to give these structural blocks true semantic meaning.
- **`<article>`**: Represents a completely self-contained piece of content. If you could rip this block of code out and paste it onto a different website (or put it in an RSS feed) and it still made perfect sense on its own, it should be an `<article>`. (e.g., a blog post, a news story, a forum comment).
- **`<section>`**: Represents a thematic grouping of content, usually with its own heading. It is NOT self-contained. It only makes sense in the context of the larger page. (e.g., the "Features" section of a product page, or "Chapter 1" of a book).

### (2) Reality Metaphor
Imagine a newspaper.
The **`<article>`** is a specific news story about a bank robbery. You could cut this story out with scissors, hand it to a friend, and they would understand the whole story.
The **`<section>`** is the "Sports Page" or the "Classifieds". If you cut out just the title "Sports Page" and handed it to a friend without the actual articles inside it, it wouldn't make any sense on its own.

### (3) Code Examples

#### Short Snippet
```html
<article>
  <!-- Self-contained content -->
  <h2>Breaking News!</h2>
  <p>An alien spaceship has landed.</p>
</article>

<section>
  <!-- A thematic grouping within a larger document -->
  <h2>Contact Information</h2>
  <p>Email us at hello@earth.com</p>
</section>
```

#### Fuller Example
```html
<main>
  <!-- The main blog post is self-contained -->
  <article>
    <header>
      <h1>How to train your dog</h1>
      <p>By Jane Smith</p>
    </header>
    
    <!-- We break the long article into thematic chapters using sections -->
    <section>
      <h2>Chapter 1: The Basics</h2>
      <p>Start with sit and stay.</p>
    </section>
    
    <section>
      <h2>Chapter 2: Advanced Tricks</h2>
      <p>Teach them to fetch the newspaper.</p>
    </section>
    
    <!-- A comment is ALSO self-contained, so we can nest articles inside articles! -->
    <section>
      <h2>Comments</h2>
      <article>
        <p><strong>Bob:</strong> Great article!</p>
      </article>
    </section>
  </article>
</main>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `<section>` as a generic wrapper

**The mistake:** Using `<section>` instead of a `<div>` just to group some elements together so you can apply a CSS background color.

**Why it's wrong:** The W3C dictates that a `<section>` is a semantic outline element, meaning it almost *always* requires a heading (`<h2>`, `<h3>`, etc.) inside it. If you are just grouping things together for visual styling and there is no natural heading, you should use a generic `<div>`.

*Incorrect:*
```html
<!-- Used just to apply a blue background -->
<section class="bg-blue">
  <img src="logo.png">
  <button>Click Here</button>
</section>
```

*Fix:*
```html
<!-- Generic wrappers for styling should be Divs -->
<div class="bg-blue">
  <img src="logo.png">
  <button>Click Here</button>
</div>
```

---



### Mistake 2: Confusing `<article>` with `<section>` Containers

**The mistake:** Using `<section>` for self-contained standalone blog posts, or `<article>` for generic page divisions.

**Why it's wrong:** `<article>` represents self-contained content that makes complete sense on its own (syndicatable, e.g. blog post, news story, comment). `<section>` represents a thematic grouping of content typically with a heading.

*Incorrect:*
```html
<section>
  <h2>Standalone Blog Post Title</h2> <!-- Standalone post should be article -->
  <p>Full article content...</p>
</section>
```

*Fix:*
```html
<article>
  <h2>Standalone Blog Post Title</h2>
  <p>Full article content...</p>
</article>
```

### Mistake 3: Using `<section>` as a Wrapper for Pure CSS Styling (Instead of `<div>`)

**The mistake:** Wrapping elements in `<section class="container-flex">` solely for CSS layout positioning.

**Why it's wrong:** `<section>` carries semantic meaning and requires a thematic heading. For pure CSS layout wrappers, use `<div>`.

*Incorrect:*
```html
<section class="flex-row"> <!-- ❌ Semantic section used as CSS flexbox wrapper -->
  <button>OK</button>
</section>
```

*Fix:*
```html
<div class="flex-row">
  <button>OK</button>
</div>
```

## 5. Practice Exercises

### Exercise 1: Structuring Independent Reusable News Cards using article

**Scenario:** A developer structures a news portal feed using `<article>` tags for self-contained blog post entries.

**Requirements:**
1. Wrap each standalone post in an `<article>` container.
2. Include a heading (`<h2>` or `<h3>`) in each article.
3. Add article publication metadata.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <main class="news-feed">
>   <h1>Latest Tech News</h1>
>
>   <article class="news-card">
>     <h2>Web Standards 2026 Update</h2>
>     <p class="byline">Published on <time datetime="2026-08-12">August 12, 2026</time></p>
>     <p>The W3C announced updated accessibility guidelines for web applications.</p>
>     <a href="/news/web-standards-2026">Read Full Article</a>
>   </article>
>
>   <article class="news-card">
>     <h2>CSS Grid Level 3 Draft</h2>
>     <p class="byline">Published on <time datetime="2026-08-10">August 10, 2026</time></p>
>     <p>New masonry layout features are coming to native browser CSS grid engines.</p>
>     <a href="/news/css-grid-level-3">Read Full Article</a>
>   </article>
> </main>
> ```
>
> #### Technical Explanation
>
> 1. **The `<article>` Element**: Represents a complete, self-contained composition intended to be independently reusable or distributable (e.g. blog post, news story, product card).
> 2. **Individually Syndicatable**: An `<article>` should make complete sense on its own if syndicated in an RSS feed or shared on social media.
> 3. **Mandatory Heading Requirement**: Every `<article>` should contain a heading element (`<h2>`-`<h6>`) identifying its topic.
> 
---

### Exercise 2: Grouping Related Topical Content Sub-themes using section

**Scenario:** A developer divides a product page into distinct thematic sub-sections using `<section>` elements.

**Requirements:**
1. Wrap thematic groups in `<section>` elements.
2. Ensure every `<section>` begins with a heading tag.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <main>
>   <h1>Acme Cloud Storage</h1>
>
>   <section id="features">
>     <h2>Key Features</h2>
>     <p>Automatic sync, end-to-end encryption, and multi-device support.</p>
>   </section>
>
>   <section id="pricing">
>     <h2>Subscription Plans</h2>
>     <p>Flexible pricing for teams of all sizes.</p>
>   </section>
> </main>
> ```
>
> #### Technical Explanation
>
> 1. **The `<section>` Element**: Represents a standalone generic section of a document grouped by a single thematic topic.
> 2. **Heading Requirement**: A `<section>` MUST have a heading (`<h2>`-`<h6>`) establishing its region name in the document outline.
> 3. **Section vs Article Rule**: Use `<article>` for independent reusable items; use `<section>` for dividing a single larger document into thematic chapters.
> 
---

### Exercise 3: Nested Articles inside Section Containers

**Scenario:** Combines `<section>` and `<article>` to build a blog feed container.

**Requirements:**
1. Wrap blog feed in a `<section>`.
2. Nest individual `<article>` posts inside.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <section class="blog-feed">
>   <h2>Recent Posts</h2>
>   <article class="post">
>     <h3>Understanding ARIA Roles</h3>
>     <p>Guide to accessible web roles.</p>
>   </article>
> </section>
> ```
>
> #### Technical Explanation
>
> 1. **Parent-Child Nesting**: Articles can be nested inside sections (`<section><article>`), and sections can be nested inside articles (`<article><section>`).
> 2. **Document Outline Tree**: Keeps the document outline structured for search engine crawlers.
> 3. **Screen Reader Navigation**: Enables landmark navigation between major page chapters.
## 6. Related Terms
- [`<div>` (Block container)](../level_02/div.md) — The non-semantic wrapper you should use if your block doesn't warrant an `<article>` or `<section>`.
- [`<main>`](main.md) — The parent container for these elements.
- [`<aside>`](aside.md) — The tangential layout block placed next to articles.
- [`<address>`](address.md) — Related concept: `<address>`.
- [`<footer>`](footer.md) — Related concept: `<footer>`.
- [Heading Hierarchy & Document Outline](heading_hierarchy.md) — Related concept: Heading Hierarchy & Document Outline.
- [Semantic HTML](semantic_html.md) — Related concept: Semantic HTML.

---

## 7. Key Takeaways
- Use `<article>` for independent, self-contained content (Blog posts, comments, tweets, news stories).
- Use `<section>` for thematic groupings of content, which usually require a heading (Chapters, tabbed content, related products).
- Do not use either of them as generic wrappers for CSS styling; use `<div>` for that.
