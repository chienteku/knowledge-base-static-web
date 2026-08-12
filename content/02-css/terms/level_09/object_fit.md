# `object-fit` & `object-position`

> **Level 9 — Visual Effects & State**
> CSS properties that control how the content of a media element (like an `<img>` or `<video>` tag) is scaled and aligned to fit within the box boundaries of its container without distorting its aspect ratio.

---

## 1. Prerequisites
- [Width / Height](../level_02/width_height.md) — Sizing the media element box.
- [`background-size` (cover / contain)](background_size.md) — The background equivalent.

---

## 2. Term Category

**Visual Effect (Universal Modern Standard .)**: `object-fit` & `object-position` is a fundamental concept in this technology stack. **Level 9 — Visual Effects & State**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When users upload photos to a website (like profile pictures), they come in all shapes and sizes (portraits, landscapes, squares). 

If you try to display these photos inside a unified layout box (for example, a square avatar frame of `200px` by `200px`) by setting `width: 200px; height: 200px;` on the `<img>` tag, the browser will forcefully squish or stretch the image to fit those exact dimensions. 

This distorts the image, squishing faces and making the site look unprofessional.

In the past, to avoid this distortion, developers had to use empty `<div>` tags and set the images as CSS `background-image` elements so they could use `background-size: cover;`. 

However, this was terrible for SEO and screen-reader accessibility since `<div>` tags do not carry semantic meaning like `<img>` tags do.

To solve this, the W3C introduced **`object-fit`**. 

It allows you to apply scaling behavior (like `cover` or `contain`) directly to standard HTML media tags (`<img>`, `<video>`).

---

### (2) Object-Fit Values

-   **`fill` (Default)**: Squishes and stretches the image to fill the width and height, distorting the aspect ratio.
-   **`cover`**: Scales the image to completely fill the box while preserving its aspect ratio. The sides or top/bottom will be **cropped** (cut off) to fit. (Behaves exactly like `background-size: cover`).
-   **`contain`**: Scales the entire image to fit inside the box without cropping or distortion. Leaves empty space if aspect ratios don't match. (Behaves exactly like `background-size: contain`).
-   **`none`**: Renders the image at its native, raw pixel size, ignoring container box dimensions.

---

### (3) Aligning with `object-position`
Like `background-position`, you can choose which part of the cropped image remains visible using **`object-position`** (e.g. keeping a user's face centered):

```css
.avatar {
  width: 200px;
  height: 200px;
  object-fit: cover;
  /* Align crop focus: Center horizontally, align to top vertically */
  object-position: center top; 
}
```

---

### (4) Code Examples

#### Short Snippet
Avatar layout ruleset:

```css
.user-avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  /* Force landscape/portrait uploads to fill the circle without squishing! */
  object-fit: cover; 
}
```

#### Fuller Example (Gallery Grid Showcase)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Object Fit Showcase</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 20px;
      background-color: #f5f5f5;
    }

    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .gallery-item {
      background-color: white;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }

    .gallery-item img {
      width: 100%;
      height: 180px; /* Lock height */
      border-radius: 4px;
      
      /* THE MAGIC PROPERTIES:
         Scales and crops without squishing! */
      object-fit: cover;
      object-position: center;
    }
  </style>
</head>
<body>

  <h2>Dynamic Aspect Ratio Gallery</h2>
  <div class="gallery">
    <div class="gallery-item">
      <!-- Landscape image source -->
      <img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600" alt="Landscape">
    </div>
    <div class="gallery-item">
      <!-- Portrait image source -->
      <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600" alt="Beach Portrait">
    </div>
  </div>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Applying `object-fit` without setting both dimensions

**The mistake:** Declaring `object-fit: cover;` on an image, but leaving height or width set to `auto`:

```css
/* BAD: Image will just display at its native shape ratio, doing nothing! */
.image-box {
  width: 100%;
  height: auto;
  object-fit: cover; 
}
```

**Why it's wrong:** `object-fit` only scales content inside a locked boundary. If either dimension is `auto`, the container expands to fit the image's original ratio, so the browser doesn't crop anything.

**Fix: Ensure you lock both the `width` and `height` of the element.**

---



### Mistake 2: Expecting `object-fit: cover` to Work Without Setting Explicit Container `width` and `height`

**The mistake:** Adding `object-fit: cover` to an `<img>` tag without setting `width` or `height` in CSS.

**Why it's wrong:** `object-fit` controls how image bitmap content fits INSIDE its layout box. If no explicit width/height dimensions are set on the `<img>`, `object-fit` has no effect.

*Incorrect:*
```css
img { object-fit: cover; } /* ❌ Fails because image width/height are auto! */
```

*Fix:*
```css
img {
  width: 100%;
  height: 250px;
  object-fit: cover; /* Fits image inside 250px box without distortion */
}
```

### Mistake 3: Confusing `object-fit` (for `<img>`/`<video>` elements) with `background-size` (for CSS background images)

**The mistake:** Using `background-size: cover` on an HTML `<img>` tag.

**Why it's wrong:** `object-fit` applies to HTML media elements (`<img>`, `<video>`). `background-size` applies to CSS `background-image` properties.

*Incorrect:*
```css
img { background-size: cover; } /* ❌ Incorrect property for <img> tags! */
```

*Fix:*
```css
img { object-fit: cover; }
```

## 5. Practice Exercises

### Exercise 1: Card Aspect Ratio Image Sizing with object-fit: cover

**Scenario:** An author scales variable-sized user product upload photos inside a fixed 16:9 card image container using `object-fit: cover`.

**Requirements:**
1. Set fixed container height or aspect-ratio.
2. Apply `width: 100%; height: 100%; object-fit: cover;` to `<img>`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .card-media-wrapper {
>   width: 100%;
>   aspect-ratio: 16 / 9;
>   overflow: hidden;
>   border-radius: 0.5rem 0.5rem 0 0;
> }
>
> .card-media-wrapper img {
>   width: 100%;
>   height: 100%;
>   object-fit: cover;            /* Fits image into 16:9 box without stretching! */
>   object-position: center;      /* Centers image focal point */
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `object-fit` Property**: Controls how replaced content (like `<img>` or `<video>`) scales to fit its containing box.
> 2. **`cover` Keyword Mechanics**: Scales the image proportionally to fill the entire container box, cropping edges if aspect ratios differ.
> 3. **Replaces Background Image Hacks**: Allows using semantic HTML `<img>` tags with alt text instead of CSS `background-image` wrappers!
> 
---

### Exercise 2: Logo Grid Branding Containment with object-fit: contain

**Scenario:** Fits client brand logos into uniform grid cells without cropping or stretching using `object-fit: contain`.

**Requirements:**
1. Apply `object-fit: contain` to brand logo grid images.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .logo-grid-item img {
>   width: 100%;
>   height: 4rem;
>   object-fit: contain;          /* Fits logo ENTIRELY inside 4rem box without cropping */
> }
> ```
>
> #### Technical Explanation
>
> 1. **`contain` Keyword Mechanics**: Scales image so the ENTIRE graphic is visible inside the box, adding letterboxing if needed.
> 2. **Brand Protection**: Guarantees partner brand logos are never cropped, distorted, or stretched.
> 3. **Uniform Grid Cells**: Simplifies multi-logo partner grid displays.
> 
---

### Exercise 3: Preventing Media Aspect Ratio Distortion in Responsive Layouts

**Scenario:** Demonstrates why raw `width: 100%; height: 200px;` distorts images without `object-fit`.

**Requirements:**
1. Refactor distorted image to use `object-fit: cover`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* ❌ Distorted Image: Fixed height without object-fit squishes photos! */
> /* .bad-img { width: 100%; height: 200px; } */
>
> /* ✅ Preserved Photo Aspect Ratio: */
> .good-img {
>   width: 100%;
>   height: 12.5rem;              /* 200px fixed height */
>   object-fit: cover;            /* Preserves photo proportions cleanly */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Squishing Distortion Pitfall**: Setting both `width` and `height` explicitly on `<img>` distorts intrinsic image ratios unless `object-fit` is declared.
> 2. **`object-position` Adjustment**: Use `object-position: top` if important image details (like human faces) get cropped at the bottom.
> 3. **Modern Image Standard**: Essential CSS property for dynamic CMS media galleries.
## 6. Related Terms
- [`background-size` (cover / contain)](background_size.md) — The background equivalent.
- [`border-radius` (Rounded Corners)](border_radius.md) — Cropping visual profiles.
- [`aspect-ratio`](../level_11/aspect_ratio.md) — Related concept: `aspect-ratio`.

---

## 7. Key Takeaways
- `object-fit` scales content inside `<img>` or `<video>` tags without distorting them.
- `cover` fills the container box (cropping edges as needed).
- `contain` fits the entire media file inside the container box (leaving letterboxes).
- Always define both `width` and `height` on elements where `object-fit` is declared.
- Adjust alignment of the crop focus point using `object-position`.
