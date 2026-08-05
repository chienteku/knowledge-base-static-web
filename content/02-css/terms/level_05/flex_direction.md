# `flex-direction`

> **Level 5 — Layouts — Flexbox**
> The property that tells a Flex Container whether to organize its children in a horizontal row or a vertical column.

---

## 1. Prerequisites
- [Flexbox (Concept) & `display: flex`](flex_parent.md) — This property does absolutely nothing unless the element is a Flex Container!

---

## 2. Term Category
- **Flexbox Property**

---

## 3. Environment Context
- **Universal Modern Standard**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, when you apply `display: flex;` to a container, it organizes its children in a horizontal line (left-to-right). This is perfect for navigation bars.
But what if you want to use the centering powers of Flexbox to build a mobile app menu, where the buttons stack vertically? The W3C created **`flex-direction`** to let you flip the primary axis of the Flex Container.

### (2) The Core Values
The `flex-direction` property defines the **Main Axis** of the container.

1. **`row` (Default)**: Children line up horizontally, from left to right. (The Main Axis is horizontal).
2. **`column`**: Children stack vertically, from top to bottom. (The Main Axis is vertical).
3. **`row-reverse`**: Horizontal, but right to left (Item 1 is on the far right).
4. **`column-reverse`**: Vertical, but bottom to top (Item 1 is on the absolute bottom).

### (3) Reality Metaphor
Imagine a skewer of shish kebabs.
`row`: Holding the skewer horizontally in front of you.
`column`: Holding the skewer vertically pointing at the sky.
The chunks of meat (the children) don't change, only the direction the stick is pointing changes.

### (4) Code Examples

#### The Mobile Menu Stack
```css
.mobile-nav-menu {
  /* Step 1: Turn on the Flexbox engine */
  display: flex;
  
  /* Step 2: Change the default horizontal row into a vertical stack */
  flex-direction: column; 
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Not realizing `column` swaps the alignment properties

**The mistake:** You learn how to use `justify-content` (in the next lesson) to center things horizontally. You change to `flex-direction: column`, and suddenly `justify-content` centers things vertically instead, completely breaking your layout.

**Why it's wrong:** In Flexbox, properties like `justify-content` do NOT mean "horizontal." They mean "align along the Main Axis." If you change the `flex-direction` to `column`, you physically rotate the Main Axis 90 degrees. Therefore, all your alignment properties rotate 90 degrees as well! This is the hardest concept for beginners to grasp in Flexbox.

---



### Mistake 2: Using `flex-direction: column-reverse` or `row-reverse` Breaking Tab Key Order (Accessibility Trap)

**The mistake:** Using `flex-direction: row-reverse` to move a form submit button to the right.

**Why it's wrong:** `row-reverse` visually flips element order on screen, but leaves DOM focus order unchanged, causing keyboard Tab navigation to move in reverse direction. Use `order` or fix HTML.

*Incorrect:*
```css
.form-actions { display: flex; flex-direction: row-reverse; } /* ❌ Disconnects visual and DOM focus order! */
```

*Fix:*
```css
/* Arrange HTML in natural DOM tab order; use flex alignment properties for visual layout */
```

### Mistake 3: Forgetting That `flex-direction: column` Swaps Main and Cross Axes

**The mistake:** Expecting `justify-content` to control horizontal alignment in `column` mode.

**Why it's wrong:** In `column` mode, `justify-content` controls VERTICAL alignment (Main Axis) and `align-items` controls HORIZONTAL alignment (Cross Axis).

*Incorrect:*
```css
/* Expecting justify-content to align items horizontally in column mode */
```

*Fix:*
```css
.col { display: flex; flex-direction: column; align-items: center; } /* Horizontal alignment */
```

## 6. Practice Exercises

### Exercise 1: The Reverse Order

**Problem:** You have a container with three children: HTML `<p>1</p> <p>2</p> <p>3</p>`. You apply `display: flex; flex-direction: row-reverse;`. In what order do the numbers appear on the screen, reading from left to right?

**Expected output:**
> [!check]- Answer
> ```text
> 3, 2, 1! `row-reverse` flips the axis, meaning it starts packing items against the right side of the screen first.
> ```
> - Which side of the screen does `reverse` start on?

---



### Exercise 2: Vertical Column Stack Layout

**Problem:** Write CSS for `.card-stack` arranging child elements in vertical column with 16px gap.

**Expected output:**
> [!check]- Answer
> ```text
> .card-stack { display: flex; flex-direction: column; gap: 16px; }
> ```
> ```css
> .card-stack {
>   display: flex;
>   flex-direction: column;
>   gap: 16px;
> }
> ```
>
> **Explanation:** `flex-direction: column` stacks flex items vertically.

---

### Exercise 3: Flex Direction Values List

**Problem:** List the 4 valid keyword values for `flex-direction`.

**Expected output:**
> [!check]- Answer
> ```text
> 1. row (default)
> 2. row-reverse
> 3. column
> 4. column-reverse
> ```
> ```text
> 1. row
> 2. row-reverse
> 3. column
> 4. column-reverse
> ```
>
> **Explanation:** `flex-direction` dictates main axis orientation and direction.

## 7. Related Terms
- [`justify-content`](justify_content.md) — Aligns children along the axis defined by `flex-direction`.
- [`align-items`](align_items.md) — Aligns children along the perpendicular (cross) axis.
- [`align-self`](align_self.md) — Overrides align-items for a single child item.
- [`order`](order.md) — Visual ordering of items.
- [Flexbox (Concept) & `display: flex`](flex_parent.md) — Related concept: Flexbox (Concept) & `display: flex`.
- [`@media` (Media Queries Basics)](../level_08/media_queries.md) — Related concept: `@media` (Media Queries Basics).
- [`display: flex`](display_flex.md) — Related concept: `display: flex`.

---

## 8. Key Takeaways
- `flex-direction` sets the **Main Axis** for the Flex Container.
- `row` (horizontal) is the default.
- `column` (vertical) is commonly used for mobile layouts.
- Changing the direction physically rotates the layout math 90 degrees, changing how alignment properties behave!
