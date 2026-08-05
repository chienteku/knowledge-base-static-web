# `cursor`

> **Level 9 — Visual Effects & State**
> The property that changes the icon of the user's mouse pointer when they hover over an element.

---

## 1. Prerequisites
None (Entry-level term)
---

## 2. Term Category
- **UI/UX / Aesthetic Property**

---

## 3. Environment Context
- **Universal Modern Standard** (Essential for signaling interactivity to desktop users).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
On a touchscreen phone, you can tap anywhere, so mice don't matter. But on a desktop computer, the mouse pointer is the user's only connection to the website. 
By default, the browser changes the mouse to a "Pointer" (the little white hand) when hovering over `<a>` links, but it leaves the mouse as a normal arrow for almost everything else, *including custom `<button>` elements*! 
If a user hovers over a custom button, and their mouse doesn't change into the clicking hand, their brain subconsciously thinks, "This isn't clickable." The W3C created the **`cursor`** property to allow developers to manually change the mouse icon to signal interactivity.

### (2) The Core Values
There are dozens of cursor values, but you will only ever use these three 99% of the time:
- **`pointer`**: The little white pointing hand (Used for Buttons and clickable Cards).
- **`not-allowed`**: The red circle with a slash through it (Used for disabled buttons or locked features).
- **`default`**: Forces the normal black/white arrow.

### (3) Reality Metaphor
Imagine walking up to a door. 
If the door has a round doorknob (`pointer`), your brain instantly knows you can twist it. 
If the door is a flat piece of wood with a "Do Not Enter" sign (`not-allowed`), your brain knows you cannot interact with it.

### (4) Code Examples

#### Fixing Custom Buttons
```css
.my-custom-button {
  background-color: blue;
  color: white;
  padding: 10px 20px;
  
  /* CRITICAL: Tells the user they can click this! */
  cursor: pointer; 
}
```

#### The Locked Feature
```css
.premium-feature-card {
  opacity: 0.5;
  
  /* Tells a free-tier user that clicking this will do nothing */
  cursor: not-allowed; 
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting it on clickable `<div>` elements

**The mistake:** Building an entire "User Profile Card" out of a `<div>`, using JavaScript to make the card clickable so it takes you to their profile, but forgetting to add `cursor: pointer;`.

**Why it's wrong:** The browser doesn't know your JavaScript makes the `<div>` clickable. When the user hovers over the card, their mouse stays as a normal arrow. Millions of users will never click the card because their subconscious brain tells them it's just a static picture, not a link. 
**Golden Rule:** If clicking an element triggers an action, it MUST have `cursor: pointer;` applied!

---



### Mistake 2: Using `cursor: pointer` on Non-Interactive Text Elements

**The mistake:** Adding `cursor: pointer` to standard `<p>` or `<div>` text boxes.

**Why it's wrong:** `cursor: pointer` signals to users that an element is CLICKABLE (link or button). Adding pointer cursors to static text confuses users expecting interactive behavior.

*Incorrect:*
```css
p.text { cursor: pointer; } /* ❌ Misleads users into thinking static text is a link! */
```

*Fix:*
```css
/* Reserve cursor: pointer strictly for buttons, links, and interactive controls */
```

### Mistake 3: Forgetting `cursor: not-allowed` on Disabled Buttons

**The mistake:** Disabling a button (`disabled`) without setting `cursor: not-allowed` in CSS.

**Why it's wrong:** Providing visual feedback (`cursor: not-allowed`) immediately informs users that a disabled control cannot be activated.

*Incorrect:*
```css
button:disabled { opacity: 0.5; } /* Missing clear disabled cursor feedback */
```

*Fix:*
```css
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## 6. Practice Exercises

### Exercise 1: The Text Cursor

**Problem:** When you hover over a normal paragraph of text (`<p>`), the mouse changes from an arrow into a vertical line that looks like a capital "I". What is the name of this cursor value?

**Expected output:**
> [!check]- Answer
> ```text
> It's called `text`. You can apply `cursor: text;` to inputs or custom elements to signal to the user that they can click and start typing!
> ```
> - What do you call letters and words?

---



### Exercise 2: Cursor Property Keyword Matrix

**Problem:** Match task to CSS `cursor` keyword:
1. Clickable button (`pointer`)
2. Text editing selection (`text`)
3. Dragging handle (`grab`)
4. Disabled element (`not-allowed`)

**Expected output:**
> [!check]- Answer
> ```text
> 1. pointer
> 2. text
> 3. grab
> 4. not-allowed
> ```
> ```text
> 1. pointer
> 2. text
> 3. grab
> 4. not-allowed
> ```
>
> **Explanation:** `cursor` values provide affordance cues for mouse interactions.

---

### Exercise 3: Custom Image Cursor Syntax

**Problem:** Write CSS `cursor` property using custom image `pointer.png` with `auto` fallback.

**Expected output:**
> [!check]- Answer
> ```text
> cursor: url('pointer.png'), auto;
> ```
> ```css
> .custom-cursor {
>   cursor: url('pointer.png'), auto;
> }
> ```
>
> **Explanation:** Custom cursor images require fallback generic keywords (e.g. `auto`).

## 7. Related Terms
- [`:hover` & `:focus` (Pseudo-classes)](hover_focus.md) — Changing the cursor is almost always paired with changing the styling properties on `:hover`.
- [`outline`](outline.md) — Visual ring for keyboard selection focuses.
---

## 8. Key Takeaways
- `cursor` changes the mouse icon.
- It is absolutely essential for UX (User Experience).
- ALWAYS add `cursor: pointer;` to custom buttons and clickable cards!
- Use `cursor: not-allowed;` on disabled elements.
