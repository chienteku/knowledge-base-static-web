# `float` & `clear` (Legacy context)

> **Level 4 — Display & Positioning**
> A legacy property originally designed to make text wrap around images, which was later abused to build entire website layouts before Flexbox existed.

---

## 1. Prerequisites
- [The Box Model (Concept)](../level_02/box_model.md) — Floats drastically alter how boxes behave.
- [Document Flow (Normal Flow)](document_flow.md) — The normal document layout flow that floats disrupt.
---

## 2. Term Category
- **Legacy Layout Property**

---

## 3. Environment Context
- **Universal Browser Support, but largely obsolete for modern layout.**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In the early days of the web, people wanted to write an article and put an image on the left side, with the paragraph text smoothly wrapping around the right side of the image (exactly like a newspaper or a magazine). 
The W3C created **`float: left;`** and **`float: right;`** for this exact, singular purpose. 
When an image is floated, it is pushed to the left/right edge of its container, and any inline text that follows it will flow around it. 

### (2) The Dark Ages (The Abuse)
Around 2005, web designers realized they could use `float` on `<div>` containers to create multi-column website layouts (e.g., putting a sidebar next to a main content area). 
Because `float` was *never* designed to build grids or complex layouts, doing this caused massive bugs. Containers would collapse, elements would overlap, and developers had to invent horrible hacks (like the "Clearfix") to force the browser to behave. **Today, we have Flexbox and Grid. You should almost NEVER use `float` to build layouts anymore.**

### (3) Reality Metaphor
Imagine dropping a rock (the image) into a stream of water (the text). 
If you push the rock to the left side of the stream (`float: left`), the water smoothly flows around the right side of the rock.

### (4) Code Examples

#### The Proper Use (Text wrapping an image)
```css
.article-image {
  /* The image pushes to the left, and the text wraps around its right side */
  float: left;
  /* Add some breathing room so the text doesn't touch the image */
  margin-right: 15px;
}
```

#### The `clear` Property
If you float an image, but you want the *next* paragraph to start cleanly *below* the image (instead of wrapping next to it), you must use `clear`.
```css
.footer-paragraph {
  /* Forces this paragraph to drop down below any left-floating elements */
  clear: left; 
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using Float for Layout in 2024+

**The mistake:** Using `float: left; width: 50%;` on two `<div>` elements to make them sit side-by-side like a 2-column grid.

**Why it's wrong:** This is a legacy hack from 15 years ago. It will cause the parent container to physically collapse to a height of 0px (because floating elements are taken out of the normal flow), which requires adding ugly "clearfix" code to fix. 
**Solution:** Use `display: flex;` on the parent container instead. It requires zero hacks and was specifically designed for building columns.

---



### Mistake 2: Using `float` for Main Web Page Grid Layouts (Legacy Pre-Flexbox Anti-Pattern)

**The mistake:** Building 3-column website layouts using `float: left` and clearing hacks.

**Why it's wrong:** Using `float` for grid layouts is an obsolete 2000s technique requiring complex clearfix hacks and rigid column math. Use modern CSS Grid or Flexbox.

*Incorrect:*
```css
.col { float: left; width: 33.33%; } /* ❌ Obsolete float grid layout */
```

*Fix:*
```css
.container { display: flex; } .col { flex: 1; } /* Modern Flexbox grid */
```

### Mistake 3: Forgetting Clearfix on Parent Containers Containing Floated Elements

**The mistake:** Floating images inside a card wrapper without applying clearfix or BFC rules.

**Why it's wrong:** Parent elements do not automatically expand to contain floated children, causing parent background colors and borders to collapse above floated items.

*Incorrect:*
```css
.card { background: white; } /* ❌ Collapses height if children are floated! */
```

*Fix:*
```css
.card::after {
  content: "";
  display: table;
  clear: both;
}
```



### Mistake 4: Using `float` for Main Web Page Grid Layouts (Legacy Pre-Flexbox Anti-Pattern)

**The mistake:** Building 3-column website layouts using `float: left` and clearing hacks.

**Why it's wrong:** Using `float` for grid layouts is an obsolete 2000s technique requiring complex clearfix hacks and rigid column math. Use modern CSS Grid or Flexbox.

*Incorrect:*
```css
.col { float: left; width: 33.33%; } /* ❌ Obsolete float grid layout */
```

*Fix:*
```css
.container { display: flex; } .col { flex: 1; } /* Modern Flexbox grid */
```

### Mistake 5: Forgetting Clearfix on Parent Containers Containing Floated Elements

**The mistake:** Floating images inside a card wrapper without applying clearfix or BFC rules.

**Why it's wrong:** Parent elements do not automatically expand to contain floated children, causing parent background colors and borders to collapse above floated items.

*Incorrect:*
```css
.card { background: white; } /* ❌ Collapses height if children are floated! */
```

*Fix:*
```css
.card::after {
  content: "";
  display: table;
  clear: both;
}
```



### Mistake 6: Using `float` for Main Web Page Grid Layouts (Legacy Pre-Flexbox Anti-Pattern)

**The mistake:** Building 3-column website layouts using `float: left` and clearing hacks.

**Why it's wrong:** Using `float` for grid layouts is an obsolete 2000s technique requiring complex clearfix hacks and rigid column math. Use modern CSS Grid or Flexbox.

*Incorrect:*
```css
.col { float: left; width: 33.33%; } /* ❌ Obsolete float grid layout */
```

*Fix:*
```css
.container { display: flex; } .col { flex: 1; } /* Modern Flexbox grid */
```

### Mistake 7: Forgetting Clearfix on Parent Containers Containing Floated Elements

**The mistake:** Floating images inside a card wrapper without applying clearfix or BFC rules.

**Why it's wrong:** Parent elements do not automatically expand to contain floated children, causing parent background colors and borders to collapse above floated items.

*Incorrect:*
```css
.card { background: white; } /* ❌ Collapses height if children are floated! */
```

*Fix:*
```css
.card::after {
  content: "";
  display: table;
  clear: both;
}
```

## 6. Practice Exercises

### Exercise 1: Modern vs Legacy

**Problem:** Your boss asks you to build a navigation bar with a logo on the left and 4 links on the right. Should you use `float: left` for the logo and `float: right` for the links?

**Expected output:**
> [!check]- Answer
> ```text
> No! You should use Flexbox (`display: flex; justify-content: space-between;`). You only use `float` if you want a large block of text to wrap around a picture like a newspaper.
> ```
> - Are we wrapping text around an image, or building a UI layout?

---



### Exercise 2: Valid Float Text Wrapping Use Case

**Problem:** What is the single primary valid use case for `float` in modern HTML5 web design?

**Expected output:**
> [!check]- Answer
> ```text
> Floating an image to the left or right inside a paragraph block so text wraps smoothly around it.
> ```
> ```css
> img.article-image {
>   float: left;
>   margin-right: 15px;
> }
> ```
>
> **Explanation:** `float` was specifically designed to wrap text around images inside articles.

---

### Exercise 3: Clearfix CSS Snippet

**Problem:** Write micro-clearfix pseudo-element pattern for container `.clearfix`.

**Expected output:**
> [!check]- Answer
> ```text
> .clearfix::after { content: ""; display: table; clear: both; }
> ```
> ```css
> .clearfix::after {
>   content: "";
>   display: table;
>   clear: both;
> }
> ```
>
> **Explanation:** Clearfix pseudo-element clears floated children to prevent parent height collapse.

## 7. Related Terms
- [`display: flex`](../level_05/display_flex.md) — The modern Flexbox layout container.
- [Document Flow (Normal Flow)](document_flow.md) — The layout engine disrupted by floats.
---

## 8. Key Takeaways
- `float` was designed solely to make text wrap around images (like a magazine).
- `clear` is used to force an element to drop below a floated element.
- **Legacy Warning**: Never use `float` to build columns, grids, or side-by-side UI layouts. Use Flexbox or CSS Grid instead!
