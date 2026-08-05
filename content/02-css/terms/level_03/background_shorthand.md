# `background` Shorthand & `background-image`

> **Level 3 — Typography & Colors**
> Visual styling properties used to apply background images, configure their scale and repeating layout parameters, and condense them into a unified, single-line `background` shorthand declaration.

---

## 1. Prerequisites
- [`color` vs `background-color`](color_vs_background.md) — Knowing how background colors interact with text.
- [The Box Model (Concept)](../level_02/box_model.md) — Background shapes are defined by the elements' box layouts.
---

## 2. Term Category
- **Visual Effect / Shorthand Property**

---

## 3. Environment Context
- **Universal Browser Support** (Parsed natively. Browsers make asynchronous HTTP network requests to fetch files referenced in image URLs).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Shorthand Builder

**Problem:** Construct the single-line shorthand `background` rule for a banner. The banner needs a fallback color `#222`, loads `url('stars.png')`, centers the position, scales to `contain`, and does not repeat.

**Expected output:**
> [!check]- Answer
> ```css
> background: #222 url('stars.png') center/contain no-repeat;
> ```
> - Follow the standard shorthand sequence.
> - Remember to separate the position (`center`) and the size (`contain`) with a `/`.

---



### Exercise 2: Complete Background Shorthand Syntax

**Problem:** Write `background` shorthand setting `url('hero.jpg')`, no-repeat, centered horizontally and vertically, covering the box, with `#333` fallback color.

**Expected output:**
> [!check]- Answer
> ```text
> background: #333 url('hero.jpg') no-repeat center / cover;
> ```
> ```css
> .hero {
>   background: #333 url('hero.jpg') no-repeat center / cover;
> }
> ```
>
> **Explanation:** Shorthand combines fallback color, image URL, repeat behavior, position, and size.

---

### Exercise 3: Multiple Background Image Layers

**Problem:** Write CSS layering `top-layer.png` over `bottom-layer.png` using comma-separated `background-image` syntax.

**Expected output:**
> [!check]- Answer
> ```text
> background-image: url('top-layer.png'), url('bottom-layer.png');
> ```
> ```css
> div {
>   background-image: url('top-layer.png'), url('bottom-layer.png');
> }
> ```
>
> **Explanation:** First listed background image renders on top of subsequent layers.

## 7. Related Terms
- [`color` vs `background-color`](color_vs_background.md) — The color properties.
- [Shorthand vs Longhand Properties](../level_01/shorthand_longhand.md) — The syntax concept.
- [The Box Model (Concept)](../level_02/box_model.md) — The visual frame boundaries.
---

## 8. Key Takeaways
- The `background-image` property loads visual files behind text containers.
- The `background` shorthand combines color, image, position, size, and repeat styles.
- Always separate position and size with a slash (`position/size`) in shorthand (e.g. `center/cover`).
- Shorthand declarations will reset any unspecified background properties to default values.
- Fallback background colors should always be defined in case the image fails to download.
