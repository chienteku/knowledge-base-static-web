# `text-overflow` & `overflow-wrap`

> **Level 7 — Text & List Formatting**
> Properties used to control what happens when a word is too long to fit inside its container.

---

## 1. Prerequisites
- [`white-space`](white_space.md) — `text-overflow` relies entirely on `white-space: nowrap` to work!
- [`overflow` (hidden, scroll, auto, visible)](../level_02/overflow.md) — Handling text overflow with text-overflow: ellipsis.

---

## 2. Term Category

**Typography / Overflow Property (Universal Browser Support)**: `text-overflow` & `overflow-wrap` is a fundamental concept in this technology stack. **Level 7 — Text & List Formatting**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Text is unpredictable. Sometimes a user uploads a file with a ridiculously long name like `my_vacation_photos_from_hawaii_2024.jpg`, and the browser tries to display it inside a tiny 100px wide sidebar. 
By default, the browser will not break the word in half. Instead, the word will blast straight through the wall of the container, overlapping other elements and ruining the layout.
The W3C created two distinct solutions for this problem:
1. **`text-overflow`**: (The Ellipsis trick). Prevent the text from wrapping, cut it off at the wall, and add a "..." to let the user know there is more text.
2. **`overflow-wrap`**: (The Break trick). Force the browser to aggressively snap the long word in half and wrap it to the next line.

### (2) Reality Metaphor
Imagine trying to fit a long wooden broomstick into a small cardboard box.
`text-overflow` is like sawing the broomstick off at the edge of the box and painting the tip red so people know it was cut.
`overflow-wrap` is like snapping the broomstick in half and throwing both pieces into the box.

### (3) Code Examples

#### The Classic "..." (Ellipsis) Truncation
This requires an exact combo of 3 specific properties to work!
```css
.card-title {
  /* 1. Prevent the text from wrapping to a new line */
  white-space: nowrap; 
  /* 2. Hide any text that goes past the edge of the box */
  overflow: hidden;    
  /* 3. Add the "..." to the cut-off point */
  text-overflow: ellipsis; 
}
```

#### The Aggressive Break
```css
.chat-message {
  /* If a user types "Hahahahahahahahahahahahahaha", 
     this will snap the word in half to keep it inside the chat bubble! */
  overflow-wrap: break-word; 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `overflow: hidden` for Ellipsis

**The mistake:** Applying `text-overflow: ellipsis;` to a paragraph and wondering why the "..." isn't showing up.

**Why it's wrong:** The browser only adds the "..." if the text is physically being hidden by the container! If you forget `overflow: hidden`, the text just spills out of the container normally, so the browser thinks, "Well, the user can read the whole word, so I don't need to add an ellipsis."

---



### Mistake 2: Using `text-overflow: ellipsis` Without Setting `overflow: hidden` and `white-space: nowrap`

**The mistake:** Setting `text-overflow: ellipsis` alone on an element expecting text to truncate.

**Why it's wrong:** `text-overflow: ellipsis` functions ONLY when combined with `overflow: hidden` AND `white-space: nowrap`. Omitting either causes text to wrap or overflow without an ellipsis.

*Incorrect:*
```css
.title { text-overflow: ellipsis; } /* ❌ Missing overflow: hidden and white-space: nowrap! */
```

*Fix:*
```css
.title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### Mistake 3: Expecting Single-Line `text-overflow: ellipsis` to Truncate Multi-Line Paragraph Text

**The mistake:** Attempting to truncate a 4-line paragraph using single-line `text-overflow: ellipsis`.

**Why it's wrong:** Standard `text-overflow: ellipsis` works ONLY for single-line text (`white-space: nowrap`). For multi-line truncation, use `-webkit-line-clamp`.

*Incorrect:*
```css
/* Trying to truncate 4-line paragraph with text-overflow: ellipsis */
```

*Fix:*
```css
.multi-line-truncate {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

## 5. Practice Exercises

### Exercise 1: Truncating Overflown Single-Line Titles with text-overflow: ellipsis

**Scenario:** An author truncates overflowing single-line article titles with an ellipsis (`...`) inside a card header.

**Requirements:**
1. Apply `white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis`.
2. Set `max-width: 100%`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .card-title-truncated {
>   white-space: nowrap;          /* Prevents text from wrapping onto a second line */
>   overflow: hidden;             /* Clips text content that exceeds width */
>   text-overflow: ellipsis;     /* Displays '...' at truncation boundary */
>   max-width: 100%;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Single-Line Ellipsis Requirements**: Truncation REQUIRES 3 properties working together: `white-space: nowrap`, `overflow: hidden`, and `text-overflow: ellipsis`.
> 2. **Missing Property Failure**: If `white-space: nowrap` or `overflow: hidden` is omitted, `text-overflow: ellipsis` has NO EFFECT and text will wrap or overflow!
> 3. **Responsive Layout Safety**: Prevents long article titles, email addresses, or URLs from expanding container dimensions on mobile screens.
> 
---

### Exercise 2: Multi-Line Clamp Truncation using -webkit-line-clamp

**Scenario:** Truncates article card preview text to exactly 3 lines using multi-line clamp styling.

**Requirements:**
1. Apply `display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .card-excerpt-clamp {
>   display: -webkit-box;
>   -webkit-line-clamp: 3;        /* Truncates text after exactly 3 lines */
>   -webkit-box-orient: vertical;
>   overflow: hidden;
>   line-height: 1.5;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Multi-Line Truncation (`-webkit-line-clamp`)**: Standard CSS technique for truncating paragraph text after a specified number of lines (e.g. 3 lines).
> 2. **Vendor Prefix Mandate**: Requires `display: -webkit-box` and `-webkit-box-orient: vertical` to function across all modern browsers.
> 3. **Clean Excerpt Cards**: Guarantees article preview cards maintain identical visual heights regardless of raw text length.
> 
---

### Exercise 3: Text Truncation inside Flex and Grid Containers

**Scenario:** Fixes broken text truncation inside flex and grid items by adding `min-width: 0`.

**Requirements:**
1. Apply `min-width: 0` to flex child containing truncated text.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .flex-card-item {
>   flex: 1;
>   min-width: 0;                 /* Overrides default min-width: auto to allow text truncation! */
> }
>
> .flex-card-item .truncated-text {
>   white-space: nowrap;
>   overflow: hidden;
>   text-overflow: ellipsis;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Flex/Grid `min-width: auto` Trap**: Flex items default to `min-width: auto`, which prevents child text from shrinking below its content width, breaking truncation!
> 2. **The `min-width: 0` Fix**: Setting `min-width: 0` on the parent flex item allows child text to shrink and display the ellipsis cleanly.
> 3. **Crucial Layout Rule**: Mandatory fix whenever implementing truncated text inside Flexbox or CSS Grid layouts.
## 6. Related Terms
- [`white-space`](white_space.md) — The property that forces the single line required for `ellipsis` to work.
- [`overflow` (hidden, scroll, auto, visible)](../level_02/overflow.md) — Related concept: `overflow` (hidden, scroll, auto, visible).

---

## 7. Key Takeaways
- `text-overflow: ellipsis` adds "..." to cut-off text. It requires `white-space: nowrap` and `overflow: hidden` to work.
- `overflow-wrap: break-word` aggressively snaps long, unbroken words (like URLs) into multiple lines to prevent layout blowouts.
