# `align-items`

> **Level 5 — Layouts — Flexbox**
> The property used to align children along the Cross Axis (the axis perpendicular to the Main Axis, usually vertically).

---

## 1. Prerequisites
- [`justify-content`](justify_content.md) — You must understand `justify-content` (Main Axis) to understand `align-items` (Cross Axis).

---

## 2. Term Category
- **Flexbox Property**

---

## 3. Environment Context
- **Universal Modern Standard**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If `justify-content` aligns items horizontally (Main Axis), we need a way to align items vertically (Cross Axis). For example, if you have a tall 100px navigation bar, but your text links are only 20px tall, should the text sit at the top of the bar, the bottom of the bar, or perfectly in the middle?
The W3C created **`align-items`** for this. It handles alignment on the axis perpendicular to `flex-direction`.

### (2) The Core Values
Assuming the default `flex-direction: row` (Vertical Cross Axis):

- **`stretch` (Default)**: If the children don't have a fixed height, they will stretch vertically to fill the entire height of the container.
- **`flex-start`**: Align to the top.
- **`flex-end`**: Align to the bottom.
- **`center`**: Align perfectly in the middle vertically.

### (3) Reality Metaphor
Imagine hanging clothes in a closet. 
`justify-content` is how far apart the hangers are spaced on the metal rod (horizontal).
`align-items` is whether the clothes are pushed up to touch the ceiling, hanging perfectly in the middle, or dragged down to touch the floor (vertical).

### (4) Code Examples

#### The Holy Grail: Perfect Dead-Center
Before Flexbox, perfectly centering a `<div>` both horizontally and vertically was notoriously difficult. With Flexbox, it takes exactly 3 lines of code on the Parent container:
```css
.perfect-center-container {
  display: flex;
  
  /* Center horizontally (Main Axis) */
  justify-content: center; 
  
  /* Center vertically (Cross Axis) */
  align-items: center; 
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use it without a container height

**The mistake:** You create a `<header>`, apply `display: flex; align-items: center;`, and the text doesn't look vertically centered.

**Why it's wrong:** Just like `justify-content` needs extra width to work, `align-items` needs extra **height** to work! If your `<header>` does not have a specific `height` set, it automatically shrinks to perfectly wrap its text. If the header is exactly as tall as the text, there is no empty vertical space for the text to move into. You must give the container a height (e.g., `height: 100px;` or `min-height: 100vh;`) first!

---



### Mistake 2: Confusing Main Axis (`justify-content`) vs Cross Axis (`align-items`) in `flex-direction: column`

**The mistake:** Using `align-items: center` expecting to center items vertically when `flex-direction` is set to `column`.

**Why it's wrong:** When `flex-direction: column` is set, the Main axis becomes VERTICAL and the Cross axis becomes HORIZONTAL! `align-items` now controls HORIZONTAL alignment.

*Incorrect:*
```css
.col { display: flex; flex-direction: column; align-items: center; } /* ❌ Centers HORIZONTALLY! */
```

*Fix:*
```css
.col { display: flex; flex-direction: column; justify-content: center; } /* Centers VERTICALLY */
```

### Mistake 3: Expecting `align-items: stretch` to Function When Flex Items Have Explicit Fixed Heights

**The mistake:** Setting `align-items: stretch` on a flex container where child items have `height: 100px`.

**Why it's wrong:** Explicit `height` (or `max-height`) property declarations on child flex items prevent `align-items: stretch` from expanding item heights.

*Incorrect:*
```css
.item { height: 100px; } /* ❌ Prevents parent align-items: stretch from working! */
```

*Fix:*
```css
.item { height: auto; } /* Allows flex stretch alignment */
```

## 6. Practice Exercises

### Exercise 1: The Stretched Buttons

**Problem:** You build a Flex row of buttons. You set the Flex Container to `height: 150px`. Suddenly, all your buttons stretch and become massive 150px tall rectangles, which looks terrible. What property/value caused this, and how do you fix it?

**Expected output:**
> [!check]- Answer
> ```text
> The default value of `align-items` is `stretch`! Because the container grew to 150px, the default behavior forced the children to stretch to match it.
> You fix it by setting `align-items: flex-start;` or `align-items: center;` to stop the stretching behavior.
> ```
> - What is the default value of `align-items`?

---



### Exercise 2: Vertical and Horizontal Centering Pattern

**Problem:** Write CSS for `.hero` centering child items both horizontally AND vertically in flex row mode.

**Expected output:**
> [!check]- Answer
> ```text
> .hero { display: flex; justify-content: center; align-items: center; }
> ```
> ```css
> .hero {
>   display: flex;
>   justify-content: center;
>   align-items: center;
> }
> ```
>
> **Explanation:** Combining `justify-content: center` and `align-items: center` achieves perfect 2D centering.

---

### Exercise 3: align-items Baseline Alignment

**Problem:** Which `align-items` value aligns text content inside flex items along their shared typographic baseline?

**Expected output:**
> [!check]- Answer
> ```text
> align-items: baseline;
> ```
> ```css
> .nav {
>   display: flex;
>   align-items: baseline;
> }
> ```
>
> **Explanation:** `align-items: baseline` aligns text baselines regardless of differing font sizes.

## 7. Related Terms
- [`justify-content`](justify_content.md) — The Main Axis sibling.
- [`flex-direction`](flex_direction.md) — Rotating the main layout axis.
- [`align-self`](align_self.md) — Overrides align-items for a single child item.
- [`align-content`](align_content.md) — Distributes multiple rows of flex items.
- [Flexbox (Concept) & `display: flex`](flex_parent.md) — Related concept: Flexbox (Concept) & `display: flex`.
- [`display: flex`](display_flex.md) — Related concept: `display: flex`.

---

## 8. Key Takeaways
- `align-items` aligns elements along the **Cross Axis** (usually vertical).
- The default is `stretch`, which forces children to fill the height of the container.
- Using `justify-content: center;` combined with `align-items: center;` is the modern, definitive way to perfectly center an element on a screen.
