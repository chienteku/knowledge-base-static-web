# `background` Shorthand & `background-image`

> **Level 3 — Typography & Colors**
> Visual styling properties used to apply background images, configure their scale and repeating layout parameters, and condense them into a unified, single-line `background` shorthand declaration.

---

## 1. Prerequisites
- [`color` vs `background-color`](color_vs_background.md) — Knowing how background colors interact with text.
- [The Box Model (Concept)](../level_02/box_model.md) — Background shapes are defined by the elements' box layouts.

---

## 2. Term Category

**Visual Effect / Shorthand Property (Universal Browser Support .)**: `background` Shorthand & `background-image` is a fundamental concept in this technology stack. **Level 3 — Typography & Colors**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
A modern web page needs more than simple solid colors behind text. Designers want to display hero banners, textured graphic backgrounds, or custom patterns.

To support this, the W3C defined the **`background-image`** property. 

However, loading an image triggers multiple layout questions for the browser:
-   If the image is smaller than the box, should it stretch, or should it tile (repeat) like kitchen wallpaper?
-   Where should the image start? (Centered? Clamped to the top-left?).

To answer these, CSS provides several specific background properties. Writing them all separately leads to bloated stylesheets, so CSS also provides the **`background` shorthand** to combine them all into a single, clean declaration.

---

### (2) The Background Property Family

#### 1. `background-image`
Loads an image file using the **`url()`** function:
```css
background-image: url('images/hero-banner.jpg');
```
*(Note: CSS Gradients are also classified as background-images).*

#### 2. `background-repeat`
Controls what happens if the image is smaller than the box:
-   `repeat` (Default): Tiles the image horizontally and vertically.
-   `no-repeat`: Displays the image only once.
-   `repeat-x` / `repeat-y`: Tiles the image only along one axis.

#### 3. `background-position`
Sets the starting point of the image using keywords (`center`, `top`, `bottom`, `left`, `right`) or percentages/pixels:
```css
background-position: top center; /* Centered horizontally, aligned to top edge */
```

---

### (3) The `background` Shorthand Syntax
The shorthand allows combining properties in a single line. The standard order is:

`background: [color] [image] [position]/[size] [repeat] [attachment];`

> [!IMPORTANT]
> **The Size Slash Rule:**
> If you want to include the background's scale size (like `cover` or `contain`) in the shorthand, it **must** be written immediately after the position, separated by a forward slash (`/`): e.g., **`center/cover`**. 
> Omitting the slash will cause the browser to fail to parse the rule.

---

### (4) Code Examples

#### Short Snippet
Centered background image cover:

```css
.hero-banner {
  /* color | image | position/size | repeat */
  background: #333 url('banner.jpg') center/cover no-repeat;
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Backgrounds Showcase</title>
  <style>
    /* 1. Card using separate longhand properties */
    .card-longhand {
      width: 300px;
      height: 200px;
      border: 2px solid #333;
      margin: 10px;
      float: left;
      
      background-color: lightgray;
      background-image: url('https://picsum.photos/300/200');
      background-repeat: no-repeat;
      background-position: center;
    }

    /* 2. Card using identical shorthand properties (compact and clean) */
    .card-shorthand {
      width: 300px;
      height: 200px;
      border: 2px solid #333;
      margin: 10px;
      float: left;
      
      /* lightgray color acts as a fallback while the image is downloading */
      background: lightgray url('https://picsum.photos/300/200') center/cover no-repeat;
    }
  </style>
</head>
<body>

  <div class="card-longhand"></div>
  <div class="card-shorthand"></div>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Leaving off the slash before `background-size` in shorthand

**The mistake:** Writing the size values without the dividing slash:

```css
/* BAD: Invalid syntax! Browser will discard the entire background rule */
.hero {
  background: url('bg.jpg') center cover no-repeat; 
}
```

**Why it's wrong:** The CSS parser cannot tell the difference between position coordinates and size values if they are written in a raw list. To resolve this ambiguity, the specification requires the size to sit immediately behind the position, separated by a `/`.

**Fix:**
```css
/* CORRECT */
.hero {
  background: url('bg.jpg') center/cover no-repeat;
}
```

---

### Mistake 2: The Shorthand Reset Trap
If you define `background-color: red;` on line 1, and then write `background: url('pattern.png');` on line 2, the shorthand resets the background color back to its default value `transparent`. The red background color is lost!

---



### Mistake 3: Syntax Error When Specifying `background-position` and `background-size` Together in Shorthand

**The mistake:** Writing `background: url('bg.jpg') center 100px 50px;`.

**Why it's wrong:** In `background` shorthand, `background-size` MUST be separated from `background-position` by a forward slash `/` (e.g. `center / cover` or `top left / 100px 50px`).

*Incorrect:*
```css
div { background: url('bg.png') center cover no-repeat; } /* ❌ Syntax error missing slash! */
```

*Fix:*
```css
div { background: url('bg.png') center / cover no-repeat; } /* Slash separates position / size */
```

### Mistake 4: Placing Background Color Below Image Layer in Shorthand Overwriting Layer Order

**The mistake:** Placing `background-color` ahead of multiple background image layers incorrectly.

**Why it's wrong:** `background-color` can ONLY be defined on the VERY LAST background layer specification in shorthand syntax.

*Incorrect:*
```css
div { background: red url('img1.png'), url('img2.png'); } /* ❌ Color must be on last layer */
```

*Fix:*
```css
div { background: url('img1.png'), url('img2.png') red; } /* Color on last layer */
```

## 5. Practice Exercises

### Exercise 1: Styling Hero Section Banner with background Shorthand

**Scenario:** An author styles a full-width hero section banner using the CSS `background` shorthand property.

**Requirements:**
1. Apply `background: url('hero.jpg') no-repeat center / cover #0f172a;`.
2. Include fallback solid color `#0f172a`.
3. Ensure background covers container bounds.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .hero-banner {
>   box-sizing: border-box;
>   min-height: 25rem;
>   padding: 4rem 2rem;
>   color: #ffffff;
>
>   /* Background Shorthand: color image repeat position / size */
>   background: #0f172a url("../images/hero.jpg") no-repeat center / cover;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `background` Shorthand Syntax**: Combines `background-color`, `background-image`, `background-repeat`, `background-position`, and `background-size` into a single declaration.
> 2. **Background Size Forward-Slash Requirement**: The `background-size` value (`cover`) MUST be written directly after `background-position` (`center`) separated by a forward slash `/`.
> 3. **Fallback Color Mandate**: Always specify a solid fallback background color (`#0f172a`) in case image assets fail to load on slow networks.
> 
---

### Exercise 2: Layering Linear Gradient Overlay on Background Image

**Scenario:** Layers a semi-transparent dark gradient overlay on top of a background image for text legibility.

**Requirements:**
1. Combine `linear-gradient` and `url(...)` in `background` shorthand.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .card-header {
>   min-height: 15rem;
>   color: #ffffff;
>
>   /* Layered Backgrounds: Gradient (top) over Image (bottom) */
>   background: 
>     linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)),
>     url("../images/card-bg.jpg") no-repeat center / cover;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Multiple Background Layering**: CSS renders multiple background layers listed top-to-bottom in comma-separated order (the first layer renders on top).
> 2. **Contrast Ratio Enhancement**: Overlaying a 75% dark RGBA gradient guarantees WCAG 4.5:1 text contrast over bright imagery.
> 3. **No Extra DOM Elements**: Achieves dark image overlays cleanly without needing extra HTML overlay `<div>` containers.
> 
---

### Exercise 3: Responsive Background Positioning with background-attachment

**Scenario:** Styles a responsive callout box with fixed background scrolling behavior.

**Requirements:**
1. Set `background-attachment: scroll` for mobile performance.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .callout-box {
>   background-image: url("../images/texture.png");
>   background-repeat: repeat;
>   background-attachment: scroll; /* Mobile friendly scroll attachment */
> }
> ```
>
> #### Technical Explanation
>
> 1. **`background-attachment: scroll` vs `fixed`**: `scroll` scrolls background along with element content; `fixed` locks background relative to viewport.
> 2. **Mobile Performance Caution**: `background-attachment: fixed` causes heavy repaint lag on mobile GPUs; use `scroll` for mobile views.
> 3. **Texture Repeating**: `background-repeat: repeat` tiles small seamless textures cleanly.
## 6. Related Terms
- [`color` vs `background-color`](color_vs_background.md) — The color properties.
- [Shorthand vs Longhand Properties](../level_01/shorthand_longhand.md) — The syntax concept.
- [The Box Model (Concept)](../level_02/box_model.md) — The visual frame boundaries.

---

## 7. Key Takeaways
- The `background-image` property loads visual files behind text containers.
- The `background` shorthand combines color, image, position, size, and repeat styles.
- Always separate position and size with a slash (`position/size`) in shorthand (e.g. `center/cover`).
- Shorthand declarations will reset any unspecified background properties to default values.
- Fallback background colors should always be defined in case the image fails to download.
