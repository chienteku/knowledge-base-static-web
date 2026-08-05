# `<picture>` & Responsive Images

> **Level 3 — Media & Embedding**
> An HTML5 element and set of techniques used to serve different optimized image files to users based on their screen width, resolution, or format support.

---

## 1. Prerequisites
- [`<img>`](img.md) — The image container that actually displays the pixels.
- [`alt` Attribute](alt.md) — The accessibility description.
- [`<source>` Element](source.md) — The tag used to list alternative media files.
---

## 2. Term Category
- **Media Element**

---

## 3. Environment Context
- **Modern Browsers (HTML5)** (Supported natively by all modern browsers. Older browsers fall back automatically to the nested `<img>`).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Users visit websites on everything from tiny watches and mobile phones to massive 4K desktop monitors. 

If you load a huge, high-resolution desktop image (e.g. 3000px wide, 2MB file size) on a mobile phone over a slow cellular connection, the page will load slowly, costing the user time and cellular data. However, if you serve a tiny mobile image (e.g. 400px wide) on a desktop monitor, it will look blurry and stretched.

To solve this, HTML5 introduced **Responsive Images**. The most powerful way to implement this is the **`<picture>` tag**. It allows developers to specify different image files for different screen sizes (known as **Art Direction** or resolution switching).

---

### (2) How the `<picture>` Element Works
The `<picture>` tag is a wrapper. It does not render anything on its own. Instead, it coordinates nested `<source>` tags and a mandatory fallback `<img>` element:
-   **`media` attribute:** Specifies a CSS Media Query (e.g. `(min-width: 800px)`) defining *when* the browser should choose this image.
-   **`srcset` attribute:** Identifies the file path to load for that media query.
-   **Fallback `<img>`:** The final element in the block. **This is mandatory.** The browser evaluates the sources, picks the best one, and injects its pixels directly into the fallback `<img>` tag. If a browser is too ancient to understand `<picture>`, it ignores the picture/source tags and just renders the normal `<img>`.

---

### (3) Code Examples

#### Short Snippet
Serving a desktop image versus a mobile image:

```html
<picture>
  <!-- If screen is at least 768px wide, load this: -->
  <source media="(min-width: 768px)" srcset="desktop.jpg">
  <!-- Otherwise, fall back to rendering this: -->
  <img src="mobile.jpg" alt="A developer working at a desk">
</picture>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Responsive Art Gallery</title>
</head>
<body>

  <h1>Art Gallery</h1>

  <!-- picture element demonstrating Art Direction -->
  <!-- We serve a cropped, close-up image for mobile, and wide-angle for desktop -->
  <picture>
    <!-- Desktop (Screens 1024px and wider) -->
    <source media="(min-width: 1024px)" srcset="images/gallery-wide.jpg">
    
    <!-- Tablet (Screens 768px to 1023px) -->
    <source media="(min-width: 768px)" srcset="images/gallery-medium.jpg">
    
    <!-- Mobile & Fallback (Mandatory img tag holds the alt text!) -->
    <img src="images/gallery-cropped.jpg" alt="Exhibition hall containing oil paintings on white walls" width="100%">
  </picture>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the fallback `<img>` tag inside `<picture>`

**The mistake:** Leaving out the `<img>` tag and only writing `<source>` elements:

```html
<!-- BAD: Nothing will render on the screen! -->
<picture>
  <source media="(min-width: 800px)" srcset="large.png">
  <source srcset="small.png">
</picture>
```

**Why it's wrong:** The `<picture>` element is just a logical container. The browser relies on the internal `<img>` tag to physically draw the pixels and apply the `alt` description. Without `<img>`, the page remains blank.

---



### Mistake 2: Omitting Fallback `<img>` Tag Inside `<picture>` Container

**The mistake:** Writing `<picture><source srcset="a.webp"></picture>` without an `<img>` tag inside.

**Why it's wrong:** The `<picture>` element is a wrapper wrapper mechanism for asset selection. The `<img>` tag INSIDE `<picture>` actually performs DOM rendering on screen! Without `<img>`, nothing renders.

*Incorrect:*
```html
<picture>
  <source srcset="hero.avif">
  <!-- ❌ Missing fallback <img> tag! Nothing renders on screen! -->
</picture>
```

*Fix:*
```html
<picture>
  <source srcset="hero.avif" type="image/avif">
  <img src="hero.jpg" alt="Hero banner">
</picture>
```

### Mistake 3: Listing `<source>` Elements in Wrong Media Query Order

**The mistake:** Listing smaller media query `<source media="(min-width: 500px)">` BEFORE larger query `<source media="(min-width: 1200px)">`.

**Why it's wrong:** Browsers evaluate `<source>` tags top-to-bottom and select the FIRST matching source. Placing `min-width: 500px` first causes desktop screens to select 500px mobile images.

*Incorrect:*
```html
<source media="(min-width: 500px)" srcset="small.jpg"> <!-- ❌ Evaluated first! -->
<source media="(min-width: 1200px)" srcset="large.jpg">
```

*Fix:*
```html
<source media="(min-width: 1200px)" srcset="large.jpg">
<source media="(min-width: 500px)" srcset="small.jpg">
```

## 6. Practice Exercises

### Exercise 1: Responsive Banner

**Problem:** Write the HTML markup to serve a hero banner: `banner-large.jpg` for screens 800px wide and larger, and `banner-small.jpg` (with description: "Winter clearance sale banner") as the default mobile/fallback image.

**Expected output:**
> [!check]- Answer
> ```html
> <picture>
>   <source media="(min-width: 800px)" srcset="banner-large.jpg">
>   <img src="banner-small.jpg" alt="Winter clearance sale banner">
> </picture>
> ```
> - Nest a `<source>` tag with the `media` filter first.
> - The fallback `<img>` must carry the `src` and `alt` attributes.

---



### Exercise 2: Next-Gen Format Fallback Chain

**Problem:** Write `<picture>` element offering AVIF first, WebP second, falling back to JPEG `<img>`.

**Expected output:**
> [!check]- Answer
> ```text
> <picture><source srcset="img.avif" type="image/avif"><source srcset="img.webp" type="image/webp"><img src="img.jpg" alt="Fallback"></picture>
> ```
> ```html
> <picture>
>   <source srcset="img.avif" type="image/avif">
>   <source srcset="img.webp" type="image/webp">
>   <img src="img.jpg" alt="Fallback">
> </picture>
> ```
>
> **Explanation:** `<picture>` matches `type` formats top-to-bottom, delivering optimal image codec files.

---

### Exercise 3: Art Direction vs Resolution Switching

**Problem:** When should `<picture>` with media queries be used instead of `srcset` on standard `<img>`?

**Expected output:**
> [!check]- Answer
> ```text
> Use <picture> for Art Direction (cropping/changing image composition across screen sizes); use img srcset for Resolution Switching (same image, different resolutions).
> ```
> ```text
> Use <picture> for Art Direction (cropping/changing image composition across screen sizes); use img srcset for Resolution Switching (same image, different resolutions).
> ```
>
> **Explanation:** `<picture>` supports structural art direction changes via media queries.

## 7. Related Terms
- [`<img>`](img.md) — The rendering image element.
- [`<source>` Element](source.md) — The sibling element specifying source lists.
- [`alt` Attribute](alt.md) — The required visual descriptor.
---

## 8. Key Takeaways
- `<picture>` is an HTML5 wrapper tag used to serve responsive images.
- It matches image assets to the user's screen width using the `media` query attribute.
- The `srcset` attribute on `<source>` defines the path to load.
- You must include a fallback `<img>` tag at the end of `<picture>`, which actually renders the image.
- Place the `alt` attribute strictly on the fallback `<img>` element, not on the `<picture>` tag.
