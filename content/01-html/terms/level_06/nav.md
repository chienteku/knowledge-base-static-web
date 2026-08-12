# `<nav>`

> **Level 6 — Semantic HTML5**
> A section of a page whose purpose is to provide navigation links.

---

## 1. Prerequisites
- [Semantic HTML](semantic_html.md) — The `<nav>` is a core HTML5 semantic landmark.
- [`<a>` (Anchor / Link)](../level_02/a.md) — The `<nav>` element is a container specifically for anchors.
- [Nesting](../level_01/nesting.md) — Since navigation lists must nest inside the parent `<nav>` container.

---

## 2. Term Category

**Semantic Tag / Landmark (Universal Browser Support)**: `<nav>` is a fundamental concept in this technology stack. **Level 6 — Semantic HTML5**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Navigation menus are the steering wheel of a website. Before HTML5, screen readers had a very difficult time finding the navigation menu because it was just a `<div id="menu">` buried among dozens of other `<div>`s. 
The W3C created the `<nav>` element as a **major semantic landmark**. When a screen reader loads a page, it specifically looks for the `<nav>` element and can announce it to the user: "Navigation region." It allows blind users to instantly jump to the menu, or just as importantly, skip past the menu so they don't have to listen to 20 links being read aloud every time they click a new page.

### (2) Reality Metaphor
Imagine walking into a large department store.
The `<nav>` element is the giant directory sign sitting near the entrance or the elevator. It doesn't contain the actual clothes or toys, it just provides a structured list telling you where to go to find them.

### (3) Code Examples

#### Short Snippet
```html
<!-- A simple navigation bar -->
<nav>
  <a href="/home">Home</a> | 
  <a href="/about">About</a> | 
  <a href="/contact">Contact</a>
</nav>
```

#### Fuller Example
```html
<header>
  <h1>Company Portal</h1>
  
  <!-- It is extremely common to place the <nav> inside the <header> -->
  <!-- We use an unordered list (<ul>) inside the nav for perfect structure -->
  <nav aria-label="Main Navigation">
    <ul>
      <li><a href="/dashboard">Dashboard</a></li>
      <li><a href="/reports">Reports</a></li>
      <li><a href="/settings">Settings</a></li>
    </ul>
  </nav>
</header>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Wrapping *every* link in a `<nav>`

**The mistake:** Using a `<nav>` tag around a single "Read More" link, or putting the Terms of Service link in the footer inside a `<nav>`.

**Why it's wrong:** The W3C specification explicitly states that `<nav>` should only be used for **major blocks of navigation menus**. If you wrap every single link on your page in a `<nav>`, you destroy its usefulness. The screen reader will constantly announce "Navigation region," confusing the user. For minor links (like a copyright policy in the footer), just use standard `<a>` tags without the `<nav>` wrapper.

*Incorrect:*
```html
<footer>
  <p>Copyright 2026</p>
  <!-- WRONG: This is not a major navigation block -->
  <nav>
    <a href="/terms">Terms of Service</a>
  </nav>
</footer>
```

*Fix:*
```html
<footer>
  <p>Copyright 2026</p>
  <!-- CORRECT: Just use standard links for minor footer text -->
  <a href="/terms">Terms of Service</a>
</footer>
```

---



### Mistake 2: Wrapping All Hyperlinks on a Page Inside `<nav>` Elements

**The mistake:** Wrapping paragraph links or footer policy links in `<nav>` elements.

**Why it's wrong:** `<nav>` is intended strictly for major block navigation groups (site primary menu, table of contents). Wrapping minor links clutters screen reader landmark lists.

*Incorrect:*
```html
<p>Read our <nav><a href="/terms">Terms</a></nav></p> <!-- ❌ Minor link wrapped in nav -->
```

*Fix:*
```html
<p>Read our <a href="/terms">Terms</a></p>
```

### Mistake 3: Omitting `aria-label` Attributes When Multiple `<nav>` Elements Exist

**The mistake:** Placing header `<nav>` and footer `<nav>` without distinguishing `aria-label` attributes.

**Why it's wrong:** When multiple `<nav>` elements exist, screen readers announce both as 'navigation'. Use `aria-label="Primary"` and `aria-label="Footer"` to differentiate.

*Incorrect:*
```html
<nav>...</nav> <!-- Header nav -->
<nav>...</nav> <!-- Footer nav - Ambiguous to screen readers -->
```

*Fix:*
```html
<nav aria-label="Primary Navigation">...</nav>
<nav aria-label="Footer Navigation">...</nav>
```

## 5. Practice Exercises

### Exercise 1: Primary Website Navigation Bar with Accessible Label

**Scenario:** A developer creates a primary site navigation header using `<nav aria-label="Main Navigation">`.

**Requirements:**
1. Wrap navigation links in `<nav>`.
2. Add an `aria-label` attribute.
3. Use an unordered list (`<ul>`) of links inside.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <header>
>   <nav aria-label="Main Navigation" class="main-nav">
>     <ul>
>       <li><a href="/" aria-current="page">Home</a></li>
>       <li><a href="/products">Products</a></li>
>       <li><a href="/about">About Us</a></li>
>       <li><a href="/contact">Contact</a></li>
>     </ul>
>   </nav>
> </header>
> ```
>
> #### Technical Explanation
>
> 1. **The `<nav>` Element**: Represents a section of a page that contains navigation links to other pages or parts of the current page.
> 2. **Accessible Labeling (`aria-label`)**: Using `aria-label="Main Navigation"` labels the navigation landmark for screen readers.
> 3. **Current Page Indicator (`aria-current="page"`)**: Informs screen readers which link represents the currently active page.
> 
---

### Exercise 2: Secondary Breadcrumb Navigation Bar

**Scenario:** Creates a secondary breadcrumb navigation bar using `<nav aria-label="Breadcrumb">`.

**Requirements:**
1. Create `<nav aria-label="Breadcrumb">`.
2. Use `<ol>` list for ordered breadcrumb steps.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <nav aria-label="Breadcrumb" class="breadcrumb-nav">
>   <ol>
>     <li><a href="/">Home</a></li>
>     <li><a href="/store">Store</a></li>
>     <li><a href="/store/laptops" aria-current="page">Laptops</a></li>
>   </ol>
> </nav>
> ```
>
> #### Technical Explanation
>
> 1. **Breadcrumb Nav Semantics**: Using `<nav aria-label="Breadcrumb">` identifies breadcrumb trail landmarks to screen readers.
> 2. **Ordered List Structure**: `<ol>` represents the sequential hierarchical order of breadcrumb trails.
> 3. **Disambiguated Landmarks**: Differentiates breadcrumbs from the primary header navigation menu.
> 
---

### Exercise 3: Disambiguating Multiple nav Landmarks on a Single Page

**Scenario:** Ensures multiple `<nav>` blocks on the same page have unique `aria-label` attributes.

**Requirements:**
1. Add distinct `aria-label` strings to header, sidebar, and footer `<nav>` tags.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <header>
>   <nav aria-label="Primary Site Menu">...</nav>
> </header>
>
> <aside>
>   <nav aria-label="Category Filters">...</nav>
> </aside>
>
> </footer>
> ```
>
> #### Technical Explanation
>
> 1. **Disambiguation Rule**: When multiple `<nav>` elements exist on a single page, EVERY `<nav>` MUST have a unique `aria-label`.
> 2. **Navigation Landmark List**: Screen reader landmark lists display labeled nav names (e.g. 'Primary Site Menu', 'Category Filters').
> 3. **List Container Requirement**: Always wrap navigation links inside `<ul>` or `<ol>` inside `<nav>`.
## 6. Related Terms
- [`<header>`](header.md) — The parent container that usually holds the primary `<nav>`.
- [`<ul>`, `<ol>`, and `<li>` (Lists)](../level_02/lists.md) — The element almost always used *inside* a `<nav>` to structure the links.
- [`<aside>`](aside.md) — The tangential layout block.
- [Semantic HTML](semantic_html.md) — Related concept: Semantic HTML.

---

## 7. Key Takeaways
- The `<nav>` element defines a major block of navigation links.
- It is a crucial "landmark" for screen readers, allowing users to skip or jump to the menu.
- Do NOT use it for minor, single links (like footer links or "read more" buttons).
- It is very common to nest a `<ul>` list inside a `<nav>` for maximum accessibility.
