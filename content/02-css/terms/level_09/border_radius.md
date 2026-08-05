# `border-radius` (Rounded Corners)

> **Level 9 — Visual Effects & State**
> The property that rounds the sharp, 90-degree corners of an HTML element's box.

---

## 1. Prerequisites
- [The Box Model (Concept)](../level_02/box_model.md) — Every HTML element is inherently a sharp, rectangular box.
- [`rem` vs `em`](../level_08/rem_em.md) — Units used to measure the rounding.
---

## 2. Term Category
- **Aesthetic / Styling Property**

---

## 3. Environment Context
- **Universal Modern Standard** (The death of sharp-cornered 1990s websites).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In the physical world, sharp 90-degree corners are dangerous and aggressive. Soft, rounded corners feel modern, friendly, and approachable (which is why almost every modern smartphone app uses rounded buttons). 
In the early days of CSS, if you wanted a rounded button, you literally had to draw a rounded button in Photoshop, slice it into 3 separate image files, and use complex CSS background tricks to stitch them together on the screen. It was an absolute nightmare. 
The W3C created **`border-radius`** to allow browsers to mathematically round the corners of the Box Model natively.

### (2) Reality Metaphor
Imagine taking a piece of sandpaper to the sharp, pointy corners of a wooden block. The larger the `border-radius` value you provide, the deeper you sand down the corner.

### (3) Code Examples

#### The Modern, Soft Button
```css
.primary-button {
  background-color: blue;
  padding: 1rem 2rem;
  
  /* Takes the sharp corners and softly rounds them by 8 pixels */
  border-radius: 8px; 
}
```

#### The Perfect Circle (The 50% Trick)
If you have a perfectly square element (equal width and height), you can turn it into a perfect circle by setting the radius to 50%. This is how websites create circular User Profile pictures!
```css
.profile-avatar {
  width: 100px;
  height: 100px;
  
  /* Rounds the corners all the way to the center of the box */
  border-radius: 50%;
}
```

#### The "Pill" Shape
If you want a button with completely rounded left and right edges (like a medicinal pill), use a ridiculously high pixel or rem value.
```css
.pill-badge {
  /* The browser will round the corners as much as physically possible */
  border-radius: 9999px;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using percentages for standard buttons

**The mistake:** You want a slightly rounded rectangle button, so you apply `border-radius: 10%`. 

**Why it's wrong:** Percentages calculate their math based on the width and height of the box. Because a button is usually much wider than it is tall, the horizontal rounding will be huge, and the vertical rounding will be tiny. This creates an ugly, warped, elliptical corner instead of a perfect quarter-circle! 
**Golden Rule:** Always use fixed units (`px` or `rem`) for standard rounded corners. ONLY use `%` when you are specifically trying to create a perfect circle out of a perfect square!

---



### Mistake 2: Using `border-radius: 50%` on Non-Square Rectangular Containers (Oval Shape Bug)

**The mistake:** Applying `border-radius: 50%` to a `200px x 100px` rectangular image expecting a circle.

**Why it's wrong:** `border-radius: 50%` on a non-square rectangle produces an egg-like OVAL shape. For a true circle, the element MUST have equal `width` and `height` (1:1 aspect ratio).

*Incorrect:*
```css
img.avatar { width: 200px; height: 100px; border-radius: 50%; } /* ❌ Produces distorted oval! */
```

*Fix:*
```css
img.avatar { width: 100px; height: 100px; border-radius: 50%; /* Perfect circle */ }
```

### Mistake 3: Forgetting `overflow: hidden` on Parent Containers with Border Radius and Child Images

**The mistake:** Adding `border-radius: 20px` to a `.card` wrapper where child `<img>` tags bleed outside rounded corners.

**Why it's wrong:** Child elements do not automatically clip to parent rounded corners unless `overflow: hidden` is applied to the parent container.

*Incorrect:*
```css
.card { border-radius: 20px; } /* ❌ Square child image bleeds past rounded corners! */
```

*Fix:*
```css
.card {
  border-radius: 20px;
  overflow: hidden; /* Clips child images to rounded corners */
}
```

## 6. Practice Exercises

### Exercise 1: Targeting specific corners

**Problem:** You are building a chat bubble. You want the top-left, top-right, and bottom-right corners to be heavily rounded, but you want the bottom-left corner to be perfectly sharp (pointy) to show that the person on the left is speaking. How do you do this?

**Expected output:**
> [!check]- Answer
> ```css
> /* border-radius starts at top-left, and goes clockwise! */
> /* top-left | top-right | bottom-right | bottom-left */
> border-radius: 20px 20px 20px 0;
> ```
> - Like margin and padding, `border-radius` is a shorthand property that can take 4 values!

---



### Exercise 2: Pill Button Border Radius Pattern

**Problem:** Write CSS `border-radius` setting pill shape on button of height 40px.

**Expected output:**
> [!check]- Answer
> ```text
> .btn-pill { border-radius: 9999px; }
> ```
> ```css
> .btn-pill {
>   border-radius: 9999px;
> }
> ```
>
> **Explanation:** Large pixel values (`9999px`) render perfect pill-shaped rounded ends.

---

### Exercise 3: Asymmetric Corner Radius Syntax

**Problem:** Write `border-radius` shorthand setting top-left 10px, top-right 20px, bottom-right 30px, bottom-left 40px.

**Expected output:**
> [!check]- Answer
> ```text
> border-radius: 10px 20px 30px 40px;
> ```
> ```css
> .custom-box {
>   border-radius: 10px 20px 30px 40px;
> }
> ```
>
> **Explanation:** 4-value `border-radius` sets Top-Left, Top-Right, Bottom-Right, Bottom-Left corners in clockwise order.

## 7. Related Terms
- [Border](../level_02/border.md) — The physical border boundaries.
- [`box-shadow` (Card Shadows)](box_shadow.md) — Shadow rings which follow the border radius boundaries.
- [`object-fit` & `object-position`](object_fit.md) — Standard scaling property for images cropped by border radius.
---

## 8. Key Takeaways
- `border-radius` rounds the corners of the Box Model.
- Use `px` or `rem` for standard, even rounding (e.g., `8px`).
- Use `50%` on a perfectly square element to create a perfect circle (like profile pictures).
- You can specify 4 different values to create asymmetrical shapes (like chat bubbles).
