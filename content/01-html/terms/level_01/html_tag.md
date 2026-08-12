# `<html>`

> **Level 1 — The Anatomy of a Webpage**
> The root element that wraps all content on the page.

---

## 1. Prerequisites
- [`<!DOCTYPE html>`](doctype_html.md) — The declaration that precedes the `<html>` tag.
- [Nesting](nesting.md) — Since the root element acts as the top-level parent container wrapping all child nodes.

---

## 2. Term Category

**Structural Tag (Universal Browser Support)**: `<html>` is a fundamental concept in this technology stack. **Level 1 — The Anatomy of a Webpage**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A web browser needs to know where the actual content of a web document begins and ends. The `<html>` tag acts as the ultimate container, often referred to as the "Root Element." 
Absolutely everything that belongs to your webpage (the metadata, the text, the images, the layout) must be placed inside the opening `<html>` and closing `</html>` tags. The only thing that exists outside of it is the DOCTYPE declaration.

Additionally, the `<html>` tag is the perfect place to declare the primary language of the document. This is incredibly important for Accessibility (Screen Readers) and Search Engine Optimization (SEO).

### (2) Reality Metaphor
Imagine a webpage is a cardboard box being shipped in the mail.
The `<!DOCTYPE html>` is the shipping label on the outside of the box.
The `<html>` element is the physical cardboard box itself. Everything you are shipping goes *inside* the box.

### (3) Code Examples

#### Short Snippet
```html
<!DOCTYPE html>
<!-- The root element begins -->
<html lang="en">
  <!-- All page content goes here -->
</html>
<!-- The root element ends -->
```

#### Fuller Example
```html
<!DOCTYPE html>
<!-- We define the language of the entire document as English -->
<html lang="en">
  <head>
    <!-- Metadata goes here -->
    <title>My Blog</title>
  </head>
  <body>
    <!-- Visible content goes here -->
    <h1>Welcome!</h1>
  </body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `lang` attribute

**The mistake:** Writing the root element simply as `<html>` without defining the language.

**Why it's wrong:** Screen readers (software used by blind or visually impaired users) rely on the `lang` attribute to know which pronunciation rules to use. If a Spanish user visits an English site with no `lang` attribute, their screen reader might try to read the English words using a Spanish accent/ruleset, resulting in complete gibberish.

*Incorrect:*
```html
<html>
```

*Fix:*
```html
<html lang="en"> <!-- Or lang="es", lang="fr", etc. -->
```

---



### Mistake 2: Omitting the `lang` Attribute on the Root `<html>` Tag

**The mistake:** Writing `<html>` without a `lang` attribute.

**Why it's wrong:** Screen readers use the `lang` attribute on `<html>` to choose speech synthesizer voices. Omitting `lang` triggers accessibility audit warnings.

*Incorrect:*
```html
<html> <!-- ❌ Accessibility violation: missing lang attribute -->
```

*Fix:*
```html
<html lang="en"> <!-- Declare document language -->
```

### Mistake 3: Placing Content Outside the Root `<html>` Element

**The mistake:** Writing tags after the closing `</html>` tag.

**Why it's wrong:** The `<html>` element is the single root container for all document nodes except DOCTYPE. Adding tags after `</html>` creates malformed DOM trees.

*Incorrect:*
```html
</html>
<div>Extra content</div> <!-- ❌ Content outside root html tag! -->
```

*Fix:*
```html
<div>Extra content inside body</div>
</body>
</html>
```

## 5. Practice Exercises

### Exercise 1: The Root Hierarchy

**Problem:** Look at a standard HTML boilerplate. Which two elements are the *direct children* of the `<html>` root element?

**Expected output:**
> [!check]- Answer
> ```text
> The `<head>` and `<body>` elements.
> ```
> - Look at the "Fuller Example" above. What is nested immediately one level deep inside `<html>`?
> 
---



### Exercise 2: Root Element Identification

**Problem:** What is the top-level root element of every HTML document called?

**Expected output:**
> [!check]- Answer
> ```text
> The <html> element (Document Root).
> ```
> ```text
> The <html> element (Document Root).
> ```
>
> **Explanation:** `<html>` is the top-level root container encapsulating `<head>` and `<body>`.
> 
---

### Exercise 3: Declaring Multiple Sub-Languages

**Problem:** If a page is in English (`lang="en"`) but contains a Spanish quote, how do you mark up the Spanish span?

**Expected output:**
> [!check]- Answer
> ```text
> <span lang="es">Hola amigo</span>
> ```
> ```html
> <p>He said, <span lang="es">Hola amigo</span>, and smiled.</p>
> ```
>
> **Explanation:** The `lang` attribute can be applied to inline elements to override document language for screen readers.
> 
## 6. Related Terms
- [`<head>`](head.md) — The first child of the `<html>` element.
- [`<body>`](body.md) — The second child of the `<html>` element.
- [`<!DOCTYPE html>`](doctype_html.md) — Related concept: `<!DOCTYPE html>`.
- [`lang` Attribute](../level_07/lang.md) — Related concept: `lang` Attribute.
- [HTML (HyperText Markup Language)](html.md) — Related concept: HTML (HyperText Markup Language).

---

## 7. Key Takeaways
- The `<html>` element is the root of an HTML document.
- It contains exactly two main child elements: `<head>` and `<body>`.
- You should always include the `lang` attribute (e.g., `lang="en"`) for accessibility and SEO.
