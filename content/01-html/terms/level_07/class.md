# `class` Attribute

> **Level 7 — Global Attributes**
> An identifier used to group multiple elements together, primarily for applying CSS styles.

---

## 1. Prerequisites
- [Attribute](../level_01/attribute.md) — The fundamental concept of providing extra information inside a starting tag.
- [`id` Attribute](../level_07/id.md) — The unique identifier that contrasts with `class`.

---

## 2. Term Category
- **Global Attribute**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
The `id` attribute is great for finding *one* specific element, but what if you have 20 different error messages on a page and you want to make all of them red? You don't want to write 20 different IDs (`error-1`, `error-2`, etc.) and write 20 different CSS rules.
The W3C created the `class` attribute as a way to group multiple, unrelated elements into a single category. You can apply the exact same `class` to a `<p>`, a `<div>`, and a `<button>`. Then, using CSS, you can write a single rule that instantly styles every element sharing that class. 
Furthermore, unlike the `id` attribute, a single element can actually have *multiple* classes applied to it at the same time!

### (2) Reality Metaphor
Imagine a clothing store.
The `id` is the barcode on a specific pair of pants.
The `class` is the category. A shirt might have the class "mens-wear", "summer-collection", and "sale-item". By grouping items with classes, the manager can easily say, "Apply a 20% discount to everything in the 'sale-item' class," and it will automatically apply to shirts, pants, and hats.

### (3) Code Examples

#### Short Snippet
```html
<!-- Multiple elements sharing the exact same class -->
<p class="error-text">Invalid password.</p>
<span class="error-text">Please try again.</span>
```

#### Fuller Example
```html
<!-- An element can have MULTIPLE classes separated by a space! -->
<button class="btn btn-primary btn-large">Submit</button>
<button class="btn btn-secondary">Cancel</button>

<style>
  /* CSS to style the classes */
  .btn { border-radius: 4px; font-weight: bold; }
  .btn-primary { background-color: blue; color: white; }
  .btn-secondary { background-color: gray; }
  .btn-large { padding: 20px; font-size: 24px; }
</style>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Separating multiple classes with commas

**The mistake:** Trying to apply multiple classes to an element by separating them with commas.

**Why it's wrong:** HTML interprets the `class` attribute value as a space-separated list. If you put a comma in it, the browser will think the comma is literally part of the class name! 

*Incorrect:*
```html
<!-- The browser thinks the class name is literally "card," (with a comma) -->
<div class="card, dark-mode, shadow"></div>
```

*Fix:*
```html
<!-- Classes must be separated only by spaces -->
<div class="card dark-mode shadow"></div>
```

---



### Mistake 2: Using Presentational Class Names (`class="red-bold-text"`) Instead of Semantic Class Names

**The mistake:** Naming classes after visual properties like `class="blue-box-right"`.

**Why it's wrong:** If design specifications change blue boxes to green or left-aligned, presentational class names become misleading. Name classes after their semantic component role (`class="alert-box"`).

*Incorrect:*
```html
<div class="red-text-large">Error</div> <!-- ❌ Presentational class name -->
```

*Fix:*
```html
<div class="error-message">Error</div> <!-- Semantic role-based class name -->
```

### Mistake 3: Separating Multiple Classes with Commas Instead of Spaces

**The mistake:** Writing `<div class="btn, primary, active">`.

**Why it's wrong:** HTML `class` attributes accept a single space-separated string of class names. Commas are parsed as part of the class name character string.

*Incorrect:*
```html
<button class="btn, btn-primary">Save</button> <!-- ❌ Commas treated as string characters! -->
```

*Fix:*
```html
<button class="btn btn-primary">Save</button> <!-- Space-separated class list -->
```

## 6. Practice Exercises

### Exercise 1: ID vs Class

**Problem:** You are building a navigation menu with 5 links. When the user hovers over any of the links, they should turn blue. Should you use an `id` or a `class` to apply this style?

**Expected output:**
> [!check]- Answer
> ```text
> A `class`! Because you want to apply the exact same style to 5 different elements. IDs must be unique and can only be used once.
> ```
> - Are there multiple elements that need to share this behavior?

---



### Exercise 2: Multiple Class Application

**Problem:** Apply classes `card`, `card-featured`, and `shadow` to a `<div>` element.

**Expected output:**
> [!check]- Answer
> ```text
> <div class="card card-featured shadow">Content</div>
> ```
> ```html
> <div class="card card-featured shadow">Content</div>
> ```
>
> **Explanation:** Multiple CSS classes are declared in a space-delimited list.

---

### Exercise 3: JavaScript classList API

**Problem:** Which JavaScript DOM API method adds a class to an element without overwriting existing classes?

**Expected output:**
> [!check]- Answer
> ```text
> element.classList.add('className')
> ```
> ```javascript
> element.classList.add('active');
> ```
>
> **Explanation:** `.classList.add()` safely appends classes to the element class token list.

## 7. Related Terms
- [`id` Attribute](../level_07/id.md) — The strictly unique identifier.
- [`style` Attribute](../level_07/style.md) — Another global attribute used to apply CSS directly to an element.
- [`data-*` Attributes](../level_07/data_attributes.md) — Custom metadata values often styled alongside classes.

---

## 8. Key Takeaways
- The `class` attribute is used to group multiple elements together.
- You can apply the exact same class to as many elements as you want.
- A single element can have multiple classes (separated by a space).
- It is the primary way developers target elements with CSS to apply styling.
