# `background-size` (cover / contain)

> **Level 9 — Visual Effects & State**
> The CSS property that controls how a background image is scaled to fit or fill the dimensions of its container box.

---

## 1. Prerequisites
- [`color` vs `background-color`](../level_03/color_vs_background.md) — Setting background image sources.
- [Responsive Design (Concept)](../level_08/responsive_design.md) — Sizing layout blocks relative to device size.
---

## 2. Term Category
- **Visual Effect**

---

## 3. Environment Context
- **Universal Modern Standard** (Governs the raster interpolation math applied to background images during window resizing loops).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, if you set a background image on a container, the browser renders it at its raw, native file dimensions. 

This creates problems:
-   If the image is `2000px` wide and the card is `300px` wide, you only see the top-left corner of the image.
-   If the card is `500px` wide and the image is `100px` wide, the browser repeats it, tiling the image like wallpaper.

To fix this, developers use **`background-size`**. It tells the browser how to resize, stretch, or squeeze the background graphic to fit the box.

---

### (2) The Two Magic Keywords: `cover` vs `contain`

#### 1. `cover` (Fill the Box)
Scales the background image to be as small as possible while ensuring the **entire container is covered**. 
-   *Behavior:* The image maintains its aspect ratio, but parts of the image will be **cropped** (cut off) if the container has a different shape.
-   *Use Case:* High-resolution full-screen background wraps or header banners.

```css
.hero-banner {
  background-image: url('landscape.jpg');
  background-size: cover;
  background-position: center; /* Center the crop point! */
  background-repeat: no-repeat;
}
```

#### 2. `contain` (Show the Whole Image)
Scales the background image to be as large as possible while ensuring the **entire image fits inside the box**.
-   *Behavior:* The image maintains its aspect ratio and is **never cropped**. If the box is wider than the image shape, you will see empty space on the sides (letterboxing).
-   *Use Case:* Displaying logos or brand icons where cutting off any part of the image is unacceptable.

```css
.brand-logo-container {
  background-image: url('logo.svg');
  background-size: contain;
  background-repeat: no-repeat; /* Crucial to prevent tiling empty sides! */
}
```

---

### (3) Code Examples

#### Short Snippet
Custom percentage layout:

```css
.card {
  background-image: url('pattern.png');
  /* Scale the image to cover 50% of the card width, 
     and automatically calculate height to preserve aspect ratio! */
  background-size: 50% auto;
  background-repeat: no-repeat;
}
```

#### Fuller Example (Full Viewport Hero)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Background Size Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: sans-serif;
    }

    .fullscreen-hero {
      /* Cover the entire browser screen */
      width: 100vw;
      height: 100vh;
      
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      text-shadow: 0 2px 4px rgba(0,0,0,0.6);

      /* Image configuration */
      background-image: url('https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600');
      background-repeat: no-repeat;
      
      /* THE MAGIC MIX: Scale to fit, centered crop */
      background-size: cover;
      background-position: center;
    }

    .hero-content {
      background-color: rgba(0,0,0,0.4);
      padding: 30px;
      border-radius: 8px;
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="fullscreen-hero">
    <div class="hero-content">
      <h1>Dynamic Viewport Background</h1>
      <p>Resize your browser! The mountain background image scales, keeping the horizon centered without ever leaving empty gaps.</p>
    </div>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `background-repeat: no-repeat` with `contain`

**The mistake:** Setting `background-size: contain;` and wondering why the image is tiling across the sides of your element.

**Why it's wrong:** `background-size` only scales the image; it does not change the browser's default behavior of tiling backgrounds. 

**Fix: Always combine `background-size: contain` with `background-repeat: no-repeat`.**

---



### Mistake 2: Confusing `background-size: cover` with `background-size: contain`

**The mistake:** Using `background-size: contain` for full-screen hero section backgrounds.

**Why it's wrong:** `contain` scales the image so the entire image is visible, leaving empty un-filled gaps if container aspect ratio differs. `cover` scales the image to completely fill the container box (cropping if necessary).

*Incorrect:*
```css
.hero { background-size: contain; } /* ❌ Leaves empty un-filled background gaps! */
```

*Fix:*
```css
.hero { background-size: cover; background-position: center; }
```

### Mistake 3: Setting 100% 100% Dimensions Distorting Image Aspect Ratio

**The mistake:** Writing `background-size: 100% 100%` on hero images.

**Why it's wrong:** Setting `100% 100%` stretches width and height independently, distorting the natural image aspect ratio. Use `cover` or `contain`.

*Incorrect:*
```css
div { background-size: 100% 100%; } /* ❌ Distorts image proportions! */
```

*Fix:*
```css
div { background-size: cover; }
```

## 6. Practice Exercises

### Exercise 1: Hero Setup

**Problem:** You are styling a homepage header section. You want to place a background image on it. The header should show the background image scaled to fill the entire space, centered vertically and horizontally, and the image should never duplicate. Write the CSS declaration block.

**Expected output:**
> [!check]- Answer
> ```css
> .hero-header {
>   background-image: url('banner.jpg');
>   background-size: cover;
>   background-position: center;
>   background-repeat: no-repeat;
> }
> ```
> - Use the three classic background properties to lock cover scaling, centering, and no repeat.

---



### Exercise 2: Cover Image Centering Pattern

**Problem:** Write CSS ruleset for `.bg-hero` setting background image `hero.jpg`, centered, covering full container without repeating.

**Expected output:**
> [!check]- Answer
> ```text
> .bg-hero { background-image: url('hero.jpg'); background-repeat: no-repeat; background-position: center; background-size: cover; }
> ```
> ```css
> .bg-hero {
>   background-image: url('hero.jpg');
>   background-repeat: no-repeat;
>   background-position: center;
>   background-size: cover;
> }
> ```
>
> **Explanation:** Combining `no-repeat`, `center`, and `cover` ensures optimal responsive background rendering.

---

### Exercise 3: Background Size Shorthand Syntax

**Problem:** Write `background` shorthand specifying `center / cover` size.

**Expected output:**
> [!check]- Answer
> ```text
> background: url('hero.jpg') center / cover no-repeat;
> ```
> ```css
> .hero {
>   background: url('hero.jpg') center / cover no-repeat;
> }
> ```
>
> **Explanation:** `position / size` syntax defines background size in shorthand rules.

## 7. Related Terms
- [`color` vs `background-color`](../level_03/color_vs_background.md) — Base background settings.
- [`object-fit` & `object-position`](object_fit.md) — Sizing content media tags.
- [`linear-gradient` & `radial-gradient` (Gradients)](gradients.md) — Related concept: `linear-gradient` & `radial-gradient` (Gradients).
---

## 8. Key Takeaways
- `background-size` manages background image scales inside boxes.
- `cover` scales the image to completely fill the box (cropping edges as needed).
- `contain` scales the image to fit entirely inside the box (leaving letterbox margins).
- Center crop points using `background-position: center` alongside `cover`.
- Prevent repeating structures by declaring `background-repeat: no-repeat`.
