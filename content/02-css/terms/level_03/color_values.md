# Color Values (hex, rgb, rgba, hsl, named)

> **Level 3 — Typography & Colors**
> The different notation systems used to define colors in CSS: named keywords, hexadecimal codes (`#ff0000`), RGB/RGBA channels, and HSL/HSLA values.

---

## 1. Prerequisites
- [Ruleset (Declaration, Property, Value)](../level_01/ruleset.md) — Properties accept color value targets.

---

## 2. Term Category

**Core Concept (Universal Browser Support .)**: Color Values (hex, rgb, rgba, hsl, named) is a fundamental concept in this technology stack. **Level 3 — Typography & Colors**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Defining HSL and OKLCH Accessible Color Palettes

**Scenario:** An engineer defines system color tokens using modern HSL and OKLCH color functional notation.

**Requirements:**
1. Define primary color using `hsl(221, 83%, 53%)`.
2. Define accent color using `oklch(0.6 0.25 250)`.
3. Define background color.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> :root {
>   /* HSL Color Function: Hue (0-360), Saturation (0-100%), Lightness (0-100%) */
>   --color-primary: hsl(221, 83%, 53%);
>   --color-primary-dark: hsl(221, 83%, 40%);
>
>   /* OKLCH Color Function: Lightness (0-1), Chroma (0-0.4), Hue (0-360) */
>   --color-accent: oklch(0.65 0.2 140);
>
>   --color-surface: #ffffff;
> }
>
> .btn-primary {
>   background-color: var(--color-primary);
>   color: #ffffff;
> }
>
> .btn-primary:hover {
>   background-color: var(--color-primary-dark);
> }
> ```
>
> #### Technical Explanation
>
> 1. **HSL Color Model**: HSL (Hue, Saturation, Lightness) makes creating color shades intuitive: tweaking Lightness creates dark/light hover variants easily.
> 2. **OKLCH Color Space**: OKLCH is a modern wide-gamut perceptual color space providing uniform human brightness perceptions across hues.
> 3. **Design System Tokens**: Storing HSL/OKLCH color values in CSS custom properties enables instant global theme updates.
> 
---

### Exercise 2: Modern Semi-Transparent Alpha Color Syntax

**Scenario:** Applies modern CSS Color Module Level 4 slash syntax for semi-transparent overlay backgrounds.

**Requirements:**
1. Apply `rgb(15 23 42 / 0.8)` or `hsl(210 100% 50% / 0.5)` background.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .modal-overlay {
>   /* Modern Space-Separated Syntax with Alpha Slash */
>   background-color: rgb(15 23 42 / 0.75);     /* 75% opacity dark backdrop */
>   backdrop-filter: blur(4px);
> }
> ```
>
> #### Technical Explanation
>
> 1. **Modern Alpha Slash Syntax**: Modern CSS uses space separation with a slash `/` for alpha transparency (e.g. `rgb(15 23 42 / 0.8)`).
> 2. **Replacing Legacy `rgba()`**: Replaces legacy comma-separated `rgba(15, 23, 42, 0.8)` syntax cleanly.
> 3. **Backdrop Blur Integration**: Combines semi-transparent alpha colors with `backdrop-filter` for modern glassmorphism UI.
> 
---

### Exercise 3: Contrast Ratio Verification for WCAG 2.1 AA Compliance

**Scenario:** Verifies color combinations meet minimum 4.5:1 text contrast ratios.

**Requirements:**
1. Pair `#0f172a` text with `#ffffff` background.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .accessible-card {
>   background-color: #ffffff;
>   color: #0f172a;               /* High-contrast dark slate text (15.5:1 ratio!) */
> }
> ```
>
> #### Technical Explanation
>
> 1. **WCAG 2.1 SC 1.4.3 (Contrast)**: Standard body text MUST maintain a minimum color contrast ratio of 4.5:1 against its background.
> 2. **Large Text Exception**: Large text (18pt / 24px or bold 14pt / 19px) requires a minimum 3:1 contrast ratio.
> 3. **Colorblind Accessibility**: Never rely solely on color to convey state; pair color choices with text labels or icons.
## 6. Related Terms
- [`color` vs `background-color`](color_vs_background.md) — The parent properties using these colors.
- [`opacity`](../level_09/opacity.md) — The alternative way to manage element transparency.

---

## 7. Key Takeaways
- CSS supports four primary color systems: Named, HEX, RGB, and HSL.
- HEX codes are base-16 channels (`#RRGGBB`) widely used in design packages.
- Always include the `#` prefix for HEX codes.
- HSL represents color using Hue (angle 0-360), Saturation (%), and Lightness (%).
- HSL saturation and lightness values **require** the `%` symbol.
- Both HSL and RGB support alpha channels (transparency) natively.
