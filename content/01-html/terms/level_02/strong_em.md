# `<strong>` & `<em>`

> **Level 2 — Text & Content**
> Tags used to give text strong importance (usually bold) or emphasis (usually italic).

---

## 1. Prerequisites
- [`<span>` (Inline container)](span.md) — Unlike `<span>`, these tags have semantic meaning.
- [Block-level vs Inline Elements](../level_01/block_inline.md) — Since `<strong>` and `<em>` are inline elements.

---

## 2. Term Category
- **Inline Text Semantics**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In early versions of HTML, if you wanted text to look bold, you used the `<b>` tag. If you wanted it to look italic, you used the `<i>` tag. 
However, as the web matured and accessibility became a priority, the W3C realized this was a problem. `<b>` and `<i>` are purely *visual* tags—they tell the browser what the text should look like, but they don't explain *why*. 
To fix this, they introduced `<strong>` (strong importance) and `<em>` (emphasis). These are **semantic tags**. They tell the browser, search engines, and screen readers: "This text is fundamentally more important than the surrounding text." By default, browsers render `<strong>` as bold and `<em>` as italic, but their true purpose is to convey meaning, not just visual style.

### (2) Reality Metaphor
Imagine an actor reading a script.
If the script has `<b>` and `<i>`, the actor might just speak the words normally but put on a visually bold outfit.
If the script has `<strong>` and `<em>`, the actor changes their *voice*. They speak louder for `<strong>` and they change their inflection for `<em>`. Screen readers act exactly like this actor!

### (3) Code Examples

#### Short Snippet
```html
<p>
  I <em>really</em> need you to understand that this is <strong>highly dangerous</strong>.
</p>
```

#### Fuller Example
```html
<article>
  <h2>Safety Guidelines</h2>
  <p>
    Welcome to the lab. Please remember that you must 
    <strong>always wear your safety goggles</strong> when entering the active zone. 
    Failure to do so will result in <em>immediate</em> termination.
  </p>
</article>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `<b>` and `<i>` for visual styling

**The mistake:** Reaching for the old `<b>` and `<i>` tags just because you want text to look bold or italic.

**Why it's wrong:** Modern HTML is strictly about structure and meaning. If you just want a word to be bold for a design reason (like a stylistic pull-quote) but it doesn't actually carry strong importance, you should use a `<span class="bold-text">` and style it with CSS. Only use `<strong>` when the text is actually important.

*Incorrect:*
```html
<p>My favorite color is <b>blue</b>.</p>
```

*Fix:*
```html
<!-- If 'blue' isn't actually critically important to the sentence, use CSS: -->
<p>My favorite color is <span class="highlight">blue</span>.</p>
<!-- Or if it IS the most important part of the sentence: -->
<p>My favorite color is <strong>blue</strong>.</p>
```

---



### Mistake 2: Confusing `<strong>` (Importance) with `<em>` (Emphasis)

**The mistake:** Using `<em>` when marking urgent danger warnings, or `<strong>` when changing verbal tone emphasis.

**Why it's wrong:** `<strong>` denotes seriousness/importance (e.g. warnings); `<em>` alters verbal sentence stress/meaning (e.g. *I* didn't do it vs I didn't do *it*).

*Incorrect:*
```html
<em>DANGER: Toxic gas!</em> <!-- Use strong for serious danger -->
```

*Fix:*
```html
<strong>DANGER: Toxic gas!</strong>
```

### Mistake 3: Nesting `<strong>` Inside `<strong>` Redundantly

**The mistake:** Writing `<strong><strong>Very Important</strong></strong>`.

**Why it's wrong:** Nesting identical semantic tags redundantly adds no extra importance to screen readers. Nest `<em>` inside `<strong>` if both apply.

*Incorrect:*
```html
<strong><strong>Text</strong></strong> <!-- Redundant nesting -->
```

*Fix:*
```html
<strong><em>Urgent Emphasis</em></strong>
```



### Mistake 4: Confusing `<strong>` (Importance) with `<em>` (Emphasis)

**The mistake:** Using `<em>` when marking urgent danger warnings, or `<strong>` when changing verbal tone emphasis.

**Why it's wrong:** `<strong>` denotes seriousness/importance (e.g. warnings); `<em>` alters verbal sentence stress/meaning (e.g. *I* didn't do it vs I didn't do *it*).

*Incorrect:*
```html
<em>DANGER: Toxic gas!</em> <!-- Use strong for serious danger -->
```

*Fix:*
```html
<strong>DANGER: Toxic gas!</strong>
```

### Mistake 5: Nesting `<strong>` Inside `<strong>` Redundantly

**The mistake:** Writing `<strong><strong>Very Important</strong></strong>`.

**Why it's wrong:** Nesting identical semantic tags redundantly adds no extra importance to screen readers. Nest `<em>` inside `<strong>` if both apply.

*Incorrect:*
```html
<strong><strong>Text</strong></strong> <!-- Redundant nesting -->
```

*Fix:*
```html
<strong><em>Urgent Emphasis</em></strong>
```



### Mistake 6: Confusing `<strong>` (Importance) with `<em>` (Emphasis)

**The mistake:** Using `<em>` when marking urgent danger warnings, or `<strong>` when changing verbal tone emphasis.

**Why it's wrong:** `<strong>` denotes seriousness/importance (e.g. warnings); `<em>` alters verbal sentence stress/meaning (e.g. *I* didn't do it vs I didn't do *it*).

*Incorrect:*
```html
<em>DANGER: Toxic gas!</em> <!-- Use strong for serious danger -->
```

*Fix:*
```html
<strong>DANGER: Toxic gas!</strong>
```

### Mistake 7: Nesting `<strong>` Inside `<strong>` Redundantly

**The mistake:** Writing `<strong><strong>Very Important</strong></strong>`.

**Why it's wrong:** Nesting identical semantic tags redundantly adds no extra importance to screen readers. Nest `<em>` inside `<strong>` if both apply.

*Incorrect:*
```html
<strong><strong>Text</strong></strong> <!-- Redundant nesting -->
```

*Fix:*
```html
<strong><em>Urgent Emphasis</em></strong>
```

## 6. Practice Exercises

### Exercise 1: The Screen Reader Test

**Problem:** How does a screen reader (software for blind users) treat `<strong>` differently than a `<span>` styled to look bold with CSS?

**Expected output:**
> [!check]- Answer
> ```text
> The screen reader will change its vocal inflection/tone to announce the `<strong>` text with importance. It will read the `<span>` text exactly like normal, plain text, ignoring the visual CSS bolding entirely.
> ```
> - HTML is for meaning. CSS is for eyeballs. Screen readers don't have eyeballs!
> 
---

### Exercise 2: Contextual Semantic Selection

**Problem:** Select `<strong>` or `<em>` for:
1. Warning: Password required (`<strong>`)
2. I *love* coding (`<em>`)
3. Mandatory field (`<strong>`)

**Expected output:**
> [!check]- Answer
> ```text
> 1. <strong>
> 2. <em>
> 3. <strong>
> ```
>
> **Explanation:** `<strong>` denotes mandatory/urgent importance; `<em>` denotes stress emphasis.
> 
---

### Exercise 3: CSS Styling Override

**Problem:** Can CSS override `<strong>` font-weight from bold to normal? (Yes/No).

**Expected output:**
> [!check]- Answer
> ```css
> strong {
>   font-weight: normal;
> }
> ```
>
> **Explanation:** CSS controls visual appearance while HTML tags dictate semantic meaning.
> 
## 7. Related Terms
- [`<span>` (Inline container)](span.md) — The non-semantic alternative for purely visual styling.
- [Block-level vs Inline Elements](../level_01/block_inline.md) — The display behavior governing text wrappers.
- [`<b>`, `<i>`, `<u>` vs `<strong>`, `<em>`, `<ins>`](b_i_u_vs_strong_em.md) — The presentational vs semantic formatting comparison.
- [`<blockquote>` & `<cite>`](blockquote_cite.md) — Related concept: `<blockquote>` & `<cite>`.
- [`<sup>` & `<sub>`](sup_sub.md) — Related concept: `<sup>` & `<sub>`.
- [`<mark>`](../level_06/mark.md) — Related concept: `<mark>`.

---

## 8. Key Takeaways
- `<strong>` represents strong importance (renders bold by default).
- `<em>` represents stress emphasis (renders italic by default).
- Both are **semantic tags**, meaning they convey actual importance to screen readers and search engines.
- You should generally avoid the older `<b>` and `<i>` tags in modern web development.
