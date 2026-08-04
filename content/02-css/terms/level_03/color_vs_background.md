# `color` vs `background-color`

> **Level 3 — Typography & Colors**
> The fundamental CSS properties used to change the color of text and the color of the element's box.

---

## 1. Prerequisites
- [The Box Model](../level_02/box_model.md) — It helps to understand that `background-color` fills the Padding and Content layers of the box.
- [Color Values (hex, rgb, rgba, hsl, named)](../level_03/color_values.md) — The formats used to declare CSS colors.

---

## 2. Term Category
- **Styling Property**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Finding the Bug

**Problem:** You want a black button with white text. What is wrong with this code?
```css
.btn {
  background-color: white;
  color: black;
}
```

**Expected output:**
> [!check]- Answer
> ```text
> The colors are swapped! This will create a white button with black text. It should be `background-color: black;` and `color: white;`.
> ```
> - Which property represents the Sharpie marker, and which represents the cardboard?

---



### Exercise 2: Dark Mode Toggle Card Styling

**Problem:** Write CSS for `.card-dark` with dark gray background (`#1e1e1e`), white text (`#ffffff`), and subtle gray border (`#333333`).

**Expected output:**
> [!check]- Answer
> ```text
> .card-dark { background-color: #1e1e1e; color: #ffffff; border: 1px solid #333333; }
> ```
> ```css
> .card-dark {
>   background-color: #1e1e1e;
>   color: #ffffff;
>   border: 1px solid #333333;
> }
> ```
>
> **Explanation:** Card containers combine background color, text color, and border styling.

---

### Exercise 3: Transparent Background Reset

**Problem:** Which keyword value resets an element's `background-color` to completely see-through?

**Expected output:**
> [!check]- Answer
> ```text
> background-color: transparent;
> ```
> ```css
> button {
>   background-color: transparent;
> }
> ```
>
> **Explanation:** `transparent` removes solid background fills.

## 7. Related Terms
- [Color Values (hex, rgb, rgba, hsl, named)](../level_03/color_values.md) — Color notation formats.
- [`background` Shorthand & `background-image`](../level_03/background_shorthand.md) — Advanced background styling.
- [`opacity`](../level_09/opacity.md) — Another way to adjust the transparency of colors.

---

## 8. Key Takeaways
- `color` changes the text (foreground).
- `background-color` changes the box (background).
- You can use Keywords, HEX codes (e.g., `#ffffff`), or RGB/RGBA values.
- Always ensure high contrast between your `color` and `background-color` for accessibility!
