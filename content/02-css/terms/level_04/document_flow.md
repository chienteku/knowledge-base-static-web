# Document Flow (Normal Flow)

> **Level 4 — Display & Positioning**
> The default layout algorithm used by web browsers to position and arrange HTML elements on a page before any custom positioning, floats, or modern layout frameworks are applied.

---

## 1. Prerequisites
- [The Box Model](../../level_02/box_model.md) — Sizing boxes that the flow algorithm arranges.

---

## 2. Term Category
- **Core Concept**

---

## 3. Environment Context
- **Universal Browser Support** (Calculated during the rendering engine's layout step, where it processes the DOM and CSSOM to build the render tree).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When you write a document in a word processor (like Microsoft Word), you type words and they automatically flow left-to-right, wrapping down to the next line when they hit the page edge. If you press Enter, a new block starts below.

A web browser works the same way. The W3C defined the **Document Flow** (also called **Normal Flow**) to act as the default physics engine of the web page. 

It guarantees that a web page will render in a readable, structured order out of the box, without requiring developers to manually write pixel coordinates for every paragraph or image.

---

### (2) The Mechanics of Normal Flow

Normal flow processes elements based on their display behaviors:

#### 1. Block-Level Layout (Vertical Flow)
Block elements (like `<div>`, `<p>`, `<h1>`) stack **vertically**, one on top of the other, from top to bottom.
-   Each block element begins on a new line.
-   By default, it expands horizontally to occupy `100%` of its parent container's width.

#### 2. Inline-Level Layout (Horizontal Flow)
Inline elements (like `<span>`, `<a>`, `<strong>`) flow **horizontally**, side-by-side, from left to right (or right to left in languages like Arabic).
-   They only occupy the width of their content.
-   When they hit the container's right boundary, they wrap onto the next line.

---

### (3) In-Flow vs. Out-of-Flow Elements
When you write CSS to move elements, you either nudge them *within* the flow, or rip them *completely out* of the flow.

| Flow Category | Properties | Layout Behavior |
| :--- | :--- | :--- |
| **In-Flow** | `position: static`<br>`position: relative`<br>`position: sticky` | The browser reserves the element's original space. Surrounding elements do not overlap it. |
| **Out-of-Flow** | `position: absolute`<br>`position: fixed`<br>`float: left/right` | The browser ignores the element's footprint. The space it occupied collapses, and surrounding elements close the gap as if it were not there. |

---

### (4) Code Examples

#### Short Snippet
Comparing flow styles:

```html
<!-- In-Flow Blocks: Stacks vertically -->
<div>First Block Card</div>
<div>Second Block Card</div>

<!-- In-Flow Inlines: Flows horizontally side-by-side -->
<span>First link</span>
<span>Second link</span>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Document Flow Showcase</title>
  <style>
    .container {
      border: 3px dashed black;
      padding: 10px;
      background-color: #f4f4f4;
    }

    .box {
      padding: 15px;
      margin: 10px 0;
      font-weight: bold;
    }

    .in-flow-blue {
      background-color: lightblue;
      /* Stays in the vertical stack */
    }

    .out-of-flow-red {
      background-color: coral;
      position: absolute;
      top: 50px;
      right: 20px;
      /* Completely ripped out of flow! Blue boxes below it will slide up 
         to ignore its footprint. */
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="box in-flow-blue">1. In-Flow Block Element</div>
    
    <!-- This red box will float above the page, completely ignored by other boxes -->
    <div class="box out-of-flow-red">2. Out-of-Flow Absolute Box</div>
    
    <div class="box in-flow-blue">3. In-Flow Block Element (slides up to touch Box 1)</div>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to align blocks side-by-side using margins

**The mistake:** Using large negative margins to force block-level sidebars to sit next to content columns:

```css
/* BAD: Fragile layout hack that breaks on window resize! */
.sidebar {
  width: 200px;
}
.main-content {
  margin-top: -150px; 
  margin-left: 210px;
}
```

**Why it's wrong:** Block elements are designed to stack vertically in the normal flow. Using negative margins to override this layout math creates fragile layouts that overlap or break when the viewport size changes. 

**Fix: Change the display behavior using Flexbox, Grid, or `display: inline-block`.**

---



### Mistake 2: Pulling Every Element Out of Normal Document Flow Using `position: absolute`

**The mistake:** Positioning an entire web page layout using `position: absolute` for all cards and containers.

**Why it's wrong:** Removing elements from normal document flow forces hardcoding pixel coordinates (`top`, `left`), breaking responsive design on different screen sizes. Use Flexbox or CSS Grid.

*Incorrect:*
```css
/* Hardcoding absolute top/left coordinates for all layout sections */
```

*Fix:*
```css
/* Maintain normal document flow using CSS Grid and Flexbox containers */
```

### Mistake 3: Forgetting Collapsed Parent Height When All Child Elements Are Floated Out of Flow

**The mistake:** Floating 3 child cards inside a parent `<div>` without clearing floats.

**Why it's wrong:** Floated elements are pulled out of normal document flow. A parent container containing ONLY floated children collapses to 0px height. Use `display: flow-root`.

*Incorrect:*
```css
<div class="parent">
  <div style="float: left;">Child 1</div>
  <div style="float: left;">Child 2</div>
</div> <!-- ❌ Parent height collapses to 0px! -->
```

*Fix:*
```css
.parent {
  display: flow-root; /* Creates BFC containment to enclose floated children */
}
```



### Mistake 4: Pulling Every Element Out of Normal Document Flow Using `position: absolute`

**The mistake:** Positioning an entire web page layout using `position: absolute` for all cards and containers.

**Why it's wrong:** Removing elements from normal document flow forces hardcoding pixel coordinates (`top`, `left`), breaking responsive design on different screen sizes. Use Flexbox or CSS Grid.

*Incorrect:*
```css
/* Hardcoding absolute top/left coordinates for all layout sections */
```

*Fix:*
```css
/* Maintain normal document flow using CSS Grid and Flexbox containers */
```

### Mistake 5: Forgetting Collapsed Parent Height When All Child Elements Are Floated Out of Flow

**The mistake:** Floating 3 child cards inside a parent `<div>` without clearing floats.

**Why it's wrong:** Floated elements are pulled out of normal document flow. A parent container containing ONLY floated children collapses to 0px height. Use `display: flow-root`.

*Incorrect:*
```css
<div class="parent">
  <div style="float: left;">Child 1</div>
  <div style="float: left;">Child 2</div>
</div> <!-- ❌ Parent height collapses to 0px! -->
```

*Fix:*
```css
.parent {
  display: flow-root; /* Creates BFC containment to enclose floated children */
}
```



### Mistake 6: Pulling Every Element Out of Normal Document Flow Using `position: absolute`

**The mistake:** Positioning an entire web page layout using `position: absolute` for all cards and containers.

**Why it's wrong:** Removing elements from normal document flow forces hardcoding pixel coordinates (`top`, `left`), breaking responsive design on different screen sizes. Use Flexbox or CSS Grid.

*Incorrect:*
```css
/* Hardcoding absolute top/left coordinates for all layout sections */
```

*Fix:*
```css
/* Maintain normal document flow using CSS Grid and Flexbox containers */
```

### Mistake 7: Forgetting Collapsed Parent Height When All Child Elements Are Floated Out of Flow

**The mistake:** Floating 3 child cards inside a parent `<div>` without clearing floats.

**Why it's wrong:** Floated elements are pulled out of normal document flow. A parent container containing ONLY floated children collapses to 0px height. Use `display: flow-root`.

*Incorrect:*
```css
<div class="parent">
  <div style="float: left;">Child 1</div>
  <div style="float: left;">Child 2</div>
</div> <!-- ❌ Parent height collapses to 0px! -->
```

*Fix:*
```css
.parent {
  display: flow-root; /* Creates BFC containment to enclose floated children */
}
```

## 6. Practice Exercises

### Exercise 1: Flow Classifications

**Problem:** Categorize each of these CSS rulesets as either **In-Flow** or **Out-of-Flow**:

```css
/* Rule A */
.card {
  position: relative;
  top: 10px;
}

/* Rule B */
.alert {
  position: fixed;
  bottom: 0;
}

/* Rule C */
.sidebar {
  float: left;
}
```

**Expected output:**
```text
- Rule A: In-Flow (Relative nudging preserves the original footprint).
- Rule B: Out-of-Flow (Fixed locks to viewport glass, collapsing its footprint).
- Rule C: Out-of-Flow (Float pulls the element to the edge and text wraps, collapsing its height block).
```

> [!check]- Answer
> - Does the element leave a "ghost" footprint that reserves space?

---



### Exercise 2: Document Flow Position States

**Problem:** Which 3 positioning values pull elements OUT of normal document flow?
`static`, `relative`, `absolute`, `fixed`, `sticky`

**Expected output:**
```text
absolute and fixed (and float). static, relative, and sticky remain in flow.
```

> [!check]- Answer
> ```text
> Out of flow: absolute, fixed (and floated elements)
> In flow: static, relative, sticky
> ```
>
> **Explanation:** `absolute` and `fixed` remove elements completely from normal flow layout.

### Exercise 3: Creating Block Formatting Context (BFC)

**Problem:** Which modern CSS property declaration creates a Block Formatting Context (BFC) to enclose out-of-flow floated children cleanly?

**Expected output:**
```text
display: flow-root;
```

> [!check]- Answer
> ```css
> .container {
>   display: flow-root;
> }
> ```
>
> **Explanation:** `display: flow-root` creates a BFC containing all internal floated children.



### Exercise 4: Document Flow Position States

**Problem:** Which 3 positioning values pull elements OUT of normal document flow?
`static`, `relative`, `absolute`, `fixed`, `sticky`

**Expected output:**
```text
absolute and fixed (and float). static, relative, and sticky remain in flow.
```

> [!check]- Answer
> ```text
> Out of flow: absolute, fixed (and floated elements)
> In flow: static, relative, sticky
> ```
>
> **Explanation:** `absolute` and `fixed` remove elements completely from normal flow layout.

### Exercise 5: Creating Block Formatting Context (BFC)

**Problem:** Which modern CSS property declaration creates a Block Formatting Context (BFC) to enclose out-of-flow floated children cleanly?

**Expected output:**
```text
display: flow-root;
```

> [!check]- Answer
> ```css
> .container {
>   display: flow-root;
> }
> ```
>
> **Explanation:** `display: flow-root` creates a BFC containing all internal floated children.



### Exercise 6: Document Flow Position States

**Problem:** Which 3 positioning values pull elements OUT of normal document flow?
`static`, `relative`, `absolute`, `fixed`, `sticky`

**Expected output:**
```text
absolute and fixed (and float). static, relative, and sticky remain in flow.
```

> [!check]- Answer
> ```text
> Out of flow: absolute, fixed (and floated elements)
> In flow: static, relative, sticky
> ```
>
> **Explanation:** `absolute` and `fixed` remove elements completely from normal flow layout.

### Exercise 7: Creating Block Formatting Context (BFC)

**Problem:** Which modern CSS property declaration creates a Block Formatting Context (BFC) to enclose out-of-flow floated children cleanly?

**Expected output:**
```text
display: flow-root;
```

> [!check]- Answer
> ```css
> .container {
>   display: flow-root;
> }
> ```
>
> **Explanation:** `display: flow-root` creates a BFC containing all internal floated children.

## 7. Related Terms
- [`display: block` vs `inline` vs `inline-block`](../level_04/display.md) — The fundamental flow markers.
- [`position: static` vs `relative`](../level_04/position_static_relative.md) — In-flow positioning options.
- [`position: absolute` vs `fixed`](../level_04/position_absolute_fixed.md) — Out-of-flow positioning options.

---

## 8. Key Takeaways
- Document Flow is the default algorithm the browser uses to lay out pages.
- Block elements stack vertically and take up 100% width.
- Inline elements flow horizontally and wrap at boundaries.
- In-Flow elements reserve their original visual footprints.
- Out-of-Flow elements collapse their space, allowing neighboring elements to slide into their place.
- Absolute positioning, fixed positioning, and floats pull elements out of the normal flow.
