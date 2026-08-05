# `filter`

> **Level 9 — Visual Effects & State**
> The CSS property that applies image-processing filters (like blur, grayscale, contrast, and drop-shadows) to an entire HTML element before it is painted onto the screen.

---

## 1. Prerequisites
- [`opacity`](opacity.md) — Fading elements.

---

## 2. Term Category
- **Visual Effect**

---

## 3. Environment Context
- **Universal Modern Standard** (Runs directly on the GPU, allowing smooth real-time animation of filter changes during transitions).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In early web design, if you wanted an image to turn gray when hovered, or to blur out when a popup modal appeared, you had to save two separate versions of the image in Photoshop (`photo.jpg` and `photo-gray.jpg`) and swap the image source file using JavaScript. 

This resulted in double the image downloads and created an awkward flicker while the second image loaded.

To solve this, browser makers introduced the **`filter`** property. 

It passes the rendered element through image-processing algorithms (like a photo filter on Instagram) right inside the browser, enabling developers to create complex visual adjustments on the fly.

---

### (2) Common Filter Functions

-   **`blur(5px)`**: Smudges the element. The higher the pixels, the blurrier it gets.
-   **`grayscale(100%)`**: Converts the element completely to black-and-white.
-   **`brightness(50%)`**: Dims the element (0% is solid black, 100% is normal, 200% is double brightness).
-   **`contrast(150%)`**: Makes darks darker and lights lighter.
-   **`sepia(80%)`**: Applies a warm, retro brown tone.
-   **`drop-shadow(2px 2px 5px rgba(0,0,0,0.5))`**: Draws a drop-shadow.

---

### (3) Filter Chaining
You can apply multiple filters at the same time by separating them with a single space:

```css
.retro-effect {
  /* Apply sepia AND dim the brightness in one pass */
  filter: sepia(80%) brightness(90%); 
}
```

---

### (4) Important: `drop-shadow()` vs. `box-shadow`
While `box-shadow` draws a shadow around the element's rectangular container box, `filter: drop-shadow()` evaluates the transparent pixels of the element and draws a shadow around the **actual visible shape**.

```css
/* For a transparent PNG logo of a star: */
.logo {
  /* BAD: Draws a rectangular shadow around the star's box frame */
  box-shadow: 0 4px 8px black; 
  
  /* GOOD: Draws a shadow that outlines the points of the star shape! */
  filter: drop-shadow(0 4px 8px black); 
}
```

---

### (5) Code Examples

#### Short Snippet
Hover state transition:

```css
.gallery-img {
  filter: grayscale(100%);
  transition: filter 0.3s ease;
}

.gallery-img:hover {
  /* Smoothly transitions the image to full color on hover */
  filter: grayscale(0%); 
}
```

#### Fuller Example (Overlay Filter Panel)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Filters Demo</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #e0e0e0;
    }

    .card {
      background-color: white;
      border-radius: 12px;
      overflow: hidden;
      width: 320px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
      text-align: center;
    }

    .card-img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      
      /* Start dim and gray */
      filter: grayscale(100%) brightness(80%);
      transition: filter 0.4s ease;
    }

    /* Bring card image to life on hover! */
    .card:hover .card-img {
      filter: grayscale(0%) brightness(100%);
    }

    .card-body {
      padding: 20px;
    }
  </style>
</head>
<body>

  <div class="card">
    <img class="card-img" src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600" alt="Landscape">
    <div class="card-body">
      <h3>Interactive Image Filter</h3>
      <p>Hover over the card to smoothly remove the grayscale filter and restore full color!</p>
    </div>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Chaining filters using commas

**The mistake:** Declaring `filter: grayscale(100%), blur(2px);`.

**Why it's wrong:** The browser parses filter parameters using **spaces**, not commas. Commas will cause the entire line to be ignored.

**Fix: Separate chained filter parameters with spaces: `filter: grayscale(100%) blur(2px);`.**

---



### Mistake 2: Overusing Heavy CSS `filter: blur()` Degrading Animation Performance (GPU Load)

**The mistake:** Animating `filter: blur(20px)` at 60fps on high-resolution canvas backgrounds.

**Why it's wrong:** CSS `filter` operations re-render bitmap pixel layers dynamically. Animating heavy filters causes frame drops on mobile GPUs. Use `opacity` or pre-rendered assets.

*Incorrect:*
```css
/* Heavy blur animation causing mobile frame drops */
```

*Fix:*
```css
/* Animate opacity or transform properties instead for 60fps performance */
```

### Mistake 3: Confusing CSS `filter: drop-shadow()` with `box-shadow`

**The mistake:** Using `box-shadow` on a transparent PNG logo expecting the shadow to outline the logo graphics.

**Why it's wrong:** `box-shadow` casts a rectangular shadow around the element box. `filter: drop-shadow()` traces non-transparent alpha pixels, casting accurate vector shadows around PNG/SVG shapes.

*Incorrect:*
```css
img.logo { box-shadow: 2px 2px 5px black; } /* ❌ Casts rectangular box shadow around PNG! */
```

*Fix:*
```css
img.logo { filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.5)); } /* Traces PNG graphic outline */
```

## 6. Practice Exercises

### Exercise 1: PNG Icon Glow

**Problem:** You are building a game dashboard UI. You have a transparent PNG icon of a flame. When the user hovers over the icon, you want to create a glowing red shadow effect around the exact outline of the flame shape. Write the `:hover` ruleset.

**Expected output:**
> [!check]- Answer
> ```css
> .flame-icon:hover {
>   filter: drop-shadow(0px 0px 12px rgba(255, 0, 0, 0.8));
> }
> ```
> - Avoid using `box-shadow` because the icon container is rectangular.
> - Apply the shadow function designed for custom outlines.

---



### Exercise 2: Image Grayscale Hover Pattern

**Problem:** Write CSS for `.gallery-img` starting at `filter: grayscale(100%)`, transitioning to `filter: grayscale(0%)` on hover.

**Expected output:**
> [!check]- Answer
> ```text
> .gallery-img { filter: grayscale(100%); transition: filter 0.3s; } .gallery-img:hover { filter: grayscale(0%); }
> ```
> ```css
> .gallery-img {
>   filter: grayscale(100%);
>   transition: filter 0.3s;
> }
> .gallery-img:hover {
>   filter: grayscale(0%);
> }
> ```
>
> **Explanation:** `filter: grayscale()` transforms image color channels.

---

### Exercise 3: Chaining Multiple Filter Functions

**Problem:** Write `filter` rule combining `contrast(120%)` and `brightness(90%)`.

**Expected output:**
> [!check]- Answer
> ```text
> filter: contrast(120%) brightness(90%);
> ```
> ```css
> img {
>   filter: contrast(120%) brightness(90%);
> }
> ```
>
> **Explanation:** Multiple filter functions are chained space-separated in a single declaration.

## 7. Related Terms
- [`box-shadow` (Card Shadows)](box_shadow.md) — The rectangular alternative.
- [`backdrop-filter`](backdrop_filter.md) — Applying filters behind an element.
- [`opacity`](opacity.md) — Fading elements.

---

## 8. Key Takeaways
- `filter` runs visual image processing on HTML elements in the browser.
- Common filters include `blur()`, `grayscale()`, `brightness()`, and `sepia()`.
- chain multiple filters together by separating functions with spaces, never commas.
- Use `filter: drop-shadow()` instead of `box-shadow` for transparent PNG shapes.
