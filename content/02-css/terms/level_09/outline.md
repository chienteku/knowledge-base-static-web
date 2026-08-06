# `outline`

> **Level 9 — Visual Effects & State**
> A line drawn *outside* the element's border, primarily used by browsers to show which element is currently selected (focused) via keyboard navigation.

---

## 1. Prerequisites
- [Border](../level_02/border.md) — You must understand Borders to understand how Outlines are different.

---

## 2. Term Category
- **Accessibility / Aesthetic Property**

---

## 3. Environment Context
- **Universal Modern Standard**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
We already have `border` to draw lines around elements. Why do we need `outline`?
Imagine a user who is physically unable to use a mouse. They navigate your website by hitting the `Tab` key on their keyboard to jump from button to button. How do they know which button is currently selected?
Browsers automatically draw a bright blue ring around the currently focused element. This ring is the **`outline`**. 
The W3C created `outline` as a separate property from `border` for one critical reason: **Outlines do not take up physical space in the Box Model.** If you add a 5px `border` to a button, the button physically grows by 10px, shifting the entire layout of the page. If you add a 5px `outline`, it just draws a glowing ring *over* the background, leaving the layout perfectly intact.

### (2) Reality Metaphor
**Border**: Building a physical wooden fence around your house. It takes up physical space in your yard.
**Outline**: Shining a bright laser pointer in a ring around your house. It marks the boundary visually, but you can walk right through it, and it doesn't take up any physical space.

### (3) Code Examples

#### The Custom Focus Ring
If your website is blue, the default browser blue outline might be invisible against your background! You can use the `outline` property to customize it for better accessibility.
```css
/* Target buttons ONLY when they are selected via the keyboard */
button:focus {
  /* Syntax is identical to border: Width | Style | Color */
  outline: 3px solid hotpink;
  
  /* Modern CSS addition: add a small gap between the button and the outline! */
  outline-offset: 2px;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: `outline: none;` (The Cardinal Sin of CSS)

**The mistake:** A junior developer thinks the default blue focus ring looks "ugly" when they click on a button. They write `button:focus { outline: none; }` to permanently delete it.

**Why it's wrong:** You just completely destroyed the accessibility of the website! Keyboard users can no longer see what they are tabbing to. They are flying blind. 
**Golden Rule:** NEVER use `outline: none;` unless you are actively replacing it with a custom `box-shadow` or a custom `border` that provides the exact same visual feedback for keyboard users!

---



### Mistake 2: Using `outline: none` to Remove Focus Rings Without Providing Custom Replacement Styles (Accessibility Failure)

**The mistake:** Writing `*:focus { outline: none; }` across a stylesheet.

**Why it's wrong:** Removing focus outlines leaves keyboard-only users unable to track focused inputs/buttons. Use `:focus-visible` to style focus outlines cleanly.

*Incorrect:*
```css
input:focus { outline: none; } /* ❌ Destroys accessibility focus indicator */
```

*Fix:*
```css
input:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}
```

### Mistake 3: Expecting `outline` to Add Space to Box-Model Layout Dimensions (Like `border`)

**The mistake:** Using `outline: 10px solid black` expecting it to push surrounding elements away.

**Why it's wrong:** `outline` is drawn OUTSIDE element box-model dimensions and does NOT take up layout space or affect element width/height calculation.

*Incorrect:*
```css
/* Expecting outline to increase element layout size */
```

*Fix:*
```css
/* Use border if layout space allocation is required; use outline for non-shifting focus rings */
```

## 6. Practice Exercises

### Exercise 1: Border vs Outline

**Problem:** You have a 100px wide box. You add a `10px solid black` Border. How wide is the box now? 
You remove the border, and add a `10px solid black` Outline instead. How wide is the box now?

**Expected output:**
> [!check]- Answer
> ```text
> With Border: The box is 120px wide (100 + 10 left + 10 right).
> With Outline: The box is still exactly 100px wide! The outline does not take up physical layout space.
> ```
> - Does a laser pointer take up physical space?
> 
---



### Exercise 2: Outline Offset Focus Ring Pattern

**Problem:** Write CSS applying 2px solid blue focus outline offset by 3px away from element border.

**Expected output:**
> [!check]- Answer
> ```text
> button:focus-visible { outline: 2px solid blue; outline-offset: 3px; }
> ```
> ```css
> button:focus-visible {
>   outline: 2px solid blue;
>   outline-offset: 3px;
> }
> ```
>
> **Explanation:** `outline-offset` pushes the outline ring outward away from element borders.
> 
---

### Exercise 3: Outline vs Border Comparison

**Problem:** List 2 primary differences between `outline` and `border`.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Outline does not consume box-model layout space
> 2. Outline surrounds all sides equally (no outline-left/top longhands)
> ```
> ```text
> 1. Outline does not consume box-model layout space
> 2. Outline surrounds all sides equally (no outline-left/top longhands)
> ```
>
> **Explanation:** Outlines are non-layout-shifting visual overlays.
> 
## 7. Related Terms
- [Border](../level_02/border.md) — The physical layout equivalent.
- [`:hover` & `:focus` (Pseudo-classes)](hover_focus.md) — The state where outlines are most commonly applied.
- [`cursor`](cursor.md) — Sizing hover states.

---

## 8. Key Takeaways
- `outline` is a visual ring drawn around an element.
- Unlike `border`, `outline` **does not take up space** in the Box Model.
- It is primarily used for **Accessibility** to show keyboard users which element is focused.
- **NEVER** write `outline: none;` unless you provide an alternative visual indicator!
