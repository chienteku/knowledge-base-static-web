# `white-space`

> **Level 7 — Text & List Formatting**
> The property that dictates how the browser handles "whitespace" (spaces, tabs, and enter-key line breaks) inside your HTML code.

---

## 1. Prerequisites
- [Whitespace Collapse](../../../01-html/terms/level_01/whitespace_collapse.md) — You must understand the browser's default behavior of crushing all spaces into a single space!

---

## 2. Term Category

**Typography / Formatting Property (Universal Browser Support)**: `white-space` is a fundamental concept in this technology stack. **Level 7 — Text & List Formatting**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Preserving Code Formatting with white-space: pre-wrap

**Scenario:** An author preserves indentation and line breaks inside a user code block using `white-space: pre-wrap`.

**Requirements:**
1. Apply `white-space: pre-wrap` to `<pre>` or `<code>`.
2. Ensure text wraps long lines gracefully.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .code-comment-block {
>   font-family: ui-monospace, SFMono-Regular, monospace;
>   font-size: 0.875rem;
>   white-space: pre-wrap;        /* Preserves newlines and spaces, BUT wraps long lines to fit container! */
>   word-break: break-word;
>   background-color: #0f172a;
>   color: #f8fafc;
>   padding: 1rem;
>   border-radius: 0.375rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `white-space` Property**: Controls how browser layout engines handle whitespace sequences and line breaks inside an element.
> 2. **`white-space: pre-wrap`**: Preserves all HTML spaces and newline breaks (like `<pre>`), while allowing long lines to wrap onto new lines to fit container boundaries.
> 3. **`pre` vs `pre-wrap`**: Standard `white-space: pre` does NOT wrap text, causing long lines to overflow container bounds horizontally.
> 
---

### Exercise 2: Preventing Button Text Wrapping with white-space: nowrap

**Scenario:** Prevents call-to-action button labels from wrapping onto two lines on narrow mobile screens.

**Requirements:**
1. Apply `white-space: nowrap` to `.btn-nowrap`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .btn-nowrap {
>   display: inline-flex;
>   align-items: center;
>   white-space: nowrap;          /* Forces button label text to stay on a single line */
>   padding: 0.75rem 1.5rem;
>   background-color: #2563eb;
>   color: #ffffff;
>   border-radius: 0.375rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **`white-space: nowrap`**: Collapses sequences of whitespace into a single space and suppresses all automatic line breaks.
> 2. **Button Protection**: Guarantees action button labels never split awkwardly into 2 wrapped lines on mobile displays.
> 3. **Flex Item Protection**: Prevents flex items from wrapping text inside horizontal scroll bars.
> 
---

### Exercise 3: Handling Dynamic Chat Messages with white-space: break-spaces

**Scenario:** Preserves user spaces and forces breaks on long URLs in chat message bubbles using `white-space: break-spaces`.

**Requirements:**
1. Apply `white-space: break-spaces` to `.chat-bubble`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .chat-bubble {
>   white-space: break-spaces;    /* Preserves spaces, wraps lines, AND breaks trailing whitespace */
>   word-break: break-word;
>   padding: 0.75rem 1rem;
>   background-color: #f1f5f9;
>   border-radius: 1rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **`white-space: break-spaces`**: Modern property value that behaves like `pre-wrap`, but additionally forces trailing spaces to wrap and occupy layout space.
> 2. **User Content Preservation**: Preserves custom user text formatting in comments, chat applications, and forum posts.
> 3. **Layout Shift Prevention**: Prevents trailing space sequences from overflowing chat bubbles.
## 6. Related Terms
- [`text-overflow` & `overflow-wrap`](text_overflow.md) — When you use `nowrap` and the text blows out of the box, `text-overflow` allows you to cut it off with a "..." (ellipsis).

---

## 7. Key Takeaways
- HTML collapses whitespace by default. `white-space` allows CSS to override that.
- `nowrap` forces text to stay on a single line, even if it breaks the layout.
- `pre-wrap` is the best way to safely render user-submitted text (like comments) that contain deliberate line breaks and spacing.
