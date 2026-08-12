# `line-height`

> **Level 3 — Typography & Colors**
> The property used to control the vertical spacing between lines of text (line spacing).

---

## 1. Prerequisites
- [`font-size` & `font-weight`](font_size_weight.md) — `line-height` is calculated directly based on the font size.

---

## 2. Term Category

**Typography Property (Universal Browser Support)**: `line-height` is a fundamental concept in this technology stack. **Level 3 — Typography & Colors**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you write a massive wall of text, and the bottom of the first line perfectly touches the top of the second line, it creates a claustrophobic, unreadable mess. 
The W3C created **`line-height`** to allow developers to adjust the vertical breathing room between lines of wrapped text. It is exactly the same concept as "Double Spacing" a paper in Microsoft Word. 
Increasing the `line-height` drastically improves readability and user experience, especially on mobile devices.

### (2) Reality Metaphor
Imagine writing an essay on lined binder paper.
If you write on every single line, it looks cramped.
If you "skip a line" between each sentence (Double Spacing), it is much easier for the teacher to read. `line-height` is the CSS tool to skip lines.

### (3) Code Examples

#### Unitless Multipliers (Best Practice)
The absolute best way to define `line-height` is using a unitless number. This acts as a multiplier against the current `font-size`.

```css
p {
  font-size: 16px;
  /* 1.5 * 16px = 24px of total vertical space per line */
  line-height: 1.5; 
}

h1 {
  font-size: 40px;
  /* Headings usually need tighter line-heights because the text is so massive */
  line-height: 1.2;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using pixels or percentages for line-height

**The mistake:** Writing `line-height: 24px;` or `line-height: 150%;`.

**Why it's wrong:** While this technically works, it breaks the moment you change the font size. If you set `line-height: 24px` on the `<body>`, and then later set an `<h1>` to `font-size: 40px`, the 40px text will literally overlap and crush itself because it is trapped inside a strict 24px line-height constraint!
**Solution:** Always use a unitless number (e.g., `line-height: 1.5;`). A unitless number is dynamic. If the font is 16px, the line-height is 24px. If the font changes to 40px, the line-height automatically scales to 60px. It prevents text from overlapping.

### Mistake 2: The "Vertical Center" hack on multi-line text

**The mistake:** Using `line-height: 50px;` on a button that is 50px tall to perfectly vertically center the text.

**Why it's wrong:** This is an old-school CSS hack that perfectly centers a *single* line of text. However, if the user translates the page and the text is forced to wrap onto a second line, that second line will be pushed 50px down, blowing completely out of the button! Use Flexbox (`align-items: center`) to vertically center things; never use the line-height hack for real projects.

---



### Mistake 3: Using Fixed Unit Values (`line-height: 24px`) on Resizable Heading Text

**The mistake:** Setting `line-height: 20px` on a container where `font-size` increases on hover or media query to 32px.

**Why it's wrong:** Fixed unit line heights do NOT scale when `font-size` changes, causing text lines to overlap on larger font sizes. Use unitless numbers (`line-height: 1.5`).

*Incorrect:*
```css
h1 { font-size: 32px; line-height: 20px; } /* ❌ Text lines crash and overlap! */
```

*Fix:*
```css
h1 { font-size: 32px; line-height: 1.2; } /* Unitless multiplier scales dynamically */
```

### Mistake 4: Using `line-height` Equal to Element Height for Multi-Line Text Centering

**The mistake:** Setting `height: 100px; line-height: 100px;` on a card container with multi-line paragraph text.

**Why it's wrong:** `line-height` equal to height works ONLY for single-line text buttons. If text wraps into 2 lines, lines spill outside container with 100px line gaps. Use Flexbox `align-items: center`.

*Incorrect:*
```css
div { height: 100px; line-height: 100px; } /* ❌ Multi-line text breaks layout! */
```

*Fix:*
```css
div { display: flex; align-items: center; min-height: 100px; }
```

## 5. Practice Exercises

### Exercise 1: Unitless line-height for Proportional Multi-Line Paragraph Readability

**Scenario:** An author sets unitless `line-height: 1.5` on body text for optimal proportional readability.

**Requirements:**
1. Set `line-height: 1.5` on `body` element.
2. Set `line-height: 1.2` on headings.
3. Explain unitless inheritance.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> body {
>   font-size: 1rem;
>   line-height: 1.5;            /* Unitless 1.5 multiplier (16px * 1.5 = 24px line height) */
>   color: #1e293b;
> }
>
> h1 {
>   font-size: 2.25rem;
>   line-height: 1.2;            /* Tighter unitless 1.2 multiplier (~43px line height) */
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `line-height` Property**: Controls the vertical space allocated to lines of text above and below the font baseline.
> 2. **Unitless Line-Height Rule**: ALWAYS use unitless numbers (`1.5`, `1.2`) instead of fixed units (`px`, `em`). Unitless values inherit as a multiplier of each child's own font size!
> 3. **Inheritance Bug with Units**: Setting `line-height: 1.5em` on `body` computes a fixed pixel height on body (24px) which inherits to `h1`, causing overlapping heading text!
> 
---

### Exercise 2: Centering Single-Line Buttons with Unitless Line Height vs Padding

**Scenario:** Styles button text centering using vertical padding instead of hardcoded line-height.

**Requirements:**
1. Use `padding-block` for vertical button text alignment.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .btn-centered {
>   display: inline-flex;
>   align-items: center;
>   padding: 0.75rem 1.5rem;
>   line-height: 1;               /* Compact line-height for button labels */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Padding Centering Superiority**: Use vertical padding (`padding-block`) for button text centering; hardcoded `line-height` breaks when button text wraps to two lines!
> 2. **Compact Label Height**: `line-height: 1` removes extra vertical font leading inside button boxes.
> 3. **Flex Alignment**: `display: inline-flex; align-items: center;` handles icon-text alignment perfectly.
> 
---

### Exercise 3: Avoiding Fixed Pixel line-height Traps in Responsive Headings

**Scenario:** Demonstrates why fixed pixel `line-height: 30px` breaks when text wraps.

**Requirements:**
1. Refactor fixed pixel line-height to unitless `1.2`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Refactored: Replaced hardcoded line-height: 30px with unitless multiplier */
> .responsive-heading {
>   font-size: clamp(1.5rem, 3vw, 2.5rem);
>   line-height: 1.2;             /* Scales line-height dynamically with font-size */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Dynamic Line-Height Scaling**: Unitless `1.2` scales line height automatically as `clamp()` font sizes adapt to screen width.
> 2. **Preventing Text Collisions**: Eliminates multi-line heading text collision bugs on mobile screens.
> 3. **WCAG Readability**: Satisfies WCAG 1.4.12 Text Spacing guidelines.
## 6. Related Terms
- [`font-size` & `font-weight`](font_size_weight.md) — The property that `line-height` multiplies against.
- [`font-style` & `font-variant`](font_style_variant.md) — Text formatting variants.

---

## 7. Key Takeaways
- `line-height` controls the vertical space between lines of text (line spacing).
- **Golden Rule**: Always use a unitless number (like `1.5`). Never use pixels (`px`) or percentages (`%`).
- `1.5` is generally considered the optimal line-height for readable body text. Headings usually require a tighter height, like `1.2`.
