# `overflow` (hidden, scroll, auto, visible)

> **Level 2 — The Box Model**
> The layout property that controls what happens when an element's child content is physically larger than the parent container's defined width and height.

---

## 1. Prerequisites
- [The Box Model (Concept)](box_model.md) — The bounding box container.
- [Width / Height](width_height.md) — The size constraints that trigger overflow conflicts.
---

## 2. Term Category
- **Layout Property**

---

## 3. Environment Context
- **Universal Browser Support** (Understood natively. Intercepts mouse scroll inputs and trackpad gesture hooks when scroll containers are generated).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Normally, block-level elements expand in height to fit whatever content you put inside them. 

But what if you explicitly limit the size of a container—for instance, creating a sidebar that is exactly `300px` tall—and insert a long list of links? 

The content will exceed the `300px` height limit. 

By default, the browser simply lets the content spill out. The links will print right over the border, overlapping with text below the sidebar and creating a messy layout.

The W3C created the **`overflow`** property to give developers control over this spilling content. You can hide the excess content, let it spill out, or turn the element into a mini scrollable window.

---

### (2) The Four Overflow Values

#### 1. `visible` (Default)
The content is not clipped. It overflows the box's boundaries and renders on top of surrounding elements.

#### 2. `hidden`
The content is clipped at the border edge. Any content that spills out is sliced off and remains completely invisible. No scrollbars are provided.

#### 3. `scroll`
The content is clipped. The browser **always** displays horizontal and vertical scrollbars, even if the text fits perfectly.

#### 4. `auto` (Recommended for scroll panels)
The content is clipped. The browser dynamically adds scrollbars **only if** the content is large enough to overflow the container.

---

### (3) Directional Scrollers (`overflow-x` and `overflow-y`)
You can control the horizontal and vertical behaviors separately using:
-   **`overflow-x`**: Controls left-to-right spill (e.g. `overflow-x: scroll;` for an image gallery carousel).
-   **`overflow-y`**: Controls top-to-bottom spill (e.g. `overflow-y: auto;` for a scrollable chat feed).

---

### (4) Code Examples

#### Short Snippet
Creating a scrollable container:

```css
.scroll-box {
  width: 300px;
  height: 200px;
  /* Only show scrollbars if text overflows */
  overflow: auto; 
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Overflow Property Demos</title>
  <style>
    .card {
      width: 200px;
      height: 150px;
      border: 2px solid black;
      margin: 20px;
      float: left;
      background-color: #f9f9f9;
    }

    .visible-card { overflow: visible; }
    .hidden-card  { overflow: hidden; }
    .auto-card    { overflow: auto; }
  </style>
</head>
<body>

  <!-- Case 1: Spills out onto page -->
  <div class="card visible-card">
    <h3>Visible</h3>
    <p>This is a lot of text that will eventually overflow the card boundaries and spill out onto the white page background below...</p>
  </div>

  <!-- Case 2: Clipped off and lost -->
  <div class="card hidden-card">
    <h3>Hidden</h3>
    <p>This is a lot of text that will eventually overflow the card boundaries and spill out onto the white page background below...</p>
  </div>

  <!-- Case 3: Clean inner scrolling scrollbar -->
  <div class="card auto-card">
    <h3>Auto Scroll</h3>
    <p>This is a lot of text that will eventually overflow the card boundaries and spill out onto the white page background below...</p>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `overflow: scroll` instead of `overflow: auto`

**The mistake:** Using `scroll` for a generic card container and seeing empty, disabled grey scrollbar tracks cluttering the design when the text is short:

```css
/* BAD: Windows and Linux browsers will draw empty scroll bars even if empty! */
.profile-card {
  height: 150px;
  overflow: scroll;
}
```

**Why it's wrong:** The `scroll` value forces scrollbars to display permanently. On operating systems that do not use overlay scrollbars (like Windows and Linux), this draws raw, non-functional scroll tracks that ruin the visual design. 

**Fix: Always use `auto` to only draw scrollbars when they are needed.**

---

### Mistake 2: Accidentally clipping absolutely positioned children
If you set `overflow: hidden` on a parent element, it will clip **any** child that extends past the border. If you have an absolute tooltip or dropdown menu inside the box, the tooltip will be cut in half at the border, rendering it useless.

---



### Mistake 3: Using `overflow: hidden` Leading to Unintentional Text Truncation Without Scrollbars

**The mistake:** Applying `overflow: hidden` to containers with dynamic text content.

**Why it's wrong:** `overflow: hidden` clips overflowing content permanently with zero scrollbars, making truncated text unreadable on mobile devices. Use `overflow: auto`.

*Incorrect:*
```css
.card { height: 200px; overflow: hidden; } /* ❌ Truncates text permanently! */
```

*Fix:*
```css
.card { max-height: 200px; overflow: auto; } /* Shows scrollbars only when needed */
```

### Mistake 4: Creating Unwanted Horizontal Scrollbars (`overflow-x: scroll`)

**The mistake:** Using `overflow: scroll` instead of `overflow: auto`.

**Why it's wrong:** `overflow: scroll` forces permanent scrollbars even when content fits inside the container. Use `overflow: auto` so scrollbars appear ONLY when content overflows.

*Incorrect:*
```css
div { overflow: scroll; } /* ❌ Displays disabled scrollbars when content fits */
```

*Fix:*
```css
div { overflow: auto; } /* Scrollbars appear dynamically on overflow */
```

## 6. Practice Exercises

### Exercise 1: Terms and Conditions Box

**Problem:** Build the CSS ruleset for a terms-and-conditions agreement box. The box must be exactly `400px` wide and `250px` tall. The layout must prevent horizontal scrolling, but must display a vertical scrollbar if the legal text overflows.

**Expected output:**
> [!check]- Answer
> ```css
> .terms-box {
>   width: 400px;
>   height: 250px;
>   overflow-x: hidden;
>   overflow-y: auto;
> }
> ```
> - Split the overflow rules using `overflow-x` and `overflow-y`.
> - Disable horizontal scrolling using `hidden`.
> - Enable dynamic vertical scrolling using `auto`.

---



### Exercise 2: Overflow Property Values Matrix

**Problem:** Match `overflow` value to behavior:
1. `visible` 
2. `hidden` 
3. `scroll` 
4. `auto` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Content spills outside container (default)
> 2. Clips overflow content with no scrollbars
> 3. Always displays scrollbars regardless of content size
> 4. Adds scrollbars dynamically ONLY when content overflows
> ```
> ```text
> 1. visible -> Content spills outside container (default)
> 2. hidden -> Clips overflow content with no scrollbars
> 3. scroll -> Always displays scrollbars
> 4. auto -> Displays scrollbars only when content overflows
> ```
>
> **Explanation:** `overflow` controls container clipping and scrollbar rendering.

---

### Exercise 3: Single-Line Text Ellipsis Truncation

**Problem:** Write 3 CSS properties required to truncate long single-line text with an ellipsis (`...`).

**Expected output:**
> [!check]- Answer
> ```text
> white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
> ```
> ```css
> .truncate {
>   white-space: nowrap;
>   overflow: hidden;
>   text-overflow: ellipsis;
> }
> ```
>
> **Explanation:** Text ellipsis truncation requires disabling line wrap, hiding overflow, and setting `text-overflow: ellipsis`.

## 7. Related Terms
- [Width / Height](width_height.md) — The size triggers.
- [`text-overflow` & `overflow-wrap`](../level_07/text_overflow.md) — Adding ellipses (`...`) to clipped text.
- [`z-index`](../level_04/z_index.md) — Layers which can be clipped by overflow settings.
- [Border](border.md) — Related concept: Border.
- [`box-sizing: border-box`](box_sizing.md) — Related concept: `box-sizing: border-box`.
- [Padding](padding.md) — Related concept: Padding.
- [`position: sticky`](../level_04/position_sticky.md) — Related concept: `position: sticky`.
- [`max-width` & `min-height` (Fluidity)](../level_08/max_width.md) — Related concept: `max-width` & `min-height` (Fluidity).
- [`scroll-behavior` & `scroll-snap`](../level_11/scroll_snap.md) — Related concept: `scroll-behavior` & `scroll-snap`.
---

## 8. Key Takeaways
- The `overflow` property manages content that exceeds its container's size.
- `visible` (default) lets content spill out; `hidden` cuts it off invisibly.
- `auto` adds scrollbars dynamically only when the content overflows.
- `scroll` forces scrollbars to render permanently, even if they aren't needed.
- Use `overflow-x` and `overflow-y` to control horizontal and vertical scrollbars independently.
- Be careful with `overflow: hidden` as it will cut off absolute menus and tooltips.
