# `object-fit` & `object-position`

> **Level 9 — Visual Effects & State**
> CSS properties that control how the content of a media element (like an `<img>` or `<video>` tag) is scaled and aligned to fit within the box boundaries of its container without distorting its aspect ratio.

---

## 1. Prerequisites
- [Width / Height](../../level_02/width_height.md) — Sizing the media element box.
- [`background-size` (cover / contain)](background_size.md) — The background equivalent.

---

## 2. Term Category
- **Visual Effect**

---

## 3. Environment Context
- **Universal Modern Standard** (Governs the aspect ratio calculation and crop coordinates calculated by the browser rendering pipeline before rasterization).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Video Banner

**Problem:** You are building a background video banner. The video (`<video>`) must occupy 100% width and 400px height, filling the entire space like a background banner without distorting the video stream. Write the CSS.

**Expected output:**
```css
.video-banner {
  width: 100%;
  height: 400px;
  object-fit: cover;
  object-position: center;
}
```

> [!check]- Answer
> - Set width and height explicitly.
> - Apply the property that scales media tags to fill containers.

---



### Exercise 2: Responsive Avatar Aspect Ratio Pattern

**Problem:** Write CSS for `img.avatar` making it 80x80px square, rounded 50%, with crop covering `object-fit`.

**Expected output:**
```text
img.avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
```

> [!check]- Answer
> ```css
> img.avatar {
>   width: 80px;
>   height: 80px;
>   border-radius: 50%;
>   object-fit: cover;
> }
> ```
>
> **Explanation:** `object-fit: cover` prevents image stretching inside fixed aspect ratio boxes.

### Exercise 3: Object Position Focal Point

**Problem:** Which property adjusts focal point alignment when `object-fit: cover` crops an image?

**Expected output:**
```text
object-position (e.g. object-position: top center;)
```

> [!check]- Answer
> ```css
> img {
>   object-fit: cover;
>   object-position: top center;
> }
> ```
>
> **Explanation:** `object-position` shifts the alignment origin for cropped image content.

## 7. Related Terms
- [`background-size` / `cover` / `contain`](background_size.md) — The background equivalent.
- [`border-radius`](border_radius.md) — Cropping visual profiles.

---

## 8. Key Takeaways
- `object-fit` scales content inside `<img>` or `<video>` tags without distorting them.
- `cover` fills the container box (cropping edges as needed).
- `contain` fits the entire media file inside the container box (leaving letterboxes).
- Always define both `width` and `height` on elements where `object-fit` is declared.
- Adjust alignment of the crop focus point using `object-position`.
