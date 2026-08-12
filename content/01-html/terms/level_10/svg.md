# `<svg>` (Scalable Vector Graphics)

> **Level 10 — Canvas, SVG & Storage**
> An XML-based markup language for describing two-dimensional vector graphics directly in HTML.

---

## 1. Prerequisites
- [`<canvas>`](canvas.md) — The raster-based alternative to SVG.
- [DOM (Document Object Model)](../level_09/dom.md) — Unlike `<canvas>`, `<svg>` elements become actual DOM nodes!

---

## 2. Term Category

**Graphic Element (HTML5 Standard)**: `<svg>` (Scalable Vector Graphics) is a fundamental concept in this technology stack. **Level 10 — Canvas, SVG & Storage**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
There are two ways to draw images on a computer: **Raster** (like JPG or Canvas), which uses a grid of tiny colored squares (pixels), and **Vector** (like SVG), which uses mathematical formulas to draw lines and curves.
If you zoom in on a JPG or a `<canvas>`, it gets pixelated and blurry. If you zoom in on a Vector graphic, it recalculates the math and stays perfectly crisp at infinite sizes.
The W3C adopted `<svg>` into HTML5 so developers could draw shapes, logos, and icons using mathematical HTML-like tags (e.g., `<circle>`, `<rect>`, `<path>`). Because the SVG shapes are written in code, they are incredibly lightweight, they scale perfectly on high-resolution Retina displays, and you can easily style them using standard CSS (like changing the `fill` color on hover).

### (2) Reality Metaphor
A JPG or `<canvas>` is like a mosaic made of thousands of tiny colored tiles. If you try to make the mosaic bigger, the tiles just look huge and blocky.
An `<svg>` is like a geometry textbook. It doesn't contain tiles; it contains instructions like "Draw a circle with a radius of 5, then color it red." No matter how big you print the textbook, the instructions draw a perfect circle.

### (3) Code Examples

#### Short Snippet
```html
<!-- Drawing a perfect green circle -->
<svg width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="green" />
</svg>
```

#### Fuller Example
```html
<!-- An SVG containing a rectangle and text -->
<svg width="200" height="200" viewBox="0 0 200 200">
  <!-- A blue square with rounded corners -->
  <rect x="10" y="10" width="100" height="100" rx="15" fill="blue" />
  
  <!-- SVGs can even contain text that is perfectly scalable and selectable! -->
  <text x="20" y="60" fill="white" font-size="20">Hello</text>
</svg>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Canvas when you should use SVG (or vice versa)

**The mistake:** Trying to build a massive video game with 10,000 moving particles using `<svg>`, or trying to draw a simple company logo using `<canvas>`.

**Why it's wrong:** You must pick the right tool for the job based on how the DOM works.
- **SVG**: Every shape inside an SVG (like `<circle>`) becomes a live node in the DOM. This is great because you can attach CSS hover effects or JavaScript click events to them! However, if you try to draw 10,000 moving particles, you will create 10,000 DOM nodes, and the browser will crash. **Use SVG for icons, logos, and simple interactive charts.**
- **Canvas**: The canvas is a single DOM node. JavaScript just paints raw pixels on it and immediately forgets about them. It is incredibly fast. **Use Canvas for video games, particle effects, and pixel manipulation.**

---



### Mistake 2: Embedding Inline `<svg>` Tags Without `viewBox` Attributes (Scaling Failure)

**The mistake:** Creating an `<svg width="100" height="100">` omitting the `viewBox` attribute.

**Why it's wrong:** Without `viewBox="0 0 100 100"`, SVG vector graphics cannot scale responsively when CSS changes container width/height.

*Incorrect:*
```html
<svg width="100" height="100"></svg> <!-- ❌ Cannot scale responsively! -->
```

*Fix:*
```html
<svg viewBox="0 0 100 100" width="100" height="100"></svg> <!-- Scales perfectly -->
```

### Mistake 3: Using `<img>` Tags for SVGs When CSS Color Customization (`fill`, `stroke`) Is Needed

**The mistake:** Loading `<img src="icon.svg">` expecting CSS `fill: red;` to change icon color.

**Why it's wrong:** SVGs loaded via `<img>` tags are isolated bitmap renders. CSS stylesheets cannot reach inside `<img>` tags to modify SVG `fill` or `stroke` properties. Use inline `<svg>`.

*Incorrect:*
```html
<img src="icon.svg" class="red-icon"> <!-- ❌ CSS fill: red is ignored on img tags! -->
```

*Fix:*
```html
<svg class="icon"><use href="#icon-id"></use></svg> <!-- CSS can style fill/stroke -->
```



### Mistake 4: Embedding Inline `<svg>` Tags Without `viewBox` Attributes (Scaling Failure)

**The mistake:** Creating an `<svg width="100" height="100">` omitting the `viewBox` attribute.

**Why it's wrong:** Without `viewBox="0 0 100 100"`, SVG vector graphics cannot scale responsively when CSS changes container width/height.

*Incorrect:*
```html
<svg width="100" height="100"></svg> <!-- ❌ Cannot scale responsively! -->
```

*Fix:*
```html
<svg viewBox="0 0 100 100" width="100" height="100"></svg> <!-- Scales perfectly -->
```

### Mistake 5: Using `<img>` Tags for SVGs When CSS Color Customization (`fill`, `stroke`) Is Needed

**The mistake:** Loading `<img src="icon.svg">` expecting CSS `fill: red;` to change icon color.

**Why it's wrong:** SVGs loaded via `<img>` tags are isolated bitmap renders. CSS stylesheets cannot reach inside `<img>` tags to modify SVG `fill` or `stroke` properties. Use inline `<svg>`.

*Incorrect:*
```html
<img src="icon.svg" class="red-icon"> <!-- ❌ CSS fill: red is ignored on img tags! -->
```

*Fix:*
```html
<svg class="icon"><use href="#icon-id"></use></svg> <!-- CSS can style fill/stroke -->
```



### Mistake 6: Embedding Inline `<svg>` Tags Without `viewBox` Attributes (Scaling Failure)

**The mistake:** Creating an `<svg width="100" height="100">` omitting the `viewBox` attribute.

**Why it's wrong:** Without `viewBox="0 0 100 100"`, SVG vector graphics cannot scale responsively when CSS changes container width/height.

*Incorrect:*
```html
<svg width="100" height="100"></svg> <!-- ❌ Cannot scale responsively! -->
```

*Fix:*
```html
<svg viewBox="0 0 100 100" width="100" height="100"></svg> <!-- Scales perfectly -->
```

### Mistake 7: Using `<img>` Tags for SVGs When CSS Color Customization (`fill`, `stroke`) Is Needed

**The mistake:** Loading `<img src="icon.svg">` expecting CSS `fill: red;` to change icon color.

**Why it's wrong:** SVGs loaded via `<img>` tags are isolated bitmap renders. CSS stylesheets cannot reach inside `<img>` tags to modify SVG `fill` or `stroke` properties. Use inline `<svg>`.

*Incorrect:*
```html
<img src="icon.svg" class="red-icon"> <!-- ❌ CSS fill: red is ignored on img tags! -->
```

*Fix:*
```html
<svg class="icon"><use href="#icon-id"></use></svg> <!-- CSS can style fill/stroke -->
```

## 5. Practice Exercises

### Exercise 1: CSS Interaction

**Problem:** How could you use standard CSS to make an SVG circle turn red when the user hovers over it with their mouse?

**Expected output:**
> [!check]- Answer
> ```css
> /* Because SVGs are in the DOM, you can target them exactly like normal HTML! */
> circle {
>   fill: blue;
> }
> circle:hover {
>   fill: red;
> }
> ```
> - Think about how you would change the background color of a `<div>` on hover. SVG is just as easy!
> 
---



### Exercise 2: Inline SVG Circle Syntax

**Problem:** Write inline `<svg>` with `viewBox="0 0 100 100"` containing a red circle centered at (50,50) with radius 40.

**Expected output:**
> [!check]- Answer
> ```text
> <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>
> ```
> ```html
> <svg viewBox="0 0 100 100">
>   <circle cx="50" cy="50" r="40" fill="red"/>
> </svg>
> ```
>
> **Explanation:** `<circle>` element draws vector circles using center `cx`/`cy` and radius `r`.
> 
---

### Exercise 3: SVG Reusability with use Tag

**Problem:** Which SVG element allows referencing and reusing pre-defined `<symbol>` vector icons across a page?

**Expected output:**
> [!check]- Answer
> ```text
> <use href="#symbol-id">
> ```
> ```html
> <svg><use href="#logo-symbol"></use></svg>
> ```
>
> **Explanation:** `<use>` clones pre-defined SVG symbol definitions for efficient vector reusability.
> 
## 6. Related Terms
- [`<canvas>`](canvas.md) — The pixel-based alternative for graphics.
- [`<map>` & `<area>` (Image Maps)](map_area.md) — Traditional pixel coordinate click targets.
- [Web Components](web_components.md) — Related concept: Web Components.

---

## 7. Key Takeaways
- `<svg>` stands for Scalable Vector Graphics.
- It uses mathematical tags (`<circle>`, `<rect>`, `<path>`) to draw shapes that stay perfectly crisp at any zoom level.
- SVG shapes become real elements in the DOM, meaning you can style them with CSS and add JavaScript click events to them.
- It is the absolute industry standard for modern web icons, logos, and illustrations.
