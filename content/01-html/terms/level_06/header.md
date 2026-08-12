# `<header>`

> **Level 6 — Semantic HTML5**
> Represents introductory content, typically a group of introductory or navigational aids.

---

## 1. Prerequisites
- [Semantic HTML](semantic_html.md) — The `<header>` is a core part of the HTML5 semantic specification.
- [`<body>`](../level_01/body.md) — The `<header>` lives inside the body.
- [Nesting](../level_01/nesting.md) — Since other tags (headings, links) are nested within headers.

---

## 2. Term Category

**Semantic Tag / Landmark (Universal Browser Support)**: `<header>` is a fundamental concept in this technology stack. **Level 6 — Semantic HTML5**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Almost every webpage on the internet has a top section that contains the company logo, a search bar, and the main navigation menu. Before HTML5, developers had to wrap this in a generic `<div id="header">`.
The W3C created the `<header>` element so browsers and screen readers could easily identify the introductory banner of a page. As a "landmark" element, screen readers allow users to immediately jump to the `<header>` or skip past it entirely.
Crucially, the `<header>` tag isn't just for the top of the entire webpage. You can also use a `<header>` *inside* an article to group its specific title, author, and publication date together!

### (2) Reality Metaphor
If a webpage is a newspaper:
The `<header>` at the top of the webpage is the "Masthead" of the newspaper (The New York Times logo, the date, the main sections).
If you use a `<header>` inside a specific article, it's like the bold headline and the "Byline" (the author's name) printed right before the actual story begins.

### (3) Code Examples

#### Short Snippet
```html
<header>
  <h1>My Awesome Website</h1>
  <p>Welcome to my corner of the internet!</p>
</header>
```

#### Fuller Example
```html
<body>
  <!-- The main page header -->
  <header>
    <img src="logo.png" alt="Company Logo">
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <article>
      <!-- A header specific to this article! -->
      <header>
        <h2>Why I love HTML</h2>
        <p>Written by Jane Doe on August 1st.</p>
      </header>
      
      <p>HTML is a fantastic markup language...</p>
    </article>
  </main>
</body>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing `<header>` with `<head>`

**The mistake:** Putting metadata like `<title>` or `<link rel="stylesheet">` inside the `<header>` tag, or vice versa.

**Why it's wrong:** This is the most common mistake beginners make because the names are so similar.
- `<head>`: The invisible brain of the document. Contains metadata, CSS links, and SEO tags. User never sees it.
- `<header>`: A visible, structural block of UI inside the `<body>`. Contains logos, titles, and menus.

*Incorrect:*
```html
<header>
  <!-- WRONG: Metadata does not belong in the visual UI! -->
  <title>My Website</title>
</header>
```

*Fix:*
```html
<head>
  <title>My Website</title>
</head>
<body>
  <header>
    <h1>Welcome to My Website</h1>
  </header>
</body>
```

---



### Mistake 2: Confusing `<header>` Element with `<head>` Metadata Tag or `<h1>` Heading Tag

**The mistake:** Placing `<meta>` tags inside `<header>` or confusing `<header>` with `<head>`.

**Why it's wrong:** `<head>` contains non-rendered page metadata. `<h1>`-`<h6>` are heading text tags. `<header>` is a visible structural container for introductory navigation/branding content.

*Incorrect:*
```html
<header>
  <meta charset="UTF-8"> <!-- ❌ Meta tag belongs in <head>! -->
</header>
```

*Fix:*
```html
<head>
  <meta charset="UTF-8">
</head>
<body>
  <header>
    <h1>Site Branding</h1>
  </header>
</body>
```

### Mistake 3: Nesting `<header>` Inside `<footer>` or `<address>` Elements

**The mistake:** Placing `<header>` inside a `<footer>` or `<address>` container.

**Why it's wrong:** HTML specifications forbid nesting `<header>` elements inside `<footer>`, `<address>`, or another `<header>`.

*Incorrect:*
```html
<footer>
  <header>Footer Header</header> <!-- ❌ Illegal nesting! -->
</footer>
```

*Fix:*
```html
<footer>
  <h3>Footer Section Title</h3>
</footer>
```

## 5. Practice Exercises

### Exercise 1: The Multiple Header Rule

**Problem:** Is it valid HTML5 to have more than one `<header>` element on a single webpage?

**Expected output:**
> [!check]- Answer
> ```text
> Yes! While you typically have one main `<header>` for the whole page (the top nav bar), you can also have a `<header>` inside every single `<article>` or `<section>` to contain their specific titles and introductory text.
> ```
> - Look closely at the "Fuller Example" code snippet above.
> 
---



### Exercise 2: Structuring Primary Page Header

**Problem:** Write document `<header>` containing logo `<img>`, `<h1>` site title, and `<nav>` navigation links.

**Expected output:**
> [!check]- Answer
> ```text
> <header><img src="logo.png" alt="Logo"><h1>Acme Inc</h1><nav><a href="/">Home</a></nav></header>
> ```
> ```html
> <header>
>   <img src="logo.png" alt="Logo">
>   <h1>Acme Inc</h1>
>   <nav>
>     <a href="/">Home</a>
>   </nav>
> </header>
> ```
>
> **Explanation:** `<header>` groups introductory branding, headings, and site navigation.
> 
---

### Exercise 3: Header Landmark Role

**Problem:** Which implicit ARIA landmark role does a top-level `<header>` element convey?

**Expected output:**
> [!check]- Answer
> ```text
> banner landmark role.
> ```
> ```text
> banner landmark role.
> ```
>
> **Explanation:** Root-level `<header>` elements act as `banner` accessibility landmarks.
> 
## 6. Related Terms
- [`<head>`](../level_01/head.md) — The metadata container (do not confuse with `<header>`).
- [`<footer>`](footer.md) — The semantic opposite of the `<header>`.
- [`<nav>`](nav.md) — The navigation block commonly nested inside main headers.
- [Semantic HTML](semantic_html.md) — Related concept: Semantic HTML.

---

## 7. Key Takeaways
- The `<header>` element is a semantic container for introductory content.
- It is visually rendered just like a `<div>` (meaning it does nothing by default), but carries deep meaning for screen readers.
- You can have multiple `<header>` elements on a page (e.g., one for the whole site, and one for a specific article).
- Never confuse it with the `<head>` element!
