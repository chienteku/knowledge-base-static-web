# `<blockquote>` & `<cite>`

> **Level 2 — Text & Content**
> Semantic HTML elements used to group, format, and attribute external quotes and citation sources.

---

## 1. Prerequisites
- [`<p>` (Paragraph)](p.md) — The fundamental block of text.
- [Element vs. Tag](../level_01/element_vs_tag.md) — Opening and closing tag boundaries.
- [Attribute](../level_01/attribute.md) — Providing configuration keys.

---

## 2. Term Category

**Inline Text Semantics (For `<cite>`) / Structural Tag (For `<blockquote>`) (Universal Browser Support .)**: `<blockquote>` & `<cite>` is a fundamental concept in this technology stack. **Level 2 — Text & Content**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing articles, essays, or research papers, you often need to quote text from other authors, books, or websites. 

You could simply copy-paste the text, wrap it in a regular paragraph `<p>` tag, and style it to be italicized. However, a web browser, search engine, or screen reader would not understand that the text is a quotation, nor would they know where the quote originated.

HTML provides two specialized elements to represent quotations semantically:
1.  **`<blockquote>`:** A block-level container used for large, stand-alone quotes. Browsers automatically indent `<blockquote>` content from the left and right margins to separate it visually from surrounding text.
2.  **`<cite>流通`:** An inline tag used to wrap the title of the work (a book, speech, paper, or website) or the name of the source. Browsers typically render the text inside `<cite>` in italics.

---

### (2) The `cite` Attribute vs the `<cite>` Element
It is very common for beginners to confuse these two:
-   **The `cite` Attribute:** A configuration attribute placed inside the opening `<blockquote>` tag. It accepts a URL pointing to the source of the quote. This is invisible to the user but highly valuable for search engines and web crawlers.
-   **The `<cite>` Element:** A visible inline tag placed inside or after the quote to name the source work/author.

```html
<blockquote cite="https://www.gutenberg.org/files/11/11-h/11-h.htm">
  <p>Alice was beginning to get very tired of sitting by her sister on the bank...</p>
</blockquote>
<p>— From <cite>Alice's Adventures in Wonderland</cite> by Lewis Carroll</p>
```

---

### (3) Code Examples

#### Short Snippet
A simple nested blockquote showing visual indentation and attribution:

```html
<blockquote>
  <p>To be, or not to be, that is the question...</p>
</blockquote>
<p>— William Shakespeare, <cite>Hamlet</cite></p>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inspirational Quotes</title>
</head>
<body>

  <h1>Famous Quotes in Technology</h1>

  <!-- blockquote with source URL metadata -->
  <blockquote cite="https://www.w3.org/People/Berners-Lee/">
    <p>
      The Web is more a social creation than a technical one. I designed it for a social effect—to help people work together—and not as a technical toy.
    </p>
  </blockquote>
  
  <!-- cite element wrapping the title of the source book -->
  <p>
    — Tim Berners-Lee, author of <cite>Weaving the Web</cite>
  </p>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing the `cite` attribute with the `<cite>` tag

**The mistake:** Trying to put the visible attribution name inside the `cite` attribute, or placing the source URL directly inside `<cite>` text:

```html
<!-- BAD: The cite attribute only accepts a URL address, not text labels -->
<blockquote cite="Tim Berners-Lee">
  <p>The Web is more a social creation...</p>
</blockquote>
```

**Why it's wrong:** The `cite` attribute must strictly be a URL. Putting plain text in it violates validation. 

**Golden Rule:** Use the `cite=""` attribute inside the opening tag for URLs; use the `<cite>` tag inside the text flow for the name of the work/author.

---



### Mistake 2: Using `<blockquote>` Merely to Indent Text Visually

**The mistake:** Wrapping standard body paragraphs in `<blockquote>` just to add left margin indentation.

**Why it's wrong:** `<blockquote>` represents an extended quotation from another source. Using it for visual margin indentation corrupts semantic document structure for screen readers. Use CSS `margin-left`.

*Incorrect:*
```html
<blockquote>Indented paragraph text</blockquote> <!-- ❌ Improper semantic usage -->
```

*Fix:*
```html
<p class="indented-text">Indented paragraph text</p>
```

### Mistake 3: Placing Quote Author Name Inside `<cite>` Tag

**The mistake:** Writing `<cite>Albert Einstein</cite>` inside a quotation footer.

**Why it's wrong:** HTML5 specifications explicitly declare `<cite>` represents the TITLE of a work (book, essay, song, movie), NOT the author's person name.

*Incorrect:*
```html
<blockquote>Genius is 1% inspiration...</blockquote>
<p>— <cite>Thomas Edison</cite></p> <!-- ❌ Author name in cite tag -->
```

*Fix:*
```html
<blockquote>Genius is 1% inspiration...</blockquote>
<p>— Thomas Edison, <cite>The Art of Invention</cite></p>
```

## 5. Practice Exercises

### Exercise 1: Structuring Long Quotations with blockquote and figcaption

**Scenario:** A publisher formats a multi-paragraph quotation from an external research paper using `<figure>`, `<blockquote>`, `<figcaption>`, and `<cite>`.

**Requirements:**
1. Wrap quote in a `<figure>` element.
2. Use `blockquote` with a `cite` URL attribute.
3. Include `<figcaption>` with a `<cite>` element for author attribution.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <figure class="quote-card">
>   <blockquote cite="https://www.w3.org/TR/html52/">
>     <p>The HTML specification defines the abstract structure and semantics of documents, providing the foundation for accessibility and interoperability across the Web.</p>
>   </blockquote>
>   <figcaption>
>     &mdash; W3C Editorial Team, <cite><a href="https://www.w3.org/TR/html52/">HTML 5.2 Recommendation</a></cite>
>   </figcaption>
> </figure>
> ```
>
> #### Technical Explanation
>
> 1. **The `<blockquote>` Element**: Represents a section that is quoted from another external source; indented by default in browsers.
> 2. **The `cite` Attribute**: The machine-readable `cite="URL"` attribute on `blockquote` links to the original online source document.
> 3. **The `<cite>` Tag**: The `<cite>` element represents the title of a work (book, paper, specification); it must contain the title, not the author's name.
> 
---

### Exercise 2: Inline Quotations and Work Citations with q and cite

**Scenario:** An author quotes a famous line inline within a narrative paragraph.

**Requirements:**
1. Use `<q>` for short inline quotations.
2. Include a `cite` URL attribute on `<q>`.
3. Use `<cite>` for the title of the work.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <p>
>   As Tim Berners-Lee wrote in his seminal work <cite>Weaving the Web</cite>, 
>   <q cite="https://www.w3.org/People/Berners-Lee/">The Web is more a social creation than a technical one.</q>
> </p>
> ```
>
> #### Technical Explanation
>
> 1. **The `<q>` Element**: Represents a short inline quotation; browsers automatically insert appropriate quotation marks around `<q>` content.
> 2. **Automatic Quotation Marks**: Do NOT manually type quote marks inside `<q>`; browsers handle localized quote punctuation automatically.
> 3. **Inline Work Citation**: `<cite>` marks the title of the cited work inline without breaking paragraph flow.
> 
---

### Exercise 3: Academic & Legal Reference Blockquote Formatting

**Scenario:** A legal portal formats statutory quotes with citation links.

**Requirements:**
1. Format statutory text in `blockquote`.
2. Include attribution in `<figcaption>`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <figure class="legal-quote">
>   <blockquote cite="https://www.law.example.gov/section-508">
>     <p>Individuals with disabilities shall have access to and use of information that is comparable to the access provided to individuals without disabilities.</p>
>   </blockquote>
>   <figcaption>
>     Section 508 Amendment, <cite><a href="https://www.law.example.gov/section-508">Rehabilitation Act of 1973</a></cite>
>   </figcaption>
> </figure>
> ```
>
> #### Technical Explanation
>
> 1. **Accessible Citation Architecture**: Combining `<figure>` and `<figcaption>` explicitly associates the citation caption with the `blockquote`.
> 2. **Screen Reader Announcement**: Screen readers announce 'blockquote start' and 'blockquote end' when encountering `blockquote` tags.
> 3. **Machine-Readable Metadata**: The `cite` attribute provides programmatic traceability for automated web crawlers.
## 6. Related Terms
- [`<p>` (Paragraph)](p.md) — Standard text container, often nested inside `<blockquote>`.
- [`<strong>` & `<em>`](strong_em.md) — Inline emphasis tags that sit alongside `<cite>`.

---

## 7. Key Takeaways
- Use `<blockquote>` for multi-line block quotations.
- Browsers visually indent `<blockquote>` from the left and right margins.
- Use the `<cite>` inline tag to mark up the title of a work or source name.
- Browsers render `<cite>` in italics.
- The `cite` attribute on a `<blockquote>` is for invisible source URLs (SEO metadata).
