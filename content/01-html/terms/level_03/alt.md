# `alt` Attribute

> **Level 3 — Media & Embedding**
> Provides alternative text for an image (crucial for accessibility).

---

## 1. Prerequisites
- [Attribute](../level_01/attribute.md) — The general concept of tag parameters.
- [`<img>`](../level_03/img.md) — The image tag that utilizes this attribute.

---

## 2. Term Category
- **Attribute**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Functional Alt

**Problem:** You are building a search bar. The submit button is a magnifying glass icon. What should the `alt` text be?
`<img src="magnifying-glass.png" alt="___">`

**Expected output:**
> [!check]- Answer
> ```text
> alt="Search" (or "Submit search")
> ```
> - For functional icons, describe the *action* it performs, not what it looks like. A blind user doesn't care that it's a magnifying glass; they need to know what happens if they click it!

---



### Exercise 2: Contextual Alt Text Selection

**Problem:** Write appropriate `alt` text for an image of a red submit button inside a form.

**Expected output:**
> [!check]- Answer
> ```text
> alt="Submit Form" (describing image function, not visual color).
> ```
> ```html
> <img src="red-btn.png" alt="Submit Form">
> ```
>
> **Explanation:** For functional images (buttons/links), alt text should describe the action destination.

---

### Exercise 3: Decorative Image Alt Syntax

**Problem:** How should decorative background line images be marked up with the `alt` attribute?

**Expected output:**
> [!check]- Answer
> ```text
> alt="" (empty string).
> ```
> ```html
> <img src="decorative-line.png" alt="">
> ```
>
> **Explanation:** `alt=""` informs screen readers that the image is purely decorative and should be skipped.

## 7. Related Terms
- [`<img>`](../level_03/img.md) — The element that requires the `alt` attribute.
- [`<figure>` & `<figcaption>`](../level_03/figure_figcaption.md) — The semantic containers used to package images and captions.

---

## 8. Key Takeaways
- The `alt` attribute is mandatory for web accessibility (a11y).
- It provides a text alternative for screen readers and a visual fallback for broken images.
- Never write "Image of" or "Picture of" in the alt text.
- If an image is purely decorative, use an empty alt attribute (`alt=""`) so screen readers skip it.
