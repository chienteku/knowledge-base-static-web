# `align-self`

> **Level 5 — Layouts — Flexbox**
> A child-level Flexbox property that allows a single flex item to override the parent container's `align-items` configuration along the Cross Axis.

---

## 1. Prerequisites
- [`align-items`](../level_05/align_items.md) — The parent property that `align-self` overrides.

---

## 2. Term Category
- **Flexbox Property**

---

## 3. Environment Context
- **Universal Modern Standard** (Understood natively by all modern browsers. Re-calculates individual item coordinates along the Cross Axis without affecting sibling boxes).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Normally, Flexbox works from the top down: you set layout rules on the Parent container, and they apply to all the Children equally. 

For instance, applying `align-items: center;` to a horizontal navbar centers every logo, link, and button vertically.

But what if you want a single item—like a "New!" alert badge—to stick to the very top edge of the navbar, while everything else remains perfectly centered?

If you try to change the parent's `align-items`, it moves everything. 

To solve this, the W3C designed **`align-self`**. It is a child-level property. It acts as an override switch, letting an individual element break away from the parent's vertical alignment and align itself independently.

---

### (2) The Core Values
`align-self` accepts the exact same values as the parent's `align-items` property:

-   **`auto` (Default)**: Inherits the parent container's `align-items` value.
-   **`flex-start`**: Aligns the individual item to the top/start of the cross axis.
-   **`flex-end`**: Aligns the individual item to the bottom/end of the cross axis.
-   **`center`**: Aligns the individual item perfectly in the center.
-   **`stretch`**: Stretches the individual item to fill the height of the container.
-   **`baseline`**: Aligns the item along the text baseline.

---

### (3) Code Examples

#### Short Snippet
Nudging a single child button to the bottom:

```css
.parent-container {
  display: flex;
  align-items: center; /* Centers all children vertically */
  height: 200px;
}

.child-override {
  /* This specific child breaks away and aligns to the bottom! */
  align-self: flex-end; 
}
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Align Self Demo</title>
  <style>
    .flex-container {
      display: flex;
      align-items: center; /* All items centered vertically by default */
      height: 150px;
      background-color: #f0f0f0;
      border: 2px solid black;
      padding: 10px;
    }

    .item {
      width: 100px;
      padding: 15px;
      margin: 5px;
      background-color: lightblue;
      text-align: center;
      font-weight: bold;
    }

    /* Override items */
    .top-item {
      align-self: flex-start;
      background-color: lightgreen;
    }

    .bottom-item {
      align-self: flex-end;
      background-color: tomato;
      color: white;
    }
  </style>
</head>
<body>

  <div class="flex-container">
    <div class="item">Centered</div>
    <div class="item top-item">Top Aligned</div>
    <div class="item">Centered</div>
    <div class="item bottom-item">Bottom Aligned</div>
  </div>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Applying `align-self` to the parent container

**The mistake:** Writing `align-self` inside the container ruleset:

```css
/* BAD: Has no effect on layout! */
.parent {
  display: flex;
  align-self: center; 
}
```

**Why it's wrong:** `align-self` is a child-level property. It must be written inside the ruleset of the specific child item you want to override.

---

### Mistake 2: Expecting `align-self` to align items horizontally in a row

**The mistake:** Using `align-self` to push a single child to the far-right in a row.

**Why it's wrong:** In a row layout, horizontal spacing is controlled along the Main Axis by `justify-content`. `align-self` only controls the perpendicular Cross Axis (vertical spacing in a row). 

If you want to push a single child item to the far-right, use the margin trick: `margin-left: auto;`.

---



### Mistake 3: Applying `align-self` to the Flex Container Instead of Individual Flex Child Items

**The mistake:** Writing `.flex-container { align-self: flex-end; }`.

**Why it's wrong:** `align-self` is a child item property used to override the parent's `align-items` rule for a SINGLE flex item. It has no effect when applied to parent containers.

*Incorrect:*
```css
.container { display: flex; align-self: center; } /* ❌ Invalid property on parent! */
```

*Fix:*
```css
.container { display: flex; align-items: flex-start; }
.single-item { align-self: flex-end; } /* Overrides parent for 1 item */
```

### Mistake 4: Expecting `align-self` to Override Main Axis Alignment (`justify-content`)

**The mistake:** Attempting to use `align-self` to change horizontal position in a `flex-direction: row` container.

**Why it's wrong:** `align-self` operates strictly along the **Cross Axis**. Main axis alignment cannot be overridden per item via `align-self`. Use `margin-left: auto`.

*Incorrect:*
```css
/* Trying to override horizontal justify-content via align-self */
```

*Fix:*
```css
.item-right { margin-left: auto; } /* Margin auto overrides main axis position */
```

## 6. Practice Exercises

### Exercise 1: Layout Overrides

**Problem:** You have a horizontal navbar. The parent is styled with `display: flex; align-items: stretch;`. You have a logo item that needs to keep its natural height instead of stretching to match the navbar height. What property and value do you apply to the logo?

**Expected output:**
> [!check]- Answer
> ```css
> .logo {
>   align-self: center; /* Or flex-start, depending on alignment design */
> }
> ```
> - The parent forces stretching using `stretch`.
> - Override this behavior on the child ruleset.

---



### Exercise 2: Single Item Override Pattern

**Problem:** Write CSS where `.container` has `align-items: flex-start`, but `.special-item` aligns to `flex-end`.

**Expected output:**
> [!check]- Answer
> ```text
> .container { display: flex; align-items: flex-start; } .special-item { align-self: flex-end; }
> ```
> ```css
> .container {
>   display: flex;
>   align-items: flex-start;
> }
> .special-item {
>   align-self: flex-end;
> }
> ```
>
> **Explanation:** `align-self` overrides parent container `align-items` rules for specific items.

---

### Exercise 3: align-self Default Value

**Problem:** What is the default value of `align-self` on flex items?

**Expected output:**
> [!check]- Answer
> ```text
> align-self: auto (inherits parent align-items value).
> ```
> ```text
> align-self: auto (inherits parent align-items value).
> ```
>
> **Explanation:** `auto` inherits the parent container's `align-items` rule.

## 7. Related Terms
- [`align-items`](../level_05/align_items.md) — The parent alignment controller.
- [`justify-content`](../level_05/justify_content.md) — The main axis spacing controller.
- [`order`](../level_05/order.md) — The visual child ordering property.

---

## 8. Key Takeaways
- `align-self` is applied to individual child flex items.
- It overrides the parent container's `align-items` setting along the Cross Axis.
- It accepts the values: `auto`, `flex-start`, `flex-end`, `center`, `stretch`, and `baseline`.
- It does not affect main-axis alignment (cannot replace `justify-content`).
