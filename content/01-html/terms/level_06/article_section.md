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
- **Semantic Tag**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Article vs Section

**Problem:** You are building a Twitter/X clone. Is a single "Tweet" an `<article>` or a `<section>`?

**Expected output:**
> [!check]- Answer
> ```text
> An `<article>`. A Tweet is completely self-contained. It has an author, a timestamp, and a message. If you took that single Tweet and embedded it on a different website, it would still make perfect sense.
> ```
> - Apply the "Scissor Test." If you cut it out and hand it to a stranger, does it make sense?

---



### Exercise 2: Semantic Tag Matrix: Article vs Section

**Problem:** Select `<article>` or `<section>` for:
1. Blog post listing item (`<article>`)
2. 'About Us' tab section on company page (`<section>`)
3. User comment in a forum thread (`<article>`)
4. Product features grid section (`<section>`)

**Expected output:**
> [!check]- Answer
> ```text
> 1. article
> 2. section
> 3. article
> 4. section
> ```
> ```text
> 1. article (standalone syndicatable content)
> 2. section (thematic content division)
> 3. article (independent user comment)
> 4. section (thematic features division)
> ```
>
> **Explanation:** `<article>` for independent reusable content; `<section>` for thematic document sub-divisions.

---

### Exercise 3: Section Heading Requirement

**Problem:** What element should almost always be included as the first child inside a `<section>`?

**Expected output:**
> [!check]- Answer
> ```text
> A heading element (<h2> - <h6>).
> ```
> ```html
> <section>
>   <h2>Section Title</h2>
>   <p>Content...</p>
> </section>
> ```
>
> **Explanation:** Semantic `<section>` elements require a heading to establish document outline hierarchy.

## 7. Related Terms
- [`<div>` (Block container)](../level_02/div.md) — The non-semantic wrapper you should use if your block doesn't warrant an `<article>` or `<section>`.
- [`<main>`](main.md) — The parent container for these elements.
- [`<aside>`](aside.md) — The tangential layout block placed next to articles.
- [`<address>`](address.md) — Related concept: `<address>`.
- [`<footer>`](footer.md) — Related concept: `<footer>`.
- [Heading Hierarchy & Document Outline](heading_hierarchy.md) — Related concept: Heading Hierarchy & Document Outline.
- [Semantic HTML](semantic_html.md) — Related concept: Semantic HTML.
---

## 8. Key Takeaways
- Use `<article>` for independent, self-contained content (Blog posts, comments, tweets, news stories).
- Use `<section>` for thematic groupings of content, which usually require a heading (Chapters, tabbed content, related products).
- Do not use either of them as generic wrappers for CSS styling; use `<div>` for that.
