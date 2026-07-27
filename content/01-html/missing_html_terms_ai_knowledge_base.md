# Missing HTML Terms — AI Knowledge-Base Gap Analysis

> **Purpose of this file.** The current curriculum in `terms/level_01` … `terms/level_10`
> defines **52 terms** (see `_meta/html_terms_zero_to_hero.md`). Reviewing it as a
> junior engineer trying to *learn HTML from these files alone*, I hit **gaps**:
> concepts that the existing docs **use, assume, or reference in prose but never define as
> their own term**. This file catalogs those gaps so an AI can generate the missing term
> docs and make the knowledge base self-contained.
>
> **How to read this file.**
> - **Section 1** — the critical gaps (concepts used everywhere but never taught).
> - **Section 2** — the full list of missing terms, grouped by the level they belong to.
>   Each row is shaped to drop straight into the term-doc template: it names the
>   **prerequisites** and **related terms** so the `## 1. Prerequisites` and
>   `## 7. Related Terms` sections can be filled in automatically.
> - **Section 3** — the relationship map (dependency graph) between missing terms and
>   existing terms.
> - **Section 4** — suggested generation priority.
>
> **Evidence method.** "Gap" = concept appears in prose/code of ≥1 existing term file but
> has no dedicated `terms/level_XX/<term>.md`. Also includes concepts a junior learner
> would need to bridge between levels to achieve smooth progressive learning.

---

## 1. Critical Gaps (used pervasively, never defined)

These block comprehension the most because existing lessons rely on them without explanation.

| Gap | Evidence (files mentioning it) | Why it blocks learning |
|-----|-------------------------------|------------------------|
| **Block-level vs Inline elements** | `div.md` calls itself "block container", `span.md` says "inline container", `br_hr.md` mentions line breaks vs thematic breaks, `strong_em.md` uses inline styling | The single most important HTML layout concept is never defined. A learner sees "block" and "inline" on every page but has no term explaining why `<div>` takes the full width and `<span>` doesn't. |
| **Void Elements (Self-closing tags)** | `meta.md`, `link.md`, `input.md`, `img.md`, `br_hr.md` — all mention "void element" in passing | Five existing term docs call tags "void elements" but the concept of a void element is never defined. A learner doesn't know why some tags lack closing tags. |
| **`name` Attribute** | `input.md` calls it "absolutely required", `form.md` references it, `select_option.md` and `textarea.md` use it | The `name` attribute is the key mechanism for form submission (key-value pairing) and radio button grouping. It's used in every form example but never taught. |
| **`value` Attribute** | Used in `input.md`, `select_option.md`, `button.md` radio/checkbox examples | The `value` attribute determines what data actually gets sent to the server. It is paired with `name` in every form but never defined. |
| **`required`, `placeholder`, `disabled` Attributes** | `input.md` uses `placeholder` in every example, `form.md` mentions `required` | These are the most commonly-used form validation/UX attributes. A learner sees `placeholder="First Name"` in examples but has no term explaining what these attributes do. |
| **`defer` & `async` Attributes (on `<script>`)** | `script.md` teaches the `defer` attribute as the FIX for render-blocking but never gives it a dedicated term | The `<script>` doc tells learners to use `defer` to fix a critical mistake, but the `defer` and `async` loading strategies are never formally defined. |
| **Character Encoding / `charset="UTF-8"`** | `meta.md` calls it "the most important meta tag" | Every `<meta>` example starts with `charset="UTF-8"` but the concept of character encoding is never explained. A learner doesn't know what UTF-8 is or why it matters. |
| **URL / Absolute vs Relative Paths** | `a.md` (`href`), `img.md` (`src`), `link.md` (`href`), `script.md` (`src`), `iframe.md` (`src`) | Nearly every HTML element that loads a resource uses a URL, but the concept of a URL and the difference between absolute and relative paths is never taught. |
| **`src` Attribute** | `img.md`, `audio.md`, `video.md`, `iframe.md`, `script.md` — all rely on `src` | The `src` attribute appears in 5+ existing term docs as the primary way to load external resources but is never defined as its own term. |
| **Accessibility (a11y) Fundamentals** | `semantic_html.md`, `alt.md`, `label.md`, `form.md`, `nav.md`, `main.md`, `header.md`, `footer.md` — all reference "screen readers" and "accessibility" | Almost every Level 5–7 doc assumes the learner knows what accessibility is, what a screen reader does, and why it matters. This umbrella concept is never introduced. |

---

## 2. Missing Terms by Level

> Legend for **Category**: `Structural Tag` / `Inline Text Semantics` / `Form Element` /
> `Media Element` / `Metadata` / `Concept / Architecture` / `Global Attribute`
> (per `_meta/technology_context.md`). **Prereqs** and **Related** reference existing terms by
> name (see zero-to-hero list) or other *missing* terms (marked with 🆕).

### Level 1 — The Anatomy of a Webpage (foundational concepts)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 1 | **Block-level vs Inline Elements** [DONE] | The two fundamental display behaviors: block takes full width with line breaks; inline flows within text. | Concept / Architecture | Element vs. Tag, `<body>` | `<div>`, `<span>`, `<p>`, 🆕 Void Elements |
| 2 | **Void Elements (Self-closing Tags)** [DONE] | Elements that cannot have children and have no closing tag (e.g., `<br>`, `<img>`, `<input>`, `<meta>`). | Concept / Architecture | Element vs. Tag | `<img>`, `<input>`, `<meta>`, `<link>`, `<br>` |
| 3 | **Comments (`<!-- -->`)** [DONE] | Invisible annotations in the source code for developer notes. | Concept / Architecture | HTML | Nesting, 🆕 Debugging HTML |
| 4 | **URL (Uniform Resource Locator)** [DONE] | The web address system; absolute vs relative paths. | Concept / Architecture | HTML | `<a>`, `href`, `<img>`, 🆕 `src` Attribute |

### Level 2 — Text & Content (inline formatting gaps)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 5 | **`<b>`, `<i>`, `<u>` vs `<strong>`, `<em>`, `<ins>`** [DONE] | The difference between presentational (visual-only) tags and semantic (meaningful) tags. | Inline Text Semantics | `<strong>` & `<em>`, 🆕 Block vs Inline | Semantic HTML, 🆕 Accessibility Fundamentals |
| 6 | **`<blockquote>` & `<cite>`** [DONE] | Semantic tags for quoting external sources and attributing citations. | Inline Text Semantics | `<p>`, Semantic HTML | `<strong>` & `<em>`, 🆕 `<figure>` & `<figcaption>` |
| 7 | **`<pre>` & `<code>`** [DONE] | Tags for displaying preformatted text and inline code snippets, preserving whitespace. | Inline Text Semantics | Whitespace Collapse, `<p>` | `<span>`, 🆕 HTML Entities |
| 8 | **`<sup>` & `<sub>`** [DONE] | Superscript and subscript text (e.g., footnotes, chemical formulas). | Inline Text Semantics | Element vs. Tag, 🆕 Block vs Inline | `<span>` |

### Level 3 — Media & Embedding (missing resource concepts)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 9 | **`src` Attribute** [DONE] | Specifies the URL of an external resource to embed (images, scripts, media). | Global Attribute | Attribute, 🆕 URL | `<img>`, `<audio>`, `<video>`, `<iframe>`, `<script>` |
| 10 | **`<figure>` & `<figcaption>`** [DONE] | Semantic container for self-contained media content (images, diagrams) with an optional caption. | Structural Tag | `<img>`, `alt`, Semantic HTML | `<article>`, 🆕 `<blockquote>` |
| 11 | **`<source>` Element** [DONE] | Specifies multiple media resources for `<audio>`, `<video>`, and `<picture>` for browser compatibility. | Media Element | `<audio>`, `<video>` | `<picture>`, 🆕 Responsive Images |
| 12 | **`<picture>` & Responsive Images** [DONE] | Serve different images for different screen sizes/resolutions using `<picture>` and `srcset`. | Media Element | `<img>`, `alt`, 🆕 `<source>` | 🆕 Viewport, `<meta>` |

### Level 4 — Tables (missing table attributes)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 13 | **`colspan` & `rowspan`** [DONE] | Attributes that let a table cell span across multiple columns or rows. | Structural Tag | `<td>`, `<th>`, `<table>` | `<thead>`, `<tbody>`, `<tfoot>` |
| 14 | **`<caption>`** [DONE] | A semantic title/description for a table, crucial for accessibility. | Structural Tag | `<table>`, 🆕 Accessibility Fundamentals | `<th>`, 🆕 scope attribute |
| 15 | **`scope` Attribute (in `<th>`)** [DONE] | Tells screen readers whether a header cell applies to a column, row, or group. | Concept / Architecture | `<th>`, 🆕 Accessibility Fundamentals | 🆕 caption attribute, `<thead>` |

### Level 5 — Forms & User Input (critical form gaps)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 16 | **`placeholder` Attribute** [DONE] | A temporary hint displayed inside an input field before the user enters a value. | Global Attribute | `<input>`, `<textarea>` | `value` attribute, `<label>` |
| 17 | **`value` Attribute (in Form Fields)** [DONE] | Defines the current or default text value of an input field, button, or option. | Global Attribute | `<input>`, `<select>` & `<option>` | `placeholder` attribute, `<form>` |
| 18 | **`name` Attribute (in Form Fields)** [DONE] | Assigns a key name to form data sent to a server, critical for grouping radio buttons. | Global Attribute | `<input>`, `<form>` | 🆕 `<input type="radio">`, `value` attribute |
| 19 | **`<input type="radio">` & `<input type="checkbox">`** [DONE] | Form controls for selecting single (radio) or multiple (checkbox) options. | Form Input Tag | `<input>`, 🆕 name attribute | `value` attribute, `<label>` |
| 20 | **`action` & `method` Attributes** [DONE] | Attributes that control where form data is sent (action) and how (method: GET/POST). | Global Attribute | `<form>`, 🆕 URL | `<button>`, 🆕 name attribute |
| 21 | **`<fieldset>` & `<legend>`** | A semantic container for grouping related form controls together with a label. | Form Element | `<form>`, `<input>`, `<label>` | Semantic HTML, 🆕 Accessibility Fundamentals |
| 22 | **`<datalist>`** | Provides a list of pre-defined autocomplete options for an `<input>` element. | Form Element | `<input>`, `<select>` & `<option>` | 🆕 Form Validation |
| 23 | **`<output>`** | A semantic element for displaying the result of a calculation or user action. | Form Element | `<form>`, `<input>` | `<span>`, `<script>` |

### Level 6 — Semantic HTML5 (missing semantic tags)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 23 | **`<aside>`** [DONE] | Represents content tangentially related to the main content (sidebars, pull quotes, ads). | Structural Tag | Semantic HTML, `<main>` | `<article>`, `<section>`, `<nav>` |
| 24 | **`<details>` & `<summary>`** [DONE] | A native HTML disclosure widget — an interactive element users can expand/collapse without JavaScript. | Structural Tag | Semantic HTML, Element vs. Tag | `<script>`, 🆕 Accessibility Fundamentals |
| 25 | **`<time>` & `datetime` Attribute** [DONE] | A semantic tag for representing dates/times in a machine-readable format. | Inline Text Semantics | Semantic HTML, Attribute | `<article>`, `<meta>` |
| 26 | **`<address>`** [DONE] | Semantic tag for contact information of the nearest `<article>` or `<body>` ancestor. | Structural Tag | Semantic HTML, `<footer>` | `<article>`, `<a>` |
| 27 | **`<mark>`** [DONE] | Semantic tag for highlighted/marked text (e.g., search result highlighting). | Inline Text Semantics | `<strong>` & `<em>`, Semantic HTML | `<span>`, 🆕 `<b>` vs `<strong>` |
| 28 | **Heading Hierarchy & Document Outline** [DONE] | The correct use of `<h1>` through `<h6>` to create a logical, nested document outline for SEO and accessibility. | Concept / Architecture | Headings (`<h1>` to `<h6>`), Semantic HTML | `<section>`, `<article>`, 🆕 Accessibility Fundamentals |

### Level 7 — Global Attributes & Styling Concepts (missing attributes)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 29 | **`title` Attribute** [DONE] | Defines advisory information for an element, typically rendered as a tooltip on hover. | Global Attribute | Attribute | `alt` attribute, `<abbr>` |
| 30 | **`lang` Attribute** [DONE] | Specifies the primary language of the element's text content, crucial for screen readers and translation. | Global Attribute | Attribute, `<html>` | `meta` tag |
| 31 | **`tabindex` Attribute** [DONE] | Controls whether an element can be focused via keyboard navigation and in what order. | Global Attribute | Attribute, 🆕 button | 🆕 anchor, 🆕 Accessibility Fundamentals |
| 32 | **`data-*` Attributes** [DONE] | Allows storing custom metadata on standard HTML elements for scripting and styling. | Global Attribute | Attribute | `class` attribute, `id` attribute, `<script>` |
| 33 | **`contenteditable` Attribute** | Makes any HTML element editable by the user directly in the browser. | Global Attribute | Attribute, DOM | `<textarea>`, `<script>` |
| 34 | **`hidden` Attribute** | A boolean attribute that hides an element from rendering (semantic equivalent of `display: none`). | Global Attribute | Attribute, `style` | `<script>`, DOM, `class` |

### Level 8 — Metadata, SEO & Head (missing head-level concepts)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 35 | **`<style>` Element** [DONE] | An element placed in the `<head>` to define internal CSS rules for the document. | Metadata | `<head>`, `style` attribute, `<link>` | `class`, `id` |
| 36 | **Favicon** [DONE] | The small icon displayed in the browser tab, configured via `<link rel="icon">`. | Metadata | `<link>`, `<head>` | 🆕 Open Graph Tags, `<meta>` |
| 37 | **`<base>` Element** [DONE] | Sets the default base URL and target for all relative URLs in the document. | Metadata | `<head>`, 🆕 URL | `<a>`, `href`, `<link>` |
| 38 | **Character Encoding (`charset`)** [DONE] | The system used to translate binary data into human-readable text; `UTF-8` is the modern universal standard. | Concept / Architecture | `<meta>`, `<head>` | 🆕 HTML Entities |
| 39 | **`defer` & `async` (Script Loading Strategies)** [DONE] | Two attributes on `<script>` that control when external scripts are downloaded and executed relative to HTML parsing. | Concept / Architecture | `<script>`, `<head>`, DOM | 🆕 Render-Blocking, 🆕 Critical Rendering Path |
| 40 | **`<noscript>`** [DONE] | Provides fallback content for users whose browsers have JavaScript disabled. | Structural Tag | `<script>`, `<body>` | 🆕 Accessibility Fundamentals |
| 40a | **Open Graph Tags (`og:`)** [DONE] | Meta tags that control how a webpage appears when shared on social media (Facebook, Twitter, LinkedIn). | Metadata | `<meta>`, `<head>` | 🆕 SEO Fundamentals, `<link>` |

### Level 9 — DOM, Rendering & Accessibility (bridging HTML to JavaScript)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 41 | **Accessibility (a11y) Fundamentals** [DONE] | The practice of making web content usable by all people, including those with disabilities; introduces screen readers, keyboard navigation, and WCAG. | Concept / Architecture | Semantic HTML, `alt`, `<label>` | ARIA Attributes, `tabindex`, 🆕 Heading Hierarchy |
| 42 | **ARIA Attributes** [DONE] | Accessible Rich Internet Applications attributes (`role`, `aria-label`, `aria-hidden`, etc.) used when semantic HTML alone is insufficient. | Concept / Architecture | 🆕 Accessibility Fundamentals, Semantic HTML, Attribute | `tabindex`, `<nav>`, `<main>` |
| 43 | **`tabindex`** [DONE] | An attribute controlling keyboard focus order, making non-interactive elements focusable or removing focus from interactive ones. | Global Attribute | Attribute, 🆕 Accessibility Fundamentals | ARIA Attributes, `<button>`, `<a>` |
| 44 | **HTML Entities** [DONE] | Special character codes like `&amp;`, `&lt;`, `&copy;`, `&nbsp;` used to display reserved or special characters. | Concept / Architecture | HTML, Element vs. Tag | 🆕 Character Encoding, `<pre>` & `<code>` |
| 45 | **SEO Fundamentals for HTML** [DONE] | How HTML structure (headings, meta tags, semantic elements, alt text) directly impacts search engine ranking. | Concept / Architecture | `<meta>`, `<title>`, Semantic HTML, Headings | 🆕 Open Graph Tags, 🆕 Heading Hierarchy, `alt` |
| 46 | **Critical Rendering Path** [DONE] | How the browser converts HTML, CSS, and JavaScript into visible pixels: parsing → DOM tree → CSSOM → render tree → paint. | Concept / Architecture | DOM, Tree Structure, `<link>`, `<script>` | 🆕 `defer` & `async`, 🆕 Render-Blocking |
| 47 | **Render-Blocking Resources** [DONE] | CSS and synchronous JavaScript that prevent the browser from displaying content until they finish loading. | Concept / Architecture | `<link>`, `<script>`, 🆕 Critical Rendering Path | 🆕 `defer` & `async`, `<style>` Element |

### Level 10 — HTML5 APIs & Modern HTML (advanced features)

| # | Proposed Term | One-line description | Category | Prerequisites | Related |
|---|---------------|----------------------|----------|---------------|---------|
| 48 | **Web Components (`<template>`, `<slot>`, Shadow DOM)** [DONE] | A suite of native browser technologies for creating reusable, encapsulated custom HTML elements. | Concept / Architecture | DOM, `<script>`, 🆕 `data-*` Attributes | `<canvas>`, `<svg>` |
| 49 | **`<dialog>` Element** [DONE] | A native HTML element for creating modal and non-modal dialog boxes without JavaScript frameworks. | Structural Tag | DOM, `<button>`, 🆕 Accessibility Fundamentals | 🆕 `<details>` & `<summary>`, ARIA Attributes |
| 50 | **Drag & Drop API** [DONE] | HTML5 attributes (`draggable`, `ondragstart`, `ondrop`) enabling native drag-and-drop interactions. | Concept / Architecture | DOM, `<script>`, Attribute | `<canvas>`, 🆕 `data-*` Attributes |
| 51 | **Geolocation API** [DONE] | An HTML5 API that lets web applications access the user's geographic location (with permission). | Concept / Architecture | `<script>`, DOM | Web Storage, 🆕 Permissions & Security |
| 52 | **`<progress>` & `<meter>`** [DONE] | Native HTML5 elements for displaying progress bars and scalar measurements without JavaScript. | Form Element | Element vs. Tag, 🆕 `value` Attribute | `<output>`, `style` attribute |
| 53 | **Content Security Policy (CSP) & HTML Security** [DONE] | How HTML attributes (`sandbox`, `referrerpolicy`, `integrity`) and headers protect against XSS and injection attacks. | Concept / Architecture | `<script>`, `<iframe>`, 🆕 HTML Entities | 🆕 `<noscript>`, Web Storage |
| 54 | **`<map>` & `<area>` (Image Maps)** [DONE] | Tags for defining clickable regions within an image, enabling interactive graphics without JavaScript. | Media Element | `<img>`, `href`, Attribute | `<svg>`, `<canvas>` |

---

## 3. Relationship Map (dependency graph)

How the missing terms connect to each other and to existing terms. `A → B` means
"understanding A meaningfully requires B" (B is a prerequisite of A).

### 3.1 The "Block vs Inline" chain (unblocks the most understanding)

```
Element vs. Tag (exists)
   → Block-level vs Inline Elements 🆕  ← THE keystone HTML gap
        → <div> (exists, calls itself "block container")
        → <span> (exists, calls itself "inline container")
        → Void Elements 🆕 → <img>, <input>, <br>, <meta>, <link> (all exist)
        → <b>/<i> vs <strong>/<em> 🆕 (presentational vs semantic inline)
```

### 3.2 URL & Resource loading chain

```
HTML (exists)
   → URL / Absolute vs Relative Paths 🆕
        → href (exists), src 🆕
             → <img> (exists), <audio> (exists), <video> (exists)
             → <iframe> (exists), <script> (exists), <link> (exists)
        → <base> element 🆕
```

### 3.3 Forms cluster (the biggest gap area)

```
<form> (exists) + <input> (exists)
   → name Attribute 🆕 + value Attribute 🆕  ← form data fundamentals
        → action & method (exists)
        → <select> & <option> (exists), <textarea> (exists)
   → required/placeholder/disabled 🆕 → Form Validation (HTML5) 🆕
   → <fieldset> & <legend> 🆕 → Accessibility 🆕
   → <datalist> 🆕, <output> 🆕
```

### 3.4 Accessibility & semantic cluster

```
Semantic HTML (exists) + alt (exists) + <label> (exists)
   → Accessibility (a11y) Fundamentals 🆕  ← umbrella concept
        → ARIA Attributes 🆕 (referenced in zero-to-hero but no file)
        → tabindex 🆕 (referenced in zero-to-hero but no file)
        → <caption> 🆕 + scope 🆕 (table accessibility)
        → Heading Hierarchy 🆕 → SEO Fundamentals 🆕
```

### 3.5 Head & metadata cluster

```
<head> (exists) + <meta> (exists)
   → Character Encoding (charset) 🆕 → HTML Entities 🆕
   → Open Graph Tags 🆕 (mentioned in meta.md exercise but no dedicated term)
   → <style> element 🆕 (vs style attribute, exists)
   → Favicon 🆕
   → <base> 🆕
   → <noscript> 🆕
```

### 3.6 Rendering & performance cluster

```
DOM (exists) + Tree Structure (exists)
   → Critical Rendering Path 🆕
        → Render-Blocking Resources 🆕
             → defer & async 🆕 (on <script>)
             → <link> blocking CSS (exists)
```

### 3.7 Semantic text & media cluster

```
<p> (exists) + <strong>/<em> (exists)
   → <blockquote> & <cite> 🆕
   → <pre> & <code> 🆕
   → <sup> & <sub> 🆕
   → <mark> 🆕
   → <time> 🆕
<img> (exists) + <video> (exists)
   → <figure> & <figcaption> 🆕
   → <source> 🆕 → <picture> & Responsive Images 🆕
```

### 3.8 HTML5 advanced cluster

```
DOM (exists) + <script> (exists)
   → Web Components 🆕 (template/slot/shadow DOM)
   → <dialog> 🆕
   → Drag & Drop API 🆕
   → Geolocation API 🆕
   → <progress> & <meter> 🆕
   → Content Security Policy 🆕
```

---

## 4. Suggested Generation Priority

Ordered so each batch unblocks the next (and repairs the most existing prose references).

| Tier | Rationale | Terms |
|------|-----------|-------|
| **P0 — Repairs pervasive references** | Used in existing docs but undefined; blocks basic comprehension | Block-level vs Inline Elements; Void Elements; URL / Absolute vs Relative Paths; `src` Attribute; `name` Attribute; `value` Attribute; Comments (`<!-- -->`); Accessibility (a11y) Fundamentals |
| **P1 — Completes the zero-to-hero list** | Listed in `_meta/html_terms_zero_to_hero.md` (#45 `<aside>`, #47 Open Graph, #50 ARIA, #51 tabindex, #52 HTML Entities) but have no term files | `<aside>`; Open Graph Tags; ARIA Attributes; `tabindex`; HTML Entities |
| **P2 — Form completion** | The forms level (#5) is the weakest; these make it self-contained | `required`/`placeholder`/`disabled`/`readonly`; Form Validation (HTML5); `<fieldset>` & `<legend>`; `<datalist>`; `<output>` |
| **P3 — Semantic text & media breadth** | Essential text/media tags missing from Levels 2–3 | `<b>/<i>` vs `<strong>/<em>`; `<blockquote>` & `<cite>`; `<pre>` & `<code>`; `<sup>` & `<sub>`; `<figure>` & `<figcaption>`; `<source>`; `<picture>` & Responsive Images; `<mark>`; `<time>` |
| **P4 — Head, metadata & rendering** | Complete the invisible infrastructure of a webpage | Character Encoding; `<style>` Element; Favicon; `<base>`; `defer` & `async`; `<noscript>`; Heading Hierarchy; SEO Fundamentals; Critical Rendering Path; Render-Blocking Resources |
| **P5 — Global attributes** | Round out attribute knowledge | `data-*` Custom Attributes; `hidden` Attribute; `title` Attribute; `lang` Attribute; `contenteditable`; `colspan` & `rowspan`; `<caption>`; `scope` Attribute |
| **P6 — HTML5 & modern features** | Advanced features for experienced learners | `<details>` & `<summary>`; `<address>`; `<dialog>`; Web Components; `<progress>` & `<meter>`; Drag & Drop API; Geolocation API; Content Security Policy; `<map>` & `<area>` |

---

## 5. Notes for the Generating AI

- **Follow the existing template.** Every new file must mirror the 8-section structure used in
  `terms/level_XX/*.md` (Prerequisites → Term Category → Environment Context → Explanation
  [Design Motivation / Reality Metaphor / Code Examples] → Common Mistakes → Practice Exercises
  → Related Terms → Key Takeaways) and obey `_meta/technology_context.md` (W3C Web Standards
  Author & Accessibility Advocate persona; lowercase tags; double-quoted attributes; include
  `alt` on `<img>`; use semantic tags; `<label>` for all `<input>`s; 2-space indentation).
- **Wire the cross-links.** Use the **Prerequisites** and **Related** columns in Section 2 to
  populate `## 1. Prerequisites` and `## 7. Related Terms` with correct relative paths
  (`../level_XX/<term>.md`). When a new term links to another new term, create both.
- **Renumber intentionally.** The zero-to-hero list ends at #52; either append new numbers or
  switch to level-relative numbering — decide once and stay consistent.
- **Update the trackers.** After generating, add each new term to
  `_meta/html_terms_zero_to_hero.md` and remove it from this gap list (or mark it done),
  mirroring how `_meta/missing_terms.md` records already-closed gaps.
- **Environment tags.** Most HTML terms = **Universal Browser Support**; HTML5-specific features
  (like `<dialog>`, `<details>`, Web Components) = **Modern Browsers (HTML5)**; concepts that
  involve JavaScript APIs (like Geolocation, Drag & Drop) = **HTML5 Standard**.
- **Tone for absolute beginners.** Remember the audience is someone who has never coded before.
  Use the W3C persona from `technology_context.md` but keep explanations simple, jargon-free,
  and full of real-world metaphors.
- **`<aside>` already exists in zero-to-hero list (#45) but has NO file.** Generate it as part
  of the P1 batch along with other listed-but-unwritten terms.
