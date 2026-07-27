# HTML (HyperText Markup Language)

> **Level 1 — The Anatomy of a Webpage**
> The standard markup language for creating web pages.

---

## 1. Prerequisites
- None! This is the foundation of the web.

---

## 2. Term Category
- **Concept / Architecture**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In the late 1980s, physicist Tim Berners-Lee needed a way for scientists across the world to easily share and link scientific documents together over the internet. At the time, sharing information meant sending raw, unformatted text files.
He invented **HTML** (HyperText Markup Language). It solved two massive problems:
1. **HyperText**: The ability to click a piece of text and instantly jump to a completely different document (a "Link").
2. **Markup**: The ability to "mark up" raw text to give it structural meaning—telling the computer "This line is a big bold heading" or "This block is a paragraph."

It is important to note that HTML is **not** a programming language. It has no logic, no math, and no decision-making capabilities. It simply provides the structural skeleton of a web page.

### (2) Reality Metaphor
Imagine building a house. 
HTML is the blueprint and the raw wooden frame. It defines where the walls are, where the doors are, and where the windows go. It doesn't care what color the walls are painted (that's CSS), and it doesn't care if the doors automatically slide open when you walk near them (that's JavaScript). It purely defines the structure.

### (3) Code Examples

#### Short Snippet
```html
<!-- This is raw HTML. We "mark up" the text with tags! -->
<h1>Welcome to my website</h1>
<p>This is a paragraph of text describing my site.</p>
```

#### Fuller Example
```html
<!-- A very basic, structural webpage -->
<header>
  <h1>The Daily News</h1>
  <nav>
    <!-- HyperText in action: A clickable link! -->
    <a href="politics.html">Politics</a>
    <a href="sports.html">Sports</a>
  </nav>
</header>

<main>
  <article>
    <h2>Local Team Wins Championship</h2>
    <p>It was a stunning victory last night...</p>
  </article>
</main>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Treating HTML like a design tool

**The mistake:** Using HTML tags to make things look a certain way visually, rather than using them for their semantic meaning.

**Why it's wrong:** In the early 2000s, people used tags like `<b>` (bold) or `<font>` to style text. This is an anti-pattern. HTML's *only* job is to provide structural meaning for screen readers, search engines (SEO), and the browser. If you want text to look big or bold, you should use CSS. 

*Incorrect:*
```html
<!-- Using a heading tag just because you want big bold text, 
     even though this isn't actually the title of a section. -->
<h1>Click here to buy!</h1>
```

*Fix:*
```html
<!-- Use a semantically correct tag, and let CSS handle the visual size. -->
<button class="huge-buy-button">Click here to buy!</button>
```

---



### Mistake 2: Using HTML for Visual Styling Instead of Structure

**The mistake:** Using `<font size="5" color="red">` or `<b>` tags to style text visually.

**Why it's wrong:** HTML defines semantic structure only. Visual presentation MUST be handled by CSS stylesheets.

*Incorrect:*
```html
<font color="red">Warning</font> <!-- ❌ Visual styling in HTML tag -->
```

*Fix:*
```html
<span class="warning-text">Warning</span> <!-- CSS handles styling: .warning-text { color: red; } -->
```

### Mistake 3: Failing to Declare the Document Language (`lang` Attribute)

**The mistake:** Writing `<html>` without specifying the `lang` attribute.

**Why it's wrong:** Screen readers and translation engines rely on `<html lang="en">` to select correct pronunciation voices and language translators.

*Incorrect:*
```html
<html> <!-- ❌ Missing lang attribute for accessibility/screen readers -->
```

*Fix:*
```html
<html lang="en"> <!-- Primary language declared -->
```

## 6. Practice Exercises

### Exercise 1: Understanding the Acronym

**Problem:** What do the two parts of the acronym "HyperText" and "Markup Language" actually mean?

**Expected output:**
```text
HyperText: Text that contains links to other texts (the ability to click and jump).
Markup Language: A system for annotating a document in a way that is syntactically distinguishable from the text (using tags like `<p>` to define structure).
```

> [!check]- Answer
> - Think about what makes the web different from a printed book.
> - Think about what you do with a highlighter on a textbook.

---



### Exercise 2: HTML Core Language Purpose

**Problem:** Explain why HTML is classified as a Markup Language rather than a Programming Language.

**Expected output:**
```text
HTML describes document structure and content using tags; it lacks control flow logic, loops, variables, and math computation.
```

> [!check]- Answer
> ```text
> HTML describes document structure and content using tags; it lacks control flow logic, loops, variables, and math computation.
> ```
>
> **Explanation:** Markup languages annotate text structure; programming languages execute algorithmic logic.

### Exercise 3: Building Barebones Valid HTML5 Page

**Problem:** Write minimal valid HTML5 document structure containing DOCTYPE, html, head, title, body, and h1.

**Expected output:**
```text
<!DOCTYPE html><html lang="en"><head><title>App</title></head><body><h1>Hello</h1></body></html>
```

> [!check]- Answer
> ```html
> <!DOCTYPE html>
> <html lang="en">
>   <head>
>     <title>App</title>
>   </head>
>   <body>
>     <h1>Hello</h1>
>   </body>
> </html>
> ```
>
> **Explanation:** Minimal valid HTML5 document structure requires DOCTYPE, html, head with title, and body.

## 7. Related Terms
- [Element vs. Tag](../level_01/element_vs_tag.md) — The fundamental building blocks used to write HTML.
- [Block-level vs Inline Elements](../level_01/block_inline.md) — The two display behaviors of elements.
- [Void Elements (Self-closing Tags)](../level_01/void_elements.md) — Tags that do not wrap content.
- [Comments (`<!-- -->`)](../level_01/comments.md) — Notes within the source code.
- [URL (Uniform Resource Locator)](../level_01/url.md) — The address system of the web.
- [`<!DOCTYPE html>`](../level_01/doctype_html.md) — The declaration that tells the browser it is reading modern HTML.

---

## 8. Key Takeaways
- HTML is the structural foundation of every website on the internet.
- It is a markup language, not a programming language.
- It provides semantic meaning (headings, paragraphs, links) to raw text.
- It should never be used for visual styling; leave styling to CSS.
