# `border-radius` (Rounded Corners)

> **Level 9 — Visual Effects & State**
> The property that rounds the sharp, 90-degree corners of an HTML element's box.

---

## 1. Prerequisites
- [The Box Model (Concept)](../level_02/box_model.md) — Every HTML element is inherently a sharp, rectangular box.
- [`rem` vs `em`](../level_08/rem_em.md) — Units used to measure the rounding.

---

## 2. Term Category

**Aesthetic / Styling Property (Universal Modern Standard .)**: `border-radius` (Rounded Corners) is a fundamental concept in this technology stack. **Level 9 — Visual Effects & State**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Rounded Card Components and Pill Badges with border-radius

**Scenario:** An author styles rounded UI card components (`0.75rem`) and pill-shaped status badges (`9999px`).

**Requirements:**
1. Set `border-radius: 0.75rem` on `.card`.
2. Set `border-radius: 9999px` on `.pill-badge`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .ui-card {
>   background-color: #ffffff;
>   border-radius: 0.75rem;        /* 12px relative rounded corners */
>   padding: 1.5rem;
> }
>
> .pill-badge {
>   display: inline-block;
>   padding: 0.25rem 0.75rem;
>   border-radius: 9999px;        /* Creates a perfect rounded pill shape */
>   background-color: #dbeafe;
>   color: #1e40af;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `border-radius` Property**: Rounds the outer corners of an element's border box.
> 2. **Pill Shape Technique (`9999px`)**: Setting a huge pixel radius (`9999px`) creates perfectly semi-circular ends on rectangular badges regardless of width.
> 3. **Relative `rem` Scaling**: Using `rem` units for corner radii ensures rounded corners scale smoothly when font sizes change.
> 
---

### Exercise 2: Circular Avatar Images using border-radius: 50%

**Scenario:** Creates a perfect circular user avatar image from a square media container.

**Requirements:**
1. Apply `width: 4rem; height: 4rem; border-radius: 50%;`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .user-avatar-circle {
>   width: 4rem;
>   height: 4rem;
>   border-radius: 50%;           /* Converts square element box into a perfect circle */
>   object-fit: cover;
> }
> ```
>
> #### Technical Explanation
>
> 1. **`50%` Circle Prerequisite**: `border-radius: 50%` creates a perfect circle ONLY if the element has equal width and height (`width == height`).
> 2. **Elliptical Distortion Warning**: If width and height are unequal, `border-radius: 50%` renders an oval/ellipse shape!
> 3. **Image Media Integration**: Pair with `object-fit: cover` so profile photos don't distort inside circular bounds.
> 
---

### Exercise 3: Asymmetric Organic Shapes using 8-Value Elliptical border-radius

**Scenario:** Styles an organic asymmetric decorative card shape using 8-value syntax.

**Requirements:**
1. Apply `border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .organic-shape-card {
>   /* 8-value syntax: horizontal radii / vertical radii */
>   border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
>   background: linear-gradient(135deg, #2563eb, #1e1b4b);
> }
> ```
>
> #### Technical Explanation
>
> 1. **8-Value Syntax**: The slash `/` separates horizontal radii from vertical radii (`top-left top-right bottom-right bottom-left / ...`).
> 2. **Organic Design Trends**: Enables creating fluid, asymmetrical blob shapes without SVG graphics.
> 3. **CSS Animation Potential**: Asymmetric radii can be animated smoothly on hover.
## 6. Related Terms
- [Border](../level_02/border.md) — The physical border boundaries.
- [`box-shadow` (Card Shadows)](box_shadow.md) — Shadow rings which follow the border radius boundaries.
- [`object-fit` & `object-position`](object_fit.md) — Standard scaling property for images cropped by border radius.

---

## 7. Key Takeaways
- `border-radius` rounds the corners of the Box Model.
- Use `px` or `rem` for standard, even rounding (e.g., `8px`).
- Use `50%` on a perfectly square element to create a perfect circle (like profile pictures).
- You can specify 4 different values to create asymmetrical shapes (like chat bubbles).
