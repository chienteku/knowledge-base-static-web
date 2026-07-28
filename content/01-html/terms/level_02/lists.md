# `<ul>`, `<ol>`, and `<li>` (Lists)

> **Level 2 — Text & Content**
> Tags for creating unordered (bulleted) and ordered (numbered) lists.

---

## 1. Prerequisites
- [Element vs. Tag](../level_01/element_vs_tag.md) — The tag syntax rules.
- [Nesting](../level_01/nesting.md) — Understanding how `<li>` elements nest inside parent `<ul>` or `<ol>` elements.
- [Block-level vs Inline Elements](../level_01/block_inline.md) — Since list containers and list items are block-level elements.

---

## 2. Term Category
- **Structural Tag**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Presenting items in a structured list is one of the most common ways to format information. Instead of relying on developers to manually type `1.`, `2.`, `3.` or insert bullet characters (`•`) inside paragraph tags, HTML provides dedicated list elements.
This is critical for two reasons:
1. **Maintainability:** If you add a new item to the middle of a numbered list, the browser automatically recalculates all the numbers for you.
2. **Accessibility:** A screen reader will explicitly announce to a blind user: "List with 3 items," allowing them to understand the structure of the data rather than just hearing random bullet characters read aloud.

The W3C separated lists into two types: **Unordered** (`<ul>`) for bullet points where sequence doesn't matter, and **Ordered** (`<ol>`) for numbered items where sequence is important. Both types share the same child element: the **List Item** (`<li>`).

### (2) Reality Metaphor
Imagine writing a grocery list vs. a recipe.
A grocery list is Unordered (`<ul>`). It doesn't matter if you grab the milk before the eggs.
A recipe's instructions are Ordered (`<ol>`). You must mix the ingredients (Step 1) *before* you put them in the oven (Step 2).
In both cases, each individual line on the paper is a List Item (`<li>`).

### (3) Code Examples

#### Short Snippet
```html
<!-- An Unordered List (Bullets) -->
<ul>
  <li>Apples</li>
  <li>Bananas</li>
</ul>

<!-- An Ordered List (Numbers) -->
<ol>
  <li>Preheat the oven</li>
  <li>Mix the ingredients</li>
</ol>
```

#### Fuller Example
```html
<h2>My Travel Itinerary</h2>

<h3>Things to Pack</h3>
<ul>
  <li>Passport</li>
  <li>Camera</li>
  <li>Comfortable shoes</li>
</ul>

<h3>Daily Schedule</h3>
<ol>
  <li>Arrive at the airport.</li>
  <li>Check in to the hotel.</li>
  <li>Visit the museum.</li>
  <li>Eat dinner.</li>
</ol>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Putting content directly inside `<ul>` or `<ol>`

**The mistake:** Writing text or placing other tags directly inside the `<ul>` or `<ol>` tags without wrapping them in an `<li>` tag first.

**Why it's wrong:** The HTML specification dictates that the *only* valid direct children of a `<ul>` or `<ol>` are `<li>` elements. Putting raw text or a `<p>` tag directly inside a list container breaks the structural semantics and can cause rendering errors.

*Incorrect:*
```html
<ul>
  <p>Here are my favorite foods:</p> <!-- INVALID: Not an <li> -->
  <li>Pizza</li>
  <li>Tacos</li>
</ul>
```

*Fix:*
```html
<p>Here are my favorite foods:</p>
<ul>
  <li>Pizza</li>
  <li>Tacos</li>
</ul>
```

---



### Mistake 2: Placing Non-`<li>` Direct Children Inside `<ul>` or `<ol>` Containers

**The mistake:** Placing `<div>` or `<p>` directly inside a `<ul>` list.

**Why it's wrong:** HTML specifications strictly mandate that the ONLY direct children allowed inside `<ul>` or `<ol>` elements are `<li>` list items. Place containers inside `<li>`.

*Incorrect:*
```html
<ul>
  <div>Item 1</div> <!-- ❌ Direct div child invalid in ul! -->
  <div>Item 2</div>
</ul>
```

*Fix:*
```html
<ul>
  <li><div>Item 1</div></li>
  <li><div>Item 2</div></li>
</ul>
```

### Mistake 3: Using Ordered Lists (`<ol>`) for Unordered Content

**The mistake:** Using `<ol>` to list nav menu items or feature tags.

**Why it's wrong:** `<ol>` implies numerical or sequential priority (1, 2, 3). For unordered items where sequence order doesn't matter, use `<ul>`.

*Incorrect:*
```html
<ol>
  <li>Home</li>
  <li>Contact</li> <!-- ❌ Sequence numbers 1, 2 convey wrong meaning -->
</ol>
```

*Fix:*
```html
<ul>
  <li>Home</li>
  <li>Contact</li>
</ul>
```



### Mistake 4: Placing Non-`<li>` Direct Children Inside `<ul>` or `<ol>` Containers

**The mistake:** Placing `<div>` or `<p>` directly inside a `<ul>` list.

**Why it's wrong:** HTML specifications strictly mandate that the ONLY direct children allowed inside `<ul>` or `<ol>` elements are `<li>` list items. Place containers inside `<li>`.

*Incorrect:*
```html
<ul>
  <div>Item 1</div> <!-- ❌ Direct div child invalid in ul! -->
  <div>Item 2</div>
</ul>
```

*Fix:*
```html
<ul>
  <li><div>Item 1</div></li>
  <li><div>Item 2</div></li>
</ul>
```

### Mistake 5: Using Ordered Lists (`<ol>`) for Unordered Content

**The mistake:** Using `<ol>` to list nav menu items or feature tags.

**Why it's wrong:** `<ol>` implies numerical or sequential priority (1, 2, 3). For unordered items where sequence order doesn't matter, use `<ul>`.

*Incorrect:*
```html
<ol>
  <li>Home</li>
  <li>Contact</li> <!-- ❌ Sequence numbers 1, 2 convey wrong meaning -->
</ol>
```

*Fix:*
```html
<ul>
  <li>Home</li>
  <li>Contact</li>
</ul>
```



### Mistake 6: Placing Non-`<li>` Direct Children Inside `<ul>` or `<ol>` Containers

**The mistake:** Placing `<div>` or `<p>` directly inside a `<ul>` list.

**Why it's wrong:** HTML specifications strictly mandate that the ONLY direct children allowed inside `<ul>` or `<ol>` elements are `<li>` list items. Place containers inside `<li>`.

*Incorrect:*
```html
<ul>
  <div>Item 1</div> <!-- ❌ Direct div child invalid in ul! -->
  <div>Item 2</div>
</ul>
```

*Fix:*
```html
<ul>
  <li><div>Item 1</div></li>
  <li><div>Item 2</div></li>
</ul>
```

### Mistake 7: Using Ordered Lists (`<ol>`) for Unordered Content

**The mistake:** Using `<ol>` to list nav menu items or feature tags.

**Why it's wrong:** `<ol>` implies numerical or sequential priority (1, 2, 3). For unordered items where sequence order doesn't matter, use `<ul>`.

*Incorrect:*
```html
<ol>
  <li>Home</li>
  <li>Contact</li> <!-- ❌ Sequence numbers 1, 2 convey wrong meaning -->
</ol>
```

*Fix:*
```html
<ul>
  <li>Home</li>
  <li>Contact</li>
</ul>
```

## 6. Practice Exercises

### Exercise 1: Nested Lists Syntax

**Problem:** How would you write the HTML for a bulleted list of two countries (USA, Japan), where USA has a nested bulleted list of two states (Texas, California)?

**Expected output:**
> [!check]- Answer
> ```html
> <ul>
>   <li>
>     USA
>     <ul>
>       <li>Texas</li>
>       <li>California</li>
>     </ul>
>   </li>
>   <li>Japan</li>
> </ul>
> ```
> - The nested `<ul>` must go *inside* the `<li>` of the parent item, not outside of it!

---

### Exercise 2: Structuring Nested Lists

**Problem:** Structure an unordered list `Fruits` containing nested sub-list with `Apples` and `Bananas`.

**Expected output:**
> [!check]- Answer
> ```html
> <ul>
>   <li>Fruits
>     <ul>
>       <li>Apples</li>
>       <li>Bananas</li>
>     </ul>
>   </li>
> </ul>
> ```
>
> **Explanation:** Nested lists must be placed inside an `<li>` element of the parent list.

---

### Exercise 3: Reversing Ordered List Numbers

**Problem:** Which attribute on `<ol>` reverses number ordering (e.g. 3, 2, 1)?

**Expected output:**
> [!check]- Answer
> ```html
> <ol reversed>
>   <li>Top 1</li>
>   <li>Top 2</li>
>   <li>Top 3</li>
> </ol>
> ```
>
> **Explanation:** `reversed` attribute counts ordered lists backwards.

## 7. Related Terms
- [Block-level vs Inline Elements](../level_01/block_inline.md) — The display behavior governing lists.
- [`<nav>`](../level_06/nav.md) — Unordered lists are very commonly used inside `<nav>` elements to build website navigation menus.

---

## 8. Key Takeaways
- Use `<ul>` for bulleted lists (order doesn't matter).
- Use `<ol>` for numbered lists (order matters).
- The *only* elements allowed directly inside `<ul>` or `<ol>` are `<li>` (List Item) elements.
- Lists can be nested inside other lists.
