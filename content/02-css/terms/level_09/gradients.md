# `linear-gradient` & `radial-gradient` (Gradients)

> **Level 9 — Visual Effects & State**
> CSS background image functions that generate smooth color transitions dynamically inside the browser, replacing the need for static graphic files.

---

## 1. Prerequisites
- [Color & Background](../../level_03/color_vs_background.md) — The parent container properties.

---

## 2. Term Category
- **Visual Effect**

---

## 3. Environment Context
- **Universal Modern Standard** (Evaluated as a GPU-accelerated graphic element inside the browser's painting subsystem).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In early web design, if you wanted a button or header to fade from blue to purple, you had to slice a narrow `1px` wide image block in Photoshop, export it as a PNG, download it via HTTP, and repeat it horizontally using `background-repeat: repeat-x;`.

This was slow, consumed HTTP requests, and pixelated or blurred when zoomed in on high-density Retina screens.

To solve this, browser engines introduced CSS Gradients. Gradients are computed on-the-fly directly by the graphics chip, rendering perfectly crisp transitions at any scale without downloading an image file.

---

### (2) Important: Gradients are Images
In CSS, a gradient is technically treated as a **`background-image`** (not a `background-color`). 

```css
/* BAD: This rule is ignored by the browser! */
.invalid-box {
  background-color: linear-gradient(red, blue); 
}

/* GOOD: Always apply gradients to background-image or background shorthand! */
.valid-box {
  background-image: linear-gradient(red, blue);
}
```

---

### (3) Types of Gradients

#### 1. Linear Gradient (`linear-gradient`)
Blends colors along a straight path. You can define the direction using angles or keywords:
-   **Keywords:** `to right`, `to bottom`, `to top right`
-   **Angles:** `45deg`, `180deg` (straight down), `90deg` (to the right)

```css
/* Fade from teal to purple diagonally */
background-image: linear-gradient(135deg, teal, purple);
```

#### 2. Radial Gradient (`radial-gradient`)
Blends colors radiating outward from a single point (ellipse or circle shape):

```css
/* Fade from yellow inside to orange outside */
background-image: radial-gradient(circle at center, yellow, orange);
```

#### 3. Color Stops (Exact boundaries)
By default, colors blend evenly. You can append percentage markers to lock colors to specific offsets:

```css
/* Red covers first 20%, blends into yellow, yellow dominates after 80% */
background-image: linear-gradient(to right, red 20%, yellow 80%);
```

---

### (4) Code Examples

#### Short Snippet
Split stripe background (no color blending):

```css
.striped-bar {
  /* Creating a hard split line down the middle by matching percentage stops! */
  background-image: linear-gradient(to right, lightblue 50%, lightgreen 50%);
}
```

#### Fuller Example (Hero Banner)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gradients Demo</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #111;
    }

    .hero-banner {
      width: 90%;
      max-width: 600px;
      padding: 60px 40px;
      color: white;
      text-align: center;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      
      /* Vibrant diagonal gradient background */
      background-image: linear-gradient(45deg, #ff007f 0%, #7f00ff 100%);
    }

    .hero-btn {
      background-color: white;
      color: #7f00ff;
      border: none;
      padding: 12px 30px;
      font-weight: bold;
      border-radius: 30px;
      margin-top: 20px;
      cursor: pointer;
    }
  </style>
</head>
<body>

  <div class="hero-banner">
    <h1>CSS Gradient Hero</h1>
    <p>This entire visual aesthetic is generated natively. No images downloaded.</p>
    <button class="hero-btn">Get Started</button>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to apply gradients to `background-color`

**The mistake:** Declaring `background-color: linear-gradient(red, blue);`.

**Why it's wrong:** The browser parses gradients as image generators, not flat colors. 

**Fix: Always use `background-image` or the `background` shorthand property.**

---



### Mistake 2: Using Invalid Syntax in `linear-gradient` Direction Angles

**The mistake:** Writing `background: linear-gradient(to top right 45deg, red, blue);`.

**Why it's wrong:** In `linear-gradient`, specify EITHER a direction keyword (`to right`, `to bottom right`) OR an angle (`45deg`), but NOT both simultaneously.

*Incorrect:*
```css
background: linear-gradient(to right 90deg, red, blue); /* ❌ Mixed syntax error! */
```

*Fix:*
```css
background: linear-gradient(45deg, red, blue); /* Or to top right */
```

### Mistake 3: Forgetting Fallback Solid `background-color` Before Gradient Declarations

**The mistake:** Writing only `background-image: linear-gradient(...)` without a fallback `background-color`.

**Why it's wrong:** If gradient parsing fails or images are disabled, lacking a fallback color leaves containers un-styled or text unreadable.

*Incorrect:*
```css
div { background-image: linear-gradient(red, blue); } /* Missing fallback color */
```

*Fix:*
```css
div {
  background-color: red; /* Fallback solid color */
  background-image: linear-gradient(red, blue);
}
```

## 6. Practice Exercises

### Exercise 1: Hard Stop Card Split

**Problem:** Create a CSS ruleset for a card background that is split perfectly down the middle horizontally, with the top half being solid white (`#ffffff`) and the bottom half being solid light gray (`#f0f0f0`).

**Expected output:**
```css
.split-card {
  background-image: linear-gradient(to bottom, #ffffff 50%, #f0f0f0 50%);
}
```

> [!check]- Answer
> - The direction is `to bottom`.
> - Use the same percentage stop (`50%`) for the end of the first color and start of the second color to prevent blending!

---



### Exercise 2: Linear Gradient Angle Direction

**Problem:** Write CSS `linear-gradient` flowing from left to right transitioning from `#ff0000` to `#0000ff`.

**Expected output:**
```text
background: linear-gradient(to right, #ff0000, #0000ff);
```

> [!check]- Answer
> ```css
> .gradient {
>   background: linear-gradient(to right, #ff0000, #0000ff);
> }
> ```
>
> **Explanation:** `to right` directs linear gradient color stops from left edge to right edge.

### Exercise 3: Radial Gradient Center Syntax

**Problem:** Write `radial-gradient` centered at container middle transitioning from white to black.

**Expected output:**
```text
background: radial-gradient(circle at center, #ffffff, #000000);
```

> [!check]- Answer
> ```css
> .radial {
>   background: radial-gradient(circle at center, #ffffff, #000000);
> }
> ```
>
> **Explanation:** `radial-gradient` radiates outward from a center focal point.

## 7. Related Terms
- [`background-size` / `cover` / `contain`](background_size.md) — Scaling backgrounds.
- [Color & Background](../../level_03/color_vs_background.md) — Base background declarations.

---

## 8. Key Takeaways
- CSS gradients generate background graphics mathematically in the browser.
- Gradients are compiled as image files (`background-image`), never colors (`background-color`).
- `linear-gradient` draws color transitions along a straight directional line.
- `radial-gradient` draws circles/ellipses expanding outward.
- Use matching color stop percentages (e.g. `red 50%, blue 50%`) to create razor-sharp color transitions.
