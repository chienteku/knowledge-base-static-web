# `<img>`

> **Level 3 — Media & Embedding**
> Embeds an image into the document.

---

## 1. Prerequisites
- [Element vs. Tag](../level_01/element_vs_tag.md) — The tag structure rules.
- [Void Elements (Self-closing Tags)](../level_01/void_elements.md) — Understanding that the `<img>` is a void element (no closing tag).
- [Attribute](../level_01/attribute.md) — The `<img>` tag requires attributes to function.
- [`src` Attribute](../level_03/src.md) — The attribute that points to the image resource location.

---

## 2. Term Category
- **Media Element**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In the very first iteration of HTML (1991), the web was entirely text-based. In 1993, Marc Andreessen (creator of the Mosaic browser) proposed a new tag to allow inline images to be displayed directly alongside text. The W3C standardized the `<img>` tag.
Because HTML files are strictly text files, you cannot physically paste a JPEG or PNG file "inside" your HTML code. Instead, the `<img>` tag was designed to be a placeholder or a window. The tag tells the browser: "Leave a blank space here, go fetch this image file from the server, and draw it in this space."
Because an image cannot contain text inside it, the `<img>` tag is a **void element**. It has no closing tag.

### (2) Reality Metaphor
Imagine hanging a picture frame on an empty wall.
The `<img>` tag is the physical wooden frame you nail to the wall. 
The `src` (source) attribute is the set of instructions you give to an assistant, telling them exactly which painting to go retrieve from the basement to put into the frame.

### (3) Code Examples

#### Short Snippet
```html
<!-- The 'src' attribute points to the image file -->
<!-- The 'alt' attribute describes the image for screen readers -->
<img src="cute-puppy.jpg" alt="A golden retriever puppy playing in the grass">
```

#### Fuller Example
```html
<article>
  <h2>My Trip to Paris</h2>
  <p>Yesterday, I visited the Eiffel Tower. It was incredible!</p>
  
  <!-- Embedding a local image -->
  <!-- We explicitly define width and height to prevent the page layout from shifting as the image loads -->
  <img src="images/eiffel-tower.jpg" alt="The Eiffel Tower at sunset" width="600" height="400">
  
  <p>I also found this amazing picture online:</p>
  <!-- Embedding an image from another website (absolute URL) -->
  <img src="https://example.com/croissant.png" alt="A freshly baked croissant">
</article>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to close the `<img>` tag

**The mistake:** Adding a closing `</img>` tag.

**Why it's wrong:** The `<img>` tag is a void element. It cannot contain text or child elements. Adding a closing tag violates HTML5 standards and can occasionally confuse parsers.

*Incorrect:*
```html
<img src="cat.jpg" alt="A cat"></img>
```

*Fix:*
```html
<img src="cat.jpg" alt="A cat">
```

### Mistake 2: Forgetting the `alt` attribute

**The mistake:** Using an `<img>` tag with only a `src` attribute.

**Why it's wrong:** Omitting the `alt` attribute is one of the biggest accessibility failures on the modern web. Screen readers cannot "see" images, so they read the `alt` text aloud to visually impaired users. Furthermore, if the image fails to load (due to a broken link or slow internet), the browser displays the `alt` text in its place.

*Incorrect:*
```html
<img src="graph.png">
```

*Fix:*
```html
<img src="graph.png" alt="A bar chart showing profits increasing by 20% in Q3">
```

---



### Mistake 3: Omitting `width` and `height` Attributes (Cumulative Layout Shift / CLS Warning)

**The mistake:** Writing `<img src="photo.jpg" alt="Photo">` without explicit aspect-ratio `width` and `height` attributes.

**Why it's wrong:** Omitting dimensions causes the browser to render a 0px box initially. When the image downloads, surrounding text jumps down suddenly, creating severe Cumulative Layout Shift (CLS).

*Incorrect:*
```html
<img src="banner.jpg" alt="Banner"> <!-- ❌ Causes page content layout shift on load! -->
```

*Fix:*
```html
<img src="banner.jpg" alt="Banner" width="1200" height="400" loading="lazy">
```

### Mistake 4: Using Images for Native Body Text (Un-Indexable SEO Anti-Pattern)

**The mistake:** Creating a PNG graphic containing text paragraphs instead of writing real HTML text.

**Why it's wrong:** Search engine crawlers and screen readers cannot read text embedded inside flat bitmap image pixels.

*Incorrect:*
```html
<!-- PNG image containing 3 paragraphs of text -->
```

*Fix:*
```html
<p>Write real HTML text paragraph content</p>
```

## 6. Practice Exercises

### Exercise 1: The Broken Image

**Problem:** What will physically appear on the user's screen if you write `<img src="missing-file.jpg" alt="Company Logo">` but the image file has been deleted from the server?

**Expected output:**
```text
A small "broken image" icon will appear, followed immediately by the plain text: "Company Logo".
```

> [!check]- Answer
> - What is the backup plan when the `src` fails?

---



### Exercise 2: Lazy-Loading Images

**Problem:** Write `<img>` tag with `src="hero.jpg"`, `alt="Hero"`, dimensions 800x600, and native browser lazy loading.

**Expected output:**
```text
<img src="hero.jpg" alt="Hero" width="800" height="600" loading="lazy">
```

> [!check]- Answer
> ```html
> <img src="hero.jpg" alt="Hero" width="800" height="600" loading="lazy">
> ```
>
> **Explanation:** `loading="lazy"` defers image fetching until element approaches the viewport.

### Exercise 3: Modern Image Format Support

**Problem:** Name 2 modern compressed web image formats offering superior compression over legacy JPEG/PNG.

**Expected output:**
```text
WebP and AVIF.
```

> [!check]- Answer
> ```text
> WebP and AVIF.
> ```
>
> **Explanation:** WebP and AVIF formats reduce file size by 30-50% while preserving image quality.

## 7. Related Terms
- [`alt` Attribute](../level_03/alt.md) — The required accessibility attribute for images.
- [`src` Attribute](../level_03/src.md) — The attribute used to define the image source URL.
- [`<figure>` & `<figcaption>`](../level_03/figure_figcaption.md) — The semantic containers used to package images and captions.
- [Void Elements (Self-closing Tags)](../level_01/void_elements.md) — The category of tags `<img>` belongs to.
- [`href` Attribute](../level_02/href.md) — The anchor equivalent of `src`.

---

## 8. Key Takeaways
- The `<img>` tag embeds an image into an HTML document.
- It is a void element (no closing tag).
- It requires the `src` attribute to locate the image file.
- It **must** have an `alt` attribute for accessibility and fallback text.
