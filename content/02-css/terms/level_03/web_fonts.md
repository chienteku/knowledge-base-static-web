# `@font-face` & Web Fonts (Google Fonts)

> **Level 3 — Typography & Colors**
> Typography techniques and CSS at-rules used to load custom font files from remote servers (like Google Fonts) or self-hosted directories, ensuring consistent typefaces across all user devices.

---

## 1. Prerequisites
- [`font-family`](../level_03/font_family.md) — The styling property that utilizes these custom typefaces.

---

## 2. Term Category
- **Typography / CSS At-Rule**

---

## 3. Environment Context
- **Universal Browser Support** (Supported natively. The browser initiates background asset downloading operations when it parses custom font source URLs).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, a browser can only display a font if it is **already installed** on the user's computer. 

If you set `font-family: "Helvetica";`, but your user is browsing on a Windows machine that doesn't have Helvetica pre-installed, the browser will ignore your design choices and display its default system font instead.

This limitation restricted web design for decades to a tiny group of "web-safe fonts" (like Arial, Georgia, and Times New Roman).

To solve this, the W3C introduced **Web Fonts** and the **`@font-face` at-rule**. 

Instead of relying on what is installed on the user's hard drive, the browser downloads the custom font file on the fly while it loads the page.

---

### (2) Loading Web Fonts: Two Strategies

There are two primary methods to load custom fonts:

#### Method 1: Google Fonts (Third-Party CDN)
The easiest and most common strategy. Google hosts thousands of free open-source fonts on its servers.
-   **How it works:** You add a `<link>` stylesheet tag to your HTML `<head>` pointing to Google Fonts. This stylesheet declares the font configurations, and the browser handles the download.

#### Method 2: Self-Hosting (`@font-face`)
If you buy a commercial font or want to serve the files directly from your own server for speed and privacy:
-   **How it works:** You upload the font file (best format: **`.woff2`** - Web Open Font Format 2) to your server, and write a custom `@font-face` declaration block at the very top of your CSS file.

---

### (3) Preventing Invisible Text (`font-display: swap`)
When a user visits your site on a slow mobile connection, it takes time to download your custom font file. 

By default, some browsers will keep all text completely invisible for up to three seconds while they wait for the font file (a glitch called **FOIT - Flash of Invisible Text**).

To prevent this, you should always set **`font-display: swap;`** inside your `@font-face` block. 

This tells the browser to instantly draw the text using a system fallback font (like Arial), and swap it to your custom font the millisecond the download completes, keeping content readable instantly.

---

### (4) Code Examples

#### Short Snippet
Custom `@font-face` declaration:

```css
/* 1. Define the custom font blueprint */
@font-face {
  font-family: 'MyCustomFont';
  src: url('fonts/custom-font.woff2') format('woff2');
  font-display: swap; /* Prevent invisible text */
}

/* 2. Apply it in rulesets */
body {
  font-family: 'MyCustomFont', sans-serif;
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Custom Font Integration</title>

  <!-- Google Fonts import for 'Roboto' -->
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">

  <style>
    /* Self-hosted @font-face configuration */
    @font-face {
      font-family: 'BrandHeader';
      src: url('/assets/fonts/brand-heading.woff2') format('woff2'),
           url('/assets/fonts/brand-heading.woff') format('woff'); /* WOFF fallback for IE */
      font-weight: bold;
      font-style: normal;
      font-display: swap;
    }

    body {
      /* Applies Google Font Roboto */
      font-family: 'Roboto', sans-serif;
    }

    h1 {
      /* Applies self-hosted BrandHeader */
      font-family: 'BrandHeader', Arial, sans-serif;
    }
  </style>
</head>
<body>

  <h1>Exclusive Brand Title</h1>
  <p>This paragraph is styled cleanly using the Roboto font fetched from Google Fonts.</p>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Leaving out `font-display: swap`

**The mistake:** Declaring custom fonts without specifying the render display behavior:

```css
/* BAD: Can cause text to remain invisible for seconds on slow networks! */
@font-face {
  font-family: 'SlowFont';
  src: url('heavy-font.woff2') format('woff2');
}
```

**Why it's wrong:** Without `swap`, browsers hide the text completely until the font downloads. If the connection drops or is slow, the user is left looking at an empty screen, assuming the site has crashed.

---



### Mistake 2: Omitting `font-display: swap` in `@font-face` Definitions (Flash of Invisible Text / FOIT)

**The mistake:** Importing custom web fonts without declaring `font-display: swap`.

**Why it's wrong:** Without `font-display: swap`, browsers hide text for up to 3 seconds while downloading custom web font files over slow networks (Flash of Invisible Text / FOIT).

*Incorrect:*
```css
@font-face {
  font-family: 'Custom';
  src: url('custom.woff2'); /* ❌ Hides text while loading over network! */
}
```

*Fix:*
```css
@font-face {
  font-family: 'Custom';
  src: url('custom.woff2');
  font-display: swap; /* Immediately displays fallback font while loading */
}
```

### Mistake 3: Loading Obsolete Font File Formats (`.ttf`, `.eot`) Without Preceding `.woff2`

**The mistake:** Serving heavy `.ttf` font files instead of compressed `.woff2` files.

**Why it's wrong:** WOFF2 format offers 30% superior compression compared to WOFF and TTF, and is natively supported across all modern browsers. Always list `.woff2` first.

*Incorrect:*
```css
/* Loading 500KB TTF file as primary web font format */
```

*Fix:*
```css
src: url('font.woff2') format('woff2'), url('font.woff') format('woff');
```

## 6. Practice Exercises

### Exercise 1: Custom Font Hook

**Problem:** Write the `@font-face` declaration to load a self-hosted bold font. The font family name is "Noir", the file path is "/fonts/noir-bold.woff2", and the format is "woff2". Include the standard rule to prevent invisible text.

**Expected output:**
> [!check]- Answer
> ```css
> @font-face {
>   font-family: 'Noir';
>   src: url('/fonts/noir-bold.woff2') format('woff2');
>   font-weight: bold;
>   font-style: normal;
>   font-display: swap;
> }
> ```
> - Define the `font-family` name inside quotes or matching text.
> - Call `url(...)` with the exact path.
> - Include `font-display`.

---



### Exercise 2: @font-face Rule Template

**Problem:** Write `@font-face` rule defining `'Inter'` font from `inter.woff2` with `font-display: swap`.

**Expected output:**
> [!check]- Answer
> ```text
> @font-face { font-family: 'Inter'; src: url('inter.woff2') format('woff2'); font-display: swap; }
> ```
> ```css
> @font-face {
>   font-family: 'Inter';
>   src: url('inter.woff2') format('woff2');
>   font-display: swap;
> }
> ```
>
> **Explanation:** `@font-face` binds custom web font files to family names.

---

### Exercise 3: Font Preloading Technique

**Problem:** Write `<link>` tag in HTML `<head>` preloading critical web font `inter.woff2`.

**Expected output:**
> [!check]- Answer
> ```text
> <link rel="preload" href="inter.woff2" as="font" type="font/woff2" crossorigin>
> ```
> ```html
> <link rel="preload" href="inter.woff2" as="font" type="font/woff2" crossorigin>
> ```
>
> **Explanation:** `rel="preload"` with `crossorigin` initiates high-priority early font network fetches.

## 7. Related Terms
- [`font-family`](../level_03/font_family.md) — The styling property that applies these fonts.
- [`@import`](../../level_10/import.md) — The CSS at-rule used to import stylesheets (including fonts) into CSS directly.

---

## 8. Key Takeaways
- Web Fonts allow websites to display custom branded typography on any device.
- Use Google Fonts to load typefaces directly via external CDN links.
- Use `@font-face` to self-host font files on your own server.
- The `.woff2` format is the modern compressed standard for web fonts.
- Always include `font-display: swap;` to prevent FOIT (Flash of Invisible Text) on slow connections.
