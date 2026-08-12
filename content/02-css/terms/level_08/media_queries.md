# `@media` (Media Queries Basics)

> **Level 8 — Responsive Design & Units**
> The CSS rule that allows you to apply different styles based on the size of the user's device (e.g., changing the layout when viewed on an iPhone vs a Desktop monitor).

---

## 1. Prerequisites
- [`%` (Percentages)](percentages.md) — While fluid units handle small adjustments, Media Queries handle massive structural changes.

---

## 2. Term Category

**CSS At-Rule (Universal Modern Standard .)**: `@media` (Media Queries Basics) is a fundamental concept in this technology stack. **Level 8 — Responsive Design & Units**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Mobile-First Feature Expansion via min-width Media Queries

**Scenario:** An author writes a mobile-first stylesheet using `@media (min-width: ...)` to progressively enhance a card layout.

**Requirements:**
1. Set default mobile styles.
2. Add `@media (min-width: 48rem)` query for desktop grid.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Mobile Styles Baseline (0px - 767px) */
> .feature-card {
>   display: flex;
>   flex-direction: column;
>   padding: 1rem;
> }
>
> /* Progressive Desktop Enhancement (>= 768px) */
> @media (min-width: 48rem) {
>   .feature-card {
>     flex-direction: row;
>     align-items: center;
>     padding: 2rem;
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `@media` Rule**: Applies a block of CSS rules ONLY when specified media conditions (such as screen width) evaluate to true.
> 2. **`min-width` Mobile-First Pattern**: Using `min-width` applies styles from smaller viewports upward, creating clean progressive enhancements.
> 3. **Viewport Width Evaluation**: Evaluates against the physical layout viewport width of the user's browser device.
> 
---

### Exercise 2: Dark Mode Preference Adaptations via prefers-color-scheme

**Scenario:** Applies dark theme styles automatically based on OS dark mode preference using `@media (prefers-color-scheme: dark)`.

**Requirements:**
1. Apply `@media (prefers-color-scheme: dark)` background and text color overrides.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Light Theme Baseline Default */
> body {
>   background-color: #ffffff;
>   color: #1e293b;
> }
>
> /* OS Dark Mode Preference Override */
> @media (prefers-color-scheme: dark) {
>   body {
>     background-color: #0f172a;
>     color: #f8fafc;
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. **`prefers-color-scheme` Media Feature**: Detects if the user has requested a light or dark color theme in their operating system settings.
> 2. **System Theme Harmony**: Adapts application colors instantly without requiring user manual theme toggle interaction.
> 3. **WCAG Accessibility**: Provides immediate high-contrast accessibility for dark mode users.
> 
---

### Exercise 3: Reduced Motion Accessibility Adaptations via prefers-reduced-motion

**Scenario:** Disables heavy CSS animations for users with motion sensitivity using `@media (prefers-reduced-motion: reduce)`.

**Requirements:**
1. Apply `@media (prefers-reduced-motion: reduce)` to disable transitions and animations.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Default interactive transition */
> .btn-animated {
>   transition: transform 0.3s ease, background-color 0.3s ease;
> }
>
> /* Reduced Motion Override for Accessibility */
> @media (prefers-reduced-motion: reduce) {
>   *, *::before, *::after {
>     animation-duration: 0.01ms !important;
>     animation-iteration-count: 1 !important;
>     transition-duration: 0.01ms !important;
>     scroll-behavior: auto !important;
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. **`prefers-reduced-motion` Media Feature**: Detects if the user has requested the system minimize vestibular motion effects.
> 2. **Vestibular Disorder Protection**: Prevents dizziness, nausea, and motion sickness for users sensitive to large parallax animations or zooms.
> 3. **WCAG 2.1 SC 2.3.3 (Animation from Interactions)**: Essential media query for achieving WCAG AAA accessibility compliance.
## 6. Related Terms
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

## 7. Key Takeaways
- `@media` queries apply CSS rules only when specific screen size conditions are met.
- Always use **Mobile-First Design**: Write mobile CSS as the default, and use `min-width` to add desktop features.
- The pixel values where the layout changes (e.g., 768px, 1024px) are called **Breakpoints**.
