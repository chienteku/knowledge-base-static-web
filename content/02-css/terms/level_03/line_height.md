# `line-height`

> **Level 3 — Typography & Colors**
> The property used to control the vertical spacing between lines of text (line spacing).

---

## 1. Prerequisites
- [`font-size` & `font-weight`](font_size_weight.md) — `line-height` is calculated directly based on the font size.
---

## 2. Term Category
- **Typography Property**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Calculating the Box

**Problem:** A paragraph has `font-size: 20px` and `line-height: 2`. The paragraph wraps into 3 lines of text. Not including any padding or margins, how tall is the physical box of this paragraph?

**Expected output:**
> [!check]- Answer
> ```text
> 120px! 
> The line-height multiplier (2) * font-size (20) = 40px per line.
> 40px * 3 lines = 120px total height.
> ```
> - Calculate the height of a single line first.

---



### Exercise 2: Unitless Line-Height Rule

**Problem:** Write CSS rule applying unitless line-height of `1.6` to body paragraph text.

**Expected output:**
> [!check]- Answer
> ```text
> p { line-height: 1.6; }
> ```
> ```css
> p {
>   line-height: 1.6;
> }
> ```
>
> **Explanation:** Unitless numbers (e.g. `1.6`) multiply font size dynamically across all child elements.

---

### Exercise 3: Single-Line Button Vertical Centering

**Problem:** Write single-line button CSS setting height 40px and line-height 40px for vertical text centering.

**Expected output:**
> [!check]- Answer
> ```text
> .btn { height: 40px; line-height: 40px; }
> ```
> ```css
> .btn {
>   height: 40px;
>   line-height: 40px;
> }
> ```
>
> **Explanation:** Matching line-height to explicit element height vertically centers single-line text.

## 7. Related Terms
- [`font-size` & `font-weight`](font_size_weight.md) — The property that `line-height` multiplies against.
- [`font-style` & `font-variant`](font_style_variant.md) — Text formatting variants.
---

## 8. Key Takeaways
- `line-height` controls the vertical space between lines of text (line spacing).
- **Golden Rule**: Always use a unitless number (like `1.5`). Never use pixels (`px`) or percentages (`%`).
- `1.5` is generally considered the optimal line-height for readable body text. Headings usually require a tighter height, like `1.2`.
