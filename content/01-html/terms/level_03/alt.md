# `alt` Attribute

> **Level 3 — Media & Embedding**
> Provides alternative text for an image (crucial for accessibility).

---

## 1. Prerequisites
- [Attribute](../level_01/attribute.md) — The general concept of tag parameters.
- [`<img>`](img.md) — The image tag that utilizes this attribute.

---

## 2. Term Category

**Attribute (Universal Browser Support)**: `alt` Attribute is a fundamental concept in this technology stack. **Level 3 — Media & Embedding**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
The web is meant to be accessible to everyone, including users who are blind or visually impaired and rely on Screen Reader software to browse the internet.
When a screen reader encounters an `<img>` tag, it cannot see the pixels. If the image is a complex chart, a humorous meme, or a crucial "Submit" button, a blind user would be completely locked out of understanding the page's content.
The W3C designed the `alt` (Alternative Text) attribute to solve this. It provides a textual replacement for the image. Additionally, it serves as a fallback: if a user has a slow internet connection or the image link is broken, the browser will display the `alt` text on the screen instead of a blank void.

### (2) Reality Metaphor
Imagine listening to a baseball game on the radio instead of watching it on TV.
You can't see the field. You rely entirely on the radio announcer to describe the visual action to you: "The batter hits a line drive to left field!"
The `alt` attribute is the radio announcer for your website's images.

### (3) Code Examples

#### Short Snippet
```html
<!-- A descriptive alt attribute for a meaningful image -->
<img src="pancakes.jpg" alt="A stack of blueberry pancakes covered in maple syrup">
```

#### Fuller Example
```html
<article>
  <!-- Meaningful image: Needs a descriptive alt -->
  <h2>Meet Our CEO</h2>
  <img src="jane-doe.jpg" alt="Jane Doe smiling and wearing a blue blazer">
  
  <!-- Functional image (used as a link): Alt should describe the ACTION, not the image -->
  <a href="index.html">
    <img src="home-icon.png" alt="Return to homepage">
  </a>
  
  <!-- Decorative image: Needs an EMPTY alt attribute -->
  <!-- This tells screen readers to completely ignore the image -->
  <img src="swirly-divider.png" alt="">
</article>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Starting with "Image of..." or "Picture of..."

**The mistake:** Writing `alt="Picture of a cat"`.

**Why it's wrong:** Screen readers already announce "Image" or "Graphic" when they encounter an `<img>` tag. If you write "Picture of a cat", the user will hear: "Image. Picture of a cat." This is redundant and annoying. Just write the description directly.

*Incorrect:*
```html
<img src="cat.jpg" alt="Image of a cat sleeping">
```

*Fix:*
```html
<img src="cat.jpg" alt="A cat sleeping">
```

### Mistake 2: Leaving the alt attribute out entirely for decorative images

**The mistake:** Completely deleting the `alt` attribute for background or purely decorative images (like a swoosh graphic).

**Why it's wrong:** If a screen reader encounters an `<img>` tag with *no* `alt` attribute at all, it assumes the developer forgot it. In an attempt to be helpful, it will read the raw filename aloud to the user (e.g., "Graphic. Swoosh-final-v2-export.jpg"). 
If an image is purely decorative and offers no semantic meaning, you MUST include an **empty alt attribute** (`alt=""`). This explicitly tells the screen reader: "I didn't forget this; this image is just decoration, please skip it."

*Incorrect:*
```html
<!-- Screen reader reads the ugly file name -->
<img src="divider-line.png"> 
```

*Fix:*
```html
<!-- Screen reader silently skips the image -->
<img src="divider-line.png" alt=""> 
```

---



### Mistake 3: Redundantly Including Words Like 'image of' or 'photo of' in Alt Text

**The mistake:** Writing `<img src="dog.jpg" alt="A photo image of a dog">`.

**Why it's wrong:** Screen readers automatically announce image elements as 'image' or 'graphic'. Adding 'photo of' causes screen readers to read 'Graphic, A photo image of a dog'.

*Incorrect:*
```html
<img src="dog.jpg" alt="Image of a golden retriever"> <!-- ❌ Redundant word 'Image of' -->
```

*Fix:*
```html
<img src="dog.jpg" alt="Golden retriever running in park">
```

### Mistake 4: Omitting `alt` Attribute Entirely on Decorative Images

**The mistake:** Writing `<img src="divider.png">` without an `alt` attribute.

**Why it's wrong:** Omitting `alt` entirely causes screen readers to read out the full raw image URL filename (`divider.png`). For decorative images, use empty `alt=""` so screen readers ignore it.

*Incorrect:*
```html
<img src="/icons/star.svg"> <!-- ❌ Screen reader reads 'star.svg' URL out loud -->
```

*Fix:*
```html
<img src="/icons/star.svg" alt=""> <!-- Empty alt instructs screen readers to skip -->
```

## 5. Practice Exercises

### Exercise 1: Writing Accessible Descriptive Alt Text for Product Images

**Scenario:** An e-commerce store author writes alt text for a product image, ensuring screen readers receive a concise, meaningful text description.

**Requirements:**
1. Include an `<img>` tag with `src` and `alt` attributes.
2. Write descriptive `alt` text detailing product features (color, material, design).
3. Specify `width` and `height` dimensions.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <div class="product-card">
>   <img src="images/leather-jacket.jpg" alt="Black men's genuine leather biker jacket with silver double-zippers and lapel snaps" width="400" height="400">
>   <h3>Classic Biker Jacket</h3>
>   <p class="price">$299.00</p>
> </div>
> ```
>
> #### Technical Explanation
>
> 1. **The `alt` Attribute Purpose**: Provides an equivalent text alternative for screen readers and displays fallback text if image loading fails.
> 2. **Concise & Meaningful Context**: Good alt text describes what the image conveys in context rather than using generic labels like 'image.jpg' or 'photo'.
> 3. **Layout Aspect Ratio (`width`/`height`)**: Explicitly setting `width` and `height` attributes allows browsers to reserve layout aspect ratios, preventing Cumulative Layout Shift (CLS).
> 
---

### Exercise 2: Decorative Image Null Alt Attribute

**Scenario:** A developer marks decorative background icons as decorative so screen readers skip redundant audio announcements.

**Requirements:**
1. Set `alt=""` (empty string) for decorative images.
2. Add `aria-hidden="true"` where appropriate.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <button type="button" class="btn-primary">
>   <img src="icons/shopping-cart.svg" alt="" aria-hidden="true" width="20" height="20">
>   Checkout Now
> </button>
> ```
>
> #### Technical Explanation
>
> 1. **Null Alt (`alt=""`) Rule**: Setting `alt=""` informs screen readers that the image is purely decorative and should be completely skipped.
> 2. **Missing Alt Pitfall**: Omitting the `alt` attribute completely causes screen readers to read aloud the raw image file URL path (`icons/shopping-cart.svg`).
> 3. **Redundant Icon Prevention**: When button text ('Checkout Now') already conveys intent, hiding the decorative icon prevents redundant screen reader chatter.
> 
---

### Exercise 3: Complex Infographic Summary with Alt Text and Long Description Link

**Scenario:** An author publishes a complex data chart infographic, combining a brief `alt` description with an extended text summary.

**Requirements:**
1. Provide a concise `alt` text overview.
2. Link to a detailed accessible data table summary.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <figure class="chart-wrapper">
>   <img src="charts/sales-2026.png" alt="Bar chart showing 2026 quarterly sales growth, peaking at $4.2M in Q4." aria-describedby="chart-desc" width="600" height="350">
>   <figcaption id="chart-desc">
>     Figure 1: 2026 Sales Revenue Summary. For full raw numbers, view the <a href="data/sales-2026-table.html">accessible tabular sales report</a>.
>   </figcaption>
> </figure>
> ```
>
> #### Technical Explanation
>
> 1. **`aria-describedby` Relationship**: Connects an image to an extended text description or caption element (`<figcaption id="...">`).
> 2. **Infographic Accessibility**: Complex diagrams (charts, flowcharts) require both a brief `alt` summary and a full accessible text equivalent.
> 3. **W3C Image Tutorial Guidelines**: Follows W3C guidelines for complex images by offering alternative tabular data options.
## 6. Related Terms
- [`<img>`](img.md) — The element that requires the `alt` attribute.
- [`<figure>` & `<figcaption>`](figure_figcaption.md) — The semantic containers used to package images and captions.
- [`title` Attribute](../level_07/title.md) — Related concept: `title` Attribute.
- [`<picture>` & Responsive Images](picture_responsive.md) — Related concept: `<picture>` & Responsive Images.
- [Accessibility (a11y) Fundamentals](../level_09/accessibility_fundamentals.md) — Related concept: Accessibility (a11y) Fundamentals.

---

## 7. Key Takeaways
- The `alt` attribute is mandatory for web accessibility (a11y).
- It provides a text alternative for screen readers and a visual fallback for broken images.
- Never write "Image of" or "Picture of" in the alt text.
- If an image is purely decorative, use an empty alt attribute (`alt=""`) so screen readers skip it.
