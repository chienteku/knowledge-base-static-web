# `text-overflow` & `overflow-wrap`

> **Level 7 — Text & List Formatting**
> Properties used to control what happens when a word is too long to fit inside its container.

---

## 1. Prerequisites
- [`white-space`](white_space.md) — `text-overflow` relies entirely on `white-space: nowrap` to work!

---

## 2. Term Category
- **Typography / Overflow Property**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Long URL

**Problem:** You are displaying a very long URL (`https://www.example.com/very/long/path/that/goes/on/forever`) inside a narrow mobile screen. You want the user to be able to read the entire URL by scrolling down, but you don't want the URL to blast out the right side of the screen. Which property do you use?

**Expected output:**
```text
`overflow-wrap: break-word;` 
This will aggressively snap the URL into multiple lines, keeping it safely inside the mobile screen so the user can read the whole thing. If you used `ellipsis`, they wouldn't be able to read the end of the URL.
```

> [!check]- Answer
> - Do you want to cut the stick, or snap it in half?

---



### Exercise 2: Single-Line Ellipsis Truncation Rule

**Problem:** Write CSS rule truncating `.user-name` text with `...` on single line overflow.

**Expected output:**
```text
.user-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
```

> [!check]- Answer
> ```css
> .user-name {
>   white-space: nowrap;
>   overflow: hidden;
>   text-overflow: ellipsis;
> }
> ```
>
> **Explanation:** Single-line ellipsis requires `nowrap`, `hidden` overflow, and `text-overflow: ellipsis`.

### Exercise 3: Multi-Line Truncation Property

**Problem:** Which CSS property combination clamps text to exactly 3 lines with an ellipsis?

**Expected output:**
```text
display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
```

> [!check]- Answer
> ```css
> .clamp-3 {
>   display: -webkit-box;
>   -webkit-line-clamp: 3;
>   -webkit-box-orient: vertical;
>   overflow: hidden;
> }
> ```
>
> **Explanation:** `-webkit-line-clamp` truncates multi-line text blocks after N lines.

## 7. Related Terms
- [`white-space`](white_space.md) — The property that forces the single line required for `ellipsis` to work.

---

## 8. Key Takeaways
- `text-overflow: ellipsis` adds "..." to cut-off text. It requires `white-space: nowrap` and `overflow: hidden` to work.
- `overflow-wrap: break-word` aggressively snaps long, unbroken words (like URLs) into multiple lines to prevent layout blowouts.
