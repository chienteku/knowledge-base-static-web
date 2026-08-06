# SEO Fundamentals for HTML

> **Level 9 — DOM, Rendering & Accessibility**
> The practice of structuring HTML code (headings, metadata, alt attributes, and semantic elements) so that search engine crawlers (spiders) can easily read, index, and rank the webpage in search results.

---

## 1. Prerequisites
- [`<meta>`](../level_08/meta.md) — The tag that holds search descriptions.
- [`title` Attribute](../level_07/title.md) — The webpage tab title.
- [Semantic HTML](../level_06/semantic_html.md) — The structural layout tags.
- [Heading Hierarchy & Document Outline](../level_06/heading_hierarchy.md) — The sequential outline rules.

---

## 2. Term Category
- **Concept / Architecture**

---

## 3. Environment Context
- **Search Engine Architecture** (Applicable to all major search engine indexers including Google, Bing, DuckDuckGo, and Yahoo).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
You can write the most beautifully designed, highly functional website in the world. But if search engines (like Google) cannot find it or understand its content, nobody will visit.

Search engines index the web using automated software programs called **crawlers** (or **spiders**). 

Crawlers browse the web 24/7 by clicking links, downloading HTML files, and parsing the code to build a giant search catalog. 

Crawlers do not look at visual layouts. They cannot look at a CSS background color and think "this is pretty". Instead, they read the raw HTML code structure.

**Search Engine Optimization (SEO)** is the practice of optimizing your code so these crawlers understand exactly what your page is about, helping you rank highly when users type matching keywords.

---

### (2) The Key HTML Elements for SEO

To optimize a webpage, you must focus on these foundational HTML markers:

#### 1. The `<title>` Tag
The single most important SEO element on a page. It defines the headline displayed in search engine results and on browser tabs:
-   Must be unique for every page.
-   Should be under 60 characters (otherwise Google truncates it).
-   Must contain the page's primary target keyword.

#### 2. The `<meta name="description">`
The one or two-sentence summary paragraph displayed below the title in search result pages:
-   Should be under 160 characters.
-   Does not directly boost your ranking position, but acts as "ad copy" that directly affects whether users click on your link.

#### 3. Semantic Outline (`<h1>` to `<h6>`)
Spiders scan headings to build a table of contents. 
-   Only use **one** `<h1>` per page (representing the document title).
-   Use `<h2>` and `<h3>` tags sequentially to organize sections around keywords.

#### 4. Image Alt Attributes (`alt="..."`)
Search spiders are blind to pixel graphics. They read the `alt` tag to determine what an image displays, indexing it for visual searches (like Google Image Search).

#### 5. Canonical Links
If a page can be accessed via multiple URLs (e.g. `mysite.com/shop` and `mysite.com/shop?sort=price`), search engines penalize the site for "duplicate content". 
Add a canonical link in the `<head>` to declare the "master copy":
```html
<link rel="canonical" href="https://mysite.com/shop">
```

---

### (3) Code Examples

#### Non-Optimized HTML (Poor SEO)
```html
<head>
  <title>Home</title> <!-- Vague, no keywords -->
  <!-- Missing description meta -->
</head>
<body>
  <h1>My Site</h1>
  <h1>Contact Us</h1> <!-- Bad: Multiple H1 tags! -->
  <img src="graphic.png"> <!-- Missing alt description -->
</body>
```

#### Optimized HTML (Great SEO)
```html
<head>
  <meta charset="UTF-8">
  <title>Baking Sourdough Bread - Sourdough Hub Tutorial</title>
  
  <!-- Clear, keyword-rich search snippet description -->
  <meta name="description" content="Learn how to bake homemade sourdough bread with our simple guide. Covers starter prep, kneading, and baking times.">
  
  <link rel="canonical" href="https://sourdoughhub.com/guides/baking">
</head>
<body>
  <header>
    <h1>The Ultimate Sourdough Baking Guide</h1> <!-- Singular H1 -->
  </header>
  
  <main>
    <article>
      <h2>Step 1: Preparing Your Starter</h2> <!-- Structured H2 -->
      <p>Your wild yeast starter must be fed 4 hours prior...</p>
      
      <!-- Image with highly descriptive alt text -->
      <img src="starter.jpg" alt="Active bubbly sourdough starter overflowing from a glass jar">
    </article>
  </main>
</body>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using boilerplate alt texts on images

**The mistake:** Leaving out descriptive keywords in image alt tags:

```html
<!-- BAD: Scrapers will ignore this image because the description is useless! -->
<img src="chart.jpg" alt="image">
```

**Why it's wrong:** Spiders don't learn anything from the word "image". Use the alt tag to describe exactly what the graphic displays, inserting keyword targets naturally.

**Fix:**
```html
<!-- CORRECT: Highly descriptive alt tag -->
<img src="chart.jpg" alt="Bar chart showing global warming temperature rises from 2000 to 2026">
```

---



### Mistake 2: Duplicate Meta Description and Title Tags Across Multiple Pages

**The mistake:** Using identical `<title>My Website</title>` and `<meta name="description">` on all site pages.

**Why it's wrong:** Search engines flag duplicate meta titles and descriptions as low-quality content, harming SEO indexing rankings. Provide unique title and description tags per page.

*Incorrect:*
```html
<!-- Identical meta titles on home page, product page, and contact page -->
```

*Fix:*
```html
<!-- Home page: <title>Acme Corp | High Quality Widgets</title> -->
<!-- Contact: <title>Contact Support | Acme Corp</title> -->
```

### Mistake 3: Using Client-Side JavaScript Rendering for Core Text Without SSR / SSG

**The mistake:** Rendering all article body text dynamically via client JavaScript `fetch()` into empty `<div>` tags without Server-Side Rendering.

**Why it's wrong:** While modern search engine bots execute JS, relying entirely on client rendering delays indexing and risks un-indexed content. Use SSR or SSG for core text content.

*Incorrect:*
```html
<body><div id="app"></div><!-- Core text rendered via JS fetch --></body>
```

*Fix:*
```html
<!-- Deliver pre-rendered HTML text from server for instant SEO indexing -->
```

## 6. Practice Exercises

### Exercise 1: SEO Header Fix

**Problem:** You are reviewing a landing page for a local dog grooming salon. The page currently has the following tags:

```html
<head>
  <title>Welcome to the best salon in Chicago!</title>
</head>
```

How would you improve the `<title>` tag to target local keywords like "dog grooming Chicago" and "pet salon"?

**Expected output:**
> [!check]- Answer
> ```html
> <title>Dog Grooming Chicago | Pet Salon Services - Bark & Bubble</title>
> ```
> - Place the primary target keywords near the beginning of the title.
> - Include the brand name at the end separated by a dash or pipe.
> 
---



### Exercise 2: Core Technical SEO HTML Checklist

**Problem:** List 4 essential HTML elements required for technical SEO optimization.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Unique, descriptive <title> tag
> 2. Meta description tag
> 3. Single <h1> headline per page
> 4. Descriptive alt text on <img> elements
> ```
> ```text
> 1. Unique, descriptive <title> tag
> 2. Meta description tag
> 3. Single <h1> headline per page
> 4. Descriptive alt text on <img> elements
> ```
>
> **Explanation:** Technical SEO requires clear, machine-readable page metadata and semantic structure.
> 
---

### Exercise 3: Meta Description Character Limit

**Problem:** What is the recommended character count limit for `<meta name="description">` to prevent truncation in Google search results?

**Expected output:**
> [!check]- Answer
> ```text
> 150 to 160 characters.
> ```
> ```text
> 150 to 160 characters.
> ```
>
> **Explanation:** Keeping meta descriptions under 160 characters prevents search snippet clipping.
> 
## 7. Related Terms
- [`<meta>`](../level_08/meta.md) — The container for search descriptions.
- [`title` Attribute](../level_07/title.md) — The primary SEO page title.
- [Semantic HTML](../level_06/semantic_html.md) — Structural layout tags crawled by spiders.
- [Heading Hierarchy & Document Outline](../level_06/heading_hierarchy.md) — Nesting rules for document indices.
- [Open Graph Tags (`og:`)](../level_08/open_graph.md) — Metadata tags used for social media shared preview cards.

---

## 8. Key Takeaways
- SEO for HTML is the practice of writing clean, semantic markup that search engine crawlers can parse easily.
- The `<title>` tag is the most critical on-page SEO element; keep it under 60 characters and lead with keywords.
- Meta descriptions provide the search result text snippet (keep under 160 characters).
- Only use one `<h1>` tag per page to represent the page title.
- Always write descriptive, keyword-rich `alt` attributes on images.
- Use `<link rel="canonical">` to prevent duplicate content search penalties.
