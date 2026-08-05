# `list-style`

> **Level 7 — Text & List Formatting**
> The property used to control the appearance of the bullets or numbers next to HTML list items.

---

## 1. Prerequisites
- [`<ul>`, `<ol>`, and `<li>` (Lists)](../../../01-html/terms/level_02/lists.md) — The HTML elements that this CSS property targets.

---

## 2. Term Category
- **Typography / Formatting Property**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, the browser renders `<ul>` items with solid black circle bullets, and `<ol>` items with standard decimal numbers (1, 2, 3). 
However, what if you are building an outline and need roman numerals (I, II, III)? What if you want to use a custom SVG checkmark icon instead of a boring black dot? Or, most commonly, what if you are building a Navigation Bar using a `<ul>`, and you want to completely *remove* the bullets?
The W3C created **`list-style`** (a shorthand for `list-style-type`, `list-style-position`, and `list-style-image`) to give developers control over these markers.

### (2) The Core Values (for `list-style-type`)
- **`disc` (Default `<ul>`)**: A filled black circle.
- **`circle`**: An empty, outlined circle.
- **`square`**: A filled black square.
- **`decimal` (Default `<ol>`)**: 1, 2, 3.
- **`upper-roman`**: I, II, III.
- **`lower-alpha`**: a, b, c.
- **`none`**: Removes the bullet/number entirely!

### (3) Reality Metaphor
Imagine a Word Document bulleted list. You highlight the list, go to the toolbar, and click the little dropdown arrow next to the bullet icon to pick hollow circles, squares, or checkboxes instead.

### (4) Code Examples

#### Removing Bullets for a Nav Bar
Because semantic HTML dictates that navigation menus should be built using `<ul>` tags, the very first thing you do when styling a nav bar is remove the ugly default bullets.
```css
.nav-menu {
  /* Completely removes the bullets from the list items */
  list-style: none;
  
  /* Reset the default padding that browsers add to lists */
  padding-left: 0;
}
```

#### Changing Numbers to Roman Numerals
```css
.legal-outline {
  list-style-type: upper-roman;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that `list-style: none` doesn't remove the indentation

**The mistake:** You apply `list-style: none;` to your `<ul>` to build a clean sidebar menu, but the text is still pushed 40px to the right, looking completely misaligned.

**Why it's wrong:** The `list-style` property *only* removes the physical black dot. It does NOT remove the default `padding-left: 40px` that the browser automatically adds to all `<ul>` tags to make room for the dot! You must manually add `padding-left: 0;` to fix the alignment.

---



### Mistake 2: Using `list-style: none` Without Re-Adding Accessibility List Context for Safari Screen Readers

**The mistake:** Setting `ul { list-style: none; }` on navigation menus.

**Why it's wrong:** VoiceOver on iOS Safari strips list landmark semantics (announcing list item counts) from `<ul>` elements when `list-style: none` is applied. Add `role="list"`.

*Incorrect:*
```css
ul.nav { list-style: none; } /* ❌ VoiceOver strips list accessibility semantics! */
```

*Fix:*
```css
/* Add role="list" in HTML: <ul class="nav" role="list"> */
ul.nav { list-style: none; padding: 0; margin: 0; }
```

### Mistake 3: Forgetting to Reset `padding-left` When Removing List Bullets

**The mistake:** Setting `list-style: none;` without clearing `padding-left: 0`.

**Why it's wrong:** Browsers apply a default ~40px `padding-left` to `<ul>` elements for bullet indentation. Omitting `padding: 0` leaves an empty 40px left indent.

*Incorrect:*
```css
ul { list-style: none; } /* ❌ Leaves 40px left padding indent! */
```

*Fix:*
```css
ul { list-style: none; padding: 0; margin: 0; }
```

## 6. Practice Exercises

### Exercise 1: Custom Icons

**Problem:** You want to use a tiny picture of a star (`star.png`) as your bullet point. Can you do this with `list-style`?

**Expected output:**
> [!check]- Answer
> ```text
> Yes! You can use the `list-style-image` property: `list-style-image: url('star.png');`. 
> (Though in modern CSS, developers often use the `::before` pseudo-element for better alignment control).
> ```
> - Is there a property specifically for images?

---



### Exercise 2: Navigation List Style Reset

**Problem:** Write CSS ruleset resetting `list-style`, `padding`, and `margin` to 0 on `.nav-list`.

**Expected output:**
> [!check]- Answer
> ```text
> .nav-list { list-style: none; padding: 0; margin: 0; }
> ```
> ```css
> .nav-list {
>   list-style: none;
>   padding: 0;
>   margin: 0;
> }
> ```
>
> **Explanation:** Complete list resets remove default browser bullet marks and indentation padding.

---

### Exercise 3: Custom Bullet Marker Styling

**Problem:** Which modern CSS pseudo-element targets custom bullet markers inside list items (`li::marker`)?

**Expected output:**
> [!check]- Answer
> ```text
> li::marker
> ```
> ```css
> li::marker {
>   color: red;
>   font-weight: bold;
> }
> ```
>
> **Explanation:** `::marker` pseudo-element styles list bullet points directly.

## 7. Related Terms
- None!

---

## 8. Key Takeaways
- `list-style` controls the bullets/numbers of HTML lists.
- `list-style: none;` is used constantly to remove bullets when building Navigation Bars.
- Always remember to combine `list-style: none;` with `padding-left: 0;` to remove the default browser indentation!
