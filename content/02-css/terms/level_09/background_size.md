# `background-size` (cover / contain)

> **Level 9 — Visual Effects & State**
> The CSS property that controls how a background image is scaled to fit or fill the dimensions of its container box.

---

## 1. Prerequisites
- [`color` vs `background-color`](../level_03/color_vs_background.md) — Setting background image sources.
- [Responsive Design (Concept)](../level_08/responsive_design.md) — Sizing layout blocks relative to device size.

---

## 2. Term Category

**Visual Effect (Universal Modern Standard .)**: `background-size` (cover / contain) is a fundamental concept in this technology stack. **Level 9 — Visual Effects & State**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Hero Section Banner Image Sizing with background-size: cover

**Scenario:** An author styles a responsive hero section banner using `background-size: cover` to ensure full image coverage without distortion.

**Requirements:**
1. Apply `background-size: cover`.
2. Set `background-position: center`.
3. Set `background-repeat: no-repeat`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .hero-cover-banner {
>   min-height: 25rem;
>   background-image: url("../images/hero-bg.jpg");
>   background-repeat: no-repeat;
>   background-position: center;
>   background-size: cover;       /* Scales image to COVER container bounds completely */
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `background-size` Property**: Controls the rendered display dimensions of an element's background image.
> 2. **`cover` Keyword Mechanics**: Scales the image proportionally so its width and height completely cover the container area, clipping excess image edges if aspect ratios differ.
> 3. **No Image Distortion**: `cover` preserves the image's original aspect ratio, preventing stretched or squished photography.
> 
---

### Exercise 2: Icon Pattern Tiling with background-size: contain and Explicit Units

**Scenario:** Styles a tiled background texture using explicit dimensions (`background-size: 2rem 2rem`).

**Requirements:**
1. Apply `background-size: 2rem 2rem`.
2. Set `background-repeat: repeat`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .texture-pattern {
>   background-image: url("../images/tile-pattern.png");
>   background-repeat: repeat;
>   background-size: 2rem 2rem;   /* Scales tile pattern to exact 32x32px dimensions */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Explicit Dimensional Sizing**: `background-size: 2rem 2rem` sets exact width and height for repeating pattern tiles.
> 2. **`contain` Keyword Mechanics**: `contain` scales the image so it fits ENTIRELY inside the container bounds without clipping.
> 3. **Pattern Texture Control**: Ensures high-DPI retina screens render background textures sharply.
> 
---

### Exercise 3: Preventing Image Distortion in Background Containers

**Scenario:** Compares `background-size: 100% 100%` (distorted) vs `cover` (aspect ratio preserved).

**Requirements:**
1. Refactor distorted `100% 100%` sizing to `cover`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* ❌ Distorted Image: 100% 100% stretches image non-proportionally! */
> /* .bad-hero { background-size: 100% 100%; } */
>
> /* ✅ Preserved Aspect Ratio: */
> .good-hero {
>   background-size: cover;
>   background-position: center;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Avoid `100% 100%`**: Using two 100% values stretches width and height independently, distorting people and product photos.
> 2. **Aspect Ratio Preservation**: Use `cover` or `contain` to maintain natural aspect ratios.
> 3. **Center Alignment**: Pair `cover` with `background-position: center` to keep core image focal points visible.
## 6. Related Terms
- [`color` vs `background-color`](../level_03/color_vs_background.md) — Base background settings.
- [`object-fit` & `object-position`](object_fit.md) — Sizing content media tags.
- [`linear-gradient` & `radial-gradient` (Gradients)](gradients.md) — Related concept: `linear-gradient` & `radial-gradient` (Gradients).

---

## 7. Key Takeaways
- `background-size` manages background image scales inside boxes.
- `cover` scales the image to completely fill the box (cropping edges as needed).
- `contain` scales the image to fit entirely inside the box (leaving letterbox margins).
- Center crop points using `background-position: center` alongside `cover`.
- Prevent repeating structures by declaring `background-repeat: no-repeat`.
