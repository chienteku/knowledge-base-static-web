# `:hover` & `:focus` (Pseudo-classes)

> **Level 9 — Visual Effects & State**
> Selectors that target an element only when it is in a specific interactive state (like being hovered by a mouse or selected by a keyboard).

---

## 1. Prerequisites
- [Selectors (Element, Class, ID)](../level_01/selectors.md) — These are special attachments you add to normal selectors.
- [`outline`](outline.md) — The property most commonly tied to the `:focus` state.
---

## 2. Term Category
- **CSS Pseudo-class**

---

## 3. Environment Context
- **Universal Modern Standard** (The foundation of interactive UI).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
A website shouldn't feel like a static painting; it should respond to the user. When a user points their mouse at a button, the button should react (maybe turning a darker color) to confirm, "Yes, I am a button, and you are currently pointing at me."
The W3C created **Pseudo-classes** (keywords starting with a colon `:`) to let developers style an element *only* when it enters a specific state.
- **`:hover`**: Applies CSS only when the user's mouse pointer is physically on top of the element.
- **`:focus`**: Applies CSS only when the element is currently "active" or "selected" (e.g., the user clicked on a text input to start typing, or used the `Tab` key to highlight a button).

### (2) Reality Metaphor
Imagine a motion-sensor light on your driveway. 
By default, the light is off. 
When you walk into the driveway (`:hover`), the light suddenly turns on. 
When you walk away, it instantly turns back off.

### (3) Code Examples

#### The Interactive Button
```css
/* 1. Default State */
.submit-btn {
  background-color: blue;
  color: white;
}

/* 2. Hover State */
/* When the mouse is over the button, override the background color! */
.submit-btn:hover {
  background-color: darkblue; 
}

/* 3. Focus State */
/* When the user clicks the button or tabs to it, add a glowing ring! */
.submit-btn:focus {
  outline: 3px solid lightblue; 
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that Mobile Phones don't have mice

**The mistake:** Building a website where a critical menu *only* appears when you `:hover` over a specific button.

**Why it's wrong:** Touchscreens cannot "hover". A tap on a touchscreen registers as a Click, not a Hover. If you hide critical functionality behind a `:hover` state, mobile users will literally never be able to access it. 
**Golden Rule:** `:hover` should only be used for visual *enhancements* (like changing colors), NEVER for hiding/showing critical functionality.

### Mistake 2: The Space Typo

**The mistake:** Writing `.submit-btn :hover { ... }` (with a space before the colon).

**Why it's wrong:** In CSS, a space means "target the child inside." By adding a space, you are telling the browser: "Find the `.submit-btn`, and then look for a child element inside it that is being hovered." That's not what you want! The colon must be physically attached to the class name: `.submit-btn:hover`.

---



### Mistake 3: Providing `:hover` Styles Without Corresponding Keyboard `:focus` Styles (Accessibility Failure)

**The mistake:** Writing `button:hover { background: blue; }` without defining `:focus` or `:focus-visible`.

**Why it's wrong:** Keyboard users navigating with the Tab key cannot see mouse hover states. Always pair `:hover` styles with `:focus` / `:focus-visible` styles.

*Incorrect:*
```css
a:hover { color: red; } /* ❌ Keyboard Tab users receive no focus indicator! */
```

*Fix:*
```css
a:hover,
a:focus-visible {
  color: red;
  outline: 2px solid red; /* Accessible focus indicator */
}
```

### Mistake 4: Removing Focus Outlines (`outline: none`) Without Providing Custom Focus Ring Replacements

**The mistake:** Adding `*:focus { outline: none; }` in CSS.

**Why it's wrong:** Stripping focus rings renders web pages unusable for keyboard-only users. Use `:focus-visible` to style focus outlines exclusively for keyboard interactions.

*Incorrect:*
```css
button:focus { outline: none; } /* ❌ Destroys accessibility focus rings */
```

*Fix:*
```css
button:focus-visible {
  outline: 3px solid #005fcc;
  outline-offset: 2px;
}
```

## 6. Practice Exercises

### Exercise 1: The Active Input

**Problem:** You have a text `<input>` field. When the user clicks into the field to start typing, you want the background to turn light yellow. Which pseudo-class do you use?

**Expected output:**
> [!check]- Answer
> ```text
> `:focus`! 
> `input:focus { background-color: lightyellow; }`
> When they click away (losing focus), it will revert to white.
> ```
> - Is the user just moving their mouse over it, or are they actively interacting with it?

---



### Exercise 2: Accessible Focus-Visible Pattern

**Problem:** Write CSS applying custom 3px solid blue focus ring with 2px offset ONLY when focused via keyboard (`:focus-visible`).

**Expected output:**
> [!check]- Answer
> ```text
> button:focus-visible { outline: 3px solid blue; outline-offset: 2px; }
> ```
> ```css
> button:focus-visible {
>   outline: 3px solid blue;
>   outline-offset: 2px;
> }
> ```
>
> **Explanation:** `:focus-visible` triggers focus outlines for keyboard navigation while suppressing them on mouse clicks.

---

### Exercise 3: Hover Touch Screen Caveat

**Problem:** Why can `:hover` styles cause sticky hover bugs on mobile touchscreen devices?

**Expected output:**
> [!check]- Answer
> ```text
> Mobile touchscreens tap triggers hover state and retains it until user taps another element.
> ```
> ```css
> @media (hover: hover) {
>   button:hover { background: blue; } /* Applies hover only on devices supporting true mouse hover */
> }
> ```
>
> **Explanation:** `@media (hover: hover)` prevents sticky hover states on mobile touchscreens.

## 7. Related Terms
- [`transition`](../level_10/transition.md) — Making state adjustments smooth and animated.
- [`cursor`](cursor.md) — Changing pointer graphics on hover states.
- [`::before` & `::after` (Pseudo-elements)](pseudo_elements.md) — Double-colon structural selectors.
- [`outline`](outline.md) — Related concept: `outline`.
- [Advanced Pseudo-classes](pseudo_classes_advanced.md) — Related concept: Advanced Pseudo-classes.
---

## 8. Key Takeaways
- Pseudo-classes (starting with `:`) style elements based on their current state.
- `:hover` triggers when the mouse pointer is over the element. (Does not work on Mobile!).
- `:focus` triggers when the element is actively selected (clicked on or tabbed to).
- Never put a space between the selector and the colon!
