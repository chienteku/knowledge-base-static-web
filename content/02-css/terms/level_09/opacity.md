# `opacity`

> **Level 9 — Visual Effects & State**
> The property that makes an entire HTML element (and everything inside it) partially or completely transparent.

---

## 1. Prerequisites
- [The Tree Structure](../../../01-html/terms/level_09/tree_structure.md) — Because `opacity` aggressively affects the Parent and all of its Children!

---

## 2. Term Category
- **Aesthetic / Visual Effect Property**

---

## 3. Environment Context
- **Universal Modern Standard**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes you want an element to look like glass, allowing the background image behind it to bleed through. Other times, you want to visually "disable" a button, making it look faded out so the user knows they can't click it yet.
The W3C created **`opacity`** to control the physical transparency of an element. 

### (2) The Values
`opacity` takes a simple decimal number between `0.0` and `1.0`.
- **`1.0` (Default)**: Completely solid. 100% opaque.
- **`0.5`**: Exactly 50% see-through.
- **`0.0`**: Completely invisible (but it still physically takes up space on the page!).

### (3) Reality Metaphor
Imagine a solid brick wall (`opacity: 1`).
Now replace the bricks with frosted shower glass (`opacity: 0.5`). You can still see the wall is there, but you can also see the blurry colors of whatever is behind it.
Now replace the frosted glass with a perfectly clean, polished window (`opacity: 0`). You can't see the glass at all, but if you try to walk through it, you still hit a wall!

### (4) Code Examples

#### The Disabled Button Effect
```css
.submit-btn:disabled {
  /* Fades the button out by 50% so it looks inactive */
  opacity: 0.5;
  
  /* Pairs well with the not-allowed cursor! */
  cursor: not-allowed; 
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Not realizing `opacity` affects the children too

**The mistake:** You have a `<div>` containing a paragraph of text. You want the *background* of the `<div>` to be 50% see-through, so you apply `opacity: 0.5;` to the `<div>`.

**Why it's wrong:** `opacity` is an aggressive, destructive property. If you put `opacity: 0.5` on a Parent, it makes the Parent's background 50% transparent, BUT it also forces every single Child inside that container to become 50% transparent! The text becomes faded and unreadable. 
Furthermore, you cannot "fix" the child by giving it `opacity: 1`. The child is trapped in the faded reality of its parent.

**The Solution:** If you *only* want the background color to be see-through, DO NOT use the `opacity` property! Instead, change the `background-color` to an `rgba()` value: `background-color: rgba(255, 0, 0, 0.5);`. This makes the background transparent while keeping the text completely solid!

---



### Mistake 2: Using `opacity` on a Parent Container Expecting Child Text to Remain Fully Opaque

**The mistake:** Setting `opacity: 0.5` on a card container intending to make only the background semi-transparent.

**Why it's wrong:** `opacity` applies transparency to the ENTIRE element box AND ALL ITS CHILDREN recursively! Child text becomes 50% transparent. Use `rgba()` or `rgb(... / alpha)` background colors.

*Incorrect:*
```css
.card { opacity: 0.5; } /* ❌ Child text becomes 50% transparent and hard to read! */
```

*Fix:*
```css
.card {
  background-color: rgb(0 0 0 / 50%); /* Background only is semi-transparent */
  color: #ffffff; /* Child text remains 100% opaque */
}
```

### Mistake 3: Expecting `opacity: 0` Elements to Block Pointer Clicks and Tab Navigation

**The mistake:** Hiding a button using `opacity: 0` expecting it to be unclickable.

**Why it's wrong:** Elements with `opacity: 0` are invisible visually, but REMAIN fully interactive in the DOM layout, accepting pointer clicks and keyboard Tab focus. Combine with `pointer-events: none` or `visibility: hidden`.

*Incorrect:*
```css
.btn-hidden { opacity: 0; } /* ❌ Still accepts clicks and keyboard tab focus! */
```

*Fix:*
```css
.btn-hidden {
  opacity: 0;
  visibility: hidden; /* Prevents clicks and keyboard focus */
}
```

## 6. Practice Exercises

### Exercise 1: Invisible vs Gone

**Problem:** You apply `opacity: 0;` to a giant image in the middle of a paragraph of text. The image becomes completely invisible. Does the text slide up to fill the empty space where the image used to be?

**Expected output:**
> [!check]- Answer
> ```text
> No! `opacity: 0` just makes the element perfectly clear (like a clean window). The physical box still exists, and it still pushes the text out of the way. If you want the element to actually disappear and give its space back, you must use `display: none;`.
> ```
> - A perfectly clean glass door is invisible, but can you walk through it?
> 
---



### Exercise 2: Smooth Opacity Transition Pattern

**Problem:** Write CSS fading in `.tooltip` from `opacity: 0` to `opacity: 1` over 0.3 seconds on hover.

**Expected output:**
> [!check]- Answer
> ```text
> .tooltip { opacity: 0; transition: opacity 0.3s; } .container:hover .tooltip { opacity: 1; }
> ```
> ```css
> .tooltip {
>   opacity: 0;
>   transition: opacity 0.3s;
> }
> .container:hover .tooltip {
>   opacity: 1;
> }
> ```
>
> **Explanation:** `opacity` transitions execute smoothly on GPU compositor layers.
> 
---

### Exercise 3: Opacity vs Alpha Channel Color Difference

**Problem:** Explain difference between `opacity: 0.5` vs `background-color: rgb(0 0 0 / 0.5)`.

**Expected output:**
> [!check]- Answer
> ```text
> opacity affects the element and ALL child elements recursively; rgb alpha affects ONLY the background color layer.
> ```
> ```text
> opacity affects the element and ALL child elements recursively; rgb alpha affects ONLY the background color layer.
> ```
>
> **Explanation:** Alpha channel colors isolate transparency to a specific property.
> 
## 7. Related Terms
- [`color` vs `background-color`](../level_03/color_vs_background.md) — The much safer alternative if you only want to fade the background color, not the children.
- [`display: block` vs `inline` vs `inline-block`](../level_04/display.md) — Used when you want an element to be completely removed from the layout.
- [`filter`](filter.md) — Sizing visual filters.
- [`backdrop-filter`](backdrop_filter.md) — Blurring backgrounds behind transparent containers.
- [Color Values (hex, rgb, rgba, hsl, named)](../level_03/color_values.md) — Related concept: Color Values (hex, rgb, rgba, hsl, named).
- [`display: none` vs `visibility: hidden`](../level_04/display_none_vs_visibility.md) — Related concept: `display: none` vs `visibility: hidden`.
- [Stacking Context](../level_04/stacking_context.md) — Related concept: Stacking Context.

---

## 8. Key Takeaways
- `opacity` ranges from `0` (invisible) to `1` (solid).
- It fades the element AND all of its children. (You cannot override this on the child).
- If you only want a translucent background, use `rgba()` colors instead!
- `opacity: 0` makes an element invisible, but it still physically takes up space in the layout.
