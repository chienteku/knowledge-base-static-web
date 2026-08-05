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
- **Semantic Tag / Landmark**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Multiple Nav Scenario

**Problem:** Is it acceptable to have two `<nav>` elements on a single page, for example, a primary menu at the top, and a "Table of Contents" menu for a long article?

**Expected output:**
> [!check]- Answer
> ```text
> Yes! It is perfectly acceptable and encouraged to have multiple `<nav>` elements if they both represent major blocks of navigation. (Best practice is to give them unique `aria-label` attributes, like `aria-label="Main menu"` and `aria-label="Table of contents"`).
> ```
> - Does a Table of Contents act as a major steering wheel for an article? Yes!

---



### Exercise 2: Accessible Primary Nav Bar Structure

**Problem:** Write `<nav>` with `aria-label="Main"` containing unordered list of 2 links (`Home`, `About`).

**Expected output:**
> [!check]- Answer
> ```text
> <nav aria-label="Main"><ul><li><a href="/">Home</a></li><li><a href="/about">About</a></li></ul></nav>
> ```
> ```html
> <nav aria-label="Main">
>   <ul>
>     <li><a href="/">Home</a></li>
>     <li><a href="/about">About</a></li>
>   </ul>
> </nav>
> ```
>
> **Explanation:** `<ul>` inside `<nav>` provides accessible list count context for screen readers.

---

### Exercise 3: Nav Landmark Role

**Problem:** Which implicit ARIA landmark role does the `<nav>` element convey?

**Expected output:**
> [!check]- Answer
> ```text
> navigation landmark role.
> ```
> ```text
> navigation landmark role.
> ```
>
> **Explanation:** `<nav>` acts as the `navigation` accessibility landmark.

## 7. Related Terms
- [`<header>`](header.md) — The parent container that usually holds the primary `<nav>`.
- [`<ul>`, `<ol>`, and `<li>` (Lists)](../level_02/lists.md) — The element almost always used *inside* a `<nav>` to structure the links.
- [`<aside>`](aside.md) — The tangential layout block.
- [Semantic HTML](semantic_html.md) — Related concept: Semantic HTML.
---

## 8. Key Takeaways
- The `<nav>` element defines a major block of navigation links.
- It is a crucial "landmark" for screen readers, allowing users to skip or jump to the menu.
- Do NOT use it for minor, single links (like footer links or "read more" buttons).
- It is very common to nest a `<ul>` list inside a `<nav>` for maximum accessibility.
