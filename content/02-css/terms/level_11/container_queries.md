# Container Queries (`@container`)

> **Level 11 — Modern CSS Architecture & Functions**
> A modern CSS at-rule and styling system that queries the dimensions of an element's parent container rather than the overall browser viewport width, enabling component-based responsive design.

---

## 1. Prerequisites
- [`@media` (Media Queries Basics)](../level_08/media_queries.md) — Viewport conditional queries.
- [Responsive Design (Concept)](../level_08/responsive_design.md) — Sizing layout blocks dynamically.

---

## 2. Term Category
- **CSS At-Rule**

---

## 3. Environment Context
- **Universal Modern Standard** (Enforces isolation boundaries on container layout nodes. Prevents layout loops by locking containment rules during style evaluation loops).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Traditional responsive design relies on Media Queries (`@media`). Media queries check the width of the **browser viewport** (screen).

This works fine for global layouts (like sidebars and navbars). However, modern web design is built on **reusable components** (like a `.card` component showing a profile or product).

If a card is placed in a wide Hero Section, it has plenty of space and should display horizontally. 

If the exact same card is placed in a narrow Sidebar, it must render vertically to avoid squishing.

Using `@media` is impossible here: at a desktop screen width of `1200px`, the browser thinks there is plenty of room, so both cards try to render horizontally, breaking the card inside the sidebar.

To solve this, browser makers introduced **Container Queries (`@container`)**. 

Instead of asking: *"How wide is the screen?"*, container queries allow a component to ask: *"How wide is my parent container?"*

---

### (2) The Two-Step Recipe

#### Step 1: Define the Parent Container
You must tell the browser which parent element it should measure. You do this by setting **`container-type`** (usually `inline-size` to track width):

```css
.card-wrapper {
  /* Set this box up as a measured layout container */
  container-type: inline-size; 
  width: 100%;
}
```

#### Step 2: Query the Container Sizing
Write a `@container` rule targeting elements nested *inside* the container:

```css
/* Default Mobile/Vertical card layout */
.card-content {
  display: flex;
  flex-direction: column;
}

/* Upgrade to Horizontal if the PARENT wrapper is 400px wide or larger */
@container (min-width: 400px) {
  .card-content {
    flex-direction: row;
    align-items: center;
  }
}
```

---

### (3) Critical Constraints
To prevent infinite rendering loops, container queries enforce two strict rules:
1.  **Cannot style the container itself:** You cannot write `@container (min-width: 400px) { .card-wrapper { ... } }`. A query can only style **children** inside the container.
2.  **Layout Containment:** The container box is treated as isolated from its children's heights to prevent size recalculation loops.

---

### (4) Code Examples

#### Short Snippet
Container-relative unit values:

```css
@container (min-width: 500px) {
  .card__title {
    /* cqw is a Container Query Width unit! 
       1cqw equals 1% of the container's width. */
    font-size: 5cqw; 
  }
}
```

#### Fuller Example (Responsive Grid Layouts)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Container Queries Showcase</title>
  <style>
    body {
      font-family: sans-serif;
      background-color: #f0f0f0;
      margin: 20px;
    }

    /* GRID LAYOUT: Left sidebar is narrow, Right area is wide */
    .dashboard-layout {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 20px;
    }

    .column {
      background-color: #e8e8e8;
      padding: 15px;
      border-radius: 8px;
    }

    /* STEP 1: ESTABLISH CONTAINER CONTEXT ON WRAPPER CARDS */
    .widget-container {
      container-type: inline-size;
      margin-bottom: 20px;
    }

    /* STEP 2: STYLES FOR THE COMPONENT */
    .profile-card {
      background-color: white;
      border-radius: 6px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column; /* Default: Vertical Stack */
      align-items: center;
      gap: 15px;
      text-align: center;
    }

    .profile-card img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
    }

    /* QUERY CONTAINER: Switch to row mode if parent is wide! */
    @container (min-width: 350px) {
      .profile-card {
        flex-direction: row; /* Horizontal layout */
        text-align: left;
      }
    }
  </style>
</head>
<body>

  <div class="dashboard-layout">
    <!-- Sidebar: Card will be Vertical (container < 350px) -->
    <div class="column">
      <h3>Sidebar</h3>
      <div class="widget-container">
        <div class="profile-card">
          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200" alt="User">
          <div>
            <h4>Alex Smith</h4>
            <p>UI Engineer</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content: Card will be Horizontal (container > 350px) -->
    <div class="column">
      <h3>Main Section</h3>
      <div class="widget-container">
        <div class="profile-card">
          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200" alt="User">
          <div>
            <h4>Alex Smith</h4>
            <p>UI Engineer</p>
          </div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Querying elements without declaring `container-type` on any parent

**The mistake:** Declaring `@container (min-width: 400px) { .card__title { ... } }` but forgetting to set `container-type: inline-size;` on the parent box class.

**Why it's wrong:** The browser looks up the DOM tree from `.card__title` to find the nearest element marked as a container context. If it finds none, the query fails silently.

**Fix: Always define `container-type: inline-size` on the component's wrapper element.**

---



### Mistake 2: Forgetting `container-type: inline-size` on the Parent Container

**The mistake:** Writing `@container (min-width: 400px)` without defining `container-type` on an ancestor element.

**Why it's wrong:** Container Queries evaluate the width of the nearest ancestor element marked with `container-type: inline-size` (or `normal`). Without `container-type`, container queries fail.

*Incorrect:*
```css
/* Missing container-type declaration on parent container! */
@container (min-width: 400px) { .card { flex-direction: row; } }
```

*Fix:*
```css
.card-wrapper {
  container-type: inline-size; /* Declares container query boundary */
}
@container (min-width: 400px) {
  .card { flex-direction: row; }
}
```

### Mistake 3: Attempting to Query Container Height Without `container-type: size` (Infinite Loop Danger)

**The mistake:** Querying container height `@container (min-height: 300px)` with `container-type: inline-size`.

**Why it's wrong:** Querying container height requires `container-type: size` (which fixes block dimensions) to prevent infinite layout feedback loops. Stick to `inline-size` (width) queries.

*Incorrect:*
```css
/* Querying height without 2D size container-type */
```

*Fix:*
```css
.container { container-type: inline-size; } /* Standard width-based container query */
```

## 6. Practice Exercises

### Exercise 1: Article Layout Toggle

**Problem:** You are styling an article preview list. You have a container `.article-wrapper` and a child title heading `.article-title`. The title should have a font size of `1.2rem` by default, but if the `.article-wrapper` is at least `500px` wide, scale the title font size to `1.8rem`. Write the CSS ruleset.

**Expected output:**
> [!check]- Answer
> ```css
> .article-wrapper {
>   container-type: inline-size;
> }
> 
> .article-title {
>   font-size: 1.2rem;
> }
> 
> @container (min-width: 500px) {
>   .article-title {
>     font-size: 1.8rem;
>   }
> }
> ```
> - Remember to set the container context wrapper first.
> - Target the child element inside the `@container` conditional query block.
> 
---



### Exercise 2: Card Component Container Query Pattern

**Problem:** Write Container Query for `.card-wrapper` (`container-type: inline-size`) switching `.card` to `flex-direction: row` when wrapper exceeds `450px` width.

**Expected output:**
> [!check]- Answer
> ```text
> .card-wrapper { container-type: inline-size; } @container (min-width: 450px) { .card { flex-direction: row; } }
> ```
> ```css
> .card-wrapper {
>   container-type: inline-size;
> }
> @container (min-width: 450px) {
>   .card {
>     flex-direction: row;
>   }
> }
> ```
>
> **Explanation:** Container queries allow components to adapt based on parent container width rather than viewport width.
> 
---

### Exercise 3: Container Queries vs Media Queries Difference

**Problem:** Why are Container Queries superior to Media Queries for reusable component libraries?

**Expected output:**
> [!check]- Answer
> ```text
> Container Queries allow components to respond to their local parent box width wherever placed, independent of global browser viewport width.
> ```
> ```text
> Container Queries allow components to respond to their local parent box width wherever placed, independent of global browser viewport width.
> ```
>
> **Explanation:** Container queries enable true modular component responsiveness.
> 
## 7. Related Terms
- [`@media` (Media Queries Basics)](../level_08/media_queries.md) — Viewport-based responsive queries.
- [`@supports` (Feature Queries)](supports.md) — Browser feature detection at-rules.

---

## 8. Key Takeaways
- Container Queries style elements based on parent container sizes instead of screen viewports.
- You must declare `container-type: inline-size` on a parent wrapper to create a query context.
- Use `@container (min-width: [size])` to target child styles conditionally.
- Container query values cannot target the container element itself.
- Use container query units (like `cqw`) for container-relative fluid spacing.
