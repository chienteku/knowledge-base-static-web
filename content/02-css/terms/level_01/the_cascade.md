# The Cascade

> **Level 1 — Core Concepts**
> The algorithm the browser uses to resolve conflicts when multiple rules apply to the exact same element.

---

## 1. Prerequisites
- [CSS](../level_01/css.md) — It's right in the name: *Cascading* Style Sheets!
- [Ruleset](../level_01/ruleset.md) — The cascade resolves conflicts between multiple rulesets.

---

## 2. Term Category
- **Core Concept / Browser Architecture**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Winner

**Problem:** Look at the following code. What color will the `<h1>` be?
```css
h1 { color: purple; }
h1 { color: orange; }
h1 { color: pink; }
```

**Expected output:**
> [!check]- Answer
> ```text
> Pink! Because all three rules have the exact same selector, the cascade relies entirely on source order. The last rule wins.
> ```
> - Which rule does the browser read last?

---



### Exercise 2: 3 Steps of Cascade Resolution

**Problem:** List the 3 criteria CSS uses in order to resolve conflicts between competing declarations.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Importance & Origin (User-Agent, Author, !important)
> 2. Specificity (Inline, ID, Class, Type)
> 3. Source Order (Last declared wins)
> ```
> ```text
> 1. Importance & Origin (User-Agent, Author, !important)
> 2. Specificity (Inline, ID, Class, Type)
> 3. Source Order (Last declared wins)
> ```
>
> **Explanation:** The Cascade algorithm evaluates origin, specificity, and order to determine winning styles.

---

### Exercise 3: Cascade Layers (@layer) Purpose

**Problem:** How do modern CSS Cascade Layers (`@layer`) control style precedence independent of selector specificity?

**Expected output:**
> [!check]- Answer
> ```text
> Styles in later declared @layer blocks take precedence over earlier layers regardless of selector specificity.
> ```
> ```css
> @layer base, components;
> @layer base { #hero { color: red; } }
> @layer components { .title { color: blue; } } /* Components layer wins! */
> ```
>
> **Explanation:** `@layer` grants explicit architecture control over cascade precedence.

## 7. Related Terms
- [Specificity](../level_01/specificity.md) — The only thing that can override the Rule of Source Order. If a rule is more "specific", it wins even if it comes first in the file!
- [`!important` Declaration](../level_01/important.md) — The global cascading priority flag.
- [Inheritance](../level_01/inheritance.md) — The cascade's baseline target resolution mechanism.

---

## 8. Key Takeaways
- The "Cascade" is the algorithm that resolves CSS conflicts.
- **Source Order**: If two conflicting rules have the same weight, the rule that appears furthest down in the file wins.
- This applies to `<link>` tags in HTML as well; link your custom CSS last!
