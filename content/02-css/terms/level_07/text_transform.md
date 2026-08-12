# `text-transform`

> **Level 7 — Text & List Formatting**
> The CSS property that forces text to be uppercase, lowercase, or capitalized, regardless of how it was typed in the HTML.

---

## 1. Prerequisites
- [`font-size` & `font-weight`](../level_03/font_size_weight.md) — Expanding on the basic text styling properties from Level 3.

---

## 2. Term Category

**Typography Property (Universal Browser Support)**: `text-transform` is a fundamental concept in this technology stack. **Level 7 — Text & List Formatting**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes a designer wants all the buttons on a website to be strictly ALL CAPS. 
A junior developer might solve this by going into the HTML and physically re-typing the text: `<button>CLICK HERE</button>`. 
However, this is terrible for accessibility! Screen readers for the blind will literally read "CLICK HERE" as an acronym ("C-L-I-C-K H-E-R-E"), because they assume all-caps words are acronyms. 
The W3C created **`text-transform`** to separate the *data* (HTML) from the *visual presentation* (CSS). You type standard sentence-case text in your HTML, and use CSS to visually paint it as uppercase. Screen readers read the original HTML perfectly, and sighted users see the ALL CAPS design!

### (2) The Core Values
- **`uppercase`**: Forces all letters to be capitalized (e.g., `HELLO`).
- **`lowercase`**: Forces all letters to be lowercase (e.g., `hello`).
- **`capitalize`**: Capitalizes only the first letter of every word (e.g., `Hello World`).
- **`none` (Default)**: Leaves the text exactly as it was typed in the HTML.

### (3) Reality Metaphor
Imagine handing a normal, handwritten letter to an actor and telling them to scream every word while they read it. The physical letter hasn't changed (the HTML), but the output performance is entirely different (the CSS).

### (4) Code Examples

#### The Correct Way to make ALL CAPS Buttons
```html
<!-- HTML: Written normally for Screen Readers and SEO -->
<button class="action-btn">Submit your form</button>
```
```css
/* CSS: Visually transformed for sighted users */
.action-btn {
  text-transform: uppercase; 
  /* Result on screen: SUBMIT YOUR FORM */
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Hardcoding ALL CAPS in the HTML

**The mistake:** Writing `<h1>WELCOME TO MY WEBSITE</h1>` directly in the HTML file.

**Why it's wrong:**
1. **Accessibility**: As mentioned, screen readers will often read it letter-by-letter.
2. **Maintenance**: If the boss decides tomorrow that they want the titles to be normal title-case instead of all-caps, you have to manually retype hundreds of `<h1>` tags across your entire website. If you had used `text-transform`, you could change the entire website with a single CSS edit.

---



### Mistake 2: Typing ALL-CAPS Text Directly in HTML Source Code (`<h1>ALL CAPS</h1>`)

**The mistake:** Hardcoding uppercase text in HTML source `<h1>MY TITLE</h1>`.

**Why it's wrong:** Hardcoding uppercase text in HTML source prevents screen readers from pronouncing words normally (screen readers may spell out 'M-Y T-I-T-L-E' letter-by-letter). Write normal text in HTML and use `text-transform: uppercase` in CSS.

*Incorrect:*
```css
<h1>BUY OUR PRODUCTS NOW</h1> <!-- ❌ Hardcoded uppercase in HTML source -->
```

*Fix:*
```css
<h1>Buy our products now</h1>
/* CSS: h1 { text-transform: uppercase; } */
```

### Mistake 3: Expecting `text-transform: capitalize` to Understand Complex Title Case Grammar Rules

**The mistake:** Relying on `text-transform: capitalize` to write proper book title case ('The Lord of the Rings').

**Why it's wrong:** `capitalize` blindly capitalizes the VERY FIRST letter of EVERY single word (e.g. 'The Lord Of The Rings'), ignoring English grammar rules for prepositions.

*Incorrect:*
```css
/* Expecting intelligent English title case rules from capitalize */
```

*Fix:*
```css
/* Write proper title case in HTML; use uppercase/lowercase in CSS */
```

## 5. Practice Exercises

### Exercise 1: Styling All-Caps Badge Labels with text-transform

**Scenario:** An author styles status badges in all-uppercase lettering using `text-transform: uppercase` while preserving lowercase HTML text.

**Requirements:**
1. Apply `text-transform: uppercase` to `.status-badge`.
2. Add `letter-spacing: 0.05em`.
3. Verify raw HTML remains lowercase.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- HTML source text stored in standard lower/mixed case -->
> <span class="status-badge status-active">active subscriber</span>
> ```
>
> ```css
> .status-badge {
>   font-size: 0.75rem;
>   font-weight: 700;
>   text-transform: uppercase;    /* Renders text in ALL CAPS visually */
>   letter-spacing: 0.05em;
>   padding: 0.25rem 0.5rem;
>   border-radius: 0.25rem;
> }
>
> .status-active {
>   background-color: #dcfce7;
>   color: #166534;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `text-transform` Property**: Controls visual capitalization transformation of text (`uppercase`, `lowercase`, `capitalize`, `none`).
> 2. **HTML Data Integrity**: Transforms text VISUALLY without altering the underlying raw HTML string stored in database models or DOM scripts.
> 3. **Pairing with Letter Spacing**: Always pair `text-transform: uppercase` with positive `letter-spacing` (`0.05em`) for visual tracking clarity.
> 
---

### Exercise 2: Capitalizing Title Case User Names

**Scenario:** Capitalizes the first letter of each word in user profile header names using `text-transform: capitalize`.

**Requirements:**
1. Apply `text-transform: capitalize` to profile title.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .user-profile-name {
>   font-size: 1.5rem;
>   font-weight: 600;
>   text-transform: capitalize;   /* Capitalizes first letter of every word */
>   color: #0f172a;
> }
> ```
>
> #### Technical Explanation
>
> 1. **`text-transform: capitalize`**: Capitalizes the first character of each individual word in the text string.
> 2. **Title Case Formatting**: Useful for displaying user input names cleanly without requiring complex JavaScript string manipulation.
> 3. **Language Sensitivity**: Behavior depends on browser language settings (`lang` attribute).
> 
---

### Exercise 3: Screen Reader Speech Preservation vs HTML ALL CAPS

**Scenario:** Explains why typing ALL CAPS directly into HTML breaks screen reader pronunciation.

**Requirements:**
1. Demonstrate why `text-transform: uppercase` is superior to typing ALL CAPS in HTML.

> [!check]- Answer
>
> #### Implementation
>
> ```html
> <!-- ❌ BAD: Screen readers spell this out letter-by-letter as an acronym! ("N-E-W-S") -->
> <span>NEWS</span>
>
> <!-- ✅ GOOD: Screen readers pronounce the word correctly ("News"), rendered in ALL CAPS visually -->
> <span class="badge-caps">news</span>
> ```
>
> ```css
> .badge-caps {
>   text-transform: uppercase;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Screen Reader Acronym Hazard**: Typing ALL CAPS directly into HTML (`<button>SUBMIT</button>`) causes screen readers (NVDA, JAWS) to spell out words letter-by-letter ('S-U-B-M-I-T')!
> 2. **Accessibility Best Practice**: Write standard mixed-case text in HTML and apply `text-transform: uppercase` in CSS for visual styling.
> 3. **WCAG Conformance**: Preserves correct screen reader text pronunciation.
## 6. Related Terms
- [`font-size` & `font-weight`](../level_03/font_size_weight.md) — Often combined with `uppercase` to create strong, bold headings.
- [`font-style` & `font-variant`](../level_03/font_style_variant.md) — Related concept: `font-style` & `font-variant`.
- [`letter-spacing` & `word-spacing`](letter_word_spacing.md) — Related concept: `letter-spacing` & `word-spacing`.

---

## 7. Key Takeaways
- `text-transform` changes the capitalization of text visually.
- Never type ALL CAPS directly into HTML; always write normal text and use `text-transform: uppercase` in CSS.
- This protects Accessibility (Screen Readers) and improves maintainability.
