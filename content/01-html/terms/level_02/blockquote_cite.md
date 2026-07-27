# `<blockquote>` & `<cite>`

> **Level 2 — Text & Content**
> Semantic HTML elements used to group, format, and attribute external quotes and citation sources.

---

## 1. Prerequisites
- [`<p>` (Paragraph)](../level_02/p.md) — The fundamental block of text.
- [Element vs. Tag](../level_01/element_vs_tag.md) — Opening and closing tag boundaries.
- [Attribute](../level_01/attribute.md) — Providing configuration keys.

---

## 2. Term Category
- **Inline Text Semantics** (For `<cite>`) / **Structural Tag** (For `<blockquote>`)

---

## 3. Environment Context
- **Universal Browser Support** (Understood natively by all web browsers since the earliest versions of HTML).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 4: Using `<blockquote>` Merely to Indent Text Visually

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

### Mistake 5: Placing Quote Author Name Inside `<cite>` Tag

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



### Mistake 6: Using `<blockquote>` Merely to Indent Text Visually

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

### Mistake 7: Placing Quote Author Name Inside `<cite>` Tag

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

## 6. Practice Exercises

### Exercise 1: Quote Markup

**Problem:** Mark up the following quote from Abraham Lincoln's Gettysburg Address. Include the source URL (`https://www.loc.gov/resource/al0187/`) and wrap the name of the speech ("The Gettysburg Address") in the correct tag.

"Four score and seven years ago our fathers brought forth on this continent, a new nation..."

**Expected output:**
```html
<blockquote cite="https://www.loc.gov/resource/al0187/">
  <p>Four score and seven years ago our fathers brought forth on this continent, a new nation...</p>
</blockquote>
<p>— Abraham Lincoln, <cite>The Gettysburg Address</cite></p>
```

> [!check]- Answer
> - The quote itself is a block of text, so use `<blockquote>`.
> - The source URL goes in the `cite` attribute.
> - The title of the speech is a citation, so wrap it in `<cite>`.

---



### Exercise 2: Structuring Complete Blockquote with Cite

**Problem:** Structure blockquote for quote from book '1984' including URL `cite` attribute and `<cite>` tag.

**Expected output:**
```text
<blockquote cite="https://example.com/1984"><p>Big Brother is watching you.</p><footer>— George Orwell, <cite>1984</cite></footer></blockquote>
```

> [!check]- Answer
> ```html
> <blockquote cite="https://example.com/1984">
>   <p>Big Brother is watching you.</p>
>   <footer>— George Orwell, <cite>1984</cite></footer>
> </blockquote>
> ```
>
> **Explanation:** `cite` attribute holds source URL; `<cite>` tag holds work title inside quote attribution.

### Exercise 3: q Tag for Inline Quotations

**Problem:** Which tag should be used for short inline quotes embedded inside a paragraph instead of `<blockquote>`?

**Expected output:**
```text
<q> (Inline Quote element).
```

> [!check]- Answer
> ```html
> <p>He said <q>Hello</q> and left.</p>
> ```
>
> **Explanation:** `<q>` automatically adds language-appropriate quotation marks around inline quotes.



### Exercise 4: Structuring Complete Blockquote with Cite

**Problem:** Structure blockquote for quote from book '1984' including URL `cite` attribute and `<cite>` tag.

**Expected output:**
```text
<blockquote cite="https://example.com/1984"><p>Big Brother is watching you.</p><footer>— George Orwell, <cite>1984</cite></footer></blockquote>
```

> [!check]- Answer
> ```html
> <blockquote cite="https://example.com/1984">
>   <p>Big Brother is watching you.</p>
>   <footer>— George Orwell, <cite>1984</cite></footer>
> </blockquote>
> ```
>
> **Explanation:** `cite` attribute holds source URL; `<cite>` tag holds work title inside quote attribution.

### Exercise 5: q Tag for Inline Quotations

**Problem:** Which tag should be used for short inline quotes embedded inside a paragraph instead of `<blockquote>`?

**Expected output:**
```text
<q> (Inline Quote element).
```

> [!check]- Answer
> ```html
> <p>He said <q>Hello</q> and left.</p>
> ```
>
> **Explanation:** `<q>` automatically adds language-appropriate quotation marks around inline quotes.



### Exercise 6: Structuring Complete Blockquote with Cite

**Problem:** Structure blockquote for quote from book '1984' including URL `cite` attribute and `<cite>` tag.

**Expected output:**
```text
<blockquote cite="https://example.com/1984"><p>Big Brother is watching you.</p><footer>— George Orwell, <cite>1984</cite></footer></blockquote>
```

> [!check]- Answer
> ```html
> <blockquote cite="https://example.com/1984">
>   <p>Big Brother is watching you.</p>
>   <footer>— George Orwell, <cite>1984</cite></footer>
> </blockquote>
> ```
>
> **Explanation:** `cite` attribute holds source URL; `<cite>` tag holds work title inside quote attribution.

### Exercise 7: q Tag for Inline Quotations

**Problem:** Which tag should be used for short inline quotes embedded inside a paragraph instead of `<blockquote>`?

**Expected output:**
```text
<q> (Inline Quote element).
```

> [!check]- Answer
> ```html
> <p>He said <q>Hello</q> and left.</p>
> ```
>
> **Explanation:** `<q>` automatically adds language-appropriate quotation marks around inline quotes.

## 7. Related Terms
- [`<p>` (Paragraph)](../level_02/p.md) — Standard text container, often nested inside `<blockquote>`.
- [`<strong>` & `<em>`](../level_02/strong_em.md) — Inline emphasis tags that sit alongside `<cite>`.

---

## 8. Key Takeaways
- Use `<blockquote>` for multi-line block quotations.
- Browsers visually indent `<blockquote>` from the left and right margins.
- Use the `<cite>` inline tag to mark up the title of a work or source name.
- Browsers render `<cite>` in italics.
- The `cite` attribute on a `<blockquote>` is for invisible source URLs (SEO metadata).
