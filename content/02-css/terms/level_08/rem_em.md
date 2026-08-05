# `rem` vs `em`

> **Level 8 — Responsive Design & Units**
> The modern, accessible units used for typography and spacing, which scale relative to the font-size of the document.

---

## 1. Prerequisites
- [`font-size` & `font-weight`](../level_03/font_size_weight.md) — The property that these units multiply against.

---

## 2. Term Category
- **CSS Measurement Unit**

---

## 3. Environment Context
- **Universal Modern Standard** (The absolute gold standard for defining sizes in CSS).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Historically, developers used Pixels (`px`) for everything. The problem? Pixels are fixed. If a visually impaired user goes into their browser settings and changes their default text size from 16px to 24px so they can read better, a website built with hardcoded `14px` fonts will ignore their settings, ruining the accessibility.
The W3C created **`rem`** (Root EM) and **`em`** to solve this. They are multipliers. 
By default, all browsers have a "Root" font size of **16px**.
- `1rem` = 1 * 16px = 16px.
- `2rem` = 2 * 16px = 32px.
If the visually impaired user changes their browser root to 24px, your `2rem` title instantly scales up to 48px, respecting their needs! **You should use `rem` instead of `px` for almost everything in modern CSS.**

### (2) The Difference: `rem` vs `em`
- **`rem` (Root EM)**: Calculates its math based strictly on the **Root** (the `<html>` tag). It is consistent and safe. `1rem` is *always* 16px everywhere on the page.
- **`em` (Local EM)**: Calculates its math based on its **immediate Parent Container**. This is powerful, but extremely dangerous because it compounds.

### (3) Code Examples

#### The Safe Way (`rem`)
```css
/* Assuming the browser default root is 16px */
h1 {
  /* 3 * 16px = 48px */
  font-size: 3rem; 
}

p {
  /* 1 * 16px = 16px */
  font-size: 1rem;
}
```

#### The Danger of `em`
```css
.parent {
  font-size: 20px;
}

.child {
  /* The child looks at its parent (20px). 
     2 * 20px = 40px! */
  font-size: 2em; 
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: The `em` Snowball Effect

**The mistake:** Using `em` for font sizes in a deeply nested HTML list.

**Why it's wrong:** Because `em` looks at its parent, it multiplies exponentially. 
If `<ul>` is 2em (32px), and an `<li>` inside it is 2em... the `<li>` calculates 2 * 32px = 64px! If there is a sub-list inside that, it becomes 128px! The text snowballs out of control. 
**Golden Rule:** NEVER use `em` for `font-size`. **Always use `rem` for typography.**

### Mistake 2: Using `px` for spacing

**The mistake:** Using `padding: 20px;` on a button.

**Why it's wrong:** If a user scales up their font size to 32px, but the padding is locked at 20px, the giant text will burst out of the small button!
**Solution:** Use `em` for padding! If you set a button to `padding: 1em;`, the padding will dynamically grow to perfectly wrap the text, no matter how big the text gets. (This is the one scenario where `em` is better than `rem`!).

---



### Mistake 3: Using `em` for Padding/Margin Causing Compound Scaling Bugs inside Nested Containers

**The mistake:** Setting `padding: 2em; font-size: 1.5em;` on multi-nested card containers.

**Why it's wrong:** `em` units calculate relative to the **current element's font size** (or parent font size). Nesting elements with `em` units causes font size and padding to compound exponentially.

*Incorrect:*
```css
div { font-size: 1.2em; padding: 1.5em; } /* ❌ Compounds size when nested! */
```

*Fix:*
```css
div { font-size: 1.2rem; padding: 1.5rem; } /* rem calculates against root 16px font size */
```

### Mistake 4: Overriding `html { font-size: 16px; }` in Pixels Destroying User Accessibility Zoom Settings

**The mistake:** Hardcoding `html { font-size: 16px; }` in CSS.

**Why it's wrong:** Hardcoding root `font-size` in `px` overrides user browser accessibility font preferences. Use `html { font-size: 100%; }` to preserve root responsiveness.

*Incorrect:*
```css
html { font-size: 16px; } /* ❌ Overrides user browser accessibility settings! */
```

*Fix:*
```css
html { font-size: 100%; } /* Preserves user-agent 16px base font scaling */
```



### Mistake 5: Using `em` for Padding/Margin Causing Compound Scaling Bugs inside Nested Containers

**The mistake:** Setting `padding: 2em; font-size: 1.5em;` on multi-nested card containers.

**Why it's wrong:** `em` units calculate relative to the **current element's font size** (or parent font size). Nesting elements with `em` units causes font size and padding to compound exponentially.

*Incorrect:*
```css
div { font-size: 1.2em; padding: 1.5em; } /* ❌ Compounds size when nested! */
```

*Fix:*
```css
div { font-size: 1.2rem; padding: 1.5rem; } /* rem calculates against root 16px font size */
```

### Mistake 6: Overriding `html { font-size: 16px; }` in Pixels Destroying User Accessibility Zoom Settings

**The mistake:** Hardcoding `html { font-size: 16px; }` in CSS.

**Why it's wrong:** Hardcoding root `font-size` in `px` overrides user browser accessibility font preferences. Use `html { font-size: 100%; }` to preserve root responsiveness.

*Incorrect:*
```css
html { font-size: 16px; } /* ❌ Overrides user browser accessibility settings! */
```

*Fix:*
```css
html { font-size: 100%; } /* Preserves user-agent 16px base font scaling */
```



### Mistake 7: Using `em` for Padding/Margin Causing Compound Scaling Bugs inside Nested Containers

**The mistake:** Setting `padding: 2em; font-size: 1.5em;` on multi-nested card containers.

**Why it's wrong:** `em` units calculate relative to the **current element's font size** (or parent font size). Nesting elements with `em` units causes font size and padding to compound exponentially.

*Incorrect:*
```css
div { font-size: 1.2em; padding: 1.5em; } /* ❌ Compounds size when nested! */
```

*Fix:*
```css
div { font-size: 1.2rem; padding: 1.5rem; } /* rem calculates against root 16px font size */
```

### Mistake 8: Overriding `html { font-size: 16px; }` in Pixels Destroying User Accessibility Zoom Settings

**The mistake:** Hardcoding `html { font-size: 16px; }` in CSS.

**Why it's wrong:** Hardcoding root `font-size` in `px` overrides user browser accessibility font preferences. Use `html { font-size: 100%; }` to preserve root responsiveness.

*Incorrect:*
```css
html { font-size: 16px; } /* ❌ Overrides user browser accessibility settings! */
```

*Fix:*
```css
html { font-size: 100%; } /* Preserves user-agent 16px base font scaling */
```

## 6. Practice Exercises

### Exercise 1: The Multiplier Math

**Problem:** A user has perfect vision, so their browser root is set to the default `16px`. You write a CSS rule: `margin-bottom: 1.5rem;`. How many pixels of margin is that?

**Expected output:**
> [!check]- Answer
> ```text
> 24 pixels! (1.5 * 16 = 24).
> ```
> - Break out a calculator! What is one-and-a-half times sixteen?

---



### Exercise 2: rem vs em Calculation Matrix

**Problem:** Given root `html = 16px` and parent `.card = 20px` font size, calculate computed pixel size for:
1. `font-size: 2rem` 
2. `font-size: 2em` inside `.card` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. 2rem = 32px (2 * 16px root)
> 2. 2em = 40px (2 * 20px parent)
> ```
> ```text
> 1. 2rem = 32px (2 * 16px root)
> 2. 2em = 40px (2 * 20px parent)
> ```
>
> **Explanation:** `rem` calculates against root `<html>` font size; `em` calculates against parent/element font size.

---

### Exercise 3: Best Practice Unit Selection Rule

**Problem:** When should `rem` be used vs `em`?

**Expected output:**
> [!check]- Answer
> ```text
> Use rem for global typography, paddings, margins, and container layouts; use em for element-level components that must scale proportionally with local font size (e.g. icon padding inside buttons).
> ```
> ```text
> Use rem for global typography, paddings, margins, and container layouts; use em for element-level components that must scale proportionally with local font size (e.g. icon padding inside buttons).
> ```
>
> **Explanation:** `rem` maintains consistent global scaling; `em` enables component-relative scaling.

## 7. Related Terms
- [`font-size` & `font-weight`](../level_03/font_size_weight.md) — The property that controls the baseline font scale.
- [`%` (Percentages)](percentages.md) — Sizing relative to parent containers.
- [`vw` / `vh` (Viewport Units)](viewport_units.md) — Sizing relative to the viewport.
- [Responsive Design (Concept)](responsive_design.md) — Related concept: Responsive Design (Concept).

---

## 8. Key Takeaways
- `rem` and `em` are relative multipliers, making them perfect for Accessibility.
- **Rule of Thumb:** Use **`rem`** for `font-size`, `margin`, and global spacing.
- **Rule of Thumb:** Use **`em`** for local element `padding` (like buttons) so the box scales with the text inside it.
- **Avoid `px`** in modern web development whenever possible (except for tiny things like `1px` borders).
