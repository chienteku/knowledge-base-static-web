# `aspect-ratio`

> **Level 11 — Modern CSS Architecture & Functions**
> The CSS layout property that defines a fixed ratio of width-to-height for an element (e.g. `16 / 9` or `1 / 1`), allowing elements to scale responsively while preventing page jumps (Cumulative Layout Shift) before media downloads finish.

---

## 1. Prerequisites
- [Width / Height](../level_02/width_height.md) — Base HTML sizing properties.
- [Responsive Design (Concept)](../level_08/responsive_design.md) — Sizing layout blocks dynamically.

---

## 2. Term Category
- **Layout Property**

---

## 3. Environment Context
- **Universal Modern Standard** (Understood natively. Instructs the browser layout engine to allocate canvas dimensions immediately before resources finish downloading over the network stream).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When building responsive websites, you often need boxes to maintain a specific shape:
-   A YouTube video box should stay in widescreen format (`16:9`).
-   An Instagram-style photo card should be a perfect square (`1:1`).

If you set `width: 100%;` to make the box fill its parent, what do you set the `height` to? 
-   If you set `height: auto;`, the height collapses to `0px` until the image or video file finishes downloading.
-   When the file finally loads, the element suddenly expands downward. This causes the entire webpage content to jump down, annoying users and ruining readability. This layout jump is called **Cumulative Layout Shift (CLS)**, and it hurts search engine rankings.

Historically, developers had to use the "padding-top hack" (declaring `height: 0; padding-top: 56.25%;` on a parent and absolute-positioning the child) to force an aspect ratio box.

To solve this, the W3C introduced the native **`aspect-ratio`** property.

---

### (2) Native Sizing Ratios
You specify the ratio as `width / height` (no units needed):

```css
/* Widescreen Video Box */
.video-box {
  width: 100%;
  height: auto; /* Browser computes this value! */
  aspect-ratio: 16 / 9;
}

/* Perfect Profile Square */
.avatar-frame {
  width: 150px;
  height: auto;
  aspect-ratio: 1 / 1;
}
```

---

### (3) Preventing Layout Shifts (CLS)
When you declare `aspect-ratio: 16 / 9;` on a container, the browser allocates the exact spacing on the page *before* the image or video asset loads. When the file finishes downloading, it pops into the pre-allocated box, keeping the rest of the text on the page perfectly still.

---

### (4) Code Examples

#### Short Snippet
Alternative layouts:

```css
.card-thumbnail {
  width: 100%;
  aspect-ratio: 4 / 3; /* Classic photo card ratio */
  background-color: #ddd; /* Pre-render spacer color */
}
```

#### Fuller Example (Responsive Video Card)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aspect Ratio Showcase</title>
  <style>
    body {
      font-family: sans-serif;
      background-color: #f0f2f5;
      padding: 20px;
    }

    .card {
      max-width: 480px;
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      margin: 0 auto;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    .video-container {
      width: 100%;
      height: auto;
      
      /* THE HERO PROPERTY:
         Locks the aspect ratio to 16:9, preventing layout jumps! */
      aspect-ratio: 16 / 9;
      background-color: #000; /* Loading placeholder */
    }

    .video-container iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .card-body {
      padding: 15px;
    }
  </style>
</head>
<body>

  <div class="card">
    <div class="video-container">
      <!-- Widescreen video element -->
      <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen></iframe>
    </div>
    <div class="card-body">
      <h3>Rick Astley - Never Gonna Give You Up</h3>
      <p>This video container stays widescreen even when you resize the browser window. The layout below it never shifts because the aspect ratio is locked.</p>
    </div>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Locking both width and height explicitly

**The mistake:** Declaring `width: 300px; height: 200px; aspect-ratio: 1 / 1;` on an element:

```css
/* BAD: aspect-ratio is completely ignored! */
.profile {
  width: 300px;
  height: 200px;
  aspect-ratio: 1 / 1;
}
```

**Why it's wrong:** If you define hard values for both dimensions, the browser has no room to compute anything. The hard-coded dimensions override the aspect-ratio calculations.

**Fix: Ensure at least one dimension is set to `auto` (e.g. `width: 300px; height: auto;`).**

---



### Mistake 2: Using Obsolete 'Padding Hack' (`padding-top: 56.25%`) Instead of Modern `aspect-ratio: 16 / 9`

**The mistake:** Building responsive video wrappers using `padding-top: 56.25%` and absolute positioning.

**Why it's wrong:** The 2010s padding hack is verbose and requires extra wrapper `<div>` elements. Modern CSS provides the native `aspect-ratio: 16 / 9` property.

*Incorrect:*
```css
/* Verbose legacy padding hack for 16:9 aspect ratio */
.video-container { position: relative; padding-top: 56.25%; }
```

*Fix:*
```css
.video-card {
  aspect-ratio: 16 / 9; /* Native modern aspect ratio declaration */
  width: 100%;
}
```

### Mistake 3: Setting Conflicting Hardcoded `height` Alongside `aspect-ratio`

**The mistake:** Writing `.card { width: 300px; height: 400px; aspect-ratio: 16 / 9; }`.

**Why it's wrong:** Explicit `height` overrides `aspect-ratio` calculation. Omit explicit height (or set `height: auto`) to allow `aspect-ratio` to calculate height from width.

*Incorrect:*
```css
.card { width: 300px; height: 400px; aspect-ratio: 16 / 9; } /* ❌ Height overrides aspect-ratio! */
```

*Fix:*
```css
.card { width: 300px; height: auto; aspect-ratio: 16 / 9; }
```

## 6. Practice Exercises

### Exercise 1: Square Profile Grid

**Problem:** You are building a user grid. Each profile card `.profile` must be fluid in width to fit different grid columns, but must always remain a perfect square shape (`1:1`). Write the CSS ruleset.

**Expected output:**
> [!check]- Answer
> ```css
> .profile {
>   width: 100%;
>   height: auto;
>   aspect-ratio: 1 / 1;
> }
> ```
> - The card needs a fluid width (`100%`).
> - Force the height to compute dynamically relative to the aspect ratio equation.
> 
---



### Exercise 2: Square Avatar and 16:9 Video Aspect Ratios

**Problem:** Write CSS `aspect-ratio` declarations for:
1. Square profile avatar `.avatar` (`1 / 1`)
2. Widescreen video `.video` (`16 / 9`)

**Expected output:**
> [!check]- Answer
> ```text
> 1. .avatar { aspect-ratio: 1 / 1; }
> 2. .video { aspect-ratio: 16 / 9; }
> ```
> ```css
> .avatar { aspect-ratio: 1 / 1; }
> .video { aspect-ratio: 16 / 9; }
> ```
>
> **Explanation:** `aspect-ratio: width / height` enforces box proportions dynamically.
> 
---

### Exercise 3: Preventing Image Distortion with aspect-ratio

**Problem:** Which property should be paired with `aspect-ratio` on `<img>` tags to prevent image stretching or distortion?

**Expected output:**
> [!check]- Answer
> ```text
> object-fit: cover;
> ```
> ```css
> img {
>   width: 100%;
>   aspect-ratio: 16 / 9;
>   object-fit: cover; /* Crop image to fit aspect-ratio without distortion */
> }
> ```
>
> **Explanation:** `object-fit: cover` pairs with `aspect-ratio` to prevent image distortion.
> 
## 7. Related Terms
- [`object-fit` & `object-position`](../level_09/object_fit.md) — Standard scaling for cropped media contents inside locked boxes.

---

## 8. Key Takeaways
- `aspect-ratio` maintains a fixed width-to-height ratio during resizes.
- Standard format syntax is width-to-height (e.g., `16 / 9`).
- Prevents Cumulative Layout Shift (CLS) by reserving space before files download.
- Eliminates the need to use legacy "padding hacks" to force ratio containers.
- At least one dimension (width or height) must be set to `auto` for the ratio to work.
