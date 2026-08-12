# `letter-spacing` & `word-spacing`

> **Level 7 — Text & List Formatting**
> Properties used to control the horizontal empty space between individual letters or whole words.

---

## 1. Prerequisites
- [`line-height`](../level_03/line_height.md) — If `line-height` is vertical spacing for text, these are the horizontal equivalents.
- [`font-size` & `font-weight`](../level_03/font_size_weight.md) — Text spacing relative to font sizing.

---

## 2. Term Category

**Typography Property (Universal Browser Support)**: `letter-spacing` & `word-spacing` is a fundamental concept in this technology stack. **Level 7 — Text & List Formatting**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In graphic design, adjusting the space between letters is called **Tracking**. Sometimes, a font looks too cramped, making it hard to read at small sizes. Other times, designers deliberately spread letters far apart to create a sleek, cinematic, or "premium" look (think of the massive, spaced-out titles on movie posters).
The W3C created **`letter-spacing`** to control the space between individual characters, and **`word-spacing`** to control the space between the spacebar gaps of words.

### (2) Reality Metaphor
**`letter-spacing`**: Breathing room between people standing in a line.
**`word-spacing`**: Breathing room between different groups of people standing in a line.

### (3) Code Examples

#### The "Cinematic" Look
When developers use `text-transform: uppercase`, the letters can feel very boxed-in and heavy. It is a standard design practice to add a little bit of `letter-spacing` to uppercase text to let it breathe.

```css
.sub-heading {
  font-size: 14px;
  text-transform: uppercase;
  
  /* Adds 2 pixels of empty space between every single letter */
  letter-spacing: 2px;
}
```

#### Fixing Justified Text (Rare)
Sometimes, if you use `text-align: justify`, the gaps between words look completely broken. You can use `word-spacing` to try and tighten it up (though it's rarely used today).
```css
p {
  /* Negative values are allowed! This pulls the words tighter together. */
  word-spacing: -1px;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `letter-spacing` on lowercase text

**The mistake:** Adding `letter-spacing: 2px;` to standard, lowercase paragraph text.

**Why it's wrong:** Lowercase letters in a font are meticulously designed by typographers to sit naturally next to each other so the human eye can read them as a single block (a word). If you artificially force space between lowercase letters, you destroy the readability of the paragraph. The user's eye has to work twice as hard to parse the words. 
**Golden Rule:** `letter-spacing` should almost exclusively be used on ALL CAPS text, or very short headings. Never use it on long body paragraphs.

---



### Mistake 2: Using Excessive `letter-spacing` (Tracking) Degrading Text Legibility

**The mistake:** Setting `letter-spacing: 15px;` on long body paragraph text.

**Why it's wrong:** Excessive letter spacing breaks word shape recognition for readers. Limit wider letter spacing to uppercase short headlines (`text-transform: uppercase`).

*Incorrect:*
```css
p { letter-spacing: 10px; } /* ❌ Body text word shapes become unreadable! */
```

*Fix:*
```css
h1.caption { text-transform: uppercase; letter-spacing: 0.1em; }
```

### Mistake 3: Using Fixed Pixel Units for `letter-spacing` Instead of Relative `em` Units

**The mistake:** Setting `letter-spacing: 2px` on a headline whose font size changes between mobile (16px) and desktop (64px).

**Why it's wrong:** Fixed pixel tracking does not scale proportionally with changing font sizes. Use relative `em` units (e.g. `letter-spacing: 0.05em`).

*Incorrect:*
```css
h1 { font-size: 4rem; letter-spacing: 2px; } /* Fixed px spacing */
```

*Fix:*
```css
h1 { font-size: 4rem; letter-spacing: 0.05em; } /* Relative scaling tracking */
```

## 5. Practice Exercises

### Exercise 1: Fine-Tuning Uppercase Heading Tracking

**Scenario:** An author styles a category header badge, using `letter-spacing` to improve tracking readability on all-caps text.

**Requirements:**
1. Apply `text-transform: uppercase`.
2. Set `letter-spacing: 0.1em`.
3. Set relative font size.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .category-badge {
>   font-size: 0.75rem;
>   font-weight: 700;
>   text-transform: uppercase;
>   letter-spacing: 0.1em;        /* Expands character spacing proportionally for all-caps tracking */
>   color: #2563eb;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `letter-spacing` Property**: Controls the horizontal space between individual characters (tracking) in a block of text.
> 2. **All-Caps Tracking Rule**: Uppercase letters lack ascenders and descenders; adding `letter-spacing: 0.1em` prevents letters from visually colliding.
> 3. **Relative `em` Units**: ALWAYS use relative `em` units for `letter-spacing` so character tracking scales proportionally when font size changes.
> 
---

### Exercise 2: Tightening Display Banner Headlines using Negative Letter Spacing

**Scenario:** Tightens letter spacing on large hero banner titles using negative `letter-spacing`.

**Requirements:**
1. Apply `letter-spacing: -0.025em` to large display heading.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .hero-display-title {
>   font-size: clamp(2.5rem, 5vw, 4rem);
>   font-weight: 800;
>   letter-spacing: -0.025em;     /* Slightly tightens character spacing on large display type */
>   line-height: 1.1;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Negative Letter Spacing**: Large display typefaces (>32px) often look loosely spaced; applying `-0.025em` creates a tighter, more cohesive headline.
> 2. **Optical Typography Tuning**: Improves visual impact on bold hero titles.
> 3. **Use Caution on Small Text**: Never apply negative letter spacing to small body text (<16px) as characters will overlap and degrade readability.
> 
---

### Exercise 3: Adjusting Body Text Word Spacing for Typography Readability

**Scenario:** Adjusts word spacing in editorial paragraphs using `word-spacing`.

**Requirements:**
1. Apply `word-spacing: 0.05em`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .editorial-body {
>   font-size: 1.125rem;
>   line-height: 1.7;
>   word-spacing: 0.05em;         /* Slightly expands whitespace gaps between words */
>   color: #334155;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `word-spacing` Property**: Adjusts the whitespace gap distance between words without altering character tracking.
> 2. **Editorial Typography**: Slightly increasing `word-spacing` improves readability in wide multi-line text blocks.
> 3. **Relative `em` Scaling**: Scales proportionally with font size variations.
## 6. Related Terms
- [`text-transform`](text_transform.md) — The property most commonly paired with `letter-spacing`.

---

## 7. Key Takeaways
- `letter-spacing` adds horizontal space between individual characters.
- `word-spacing` adds horizontal space between words (at the spacebar).
- A best practice is to add slight `letter-spacing` to `uppercase` text to improve readability and aesthetics.
- Avoid using `letter-spacing` on long paragraphs of lowercase text.
