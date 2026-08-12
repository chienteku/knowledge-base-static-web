# Dark Mode (`prefers-color-scheme`)

> **Level 11 — Modern CSS Architecture & Functions**
> The CSS media query feature that detects if the user's operating system is set to light or dark mode, enabling stylesheets to automatically swap design themes.

---

## 1. Prerequisites
- [`@media` (Media Queries Basics)](../level_08/media_queries.md) — Conditional CSS at-rules.
- [`var()` (CSS Custom Properties)](var.md) — Theme custom variables.

---

## 2. Term Category

**CSS At-Rule (Universal Modern Standard .)**: Dark Mode (`prefers-color-scheme`) is a fundamental concept in this technology stack. **Level 11 — Modern CSS Architecture & Functions**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Almost all modern operating systems (iOS, Android, macOS, Windows) have a system-wide setting to switch between a **Light Theme** (black text on white background) and a **Dark Theme** (white text on dark background).

If a user is browsing in a dark room at night with their phone set to Dark Mode, opening a website that features a blinding white background causes eye strain and a bad user experience.

In the early days of responsive design, making a dark mode required complex JavaScript scripts, cookie storage, and swapping stylesheets manually.

To solve this, browser makers introduced the **`prefers-color-scheme`** media query. 

It queries the user's OS preference directly, allowing CSS to automatically adapt the color scheme instantly.

---

### (2) The Modern Theme-Switching Workflow
The cleanest, most maintainable way to build a dark mode is by combining **CSS Variables** with the **`prefers-color-scheme`** query.

Instead of duplicating all your component styles inside the media query block, you simply redefine your colors in one place (inside `:root`):

```css
/* 1. LIGHT MODE (Default Baseline) */
:root {
  --bg-color: #ffffff;
  --text-color: #111111;
  --card-color: #f5f5f5;
}

/* 2. DARK MODE OVERRIDE */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #0d1117;
    --text-color: #f0f6fc;
    --card-color: #161b22;
  }
}

/* 3. ASSIGN STYLES ONCE */
body {
  background-color: var(--bg-color);
  color: var(--text-color);
}
.card {
  background-color: var(--card-color);
}
```

By structuring your styles this way, the browser swaps every single element's background and text color instantly when the OS theme shifts, without duplicating a single class ruleset.

---

### (3) Code Examples

#### Fuller Example (Theme Switching Cards)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Automatic Dark Mode Demo</title>
  <style>
    /* --- 1. DEFAULT LIGHT THEME VARIABLES --- */
    :root {
      --bg: #ffffff;
      --card-bg: #f9f9f9;
      --text: #333333;
      --accent: #0066cc;
      --border: #dddddd;
    }

    /* --- 2. DARK THEME VARIABLES OVERRIDE --- */
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #121212;
        --card-bg: #1e1e1e;
        --text: #e0e0e0;
        --accent: #ff007f;
        --border: #333333;
      }
    }

    /* --- 3. LAYOUT DESIGN (Uses variables only) --- */
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: sans-serif;
      margin: 40px;
      transition: background-color 0.3s, color 0.3s; /* Smooth theme transitions! */
    }

    .card {
      max-width: 400px;
      margin: 0 auto;
      padding: 24px;
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    a {
      color: var(--accent);
      text-decoration: none;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <div class="card">
    <h2>Theme Aware Card</h2>
    <p>Toggle your operating system's light and dark mode settings. This website will automatically and smoothly transition between light and dark themes using CSS variables!</p>
    <a href="#">Learn More &rarr;</a>
  </div>

</body>
</html>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Duplicating entire component selectors inside the media query

**The mistake:** Re-writing all classes to swap colors:

```css
/* BAD: Bloated, duplicated code that is a nightmare to maintain! */
.card { background: white; padding: 20px; border: 1px solid gray; }
@media (prefers-color-scheme: dark) {
  .card { background: black; padding: 20px; border: 1px solid white; }
}
```

**Why it's wrong:** If you duplicate selectors, any future layout adjustments (like changing padding from `20px` to `30px`) must be changed in multiple places. If you forget to update one, your layout will warp when switching modes.

**Fix: Separate styles. Define layout rules (padding, margins, grids) on the base class, and use CSS variables exclusively to manage theme colors.**

---



### Mistake 2: Hardcoding Dark Mode Styles in Media Queries Without Offering CSS Variable Theme Overrides

**The mistake:** Duplicating 200 lines of CSS rules inside `@media (prefers-color-scheme: dark)`.

**Why it's wrong:** Duplicating CSS rules makes theme switching difficult to maintain. Define semantic CSS custom variables (`--bg-primary`, `--text-primary`) and swap variable values on theme toggle.

*Incorrect:*
```css
/* Duplicating 200 lines of CSS rules inside dark media query */
```

*Fix:*
```css
:root {
  --bg: #ffffff; --text: #111111;
}
[data-theme="dark"], @media (prefers-color-scheme: dark) {
  :root { --bg: #121212; --text: #ffffff; }
}
```

### Mistake 3: Forgetting to Set `color-scheme: dark` on Root Element (Native Scrollbar/Input Contrast Bug)

**The mistake:** Implementing dark mode styling without declaring `color-scheme: dark;` on `:root`.

**Why it's wrong:** Declaring `color-scheme: dark light;` informs the browser to render native UI components (scrollbars, form checkboxes, select popups, datepickers) in dark mode colors.

*Incorrect:*
```css
/* Missing color-scheme declaration causes bright white scrollbars on dark page */
```

*Fix:*
```css
:root {
  color-scheme: light dark; /* Informs browser to render dark native scrollbars */
}
```

## 5. Practice Exercises

### Exercise 1: Theme Token Architecture with CSS Variables for Dark Mode

**Scenario:** An author structures system color tokens using CSS variables, swapping values for `[data-theme="dark"]`.

**Requirements:**
1. Define light theme tokens under `:root`.
2. Define dark theme overrides under `[data-theme="dark"]`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Light Theme Token Baseline */
> :root {
>   --color-bg: #ffffff;
>   --color-surface: #f8fafc;
>   --color-text: #0f172a;
>   --color-border: #e2e8f0;
> }
>
> /* Dark Theme Token Overrides */
> [data-theme="dark"] {
>   --color-bg: #0f172a;
>   --color-surface: #1e293b;
>   --color-text: #f8fafc;
>   --color-border: #334155;
> }
>
> body {
>   background-color: var(--color-bg);
>   color: var(--color-text);
>   transition: background-color 0.3s ease, color 0.3s ease;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Theme Token Architecture**: Centralizes color values in CSS variables (`--color-bg`), enabling global theme updates by changing variable tokens.
> 2. **Data Attribute Selector**: Using `[data-theme="dark"]` allows JavaScript theme toggle buttons to switch themes seamlessly.
> 3. **Smooth Theme Transitions**: Adding `transition: background-color 0.3s` prevents abrupt color snapping when switching modes.
> 
---

### Exercise 2: OS System Preference Integration via prefers-color-scheme

**Scenario:** Automatically activates dark mode variables based on OS settings using `@media (prefers-color-scheme: dark)`.

**Requirements:**
1. Apply `@media (prefers-color-scheme: dark)` token overrides.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> @media (prefers-color-scheme: dark) {
>   :root:not([data-theme="light"]) {
>     --color-bg: #0f172a;
>     --color-surface: #1e293b;
>     --color-text: #f8fafc;
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. **System Preference Auto-Detection**: Respects user OS preferences automatically.
> 2. **User Override Support**: Using `:root:not([data-theme="light"])` respects manual user override selections.
> 3. **WCAG Accessibility**: Guarantees dark mode contrast compliance.
> 
---

### Exercise 3: Preventing Flash of Light Theme (FOUT) on Load

**Scenario:** Explains inline script technique to set `data-theme` attribute before DOM render.

**Requirements:**
1. Demonstrate early script attribute setting.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <head>
>   <script>
>     // Early execution script prevents Flash of Light Theme!
>     const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
>     document.documentElement.setAttribute('data-theme', theme);
>   </script>
> </head>
> ```
>
> #### Technical Explanation
>
> 1. **Flash of Unstyled Theme (FOUT)**: Prevents bright white screen flashes when dark mode users open pages over slow connections.
> 2. **Early Attribute Binding**: Applies `data-theme` to `<html>` BEFORE CSS parsing begins.
> 3. **Premium User Experience**: Essential requirement for commercial Web Applications.
## 6. Related Terms
- [`@media` (Media Queries Basics)](../level_08/media_queries.md) — Baseline responsive queries.
- [`var()` (CSS Custom Properties)](var.md) — Dynamic color variables.
- [`:root` Pseudo-class](root_pseudo_class.md) — Variable scopes.

---

## 7. Key Takeaways
- `prefers-color-scheme` detects OS-level theme settings (light or dark).
- The best implementation method overrides CSS variables inside the query block.
- Prevents styling code duplication by separating colors from layout rules.
- Set up smooth transitions (`transition: background-color 0.3s`) for premium switching animations.
- Avoid hardcoded values in layouts to ensure clean color-scheme adaptation.
