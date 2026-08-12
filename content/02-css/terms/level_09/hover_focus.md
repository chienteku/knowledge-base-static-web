# `:hover` & `:focus` (Pseudo-classes)

> **Level 9 — Visual Effects & State**
> Selectors that target an element only when it is in a specific interactive state (like being hovered by a mouse or selected by a keyboard).

---

## 1. Prerequisites
- [Selectors (Element, Class, ID)](../level_01/selectors.md) — These are special attachments you add to normal selectors.
- [`outline`](outline.md) — The property most commonly tied to the `:focus` state.

---

## 2. Term Category

**CSS Pseudo-class (Universal Modern Standard .)**: `:hover` & `:focus` (Pseudo-classes) is a fundamental concept in this technology stack. **Level 9 — Visual Effects & State**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Accessible Focus Ring Styles using :focus-visible without Mouse Ring Pollution

**Scenario:** An author implements accessible focus rings using `:focus-visible` to show focus indicators ONLY for keyboard navigation users.

**Requirements:**
1. Remove default outline on `:focus`.
2. Apply high-contrast `outline: 3px solid #2563eb` on `:focus-visible`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> /* Remove default browser focus outline ONLY when focus-visible is supported */
> .btn-action:focus {
>   outline: none;
> }
>
> /* Keyboard Focus Ring: Appears ONLY when user navigates via Tab key! */
> .btn-action:focus-visible {
>   outline: 3px solid #2563eb;
>   outline-offset: 2px;
> }
>
> /* Mouse Hover Accent */
> .btn-action:hover {
>   background-color: #1d4ed8;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `:focus-visible` Pseudo-Class**: Applies focus styles ONLY when the browser determines focus was initiated via keyboard navigation (Tab key).
> 2. **Eliminating Mouse Focus Rings**: Prevents ugly focus rings from appearing on mouse clicks, keeping visual designs clean for mouse users.
> 3. **WCAG 2.1 SC 2.4.7 (Focus Visible)**: Mandatory accessibility pseudo-class; NEVER set `outline: none` without providing a `:focus-visible` replacement!
> 
---

### Exercise 2: Smooth Hover Elevation Transitions on Interactive Cards

**Scenario:** Styles interactive card elevation lift effects on `:hover`.

**Requirements:**
1. Apply `transform: translateY(-4px)` and `box-shadow` on `:hover`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .interactive-card {
>   background-color: #ffffff;
>   border: 1px solid #e2e8f0;
>   border-radius: 0.5rem;
>   padding: 1.5rem;
>   transition: transform 0.2s ease, box-shadow 0.2s ease;
> }
>
> .interactive-card:hover {
>   transform: translateY(-0.25rem);
>   box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `:hover` Pseudo-Class**: Triggers styles when a mouse pointer hovers over an interactive element.
> 2. **Tactile Lift Feedback**: Combining subtle negative Y translation (`translateY(-0.25rem)`) with elevated shadow reinforces interactivity.
> 3. **Transition Requirement**: Always pair `:hover` state changes with CSS `transition` for smooth animations.
> 
---

### Exercise 3: Combining Hover and Focus States for Parity Compliance

**Scenario:** Combines `:hover` and `:focus-visible` rules to ensure keyboard users receive identical interactive feedback.

**Requirements:**
1. Apply shared selector `.btn-nav:hover, .btn-nav:focus-visible`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .btn-nav {
>   color: #475569;
>   text-decoration: none;
>   transition: color 0.15s ease;
> }
>
> .btn-nav:hover,
> .btn-nav:focus-visible {
>   color: #2563eb;               /* Identical visual feedback for mouse AND keyboard users */
>   text-decoration: underline;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Interaction Parity**: Guarantees keyboard users receive the exact same visual cues as mouse hover users.
> 2. **Keyboard Focus Accessibility**: Helps motor-impaired and keyboard-only users navigate interface lists.
> 3. **Clean Shared Selectors**: Reduces stylesheet duplication by grouping `:hover` and `:focus-visible`.
## 6. Related Terms
- [`transition`](../level_10/transition.md) — Making state adjustments smooth and animated.
- [`cursor`](cursor.md) — Changing pointer graphics on hover states.
- [`::before` & `::after` (Pseudo-elements)](pseudo_elements.md) — Double-colon structural selectors.
- [`outline`](outline.md) — Related concept: `outline`.
- [Advanced Pseudo-classes](pseudo_classes_advanced.md) — Related concept: Advanced Pseudo-classes.

---

## 7. Key Takeaways
- Pseudo-classes (starting with `:`) style elements based on their current state.
- `:hover` triggers when the mouse pointer is over the element. (Does not work on Mobile!).
- `:focus` triggers when the element is actively selected (clicked on or tabbed to).
- Never put a space between the selector and the colon!
