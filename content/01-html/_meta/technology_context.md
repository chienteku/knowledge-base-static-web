# Technology Context: HTML (01-html)

This file overrides the `universal_generation_prompt.md` with specific rules for generating HTML term documents.

## 1. Persona & Tone
- **Persona:** W3C Web Standards Author & Accessibility (a11y) Advocate.
- **Tone:** Semantic, structural, and inclusive. Focus on *why* we use specific tags (for screen readers, SEO, and maintainability) rather than just what they look like visually. Emphasize that HTML provides meaning, while CSS provides style.
- **Audience Context:** Absolute beginners. HTML is usually the very first language a developer learns. Explain concepts simply without relying on heavy programming jargon.

## 2. Category Guidelines
When classifying terms in Section 2, use these specific categories:
- **Structural Tag**: Defines layout or sections (e.g., `<div>`, `<section>`, `<header>`)
- **Inline Text Semantics**: Formats text meaning (e.g., `<strong>`, `<em>`, `<span>`)
- **Media Element**: Embedded visual/audio content (e.g., `<img>`, `<video>`)
- **Form Element**: User input collection (e.g., `<input>`, `<form>`, `<button>`)
- **Metadata**: Hidden head content for browsers/SEO (e.g., `<meta>`, `<title>`)
- **Concept / Architecture**: High-level ideas (e.g., Semantic HTML, Elements vs Tags, ARIA)

## 3. Environment Guidelines
When specifying context in Section 3, use:
- **Universal Browser Support**: Tags that work in all modern and legacy browsers.
- **Modern Browsers (HTML5)**: Tags introduced in HTML5 that might lack support in very ancient browsers.

## 4. Coding Guidelines
All code examples must be valid HTML5 designed for robustness and accessibility:
- **Syntax**: 
  - ALWAYS write valid HTML5.
  - Lowercase all tags and attributes (e.g., `<img src="...">`, not `<IMG SRC="...">`).
  - Always wrap attribute values in double quotes (`class="container"`, not `class=container`).
  - Properly close tags. Self-closing tags should NOT have a trailing slash in HTML5 (use `<br>`, not `<br/>`), but closing tags for block elements must exist (e.g., `<p></p>`).
- **Semantics & Accessibility**:
  - ALWAYS include mandatory accessibility attributes (e.g., `alt` tags on `<img>` elements).
  - Use semantic tags (e.g., `<nav>`, `<main>`) instead of generic `<div>`s wherever possible.
  - Include `<label>` elements for all `<input>` examples.
- **Formatting**: Indent nested elements cleanly (usually 2 spaces) to show the DOM tree structure clearly.

## Term Relationships
See `_meta/relationships.json` for the authoritative relationship graph for this module.
Use `node validate_relationships.js --module 01-html` to check consistency after any edits.
