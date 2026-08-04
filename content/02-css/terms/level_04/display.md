# `display: block` vs `inline` vs `inline-block`

> **Level 4 — Display & Positioning**
> The fundamental CSS property that dictates how an element flows within the document: as a solid block, as inline text, or a hybrid of both.

---

## 1. Prerequisites
- [Document Flow (Normal Flow)](../level_04/document_flow.md) — The baseline page parsing sequence.
- [The Box Model](../level_02/box_model.md) — The `display` property determines how this box interacts with the boxes around it.
- [Width / Height](../level_02/width_height.md) — The `display` property completely changes how width and height behave!

---

## 2. Term Category
- **Layout Flow Property**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In HTML, every element has a default `display` behavior. A `<div>` naturally takes up the whole screen horizontally, pushing everything else to a new line. But a `<span>` or an `<a>` link sits peacefully side-by-side with text. 
CSS needed a way for developers to override these default HTML behaviors. The **`display`** property allows you to take an inherently block-level `<div>` and force it to act like inline text, or take an `<a>` link and force it to act like a massive block.

### (2) Reality Metaphor
- **`block`**: A brick. If you place a brick down, nothing else can occupy that horizontal space. The next brick must go underneath it.
- **`inline`**: Water in a pipe. It flows smoothly side-by-side. If the pipe bends (the edge of the screen), the water just wraps to the next line. You cannot set a specific "width" or "height" on a stream of water.
- **`inline-block`**: A wooden block floating in a stream of water. It sits side-by-side with the water (inline), but it has a rigid, defined width and height (block).

### (3) The Three Core Values

1. **`display: block;`**
   - **Behavior**: Forces a line break before and after the element. It greedily takes up 100% of the available horizontal space by default.
   - **Box Model**: Fully respects `width`, `height`, `margin`, and `padding`.
   - **Default Elements**: `<div>`, `<p>`, `<h1>`, `<section>`.

2. **`display: inline;`**
   - **Behavior**: Sits side-by-side with text and other inline elements. It only takes up exactly as much space as the text inside it.
   - **Box Model Catch**: It completely **IGNORES** `width` and `height`. It also ignores top/bottom `margin`!
   - **Default Elements**: `<span>`, `<a>`, `<strong>`.

3. **`display: inline-block;`**
   - **Behavior**: The perfect hybrid. It sits side-by-side horizontally (like inline), BUT it fully respects `width`, `height`, and vertical `margin` (like block).
   - **Default Elements**: `<button>`, `<input>`, `<img>`.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to set width/height on an inline element

**The mistake:** You have a link (`<a href="#">Click</a>`) and you write `width: 200px; height: 50px;` in CSS, but the link refuses to change size.

**Why it's wrong:** The `<a>` tag is `display: inline` by default. Inline elements physically cannot have a width or height; they are just streams of text. 
**Solution:** You must add `display: inline-block;` or `display: block;` to the CSS rule. The moment you do, the width and height will instantly work!

---



### Mistake 2: Attempting to Apply CSS `width` and `height` to `display: inline` Elements

**The mistake:** Setting `width: 200px; height: 100px;` on an inline `<span>` tag.

**Why it's wrong:** Inline elements (`display: inline`) flow within surrounding text content and ignore CSS `width` and `height` properties. Change display mode to `inline-block` or `block`.

*Incorrect:*
```css
span { display: inline; width: 200px; } /* ❌ width property is ignored! */
```

*Fix:*
```css
span { display: inline-block; width: 200px; } /* Respects width dimensions */
```

### Mistake 3: Using `display: inline-block` Without Accounting for HTML Whitespace Spacing Gaps

**The mistake:** Placing two 50% width `inline-block` elements side-by-side expecting them to fit on one line.

**Why it's wrong:** HTML spaces/newlines between inline-block tags render as a ~4px whitespace gap character, causing two 50% width elements ($50\% + 50\% + 4	ext{px} > 100\%$) to wrap onto a second line. Use Flexbox.

*Incorrect:*
```css
/* HTML: <div class="col"></div> <div class="col"></div> */
.col { display: inline-block; width: 50%; } /* ❌ Wraps to 2nd line due to whitespace gap! */
```

*Fix:*
```css
/* Use Flexbox to eliminate whitespace gaps cleanly: */
.container { display: flex; }
.col { width: 50%; }
```



### Mistake 4: Attempting to Apply CSS `width` and `height` to `display: inline` Elements

**The mistake:** Setting `width: 200px; height: 100px;` on an inline `<span>` tag.

**Why it's wrong:** Inline elements (`display: inline`) flow within surrounding text content and ignore CSS `width` and `height` properties. Change display mode to `inline-block` or `block`.

*Incorrect:*
```css
span { display: inline; width: 200px; } /* ❌ width property is ignored! */
```

*Fix:*
```css
span { display: inline-block; width: 200px; } /* Respects width dimensions */
```

### Mistake 5: Using `display: inline-block` Without Accounting for HTML Whitespace Spacing Gaps

**The mistake:** Placing two 50% width `inline-block` elements side-by-side expecting them to fit on one line.

**Why it's wrong:** HTML spaces/newlines between inline-block tags render as a ~4px whitespace gap character, causing two 50% width elements ($50\% + 50\% + 4	ext{px} > 100\%$) to wrap onto a second line. Use Flexbox.

*Incorrect:*
```css
/* HTML: <div class="col"></div> <div class="col"></div> */
.col { display: inline-block; width: 50%; } /* ❌ Wraps to 2nd line due to whitespace gap! */
```

*Fix:*
```css
/* Use Flexbox to eliminate whitespace gaps cleanly: */
.container { display: flex; }
.col { width: 50%; }
```



### Mistake 6: Attempting to Apply CSS `width` and `height` to `display: inline` Elements

**The mistake:** Setting `width: 200px; height: 100px;` on an inline `<span>` tag.

**Why it's wrong:** Inline elements (`display: inline`) flow within surrounding text content and ignore CSS `width` and `height` properties. Change display mode to `inline-block` or `block`.

*Incorrect:*
```css
span { display: inline; width: 200px; } /* ❌ width property is ignored! */
```

*Fix:*
```css
span { display: inline-block; width: 200px; } /* Respects width dimensions */
```

### Mistake 7: Using `display: inline-block` Without Accounting for HTML Whitespace Spacing Gaps

**The mistake:** Placing two 50% width `inline-block` elements side-by-side expecting them to fit on one line.

**Why it's wrong:** HTML spaces/newlines between inline-block tags render as a ~4px whitespace gap character, causing two 50% width elements ($50\% + 50\% + 4	ext{px} > 100\%$) to wrap onto a second line. Use Flexbox.

*Incorrect:*
```css
/* HTML: <div class="col"></div> <div class="col"></div> */
.col { display: inline-block; width: 50%; } /* ❌ Wraps to 2nd line due to whitespace gap! */
```

*Fix:*
```css
/* Use Flexbox to eliminate whitespace gaps cleanly: */
.container { display: flex; }
.col { width: 50%; }
```

## 6. Practice Exercises

### Exercise 1: Side-by-Side Navigation

**Problem:** You have a `<ul>` with three `<li>` elements: Home, About, Contact. By default, they stack vertically on top of each other. How can you make them sit side-by-side horizontally, while still allowing them to have a specific clickable `width` of 100px?

**Expected output:**
> [!check]- Answer
> ```text
> Set the `<li>` elements to `display: inline-block;`. 
> If you used `inline`, they would sit side-by-side but ignore the 100px width.
> If you used `block`, they would respect the width but stack vertically.
> ```
> - You need the best of both worlds.

---



### Exercise 2: Display Modes Matrix

**Problem:** Match `display` value to behavior:
1. `block` 
2. `inline` 
3. `inline-block` 
4. `none` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Starts on new line, stretches full width
> 2. Flows within text, ignores width/height
> 3. Flows within line, respects width/height
> 4. Removes element completely from layout tree
> ```
> ```text
> 1. block -> Starts on new line, stretches full width
> 2. inline -> Flows within text, ignores width/height
> 3. inline-block -> Flows within line, respects width/height
> 4. none -> Removes element completely from layout tree
> ```
>
> **Explanation:** `display` dictates CSS box generation and flow positioning rules.

---

### Exercise 3: Modern Outer/Inner Display Syntax

**Problem:** What does multi-keyword syntax `display: inline flex;` specify?

**Expected output:**
> [!check]- Answer
> ```text
> Sets outer display behavior to inline, and inner formatting context to Flexbox.
> ```
> ```css
> .container {
>   display: inline flex;
> }
> ```
>
> **Explanation:** Multi-keyword `display` specifies outer layout flow and inner container context.

## 7. Related Terms
- [`display: none` vs `visibility: hidden`](../level_04/display_none_vs_visibility.md) — Hiding elements.
- [`display: flex`](../level_05/display_flex.md) — The modern Flexbox layout container.
- [Margin](../level_02/margin.md) — Visual box margins.

---

## 8. Key Takeaways
- `display` overrides the default layout flow of an HTML element.
- **Block**: Stacks vertically, respects width/height.
- **Inline**: Flows horizontally like text, completely ignores width/height.
- **Inline-Block**: Flows horizontally, but respects width/height.
