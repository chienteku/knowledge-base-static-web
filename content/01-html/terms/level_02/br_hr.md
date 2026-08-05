# `<br>` & `<hr>`

> **Level 2 — Text & Content**
> Tags for creating line breaks and thematic breaks (horizontal rules).

---

## 1. Prerequisites
- [Element vs. Tag](../level_01/element_vs_tag.md) — The tag syntax rules.
- [Void Elements (Self-closing Tags)](../level_01/void_elements.md) — Since `<br>` and `<hr>` are void elements with no closing tags.
- [`<p>` (Paragraph)](p.md) — Understand how paragraphs naturally break lines.

---

## 2. Term Category
- **Structural Tag**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
We know that HTML ignores the "Enter" key on your keyboard. If you want a new block of text, you use a new `<p>` tag. 
But what if you are writing a poem or a physical mailing address? You need the text to drop to a new line, but it still belongs to the exact same paragraph block. The W3C created the `<br>` (Line Break) tag to force a carriage return without starting a new paragraph.

Similarly, what if you want to visually and semantically separate two distinct sections of an article without starting a whole new webpage? The `<hr>` (Horizontal Rule / Thematic Break) was created. It draws a visible line across the screen and tells screen readers that the topic is shifting.

**Crucially, both of these are "void elements".** They do not wrap around text, so they do not have closing tags!

### (2) Reality Metaphor
A `<br>` is like pressing the "Return" key on an old typewriter. You just drop down to the next line and keep typing the same thought.
An `<hr>` is like drawing a solid black line across your notebook paper to indicate that you are starting a completely new subject.

### (3) Code Examples

#### Short Snippet
```html
<!-- Formatting a mailing address using Line Breaks -->
<p>
  Sherlock Holmes<br>
  221B Baker Street<br>
  London, England
</p>

<!-- Separating content with a Thematic Break -->
<hr>
```

#### Fuller Example
```html
<article>
  <h2>Chapter 1: The Beginning</h2>
  <p>It was the best of times, it was the worst of times.</p>
  
  <!-- A thematic break to indicate a scene change -->
  <hr>
  
  <h2>Chapter 2: The Next Day</h2>
  <p>The sun rose on a new world.</p>
</article>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `<br>` to create spacing

**The mistake:** Stacking multiple `<br>` tags to push content further down the page.

**Why it's wrong:** The `<br>` tag is meant for semantic line breaks *inside* a paragraph (like a poem). It should never be used as a layout tool to create empty space between elements. If you need space between a heading and an image, you should use CSS margins. Screen readers will literally read "blank, blank, blank" if they encounter stacked `<br>` tags.

*Incorrect:*
```html
<h1>Welcome</h1>
<br><br><br> <!-- BAD: Using line breaks to create layout space -->
<img src="hero.jpg">
```

*Fix:*
```html
<!-- Use CSS to add margin-bottom to the h1 instead! -->
<h1>Welcome</h1>
<img src="hero.jpg">
```

---



### Mistake 2: Overusing `<br>` Tags to Create Vertical Page Spacing Between Paragraphs

**The mistake:** Writing `<p>Para 1</p><br><br><br><p>Para 2</p>`.

**Why it's wrong:** `<br>` is strictly for meaningful line breaks within a single address or poem. Creating layout spacing with multiple `<br>` tags creates messy HTML. Use CSS `margin`.

*Incorrect:*
```html
<p>Paragraph 1</p><br><br><br><p>Paragraph 2</p> <!-- ❌ Layout spacing anti-pattern! -->
```

*Fix:*
```html
<p class="spaced-paragraph">Paragraph 1</p> <!-- CSS: .spaced-paragraph { margin-bottom: 3rem; } -->
```

### Mistake 3: Treating `<hr>` as a Pure Decorative Line Component

**The mistake:** Using `<hr>` tags across a layout purely for visual underline borders.

**Why it's wrong:** In HTML5, `<hr>` represents a **Thematic Break** between paragraph-level topics (e.g. scene changes in a story). Use CSS `border-bottom` for decorative lines.

*Incorrect:*
```html
<h2>Title</h2><hr> <!-- ❌ Decorative line using hr tag -->
```

*Fix:*
```html
<h2 class="bordered-title">Title</h2> <!-- CSS: .bordered-title { border-bottom: 2px solid grey; } -->
```



### Mistake 4: Overusing `<br>` Tags to Create Vertical Page Spacing Between Paragraphs

**The mistake:** Writing `<p>Para 1</p><br><br><br><p>Para 2</p>`.

**Why it's wrong:** `<br>` is strictly for meaningful line breaks within a single address or poem. Creating layout spacing with multiple `<br>` tags creates messy HTML. Use CSS `margin`.

*Incorrect:*
```html
<p>Paragraph 1</p><br><br><br><p>Paragraph 2</p> <!-- ❌ Layout spacing anti-pattern! -->
```

*Fix:*
```html
<p class="spaced-paragraph">Paragraph 1</p> <!-- CSS: .spaced-paragraph { margin-bottom: 3rem; } -->
```

### Mistake 5: Treating `<hr>` as a Pure Decorative Line Component

**The mistake:** Using `<hr>` tags across a layout purely for visual underline borders.

**Why it's wrong:** In HTML5, `<hr>` represents a **Thematic Break** between paragraph-level topics (e.g. scene changes in a story). Use CSS `border-bottom` for decorative lines.

*Incorrect:*
```html
<h2>Title</h2><hr> <!-- ❌ Decorative line using hr tag -->
```

*Fix:*
```html
<h2 class="bordered-title">Title</h2> <!-- CSS: .bordered-title { border-bottom: 2px solid grey; } -->
```



### Mistake 6: Overusing `<br>` Tags to Create Vertical Page Spacing Between Paragraphs

**The mistake:** Writing `<p>Para 1</p><br><br><br><p>Para 2</p>`.

**Why it's wrong:** `<br>` is strictly for meaningful line breaks within a single address or poem. Creating layout spacing with multiple `<br>` tags creates messy HTML. Use CSS `margin`.

*Incorrect:*
```html
<p>Paragraph 1</p><br><br><br><p>Paragraph 2</p> <!-- ❌ Layout spacing anti-pattern! -->
```

*Fix:*
```html
<p class="spaced-paragraph">Paragraph 1</p> <!-- CSS: .spaced-paragraph { margin-bottom: 3rem; } -->
```

### Mistake 7: Treating `<hr>` as a Pure Decorative Line Component

**The mistake:** Using `<hr>` tags across a layout purely for visual underline borders.

**Why it's wrong:** In HTML5, `<hr>` represents a **Thematic Break** between paragraph-level topics (e.g. scene changes in a story). Use CSS `border-bottom` for decorative lines.

*Incorrect:*
```html
<h2>Title</h2><hr> <!-- ❌ Decorative line using hr tag -->
```

*Fix:*
```html
<h2 class="bordered-title">Title</h2> <!-- CSS: .bordered-title { border-bottom: 2px solid grey; } -->
```

## 6. Practice Exercises

### Exercise 1: Void Elements

**Problem:** Why do `<br>` and `<hr>` not require a closing tag (like `</br>`)?

**Expected output:**
> [!check]- Answer
> ```text
> Because they are "void" elements. They cannot contain any text or child elements inside of them, so there is no need to define an "end" boundary.
> ```
> - Think about the "sandwich" metaphor from the Element vs Tag document.

---

### Exercise 2: Proper Address Formatting with br

**Problem:** Format multi-line mailing address using a single `<address>` block and `<br>` line breaks.

**Expected output:**
> [!check]- Answer
> ```html
> <address>
>   Acme Corp<br>
>   123 Main St<br>
>   New York, NY 10001
> </address>
> ```
>
> **Explanation:** `<br>` creates semantic line breaks within postal addresses and poems.

---

### Exercise 3: Thematic Break Accessibility

**Problem:** How is `<hr>` announced by modern screen readers?

**Expected output:**
> [!check]- Answer
> ```text
> Screen readers announce <hr> as a 'separator' or 'thematic break'.
> ```
>
> **Explanation:** `<hr>` conveys a structural transition between distinct topics.

## 7. Related Terms
- [`<p>` (Paragraph)](p.md) — The tag that creates natural block spacing.
- [Void Elements (Self-closing Tags)](../level_01/void_elements.md) — The general concept that `<br>` and `<hr>` fall under.
- [Block-level vs Inline Elements](../level_01/block_inline.md) — Since `<br>` acts as an inline break and `<hr>` behaves like a block-level break.

---

## 8. Key Takeaways
- `<br>` creates a forced line break (carriage return) *without* starting a new paragraph.
- `<hr>` creates a thematic break (a horizontal line) to separate different topics.
- Both are **void elements** and do not have closing tags.
- NEVER use `<br>` tags to create layout spacing; use CSS margins instead.
