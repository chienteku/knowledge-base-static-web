# Combinator Selectors

> **Level 11 — Modern CSS Architecture & Functions**
> Selectors that target elements based on their relationships in the HTML document tree, including descendant (space), child (`>`), adjacent sibling (`+`), and general sibling (`~`) combinators.

---

## 1. Prerequisites
- [Selectors (Element, Class, ID)](../level_01/selectors.md) — Base element and class matching.
- [Specificity](../level_01/specificity.md) — How selectors accumulate matching priorities.

---

## 2. Term Category
- **Core Concept**

---

## 3. Environment Context
- **Universal Modern Standard** (Evaluated directly inside the browser's CSSOM parsing thread to index parent-child DOM structures).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In HTML, elements are nested in a tree structure. 

Sometimes, you want to style an element based on where it sits in relation to other elements:
-   Styling paragraphs inside articles differently than paragraphs in sidebars.
-   Adding spacing between a title and the first paragraph that immediately follows it.
-   Styling a text label green only when it follows a checked checkbox input.

If you had to manually assign class names like `class="first-paragraph-after-header"` to every HTML tag, your code would get bloated. 

To solve this, CSS introduced **Combinators**. These selectors target elements by describing their relationships in the DOM tree.

---

### (2) The Four Combinators

#### 1. Descendant Combinator (Space ` `)
Selects **any** element nested inside the parent, no matter how deep (children, grandchildren, etc.).
-   Syntax: `div p` (Selects every `<p>` inside a `<div>`).

#### 2. Child Combinator (Greater Than `>`)
Selects elements that are **direct children** of the parent. It ignores grandchildren or deeper nested layers.
-   Syntax: `article > p` (Selects only paragraphs directly inside `<article>`).

#### 3. Adjacent Sibling Combinator (Plus `+`)
Selects an element that is **immediately next to** another element at the same level.
-   Syntax: `h2 + p` (Selects only the first paragraph that directly follows a `<h2>`).

#### 4. General Sibling Combinator (Tilde `~`)
Selects **all** sibling elements that follow another element at the same level, even if they aren't immediately next to it.
-   Syntax: `h2 ~ p` (Selects all paragraphs that appear after a `<h2>`).

---

### (3) Code Examples

#### Short Snippet
Comparing descendant vs child selectors:

```html
<!-- HTML Structure -->
<div class="box">
  <p>Direct Child (Matched by both .box p and .box > p)</p>
  <span>
    <p>Grandchild (Matched by .box p, but NOT .box > p!)</p>
  </span>
</div>
```

```css
/* Styles both paragraphs */
.box p { color: gray; }

/* Styles only the first paragraph */
.box > p { font-weight: bold; }
```

#### Fuller Example (Interactive Form Checkbox)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Combinators Demo</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 30px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    /* 1. SIBLING COMBINATOR (+):
       Style the label ONLY when the input checkbox is checked! */
    input[type="checkbox"]:checked + label {
      color: forestgreen;
      font-weight: bold;
    }

    /* Hide text by default */
    .hint-text {
      display: none;
      color: #666;
    }

    /* 2. GENERAL SIBLING COMBINATOR (~):
       Show the hint paragraph when the input checkbox is checked! */
    input[type="checkbox"]:checked ~ .hint-text {
      display: block;
      margin-top: 5px;
    }
  </style>
</head>
<body>

  <div class="form-group">
    <input type="checkbox" id="terms">
    <label for="terms">I accept the Terms and Conditions</label>
    <p class="hint-text">Thank you! You can now click submit.</p>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting sibling combinators to work backwards or upwards

**The mistake:** Declaring `label + input` or `p ~ h2` and expecting it to style the label or header.

**Why it's wrong:** CSS selectors only parse **downwards** (from parent to child) and **forwards** (from current sibling to future siblings). CSS cannot look "up" the DOM tree to select a parent, nor can it look "backwards" to select a previous sibling.

**Fix: Ensure the trigger element (e.g. `input`) precedes the styled element (e.g. `label`) in the HTML markup.**

---



### Mistake 2: Confusing Descendant Combinator (Space ` `) with Child Combinator (`>`)

**The mistake:** Using `article > p` expecting to target paragraphs nested inside `article > div > p`.

**Why it's wrong:** Child combinator `>` selects ONLY direct 1st-level child elements. Descendant space combinator ` ` selects target elements at ANY depth level inside the container.

*Incorrect:*
```css
article > p { color: red; } /* ❌ Misses <p> nested inside <section>! */
```

*Fix:*
```css
article p { color: red; } /* Matches all descendant paragraphs at any depth */
```

### Mistake 3: Confusing Adjacent Sibling (`+`) with General Sibling (`~`) Combinators

**The mistake:** Using `h2 + p` expecting to target ALL paragraphs following an `<h2>` element.

**Why it's wrong:** Adjacent sibling `+` targets ONLY the single element immediately following the first element. General sibling `~` targets ALL matching siblings that follow.

*Incorrect:*
```css
h2 + p { color: blue; } /* ❌ Targets ONLY the first immediately following paragraph! */
```

*Fix:*
```css
h2 ~ p { color: blue; } /* Targets ALL subsequent sibling paragraphs */
```

## 6. Practice Exercises

### Exercise 1: Clean Spacing

**Problem:** You have a blog post container `.post`. You want to select any paragraph (`p`) that is a direct child of `.post`, but only if it immediately follows a heading `h3` inside the container. Write the CSS selector.

**Expected output:**
> [!check]- Answer
> ```css
> .post > h3 + p {
>   /* target paragraph style rules go here */
> }
> ```
> - The `h3` must be a direct child of `.post` (`.post > h3`).
> - The paragraph must immediately follow the heading (`+ p`).

---



### Exercise 2: CSS Combinators Matrix

**Problem:** Match combinator symbol to selection behavior:
1. Space ` ` 
2. Child `>` 
3. Adjacent Sibling `+` 
4. General Sibling `~` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. All descendant elements at any depth
> 2. Direct 1st-level child elements only
> 3. Immediately adjacent following sibling
> 4. All subsequent following siblings
> ```
> ```text
> 1. Space -> Descendant at any depth
> 2. > -> Direct child only
> 3. + -> Immediately adjacent following sibling
> 4. ~ -> All subsequent following siblings
> ```
>
> **Explanation:** Combinators define structural relationships between CSS selectors.

---

### Exercise 3: Lobed Form Element Sibling Pattern

**Problem:** Write CSS `+` adjacent sibling rule highlighting error message `<span class="err">` immediately following invalid `<input class="invalid">`.

**Expected output:**
> [!check]- Answer
> ```text
> input.invalid + span.err { color: red; }
> ```
> ```css
> input.invalid + span.err {
>   color: red;
> }
> ```
>
> **Explanation:** `+` targets immediately adjacent sibling elements.

## 7. Related Terms
- [Attribute Selectors](attribute_selectors.md) — Selective attribute matching.
- [Advanced Pseudo-classes](../level_09/pseudo_classes_advanced.md) — Positional structural styling hooks.
- [Selectors (Element, Class, ID)](../level_01/selectors.md) — Related concept: Selectors (Element, Class, ID).

---

## 8. Key Takeaways
- Combinators target elements based on their relationships in the DOM tree.
- Space (` `) matches any descendant (child, grandchild, etc.).
- Greater than (`>`) matches only direct children.
- Plus (`+`) matches the adjacent sibling immediately next to it.
- Tilde (`~`) matches all subsequent siblings.
- CSS combinators cannot select parent elements or previous siblings.
