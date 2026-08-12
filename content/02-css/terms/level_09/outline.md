# `outline`

> **Level 9 — Visual Effects & State**
> A line drawn *outside* the element's border, primarily used by browsers to show which element is currently selected (focused) via keyboard navigation.

---

## 1. Prerequisites
- [Border](../level_02/border.md) — You must understand Borders to understand how Outlines are different.

---

## 2. Term Category

**Accessibility / Aesthetic Property (Universal Modern Standard)**: `outline` is a fundamental concept in this technology stack. **Level 9 — Visual Effects & State**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: High-Contrast Accessibility Focus Indicator using outline

**Scenario:** An author configures custom high-contrast focus rings using `outline` and `outline-offset` for keyboard users.

**Requirements:**
1. Apply `outline: 3px solid #2563eb`.
2. Apply `outline-offset: 2px`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .accessible-link:focus-visible {
>   outline: 3px solid #2563eb;   /* 3px high-contrast blue focus ring */
>   outline-offset: 2px;          /* Adds 2px whitespace gap between text and ring */
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `outline` Property**: Draws a line around the OUTSIDE of an element's border box without taking up layout space.
> 2. **No Layout Shift (Reflow)**: Unlike `border`, `outline` does NOT affect element dimensions or trigger page reflows; it floats over adjacent elements.
> 3. **The `outline-offset` Property**: Adds whitespace separation between the element's border edge and the focus outline ring.
> 
---

### Exercise 2: Explaining Why outline: none without Replacement Breaks Accessibility

**Scenario:** Demonstrates why stripping outlines breaks keyboard accessibility and how to fix it.

**Requirements:**
1. Show accessibility danger of `outline: none`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* ❌ ACCESSIBILITY DISASTER: Removes focus ring; keyboard users cannot navigate! */
> /* a:focus { outline: none; } */
>
> /* ✅ ACCESSIBLE PATTERN: Custom focus ring on focus-visible! */
> a:focus-visible {
>   outline: 3px solid #2563eb;
>   outline-offset: 2px;
> }
> ```
>
> #### Technical Explanation
>
> 1. **WCAG 2.1 SC 2.4.7 Violation**: Removing focus outlines (`outline: 0`) makes web pages completely unusable for keyboard-only users.
> 2. **Focus Ring Visibility**: Keyboard users rely on focus rings to see where their cursor is positioned on the page.
> 3. **Modern Fix**: Use `:focus-visible` to hide mouse rings while preserving keyboard focus indicators.
> 
---

### Exercise 3: Outlines vs Borders: Zero-Layout-Shift Boundary Outlines

**Scenario:** Uses `outline` for debug borders or hover highlights to prevent layout jitter.

**Requirements:**
1. Apply `outline: 2px solid #2563eb` on hover instead of border.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .card-hover-ring:hover {
>   /* Outline draws outside box model without shifting layout math! */
>   outline: 2px solid #2563eb;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Zero Layout Shift**: `outline` does not alter box-model dimensions, preventing hover jitter associated with adding `border`.
> 2. **Overlapping Behavior**: Outlines overlap adjacent elements rather than pushing them away.
> 3. **DevTools Debugging Tool**: `outline: 1px solid red` is the gold standard for inspecting DOM layout overflows.
## 6. Related Terms
- [Border](../level_02/border.md) — The physical layout equivalent.
- [`:hover` & `:focus` (Pseudo-classes)](hover_focus.md) — The state where outlines are most commonly applied.
- [`cursor`](cursor.md) — Sizing hover states.

---

## 7. Key Takeaways
- `outline` is a visual ring drawn around an element.
- Unlike `border`, `outline` **does not take up space** in the Box Model.
- It is primarily used for **Accessibility** to show keyboard users which element is focused.
- **NEVER** write `outline: none;` unless you provide an alternative visual indicator!
