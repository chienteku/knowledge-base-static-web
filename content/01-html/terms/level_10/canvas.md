# `<canvas>`

> **Level 10 — Canvas, SVG & Storage**
> A graphics container used to draw 2D or 3D graphics on the fly via JavaScript.

---

## 1. Prerequisites
- [`<script>`](../level_08/script.md) — The canvas element does absolutely nothing without JavaScript to control it.
- [DOM (Document Object Model)](../level_09/dom.md) — JavaScript interacts with the Canvas object in the DOM to draw pixels.

---

## 2. Term Category
- **Multimedia / Graphic Element**

---

## 3. Environment Context
- **HTML5 Standard**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before HTML5, if you wanted to build a web-based video game, render a dynamic financial chart, or create an interactive drawing app, you had to use third-party plugins like Adobe Flash or Java Applets. These plugins were notoriously insecure, slow, and crashed frequently.
The W3C created the `<canvas>` element in HTML5 to natively support dynamic graphics directly in the browser. The `<canvas>` tag itself is just a blank, transparent rectangle. It provides no drawing tools on its own. Instead, it provides a powerful JavaScript API (Application Programming Interface). JavaScript can target the canvas and say, "Draw a red circle at X,Y coordinates," or "Render this 3D character model." 

### (2) Reality Metaphor
Imagine the `<canvas>` tag as a completely blank, framed canvas sitting on an easel.
HTML provides the easel and the frame (setting the width and height).
JavaScript is the painter holding the paintbrush. Without the painter, the canvas stays completely blank forever.

### (3) Code Examples

#### Short Snippet
```html
<!-- HTML just defines the blank drawing surface -->
<canvas id="myCanvas" width="200" height="100"></canvas>
```

#### Fuller Example (With JavaScript)
```html
<canvas id="gameBoard" width="400" height="400" style="border:1px solid black;"></canvas>

<script>
  // 1. Find the canvas in the DOM
  const canvas = document.getElementById("gameBoard");
  
  // 2. Ask for the 2D drawing paintbrush (the "context")
  const ctx = canvas.getContext("2d");
  
  // 3. Use JavaScript to draw a blue square
  ctx.fillStyle = "blue";
  ctx.fillRect(50, 50, 100, 100); // X, Y, Width, Height
</script>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Setting width and height with CSS instead of HTML attributes

**The mistake:** Removing the `width` and `height` attributes from the HTML tag, and sizing the canvas using CSS (e.g., `canvas { width: 400px; height: 400px; }`).

**Why it's wrong:** The HTML `width` and `height` attributes define the *internal coordinate system* (the actual number of pixels available to draw on). CSS only defines how large that box stretches on the screen. If you only use CSS, the browser defaults the internal coordinate system to 300x150. If CSS then stretches it to 800x800, everything you draw will look horribly stretched, blurry, and pixelated! You must set the internal dimensions via the HTML attributes.

*Incorrect:*
```html
<style> #myCanvas { width: 500px; height: 500px; } </style>
<canvas id="myCanvas"></canvas> <!-- Will be blurry! -->
```

*Fix:*
```html
<!-- Defines the exact number of pixels available to JavaScript -->
<canvas id="myCanvas" width="500" height="500"></canvas>
```

---



### Mistake 2: Setting `<canvas>` Width/Height in CSS Instead of HTML Attributes

**The mistake:** Setting canvas dimensions via `<canvas style="width: 800px; height: 600px;">`.

**Why it's wrong:** Setting canvas dimensions in CSS scales the default 300x150 drawing buffer bitmap like an image, causing blurry pixelated graphics. Set dimensions directly via HTML `width="800" height="600"` attributes.

*Incorrect:*
```html
<canvas style="width: 800px; height: 600px;"></canvas> <!-- ❌ Stretches bitmap! Blurry graphics! -->
```

*Fix:*
```html
<canvas width="800" height="600"></canvas> <!-- Sets true drawing buffer resolution -->
```

### Mistake 3: Omitting Fallback Content Inside `<canvas>` Elements for Accessibility

**The mistake:** Creating a `<canvas>` element with zero inner fallback text.

**Why it's wrong:** Canvas bitmap drawings are completely invisible to screen readers and search engine crawlers. Provide inner fallback text or ARIA descriptions for accessible user experience.

*Incorrect:*
```html
<canvas width="400" height="300"></canvas> <!-- ❌ Inaccessible to screen readers -->
```

*Fix:*
```html
<canvas width="400" height="300">
  <p>Sales Chart: Q1 2026 growth increased by 25%.</p>
</canvas>
```



### Mistake 4: Setting `<canvas>` Width/Height in CSS Instead of HTML Attributes

**The mistake:** Setting canvas dimensions via `<canvas style="width: 800px; height: 600px;">`.

**Why it's wrong:** Setting canvas dimensions in CSS scales the default 300x150 drawing buffer bitmap like an image, causing blurry pixelated graphics. Set dimensions directly via HTML `width="800" height="600"` attributes.

*Incorrect:*
```html
<canvas style="width: 800px; height: 600px;"></canvas> <!-- ❌ Stretches bitmap! Blurry graphics! -->
```

*Fix:*
```html
<canvas width="800" height="600"></canvas> <!-- Sets true drawing buffer resolution -->
```

### Mistake 5: Omitting Fallback Content Inside `<canvas>` Elements for Accessibility

**The mistake:** Creating a `<canvas>` element with zero inner fallback text.

**Why it's wrong:** Canvas bitmap drawings are completely invisible to screen readers and search engine crawlers. Provide inner fallback text or ARIA descriptions for accessible user experience.

*Incorrect:*
```html
<canvas width="400" height="300"></canvas> <!-- ❌ Inaccessible to screen readers -->
```

*Fix:*
```html
<canvas width="400" height="300">
  <p>Sales Chart: Q1 2026 growth increased by 25%.</p>
</canvas>
```



### Mistake 6: Setting `<canvas>` Width/Height in CSS Instead of HTML Attributes

**The mistake:** Setting canvas dimensions via `<canvas style="width: 800px; height: 600px;">`.

**Why it's wrong:** Setting canvas dimensions in CSS scales the default 300x150 drawing buffer bitmap like an image, causing blurry pixelated graphics. Set dimensions directly via HTML `width="800" height="600"` attributes.

*Incorrect:*
```html
<canvas style="width: 800px; height: 600px;"></canvas> <!-- ❌ Stretches bitmap! Blurry graphics! -->
```

*Fix:*
```html
<canvas width="800" height="600"></canvas> <!-- Sets true drawing buffer resolution -->
```

### Mistake 7: Omitting Fallback Content Inside `<canvas>` Elements for Accessibility

**The mistake:** Creating a `<canvas>` element with zero inner fallback text.

**Why it's wrong:** Canvas bitmap drawings are completely invisible to screen readers and search engine crawlers. Provide inner fallback text or ARIA descriptions for accessible user experience.

*Incorrect:*
```html
<canvas width="400" height="300"></canvas> <!-- ❌ Inaccessible to screen readers -->
```

*Fix:*
```html
<canvas width="400" height="300">
  <p>Sales Chart: Q1 2026 growth increased by 25%.</p>
</canvas>
```

## 6. Practice Exercises

### Exercise 1: Canvas Accessibility

**Problem:** The `<canvas>` just renders raw colored pixels on the screen. Screen readers cannot "see" pixels. How can you make a canvas accessible to a blind user?

**Expected output:**
> [!check]- Answer
> ```text
> Any text or HTML placed *between* the `<canvas>` and `</canvas>` tags acts as fallback content! Screen readers will read this text, while sighted users will only see the drawn graphics.
> Example: `<canvas>A graph showing a 20% increase in sales.</canvas>`
> ```
> - Remember that `<canvas>` is not a void element; it has a closing tag. What happens if you put text inside it?

---

### Exercise 2: Drawing Rectangle on Canvas 2D Context

**Problem:** Write JavaScript code getting 2D context of `<canvas id="cv">` and drawing a blue filled rectangle at (10, 10) sized 100x50.

**Expected output:**
> [!check]- Answer
> ```javascript
> const canvas = document.getElementById('cv');
> const ctx = canvas.getContext('2d');
> ctx.fillStyle = 'blue';
> ctx.fillRect(10, 10, 100, 50);
> ```
>
> **Explanation:** `getContext('2d')` provides the 2D rendering API for drawing canvas shapes.

---

### Exercise 3: Canvas vs SVG Comparison

**Problem:** Compare Canvas vs SVG rendering modes (Raster/Bitmap vs Vector).

**Expected output:**
> [!check]- Answer
> ```text
> Canvas is Raster/Bitmap pixel-based (ideal for games/high-particle animations); SVG is Vector DOM-based (ideal for scalable resolution-independent graphics/charts).
> ```
>
> **Explanation:** Canvas renders pixels procedurally; SVG manages XML vector DOM node trees.

## 7. Related Terms
- [`<svg>` (Scalable Vector Graphics)](svg.md) — The alternative way to draw graphics on the web (Vector vs. Raster).
- [`<progress>` & `<meter>` Elements](progress_meter.md) — Semantic gauges for loading states and scalars.
- [Web Components](web_components.md) — Related concept: Web Components.

---

## 8. Key Takeaways
- The `<canvas>` element provides a blank surface for JavaScript to draw 2D or 3D graphics.
- It is heavily used for browser games, data visualization (charts), and image manipulation.
- Always set the dimensions using the HTML `width` and `height` attributes to prevent blurry stretching.
- Place text between the tags to provide accessibility for screen readers.
