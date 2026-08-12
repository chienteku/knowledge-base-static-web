# `<source>` Element

> **Level 3 — Media & Embedding**
> A void element nested inside media tags to specify alternative source files for browser compatibility.

---

## 1. Prerequisites
- [`<audio>`](audio.md) — Sound media player containers.
- [`<video>`](video.md) — Video media player containers.
- [Void Elements (Self-closing Tags)](../level_01/void_elements.md) — Since `<source>` is a self-closing element.

---

## 2. Term Category

**Media Element (Modern Browsers  .)**: `<source>` Element is a fundamental concept in this technology stack. **Level 3 — Media & Embedding**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Not all web browsers support the same audio and video file formats. For example:
-   Chrome and Firefox support **WebM** video files.
-   Safari and Internet Explorer heavily support **MP4** video files.
-   Opera supports **Ogg** audio files.

If you embed video using the standard `src` attribute on the outer tag, you can only specify a single file:
```html
<video src="movie.mp4" controls></video>
```
If a user visits your page with a browser that doesn't support MP4, they will see a broken media error. 

To solve this, HTML5 designed the **`<source>` element**. Instead of putting a single source on the outer tag, you leave the outer tag empty and nest multiple `<source>` tags inside it. The browser reads the list from top to bottom and loads the **first format it supports**, completely skipping the rest.

---

### (2) The `type` Attribute
Always pair the `<source>` tag with the `type` attribute, which specifies the file's **MIME type** (e.g. `video/mp4`, `audio/mpeg`). 

If you omit the `type` attribute, the browser has to start downloading the file over the network just to inspect it and see if it can play it. Providing the `type` allows the browser to instantly skip formats it cannot decode, saving user bandwidth.

---

### (3) Code Examples

#### Short Snippet
Nesting alternative sources inside a video container:

```html
<video controls>
  <!-- Browser checks this first -->
  <source src="clip.webm" type="video/webm">
  <!-- Browser falls back to this second -->
  <source src="clip.mp4" type="video/mp4">
</video>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Native Media Players</title>
</head>
<body>

  <h1>Audio & Video Showcases</h1>

  <h2>1. Audio Player (Multi-format)</h2>
  <audio controls>
    <!-- Ogg files are highly compressed and open-source -->
    <source src="audio/podcast.ogg" type="audio/ogg">
    
    <!-- MP3 is universally supported as a safe fallback -->
    <source src="audio/podcast.mp3" type="audio/mpeg">
    
    <!-- Fallback if browser is too old for HTML5 media -->
    Your browser does not support playing this audio file.
  </audio>

  <h2>2. Video Player (Multi-format)</h2>
  <video controls width="600" poster="video-cover.jpg">
    <!-- WebM has excellent quality at small file sizes -->
    <source src="video/animation.webm" type="video/webm">
    
    <!-- MP4 fallback -->
    <source src="video/animation.mp4" type="video/mp4">
    
    Your browser does not support playing this video.
  </video>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to write a closing tag for `<source>`

**The mistake:** Writing `</source>` tags:

```html
<!-- BAD: Do not close void source elements -->
<video controls>
  <source src="movie.mp4" type="video/mp4"></source>
</video>
```

**Why it's wrong:** The `<source>` element is a void element. It has no content or child elements of its own, so writing a closing tag violates HTML5 standards.

---



### Mistake 2: Omitting the `type` Attribute on Media `<source>` Tags

**The mistake:** Writing `<source src="video.webm">` without specifying `type="video/webm"`.

**Why it's wrong:** Without the `type` mime attribute, browsers must download initial video file headers to check compatibility. Specifying `type` lets browsers skip unsupported codecs without network downloads.

*Incorrect:*
```html
<source src="movie.webm"> <!-- ❌ Missing mime type attribute -->
```

*Fix:*
```html
<source src="movie.webm" type="video/webm"> <!-- Explicit mime type -->
```

### Mistake 3: Using `src` Instead of `srcset` inside `<picture>` Source Elements

**The mistake:** Writing `<picture><source src="image.webp"></picture>`.

**Why it's wrong:** Inside `<picture>`, `<source>` elements require the `srcset` attribute (e.g. `srcset="image.webp"`), NOT `src`! Using `src` on `<picture><source>` is invalid HTML.

*Incorrect:*
```html
<picture><source src="large.webp"></picture> <!-- ❌ Invalid src attribute on picture source! -->
```

*Fix:*
```html
<picture><source srcset="large.webp"></picture> <!-- Correct srcset attribute -->
```

## 5. Practice Exercises

### Exercise 1: Multi-Format Media Source Selection for Video Elements

**Scenario:** Embeds a video player supplying WebM and MP4 source tracks via `<source>` tags.

**Requirements:**
1. Place `<source>` tags inside `<video>`.
2. Set `src` and `type` attributes on each `<source>`.
3. Order formats from modern (WebM) to universal (MP4).

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <video controls width="640" height="360" poster="images/video-poster.jpg">
>   <source src="videos/presentation.webm" type="video/webm">
>   <source src="videos/presentation.mp4" type="video/mp4">
>   <p>Your browser does not support HTML5 video. View <a href="videos/presentation.mp4">direct MP4 file</a>.</p>
> </video>
> ```
>
> #### Technical Explanation
>
> 1. **The `<source>` Void Element**: `<source>` is a void element specifying media resources for `<video>`, `<audio>`, or `<picture>` parents.
> 2. **The `type` MIME Attribute**: Informs media engine of file codec (`video/webm`, `video/mp4`) so unsupported formats are skipped without downloading.
> 3. **Sequential Evaluation**: Browsers evaluate `<source>` tags top-to-bottom and select the first supported media file.
> 
---

### Exercise 2: Media Query Source Conditions for Responsive Picture Elements

**Scenario:** Uses `<source>` inside `<picture>` to switch image sources based on screen width breakpoints.

**Requirements:**
1. Use `<source media="(min-width: 1024px)" srcset="...">`.
2. Use `<source media="(min-width: 600px)" srcset="...">`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <picture>
>   <source media="(min-width: 1024px)" srcset="images/banner-desktop.jpg">
>   <source media="(min-width: 600px)" srcset="images/banner-tablet.jpg">
>   <img src="images/banner-mobile.jpg" alt="Seasonal Promotional Offer" width="600" height="300">
> </picture>
> ```
>
> #### Technical Explanation
>
> 1. **`media` Attribute Queries**: Accepts standard CSS media query strings to conditionally load media assets.
> 2. **`srcset` on Source**: Specifies image file paths within `<picture>` element contexts.
> 3. **No Trailing Slash**: `<source>` is a void tag; do not write `</source>` or `<source />` in HTML5.
> 
---

### Exercise 3: Audio Source Fallbacks for Legacy Browser Compatibility

**Scenario:** Provides MP3 and OGG audio source tracks inside an `<audio>` tag.

**Requirements:**
1. Provide OGG and MP3 `<source>` tags.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <audio controls>
>   <source src="audio/track.ogg" type="audio/ogg">
>   <source src="audio/track.mp3" type="audio/mpeg">
> </audio>
> ```
>
> #### Technical Explanation
>
> 1. **Codec Compatibility**: OGG offers open-source compression; MP3 provides universal browser legacy support.
> 2. **Network Savings**: Browser downloads ONLY the single chosen media source file.
> 3. **Order Importance**: Place optimized modern formats first.
## 6. Related Terms
- [`<audio>`](audio.md) — The audio container element.
- [`<video>`](video.md) — The video container element.
- [Void Elements (Self-closing Tags)](../level_01/void_elements.md) — The general category of single-tag elements.
- [`<picture>` & Responsive Images](picture_responsive.md) — Related concept: `<picture>` & Responsive Images.

---

## 7. Key Takeaways
- `<source>` is a void element used inside `<audio>`, `<video>`, and `<picture>`.
- It lets you specify multiple format fallbacks to solve browser compatibility issues.
- Browsers read sources sequentially and play the first supported format.
- Always include the `type` attribute to prevent unnecessary file downloads.
- Never write a closing `</source>` tag.
