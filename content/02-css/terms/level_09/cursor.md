# `cursor`

> **Level 9 — Visual Effects & State**
> The property that changes the icon of the user's mouse pointer when they hover over an element.

---

## 1. Prerequisites
- None!

---

## 2. Term Category

**UI/UX / Aesthetic Property (Universal Modern Standard .)**: `cursor` is a fundamental concept in this technology stack. **Level 9 — Visual Effects & State**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Customizing Pointer Affordance on Interactive Buttons

**Scenario:** An author explicitly enforces interactive pointer cursors (`cursor: pointer`) on custom button components.

**Requirements:**
1. Apply `cursor: pointer` to interactive buttons.
2. Set `user-select: none`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .interactive-btn {
>   display: inline-flex;
>   align-items: center;
>   padding: 0.75rem 1.5rem;
>   background-color: #2563eb;
>   color: #ffffff;
>   cursor: pointer;              /* Changes cursor to pointing hand icon */
>   user-select: none;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `cursor` Property**: Specifies the mouse cursor visual indicator shown when hovering over an element.
> 2. **Interactive Affordance (`pointer`)**: Renders a pointing hand icon (`pointer`), signaling to desktop users that an element is clickable.
> 3. **Default Element Behavior**: Native `<button>` and `<a>` elements display pointer cursors, but custom `<div role="button">` elements require explicit `cursor: pointer`.
> 
---

### Exercise 2: Indicating Disabled UI Controls with cursor: not-allowed

**Scenario:** Styles disabled buttons and input fields using `cursor: not-allowed`.

**Requirements:**
1. Apply `cursor: not-allowed` and `opacity: 0.5` to `:disabled` controls.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .interactive-btn:disabled,
> .interactive-btn[aria-disabled="true"] {
>   opacity: 0.5;
>   cursor: not-allowed;          /* Renders circle-with-slash prohibition icon */
>   pointer-events: none;         /* Blocks click interactions */
> }
> ```
>
> #### Technical Explanation
>
> 1. **`cursor: not-allowed`**: Displays a circle-with-slash icon, providing immediate visual feedback that an action is disabled.
> 2. **`pointer-events: none` Integration**: Pairing with `pointer-events: none` prevents JavaScript click handlers from firing on disabled buttons.
> 3. **Accessible Disabled States**: Supports both native `:disabled` and ARIA `[aria-disabled="true"]` attributes.
> 
---

### Exercise 3: Draggable Container Handles with cursor: grab and grabbing

**Scenario:** Styles drag-and-drop handles using `cursor: grab` and `cursor: grabbing`.

**Requirements:**
1. Apply `cursor: grab` on rest state.
2. Apply `cursor: grabbing` on `:active` state.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .drag-handle {
>   cursor: grab;                 /* Open hand icon indicating element can be dragged */
> }
>
> .drag-handle:active {
>   cursor: grabbing;             /* Closed fist icon indicating active dragging */
> }
> ```
>
> #### Technical Explanation
>
> 1. **`cursor: grab` Mechanics**: Displays an open hand icon for drag-and-drop items (kanban cards, reorderable list items).
> 2. **`:active` State Flip (`grabbing`)**: Flipping to `cursor: grabbing` on mouse click (`:active`) provides tactile drag feedback.
> 3. **Enhanced Desktop UX**: Significantly improves usability for interactive dashboard widgets.
## 6. Related Terms
- [`:hover` & `:focus` (Pseudo-classes)](hover_focus.md) — Changing the cursor is almost always paired with changing the styling properties on `:hover`.
- [`outline`](outline.md) — Visual ring for keyboard selection focuses.

---

## 7. Key Takeaways
- `cursor` changes the mouse icon.
- It is absolutely essential for UX (User Experience).
- ALWAYS add `cursor: pointer;` to custom buttons and clickable cards!
- Use `cursor: not-allowed;` on disabled elements.
