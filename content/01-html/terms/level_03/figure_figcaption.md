# `<figure>` & `<figcaption>`

> **Level 3 — Media & Embedding**
> Semantic HTML elements used to wrap self-contained media (like images, charts, or code) alongside a visible caption.

---

## 1. Prerequisites
- [`<img>`](img.md) — The image tag wrapped by figures.
- [`alt` Attribute](alt.md) — Visually descriptive alternate text.
- [Nesting](../level_01/nesting.md) — Nested tag structures.

---

## 2. Term Category

**Structural Tag (Universal Browser Support .)**: `<figure>` & `<figcaption>` is a fundamental concept in this technology stack. **Level 3 — Media & Embedding**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In textbooks or news articles, you often see images, diagrams, or charts accompanied by a short caption (e.g., *"Figure 1: The solar system"*). 

In early HTML, developers built this by placing an `<img>` tag and a standard paragraph `<p>` tag next to each other inside a generic `<div>` box. 

However, this created an accessibility gap. Screen readers and search engine crawlers could not programmatically connect the paragraph to the image. They treated them as two completely separate, unrelated items.

To solve this, HTML5 introduced two semantic tags:
1.  **`<figure>流通`:** A block-level container that groups the media content (images, diagrams, code blocks, or maps) as a single, self-contained unit.
2.  **`<figcaption>流通`:** The visible text caption for the figure. It must be nested inside the `<figure>` container, either as the very first child (above the media) or the very last child (below the media).

---

### (2) `alt` Text vs. `<figcaption>`
A very common point of confusion is how `alt` text relates to `<figcaption>`:
-   **`alt` Text (Invisible):** Describes what the image looks like for screen readers and search engines (e.g., `alt="A yellow banana with brown spots"`).
-   **`<figcaption>` (Visible):** Provides context, labels, credits, or explanations for the user (e.g., `"<figcaption>Figure 1.2: A banana showing decay stages.</figcaption>"`).

**They do not replace each other. A semantic image inside a figure should have both.**

---

### (3) Code Examples

#### Short Snippet
A basic image wrapped in a figure with a caption:

```html
<figure>
  <img src="chart.png" alt="A bar chart showing rising temperatures">
  <figcaption>Figure 4: Global average temperatures from 2000 to 2025.</figcaption>
</figure>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Scientific Report</title>
</head>
<body>

  <h1>Volcano Studies</h1>
  <p>During our expedition, we observed several active vents...</p>

  <!-- Semantic figure container grouping image and caption -->
  <figure class="report-image">
    <img src="volcano.jpg" alt="A volcano erupting with glowing red lava flows" width="600">
    <figcaption>
      <em>Photo 1.1:</em> Mount Vesuvius active eruption path, captured July 2026.
    </figcaption>
  </figure>

  <p>The data collected from these vents indicates increased seismic pressure.</p>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Leaving off the `alt` attribute because a `<figcaption>` exists

**The mistake:** Assuming that since you wrote a visible caption, you can skip writing the `alt` description on the image:

```html
<!-- BAD: Missing alt attribute! -->
<figure>
  <img src="cat.jpg">
  <figcaption>Fig 2: My cat sleeping on a rug.</figcaption>
</figure>
```

**Why it's wrong:** A screen reader will read the caption, but when it hits the image, it will still read the ugly file name (e.g., "cat-final-cropped.jpg") because there is no `alt` text. Visually impaired users need to know *what the photo looks like* through the `alt` text, while the caption provides label context.

**Fix:**
```html
<figure>
  <img src="cat.jpg" alt="A fluffy orange tabby cat curled up asleep on a blue rug">
  <figcaption>Fig 2: My cat sleeping on a rug.</figcaption>
</figure>
```

---



### Mistake 2: Placing `<figcaption>` Outside the `<figure>` Container

**The mistake:** Writing `<figure><img src="a.jpg"></figure><figcaption>Caption</figcaption>`.

**Why it's wrong:** `<figcaption>` MUST be a direct child of a `<figure>` element. Placing it outside breaks the semantic link connecting caption to image.

*Incorrect:*
```html
<figure><img src="chart.png"></figure>
<figcaption>Sales Chart 2026</figcaption> <!-- ❌ Caption outside figure! -->
```

*Fix:*
```html
<figure>
  <img src="chart.png" alt="Sales chart showing 20% growth">
  <figcaption>Sales Chart 2026</figcaption>
</figure>
```

### Mistake 3: Including Multiple `<figcaption>` Tags Inside a Single `<figure>`

**The mistake:** Placing two separate `<figcaption>` tags in one `<figure>`.

**Why it's wrong:** A `<figure>` element can contain at most ONE `<figcaption>` as its first or last child.

*Incorrect:*
```html
<figure>
  <figcaption>Caption 1</figcaption>
  <img src="a.png">
  <figcaption>Caption 2</figcaption> <!-- ❌ Multiple captions invalid! -->
</figure>
```

*Fix:*
```html
<figure>
  <img src="a.png" alt="Diagram">
  <figcaption>Combined caption description</figcaption>
</figure>
```

## 5. Practice Exercises

### Exercise 1: Associating Image Diagrams with Captions using figure and figcaption

**Scenario:** A textbook publisher wraps an educational diagram inside `<figure>` and attaches a visual caption using `<figcaption>`.

**Requirements:**
1. Wrap `<img>` inside `<figure>`.
2. Add `<figcaption>` as a child of `<figure>`.
3. Verify accessible grouping.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <figure class="diagram-container">
>   <img src="images/water-cycle.png" alt="Illustration of the water cycle showing evaporation, condensation, and precipitation" width="500" height="300">
>   <figcaption>Figure 3.1: Continuous movement of water within the Earth's atmosphere.</figcaption>
> </figure>
> ```
>
> #### Technical Explanation
>
> 1. **The `<figure>` Element**: Represents self-contained content (images, diagrams, code blocks) referenced as a single unit from the main text.
> 2. **The `<figcaption>` Element**: Provides a visible legend or caption for its parent `<figure>`; must be the first or last child inside `<figure>`.
> 3. **Semantic Association**: Screen readers announce `<figure>` as a distinct figure region and read `<figcaption>` as its official label.
> 
---

### Exercise 2: Wrapping Code Snippet Demonstrations with figure and figcaption

**Scenario:** A technical author wraps an HTML code snippet in `<figure>` with a descriptive code title caption.

**Requirements:**
1. Wrap `<pre><code>` block inside `<figure>`.
2. Add `<figcaption>` describing the code block.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <figure class="code-figure">
>   <figcaption>Listing 1: Standard HTML5 Page Template</figcaption>
>   <pre><code>&lt;!DOCTYPE html&gt;
> &lt;html lang="en"&gt;
>   &lt;head&gt;&lt;title&gt;Demo&lt;/title&gt;&lt;/head&gt;
>   &lt;body&gt;&lt;/body&gt;
> &lt;/html&gt;</code></pre>
> </figure>
> ```
>
> #### Technical Explanation
>
> 1. **Non-Image Figures**: `<figure>` is NOT limited to images; it can group code listings, charts, math equations, or quote blocks.
> 2. **Standalone Placement**: Figure content can be moved to an appendix or sidebar without altering main text flow.
> 3. **Document Structure Clarity**: Improves code snippet presentation in tech documentation.
> 
---

### Exercise 3: Multi-Image Gallery Card with Group Caption

**Scenario:** Combines multiple related product photo thumbnails inside a single `<figure>` sharing a single `<figcaption>`.

**Requirements:**
1. Place multiple `<img>` tags inside one `<figure>`.
2. Add a single shared `<figcaption>`.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <figure class="product-gallery">
>   <div class="thumbnail-group">
>     <img src="images/shoe-front.jpg" alt="Front view of running shoe" width="150" height="150">
>     <img src="images/shoe-side.jpg" alt="Side profile of running shoe" width="150" height="150">
>     <img src="images/shoe-sole.jpg" alt="Bottom sole tread of running shoe" width="150" height="150">
>   </div>
>   <figcaption>Photo Gallery: Marathon Pro Running Shoe in Cobalt Blue</figcaption>
> </figure>
> ```
>
> #### Technical Explanation
>
> 1. **Grouped Figure Content**: A single `<figure>` can contain multiple related child elements sharing one caption.
> 2. **Sub-Image Alt Text**: Each individual `<img>` inside `<figure>` still requires its own distinct `alt` attribute.
> 3. **Visual Layout Grouping**: Simplifies CSS styling for image grids and galleries.
## 6. Related Terms
- [`<img>`](img.md) — The image element wrapped inside the figure.
- [`alt` Attribute](alt.md) — The visual description metadata.
- [`<div>` (Block container)](../level_02/div.md) — The non-semantic block container.

---

## 7. Key Takeaways
- `<figure>` groups self-contained media blocks (images, charts, code blocks).
- `<figcaption>` defines the visible caption text for a `<figure>`.
- The `<figcaption>` must be placed inside `<figure>` as either the first or last child.
- Images inside figures still require `alt` text for screen-reader accessibility.
- Browsers apply default indentation styling to `<figure>` blocks.
