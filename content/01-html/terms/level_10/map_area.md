# `<map>` & `<area>` (Image Maps)

> **Level 10 — Canvas, SVG & Storage**
> Elements used to define clickable hotspot regions (rectangles, circles, or polygons) over a single image, enabling visual navigation maps without requiring JavaScript.

---

## 1. Prerequisites
- [`<img>`](../level_03/img.md) — The target image containing the coordinate map.
- [`href` Attribute](../level_02/href.md) — The destination hyperlink targets.
- [Attribute](../level_01/attribute.md) — General tag parameters.

---

## 2. Term Category
- **Media Element**

---

## 3. Environment Context
- **Universal Browser Support** (Supported natively since early HTML specs. Coordinates are resolved in absolute image pixels on the client side).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes a single graphic contains multiple independent points of interest that should link to different pages. For example:
-   **A Map of the USA:** Clicking on Texas goes to Texas info; clicking on California goes to California info.
-   **An Office Blueprint:** Clicking on a desk opens the booking form for that specific workspace.
-   **The Solar System:** Clicking on Mars loads Mars data; clicking on Jupiter loads Jupiter data.

Normally, you can only wrap an entire image in a single link (`<a><img></a>`). 

To allow multiple links on a single image, the W3C created **Image Maps**:
-   **`<map>`:** Defines the overlay container.
-   **`<area>`:** Defines individual clickable shapes (hotspots) mapped to coordinates.

---

### (2) Binding Image to Map (`usemap` and `name`)
To connect an image to its coordinate map, you must bind them together:
1.  Add the **`usemap`** attribute to the `<img>` tag, pointing to an anchor identifier (e.g., `usemap="#solar-map"`).
2.  Add the **`name`** attribute to the `<map>` tag with the matching identifier value (e.g., `name="solar-map"`).

---

### (3) Hotspot Shapes & Coordinates (`coords`)
The `<area>` element is a void element that defines shapes using the `shape` and `coords` attributes:

| Shape | Coordinate Syntax (`coords`) | Example Description |
| :--- | :--- | :--- |
| **`rect`** (Rectangle) | `x1,y1,x2,y2` | Top-left corner coordinates (`x1,y1`) and bottom-right corner coordinates (`x2,y2`). |
| **`circle`** (Circle) | `x,y,radius` | Center coordinates (`x,y`) and circle radius in pixels. |
| **`poly`** (Polygon) | `x1,y1,x2,y2,x3,y3...` | List of X,Y points forming the boundary of a custom shape (points connect in order). |

---

### (4) Code Examples

#### Short Snippet
A circular hotspot link overlay:

```html
<!-- Image connected to map -->
<img src="planets.jpg" usemap="#planet-map" alt="Solar system view">

<!-- Map definition -->
<map name="planet-map">
  <!-- Circle centered at 50,50 with a 30px radius -->
  <area shape="circle" coords="50,50,30" href="sun.html" alt="The Sun">
</map>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Office Hotspots Image Map</title>
</head>
<body>

  <h1>Interactive Office Layout</h1>
  <p>Click on any labeled section to view availability:</p>

  <!-- 1. The visual image, bound using usemap. Note the '#' prefix! -->
  <img src="office-layout.png" usemap="#office-map" alt="Visual floor blueprint" width="600" height="400">

  <!-- 2. The coordinate map matching the name -->
  <map name="office-map">
    
    <!-- Rectangle Area: Desk region -->
    <area shape="rect" coords="20,50,150,180" href="/desk-booking.html" alt="Open Workspace Desks">

    <!-- Circle Area: Conference Room -->
    <area shape="circle" coords="450,200,90" href="/conference-room.html" alt="Main Conference Center">

    <!-- Polygon Area: L-shaped reception lounge -->
    <area shape="poly" coords="200,300,280,300,280,350,350,350,350,390,200,390" href="/reception.html" alt="Guest Reception Area">
    
  </map>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the hashtag `#` in `usemap`

**The mistake:** Pointing `usemap` directly to the map name without a `#` symbol:

```html
<!-- BAD: Click targets will fail to bind! -->
<img src="layout.jpg" usemap="my-map">
<map name="my-map">...</map>
```

**Why it's wrong:** The HTML spec defines `usemap` as an anchor reference (similar to href selectors pointing to element IDs). The browser will search for a local map identifier matching the exact string. Without the `#`, binding fails, and the image remains non-clickable.

---

### Mistake 2: Using absolute coordinates on responsive images
Image map coordinates are declared in absolute pixels (e.g. `coords="100,100,50"`). If you resize the image using CSS for mobile devices (like setting `width: 100%`), the image scales down, but the clickable hotspot coordinates stay in their original absolute positions. The clicks will end up completely misaligned.

**Golden Rule:** For modern responsive designs, prefer using `<svg>` with nested interactive paths instead of traditional HTML image maps.

---



### Mistake 3: Mismatching Image `usemap` Value with `<map>` Name Attribute (`#mapname` vs `mapname`)

**The mistake:** Writing `<img usemap="my-map">` without the hash `#` prefix.

**Why it's wrong:** The `usemap` attribute on `<img>` MUST include a leading `#` prefix (`usemap="#my-map"`) matching the `<map name="my-map">` attribute.

*Incorrect:*
```html
<img src="plan.png" usemap="planet-map"> <!-- ❌ Missing '#' hash prefix! -->
```

*Fix:*
```html
<img src="plan.png" usemap="#planet-map">
<map name="planet-map">
  <area shape="rect" coords="0,0,50,50" href="sun.html" alt="Sun">
</map>
```

### Mistake 4: Omitting Mandatory `alt` Attributes on `<area>` Elements (Accessibility Violation)

**The mistake:** Creating clickable `<area>` shapes without `alt` text.

**Why it's wrong:** Image map areas act as interactive links. Omitting `alt` attributes on `<area>` elements makes image maps completely unnavigable for screen reader users.

*Incorrect:*
```html
<area shape="circle" coords="100,100,50" href="/page"> <!-- ❌ Missing alt text! -->
```

*Fix:*
```html
<area shape="circle" coords="100,100,50" href="/page" alt="Target Zone">
```



### Mistake 5: Mismatching Image `usemap` Value with `<map>` Name Attribute (`#mapname` vs `mapname`)

**The mistake:** Writing `<img usemap="my-map">` without the hash `#` prefix.

**Why it's wrong:** The `usemap` attribute on `<img>` MUST include a leading `#` prefix (`usemap="#my-map"`) matching the `<map name="my-map">` attribute.

*Incorrect:*
```html
<img src="plan.png" usemap="planet-map"> <!-- ❌ Missing '#' hash prefix! -->
```

*Fix:*
```html
<img src="plan.png" usemap="#planet-map">
<map name="planet-map">
  <area shape="rect" coords="0,0,50,50" href="sun.html" alt="Sun">
</map>
```

### Mistake 6: Omitting Mandatory `alt` Attributes on `<area>` Elements (Accessibility Violation)

**The mistake:** Creating clickable `<area>` shapes without `alt` text.

**Why it's wrong:** Image map areas act as interactive links. Omitting `alt` attributes on `<area>` elements makes image maps completely unnavigable for screen reader users.

*Incorrect:*
```html
<area shape="circle" coords="100,100,50" href="/page"> <!-- ❌ Missing alt text! -->
```

*Fix:*
```html
<area shape="circle" coords="100,100,50" href="/page" alt="Target Zone">
```



### Mistake 7: Mismatching Image `usemap` Value with `<map>` Name Attribute (`#mapname` vs `mapname`)

**The mistake:** Writing `<img usemap="my-map">` without the hash `#` prefix.

**Why it's wrong:** The `usemap` attribute on `<img>` MUST include a leading `#` prefix (`usemap="#my-map"`) matching the `<map name="my-map">` attribute.

*Incorrect:*
```html
<img src="plan.png" usemap="planet-map"> <!-- ❌ Missing '#' hash prefix! -->
```

*Fix:*
```html
<img src="plan.png" usemap="#planet-map">
<map name="planet-map">
  <area shape="rect" coords="0,0,50,50" href="sun.html" alt="Sun">
</map>
```

### Mistake 8: Omitting Mandatory `alt` Attributes on `<area>` Elements (Accessibility Violation)

**The mistake:** Creating clickable `<area>` shapes without `alt` text.

**Why it's wrong:** Image map areas act as interactive links. Omitting `alt` attributes on `<area>` elements makes image maps completely unnavigable for screen reader users.

*Incorrect:*
```html
<area shape="circle" coords="100,100,50" href="/page"> <!-- ❌ Missing alt text! -->
```

*Fix:*
```html
<area shape="circle" coords="100,100,50" href="/page" alt="Target Zone">
```

## 6. Practice Exercises

### Exercise 1: Hotspot Alignment

**Problem:** You have a logo image of size 100x100 pixels. You want the right-half of the logo to link to "right.html" and the left-half to link to "left.html". Write the `<map>` and `<area>` tags to achieve this.

**Expected output:**
> [!check]- Answer
> ```html
> <map name="logo-map">
>   <area shape="rect" coords="0,0,50,100" href="left.html" alt="Left side link">
>   <area shape="rect" coords="50,0,100,100" href="right.html" alt="Right side link">
> </map>
> ```
> - The left rectangle starts at (0,0) and ends at middle-right (50,100).
> - The right rectangle starts at middle-left (50,0) and ends at bottom-right (100,100).

---



### Exercise 2: Defining Rectangular Area Shape

**Problem:** Write `<area>` element for rectangular region from top-left (0,0) to bottom-right (100,200) linking to `/details`.

**Expected output:**
> [!check]- Answer
> ```text
> <area shape="rect" coords="0,0,100,200" href="/details" alt="Details">
> ```
> ```html
> <area shape="rect" coords="0,0,100,200" href="/details" alt="Details">
> ```
>
> **Explanation:** `shape="rect"` expects `coords="x1,y1,x2,y2"` pixel coordinates.

---

### Exercise 3: Supported Area Shapes

**Problem:** List the 4 valid `shape` attribute options for `<area>` elements.

**Expected output:**
> [!check]- Answer
> ```text
> 1. rect (rectangular)
> 2. circle (circular)
> 3. poly (polygonal)
> 4. default (entire image region)
> ```
> ```text
> 1. rect
> 2. circle
> 3. poly
> 4. default
> ```
>
> **Explanation:** `shape` defines geometric bounds for interactive image maps.

## 7. Related Terms
- [`<img>`](../level_03/img.md) — The host image element.
- [`href` Attribute](../level_02/href.md) — The destination hyperlink path.
- [`<svg>` (Scalable Vector Graphics)](svg.md) — The modern vector-based responsive coordinate alternative.

---

## 8. Key Takeaways
- Image maps create multiple clickable link hotspots on a single image.
- Bind the image to the map using `usemap="#name"` on the image and `name="name"` on the map.
- The `<area>` tag defines shapes (`rect`, `circle`, `poly`) and absolute pixel coordinates.
- Always write descriptive `alt` tags on each `<area>` for accessibility screen readers.
- Image maps coordinates are not responsive by default; use `<svg>` for responsive vector hotspot overlays.
