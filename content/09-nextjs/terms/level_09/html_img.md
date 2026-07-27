# HTML `<img>` Element

> **Level 9 — Built-in Optimizations**
> The standard web markup element used to embed images in HTML documents, which Next.js supercharges to solve layout shifts and load speed problems.

---

## 1. Prerequisites
- [Web Core Vitals (FCP, LCP, CLS, TTFB)](../level_09/web_core_vitals.md) — The performance metrics that image loading directly impacts.

---

## 2. Term Category
- **Optimization**

---

## 3. Environment Context
- **Universal** (Parsed by the server to construct HTML tags and processed by the browser to fetch and render image data).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Images account for a large portion of a web page's total bundle size. While the native HTML `<img>` tag makes rendering images easy, using it in production without optimization causes significant performance issues:
1.  **Layout Shift (CLS):** If you load an image without specifying `width` and `height`, the browser renders a 0-pixel space for it initially. Once the file finishes downloading, it suddenly expands on the page, pushing content down and triggering layout shift.
2.  **Unoptimized File Sizes:** Modern cameras capture images at high resolutions. Serving a raw 5MB PNG file when the user is viewing a small avatar on a mobile screen wastes bandwidth and causes page load delay.
3.  **Lack of Bandwidth Optimization:** Native tags traditionally fetch all images immediately, downloading files that are far down the page (offscreen) before the user even starts scrolling.

---

### (2) Core Concept — Syntax and Attributes
The basic structure of a standard HTML `<img>` tag is:

```html
<img 
  src="/images/banner.jpg" 
  alt="Summer Sale Banner" 
  width="800" 
  height="400"
  loading="lazy"
  decoding="async"
/>
```

Key attributes include:
-   **`src`:** The path pointing to the image file asset.
-   **`alt`:** Description of the image contents (critical for accessibility screen-readers and SEO indexing bots).
-   **`width` & `height`:** Explicit dimensions that instruct the browser to reserve an aspect-ratio placeholder block before the image file is fetched.
-   **`loading="lazy"`:** A modern browser native attribute instructing the browser to defer fetching the image until it is close to entering the viewport.

---

### (3) Transition to Next.js Image Optimization
Next.js replaces the standard `<img>` tag with the `<Image>` component from `next/image`. Under the hood, the Next.js component wraps the standard `<img>` element but automates file conversion (compiling JPEG/PNG to WebP/AVIF), creates custom dynamic source sets (`srcset`), and enforces dimension rules to prevent CLS.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Leaving off the `alt` attribute or providing a generic placeholder name

**The mistake:** Omitting the `alt` property or writing a generic tag:

```html
<!-- BAD: Screen readers cannot describe this image, and SEO bots ignore it -->
<img src="/assets/dog.jpg" />

<!-- BAD: Non-descriptive text -->
<img src="/assets/dog.jpg" alt="image" />
```

**Why it's wrong:** Accessibility checkers will flag your site as non-compliant. Screen-readers for visually impaired users rely on `alt` text to describe the page contents, and search engines index image topics based on these descriptions.

**Golden Rule:** Always declare a descriptive `alt` attribute. If the image is purely decorative (like a background pattern), use `alt=""` so screen readers know they can safely skip it.

---

### Mistake 2: Using Native HTML `<img>` Tags for Large Images (Cumulative Layout Shift CLS)

**The mistake:** Using `<img src="/hero.jpg">` without specifying explicit dimensions or placeholder skeletons.

**Why it's wrong:** Native `<img>` tags load after page layout parsing, causing content below the image to jump down when the image finishes loading (high CLS metric). Use Next.js `<Image />`.

*Incorrect:*
```tsx
<img src="/large-hero.jpg"> <!-- ❌ Causes severe Cumulative Layout Shift (CLS)! -->
```

*Fix:*
```tsx
import Image from 'next/image';
<Image src="/large-hero.jpg" alt="Hero" width={1200} height={600} priority />
```

---

### Mistake 3: Serving Un-Compressed PNG/JPEG Images Without Modern WebP/AVIF Conversion

**The mistake:** Serving raw 5MB PNG images directly to mobile clients using native `<img>` tags.

**Why it's wrong:** Un-compressed PNG files drain mobile bandwidth and slow page load times. Next.js `<Image />` automatically compresses and converts images to WebP/AVIF formats based on browser capabilities.

*Incorrect:*
```tsx
/* Serving raw un-compressed 5MB PNG files via native <img> tags */
```

*Fix:*
```tsx
/* Use next/image for automatic WebP/AVIF format conversion and compression */
```


---

## 6. Practice Exercises

### Exercise 1: Native Lazy Loading

**Problem:** Complete the HTML code below to render an image that pre-reserves an 800x600 space, decodes asynchronously, and defers loading until scrolled close to the viewport:

```html
<!-- Solution: -->
<img 
  src="/assets/gallery-pic.jpg" 
  alt="Scenic mountain view with sunset"
  width="800"
  height="600"
  loading="lazy"
  decoding="async"
/>
```

> [!check]- Answer
> - Use the `loading` and `decoding` attributes to optimize image loading natively.

---

### Exercise 2: Native img vs Next.js Image Comparison

**Problem:** List 3 automated performance benefits provided by `next/image` over native `<img>`.

**Expected output:**
```text
1. Automatic WebP/AVIF format conversion
2. Automatic resizing for different screen resolutions (responsive srcset)
3. Layout shift protection via mandatory width/height or fill layout
```

> [!check]- Answer
> - Automatic WebP/AVIF format conversion.
> - Responsive `srcset` image generation per device size.
> - Prevention of Cumulative Layout Shift (CLS).
> 
> ```text
> WebP/AVIF Compression + Responsive Resizing + CLS Prevention
> ```

---

### Exercise 3: Native img Migration Flag

**Problem:** Which ESLint rule flags usage of native `<img>` tags in Next.js projects?

**Expected output:**
```text
@next/next/no-img-element
```

> [!check]- Answer
> - `@next/next/no-img-element` warns against using native `<img>` tags.
> 
> ```text
> Warning: Do not use <img>. Use Image from 'next/image' instead.
> ```


---

## 7. Related Terms
- [Web Core Vitals (FCP, LCP, CLS, TTFB)](../level_09/web_core_vitals.md) — The performance metrics that image loading directly impacts.
- [`<Image>` Component](../level_09/next_image.md) — Next.js's optimized wrapper.

---

## 8. Key Takeaways
- The native HTML `<img>` tag embeds images on web pages.
- Omitting image dimensions causes Cumulative Layout Shift (CLS) and hurts SEO rankings.
- Use `loading="lazy"` to instruct the browser to defer fetching offscreen images.
- Always write descriptive `alt` attributes for screen-reader accessibility.
- Next.js's `<Image>` component automatically optimizes native image files at build and runtime.
