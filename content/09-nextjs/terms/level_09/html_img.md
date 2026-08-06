# HTML `<img>` Element

> **Level 9 — Built-in Optimizations**
> The standard web markup element used to embed images in HTML documents, which Next.js supercharges to solve layout shifts and load speed problems.

---

## 1. Prerequisites
- [Web Core Vitals (FCP, LCP, CLS, TTFB)](web_core_vitals.md) — The performance metrics that image loading directly impacts.

---

## 2. Term Category

**Performance & Optimization** (Native HTML Image Comparison): Native `<img>` tags render standard browser image elements without automatic WebP conversion, responsive resizing, or layout shift prevention.



---

## 3. Explanation

### Environment Context
- **Universal** (Parsed by the server to construct HTML tags and processed by the browser to fetch and render image data).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Refactoring Native `<img>` to `<Image>`

**Scenario:**
Refactor an unoptimized native `<img src="/banner.jpg" />` element into Next.js `<Image>`.

**Requirements:**
1. Import `Image` from `next/image`.
2. Specify width, height, and alt attributes.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> // ❌ UNOPTIMIZED NATIVE HTML:
> // <img src="/banner.jpg" alt="Banner" width="1200" height="400" />

// ✅ OPTIMIZED NEXT.JS IMAGE:
import Image from "next/image";

export default function Banner() {
  return (
    <Image
      src="/banner.jpg"
      alt="Hero Banner"
      width={1200}
      height={400}
      priority
      className="w-full h-auto"
    />
  );
}
```

> #### Technical Explanation
>
> 1. Native `<img>` tags load original uncompressed image files, increasing bandwidth and page load times.
> 2. Next.js `<Image>` converts images to modern WebP/AVIF formats on-the-fly and generates responsive srcsets.
> 3. Prevents Cumulative Layout Shift (CLS) web vital penalties.

---

### Exercise 2: Comparative Performance Audit (Native vs `<Image>`)

**Scenario:**
Formulate a comparative performance matrix contrasting native `<img>` against `<Image>`.

**Requirements:**
1. Contrast format compression, CLS, LCP preloading, and lazy loading.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Image Component Performance Matrix:
> - Native <img>: No auto-format conversion (raw PNG/JPEG), manual srcset, causes CLS if dimensions are missing, no automatic blur placeholders.
> - Next.js <Image>: Automatic WebP/AVIF conversion, automatic viewport srcset, zero CLS via aspect ratio reservation, automatic blur placeholders.
> ```

> #### Technical Explanation
>
> 1. Native images impact Web Core Vitals scores (LCP, CLS).
> 2. `<Image>` optimizes image delivery automatically at the server/CDN edge.
> 3. Mandatory performance optimization standard.

---

### Exercise 3: Auditing Exceptions for Native `<img>` Usage

**Scenario:**
Identify valid edge-case scenarios where native `<img>` elements are preferred over `<Image>` (e.g. SVG icons or external user avatars).

**Requirements:**
1. Use native `<img>` for raw inline SVG vectors.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> export default function SvgIcon() {
>   // Vector SVGs do NOT benefit from raster WebP compression or image optimization servers
>   return <img src="/icon.svg" alt="Vector Icon" width="24" height="24" />;
> }
> ```

> #### Technical Explanation
>
> 1. SVG images are XML vector graphics that cannot be compressed into WebP/AVIF raster formats.
> 2. Passing SVGs to image optimization endpoints adds unnecessary server CPU processing.
> 3. Native `<img>` is acceptable for small SVG vectors or micro-data URI images.

---




---

## 6. Related Terms
- [Web Core Vitals (FCP, LCP, CLS, TTFB)](web_core_vitals.md) — The performance metrics that image loading directly impacts.
- [`<Image>` Component](next_image.md) — Next.js's optimized wrapper.

---

## 7. Key Takeaways
- The native HTML `<img>` tag embeds images on web pages.
- Omitting image dimensions causes Cumulative Layout Shift (CLS) and hurts SEO rankings.
- Use `loading="lazy"` to instruct the browser to defer fetching offscreen images.
- Always write descriptive `alt` attributes for screen-reader accessibility.
- Next.js's `<Image>` component automatically optimizes native image files at build and runtime.
