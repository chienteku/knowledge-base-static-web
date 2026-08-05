# `order`

> **Level 5 — Layouts — Flexbox**
> A child-level Flexbox property that changes the visual rendering sequence of items within the container, without altering their logical sequence in the HTML source code.

---

## 1. Prerequisites
- [Flexbox (Concept) & `display: flex`](flex_parent.md) — Must be applied to the parent container.
---

## 2. Term Category
- **Flexbox Property**

---

## 3. Environment Context
- **Universal Modern Standard** (Understood natively. Rearranges visual rendering passes during layout steps without rebuilding DOM trees).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When building responsive layouts, you often need to rearrange elements depending on the screen size. 

For example, on a desktop screen, you might have a main article column next to a sidebar column. 

When a user switches to a mobile phone, you want the main article to stack at the top of the screen, and the sidebar to fall to the bottom.

If you only use HTML, the layout order is permanent: whatever is written first in your index file must appear first on the screen. 

To solve this, the W3C introduced the **`order`** property. 

It allows CSS to manually control the visual sequence of elements, rearranging columns or rows dynamically based on the device width, without requiring JavaScript DOM manipulations.

---

### (2) How Sorting Works
By default, **every flex item has a default `order` value of `0`**.

The browser sorts items in ascending order:
-   **Lowest numbers are rendered first.**
-   Negative integers are allowed (e.g. `order: -1;` will instantly jump an item to the very front of the line).
-   If two items have the same `order` value (for instance, they all default to `0`), the browser breaks the tie by sorting them in their original **HTML source code order**.

---

### (3) Critical Accessibility Warning (A11y)
The `order` property **only changes the visual layout**, not the document's structure.

Assistive technologies (like screen readers for blind users) and keyboard tab navigation (navigating from link-to-link using the Tab key) follow the **HTML source code order**, not the CSS visual order!

> [!WARNING]
> **Keyboard Navigation Desync:**
> If you use `order` to visually move Button 3 to the front of the line, a keyboard user pressing Tab will still focus on Button 1 first, then Button 2, and then jump to Button 3 at the end. 
> This creates a confusing and frustrating experience for disabled users.
> **Rule of thumb:** Only use `order` for visual spacing adjustments or minor layouts. Never use it to build primary navigational flows.

---

### (4) Code Examples

#### Short Snippet
Pushing an item to the front or back:

```css
.badge-first {
  /* Lowest value: jump to the front of the flex container line */
  order: -1; 
}

.promo-last {
  /* High value: push to the absolute end of the flex line */
  order: 99; 
}
```

#### Fuller Example (Responsive Order Swap)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Responsive Order Swap</title>
  <style>
    .flex-container {
      display: flex;
      flex-direction: column; /* Mobile stack */
      width: 400px;
      background-color: #eee;
      padding: 10px;
    }

    .column {
      padding: 20px;
      text-align: center;
      font-weight: bold;
    }

    .main {
      background-color: lightblue;
      order: 1; /* Pushed below sidebar on mobile */
    }

    .sidebar {
      background-color: tomato;
      color: white;
      order: 2; /* Pushed to the bottom on mobile */
    }

    .hero-banner {
      background-color: gold;
      order: 0; /* Stays at the top */
    }

    /* Desktop View: override order settings */
    @media (min-width: 768px) {
      .flex-container {
        flex-direction: row; /* Horizontal row on desktop */
        width: 100%;
      }
      
      .main {
        order: 0; /* Reset back to standard flow layout positions */
      }
      
      .sidebar {
        order: -1; /* Sidebar shifts to the left on desktop! */
      }
    }
  </style>
</head>
<body>

  <div class="flex-container">
    <div class="column main">Main Article Content</div>
    <div class="column sidebar">Sidebar Links</div>
    <div class="column hero-banner">Hero Banner Info</div>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying on `order` to fix bad HTML structures

**The mistake:** Writing messy, unorganized HTML code where forms or menus are scattered randomly, and attempting to clean up the visual layout entirely using `order: 1`, `order: 2`, etc.

**Why it's wrong:** While the page looks perfect to sighted users, it is completely broken for search engine crawlers and screen readers. Always write clean, logical HTML structures first, and use `order` strictly as a responsive style modification.

---



### Mistake 2: Using `order` to Re-Arrange Interactive Form Fields Breaking Keyboard Focus Order (Accessibility Trap)

**The mistake:** Using `order: -1` on a submit button to move it visually to the top of a form.

**Why it's wrong:** The `order` property alters ONLY visual rendering. Screen readers and keyboard Tab key navigation follow original HTML DOM source order, causing confusing focus jumps.

*Incorrect:*
```css
.submit-btn { order: -1; } /* ❌ Tab key still focuses button last! */
```

*Fix:*
```css
/* Re-arrange HTML tags directly in DOM source order for accessibility */
```

### Mistake 3: Expecting `order` Property to Work on Non-Flex/Non-Grid Normal Flow Elements

**The mistake:** Adding `order: 2` to a standard block `<div>`.

**Why it's wrong:** The `order` property functions ONLY on child items inside Flexbox or CSS Grid containers. It is IGNORED on normal document flow elements.

*Incorrect:*
```css
div { order: 1; } /* ❌ Ignored on normal document flow elements! */
```

*Fix:*
```css
.parent { display: flex; }
.parent > div { order: 1; } /* Works on flex items */
```

## 6. Practice Exercises

### Exercise 1: Visual Sort

**Problem:** You have a horizontal Flex row containing three boxes.
- Box A: no order property declared.
- Box B: `order: 5;`
- Box C: `order: -2;`
In what visual order (from left to right) will they render on the screen?

**Expected output:**
> [!check]- Answer
> ```text
> Box C, Box A, Box B!
> - Box C has the lowest score (-2) and goes first.
> - Box A has no declaration, defaulting to 0, and goes second.
> - Box B has the highest score (5) and goes last.
> ```
> - Sort the values from lowest to highest: `-2`, `0`, `5`.

---



### Exercise 2: First Item Re-Ordering Pattern

**Problem:** Write CSS property moving `.featured-card` flex item to the very first visual position regardless of DOM order.

**Expected output:**
> [!check]- Answer
> ```text
> .featured-card { order: -1; }
> ```
> ```css
> .featured-card {
>   order: -1;
> }
> ```
>
> **Explanation:** Default `order` is 0. Setting `order: -1` places item before default items.

---

### Exercise 3: Order Property Default Value

**Problem:** What is default `order` value for all flex items?

**Expected output:**
> [!check]- Answer
> ```text
> order: 0;
> ```
> ```text
> order: 0;
> ```
>
> **Explanation:** All flex items default to `order: 0` and display in HTML source order.

## 7. Related Terms
- [Flexbox (Concept) & `display: flex`](flex_parent.md) — The parent layout engine.
- [`flex-direction`](flex_direction.md) — Dictates whether visual ordering flows vertically or horizontally.
- [`align-self`](align_self.md) — Related concept: `align-self`.
---

## 8. Key Takeaways
- The `order` property changes the visual sequence of flex items.
- All flex items default to `order: 0`.
- Items are rendered in ascending order (lowest numbers first, including negative integers).
- **Accessibility Alert**: Keyboard tab navigation and screen readers ignore the `order` property; they follow the HTML source code order.
- Do not use `order` for primary layout navigation flows; keep HTML structures logical.
