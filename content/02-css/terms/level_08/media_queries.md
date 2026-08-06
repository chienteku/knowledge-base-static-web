# `@media` (Media Queries Basics)

> **Level 8 — Responsive Design & Units**
> The CSS rule that allows you to apply different styles based on the size of the user's device (e.g., changing the layout when viewed on an iPhone vs a Desktop monitor).

---

## 1. Prerequisites
- [`%` (Percentages)](percentages.md) — While fluid units handle small adjustments, Media Queries handle massive structural changes.

---

## 2. Term Category
- **CSS At-Rule**

---

## 3. Environment Context
- **Universal Modern Standard** (The absolute core of Responsive Web Design).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Using percentages (`%`) and Flexbox is great for making a layout squish and stretch. But eventually, a screen gets so small that the layout physically breaks. A 3-column desktop layout looks terrible crushed onto a 320px wide phone screen; it needs to become a 1-column layout.
The W3C created **Media Queries (`@media`)** to allow developers to say: "If the screen is smaller than X pixels, stop using the normal CSS, and start using this special CSS instead." 
It is how we build websites that work flawlessly on Phones, Tablets, and Desktop computers simultaneously.

### (2) Reality Metaphor
Imagine a Transformer robot. 
Normally, it's a car. But you have a rule: "If the enemy is taller than 20 feet, transform into a giant robot." The entity is the same, but its physical structure changes based on the environmental conditions.

### (3) Code Examples

#### Mobile-First Design (The Best Practice)
In modern web development, we write the CSS for Mobile Phones *first* (the default). Then, we use `@media` queries to add complexity as the screen gets *larger* (using `min-width`).

```css
/* 1. DEFAULT (Mobile Phones) */
/* On a phone, the container is a single vertical column */
.container {
  display: flex;
  flex-direction: column; 
}

/* 2. TABLETS & DESKTOPS */
/* "If the screen is AT LEAST 768px wide (Tablet size or bigger), apply this CSS!" */
@media (min-width: 768px) {
  
  /* This overrides the default! The container becomes a side-by-side row! */
  .container {
    flex-direction: row; 
  }
  
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Desktop-First Design (`max-width`)

**The mistake:** Writing complex desktop CSS first, and then using `@media (max-width: 768px)` to try and delete all that complex CSS to make it fit on a phone.

**Why it's wrong:** This is called "Desktop-First" design, and it is universally considered a bad practice today. Why? Because phones have slow processors and bad internet connections. If you write desktop CSS first, the phone has to download and process thousands of lines of complex grid math, only to immediately hit a `max-width` media query that tells it to throw all that math in the garbage and just stack things in a column. 
**Golden Rule:** Always design for Mobile first. Let the phone process the simple CSS, and use `min-width` media queries to add the complex desktop math only for powerful computers.

---



### Mistake 2: Mixing `max-width` and `min-width` Queries Inconsistently (Cascade Overlap Trap)

**The mistake:** Writing `@media (max-width: 768px)` and `@media (min-width: 768px)` with overlapping 768px values.

**Why it's wrong:** Both queries trigger simultaneously at EXACTLY 768px width, leading to specificity and cascade ordering bugs. Use strict Mobile-First `min-width` queries.

*Incorrect:*
```css
@media (max-width: 768px) { .nav { display: none; } }
@media (min-width: 768px) { .nav { display: flex; } } /* ❌ Conflict at 768px! */
```

*Fix:*
```css
/* Mobile-first: base styles apply up to 767px */
.nav { display: none; }
@media (min-width: 768px) { .nav { display: flex; } } /* Triggers at 768px+ */
```

### Mistake 3: Omitting the `<meta name="viewport">` Tag in HTML Head

**The mistake:** Writing extensive CSS `@media` queries without including `<meta name="viewport">` in HTML.

**Why it's wrong:** Without the viewport meta tag, mobile browsers emulate desktop rendering at 980px width, ignoring media queries completely.

*Incorrect:*
```css
<!-- Missing viewport meta tag in HTML head -->
```

*Fix:*
```css
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```



### Mistake 4: Mixing `max-width` and `min-width` Queries Inconsistently (Cascade Overlap Trap)

**The mistake:** Writing `@media (max-width: 768px)` and `@media (min-width: 768px)` with overlapping 768px values.

**Why it's wrong:** Both queries trigger simultaneously at EXACTLY 768px width, leading to specificity and cascade ordering bugs. Use strict Mobile-First `min-width` queries.

*Incorrect:*
```css
@media (max-width: 768px) { .nav { display: none; } }
@media (min-width: 768px) { .nav { display: flex; } } /* ❌ Conflict at 768px! */
```

*Fix:*
```css
/* Mobile-first: base styles apply up to 767px */
.nav { display: none; }
@media (min-width: 768px) { .nav { display: flex; } } /* Triggers at 768px+ */
```

### Mistake 5: Omitting the `<meta name="viewport">` Tag in HTML Head

**The mistake:** Writing extensive CSS `@media` queries without including `<meta name="viewport">` in HTML.

**Why it's wrong:** Without the viewport meta tag, mobile browsers emulate desktop rendering at 980px width, ignoring media queries completely.

*Incorrect:*
```css
<!-- Missing viewport meta tag in HTML head -->
```

*Fix:*
```css
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```



### Mistake 6: Mixing `max-width` and `min-width` Queries Inconsistently (Cascade Overlap Trap)

**The mistake:** Writing `@media (max-width: 768px)` and `@media (min-width: 768px)` with overlapping 768px values.

**Why it's wrong:** Both queries trigger simultaneously at EXACTLY 768px width, leading to specificity and cascade ordering bugs. Use strict Mobile-First `min-width` queries.

*Incorrect:*
```css
@media (max-width: 768px) { .nav { display: none; } }
@media (min-width: 768px) { .nav { display: flex; } } /* ❌ Conflict at 768px! */
```

*Fix:*
```css
/* Mobile-first: base styles apply up to 767px */
.nav { display: none; }
@media (min-width: 768px) { .nav { display: flex; } } /* Triggers at 768px+ */
```

### Mistake 7: Omitting the `<meta name="viewport">` Tag in HTML Head

**The mistake:** Writing extensive CSS `@media` queries without including `<meta name="viewport">` in HTML.

**Why it's wrong:** Without the viewport meta tag, mobile browsers emulate desktop rendering at 980px width, ignoring media queries completely.

*Incorrect:*
```css
<!-- Missing viewport meta tag in HTML head -->
```

*Fix:*
```css
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

## 6. Practice Exercises

### Exercise 1: The Breakpoint

**Problem:** You have a button. By default, its `font-size` is `1rem`. You write a media query: `@media (min-width: 1024px) { button { font-size: 2rem; } }`. 
A user views the site on an iPad that is `800px` wide. What size is the button text?

**Expected output:**
> [!check]- Answer
> ```text
> `1rem`. 
> The iPad is 800px wide, which is NOT "at least 1024px wide". Therefore, the media query is completely ignored, and the default Mobile CSS is used.
> ```
> - Is 800 greater than or equal to 1024?
> 
---



### Exercise 2: Modern Range Media Query Syntax

**Problem:** Write modern CSS range media query triggering between 600px and 1024px viewport width.

**Expected output:**
> [!check]- Answer
> ```text
> @media (600px <= width <= 1024px) { ... }
> ```
> ```css
> @media (600px <= width <= 1024px) {
>   .sidebar { display: block; }
> }
> ```
>
> **Explanation:** Modern CSS Media Queries Level 4 syntax simplifies range queries.
> 
---

### Exercise 3: Dark Mode Media Query

**Problem:** Write media query detecting system dark mode preference (`prefers-color-scheme`).

**Expected output:**
> [!check]- Answer
> ```text
> @media (prefers-color-scheme: dark) { body { background: #121212; color: #fff; } }
> ```
> ```css
> @media (prefers-color-scheme: dark) {
>   body {
>     background-color: #121212;
>     color: #ffffff;
>   }
> }
> ```
>
> **Explanation:** `prefers-color-scheme` detects OS user dark mode preferences.
> 
## 7. Related Terms
- [`flex-direction`](../level_05/flex_direction.md) — Commonly toggled inside media queries for responsive layouts.
- [Mobile-First Design](mobile_first.md) — Progressive enhancement coding methodology.
- [Breakpoints](breakpoints.md) — The screen size thresholds that trigger layout changes.
- [`auto-fill` / `auto-fit`](../level_06/grid_auto_fill_fit.md) — Related concept: `auto-fill` / `auto-fit`.
- [Responsive Design (Concept)](responsive_design.md) — Related concept: Responsive Design (Concept).
- [Container Queries (`@container`)](../level_11/container_queries.md) — Related concept: Container Queries (`@container`).
- [Dark Mode (`prefers-color-scheme`)](../level_11/dark_mode.md) — Related concept: Dark Mode (`prefers-color-scheme`).
- [`@supports` (Feature Queries)](../level_11/supports.md) — Related concept: `@supports` (Feature Queries).
- [`var()` (CSS Custom Properties)](../level_11/var.md) — Related concept: `var()` (CSS Custom Properties).

---

## 8. Key Takeaways
- `@media` queries apply CSS rules only when specific screen size conditions are met.
- Always use **Mobile-First Design**: Write mobile CSS as the default, and use `min-width` to add desktop features.
- The pixel values where the layout changes (e.g., 768px, 1024px) are called **Breakpoints**.
