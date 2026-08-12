# `<img>`

> **Level 3 — Media & Embedding**
> Embeds an image into the document.

---

## 1. Prerequisites
- [Element vs. Tag](../level_01/element_vs_tag.md) — The tag structure rules.
- [Void Elements (Self-closing Tags)](../level_01/void_elements.md) — Understanding that the `<img>` is a void element (no closing tag).
- [Attribute](../level_01/attribute.md) — The `<img>` tag requires attributes to function.
- [`src` Attribute](src.md) — The attribute that points to the image resource location.

---

## 2. Term Category

**Media Element (Universal Browser Support)**: `<img>` is a fundamental concept in this technology stack. **Level 3 — Media & Embedding**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In the very first iteration of HTML (1991), the web was entirely text-based. In 1993, Marc Andreessen (creator of the Mosaic browser) proposed a new tag to allow inline images to be displayed directly alongside text. The W3C standardized the `<img>` tag.
Because HTML files are strictly text files, you cannot physically paste a JPEG or PNG file "inside" your HTML code. Instead, the `<img>` tag was designed to be a placeholder or a window. The tag tells the browser: "Leave a blank space here, go fetch this image file from the server, and draw it in this space."
Because an image cannot contain text inside it, the `<img>` tag is a **void element**. It has no closing tag.

### (2) Reality Metaphor
Imagine hanging a picture frame on an empty wall.
The `<img>` tag is the physical wooden frame you nail to the wall. 
The `src` (source) attribute is the set of instructions you give to an assistant, telling them exactly which painting to go retrieve from the basement to put into the frame.

### (3) Code Examples

#### Short Snippet
```html
<!-- The 'src' attribute points to the image file -->
<!-- The 'alt' attribute describes the image for screen readers -->
<img src="cute-puppy.jpg" alt="A golden retriever puppy playing in the grass">
```

#### Fuller Example
```html
<article>
  <h2>My Trip to Paris</h2>
  <p>Yesterday, I visited the Eiffel Tower. It was incredible!</p>
  
  <!-- Embedding a local image -->
  <!-- We explicitly define width and height to prevent the page layout from shifting as the image loads -->
  <img src="images/eiffel-tower.jpg" alt="The Eiffel Tower at sunset" width="600" height="400">
  
  <p>I also found this amazing picture online:</p>
  <!-- Embedding an image from another website (absolute URL) -->
  <img src="https://example.com/croissant.png" alt="A freshly baked croissant">
</article>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to close the `<img>` tag

**The mistake:** Adding a closing `</img>` tag.

**Why it's wrong:** The `<img>` tag is a void element. It cannot contain text or child elements. Adding a closing tag violates HTML5 standards and can occasionally confuse parsers.

*Incorrect:*
```html
<img src="cat.jpg" alt="A cat"></img>
```

*Fix:*
```html
<img src="cat.jpg" alt="A cat">
```

### Mistake 2: Forgetting the `alt` attribute

**The mistake:** Using an `<img>` tag with only a `src` attribute.

**Why it's wrong:** Omitting the `alt` attribute is one of the biggest accessibility failures on the modern web. Screen readers cannot "see" images, so they read the `alt` text aloud to visually impaired users. Furthermore, if the image fails to load (due to a broken link or slow internet), the browser displays the `alt` text in its place.

*Incorrect:*
```html
<img src="graph.png">
```

*Fix:*
```html
<img src="graph.png" alt="A bar chart showing profits increasing by 20% in Q3">
```

---



### Mistake 3: Omitting `width` and `height` Attributes (Cumulative Layout Shift / CLS Warning)

**The mistake:** Writing `<img src="photo.jpg" alt="Photo">` without explicit aspect-ratio `width` and `height` attributes.

**Why it's wrong:** Omitting dimensions causes the browser to render a 0px box initially. When the image downloads, surrounding text jumps down suddenly, creating severe Cumulative Layout Shift (CLS).

*Incorrect:*
```html
<img src="banner.jpg" alt="Banner"> <!-- ❌ Causes page content layout shift on load! -->
```

*Fix:*
```html
<img src="banner.jpg" alt="Banner" width="1200" height="400" loading="lazy">
```

### Mistake 4: Using Images for Native Body Text (Un-Indexable SEO Anti-Pattern)

**The mistake:** Creating a PNG graphic containing text paragraphs instead of writing real HTML text.

**Why it's wrong:** Search engine crawlers and screen readers cannot read text embedded inside flat bitmap image pixels.

*Incorrect:*
```html
<!-- PNG image containing 3 paragraphs of text -->
```

*Fix:*
```html
<p>Write real HTML text paragraph content</p>
```

## 5. Practice Exercises

### Exercise 1: Optimizing Responsive Images with srcset and sizes

**Scenario:** A frontend developer delivers responsive images using `srcset` and `sizes` to supply optimal resolution variants to different screen sizes.

**Requirements:**
1. Create an `<img>` tag with `src` fallback.
2. Add `srcset` specifying pixel width descriptors (`400w`, `800w`).
3. Add `sizes` media conditions.
4. Include `alt`, `width`, and `height`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <img src="images/hero-medium.jpg" srcset="images/hero-small.jpg 400w, images/hero-medium.jpg 800w, images/hero-large.jpg 1200w" sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px" alt="Team collaborating around a conference table with laptops" width="800" height="450" loading="lazy">
> ```
>
> #### Technical Explanation
>
> 1. **The `<img>` Element**: Embeds an image in the document; void element requiring no closing tag.
> 2. **Responsive `srcset` Descriptors**: Provides a list of image file URLs with width descriptors (`400w`), allowing the browser to select the optimal image for screen resolution.
> 3. **`sizes` Media Layout Hints**: Informs the browser layout engine how wide the image will render at different media query breakpoints.
> 
---

### Exercise 2: Native Lazy Loading & Aspect Ratio Layout Preservation

**Scenario:** Applies performance attributes to prevent Cumulative Layout Shift (CLS) when loading below-the-fold content images.

**Requirements:**
1. Set `loading="lazy"`.
2. Provide explicit `width` and `height` values.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <article class="news-item">
>   <img src="images/article-thumb.jpg" alt="Close-up of keyboard with glowing RGB backlighting" width="300" height="200" loading="lazy">
>   <h3>Next-Gen Hardware Released</h3>
> </article>
> ```
>
> #### Technical Explanation
>
> 1. **`loading="lazy"` Attribute**: Defers fetching off-screen images until they are near the user's scroll viewport.
> 2. **Preventing CLS Layout Shifts**: Specifying `width` and `height` allows modern browsers to calculate intrinsic aspect ratio boxes before image downloads finish.
> 3. **Void Tag Rules**: `<img>` is a void tag; do not write `</img>` or `<img />` in HTML5.
> 
---

### Exercise 3: Accessible Hero Banner Image Implementation

**Scenario:** Implements a high-resolution hero banner with text accessibility and priority loading.

**Requirements:**
1. Set `loading="eager"` or omit for above-the-fold hero images.
2. Ensure descriptive `alt` text.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <header class="hero-header">
>   <img src="images/banner.jpg" alt="Acme Annual Developer Conference 2026 Banner" width="1200" height="400">
>   <h1>Welcome to DevCon 2026</h1>
> </header>
> ```
>
> #### Technical Explanation
>
> 1. **Above-the-Fold Images**: Do NOT lazy-load hero images displayed above the fold; load them eagerly to optimize Largest Contentful Paint (LCP).
> 2. **Alternative Text Quality**: Hero alt text must state the purpose of the banner clearly.
> 3. **Image Sizing Integrity**: Keep aspect ratios consistent between HTML attributes and CSS styling.
## 6. Related Terms
- [`alt` Attribute](alt.md) — The required accessibility attribute for images.
- [`src` Attribute](src.md) — The attribute used to define the image source URL.
- [`<figure>` & `<figcaption>`](figure_figcaption.md) — The semantic containers used to package images and captions.
- [Void Elements (Self-closing Tags)](../level_01/void_elements.md) — The category of tags `<img>` belongs to.
- [`href` Attribute](../level_02/href.md) — The anchor equivalent of `src`.
- [`<iframe>`](iframe.md) — Related concept: `<iframe>`.
- [`<picture>` & Responsive Images](picture_responsive.md) — Related concept: `<picture>` & Responsive Images.
- [`<video>`](video.md) — Related concept: `<video>`.
- [`<map>` & `<area>` (Image Maps)](../level_10/map_area.md) — Related concept: `<map>` & `<area>` (Image Maps).

---

## 7. Key Takeaways
- The `<img>` tag embeds an image into an HTML document.
- It is a void element (no closing tag).
- It requires the `src` attribute to locate the image file.
- It **must** have an `alt` attribute for accessibility and fallback text.
