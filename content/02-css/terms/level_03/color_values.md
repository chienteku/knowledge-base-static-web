# Color Values (hex, rgb, rgba, hsl, named)

> **Level 3 — Typography & Colors**
> The different notation systems used to define colors in CSS: named keywords, hexadecimal codes (`#ff0000`), RGB/RGBA channels, and HSL/HSLA values.

---

## 1. Prerequisites
- [Ruleset (Declaration, Property, Value)](../level_01/ruleset.md) — Properties accept color value targets.

---

## 2. Term Category
- **Core Concept**

---

## 3. Environment Context
- **Universal Browser Support** (Parsed natively. Browsers convert all color formats into a unified internal RGB color space before drawing pixels).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Color is one of the most powerful tools in web design. Sighted users rely on color to read text, identify brand elements, and recognize call-to-action buttons.

In the earliest days of CSS, you could only define colors using basic named keywords (like `red`, `blue`, `black`). 

However, computer screens can display over **16 million colors**. To give designers the precision to pick any of these shades and control their transparency (opacity), the W3C defined multiple mathematical color formats in CSS.

---

### (2) The CSS Color Formats

#### 1. Named Colors (Keywords)
Simple English names for colors. CSS supports **140 standard named colors** (like `tomato`, `crimson`, `transparent`, or `bisque`).
-   *Best Use:* Quick testing and default fallbacks.

#### 2. Hexadecimal Codes (HEX)
A base-16 number code starting with a hashtag (**`#`**). It represents the intensities of Red, Green, and Blue (**`#RRGGBB`**).
-   Each color channel ranges from `00` (fully dark) to `ff` (maximum brightness).
-   Example: `#ff0000` (Red is max, green and blue are zero = pure Red).
-   Short notation: If character pairs match, you can compress it to three digits: `#ff3300` becomes `#f30`.
-   Transparency: You can add an optional fourth pair for alpha transparency (**`#RRGGBBAA`**).
-   *Best Use:* The industry standard for copy-pasting colors from design programs (like Figma).

#### 3. RGB & RGBA Channels
Defines colors by specifying Red, Green, and Blue channel values numerically from **`0` to `255`**:
-   `rgb(255, 0, 0)` is pure red.
-   **`rgba()`** adds an Alpha transparency value from **`0.0`** (fully transparent) to **`1.0`** (fully opaque).
-   *Modern format:* CSS now allows space-separated arguments: `rgb(255 0 0 / 0.5)` for 50% opacity red.

#### 4. HSL & HSLA (Human-Friendly Color System)
Represents color using properties that humans find intuitive to adjust:
-   **Hue (H):** The angle on the color wheel from **`0` to `360`** degrees. `0` = red, `120` = green, `240` = blue.
-   **Saturation (S):** The intensity of the color from **`0%`** (completely gray) to **`100%`** (vibrant color).
-   **Lightness (L):** The brightness of the color from **`0%`** (black) to **`50%`** (normal brightness) to **`100%`** (white).
-   *Modern format:* `hsl(240 100% 50% / 0.8)` for 80% opacity blue.
-   *Best Use:* Great for programmatically adjusting brightness (e.g. creating button hover states by just lowering the Lightness percentage).

---

### (3) Code Examples

#### Short Snippet
Different formats for the same red color:

```css
.card {
  color: red;                       /* Named */
  color: #ff0000;                   /* HEX */
  color: rgb(255, 0, 0);            /* RGB */
  color: rgba(255, 0, 0, 0.5);      /* RGBA (50% opaque) */
  color: hsl(0, 100%, 50%);         /* HSL */
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Color Formats Showcase</title>
  <style>
    body {
      font-family: sans-serif;
      background-color: #f0f2f5; /* Light gray HEX */
    }

    .box {
      width: 200px;
      padding: 20px;
      margin: 10px;
      float: left;
      text-align: center;
      font-weight: bold;
    }

    .named {
      background-color: steelblue;
      color: white;
    }

    .hex {
      /* Max Red (ff), medium Green (8b), zero Blue (00) = dark orange */
      background-color: #ff8b00; 
      color: #000000;
    }

    .rgb {
      /* Mix of medium red and green, no blue = olive gold */
      background-color: rgb(150 150 0 / 0.7); /* Modern space syntax with 70% opacity */
      color: rgb(255 255 255);
    }

    .hsl {
      /* Hue 120 (Green), 80% Saturation, 30% Lightness (darker forest green) */
      background-color: hsl(120, 80%, 30%); 
      color: hsl(120, 100%, 95%); /* Very light green text */
    }
  </style>
</head>
<body>

  <div class="box named">Named (steelblue)</div>
  <div class="box hex">HEX (#ff8b00)</div>
  <div class="box rgb">RGB (Modern space-opacity syntax)</div>
  <div class="box hsl">HSL (Forest Green)</div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `#` symbol in Hex codes

**The mistake:** Declaring a HEX code color by writing only the alphanumeric string:

```css
/* BAD: Browser will fail to parse this! */
.title {
  color: ff8b00; 
}
```

**Why it's wrong:** Without the `#` prefix, the browser parses the value as a named keyword. Since there is no named keyword called "ff8b00", the browser discards the line entirely, falling back to default black text.

---

### Mistake 2: Forgetting the `%` symbol in HSL saturation and lightness values

**The mistake:** Writing the HSL values as raw numbers:

```css
/* BAD: Invalid syntax! */
.alert {
  background-color: hsl(0, 100, 50); 
}
```

**Why it's wrong:** The CSS specifications dictate that saturation and lightness values in the HSL/HSLA functions **must** be written as percentages (`100%` and `50%`), not unitless integers. Writing them without the `%` symbol will cause the rule to break.

---



### Mistake 3: Confusing `rgba()` and `hsla()` vs Modern `rgb()` and `hsl()` Space-Separated Syntax

**The mistake:** Writing `rgb(255, 0, 0, 0.5)` using legacy comma format or `rgba()` in CSS Color Module Level 4.

**Why it's wrong:** Modern CSS Color Level 4 standardizes on space-separated `rgb(255 0 0 / 50%)` and `hsl(0 100% 50% / 0.5)` syntax, deprecating legacy `rgba()` function names.

*Incorrect:*
```css
div { color: rgba(255, 0, 0, 0.5); } /* Legacy comma syntax */
```

*Fix:*
```css
div { color: rgb(255 0 0 / 50%); } /* Modern space-separated syntax */
```

### Mistake 4: Using Invalid Hexadecimal Codes (Missing `#` or Wrong Character Length)

**The mistake:** Writing `color: ff0000;` or `color: #ff00;` for 6-digit hex colors.

**Why it's wrong:** Hex color codes MUST start with `#` and contain valid length digits (3, 4, 6, or 8 characters). Missing `#` causes property invalidation.

*Incorrect:*
```css
div { color: ff0000; } /* ❌ Missing '#' symbol! Property ignored! */
```

*Fix:*
```css
div { color: #ff0000; } /* Valid 6-digit hex color */
```

## 6. Practice Exercises

### Exercise 1: Format Translation

**Problem:** Convert the following RGB color to its exact equivalent HEX code:
`rgb(255, 255, 0)`

**Expected output:**
> [!check]- Answer
> ```text
> #ffff00 (Red is max/ff, Green is max/ff, Blue is zero/00). Can be shortened to #ff0.
> ```
> - Translate the number 255 into hexadecimal base-16 (it becomes `ff`).
> - Translate 0 into hexadecimal (it becomes `00`).
> 
---



### Exercise 2: Modern Color Syntax Conversions

**Problem:** Write red color with 50% transparency using:
1. 8-digit Hex (`#ff000080`)
2. Modern `rgb()` space-separated syntax (`rgb(255 0 0 / 0.5)`)

**Expected output:**
> [!check]- Answer
> ```text
> 1. #ff000080
> 2. rgb(255 0 0 / 0.5)
> ```
> ```css
> .color-hex { color: #ff000080; }
> .color-rgb { color: rgb(255 0 0 / 0.5); }
> ```
>
> **Explanation:** Modern CSS supports 8-digit hex (#RRGGBBAA) and space-separated `/ alpha` notation.
> 
---

### Exercise 3: currentColor Keyword Function

**Problem:** What value does the `currentColor` CSS keyword resolve to?

**Expected output:**
> [!check]- Answer
> ```text
> Resolves to the computed value of the element's current CSS `color` property.
> ```
> ```css
> button {
>   color: blue;
>   border: 2px solid currentColor; /* Border uses blue color */
> }
> ```
>
> **Explanation:** `currentColor` inherits computed text color for borders and SVG fills.
> 
## 7. Related Terms
- [`color` vs `background-color`](color_vs_background.md) — The parent properties using these colors.
- [`opacity`](../level_09/opacity.md) — The alternative way to manage element transparency.

---

## 8. Key Takeaways
- CSS supports four primary color systems: Named, HEX, RGB, and HSL.
- HEX codes are base-16 channels (`#RRGGBB`) widely used in design packages.
- Always include the `#` prefix for HEX codes.
- HSL represents color using Hue (angle 0-360), Saturation (%), and Lightness (%).
- HSL saturation and lightness values **require** the `%` symbol.
- Both HSL and RGB support alpha channels (transparency) natively.
