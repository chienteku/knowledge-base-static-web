# `color` vs `background-color`

> **Level 3 — Typography & Colors**
> The fundamental CSS properties used to change the color of text and the color of the element's box.

---

## 1. Prerequisites
- [The Box Model (Concept)](../level_02/box_model.md) — It helps to understand that `background-color` fills the Padding and Content layers of the box.
- [Color Values (hex, rgb, rgba, hsl, named)](color_values.md) — The formats used to declare CSS colors.

---

## 2. Term Category

**Styling Property (Universal Browser Support)**: `color` vs `background-color` is a fundamental concept in this technology stack. **Level 3 — Typography & Colors**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
One of the most basic tasks in visual design is changing colors. You need to color the text itself (the foreground) and the box containing the text (the background). 
The W3C created the `color` property specifically to change the ink color of the text. They created the `background-color` property to change the paint color of the box behind the text. 
Both properties accept colors in several formats:
- **Keywords**: Built-in names like `red`, `blue`, `transparent`.
- **HEX codes**: A 6-character code widely used by designers (e.g., `#FF0000` for red).
- **RGB/RGBA**: Red, Green, Blue values, with an optional 'A' for Alpha (transparency).

### (2) Reality Metaphor
Imagine you are writing a sign on a piece of poster board.
The **`background-color`** is the color of the poster board itself (e.g., a yellow piece of cardboard).
The **`color`** is the color of the Sharpie marker you use to write the words on the board (e.g., black ink).

### (3) Code Examples

#### Mixing Color Formats
```css
.alert-box {
  /* Using a keyword for the text color */
  color: white;
  
  /* Using a HEX code for the background */
  background-color: #ff4444; 
}

.transparent-box {
  /* Using RGBA for a 50% transparent black background */
  background-color: rgba(0, 0, 0, 0.5);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming `color` means background color

**The mistake:** Writing `color: blue;` and expecting the entire `<div>` to become a blue square.

**Why it's wrong:** The `color` property *only* affects typography (text). It is essentially a shorthand for "text-color". If there is no text inside your `<div>`, you will see absolutely no change on the screen. To make a colored square, you must use `background-color`.

### Mistake 2: Poor Contrast (Accessibility Failure)

**The mistake:** Setting `color: #555555` (dark gray) on a `background-color: #333333` (darker gray).

**Why it's wrong:** While it might look "sleek" to a designer with a high-end 4K monitor, users with visual impairments or people reading their phones in bright sunlight will not be able to read the text. The W3C accessibility guidelines (WCAG) require a strong contrast ratio between text and its background.

---



### Mistake 3: Confusing `color` (Text Foreground Color) with `background-color`

**The mistake:** Writing `div { color: red; }` expecting to fill a rectangular container background red.

**Why it's wrong:** `color` sets FOREGROUND text color only. `background-color` fills the element's rectangular box container background.

*Incorrect:*
```css
button { color: blue; } /* ❌ Sets text blue, NOT button background! */
```

*Fix:*
```css
button { background-color: blue; color: white; }
```

### Mistake 4: Setting Dark Text on Dark Backgrounds (WCAG Accessibility Contrast Failure)

**The mistake:** Setting `background-color: #222; color: #555;`.

**Why it's wrong:** Low contrast ratios between foreground text color and container background fail WCAG AA accessibility contrast audits (4.5:1 ratio requirement).

*Incorrect:*
```css
div { background-color: #222; color: #444; } /* ❌ Low contrast ratio! Unreadable! */
```

*Fix:*
```css
div { background-color: #222; color: #fff; } /* High contrast ratio */
```

## 5. Practice Exercises

### Exercise 1: Distinguishing Foreground Text Color from Container Background

**Scenario:** An author styles a notification alert card explicitly separating text `color` from container `background-color`.

**Requirements:**
1. Set `color: #1e293b` for foreground text.
2. Set `background-color: #f1f5f9` for surface background.
3. Set `border-color`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .alert-card {
>   /* Foreground Properties */
>   color: #0f172a;               /* Controls text, icons, and text decorations */
>
>   /* Surface / Background Properties */
>   background-color: #f8fafc;    /* Controls container background fill */
>   border: 1px solid #cbd5e1;
>   padding: 1.25rem;
>   border-radius: 0.5rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **`color` Property Role**: Controls foreground text color, vector SVGs, and inline text decoration elements.
> 2. **`background-color` Property Role**: Controls the background fill color of the element's box model content and padding layers.
> 3. **Inheritance Difference**: `color` inherits naturally to child elements; `background-color` does NOT inherit (defaults to `transparent`).
> 
---

### Exercise 2: Dark Mode Theme Switching with High-Contrast Color Overrides

**Scenario:** Applies dark theme overrides swapping `color` and `background-color`.

**Requirements:**
1. Create `[data-theme="dark"]` theme ruleset.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Light Theme Baseline */
> .app-surface {
>   background-color: #ffffff;
>   color: #1e293b;
> }
>
> /* Dark Theme Overrides */
> [data-theme="dark"] .app-surface {
>   background-color: #0f172a;
>   color: #f8fafc;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Theme Swapping Pattern**: Inverting `background-color` and `color` establishes seamless light/dark mode transitions.
> 2. **Data Attribute Selector**: Using `[data-theme="dark"]` applies theme rules globally without altering HTML component structure.
> 3. **WCAG Contrast Parity**: Ensure dark mode color pairs meet 4.5:1 contrast rules as strictly as light mode.
> 
---

### Exercise 3: Transparent Background Overlay Cards with Explicit Contrast

**Scenario:** Styles a card with semi-transparent background while keeping text fully opaque.

**Requirements:**
1. Apply `background-color: rgba(255, 255, 255, 0.9)`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .overlay-card {
>   background-color: rgb(255 255 255 / 0.9);   /* Opaque card surface */
>   color: #0f172a;                               /* 100% opaque dark text */
>   padding: 1.5rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Background Alpha vs Opacity**: Using alpha `background-color` keeps text fully opaque; setting CSS `opacity` on container makes text transparent too!
> 2. **Legibility Safeguard**: Prevents text content from becoming faint or unreadable over background imagery.
> 3. **Clean UI Layering**: Maintains sharp typography readability over dynamic backdrops.
## 6. Related Terms
- [Color Values (hex, rgb, rgba, hsl, named)](color_values.md) — Color notation formats.
- [`background` Shorthand & `background-image`](background_shorthand.md) — Advanced background styling.
- [`opacity`](../level_09/opacity.md) — Another way to adjust the transparency of colors.
- [`background-size` (cover / contain)](../level_09/background_size.md) — Related concept: `background-size` (cover / contain).
- [`linear-gradient` & `radial-gradient` (Gradients)](../level_09/gradients.md) — Related concept: `linear-gradient` & `radial-gradient` (Gradients).

---

## 7. Key Takeaways
- `color` changes the text (foreground).
- `background-color` changes the box (background).
- You can use Keywords, HEX codes (e.g., `#ffffff`), or RGB/RGBA values.
- Always ensure high contrast between your `color` and `background-color` for accessibility!
