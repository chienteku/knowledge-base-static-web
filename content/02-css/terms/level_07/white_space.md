# `white-space`

> **Level 7 — Text & List Formatting**
> The property that dictates how the browser handles "whitespace" (spaces, tabs, and enter-key line breaks) inside your HTML code.

---

## 1. Prerequisites
- whitespace_collapse — You must understand the browser's default behavior of crushing all spaces into a single space!
---

## 2. Term Category
- **Typography / Formatting Property**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
As learned in HTML Level 1, the browser aggressively collapses all empty spaces, tabs, and Enter-key line breaks in your HTML code into a single, solitary space. It also automatically wraps text to the next line when it hits the edge of a container.
But what if you are building a coding tutorial website, and you want to display a block of Python code exactly as it was typed, preserving all the intricate tabs and line breaks? What if you want a long string of text to refuse to wrap, even if it overflows the screen? 
The W3C created the **`white-space`** property to allow developers to override the default HTML collapse behavior.

### (2) The Core Values
- **`normal` (Default)**: Collapses all tabs/spaces/enters. Wraps text at the edge of the container.
- **`nowrap`**: Collapses tabs/spaces, but **REFUSES** to wrap text. The text will keep going on a single horizontal line forever, blowing straight out of the container if necessary.
- **`pre`**: (Pre-formatted). The exact opposite of normal. It preserves all tabs, spaces, and Enters exactly as typed in the HTML. It does not wrap text automatically.
- **`pre-wrap`**: Preserves all tabs/spaces/Enters exactly as typed, BUT it *will* automatically wrap the text if it hits the edge of the container. (The most useful one for displaying user-submitted comments!).

### (3) Reality Metaphor
`normal`: A standard paragraph in a book.
`pre`: A poem. The author's exact line breaks and indentations must be preserved perfectly.

### (4) Code Examples

#### Refusing to wrap
```css
.pill-badge {
  /* No matter how small this badge gets, the text inside will never break onto two lines! */
  white-space: nowrap; 
}
```

#### Preserving User Formatting
```css
.user-comment {
  /* If a user typed multiple spaces or hit Enter twice in their comment, 
     this ensures the browser renders it exactly as they typed it! */
  white-space: pre-wrap;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `<br>` tags to format poems or code

**The mistake:** Trying to format a poem in HTML by putting a `<br>` tag at the end of every single line, and using `&nbsp;` (non-breaking space) entities to create indentations.

**Why it's wrong:** That creates incredibly messy, unreadable HTML. Instead, just write the poem exactly how it looks in the HTML editor, and apply `white-space: pre;` in CSS. The browser will respect your exact formatting.

---



### Mistake 2: Confusing `white-space: pre` (No Line Wrapping) with `white-space: pre-wrap` (Preserves Newlines + Line Wraps)

**The mistake:** Using `white-space: pre` for multi-line user comment text.

**Why it's wrong:** `white-space: pre` preserves spaces and newlines BUT prevents line wrapping, causing long lines of user text to spill out horizontally past screen boundaries. Use `white-space: pre-wrap`.

*Incorrect:*
```css
.comment { white-space: pre; } /* ❌ Prevents line wrapping, causing horizontal spill! */
```

*Fix:*
```css
.comment { white-space: pre-wrap; } /* Preserves newlines AND wraps lines */
```

### Mistake 3: Using `white-space: nowrap` Without Setting Container Overflow Constraints

**The mistake:** Adding `white-space: nowrap` to a button inside a 100px parent box without overflow handling.

**Why it's wrong:** `nowrap` forces all text onto a single horizontal line. If text is longer than the parent container, it breaks out of the box boundaries.

*Incorrect:*
```css
.box { width: 100px; white-space: nowrap; } /* ❌ Spills text past 100px! */
```

*Fix:*
```css
.box {
  width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

## 6. Practice Exercises

### Exercise 1: The Infinite Line

**Problem:** You apply `white-space: nowrap;` to a very long paragraph inside a 300px wide box. What happens to the text?

**Expected output:**
> [!check]- Answer
> ```text
> The text refuses to wrap to a second line. It will blast straight through the right wall of the 300px box and keep going horizontally, forcing the user to scroll sideways to read it.
> ```
> - Does `nowrap` respect the width of the container?

---



### Exercise 2: Preserving User Textarea Newlines

**Problem:** Write CSS rule preserving user line breaks and spaces entered into `<textarea>` when rendered on page `.user-bio`.

**Expected output:**
> [!check]- Answer
> ```text
> .user-bio { white-space: pre-wrap; }
> ```
> ```css
> .user-bio {
>   white-space: pre-wrap;
> }
> ```
>
> **Explanation:** `white-space: pre-wrap` preserves source newlines while allowing normal line wrapping.

---

### Exercise 3: White Space Property Matrix

**Problem:** Match `white-space` value to behavior:
1. `normal` 
2. `nowrap` 
3. `pre` 
4. `pre-wrap` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Collapses whitespace, wraps lines (default)
> 2. Collapses whitespace, suppresses line wrapping
> 3. Preserves whitespace, suppresses line wrapping
> 4. Preserves whitespace, allows line wrapping
> ```
> ```text
> 1. normal -> Collapses spaces, wraps text (default)
> 2. nowrap -> Collapses spaces, no line wrapping
> 3. pre -> Preserves spaces/newlines, no line wrapping
> 4. pre-wrap -> Preserves spaces/newlines, allows line wrapping
> ```
>
> **Explanation:** `white-space` dictates whitespace collapsing and line wrapping rules.

## 7. Related Terms
- [`text-overflow` & `overflow-wrap`](text_overflow.md) — When you use `nowrap` and the text blows out of the box, `text-overflow` allows you to cut it off with a "..." (ellipsis).
---

## 8. Key Takeaways
- HTML collapses whitespace by default. `white-space` allows CSS to override that.
- `nowrap` forces text to stay on a single line, even if it breaks the layout.
- `pre-wrap` is the best way to safely render user-submitted text (like comments) that contain deliberate line breaks and spacing.
