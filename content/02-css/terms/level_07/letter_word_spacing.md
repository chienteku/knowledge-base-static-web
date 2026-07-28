# `letter-spacing` & `word-spacing`

> **Level 7 — Text & List Formatting**
> Properties used to control the horizontal empty space between individual letters or whole words.

---

## 1. Prerequisites
- [`line-height`](../level_03/line_height.md) — If `line-height` is vertical spacing for text, these are the horizontal equivalents.

---

## 2. Term Category
- **Typography Property**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Fix

**Problem:** You have a button that says "SUBMIT". The designer complains that it looks too heavy and the letters are bleeding into each other. What CSS properties do you apply?

**Expected output:**
> [!check]- Answer
> ```text
> You should ensure it has `text-transform: uppercase;` (rather than hardcoded HTML), and then apply `letter-spacing: 1px;` (or a small `em` value) to give the letters breathing room.
> ```
> - How do we add horizontal space between characters?

---



### Exercise 2: Uppercase Header Tracking Pattern

**Problem:** Write CSS for `.small-caps-header` converting text to uppercase with `0.15em` letter spacing.

**Expected output:**
> [!check]- Answer
> ```text
> .small-caps-header { text-transform: uppercase; letter-spacing: 0.15em; }
> ```
> ```css
> .small-caps-header {
>   text-transform: uppercase;
>   letter-spacing: 0.15em;
> }
> ```
>
> **Explanation:** Combining uppercase transformation with subtle `em` tracking enhances header elegance.

---

### Exercise 3: Word Spacing vs Letter Spacing

**Problem:** Distinguish `letter-spacing` vs `word-spacing`.

**Expected output:**
> [!check]- Answer
> ```text
> letter-spacing adjusts space between individual characters; word-spacing adjusts space between whole words.
> ```
> ```text
> letter-spacing adjusts space between individual characters; word-spacing adjusts space between whole words.
> ```
>
> **Explanation:** `letter-spacing` targets character tracking; `word-spacing` targets word gaps.

## 7. Related Terms
- [`text-transform`](text_transform.md) — The property most commonly paired with `letter-spacing`.

---

## 8. Key Takeaways
- `letter-spacing` adds horizontal space between individual characters.
- `word-spacing` adds horizontal space between words (at the spacebar).
- A best practice is to add slight `letter-spacing` to `uppercase` text to improve readability and aesthetics.
- Avoid using `letter-spacing` on long paragraphs of lowercase text.
