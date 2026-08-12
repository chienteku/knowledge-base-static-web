# The Cascade

> **Level 1 — Core Concepts**
> The algorithm the browser uses to resolve conflicts when multiple rules apply to the exact same element.

---

## 1. Prerequisites
- [CSS (Cascading Style Sheets)](css.md) — It's right in the name: *Cascading* Style Sheets!
- [Ruleset (Declaration, Property, Value)](ruleset.md) — The cascade resolves conflicts between multiple rulesets.

---

## 2. Term Category

**Core Concept / Browser Architecture (Universal Browser Support)**: The Cascade is a fundamental concept in this technology stack. **Level 1 — Core Concepts**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Because CSS allows you to target elements in many different ways (by tag name, by class, by ID), it is incredibly common to accidentally write multiple rules that target the *exact same element*. 
For example, you might have a rule that says "Make all buttons blue," and another rule further down that says "Make the submit button green." If the submit button is a `<button>`, which rule wins?
The W3C created **The Cascade** as a strict, predictable set of rules to determine the winner. The most fundamental rule of the cascade is the "Rule of Source Order": If two rules have the exact same level of importance, the one that appears **last** in the CSS file wins. It "cascades" downwards, overriding previous instructions.

### (2) Reality Metaphor
Imagine a waterfall (a cascade) flowing down a mountain. The water at the top might be clear, but if it picks up mud halfway down, the water at the bottom will be muddy. The final outcome is determined by the last thing that touched it.
In CSS, the browser reads the file from top to bottom. If line 10 says the button is blue, and line 50 says the button is green, the instruction on line 50 overwrites line 10. 

### (3) Code Examples

#### Source Order Conflict
```css
/* Rule 1: Make paragraphs red */
p {
  color: red;
}

/* ... 100 lines of code later ... */

/* Rule 2: Make paragraphs blue */
p {
  color: blue;
}

/* Result: The paragraph will be BLUE, because Rule 2 comes last in the cascade. */
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Not understanding file linking order

**The mistake:** Linking a CSS framework (like Bootstrap) *after* your own custom CSS file in the HTML, and wondering why your custom styles aren't working.

**Why it's wrong:** The cascade applies to HTML `<link>` tags too! If you link `bootstrap.css` after `my-styles.css`, the browser reads Bootstrap last. Bootstrap's rules will cascade over your custom rules and overwrite them. You should always link third-party libraries first, and your own custom CSS last, so your rules win.

*Incorrect:*
```html
<head>
  <link rel="stylesheet" href="my-styles.css">
  <link rel="stylesheet" href="bootstrap.css"> <!-- Wins! -->
</head>
```

*Fix:*
```html
<head>
  <link rel="stylesheet" href="bootstrap.css">
  <link rel="stylesheet" href="my-styles.css"> <!-- Wins! -->
</head>
```

---



### Mistake 2: Assuming Later CSS Rules Always Win Regardless of Specificity

**The mistake:** Placing `p { color: red; }` at line 100 expecting it to override `.text { color: blue; }` at line 10.

**Why it's wrong:** The CSS Cascade evaluates 3 factors in order: **1. Origin & Importance -> 2. Specificity -> 3. Source Order**. Class `.text` has higher specificity than type `p`, so source order is ignored.

*Incorrect:*
```css
.text { color: blue; } /* Line 10 (Specificity 0-1-0) WINS */
p { color: red; } /* Line 100 (Specificity 0-0-1) LOSES */
```

*Fix:*
```css
p.text { color: red; } /* Equal/higher specificity rule placed later wins */
```

### Mistake 3: Confusing Author Stylesheet Rules with Browser User-Agent Stylesheet Defaults

**The mistake:** Expecting un-styled `<h1>` elements to have zero margins.

**Why it's wrong:** Browsers apply a default User-Agent stylesheet before author styles load (`h1 { margin: 0.67em 0; }`). Use a CSS Reset or explicit declarations.

*Incorrect:*
```css
/* Expecting h1 to have zero margin by default */
```

*Fix:*
```css
* { margin: 0; padding: 0; } /* Reset User-Agent defaults */
```

## 5. Practice Exercises

### Exercise 1: Understanding Order of Appearance Resolution in CSS Cascade Rules

**Scenario:** An author demonstrates how the CSS Cascade resolves matching selectors of equal specificity based on order of appearance.

**Requirements:**
1. Create two matching class selectors with equal specificity (`0,1,0`).
2. Demonstrate that the rule listed last in the CSS file wins.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Equal Specificity Rule 1 (0,1,0) */
> .alert-box {
>   background-color: #fef3c7;
>   color: #92400e;
>   padding: 1rem;
>   border-radius: 0.375rem;
> }
>
> /* Equal Specificity Rule 2 (0,1,0) - Listed LAST in file -> WINS THE CASCADE! */
> .alert-box {
>   background-color: #fee2e2;
>   color: #991b1b;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The CSS Cascade Algorithm**: The fundamental engine in CSS that combines Origin, Importance, Specificity, and Order of Appearance to determine final property values.
> 2. **Order of Appearance Rule**: When two rules have identical origin and equal specificity, the rule that appears LAST in the stylesheet wins.
> 3. **Stylesheet Import Sequence**: The order of `<link>` tags in HTML matters; downstream stylesheets override upstream rules of equal weight.
> 
---

### Exercise 2: Managing Author Stylesheet Cascade Layers with @layer

**Scenario:** Organizes stylesheet cascade precedence using modern CSS `@layer` rules.

**Requirements:**
1. Declare `@layer base, components, utilities;` in stylesheet header.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Establish explicit Cascade Layer Precedence (left to right) */
> @layer base, components, utilities;
>
> @layer base {
>   button {
>     padding: 0.5rem 1rem;
>     background-color: #94a3b8;
>   }
> }
>
> @layer components {
>   .btn-primary {
>     background-color: #2563eb;
>     color: #ffffff;
>   }
> }
>
> @layer utilities {
>   .u-bg-dark {
>     background-color: #0f172a;
>   }
> }
> ```
>
> #### Technical Explanation
>
> 1. **CSS Cascade Layers (`@layer`)**: Modern CSS feature that allows developers to control cascade priority explicitly regardless of selector specificity or file order.
> 2. **Layer Precedence**: Layers declared later (`utilities`) ALWAYS override earlier layers (`base`), even if the base selector has higher specificity!
> 3. **Solving Specificity Wars**: Eliminates third-party CSS library specificity conflicts cleanly without `!important` hacks.
> 
---

### Exercise 3: User Agent Stylesheet Overrides with Modern Base Resets

**Scenario:** Demonstrates how author CSS rules override browser User Agent default styles in the cascade.

**Requirements:**
1. Override browser user-agent margins and button fonts.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Author Style Override of User-Agent Defaults */
> body {
>   margin: 0;                   /* Overrides browser 8px default margin */
> }
>
> button {
>   font-family: inherit;        /* Overrides browser default button font */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Cascade Origins**: The Cascade evaluates Origin priority: User-Agent Styles < User Styles < Author Styles < Author !important < User !important.
> 2. **Author Origin Dominance**: Normal author styles written by web developers automatically override default browser User-Agent stylesheets.
> 3. **Cross-Browser Consistency**: CSS Resets harmonize User-Agent differences across Chrome, Firefox, and Safari.
## 6. Related Terms
- [Specificity](specificity.md) — The only thing that can override the Rule of Source Order. If a rule is more "specific", it wins even if it comes first in the file!
- [`!important` Declaration](important.md) — The global cascading priority flag.
- [Inheritance](inheritance.md) — The cascade's baseline target resolution mechanism.
- [Ruleset (Declaration, Property, Value)](ruleset.md) — Related concept: Ruleset (Declaration, Property, Value).
- [`@import`](../level_11/import.md) — Related concept: `@import`.
- [CSS (Cascading Style Sheets)](css.md) — Related concept: CSS (Cascading Style Sheets).

---

## 7. Key Takeaways
- The "Cascade" is the algorithm that resolves CSS conflicts.
- **Source Order**: If two conflicting rules have the same weight, the rule that appears furthest down in the file wins.
- This applies to `<link>` tags in HTML as well; link your custom CSS last!
