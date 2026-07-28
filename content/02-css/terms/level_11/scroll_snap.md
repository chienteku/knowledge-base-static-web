# `scroll-behavior` & `scroll-snap`

> **Level 11 — Modern CSS Architecture & Functions**
> CSS properties that control scrolling animations (smooth vs. instant) and enforce snap-to-position behavior for sliders, carousels, and presentation sections directly in the browser's rendering thread.

---

## 1. Prerequisites
- [`overflow` (hidden, scroll, auto, visible)](../../level_02/overflow.md) — Creating scrollable parent containers.

---

## 2. Term Category
- **Visual Effect**

---

## 3. Environment Context
- **Universal Modern Standard** (Runs natively on the browser UI threat. Leverages hardware momentum scrolling to calculate slide intersections without blocking JavaScript processes).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Historically, creating a smooth experience on web applications was difficult:
-   **Anchor Jumps:** Clicking a table-of-contents link would instantly teleport the user down the page, disorienting their reading flow.
-   **Image Sliders:** Creating a carousel (like a Netflix movie row) where columns neatly snap into place required heavy JavaScript scroll listener scripts. These scripts had to intercept mouse wheels, recalculate pixels, and animate slides manually, which caused stuttering and broke native touch gestures on mobile screens.

To solve this, browser makers introduced native scroll controls: **`scroll-behavior`** and **`scroll-snap`**.

---

### (2) Smooth Scrolling: `scroll-behavior`
You can enable page-wide smooth scrolling with a single rule on the root element:

```css
html {
  scroll-behavior: smooth;
}
```

Now, clicking any `<a href="#section-name">` link animates a smooth glide down the page instead of jumping instantly.

---

### (3) CSS Scroll Snapping (Parent & Child)
To build a carousel or slide deck, you configure a parent container and child items:

#### Step 1: Parent Container Configuration
Set the scroll direction (`overflow`), and enable snap behavior using **`scroll-snap-type`**:
-   **`x` or `y`**: The scroll axis.
-   **`mandatory`**: Forces the viewport to snap to the nearest item every single time.
-   **`proximity`**: Only snaps if the user stops scrolling close to a target item.

```css
.carousel-parent {
  overflow-x: auto; /* Allow horizontal scrolling */
  scroll-snap-type: x mandatory; /* Force horizontal snapping */
  display: flex;
}
```

#### Step 2: Child Item Configuration
Define where the item aligns in the viewport when snapped using **`scroll-snap-align`** (`start`, `center`, or `end`):

```css
.carousel-slide {
  scroll-snap-align: center; /* Snap slide center to viewport center */
  flex: 0 0 100%; /* Take up the entire viewport width */
}
```

---

### (4) Code Examples

#### Short Snippet
Vertical snap layout:

```css
.vertical-scroll-deck {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory; /* Snap vertically */
}

.section-slide {
  height: 100vh;
  scroll-snap-align: start; /* Snap top edge to top of window */
}
```

#### Fuller Example (Horizontal Photo Slider)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scroll Snap Carousel</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 40px;
      background-color: #111;
      color: white;
    }

    .gallery-title {
      text-align: center;
      margin-bottom: 20px;
    }

    /* THE PARENT SCROLL CONTAINER */
    .slider {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory; /* horizontal snap */
      gap: 15px;
      padding: 10px;
      border-radius: 8px;
      background-color: #222;
      
      /* Hide scrollbar defaults */
      scrollbar-width: none;
    }

    /* THE CHILDREN SLIDES */
    .slide {
      flex: 0 0 300px;
      height: 200px;
      border-radius: 6px;
      background-color: #444;
      
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: bold;

      /* Snap slide center to slider center */
      scroll-snap-align: center; 
    }

    .slide:nth-child(even) { background-color: #ff007f; }
    .slide:nth-child(odd) { background-color: #00f0ff; }
  </style>
</head>
<body>

  <h2 class="gallery-title">CSS Snap Slider</h2>
  <div class="slider">
    <div class="slide">Slide 1</div>
    <div class="slide">Slide 2</div>
    <div class="slide">Slide 3</div>
    <div class="slide">Slide 4</div>
    <div class="slide">Slide 5</div>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Declaring scroll-snap properties without an overflow value

**The mistake:** Declaring `scroll-snap-type: x mandatory;` on a container but omitting `overflow-x: auto;` or `overflow-x: scroll;`.

**Why it's wrong:** Scroll snapping only triggers when a container is actively scrollable. Without an `overflow` value that enables scrollbars/scrolling, the container is static, rendering the snapping properties useless.

**Fix: Always ensure the parent container has `overflow: auto` or `overflow: scroll` on the desired snapping axis.**

---



### Mistake 2: Forgetting `overflow-x: scroll` (or `auto`) on Scroll Snap Containers

**The mistake:** Setting `scroll-snap-type: x mandatory` without enabling scroll overflow.

**Why it's wrong:** Scroll Snap requires the container to be an active scroll container. Without `overflow-x: auto` or `scroll`, user scrolling and snap behavior cannot trigger.

*Incorrect:*
```css
.carousel { display: flex; scroll-snap-type: x mandatory; } /* ❌ Missing overflow scroll! */
```

*Fix:*
```css
.carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory; /* Scroll container with snap points */
}
```

### Mistake 3: Forgetting `scroll-snap-align` on Child Items inside Scroll Snap Containers

**The mistake:** Setting `scroll-snap-type` on parent container without defining `scroll-snap-align` on child items.

**Why it's wrong:** The parent defines snap TYPE (`x mandatory`), but child items MUST define snap ALIGNMENT (`scroll-snap-align: center` or `start`) to specify snap resting points.

*Incorrect:*
```css
/* Parent has scroll-snap-type, but children lack scroll-snap-align */
```

*Fix:*
```css
.carousel-item {
  scroll-snap-align: center; /* Child snap alignment point */
}
```

## 6. Practice Exercises

### Exercise 1: Landing Presentation Slide Deck

**Problem:** Build a full-screen vertical slide deck. The parent wrapper `.deck` covers the whole viewport (`100vw` by `100vh`) and snaps vertically. Each child section `.deck-slide` matches the viewport size and snaps its top edge to the top of the container. Write the CSS.

**Expected output:**
> [!check]- Answer
> ```css
> .deck {
>   width: 100vw;
>   height: 100vh;
>   overflow-y: scroll;
>   scroll-snap-type: y mandatory;
> }
> 
> .deck-slide {
>   width: 100vw;
>   height: 100vh;
>   scroll-snap-align: start;
> }
> ```
> - Set parent overflow-y and scroll-snap directions.
> - Configure child alignments to match structural boundaries.

---



### Exercise 2: Horizontal Image Carousel Scroll Snap Pattern

**Problem:** Write CSS for `.carousel` (parent) and `.slide` (children) creating smooth horizontal scroll snap alignment.

**Expected output:**
> [!check]- Answer
> ```text
> .carousel { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; } .slide { flex: 0 0 100%; scroll-snap-align: start; }
> ```
> ```css
> .carousel {
>   display: flex;
>   overflow-x: auto;
>   scroll-snap-type: x mandatory;
> }
> .slide {
>   flex: 0 0 100%;
>   scroll-snap-align: start;
> }
> ```
>
> **Explanation:** Combining parent `scroll-snap-type` and child `scroll-snap-align` builds zero-JS touch carousels.

---

### Exercise 3: mandatory vs proximity Snap Strictness

**Problem:** Compare `scroll-snap-type: x mandatory` vs `scroll-snap-type: x proximity`.

**Expected output:**
> [!check]- Answer
> ```text
> mandatory forces scroll landing on a snap point strictly; proximity snaps ONLY when scrolling close to a snap point.
> ```
> ```text
> mandatory forces scroll landing on a snap point strictly; proximity snaps ONLY when scrolling close to a snap point.
> ```
>
> **Explanation:** `mandatory` enforces strict snap points; `proximity` allows free scrolling until near points.

## 7. Related Terms
- [`overflow`](../../level_02/overflow.md) — The parent scrolling trigger.

---

## 8. Key Takeaways
- `scroll-behavior: smooth` animates anchor link jumps smoothly.
- Scroll Snapping locks viewports to specific slide boundaries during scroll deceleration.
- Set `scroll-snap-type` on the scrollable parent container.
- Set `scroll-snap-align` on the child elements to configure snap offsets.
- Always combine scroll snapping with active parent `overflow` scrolling properties.
