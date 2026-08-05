# Block-level vs Inline Elements

> **Level 1 — The Anatomy of a Webpage**
> The two fundamental visual display behaviors of HTML elements that govern how they sit and space themselves on a page.

---

## 1. Prerequisites
- [Element vs. Tag](element_vs_tag.md) — The fundamental unit of HTML.
- [HTML (HyperText Markup Language)](html.md) — The standard markup language.

---

## 2. Term Category
- **Concept / Architecture**

---

## 3. Environment Context
- **Universal Browser Support** (Understood natively by all web browsers since the earliest versions of HTML).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When a web browser reads your HTML file, it translates the text elements into boxes on the screen. To lay them out logically, the browser needs rules. 

For example, when you read a book, a new paragraph always starts on a fresh line and takes up the full width of the page. However, a bolded word or a hyperlink stays inline within the sentence. 

HTML structures this layout system using two categories: **Block-level** and **Inline** elements.

---

### (2) Block-level Elements
Block-level elements are structural. They represent major blocks of content:
-   **New Line:** They always start on a new line.
-   **Full Width:** They automatically stretch to fill the entire width of their parent container (left-to-right).
-   **Container capability:** They can contain other block-level elements and inline elements.
-   *Examples:* `<div>`, `<p>`, `<h1>` through `<h6>`, `<ol>`, `<ul>`, `<li>`, `<form>`.

---

### (3) Inline Elements
Inline elements are text-level. They sit inside structural containers:
-   **Flow with text:** They do *not* start on a new line. They stay inline, flowing side-by-side with other text or inline elements.
-   **Fit content:** They only take up as much width as their content (text/images) requires.
-   **Limited nesting:** They can only nest other inline elements. They should *never* contain block-level elements.
-   *Examples:* `<span>`, `<strong>`, `<em>`, `<a>`, `<img>`, `<button>`.

---

### (4) Code Examples

#### Short Snippet
Observe how block-level and inline elements behave differently when rendered:

```html
<!-- Block-level: Starts on a new line and stretches 100% wide -->
<p>This is a paragraph.</p>

<!-- Inline: Sits side-by-side with surrounding text -->
<span>First span</span>
<span>Second span</span>
```

#### Fuller Example
```html
<!-- Block-level container -->
<div class="profile-card">
  <!-- Block-level heading starts on a new line -->
  <h2>Jane Doe</h2>
  
  <!-- Block-level paragraph -->
  <p>
    Jane is a web developer. She specializes in 
    <!-- Inline element emphasizing a word without breaking the line -->
    <strong>frontend engineering</strong>.
  </p>
  
  <!-- Block-level paragraph containing inline links -->
  <p>
    Connect with Jane on <a href="https://github.com">GitHub</a> or <a href="https://linkedin.com">LinkedIn</a>.
  </p>
</div>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Nesting a block-level element inside an inline element

**The mistake:** Placing a block-level element (like a paragraph `<p>` or a division `<div>`) inside an inline element (like a text wrapper `<span>`):

```html
<!-- BAD: Nesting a block element inside an inline span -->
<span>
  <p>This is illegal HTML!</p>
</span>
```

**Why it's wrong:** According to W3C standards, inline elements cannot contain block-level elements. When the browser attempts to parse this, it will split the `<span>` in half and create invalid DOM structures, leading to unpredictable CSS layouts and styling bugs.

**Golden Rule:** Keep blocks outside, and inline elements inside. (e.g. `<p>This is <span>correct</span></p>`).

---



### Mistake 2: Nesting Block-Level Elements Inside Inline Elements (`<span><div></div></span>`)

**The mistake:** Placing a `<div>` or `<p>` inside a `<span>` or `<a>` element (prior to HTML5 flow content rules for anchors).

**Why it's wrong:** Inline elements (`<span>`) cannot contain block-level containers (`<div>`). Browsers break invalid HTML structure by closing inline tags early, splitting layout nodes.

*Incorrect:*
```html
span > div -- Block-level div nested inside inline span
```

*Fix:*
```html
div > span -- Block container wrapping inline child
```

### Mistake 3: Attempting to Apply CSS `width` and `height` Directly to Inline Elements

**The mistake:** Setting `width: 200px; height: 100px;` in CSS for an inline `<span>` tag.

**Why it's wrong:** Default inline elements flow within text content and ignore CSS `width` and `height` properties. Change display to `inline-block` or `block`.

*Incorrect:*
```html
<span style="width: 200px;">Text</span> <!-- ❌ width property ignored on inline span! -->
```

*Fix:*
```html
<span style="display: inline-block; width: 200px;">Text</span>
```

## 6. Practice Exercises

### Exercise 1: Element Classification

**Problem:** Classify each of the following elements as either **Block-level** or **Inline**:
1. `<a>`
2. `<h1>`
3. `<li>`
4. `<strong>`
5. `<div>`
6. `<span>`

**Expected output:**
> [!check]- Answer
> ```text
> 1. Inline
> 2. Block-level
> 3. Block-level
> 4. Inline
> 5. Block-level
> 6. Inline
> ```
> - Ask yourself: does this tag force a line break in normal text flow?
> - Heading tags and wrappers take full width, while anchors and emphasis tags flow with words.

---



### Exercise 2: Classifying Display Types

**Problem:** Classify default display type (Block or Inline) for:
1. `<div>` 
2. `<span>` 
3. `<h1>` 
4. `<a>` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. div -> Block
> 2. span -> Inline
> 3. h1 -> Block
> 4. a -> Inline
> ```
> ```text
> 1. div -> Block
> 2. span -> Inline
> 3. h1 -> Block
> 4. a -> Inline
> ```
>
> **Explanation:** Block elements start on a new line and stretch full width; inline elements take up only as much width as content needs.

---

### Exercise 3: Converting Inline to Block-Block Display

**Problem:** Which CSS property allows an inline `<span>` to respect `width` and `height` while staying on the same line as surrounding text?

**Expected output:**
> [!check]- Answer
> ```text
> display: inline-block;
> ```
> ```css
> span {
>   display: inline-block;
> }
> ```
>
> **Explanation:** `display: inline-block` combines inline flow with block-level box-model dimensions.

## 7. Related Terms
- [`<div>` (Block container)](../level_02/div.md) — The most common block-level generic container.
- [`<span>` (Inline container)](../level_02/span.md) — The most common inline generic container.
- [Void Elements (Self-closing Tags)](void_elements.md) — Elements that have no closing tag, many of which are inline (like `<img>`).
- [Element vs. Tag](element_vs_tag.md) — Related concept: Element vs. Tag.
- [HTML (HyperText Markup Language)](html.md) — Related concept: HTML (HyperText Markup Language).
- [Nesting](nesting.md) — Related concept: Nesting.
- [`<a>` (Anchor / Link)](../level_02/a.md) — Related concept: `<a>` (Anchor / Link).
- [`<br>` & `<hr>`](../level_02/br_hr.md) — Related concept: `<br>` & `<hr>`.
- [Headings (`<h1>` to `<h6>`)](../level_02/headings.md) — Related concept: Headings (`<h1>` to `<h6>`).
- [`<ul>`, `<ol>`, and `<li>` (Lists)](../level_02/lists.md) — Related concept: `<ul>`, `<ol>`, and `<li>` (Lists).
- [`<p>` (Paragraph)](../level_02/p.md) — Related concept: `<p>` (Paragraph).
- [`<strong>` & `<em>`](../level_02/strong_em.md) — Related concept: `<strong>` & `<em>`.
- [`<td>` (Table Data)](../level_04/td.md) — Related concept: `<td>` (Table Data).
- [`<tr>` (Table Row)](../level_04/tr.md) — Related concept: `<tr>` (Table Row).
- [`<body>`](body.md) — Related concept: `<body>`.

---

## 8. Key Takeaways
- Block-level elements start on a new line and stretch to fill the available width (100%).
- Inline elements flow with the text and only occupy the width of their content.
- Block elements can contain other block or inline elements.
- Inline elements can only contain other inline elements.
- Never wrap a block-level tag (like `<div>`) inside an inline tag (like `<span>`).
