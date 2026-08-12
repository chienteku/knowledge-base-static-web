# `<canvas>`

> **Level 10 — Canvas, SVG & Storage**
> A graphics container used to draw 2D or 3D graphics on the fly via JavaScript.

---

## 1. Prerequisites
- [`<script>`](../level_08/script.md) — The canvas element does absolutely nothing without JavaScript to control it.
- [DOM (Document Object Model)](../level_09/dom.md) — JavaScript interacts with the Canvas object in the DOM to draw pixels.

---

## 2. Term Category

**Multimedia / Graphic Element (HTML5 Standard)**: `<canvas>` is a fundamental concept in this technology stack. **Level 10 — Canvas, SVG & Storage**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Accessible HTML5 Canvas Drawing Surface with Fallback DOM Content

**Scenario:** An author embeds an interactive HTML5 data chart canvas with accessible text fallback content for screen readers.

**Requirements:**
1. Create `<canvas>` with explicit `width` and `height` attributes.
2. Add `role="img"` and `aria-label`.
3. Provide inner fallback HTML content for non-supporting clients.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="chart-container">
>   <h2>Quarterly Revenue Chart</h2>
>
>   <canvas id="revenue-chart" width="600" height="400" role="img" aria-label="Quarterly Revenue Bar Chart for 2026">
>     <!-- Accessible Fallback Content for Screen Readers & Legacy Browsers -->
>     <p>Revenue summary for 2026: Q1 $1.2M, Q2 $1.5M, Q3 $1.8M, Q4 $2.1M.</p>
>   </canvas>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **The `<canvas>` Element**: Provides a bitmap canvas surface for real-time script rendering (2D graphics or WebGL).
> 2. **Fallback Content**: Content placed INSIDE `<canvas>...</canvas>` is rendered ONLY by browsers that do not support `<canvas>` or by screen readers.
> 3. **Explicit Pixel Dimensions**: Dimensions MUST be set via HTML `width` and `height` attributes (in pixels) rather than CSS to prevent canvas image distortion.
> 
---

### Exercise 2: Responsive High-DPI (Retina) Canvas Scaling

**Scenario:** Configures canvas internal resolution for high-DPI (Retina) displays while maintaining CSS responsive bounds.

**Requirements:**
1. Set internal canvas dimensions to 2x resolution.
2. Constrain visual size using CSS percentage width.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- Internal resolution 1200x800 for 2x Retina scaling -->
> <canvas id="high-dpi-canvas" width="1200" height="800" style="width: 100%; max-width: 600px; height: auto;"></canvas>
> ```
>
> #### Technical Explanation
>
> 1. **Internal vs Visual Resolution**: HTML `width`/`height` set pixel buffer size; CSS `width`/`height` set visual layout size.
> 2. **High-DPI Sharpness**: Scaling canvas 2x internally prevents blurry graphics on Retina screens.
> 3. **Aspect Ratio Maintenance**: Keep HTML width/height ratio identical to CSS aspect ratio.
> 
---

### Exercise 3: Providing ARIA Accessible Description Labels for Graphic Canvas Elements

**Scenario:** Connects dynamic canvas graphics with accessible ARIA description tables.

**Requirements:**
1. Add `aria-describedby="data-table"` to canvas.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <canvas id="sales-canvas" width="800" height="400" role="img" aria-label="Sales Distribution Chart" aria-describedby="chart-data-summary"></canvas>
>
> <div id="chart-data-summary" class="sr-only">
>   <table>
>     <caption>Sales Distribution Raw Data</caption>
>     <tr><th scope="col">Region</th><th scope="col">Sales</th></tr>
>     <tr><td>North America</td><td>45%</td></tr>
>   </table>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **Visual Graphic ARIA Labeling**: `role="img"` exposes canvas bitmap as a graphics image to screen readers.
> 2. **Accessible Data Tables**: `aria-describedby` links complex charts to accessible screen-reader tables.
> 3. **Screen Reader Parity**: Guarantees equal access to graphic chart metrics for blind users.
## 6. Related Terms
- [`<svg>` (Scalable Vector Graphics)](svg.md) — The alternative way to draw graphics on the web (Vector vs. Raster).
- [`<progress>` & `<meter>` Elements](progress_meter.md) — Semantic gauges for loading states and scalars.
- [Web Components](web_components.md) — Related concept: Web Components.

---

## 7. Key Takeaways
- The `<canvas>` element provides a blank surface for JavaScript to draw 2D or 3D graphics.
- It is heavily used for browser games, data visualization (charts), and image manipulation.
- Always set the dimensions using the HTML `width` and `height` attributes to prevent blurry stretching.
- Place text between the tags to provide accessibility for screen readers.
